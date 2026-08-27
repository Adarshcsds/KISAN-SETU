import secrets
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from backend.auth import get_current_user, require_roles
from backend.database import get_connection

router = APIRouter(prefix="/demands", tags=["Buyer Demands & Negotiations"])
offer_router = APIRouter(prefix="/offers", tags=["Buyer Demands & Negotiations"])


class DemandCreate(BaseModel):
    cropName: str = Field(min_length=1, max_length=120)
    cropCategory: str = Field(min_length=1, max_length=50)
    quantityQuintals: float = Field(gt=0)
    offeredPricePerQuintal: float = Field(gt=0)
    qualityGrade: str = Field(min_length=1, max_length=120)
    deliveryLocation: str = Field(min_length=1, max_length=500)
    deadline: datetime
    notes: Optional[str] = Field(default=None, max_length=3000)


class OfferCreate(BaseModel):
    offeredQuantityQuintals: float = Field(gt=0)
    offeredPricePerQuintal: float = Field(gt=0)
    qualityGrade: str = Field(min_length=1, max_length=120)
    message: Optional[str] = Field(default=None, max_length=3000)


class CounterCreate(OfferCreate):
    pass


class DirectRequestCreate(OfferCreate):
    buyerId: str
    cropName: str = Field(min_length=1, max_length=120)
    cropCategory: str = Field(min_length=1, max_length=50)
    pickupLocation: str = Field(min_length=1, max_length=500)


def _demand(row):
    return {"id": str(row[0]), "buyerId": str(row[1]), "cropName": row[2], "cropCategory": row[3],
            "quantityQuintals": float(row[4]), "offeredPricePerQuintal": float(row[5]), "qualityGrade": row[6],
            "deliveryLocation": row[7], "deadline": row[8].isoformat(), "notes": row[9], "status": row[10],
            "createdAt": row[11].isoformat(), "buyerFirmName": row[12], "buyerVerified": True}


def _offer(row):
    return {"id": str(row[0]), "demandId": str(row[1]), "farmerId": str(row[2]),
            "offeredQuantityQuintals": float(row[3]), "offeredPricePerQuintal": float(row[4]),
            "qualityGrade": row[5], "message": row[6], "status": row[7], "createdAt": row[8].isoformat(),
            "updatedAt": row[9].isoformat(), "farmerName": row[10], "farmerLocation": row[11]}


DEMAND_SELECT = """SELECT d.id,d.buyer_id,d.crop_name,d.crop_category,d.quantity_quintals,d.offered_price_per_quintal,
 d.quality_grade,d.delivery_location,d.deadline,d.notes,d.status,d.created_at,b.firm_name
 FROM buyer_demands d JOIN buyer_profiles b ON b.user_id=d.buyer_id"""
OFFER_SELECT = """SELECT o.id,o.demand_id,o.farmer_id,o.offered_quantity_quintals,o.offered_price_per_quintal,
 o.quality_grade,o.message,o.status,o.created_at,o.updated_at,u.name,fp.location
 FROM demand_offers o JOIN users u ON u.id=o.farmer_id JOIN farmer_profiles fp ON fp.user_id=o.farmer_id"""
DIRECT_REQUEST_SELECT = """SELECT r.id,r.farmer_id,r.buyer_id,r.crop_name,r.crop_category,r.quantity_quintals,r.offered_price_per_quintal,r.quality_grade,r.pickup_location,r.message,r.status,r.created_at,r.updated_at,u.name,b.firm_name
 FROM farmer_direct_requests r JOIN users u ON u.id=r.farmer_id JOIN buyer_profiles b ON b.user_id=r.buyer_id"""


def _direct_request(row):
    return {"id": str(row[0]), "farmerId": str(row[1]), "buyerId": str(row[2]), "cropName": row[3], "cropCategory": row[4], "quantityQuintals": float(row[5]), "offeredPricePerQuintal": float(row[6]), "qualityGrade": row[7], "pickupLocation": row[8], "message": row[9], "status": row[10], "createdAt": row[11].isoformat(), "updatedAt": row[12].isoformat(), "farmerName": row[13], "buyerFirmName": row[14], "buyerVerified": True}


@router.post("", status_code=201)
def create_demand(body: DemandCreate, user=Depends(require_roles("buyer"))):
    deadline = body.deadline.replace(tzinfo=timezone.utc) if body.deadline.tzinfo is None else body.deadline.astimezone(timezone.utc)
    if deadline <= datetime.now(timezone.utc):
        raise HTTPException(422, "Deadline must be in the future")
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""INSERT INTO buyer_demands (id,buyer_id,crop_name,crop_category,quantity_quintals,offered_price_per_quintal,quality_grade,delivery_location,deadline,notes)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                (str(demand_id := uuid.uuid4()), user["id"], body.cropName.strip(), body.cropCategory.strip(), body.quantityQuintals, body.offeredPricePerQuintal, body.qualityGrade.strip(), body.deliveryLocation.strip(), deadline, body.notes))
            cur.execute(DEMAND_SELECT + " WHERE d.id=%s", (str(demand_id),))
            row = cur.fetchone()
        conn.commit()
        return _demand(row)
    finally:
        conn.close()


@router.get("")
def list_demands(user=Depends(get_current_user)):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            if user["role"] == "buyer":
                cur.execute(DEMAND_SELECT + " WHERE d.buyer_id=%s ORDER BY d.created_at DESC", (user["id"],))
            elif user["role"] == "farmer":
                cur.execute(DEMAND_SELECT + " WHERE d.status IN ('OPEN','PARTIALLY_MATCHED') AND d.deadline > NOW() ORDER BY d.deadline ASC")
            else:
                raise HTTPException(403, "Insufficient role permissions")
            return [_demand(row) for row in cur.fetchall()]
    finally:
        conn.close()


@router.get("/deals")
def list_deals(user=Depends(require_roles("farmer", "buyer"))):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""SELECT id,deal_code,farmer_id,buyer_id,crop_name,agreed_quantity_quintals,agreed_price_per_quintal,gross_amount,pickup_location,delivery_location,quality_grade,deal_password,status,created_at
                FROM trade_deals WHERE farmer_id=%s OR buyer_id=%s ORDER BY created_at DESC""", (user["id"], user["id"]))
            return [_deal(row) for row in cur.fetchall()]
    finally:
        conn.close()


@router.get("/buyers")
def list_real_buyers(user=Depends(require_roles("farmer"))):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""SELECT u.id,b.firm_name,b.business_type,b.address,b.district,b.state FROM users u JOIN buyer_profiles b ON b.user_id=u.id WHERE u.role='buyer' AND u.is_active=TRUE ORDER BY b.firm_name""")
            return [{"id": str(row[0]), "firmName": row[1], "businessType": row[2], "address": row[3], "district": row[4], "state": row[5], "verified": True} for row in cur.fetchall()]
    finally:
        conn.close()


@router.post("/direct-requests", status_code=201)
def create_direct_request(body: DirectRequestCreate, user=Depends(require_roles("farmer"))):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT 1 FROM users WHERE id=%s AND role='buyer' AND is_active=TRUE", (body.buyerId,))
            if not cur.fetchone(): raise HTTPException(422, "Selected buyer is not an active registered buyer")
            cur.execute("""INSERT INTO farmer_direct_requests (id,farmer_id,buyer_id,crop_name,crop_category,quantity_quintals,offered_price_per_quintal,quality_grade,pickup_location,message)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""", (str(request_id := uuid.uuid4()), user["id"], body.buyerId, body.cropName.strip(), body.cropCategory.strip(), body.offeredQuantityQuintals, body.offeredPricePerQuintal, body.qualityGrade.strip(), body.pickupLocation.strip(), body.message))
            cur.execute(DIRECT_REQUEST_SELECT + " WHERE r.id=%s", (str(request_id),)); row = cur.fetchone()
        conn.commit(); return _direct_request(row)
    finally: conn.close()


@router.get("/direct-requests")
def list_direct_requests(user=Depends(require_roles("farmer", "buyer"))):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            column = "farmer_id" if user["role"] == "farmer" else "buyer_id"
            cur.execute(DIRECT_REQUEST_SELECT + f" WHERE r.{column}=%s ORDER BY r.updated_at DESC", (user["id"],))
            return [_direct_request(row) for row in cur.fetchall()]
    finally: conn.close()


@router.get("/deals/{deal_id}")
def get_deal(deal_id: str, user=Depends(require_roles("farmer", "buyer"))):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""SELECT id,deal_code,farmer_id,buyer_id,crop_name,agreed_quantity_quintals,agreed_price_per_quintal,gross_amount,pickup_location,delivery_location,quality_grade,deal_password,status,created_at
                FROM trade_deals WHERE id=%s AND (farmer_id=%s OR buyer_id=%s)""", (deal_id, user["id"], user["id"]))
            row = cur.fetchone()
            if not row: raise HTTPException(404, "Deal not found")
            return _deal(row)
    finally:
        conn.close()


def _deal(row):
    return {"id": str(row[0]), "dealCode": row[1], "farmerId": str(row[2]), "buyerId": str(row[3]), "cropName": row[4], "agreedQuantityQuintals": float(row[5]), "agreedPricePerQuintal": float(row[6]), "grossAmount": float(row[7]), "pickupLocation": row[8], "deliveryLocation": row[9], "qualityGrade": row[10], "dealPassword": row[11], "status": row[12], "createdAt": row[13].isoformat()}


@router.get("/{demand_id}")
def get_demand(demand_id: str, user=Depends(get_current_user)):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(DEMAND_SELECT + " WHERE d.id=%s", (demand_id,)); row = cur.fetchone()
            if not row: raise HTTPException(404, "Demand not found")
            if user["role"] == "buyer" and str(row[1]) != user["id"]: raise HTTPException(403, "Demand belongs to another buyer")
            if user["role"] not in ("buyer", "farmer"): raise HTTPException(403, "Insufficient role permissions")
            return _demand(row)
    finally: conn.close()


@router.post("/{demand_id}/offers", status_code=201)
def create_offer(demand_id: str, body: OfferCreate, user=Depends(require_roles("farmer"))):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT quantity_quintals,status,deadline FROM buyer_demands WHERE id=%s", (demand_id,)); demand = cur.fetchone()
            if not demand: raise HTTPException(404, "Demand not found")
            if demand[1] not in ("OPEN", "PARTIALLY_MATCHED") or demand[2] <= datetime.now(timezone.utc): raise HTTPException(409, "Demand is not open for offers")
            if Decimal(str(body.offeredQuantityQuintals)) > demand[0]: raise HTTPException(422, "Offer quantity exceeds demand quantity")
            cur.execute("""INSERT INTO demand_offers (id,demand_id,farmer_id,offered_quantity_quintals,offered_price_per_quintal,quality_grade,message)
                VALUES (%s,%s,%s,%s,%s,%s,%s)""", (str(offer_id := uuid.uuid4()), demand_id, user["id"], body.offeredQuantityQuintals, body.offeredPricePerQuintal, body.qualityGrade.strip(), body.message))
            cur.execute(OFFER_SELECT + " WHERE o.id=%s", (str(offer_id),)); row = cur.fetchone()
        conn.commit(); return _offer(row)
    finally: conn.close()


@router.get("/{demand_id}/offers")
def list_offers(demand_id: str, user=Depends(require_roles("farmer", "buyer"))):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT buyer_id FROM buyer_demands WHERE id=%s", (demand_id,)); owner = cur.fetchone()
            if not owner: raise HTTPException(404, "Demand not found")
            if user["role"] == "buyer" and str(owner[0]) != user["id"]: raise HTTPException(403, "Demand belongs to another buyer")
            query, args = (OFFER_SELECT + " WHERE o.demand_id=%s", [demand_id]) if user["role"] == "buyer" else (OFFER_SELECT + " WHERE o.demand_id=%s AND o.farmer_id=%s", [demand_id, user["id"]])
            cur.execute(query, args); return [_offer(row) for row in cur.fetchall()]
    finally: conn.close()


@offer_router.get("")
def list_my_offers(user=Depends(require_roles("farmer"))):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(OFFER_SELECT + " WHERE o.farmer_id=%s ORDER BY o.updated_at DESC", (user["id"],))
            return [_offer(row) for row in cur.fetchall()]
    finally:
        conn.close()


def _load_offer_for_update(cur, offer_id):
    cur.execute("""SELECT o.id,o.demand_id,o.farmer_id,o.offered_quantity_quintals,o.offered_price_per_quintal,o.quality_grade,o.status,d.buyer_id,d.crop_name,d.delivery_location
        FROM demand_offers o JOIN buyer_demands d ON d.id=o.demand_id WHERE o.id=%s FOR UPDATE""", (offer_id,))
    row = cur.fetchone()
    if not row: raise HTTPException(404, "Offer not found")
    return row


def _create_deal(cur, offer):
    cur.execute("SELECT location FROM farmer_profiles WHERE user_id=%s", (offer[2],)); profile = cur.fetchone()
    if not profile: raise HTTPException(409, "Farmer profile is unavailable")
    cur.execute("""INSERT INTO trade_deals (id,deal_code,offer_id,demand_id,farmer_id,buyer_id,crop_name,agreed_quantity_quintals,agreed_price_per_quintal,gross_amount,pickup_location,delivery_location,quality_grade,deal_password)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id,deal_code,farmer_id,buyer_id,crop_name,agreed_quantity_quintals,agreed_price_per_quintal,gross_amount,pickup_location,delivery_location,quality_grade,deal_password,status,created_at""",
        (str(uuid.uuid4()), f"DEAL-{secrets.token_hex(4).upper()}", offer[0], offer[1], offer[2], offer[7], offer[8], offer[3], offer[4], offer[3] * offer[4], profile[0], offer[9], offer[5], secrets.token_urlsafe(12)))
    return _deal(cur.fetchone())


def _load_direct_request_for_update(cur, request_id):
    cur.execute("SELECT id,farmer_id,buyer_id,crop_name,quantity_quintals,offered_price_per_quintal,quality_grade,pickup_location,status FROM farmer_direct_requests WHERE id=%s FOR UPDATE", (request_id,))
    row = cur.fetchone()
    if not row: raise HTTPException(404, "Direct request not found")
    return row


def _create_direct_deal(cur, request):
    cur.execute("SELECT address FROM buyer_profiles WHERE user_id=%s", (request[2],)); buyer = cur.fetchone()
    if not buyer: raise HTTPException(409, "Buyer profile is unavailable")
    cur.execute("""INSERT INTO trade_deals (id,deal_code,direct_request_id,farmer_id,buyer_id,crop_name,agreed_quantity_quintals,agreed_price_per_quintal,gross_amount,pickup_location,delivery_location,quality_grade,deal_password)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id,deal_code,farmer_id,buyer_id,crop_name,agreed_quantity_quintals,agreed_price_per_quintal,gross_amount,pickup_location,delivery_location,quality_grade,deal_password,status,created_at""",
        (str(uuid.uuid4()), f"DEAL-{secrets.token_hex(4).upper()}", request[0], request[1], request[2], request[3], request[4], request[5], request[4] * request[5], request[7], buyer[0], request[6], secrets.token_urlsafe(12)))
    return _deal(cur.fetchone())


@router.post("/direct-requests/{request_id}/accept")
def accept_direct_request(request_id: str, user=Depends(require_roles("farmer", "buyer"))):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            request = _load_direct_request_for_update(cur, request_id)
            allowed = (user["role"] == "buyer" and str(request[2]) == user["id"] and request[8] == "PENDING") or (user["role"] == "farmer" and str(request[1]) == user["id"] and request[8] == "COUNTERED")
            if not allowed: raise HTTPException(409, "This request cannot be accepted by the current user")
            cur.execute("UPDATE farmer_direct_requests SET status='ACCEPTED',updated_at=NOW() WHERE id=%s", (request_id,))
            deal = _create_direct_deal(cur, request)
        conn.commit(); return {"requestId": request_id, "status": "ACCEPTED", "deal": deal}
    except Exception:
        conn.rollback(); raise
    finally: conn.close()


@router.post("/direct-requests/{request_id}/reject")
def reject_direct_request(request_id: str, user=Depends(require_roles("farmer", "buyer"))):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            request = _load_direct_request_for_update(cur, request_id)
            if request[8] not in ("PENDING", "COUNTERED") or (user["role"] == "buyer" and str(request[2]) != user["id"]) or (user["role"] == "farmer" and str(request[1]) != user["id"]): raise HTTPException(409, "This request cannot be rejected by the current user")
            cur.execute("UPDATE farmer_direct_requests SET status='REJECTED',updated_at=NOW() WHERE id=%s", (request_id,))
        conn.commit(); return {"requestId": request_id, "status": "REJECTED"}
    except Exception:
        conn.rollback(); raise
    finally: conn.close()


@router.post("/direct-requests/{request_id}/counter")
def counter_direct_request(request_id: str, body: OfferCreate, user=Depends(require_roles("farmer", "buyer"))):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            request = _load_direct_request_for_update(cur, request_id)
            buyer_turn = user["role"] == "buyer" and str(request[2]) == user["id"] and request[8] == "PENDING"
            farmer_turn = user["role"] == "farmer" and str(request[1]) == user["id"] and request[8] == "COUNTERED"
            if not (buyer_turn or farmer_turn): raise HTTPException(409, "This request cannot be countered by the current user")
            cur.execute("UPDATE farmer_direct_requests SET quantity_quintals=%s,offered_price_per_quintal=%s,quality_grade=%s,message=%s,status=%s,updated_at=NOW() WHERE id=%s", (body.offeredQuantityQuintals, body.offeredPricePerQuintal, body.qualityGrade.strip(), body.message, "COUNTERED" if buyer_turn else "PENDING", request_id))
        conn.commit(); return {"requestId": request_id, "status": "COUNTERED" if buyer_turn else "PENDING"}
    except Exception:
        conn.rollback(); raise
    finally: conn.close()


@offer_router.post("/{offer_id}/accept")
def accept_offer(offer_id: str, user=Depends(require_roles("farmer", "buyer"))):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            offer = _load_offer_for_update(cur, offer_id)
            allowed = (user["role"] == "buyer" and str(offer[7]) == user["id"] and offer[6] == "PENDING") or (user["role"] == "farmer" and str(offer[2]) == user["id"] and offer[6] == "COUNTERED")
            if not allowed: raise HTTPException(409, "This offer cannot be accepted by the current user")
            cur.execute("UPDATE demand_offers SET status='ACCEPTED', updated_at=NOW() WHERE id=%s", (offer_id,))
            deal = _create_deal(cur, offer)
            cur.execute("SELECT quantity_quintals FROM buyer_demands WHERE id=%s FOR UPDATE", (offer[1],)); required = cur.fetchone()[0]
            cur.execute("SELECT COALESCE(SUM(offered_quantity_quintals),0) FROM demand_offers WHERE demand_id=%s AND status='ACCEPTED'", (offer[1],)); matched = cur.fetchone()[0]
            cur.execute("UPDATE buyer_demands SET status=%s WHERE id=%s", ("MATCHED" if matched >= required else "PARTIALLY_MATCHED", offer[1]))
        conn.commit(); return {"offerId": offer_id, "status": "ACCEPTED", "deal": deal}
    except Exception:
        conn.rollback(); raise
    finally: conn.close()


@offer_router.post("/{offer_id}/reject")
def reject_offer(offer_id: str, user=Depends(require_roles("farmer", "buyer"))):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            offer = _load_offer_for_update(cur, offer_id)
            if offer[6] not in ("PENDING", "COUNTERED") or (user["role"] == "buyer" and str(offer[7]) != user["id"]) or (user["role"] == "farmer" and str(offer[2]) != user["id"]): raise HTTPException(409, "This offer cannot be rejected by the current user")
            cur.execute("UPDATE demand_offers SET status='REJECTED', updated_at=NOW() WHERE id=%s", (offer_id,))
        conn.commit(); return {"offerId": offer_id, "status": "REJECTED"}
    except Exception:
        conn.rollback(); raise
    finally: conn.close()


@offer_router.post("/{offer_id}/counter")
def counter_offer(offer_id: str, body: CounterCreate, user=Depends(require_roles("farmer", "buyer"))):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            offer = _load_offer_for_update(cur, offer_id)
            buyer_turn = user["role"] == "buyer" and str(offer[7]) == user["id"] and offer[6] == "PENDING"
            farmer_turn = user["role"] == "farmer" and str(offer[2]) == user["id"] and offer[6] == "COUNTERED"
            if not (buyer_turn or farmer_turn): raise HTTPException(409, "This offer cannot be countered by the current user")
            cur.execute("UPDATE demand_offers SET offered_quantity_quintals=%s,offered_price_per_quintal=%s,quality_grade=%s,message=%s,status=%s,updated_at=NOW() WHERE id=%s",
                (body.offeredQuantityQuintals, body.offeredPricePerQuintal, body.qualityGrade.strip(), body.message, "COUNTERED" if buyer_turn else "PENDING", offer_id))
        conn.commit(); return {"offerId": offer_id, "status": "COUNTERED" if buyer_turn else "PENDING"}
    except Exception:
        conn.rollback(); raise
    finally: conn.close()
