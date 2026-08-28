import os
import logging
from pathlib import Path
from typing import Any, Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from backend.auth import require_roles
from backend.data_store import db
from backend.database import get_connection
from backend.ml_engine import ml_engine

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

logger = logging.getLogger(__name__)

try:
    from google import genai
except ImportError:
    genai = None

router = APIRouter(prefix="/chat", tags=["KisanSetu AI Assistant"])
Intent = Literal["GENERAL_CROP", "ORDER_STATUS", "SHIPMENT_STATUS", "PROFIT", "PRICE_FORECAST", "UNKNOWN"]


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


class ChatResponse(BaseModel):
    reply: str
    intent: Intent


def detect_intent(message: str) -> Intent:
    text = message.lower()
    if any(word in text for word in ("profit", "earn", "receive", "payout", "money", "net realization", "net rate")):
        return "PROFIT"
    if any(word in text for word in ("sell", "store", "price increase", "price forecast", "forecast", "should i")):
        return "PRICE_FORECAST"
    if any(word in text for word in ("shipment", "arrive", "in transit", "delivery", "delivered", "truck", "transport")):
        return "SHIPMENT_STATUS"
    if any(word in text for word in ("order", "deal", "buyer", "accepted", "status")):
        return "ORDER_STATUS"
    if any(word in text for word in ("grow", "crop", "wheat", "rice", "onion", "soyabean", "cotton", "fertilizer", "pest", "disease", "irrigation", "harvest", "soil", "storage")):
        return "GENERAL_CROP"
    return "UNKNOWN"


def _deal_rows(farmer_id: str) -> list[dict[str, Any]]:
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT id, deal_code, crop_name, agreed_quantity_quintals,
                    agreed_price_per_quintal, gross_amount, pickup_location,
                    delivery_location, status
                   FROM trade_deals WHERE farmer_id=%s ORDER BY created_at DESC""",
                (farmer_id,),
            )
            return [
                {
                    "id": str(row[0]), "deal_code": row[1], "crop_name": row[2],
                    "quantity": float(row[3]), "price": float(row[4]), "gross": float(row[5]),
                    "pickup": row[6], "delivery": row[7], "status": row[8],
                }
                for row in cur.fetchall()
            ]
    finally:
        conn.close()


def _shipment_rows(farmer_id: str) -> list[dict[str, Any]]:
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT d.crop_name, d.deal_code, d.delivery_location, s.status,
                    s.transporter_name, s.driver_name, s.distance_km, s.freight_amount,
                    s.dispatched_at, s.delivered_at
                   FROM logistics_shipments s
                   JOIN trade_deals d ON d.id=s.trade_deal_id
                   WHERE d.farmer_id=%s ORDER BY s.updated_at DESC""",
                (farmer_id,),
            )
            return [
                {
                    "crop_name": row[0], "deal_code": row[1], "delivery": row[2], "status": row[3],
                    "transporter": row[4], "driver": row[5], "distance": float(row[6]) if row[6] is not None else None,
                    "freight": float(row[7]) if row[7] is not None else None,
                    "dispatched_at": row[8].isoformat() if row[8] else None,
                    "delivered_at": row[9].isoformat() if row[9] else None,
                }
                for row in cur.fetchall()
            ]
    finally:
        conn.close()


def _crop_id(message: str, deals: list[dict[str, Any]]) -> str | None:
    text = message.lower()
    aliases = {"wheat": "wheat", "rice": "rice", "paddy": "rice", "onion": "onion", "soyabean": "soyabean", "soybean": "soyabean", "cotton": "cotton", "chana": "chana", "gram": "chana"}
    for alias, crop_id in aliases.items():
        if alias in text:
            return crop_id
    for deal in deals:
        for alias, crop_id in aliases.items():
            if alias in deal["crop_name"].lower():
                return crop_id
    return None


def _order_reply(deals: list[dict[str, Any]]) -> str:
    if not deals:
        return "You don't have any active orders yet."
    details = "; ".join(f"{deal['crop_name']} ({deal['deal_code']}): {deal['status']}" for deal in deals[:3])
    return f"Your KisanSetu deals are: {details}."


def _shipment_reply(shipments: list[dict[str, Any]]) -> str:
    if not shipments:
        return "I couldn't find an active shipment for your account."
    details = "; ".join(f"{item['crop_name']} ({item['deal_code']}) is {item['status']} for delivery to {item['delivery']}" for item in shipments[:3])
    return f"Shipment update: {details}."


def _profit_reply(deals: list[dict[str, Any]], shipments: list[dict[str, Any]]) -> str:
    if not deals:
        return "You don't have any active deals to calculate profit from yet."
    lines = []
    for deal in deals[:3]:
        shipment = next((item for item in shipments if item["deal_code"] == deal["deal_code"]), None)
        freight = shipment["freight"] if shipment else None
        net = deal["gross"] - freight if freight is not None else None
        lines.append(f"{deal['crop_name']}: {deal['quantity']:g} quintals at ₹{deal['price']:,.2f}/quintal; gross amount ₹{deal['gross']:,.2f}; freight ₹{freight:,.2f}; estimated net realization ₹{net:,.2f}." if net is not None else f"{deal['crop_name']}: {deal['quantity']:g} quintals at ₹{deal['price']:,.2f}/quintal; gross amount ₹{deal['gross']:,.2f}. Freight and other deductions are not recorded yet, so I cannot calculate a reliable net amount.")
    return "Based on your recorded KisanSetu deal data: " + " ".join(lines)


def _forecast_reply(message: str, deals: list[dict[str, Any]]) -> str:
    crop_id = _crop_id(message, deals)
    if not crop_id or crop_id not in db.commodities:
        return "Please mention the crop you want a sell-or-store forecast for."
    forecast = ml_engine.get_forecast_advisory(crop_id)
    return f"KisanSetu forecast for {forecast.cropName}: {forecast.advisoryText} This is an AI advisory based on the current forecast, not a guaranteed future price."


def _general_reply(message: str) -> str:
    if not genai or not os.getenv("GEMINI_API_KEY"):
        return "Sorry, the AI assistant is temporarily unavailable. Please try again."
    try:
        client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
        response = client.models.generate_content(
            model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
            contents=("You are KisanSetu AI Assistant for Indian farmers. Answer simply, practically, and concisely. "
                      "Avoid unsafe pesticide dosage instructions. For serious disease identification, advise verification by a local agriculture officer. "
                      f"Farmer question: {message}"),
        )
        return (response.text or "Sorry, I could not prepare an answer right now.").strip()
    except Exception:
        logger.exception(
            "Gemini request failed (sdk=google-genai, model=%s, key_present=%s)",
            os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
            bool(os.getenv("GEMINI_API_KEY")),
        )
        return "Sorry, the AI assistant is temporarily unavailable. Please try again."


@router.post("", response_model=ChatResponse)
def chat(body: ChatRequest, user=Depends(require_roles("farmer"))):
    intent = detect_intent(body.message)
    deals = _deal_rows(user["id"]) if intent in ("ORDER_STATUS", "SHIPMENT_STATUS", "PROFIT", "PRICE_FORECAST") else []
    shipments = _shipment_rows(user["id"]) if intent in ("SHIPMENT_STATUS", "PROFIT") else []
    if intent == "ORDER_STATUS":
        reply = _order_reply(deals)
    elif intent == "SHIPMENT_STATUS":
        reply = _shipment_reply(shipments)
    elif intent == "PROFIT":
        reply = _profit_reply(deals, shipments)
    elif intent == "PRICE_FORECAST":
        reply = _forecast_reply(body.message, deals)
    elif intent in ("GENERAL_CROP", "UNKNOWN"):
        reply = _general_reply(body.message)
    else:
        reply = "I can help with crop care, orders, shipments, profit, and price forecasts."
    return ChatResponse(reply=reply, intent=intent)
