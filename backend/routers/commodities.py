from fastapi import APIRouter, HTTPException
from typing import List
from backend.data_store import db
from backend.models import Commodity

router = APIRouter(prefix="/commodities", tags=["Commodities & MSP"])

@router.get("", response_model=List[Commodity])
def get_all_commodities():
    """Retrieve all supported agricultural crops with current modal prices, MSP benchmarks, and moisture standards."""
    return list(db.commodities.values())

@router.get("/{crop_id}", response_model=Commodity)
def get_commodity_by_id(crop_id: str):
    """Retrieve a single commodity specification by crop ID."""
    crop = db.commodities.get(crop_id.lower())
    if not crop:
        raise HTTPException(status_code=404, detail=f"Crop with ID '{crop_id}' not found")
    return crop
