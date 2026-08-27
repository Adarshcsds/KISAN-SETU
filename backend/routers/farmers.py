from fastapi import APIRouter, HTTPException
from backend.models import Farmer
from backend.routers.mandis import get_connection

router = APIRouter(prefix="/farmers", tags=["Farmers"])


@router.get("/{farmer_id}", response_model=Farmer)
def get_farmer(farmer_id: str):

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            id,
            name,
            phone,
            email,
            village,
            district,
            state,
            acres,
            role,
            verified,
            wallet_balance
        FROM farmers
        WHERE id = %s
    """, (farmer_id,))

    row = cur.fetchone()

    cur.close()
    conn.close()

    if not row:
        raise HTTPException(
            status_code=404,
            detail="Farmer not found"
        )

    return Farmer(
        id=row[0],
        name=row[1],
        phone=row[2],
        email=row[3],
        village=row[4],
        district=row[5],
        state=row[6],
        acres=row[7],
        role=row[8],
        verified=row[9],
        wallet_balance=row[10]
    )