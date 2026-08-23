from fastapi import APIRouter, HTTPException
from typing import List
from backend.models import RealizationPredictRequest, MarketRealizationItem, ForecastResponse
from backend.ml_engine import ml_engine
from backend.data_store import db

router = APIRouter(prefix="/predict", tags=["AI Predictive Models & Realization"])

@router.post("/realization", response_model=List[MarketRealizationItem])
def predict_net_realization(req: RealizationPredictRequest):
    """
    Computes Net In-Hand Realization rankings across all regional APMC markets.
    Deducts organized freight (₹600 + ₹26/km), perishability shrinkage loss, and mandi cess.
    """
    if req.quantityQuintals <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than 0")
    
    return ml_engine.calculate_market_rankings(
        crop_id=req.cropId,
        quantity=req.quantityQuintals,
        expected_loss_percent=req.expectedLossPercent,
        quality_grade=req.qualityGrade,
        max_distance_km=req.maxDistanceKm
    )

@router.get("/forecast/{crop_id}", response_model=ForecastResponse)
def get_price_forecast(crop_id: str):
    """
    Returns 30-day Time-Series price forecasting curve with confidence bounds and AI 'Sell vs. Store' advisory.
    """
    crop = db.commodities.get(crop_id.lower())
    if not crop:
        raise HTTPException(status_code=404, detail=f"Crop '{crop_id}' not found")
    
    return ml_engine.get_forecast_advisory(crop_id=crop_id.lower())
