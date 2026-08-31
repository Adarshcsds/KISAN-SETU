from fastapi import APIRouter, Depends

from backend.auth import require_roles
from backend.database import get_connection

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])


def _rows(cur, query, params=()):
    cur.execute(query, params)
    columns = [column[0] for column in cur.description]
    result = []
    for row in cur.fetchall():
        item = dict(zip(columns, row))
        for key, value in item.items():
            if hasattr(value, "isoformat"):
                item[key] = value.isoformat()
            elif key in {"amount", "rating", "modal_price", "min_price", "max_price", "average_rating", "average_price"} and value is not None:
                item[key] = float(value)
        result.append(item)
    return result


@router.get("/dashboard")
def dashboard(_admin=Depends(require_roles("admin"))):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""SELECT
              COUNT(*) FILTER (WHERE role='farmer') AS farmers, COUNT(*) FILTER (WHERE role='buyer') AS buyers,
              COUNT(*) FILTER (WHERE role='logistics') AS logistics, COUNT(*) FILTER (WHERE role='admin') AS admins
              FROM users""")
            users = cur.fetchone()
            cur.execute("""SELECT COUNT(*), COUNT(*) FILTER (WHERE status IN ('COMPLETED','DELIVERED','SETTLED')),
              COUNT(*) FILTER (WHERE status='AGREED'), COUNT(*) FILTER (WHERE status IN ('REJECTED','CANCELLED')) FROM trade_deals""")
            deals = cur.fetchone()
            cur.execute("SELECT COUNT(*) FROM trade_issues"); issues = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM trade_feedback"); feedback = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM market_prices WHERE date=CURRENT_DATE"); prices = cur.fetchone()[0]
            cur.execute("SELECT status,COUNT(*) FROM trade_deals GROUP BY status ORDER BY status")
            deal_status = [{"name": row[0], "value": row[1]} for row in cur.fetchall()]
            cur.execute("""SELECT offered_by_user_id,u.role,COUNT(*) FROM offer_negotiations n JOIN users u ON u.id=n.offered_by_user_id GROUP BY offered_by_user_id,u.role""")
            offer_rows = cur.fetchall(); farmer_offers = sum(row[2] for row in offer_rows if row[1] == "farmer"); buyer_offers = sum(row[2] for row in offer_rows if row[1] == "buyer")
            cur.execute("SELECT COUNT(DISTINCT offer_id),COUNT(*) FROM offer_negotiations"); negotiation_count, offer_count = cur.fetchone()
            cur.execute("SELECT COUNT(DISTINCT offer_id) FROM offer_negotiations n JOIN users u ON u.id=n.offered_by_user_id WHERE u.role='farmer' GROUP BY offer_id HAVING COUNT(*) >= 2")
            farmer_second = len(cur.fetchall())
            cur.execute("SELECT COUNT(DISTINCT offer_id) FROM offer_negotiations n JOIN users u ON u.id=n.offered_by_user_id WHERE u.role='buyer' GROUP BY offer_id HAVING COUNT(*) >= 2")
            buyer_second = len(cur.fetchall())
            cur.execute("""SELECT COALESCE(SUM(amount),0),COALESCE(SUM(amount) FILTER (WHERE status='RELEASED'),0),
              COALESCE(SUM(amount) FILTER (WHERE status <> 'RELEASED'),0) FROM deal_payments""")
            trade_payments = cur.fetchone()
            cur.execute("""SELECT COALESCE(SUM(freight_amount),0),COALESCE(SUM(freight_amount) FILTER (WHERE freight_payment_status='PAID'),0),
              COALESCE(SUM(freight_amount) FILTER (WHERE freight_payment_status <> 'PAID'),0) FROM logistics_shipments WHERE freight_amount IS NOT NULL""")
            freight_payments = cur.fetchone()
            return {"kpis": {"farmers": users[0], "buyers": users[1], "logistics": users[2], "admins": users[3], "totalDeals": deals[0], "completedDeals": deals[1], "acceptedDeals": deals[2], "rejectedDeals": deals[3], "issues": issues, "feedback": feedback, "todayPrices": prices},
              "userDistribution": [{"name": "Farmers", "value": users[0]}, {"name": "Buyers", "value": users[1]}, {"name": "Logistics", "value": users[2]}, {"name": "Admins", "value": users[3]}], "dealStatus": deal_status,
              "negotiations": {"total": negotiation_count, "offers": offer_count, "averageOffers": round(offer_count / negotiation_count, 2) if negotiation_count else 0, "farmerSecondOffers": farmer_second, "buyerSecondOffers": buyer_second, "offersByRole": [{"name":"Farmer", "value": farmer_offers}, {"name":"Buyer", "value": buyer_offers}]},
              "payments": {"tradeTotal": float(trade_payments[0]), "tradePaid": float(trade_payments[1]), "tradePending": float(trade_payments[2]), "freightTotal": float(freight_payments[0]), "freightPaid": float(freight_payments[1]), "freightPending": float(freight_payments[2])}}
    finally:
        conn.close()


@router.get("/market-prices")
def market_prices(_admin=Depends(require_roles("admin"))):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            rows = _rows(cur, """SELECT commodity,market,district,state,modal_price,min_price,max_price,date FROM market_prices WHERE date=CURRENT_DATE ORDER BY modal_price DESC NULLS LAST LIMIT 100""")
            crops = _rows(cur, "SELECT DISTINCT commodity FROM market_prices WHERE modal_price IS NOT NULL ORDER BY commodity LIMIT 100")
            selected = crops[0]["commodity"] if crops else None
            trend = _rows(cur, """SELECT date,AVG(modal_price) AS average_price FROM market_prices WHERE commodity=%s AND date >= CURRENT_DATE-INTERVAL '6 days' GROUP BY date ORDER BY date""", (selected,)) if selected else []
            return {"records": rows, "crops": [item["commodity"] for item in crops], "selectedCrop": selected, "trend": trend}
    finally: conn.close()


@router.get("/issues")
def issues(_admin=Depends(require_roles("admin"))):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            return _rows(cur, """SELECT i.id,d.deal_code,d.crop_name,reporter.name AS reporter_name,reporter.role AS reporter_role,
              other.name AS other_party,i.issue_type,i.description,i.status,i.created_at FROM trade_issues i JOIN trade_deals d ON d.id=i.trade_deal_id
              JOIN users reporter ON reporter.id=i.reporter_user_id JOIN users other ON other.id=CASE WHEN d.farmer_id=i.reporter_user_id THEN d.buyer_id ELSE d.farmer_id END ORDER BY i.created_at DESC LIMIT 100""")
    finally: conn.close()


@router.get("/feedback")
def feedback(_admin=Depends(require_roles("admin"))):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            return _rows(cur, """SELECT f.id,d.deal_code,from_user.name AS from_name,from_user.role AS from_role,to_user.name AS to_name,to_user.role AS to_role,f.rating,f.comment,f.created_at FROM trade_feedback f JOIN trade_deals d ON d.id=f.trade_deal_id JOIN users from_user ON from_user.id=f.reviewer_user_id JOIN users to_user ON to_user.id=f.reviewee_user_id ORDER BY f.created_at DESC LIMIT 100""")
    finally: conn.close()


@router.get("/support")
def support(_admin=Depends(require_roles("admin"))):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            return _rows(cur, """SELECT s.id,u.name,u.role,s.issue_type,s.description,s.status,s.created_at FROM support_tickets s JOIN users u ON u.id=s.user_id ORDER BY s.created_at DESC LIMIT 100""")
    finally: conn.close()


@router.get("/feedback-performance")
def feedback_performance(_admin=Depends(require_roles("admin"))):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            return _rows(cur, """SELECT u.id,u.name,u.role,COUNT(f.id) AS total_feedback,AVG(f.rating) AS average_rating,MAX(f.created_at) AS latest_feedback FROM users u JOIN trade_feedback f ON f.reviewee_user_id=u.id GROUP BY u.id,u.name,u.role ORDER BY average_rating DESC,total_feedback DESC LIMIT 100""")
    finally: conn.close()


@router.get("/recent-activity")
def recent_activity(_admin=Depends(require_roles("admin"))):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            return _rows(cur, """SELECT * FROM (SELECT 'Deal created' AS activity,deal_code AS reference,created_at FROM trade_deals UNION ALL SELECT 'Negotiation offer',CAST(offer_id AS TEXT),created_at FROM offer_negotiations UNION ALL SELECT 'Payment completed',transaction_reference,updated_at FROM deal_payments WHERE status='RELEASED' UNION ALL SELECT 'Issue submitted',CAST(id AS TEXT),created_at FROM trade_issues UNION ALL SELECT 'Feedback submitted',CAST(id AS TEXT),created_at FROM trade_feedback UNION ALL SELECT 'Logistics shipment',CAST(trade_deal_id AS TEXT),created_at FROM logistics_shipments) a ORDER BY created_at DESC LIMIT 20""")
    finally: conn.close()
