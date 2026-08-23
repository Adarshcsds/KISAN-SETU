import random
from datetime import datetime
from fastapi import APIRouter, HTTPException
from typing import List
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

router = APIRouter(prefix="/orders", tags=["Bi-Directional Orders & Settlements"])

@router.get("", response_model=List[OrderRequest])
def get_all_orders():
    """Retrieve all active and completed trade orders."""
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
