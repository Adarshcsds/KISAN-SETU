import secrets
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from backend.auth import require_roles
from backend.database import get_connection

router = APIRouter(prefix="/logistics", tags=["Logistics Shipments"])


class DispatchDetails(BaseModel):
    transporterName: str = Field(min_length=1, max_length=200)
    truckType: str = Field(min_length=1, max_length=120)
    licensePlate: str = Field(min_length=1, max_length=40)
    driverName: str = Field(min_length=1, max_length=120)
    driverPhone: str = Field(min_length=8, max_length=20)
    distanceKm: float = Field(gt=0)
    freightAmount: float = Field(gt=0)


class VehicleAssignmentDetails(BaseModel):
    vehicleNumber: str = Field(min_length=1, max_length=40)
    vehicleType: str = Field(min_length=1, max_length=120)
    driverName: str = Field(min_length=1, max_length=120)
    driverPhone: str = Field(min_length=8, max_length=20)
    currentLocation: str = Field(min_length=1, max_length=200)
    eta: str = Field(min_length=1, max_length=80)


class LocationUpdate(BaseModel):
    currentLocation: str = Field(min_length=1, max_length=200)
    eta: str | None = Field(default=None, max_length=80)


def _shipment(row):
    return {
        "id": str(row[0]),
        "tradeDealId": str(row[1]),
        "dealCode": row[2],
        "farmerId": str(row[3]),
        "buyerId": str(row[4]),
        "cropName": row[5],
        "quantityQuintals": float(row[6]),
        "pickupLocation": row[7],
        "deliveryLocation": row[8],
        "qualityGrade": row[9],
        "providerId": str(row[10]) if row[10] else None,
        "transporterName": row[11],
        "truckType": row[12],
        "licensePlate": row[13],
        "driverName": row[14],
        "driverPhone": row[15],
        "distanceKm": float(row[16]) if row[16] is not None else None,
        "freightAmount": float(row[17]) if row[17] is not None else None,
        "gatePassId": row[18],
        "status": row[19],
        "currentLocation": row[24],
        "etaText": row[25],
        "createdAt": row[20].isoformat(),
        "updatedAt": row[21].isoformat(),
        "dispatchedAt": row[22].isoformat() if row[22] else None,
        "deliveredAt": row[23].isoformat() if row[23] else None,
    }


SHIPMENT_SELECT = """SELECT s.id,s.trade_deal_id,d.deal_code,d.farmer_id,d.buyer_id,d.crop_name,
 d.agreed_quantity_quintals,d.pickup_location,d.delivery_location,d.quality_grade,s.provider_id,
 s.transporter_name,s.truck_type,s.license_plate,s.driver_name,s.driver_phone,s.distance_km,
 s.freight_amount,s.gate_pass_id,s.status,s.created_at,s.updated_at,s.dispatched_at,s.delivered_at,
 s.current_location,s.eta_text
 FROM logistics_shipments s JOIN trade_deals d ON d.id=s.trade_deal_id"""


def _available_select(cur):
    cur.execute("""SELECT d.id,d.deal_code,d.farmer_id,d.buyer_id,d.crop_name,d.agreed_quantity_quintals,
        d.pickup_location,d.delivery_location,d.quality_grade
                FROM trade_deals d
                WHERE d.status IN ('AGREED','READY_FOR_LOGISTICS')
                    AND NOT EXISTS (
                            SELECT 1 FROM logistics_shipments s
                            WHERE s.trade_deal_id=d.id
                              AND s.status IN ('ACCEPTED','WAITING_BUYER_APPROVAL','LOGISTICS_CONFIRMED','VEHICLE_ASSIGNED','DISPATCHED','IN_TRANSIT','DELIVERED','COMPLETED')
                    )
                ORDER BY d.created_at ASC""")
    return cur.fetchall()


@router.get("/available-deals")
def available_deals(user=Depends(require_roles("logistics"))):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""SELECT d.id,d.deal_code,d.farmer_id,d.buyer_id,d.crop_name,d.agreed_quantity_quintals,
                d.pickup_location,d.delivery_location,d.quality_grade,d.status
                    FROM trade_deals d
                    LEFT JOIN logistics_shipments s ON s.trade_deal_id=d.id
                    WHERE d.status IN ('AGREED','READY_FOR_LOGISTICS')
                        AND (s.id IS NULL OR s.status = 'AVAILABLE')
                    ORDER BY d.created_at ASC""")
            rows = cur.fetchall()
            return [{
                "tradeDealId": str(row[0]),
                "dealCode": row[1],
                "farmerId": str(row[2]),
                "buyerId": str(row[3]),
                "cropName": row[4],
                "quantityQuintals": float(row[5]),
                "pickupLocation": row[6],
                "deliveryLocation": row[7],
                "qualityGrade": row[8],
                "status": "AVAILABLE" if row[9] in ('AGREED','READY_FOR_LOGISTICS') else row[9],
            } for row in rows]
    finally:
        conn.close()


@router.get("/shipments")
def list_shipments(user=Depends(require_roles("logistics"))):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            available = _available_select(cur)
            cur.execute(SHIPMENT_SELECT + " WHERE s.provider_id=%s ORDER BY s.updated_at DESC", (user["id"],))
            assigned = cur.fetchall()
            return [
                {"tradeDealId": str(row[0]), "dealCode": row[1], "farmerId": str(row[2]), "buyerId": str(row[3]),
                 "cropName": row[4], "quantityQuintals": float(row[5]), "pickupLocation": row[6],
                 "deliveryLocation": row[7], "qualityGrade": row[8], "status": "AVAILABLE"}
                for row in available
            ] + [_shipment(row) for row in assigned]
    finally:
        conn.close()


@router.post("/shipments/{deal_id}/accept")
def accept_shipment(deal_id: str, user=Depends(require_roles("logistics"))):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id,status FROM trade_deals WHERE id=%s FOR UPDATE", (deal_id,))
            deal = cur.fetchone()
            if not deal: raise HTTPException(404, "Trade deal not found")
            if deal[1] not in ("AGREED", "READY_FOR_LOGISTICS"):
                raise HTTPException(409, "Only agreed deals can be accepted for transport")
            cur.execute("SELECT id,provider_id,status FROM logistics_shipments WHERE trade_deal_id=%s FOR UPDATE", (deal_id,))
            existing = cur.fetchone()
            if existing:
                if str(existing[1]) == user["id"]:
                    shipment_id = str(existing[0])
                    cur.execute("UPDATE logistics_shipments SET status='WAITING_BUYER_APPROVAL',updated_at=NOW() WHERE id=%s", (shipment_id,))
                else:
                    raise HTTPException(409, "This deal has already been claimed by another logistics provider")
            else:
                shipment_id = str(uuid.uuid4())
                cur.execute("INSERT INTO logistics_shipments (id,trade_deal_id,provider_id,status,updated_at) VALUES (%s,%s,%s,'WAITING_BUYER_APPROVAL',NOW())", (shipment_id, deal_id, user["id"]))
            cur.execute(SHIPMENT_SELECT + " WHERE s.id=%s", (shipment_id,))
            row = cur.fetchone()
        conn.commit()
        return _shipment(row)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def _load_owned_shipment(cur, deal_id, provider_id):
    cur.execute(SHIPMENT_SELECT + " WHERE s.trade_deal_id=%s AND s.provider_id=%s FOR UPDATE", (deal_id, provider_id))
    row = cur.fetchone()
    if not row: raise HTTPException(404, "Shipment not found or not assigned to this provider")
    return row


def _transition(cur, deal_id, provider_id, expected_status, next_status, details=None):
    shipment = _load_owned_shipment(cur, deal_id, provider_id)
    if shipment[19] != expected_status:
        raise HTTPException(409, f"Shipment must be {expected_status} before it can become {next_status}")
    if details:
        cur.execute("""UPDATE logistics_shipments SET transporter_name=%s,truck_type=%s,license_plate=%s,
            driver_name=%s,driver_phone=%s,distance_km=%s,freight_amount=%s,gate_pass_id=%s,
            status=%s,dispatched_at=NOW(),updated_at=NOW() WHERE trade_deal_id=%s AND provider_id=%s""",
            (details.transporterName, details.truckType, details.licensePlate, details.driverName,
             details.driverPhone, details.distanceKm, details.freightAmount,
             f"GP-{secrets.token_hex(6).upper()}", next_status, deal_id, provider_id))
    elif next_status == "DELIVERED":
        cur.execute("UPDATE logistics_shipments SET status=%s,delivered_at=NOW(),updated_at=NOW() WHERE trade_deal_id=%s AND provider_id=%s", (next_status, deal_id, provider_id))
    else:
        cur.execute("UPDATE logistics_shipments SET status=%s,updated_at=NOW() WHERE trade_deal_id=%s AND provider_id=%s", (next_status, deal_id, provider_id))
    cur.execute(SHIPMENT_SELECT + " WHERE s.trade_deal_id=%s AND s.provider_id=%s", (deal_id, provider_id))
    return _shipment(cur.fetchone())


@router.post("/shipments/{deal_id}/approve-provider")
def approve_provider(deal_id: str, user=Depends(require_roles("buyer"))):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""SELECT s.id,s.provider_id,s.status FROM logistics_shipments s
                JOIN trade_deals d ON d.id=s.trade_deal_id
                WHERE s.trade_deal_id=%s AND d.buyer_id=%s FOR UPDATE""", (deal_id, user["id"]))
            shipment = cur.fetchone()
            if not shipment: raise HTTPException(404, "Shipment not found for this deal")
            if shipment[2] not in ("ACCEPTED", "WAITING_BUYER_APPROVAL"):
                raise HTTPException(409, "This logistics provider is not awaiting buyer approval")
            cur.execute("UPDATE logistics_shipments SET status='LOGISTICS_CONFIRMED',updated_at=NOW() WHERE trade_deal_id=%s", (deal_id,))
            cur.execute(SHIPMENT_SELECT + " WHERE s.trade_deal_id=%s", (deal_id,))
            row = cur.fetchone()
        conn.commit()
        return _shipment(row)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


@router.post("/shipments/{deal_id}/reject-provider")
def reject_provider(deal_id: str, user=Depends(require_roles("buyer"))):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""SELECT s.id,s.provider_id,s.status FROM logistics_shipments s
                JOIN trade_deals d ON d.id=s.trade_deal_id
                WHERE s.trade_deal_id=%s AND d.buyer_id=%s FOR UPDATE""", (deal_id, user["id"]))
            shipment = cur.fetchone()
            if not shipment: raise HTTPException(404, "Shipment not found for this deal")
            if shipment[2] not in ("ACCEPTED", "WAITING_BUYER_APPROVAL"):
                raise HTTPException(409, "This logistics provider cannot be rejected right now")
            cur.execute("UPDATE logistics_shipments SET provider_id=NULL,status='AVAILABLE',updated_at=NOW() WHERE trade_deal_id=%s", (deal_id,))
            cur.execute(SHIPMENT_SELECT + " WHERE s.trade_deal_id=%s", (deal_id,))
            row = cur.fetchone()
        conn.commit()
        return _shipment(row)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


@router.post("/shipments/{deal_id}/vehicle")
def assign_vehicle(deal_id: str, details: VehicleAssignmentDetails, user=Depends(require_roles("logistics"))):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT s.id,s.status FROM logistics_shipments s WHERE s.trade_deal_id=%s AND s.provider_id=%s FOR UPDATE", (deal_id, user["id"]))
            shipment = cur.fetchone()
            if not shipment: raise HTTPException(404, "Shipment not found or not assigned to this provider")
            if shipment[1] not in ("LOGISTICS_CONFIRMED", "VEHICLE_ASSIGNED"):
                raise HTTPException(409, "Vehicle can only be assigned after buyer approves the logistics provider")
            cur.execute("""UPDATE logistics_shipments SET transporter_name=%s,truck_type=%s,license_plate=%s,
                driver_name=%s,driver_phone=%s,current_location=%s,eta_text=%s,status='VEHICLE_ASSIGNED',updated_at=NOW()
                WHERE trade_deal_id=%s AND provider_id=%s""",
                (details.vehicleType, details.vehicleType, details.vehicleNumber, details.driverName,
                 details.driverPhone, details.currentLocation, details.eta, deal_id, user["id"]))
            cur.execute(SHIPMENT_SELECT + " WHERE s.trade_deal_id=%s AND s.provider_id=%s", (deal_id, user["id"]))
            row = cur.fetchone()
        conn.commit()
        return _shipment(row)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


@router.post("/shipments/{deal_id}/location")
def update_location(deal_id: str, details: LocationUpdate, user=Depends(require_roles("logistics"))):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id,status FROM logistics_shipments WHERE trade_deal_id=%s AND provider_id=%s FOR UPDATE", (deal_id, user["id"]))
            shipment = cur.fetchone()
            if not shipment: raise HTTPException(404, "Shipment not found or not assigned to this provider")
            if shipment[1] not in ("VEHICLE_ASSIGNED", "DISPATCHED", "IN_TRANSIT", "DELIVERED"):
                raise HTTPException(409, "Location can only be updated once the shipment is assigned")
            cur.execute("UPDATE logistics_shipments SET current_location=%s,eta_text=%s,updated_at=NOW() WHERE trade_deal_id=%s AND provider_id=%s", (details.currentLocation, details.eta or 'Pending', deal_id, user["id"]))
            cur.execute(SHIPMENT_SELECT + " WHERE s.trade_deal_id=%s AND s.provider_id=%s", (deal_id, user["id"]))
            row = cur.fetchone()
        conn.commit()
        return _shipment(row)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


@router.post("/shipments/{deal_id}/dispatch")
def dispatch_shipment(deal_id: str, details: DispatchDetails, user=Depends(require_roles("logistics"))):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            result = _transition(cur, deal_id, user["id"], "VEHICLE_ASSIGNED", "DISPATCHED", details)
        conn.commit()
        return result
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def update_shipment_status(deal_id: str, user, expected_status: str, next_status: str):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            result = _transition(cur, deal_id, user["id"], expected_status, next_status)
        conn.commit()
        return result
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


@router.post("/shipments/{deal_id}/transit")
def mark_in_transit(deal_id: str, user=Depends(require_roles("logistics"))):
    return update_shipment_status(deal_id, user, "DISPATCHED", "IN_TRANSIT")


@router.post("/shipments/{deal_id}/deliver")
def mark_delivered(deal_id: str, user=Depends(require_roles("logistics"))):
    return update_shipment_status(deal_id, user, "IN_TRANSIT", "DELIVERED")


@router.post("/shipments/{deal_id}/complete")
def complete_shipment(deal_id: str, user=Depends(require_roles("buyer"))):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""SELECT s.status FROM logistics_shipments s
                JOIN trade_deals d ON d.id=s.trade_deal_id
                WHERE s.trade_deal_id=%s AND d.buyer_id=%s FOR UPDATE""", (deal_id, user["id"]))
            shipment = cur.fetchone()
            if not shipment: raise HTTPException(404, "Shipment not found")
            if shipment[0] != "DELIVERED": raise HTTPException(409, "Shipment must be DELIVERED before completion")
            cur.execute("UPDATE logistics_shipments SET status='COMPLETED',updated_at=NOW() WHERE trade_deal_id=%s", (deal_id,))
            cur.execute(SHIPMENT_SELECT + " WHERE s.trade_deal_id=%s", (deal_id,))
            result = _shipment(cur.fetchone())
        conn.commit()
        return result
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


@router.get("/shipments/{deal_id}")
def get_shipment(deal_id: str, user=Depends(require_roles("logistics", "farmer", "buyer"))):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(SHIPMENT_SELECT + " WHERE s.trade_deal_id=%s", (deal_id,))
            row = cur.fetchone()
            if not row: raise HTTPException(404, "Shipment not found")
            if user["role"] == "logistics" and str(row[10]) != user["id"]: raise HTTPException(403, "Shipment belongs to another provider")
            if user["role"] == "farmer" and str(row[3]) != user["id"]: raise HTTPException(403, "Shipment is not linked to this farmer")
            if user["role"] == "buyer" and str(row[4]) != user["id"]: raise HTTPException(403, "Shipment is not linked to this buyer")
            return _shipment(row)
    finally:
        conn.close()


# ============================================================
# TRANSPORT PAYMENT REQUEST WORKFLOW
# ============================================================

@router.post("/shipments/{deal_id}/request-freight-payment")
def request_freight_payment(deal_id: str, user=Depends(require_roles("logistics"))):
    """
    Logistics provider requests freight payment from buyer.
    Only available after shipment is ACCEPTED.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # Verify ownership and status
            cur.execute("""
                SELECT s.id, s.status, s.freight_payment_status, s.freight_amount
                FROM logistics_shipments s
                WHERE s.trade_deal_id=%s AND s.provider_id=%s
            """, (deal_id, user["id"]))
            shipment = cur.fetchone()
            if not shipment: 
                raise HTTPException(404, "Shipment not found or not assigned to this provider")
            if shipment[1] not in ("ACCEPTED", "DISPATCHED", "IN_TRANSIT"):
                raise HTTPException(409, "Freight payment can only be requested when shipment is accepted or dispatched")
            
            # Update payment status
            cur.execute("""
                UPDATE logistics_shipments 
                SET freight_payment_status='REQUESTED', updated_at=NOW()
                WHERE trade_deal_id=%s
            """, (deal_id,))
            
            # Return updated shipment
            cur.execute(SHIPMENT_SELECT + " WHERE s.trade_deal_id=%s", (deal_id,))
            row = cur.fetchone()
        conn.commit()
        return _shipment(row)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


@router.post("/shipments/{deal_id}/approve-freight-payment")
def approve_freight_payment(deal_id: str, user=Depends(require_roles("buyer"))):
    """
    Buyer approves freight payment request from logistics provider.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # Verify buyer ownership and payment status
            cur.execute("""
                SELECT s.id, s.freight_payment_status
                FROM logistics_shipments s
                JOIN trade_deals d ON d.id=s.trade_deal_id
                WHERE d.id=%s AND d.buyer_id=%s
            """, (deal_id, user["id"]))
            shipment = cur.fetchone()
            if not shipment: 
                raise HTTPException(404, "Shipment not found or not owned by this buyer")
            if shipment[1] != "REQUESTED":
                raise HTTPException(409, "Payment can only be approved if it's been requested")
            
            # Update payment status
            cur.execute("""
                UPDATE logistics_shipments 
                SET freight_payment_status='APPROVED', updated_at=NOW()
                WHERE trade_deal_id=%s
            """, (deal_id,))
            
            # Return updated shipment
            cur.execute(SHIPMENT_SELECT + " WHERE s.trade_deal_id=%s", (deal_id,))
            row = cur.fetchone()
        conn.commit()
        return _shipment(row)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


@router.post("/shipments/{deal_id}/reject-freight-payment")
def reject_freight_payment(deal_id: str, user=Depends(require_roles("buyer"))):
    """
    Buyer rejects freight payment request from logistics provider.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # Verify buyer ownership and payment status
            cur.execute("""
                SELECT s.id, s.freight_payment_status
                FROM logistics_shipments s
                JOIN trade_deals d ON d.id=s.trade_deal_id
                WHERE d.id=%s AND d.buyer_id=%s
            """, (deal_id, user["id"]))
            shipment = cur.fetchone()
            if not shipment: 
                raise HTTPException(404, "Shipment not found or not owned by this buyer")
            if shipment[1] != "REQUESTED":
                raise HTTPException(409, "Payment can only be rejected if it's been requested")
            
            # Update payment status back to pending
            cur.execute("""
                UPDATE logistics_shipments 
                SET freight_payment_status='REJECTED', updated_at=NOW()
                WHERE trade_deal_id=%s
            """, (deal_id,))
            
            # Return updated shipment
            cur.execute(SHIPMENT_SELECT + " WHERE s.trade_deal_id=%s", (deal_id,))
            row = cur.fetchone()
        conn.commit()
        return _shipment(row)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()