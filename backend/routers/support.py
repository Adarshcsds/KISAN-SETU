import uuid

from fastapi import APIRouter, Depends, HTTPException
from psycopg2 import errors

from backend.auth import require_roles
from backend.database import get_connection
from backend.models import SupportTicketCreate, TradeFeedbackCreate, TradeIssueCreate

router = APIRouter(prefix="/support", tags=["Issues, Feedback & Support"])


def _ticket(row):
    return {"id": str(row[0]), "issueType": row[1], "description": row[2], "status": row[3],
            "createdAt": row[4].isoformat(), "updatedAt": row[5].isoformat()}


def _issue(row):
    return {"id": str(row[0]), "tradeDealId": str(row[1]), "dealCode": row[2], "issueType": row[3],
            "description": row[4], "status": row[5], "createdAt": row[6].isoformat(), "updatedAt": row[7].isoformat()}


def _feedback(row):
    return {"id": str(row[0]), "tradeDealId": str(row[1]), "dealCode": row[2], "reviewerUserId": str(row[3]),
            "revieweeUserId": str(row[4]), "rating": row[5], "comment": row[6],
            "createdAt": row[7].isoformat(), "updatedAt": row[8].isoformat()}


def _participant_deal(cur, deal_id, user_id):
    cur.execute("""SELECT id, deal_code, farmer_id, buyer_id FROM trade_deals
                   WHERE id=%s AND (%s IN (farmer_id, buyer_id))""", (deal_id, user_id))
    deal = cur.fetchone()
    if not deal:
        raise HTTPException(404, "Trade deal not found for the authenticated user")
    return deal


@router.get("/tickets")
def list_tickets(user=Depends(require_roles("farmer", "buyer"))):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""SELECT id, issue_type, description, status, created_at, updated_at
                           FROM support_tickets WHERE user_id=%s ORDER BY created_at DESC""", (user["id"],))
            return [_ticket(row) for row in cur.fetchall()]
    finally:
        conn.close()


@router.post("/tickets", status_code=201)
def create_ticket(payload: SupportTicketCreate, user=Depends(require_roles("farmer", "buyer"))):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            ticket_id = str(uuid.uuid4())
            cur.execute("""INSERT INTO support_tickets (id,user_id,issue_type,description)
                           VALUES (%s,%s,%s,%s) RETURNING id,issue_type,description,status,created_at,updated_at""",
                        (ticket_id, user["id"], payload.issue_type, payload.description))
            row = cur.fetchone()
        conn.commit()
        return _ticket(row)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


@router.get("/issues")
def list_issues(user=Depends(require_roles("farmer", "buyer"))):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""SELECT i.id,i.trade_deal_id,d.deal_code,i.issue_type,i.description,i.status,i.created_at,i.updated_at
                           FROM trade_issues i JOIN trade_deals d ON d.id=i.trade_deal_id
                           WHERE i.reporter_user_id=%s ORDER BY i.created_at DESC""", (user["id"],))
            return [_issue(row) for row in cur.fetchall()]
    finally:
        conn.close()


@router.post("/issues", status_code=201)
def create_issue(payload: TradeIssueCreate, user=Depends(require_roles("farmer", "buyer"))):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            _participant_deal(cur, payload.trade_deal_id, user["id"])
            issue_id = str(uuid.uuid4())
            cur.execute("""INSERT INTO trade_issues (id,trade_deal_id,reporter_user_id,issue_type,description)
                           VALUES (%s,%s,%s,%s,%s)
                           RETURNING id,trade_deal_id,(SELECT deal_code FROM trade_deals WHERE id=trade_deal_id),issue_type,description,status,created_at,updated_at""",
                        (issue_id, payload.trade_deal_id, user["id"], payload.issue_type, payload.description))
            row = cur.fetchone()
        conn.commit()
        return _issue(row)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


@router.get("/feedback")
def list_feedback(user=Depends(require_roles("farmer", "buyer"))):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""SELECT f.id,f.trade_deal_id,d.deal_code,f.reviewer_user_id,f.reviewee_user_id,f.rating,f.comment,f.created_at,f.updated_at
                           FROM trade_feedback f JOIN trade_deals d ON d.id=f.trade_deal_id
                           WHERE f.reviewer_user_id=%s OR f.reviewee_user_id=%s ORDER BY f.created_at DESC""", (user["id"], user["id"]))
            return [_feedback(row) for row in cur.fetchall()]
    finally:
        conn.close()


@router.post("/feedback", status_code=201)
def create_feedback(payload: TradeFeedbackCreate, user=Depends(require_roles("farmer", "buyer"))):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            deal = _participant_deal(cur, payload.trade_deal_id, user["id"])
            reviewee_id = deal[3] if str(deal[2]) == str(user["id"]) else deal[2]
            feedback_id = str(uuid.uuid4())
            cur.execute("""INSERT INTO trade_feedback (id,trade_deal_id,reviewer_user_id,reviewee_user_id,rating,comment)
                           VALUES (%s,%s,%s,%s,%s,%s)
                           RETURNING id,trade_deal_id,(SELECT deal_code FROM trade_deals WHERE id=trade_deal_id),reviewer_user_id,reviewee_user_id,rating,comment,created_at,updated_at""",
                        (feedback_id, payload.trade_deal_id, user["id"], reviewee_id, payload.rating, payload.comment))
            row = cur.fetchone()
        conn.commit()
        return _feedback(row)
    except errors.UniqueViolation as exc:
        conn.rollback()
        raise HTTPException(409, "Feedback has already been submitted for this trade") from exc
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
