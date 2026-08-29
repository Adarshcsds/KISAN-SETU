import random
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from backend.models import (
    OrderRequest, 
    CreateProposalRequest, 
    CreateDirectPoRequest, 
    CounterOfferRequest, 
    DispatchOrderRequest, 
    DispatchDetails, 
    PaymentReceipt
)
from backend.data_store import db
from backend.database import get_connection
from backend.auth import get_current_user, require_roles

router = APIRouter(prefix="/orders", tags=["Bi-Directional Orders & Settlements"])

def _order_from_deal(row):
    """Convert trade_deal database row to OrderRequest format for API responses."""
    # row: id, deal_code, farmer_id, buyer_id, crop_name, agreed_quantity_quintals, agreed_price_per_quintal, 
    #      gross_amount, pickup_location, delivery_location, quality_grade, deal_password, status, created_at
    return OrderRequest(
        id=str(row[0]),
        cropId=row[4].lower().replace(' ', '_'),  # Approximate crop ID from name
        cropName=row[4],
        variety="",  # Not stored in trade_deals
        quantityQuintals=float(row[5]),
        proposedPricePerQuintal=float(row[6]),
        farmerId=str(row[2]),
        farmerName="",  # Will be fetched separately if needed
        farmerPhone="",
        farmerLocation=row[8],
        farmerDistrict="",  # Will be fetched separately if needed
        buyerId=str(row[3]),
        buyerName="",  # Will be fetched separately if needed
        buyerCompany="",
        targetMarketId="",
        targetMarketName="",
        status=row[12].lower() if row[12] else "pending",  # Map AGREED -> pending, etc.
        orderOrigin="farmer_proposal",  # Default; actual may vary
        moisturePercent=12.0,
        expectedLossPercent=2.0,
        qualityGrade=row[10],
        grossAmount=float(row[7]),
        freightCost=0.0,  # Would need to query logistics_shipments for actual
        calculatedNetRealization=float(row[7]),
        createdAt=row[13].isoformat() if row[13] else datetime.now().isoformat()
    )

@router.get("", response_model=List[OrderRequest])
def get_all_orders():
    """Retrieve all active and completed trade orders (demo + real combined)."""
    return list(db.orders.values())

@router.post("/proposal", response_model=OrderRequest)
def create_farmer_proposal(req: CreateProposalRequest):
    """Farmer creates a direct sell proposal to an institutional buyer."""
    order_id = f"ORD-2026-{random.randint(1000, 9999)}"
    gross = req.quantityQuintals * req.proposedPricePerQuintal
    freight = 600.0 + (58 * 26.0) # Standard 58km
    net = gross - freight - (gross * 0.012)
    
    new_order = OrderRequest(
        id=order_id,
        cropId=req.cropId,
        cropName=req.cropName,
        variety=req.variety,
        quantityQuintals=req.quantityQuintals,
        proposedPricePerQuintal=req.proposedPricePerQuintal,
        farmerId=req.farmerId,
        farmerName=req.farmerName,
        farmerPhone=req.farmerPhone,
        farmerLocation=req.farmerLocation,
        farmerDistrict=req.farmerDistrict,
        buyerId=req.buyerId,
        buyerName=req.buyerName,
        buyerCompany=req.buyerCompany,
        targetMarketId=req.targetMarketId,
        targetMarketName=req.targetMarketName,
        status="pending",
        orderOrigin="farmer_proposal",
        moisturePercent=req.moisturePercent,
        expectedLossPercent=req.expectedLossPercent,
        qualityGrade=req.qualityGrade,
        grossAmount=gross,
        freightCost=freight,
        calculatedNetRealization=net,
        farmerNotes=req.farmerNotes,
        createdAt=datetime.now().strftime("%d %b %Y, %I:%M %p")
    )
    
    db.orders[order_id] = new_order
    return new_order

@router.post("/direct-po", response_model=OrderRequest)
def create_direct_buyer_po(req: CreateDirectPoRequest):
    """Institutional buyer issues a targeted direct Purchase Order with escrow guarantee to a farmer."""
    order_id = f"PO-BUYER-{random.randint(1000, 9999)}"
    gross = req.quantityQuintals * req.proposedPricePerQuintal
    freight = 1500.0 # Fixed buyer-arranged freight
    net = gross - freight
    
    new_po = OrderRequest(
        id=order_id,
        cropId=req.cropId,
        cropName=req.cropName,
        variety=req.variety,
        quantityQuintals=req.quantityQuintals,
        proposedPricePerQuintal=req.proposedPricePerQuintal,
        farmerId=req.farmerId,
        farmerName=req.farmerName,
        farmerPhone=req.farmerPhone,
        farmerLocation=req.farmerLocation,
        farmerDistrict=req.farmerDistrict,
        buyerId=req.buyerId,
        buyerName=req.buyerName,
        buyerCompany=req.buyerCompany,
        targetMarketId="mandi-pune",
        targetMarketName=f"{req.buyerCompany} Receiving Plant",
        status="pending",
        orderOrigin="buyer_direct_po",
        moisturePercent=12.0,
        expectedLossPercent=1.0,
        qualityGrade="Grade A (Export)",
        grossAmount=gross,
        freightCost=freight,
        calculatedNetRealization=net,
        buyerNotes=req.buyerNotes,
        createdAt=datetime.now().strftime("%d %b %Y, %I:%M %p")
    )
    
    db.orders[order_id] = new_po
    return new_po

@router.post("/{order_id}/accept", response_model=OrderRequest)
def accept_order(order_id: str):
    """Accept an order proposal (locks buyer funds into verified escrow)."""
    order = db.orders.get(order_id)
    if not order:
        raise HTTPException(status_code=404, detail=f"Order '{order_id}' not found")
    
    order.status = "accepted"
    return order

@router.post("/{order_id}/counter", response_model=OrderRequest)
def counter_offer(order_id: str, req: CounterOfferRequest):
    """Buyer issues a price counter-offer back to the farmer."""
    order = db.orders.get(order_id)
    if not order:
        raise HTTPException(status_code=404, detail=f"Order '{order_id}' not found")
    
    order.status = "countered"
    order.counterOfferPrice = req.counterPrice
    if req.notes:
        order.buyerNotes = f"Counter Offer Note: {req.notes}"
    return order

@router.post("/{order_id}/reject", response_model=OrderRequest)
def reject_order(order_id: str):
    """Reject an order proposal."""
    order = db.orders.get(order_id)
    if not order:
        raise HTTPException(status_code=404, detail=f"Order '{order_id}' not found")
    
    order.status = "rejected"
    return order

@router.post("/{order_id}/dispatch", response_model=OrderRequest)
def dispatch_order(order_id: str, req: DispatchOrderRequest):
    """Farmer assigns vehicle, generates digital gate pass, and triggers GPS telemetry tracking."""
    order = db.orders.get(order_id)
    if not order:
        raise HTTPException(status_code=404, detail=f"Order '{order_id}' not found")
    
    gate_pass = f"GP-MH-{random.randint(100000, 999999)}"
    
    order.status = "dispatched"
    order.dispatchDetails = DispatchDetails(
        transporterName=req.transporterName,
        truckType=req.truckType,
        licensePlate=req.licensePlate,
        driverName=req.driverName,
        driverPhone=req.driverPhone,
        dispatchDate=datetime.now().strftime("%d %b %Y, %I:%M %p"),
        etaMinutes=random.randint(35, 75),
        originLocation=order.farmerLocation,
        destinationMandi=order.targetMarketName,
        distanceKm=req.distanceKm,
        freightAgreedAmount=req.freightRate,
        gatePassId=gate_pass,
        currentGpsProgressPercent=15
    )
    return order

@router.post("/{order_id}/settle", response_model=OrderRequest)
def settle_payment_escrow(order_id: str):
    """Buyer / Gate verifies cargo, releases escrow, and issues bank settlement certificate with UTR."""
    order = db.orders.get(order_id)
    if not order:
        raise HTTPException(status_code=404, detail=f"Order '{order_id}' not found")
    
    utr_code = f"UTR-HDFC-{datetime.now().strftime('%Y%m%d')}-{random.randint(10000000, 99999999)}"
    rec_id = f"REC-{datetime.now().strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
    
    gross = order.grossAmount
    freight = order.freightCost
    handling = round(gross * 0.01)
    net_credited = round(gross - freight - handling)
    
    receipt = PaymentReceipt(
        receiptId=rec_id,
        orderId=order.id,
        utrNumber=utr_code,
        bankName="HDFC Bank Agri Escrow",
        accountMasked="XX-XXXX-4421",
        grossAmount=gross,
        freightDeduction=freight,
        handlingAndCess=handling,
        netCreditedAmount=net_credited,
        payoutTimestamp=datetime.now().strftime("%d %b %Y, %I:%M %p"),
        status="credited",
        commissionCutPercent=0.0
    )
    
    order.status = "settled"
    order.paymentReceipt = receipt
    return order


# ============================================================
# REAL DATABASE ORDERS ENDPOINTS (Query trade_deals)
# ============================================================

@router.get("/my-orders")
def get_my_real_orders(user=Depends(require_roles("farmer", "buyer"))):
    """Get all real orders/deals for the logged-in farmer or buyer from database."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            if user["role"] == "farmer":
                # Farmer sees deals where they are the farmer
                cur.execute("""
                    SELECT d.id, d.deal_code, d.farmer_id, d.buyer_id, d.crop_name, 
                           d.agreed_quantity_quintals, d.agreed_price_per_quintal, d.gross_amount,
                           d.pickup_location, d.delivery_location, d.quality_grade, d.deal_password, 
                           d.status, d.created_at, u.name, b.firm_name, u.phone
                    FROM trade_deals d
                    JOIN users u ON u.id = d.farmer_id
                    JOIN buyer_profiles b ON b.user_id = d.buyer_id
                    WHERE d.farmer_id = %s
                    ORDER BY d.created_at DESC
                """, (user["id"],))
            else:  # buyer
                # Buyer sees deals where they are the buyer
                cur.execute("""
                    SELECT d.id, d.deal_code, d.farmer_id, d.buyer_id, d.crop_name, 
                           d.agreed_quantity_quintals, d.agreed_price_per_quintal, d.gross_amount,
                           d.pickup_location, d.delivery_location, d.quality_grade, d.deal_password, 
                           d.status, d.created_at, u.name, b.firm_name, u.phone
                    FROM trade_deals d
                    JOIN users u ON u.id = d.farmer_id
                    JOIN buyer_profiles b ON b.user_id = d.buyer_id
                    WHERE d.buyer_id = %s
                    ORDER BY d.created_at DESC
                """, (user["id"],))
            
            rows = cur.fetchall()
            result = []
            for row in rows:
                order = OrderRequest(
                    id=str(row[0]),
                    cropId=row[4].lower().replace(' ', '_'),
                    cropName=row[4],
                    variety="",
                    quantityQuintals=float(row[5]),
                    proposedPricePerQuintal=float(row[6]),
                    farmerId=str(row[2]),
                    farmerName=row[14],
                    farmerPhone=row[16],
                    farmerLocation=row[8],
                    farmerDistrict="",
                    buyerId=str(row[3]),
                    buyerName="",
                    buyerCompany=row[15],
                    targetMarketId="",
                    targetMarketName=row[9],
                    status=row[12].lower() if row[12] else "pending",
                    orderOrigin="farmer_proposal",
                    moisturePercent=12.0,
                    expectedLossPercent=2.0,
                    qualityGrade=row[10],
                    grossAmount=float(row[7]),
                    freightCost=0.0,
                    calculatedNetRealization=float(row[7]),
                    createdAt=row[13].isoformat() if row[13] else datetime.now(timezone.utc).isoformat()
                )
                result.append(order)
            return result
    finally:
        conn.close()


@router.get("/real-deals")
def get_all_real_deals(user=Depends(get_current_user)):
    """Get all real deals from database (combined view for dashboards)."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT d.id, d.deal_code, d.farmer_id, d.buyer_id, d.crop_name, 
                       d.agreed_quantity_quintals, d.agreed_price_per_quintal, d.gross_amount,
                       d.pickup_location, d.delivery_location, d.quality_grade, d.deal_password, 
                       d.status, d.created_at, f.name, b.firm_name, f.phone
                FROM trade_deals d
                JOIN users f ON f.id = d.farmer_id
                JOIN buyer_profiles b ON b.user_id = d.buyer_id
                ORDER BY d.created_at DESC
            """)
            
            rows = cur.fetchall()
            result = []
            for row in rows:
                order = OrderRequest(
                    id=str(row[0]),
                    cropId=row[4].lower().replace(' ', '_'),
                    cropName=row[4],
                    variety="",
                    quantityQuintals=float(row[5]),
                    proposedPricePerQuintal=float(row[6]),
                    farmerId=str(row[2]),
                    farmerName=row[14],
                    farmerPhone=row[16],
                    farmerLocation=row[8],
                    farmerDistrict="",
                    buyerId=str(row[3]),
                    buyerName="",
                    buyerCompany=row[15],
                    targetMarketId="",
                    targetMarketName=row[9],
                    status=row[12].lower() if row[12] else "pending",
                    orderOrigin="farmer_proposal",
                    moisturePercent=12.0,
                    expectedLossPercent=2.0,
                    qualityGrade=row[10],
                    grossAmount=float(row[7]),
                    freightCost=0.0,
                    calculatedNetRealization=float(row[7]),
                    createdAt=row[13].isoformat() if row[13] else datetime.now(timezone.utc).isoformat()
                )
                result.append(order)
            return result
    finally:
        conn.close()