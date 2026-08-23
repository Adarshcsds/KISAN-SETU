from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from backend.data_store import db
from backend.models import MandiMarket, VerifiedBuyer

router = APIRouter(tags=["APMC Mandis & Verified Buyers"])

@router.get("/mandis", response_model=List[MandiMarket])
def get_all_mandis(max_distance: Optional[int] = Query(None, description="Filter mandis within distance (km)")):
    """Retrieve all regional APMC mandis with arrival volume, modal price, and storage capacity."""
    all_mandis = list(db.mandis.values())
    if max_distance is not None:
        all_mandis = [m for m in all_mandis if m.distanceKm <= max_distance]
    return all_mandis

@router.get("/mandis/{mandi_id}", response_model=MandiMarket)
def get_mandi_by_id(mandi_id: str):
    """Retrieve details for a specific APMC mandi."""
    mandi = db.mandis.get(mandi_id)
    if not mandi:
        raise HTTPException(status_code=404, detail=f"Mandi '{mandi_id}' not found")
    return mandi

@router.get("/buyers", response_model=List[VerifiedBuyer])
def get_verified_buyers(
    mandi_id: Optional[str] = Query(None, description="Filter by Mandi ID"),
    crop_id: Optional[str] = Query(None, description="Filter by accepted Crop ID")
):
    """Retrieve verified institutional buyers, food processors, and flour mills."""
    buyers = list(db.buyers.values())
    if mandi_id:
        buyers = [b for b in buyers if b.mandiId == mandi_id]
    if crop_id:
        buyers = [b for b in buyers if crop_id in b.acceptedCrops]
    return buyers
