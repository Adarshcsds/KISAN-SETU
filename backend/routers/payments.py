import secrets
import uuid

from fastapi import APIRouter, Depends, HTTPException

from backend.auth import require_roles
from backend.database import get_connection


router = APIRouter(prefix="/payments", tags=["KisanSetu Payment Sandbox"])


def _payment(row):
    return {
        "id": str(row[0]), "tradeDealId": str(row[1]), "dealCode": row[2],
        "cropName": row[3], "quantityQuintals": float(row[4]), "amount": float(row[5]),
        "status": row[6], "transactionReference": row[7], "releaseReference": row[8],
        "createdAt": row[9].isoformat(), "releasedAt": row[10].isoformat() if row[10] else None,
    }


PAYMENT_SELECT = """SELECT p.id,p.trade_deal_id,d.deal_code,d.crop_name,d.agreed_quantity_quintals,
 p.amount,p.status,p.transaction_reference,p.release_reference,p.created_at,p.released_at
 FROM deal_payments p JOIN trade_deals d ON d.id=p.trade_deal_id"""


@router.get("")
def list_payments(user=Depends(require_roles("buyer", "farmer"))):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            owner = "d.buyer_id" if user["role"] == "buyer" else "d.farmer_id"
            cur.execute("""SELECT p.id,d.id,d.deal_code,d.crop_name,d.agreed_quantity_quintals,
                           COALESCE(p.amount,d.gross_amount),COALESCE(p.status,'PENDING'),p.transaction_reference,p.release_reference,
                           COALESCE(p.created_at,d.created_at),COALESCE(p.released_at,NULL)
                           FROM trade_deals d LEFT JOIN deal_payments p ON p.trade_deal_id=d.id
                           WHERE """ + owner + "=%s ORDER BY COALESCE(p.updated_at,d.created_at) DESC", (user["id"],))
            return [_payment(row) for row in cur.fetchall()]
    finally:
        conn.close()


@router.post("/{deal_id}/secure")
def secure_payment(deal_id: str, user=Depends(require_roles("buyer"))):
    """Lock the server-calculated deal value in the internal demo escrow sandbox."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""SELECT id,buyer_id,farmer_id,gross_amount FROM trade_deals
                WHERE id=%s AND buyer_id=%s FOR UPDATE""", (deal_id, user["id"]))
            deal = cur.fetchone()
            if not deal:
                raise HTTPException(404, "Trade deal not found for this buyer")
            cur.execute("SELECT id,status FROM deal_payments WHERE trade_deal_id=%s FOR UPDATE", (deal_id,))
            existing = cur.fetchone()
            if existing:
                raise HTTPException(409, "Payment has already been secured for this deal")
            payment_id = str(uuid.uuid4())
            reference = f"KS-PAY-{secrets.token_hex(4).upper()}"
            cur.execute("""INSERT INTO deal_payments
                (id,trade_deal_id,buyer_id,farmer_id,amount,status,transaction_reference)
                VALUES (%s,%s,%s,%s,%s,'LOCKED',%s)""",
                (payment_id, deal_id, deal[1], deal[2], deal[3], reference))
            cur.execute(PAYMENT_SELECT + " WHERE p.id=%s", (payment_id,))
            row = cur.fetchone()
        conn.commit()
        return _payment(row)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


@router.post("/{deal_id}/pay")
def pay_now(deal_id: str, user=Depends(require_roles("buyer"))):
    """Complete a server-recorded demo payment for the buyer's own trade."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id,buyer_id,farmer_id,gross_amount FROM trade_deals WHERE id=%s AND buyer_id=%s FOR UPDATE", (deal_id, user["id"]))
            deal = cur.fetchone()
            if not deal: raise HTTPException(404, "Trade deal not found for this buyer")
            cur.execute("SELECT id,status FROM deal_payments WHERE trade_deal_id=%s FOR UPDATE", (deal_id,))
            existing = cur.fetchone(); reference = f"KS-PAY-{secrets.token_hex(4).upper()}"
            if existing and existing[1] == "RELEASED": raise HTTPException(409, "Payment has already been completed")
            if existing:
                cur.execute("UPDATE deal_payments SET status='RELEASED',release_reference=%s,released_at=NOW(),updated_at=NOW() WHERE id=%s", (reference, existing[0]))
            else:
                cur.execute("""INSERT INTO deal_payments (id,trade_deal_id,buyer_id,farmer_id,amount,status,transaction_reference,release_reference,released_at)
                               VALUES (%s,%s,%s,%s,%s,'RELEASED',%s,%s,NOW())""", (str(uuid.uuid4()), deal_id, deal[1], deal[2], deal[3], reference, reference))
            cur.execute(PAYMENT_SELECT + " WHERE p.trade_deal_id=%s", (deal_id,)); row = cur.fetchone()
        conn.commit(); return _payment(row)
    except Exception:
        conn.rollback(); raise
    finally:
        conn.close()


@router.post("/{deal_id}/release")
def release_payment(deal_id: str, user=Depends(require_roles("buyer"))):
    """Release a locked sandbox payment exactly once, after delivery is recorded."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""SELECT p.id,p.status FROM deal_payments p
                JOIN trade_deals d ON d.id=p.trade_deal_id
                WHERE p.trade_deal_id=%s AND d.buyer_id=%s FOR UPDATE""", (deal_id, user["id"]))
            payment = cur.fetchone()
            if not payment:
                raise HTTPException(404, "Payment not found for this buyer's deal")
            if payment[1] != "LOCKED":
                raise HTTPException(409, "Only a locked payment can be released")
            cur.execute("SELECT status FROM logistics_shipments WHERE trade_deal_id=%s FOR UPDATE", (deal_id,))
            shipment = cur.fetchone()
            if not shipment or shipment[0] not in ("DELIVERED", "COMPLETED"):
                raise HTTPException(409, "Payment can be released only after delivery")
            release_reference = f"KS-REL-{secrets.token_hex(4).upper()}"
            cur.execute("""UPDATE deal_payments SET status='RELEASED',release_reference=%s,
                released_at=NOW(),updated_at=NOW() WHERE id=%s""", (release_reference, payment[0]))
            cur.execute(PAYMENT_SELECT + " WHERE p.id=%s", (payment[0],))
            row = cur.fetchone()
        conn.commit()
        return _payment(row)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
