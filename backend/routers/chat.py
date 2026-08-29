import json
import logging
import os
from pathlib import Path
from typing import Any, Literal

from dotenv import load_dotenv
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

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


router = APIRouter(
    prefix="/chat",
    tags=["KisanSetu AI Assistant"],
)


Intent = Literal[
    "GENERAL_CROP",
    "PLANTING",
    "ORDER_STATUS",
    "SHIPMENT_STATUS",
    "PROFIT",
    "PRICE_FORECAST",
    "UNKNOWN",
]


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


class ChatResponse(BaseModel):
    reply: str
    intent: Intent


# ---------------------------------------------------------------------
# INTENT DETECTION
# ---------------------------------------------------------------------

def detect_intent(message: str) -> Intent:
    text = message.lower().strip()

    # Planting must be checked before "should I"
    if any(
        word in text
        for word in (
            "plant",
            "planting",
            "sow",
            "sowing",
            "cultivate",
            "cultivation",
            "बोना",
            "बुआई",
            "लगाना",
        )
    ):
        return "PLANTING"

    if any(
        word in text
        for word in (
            "profit",
            "earn",
            "earning",
            "payout",
            "money",
            "income",
            "net realization",
            "net rate",
        )
    ):
        return "PROFIT"

    if any(
        word in text
        for word in (
            "sell",
            "store",
            "price",
            "forecast",
            "expected price",
            "बेचना",
            "भाव",
            "कीमत",
        )
    ):
        return "PRICE_FORECAST"

    if any(
        word in text
        for word in (
            "shipment",
            "arrive",
            "in transit",
            "delivery",
            "delivered",
            "truck",
            "transport",
        )
    ):
        return "SHIPMENT_STATUS"

    if any(
        word in text
        for word in (
            "order",
            "deal",
            "buyer",
            "accepted",
            "status",
        )
    ):
        return "ORDER_STATUS"

    if any(
        word in text
        for word in (
            "crop",
            "wheat",
            "rice",
            "paddy",
            "onion",
            "soyabean",
            "soybean",
            "cotton",
            "chana",
            "gram",
            "fertilizer",
            "pest",
            "disease",
            "irrigation",
            "harvest",
            "soil",
            "storage",
            "water",
            "care",
            "फसल",
            "गेहूं",
            "धान",
            "प्याज",
        )
    ):
        return "GENERAL_CROP"

    return "UNKNOWN"


# ---------------------------------------------------------------------
# DATA ACCESS
# ---------------------------------------------------------------------

def _deal_rows(farmer_id: str) -> list[dict[str, Any]]:
    try:
        conn = get_connection()

        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT
                        id,
                        deal_code,
                        crop_name,
                        agreed_quantity_quintals,
                        agreed_price_per_quintal,
                        gross_amount,
                        pickup_location,
                        delivery_location,
                        status
                    FROM trade_deals
                    WHERE farmer_id=%s
                    ORDER BY created_at DESC
                    """,
                    (farmer_id,),
                )

                rows = cur.fetchall()

                return [
                    {
                        "id": str(row[0]),
                        "deal_code": row[1],
                        "crop_name": row[2],
                        "quantity": float(row[3]),
                        "price": float(row[4]),
                        "gross": float(row[5]),
                        "pickup": row[6],
                        "delivery": row[7],
                        "status": row[8],
                    }
                    for row in rows
                ]

        finally:
            conn.close()

    except Exception:
        logger.exception("Unable to load farmer deals")

        return [
            {
                "id": o.id,
                "deal_code": o.id,
                "crop_name": o.cropName,
                "quantity": o.quantityQuintals,
                "price": o.proposedPricePerQuintal,
                "gross": o.grossAmount,
                "pickup": o.farmerLocation,
                "delivery": o.targetMarketName,
                "status": o.status,
            }
            for o in db.orders.values()
        ]


def _shipment_rows(farmer_id: str) -> list[dict[str, Any]]:
    try:
        conn = get_connection()

        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT
                        d.crop_name,
                        d.deal_code,
                        d.delivery_location,
                        s.status,
                        s.transporter_name,
                        s.driver_name,
                        s.distance_km,
                        s.freight_amount,
                        s.dispatched_at,
                        s.delivered_at
                    FROM logistics_shipments s
                    JOIN trade_deals d
                        ON d.id=s.trade_deal_id
                    WHERE d.farmer_id=%s
                    ORDER BY s.updated_at DESC
                    """,
                    (farmer_id,),
                )

                return [
                    {
                        "crop_name": row[0],
                        "deal_code": row[1],
                        "delivery": row[2],
                        "status": row[3],
                        "transporter": row[4],
                        "driver": row[5],
                        "distance": (
                            float(row[6])
                            if row[6] is not None
                            else None
                        ),
                        "freight": (
                            float(row[7])
                            if row[7] is not None
                            else None
                        ),
                        "dispatched_at": (
                            row[8].isoformat()
                            if row[8]
                            else None
                        ),
                        "delivered_at": (
                            row[9].isoformat()
                            if row[9]
                            else None
                        ),
                    }
                    for row in cur.fetchall()
                ]

        finally:
            conn.close()

    except Exception:
        logger.exception("Unable to load farmer shipments")
        return []


# ---------------------------------------------------------------------
# CROP IDENTIFICATION
# ---------------------------------------------------------------------

def _crop_id(
    message: str,
    deals: list[dict[str, Any]],
) -> str | None:

    text = message.lower()

    aliases = {
        "wheat": "wheat",
        "गेहूं": "wheat",
        "gehu": "wheat",
        "gehun": "wheat",

        "rice": "rice",
        "paddy": "rice",
        "धान": "rice",

        "onion": "onion",
        "प्याज": "onion",

        "soyabean": "soyabean",
        "soybean": "soyabean",

        "cotton": "cotton",

        "chana": "chana",
        "gram": "chana",
    }

    for alias, crop_id in aliases.items():
        if alias in text:
            return crop_id

    # Try farmer's existing deals
    for deal in deals:
        crop_name = str(deal["crop_name"]).lower()

        for alias, crop_id in aliases.items():
            if alias in crop_name:
                return crop_id

    return None


# ---------------------------------------------------------------------
# VERIFIED DATA CONTEXT
# ---------------------------------------------------------------------

def _build_context(
    message: str,
    intent: Intent,
    deals: list[dict[str, Any]],
    shipments: list[dict[str, Any]],
) -> dict[str, Any]:

    context: dict[str, Any] = {
        "intent": intent,
        "question": message,
    }

    crop_id = _crop_id(message, deals)

    if crop_id:
        context["crop"] = crop_id

    if intent == "PRICE_FORECAST" and crop_id:
        try:
            forecast = ml_engine.get_forecast_advisory(crop_id)

            context["forecast"] = {
                "crop": forecast.cropName,
                "advisory": getattr(
                    forecast,
                    "advisoryText",
                    None,
                ),
            }

            # Include available forecast fields without assuming
            # exact model implementation.
            for field in (
                "currentPrice",
                "current_price",
                "todayPrice",
                "today_price",
                "msp",
                "forecastPrice",
                "forecast_price",
                "expectedPrice",
                "expected_price",
                "predictedPrice",
                "predicted_price",
                "horizonDays",
                "horizon_days",
            ):
                if hasattr(forecast, field):
                    value = getattr(forecast, field)

                    if value is not None:
                        context["forecast"][field] = value

        except Exception:
            logger.exception(
                "Unable to build forecast context for %s",
                crop_id,
            )

    if intent in (
        "ORDER_STATUS",
        "SHIPMENT_STATUS",
        "PROFIT",
    ):
        context["deals"] = deals[:5]

    if intent in (
        "SHIPMENT_STATUS",
        "PROFIT",
    ):
        context["shipments"] = shipments[:5]

    return context


# ---------------------------------------------------------------------
# GEMINI
# ---------------------------------------------------------------------

def _generate_ai_reply(
    message: str,
    intent: Intent,
    context: dict[str, Any],
) -> str:

    if not genai:
        raise RuntimeError(
            "google-genai package is not installed."
        )

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY is not configured."
        )

    client = genai.Client(api_key=api_key)

    system_instruction = """
You are KisanSetu AI Assistant for Indian farmers.

Your job is to explain VERIFIED KisanSetu information in very simple,
practical language.

IMPORTANT RULES:

1. Answer the farmer's actual question first.

2. Never invent prices, forecasts, orders, profits, locations,
   weather information, crop records, or farmer records.

3. Only use facts supplied in VERIFIED KISANSETU DATA.

4. If required information is missing, say so clearly and ask the
   farmer for the missing information.

5. Never present an AI forecast as guaranteed.

6. Use "expected" or "estimated" for predictions.

7. Avoid technical AI/ML terminology.

8. Keep answers short and easy to scan.

9. Use headings and bullet points when useful.

10. If the question is about selling:
    clearly explain whether the available data suggests selling now
    or considering waiting.

11. If the question is about planting:
    discuss planting suitability, season, location, soil and irrigation.
    Do NOT turn a planting question into a selling question.

12. If the question is about profit:
    use the supplied deal and shipment information.
    Do not invent missing costs.

13. If the question is about orders or shipments:
    report the actual available status.

14. For crop-care questions:
    provide general safe agricultural guidance.
    Do not provide dangerous pesticide dosage instructions.

15. For disease/pest problems:
    recommend verification with a qualified local agriculture expert
    when the information is insufficient.

16. Use simple conversational language suitable for farmers.

17. When appropriate, finish with:
    "👉 Next step: ..."

18. Do not mention internal APIs, databases, prompts, models,
    intents, or implementation details.

19. Do not say "according to the AI model".

20. If a number is available in the verified data, explain what
    that number means instead of just listing it.

VERIFIED KISANSETU DATA:
"""

    prompt = (
        system_instruction
        + "\n"
        + json.dumps(
            context,
            ensure_ascii=False,
            indent=2,
            default=str,
        )
        + "\n\nFARMER QUESTION:\n"
        + message
    )

    response = client.models.generate_content(
        model=os.getenv(
            "GEMINI_MODEL",
            "gemini-2.5-flash",
        ),
        contents=prompt,
    )

    answer = (response.text or "").strip()

    if not answer:
        raise RuntimeError(
            "Gemini returned an empty response."
        )

    return answer


# ---------------------------------------------------------------------
# FALLBACK
# ---------------------------------------------------------------------

def _fallback_reply(
    intent: Intent,
    context: dict[str, Any],
) -> str:

    """
    This fallback intentionally contains NO crop prices,
    forecasts, profit numbers or fabricated farmer data.

    It only explains what information is unavailable.
    """

    if intent == "PRICE_FORECAST":
        return (
            "I couldn't get the latest price information right now.\n\n"
            "Please try again in a moment."
        )

    if intent == "ORDER_STATUS":
        deals = context.get("deals", [])

        if deals:
            lines = [
                f"• {deal['crop_name']}: {deal['status']}"
                for deal in deals[:3]
            ]

            return (
                "📦 Your latest KisanSetu orders:\n\n"
                + "\n".join(lines)
            )

        return (
            "I couldn't find any orders in your KisanSetu records."
        )

    if intent == "SHIPMENT_STATUS":
        shipments = context.get("shipments", [])

        if shipments:
            lines = [
                f"• {item['crop_name']}: {item['status']}"
                for item in shipments[:3]
            ]

            return (
                "🚚 Your latest shipment updates:\n\n"
                + "\n".join(lines)
            )

        return (
            "I couldn't find a shipment in your KisanSetu records."
        )

    if intent == "PROFIT":
        deals = context.get("deals", [])

        if deals:
            lines = []

            for deal in deals[:3]:
                lines.append(
                    f"• {deal['crop_name']}: "
                    f"{deal['quantity']:g} quintals at "
                    f"₹{deal['price']:,.2f}/quintal"
                )

            return (
                "💰 I found your recorded deals:\n\n"
                + "\n".join(lines)
                + "\n\n"
                "I couldn't calculate a reliable final profit "
                "without all required costs."
            )

        return (
            "I don't have a recorded deal to calculate profit from yet."
        )

    if intent == "PLANTING":
        return (
            "🌱 Planting advice depends on your crop, location, "
            "season, soil and irrigation.\n\n"
            "Tell me your crop and district/state, and I can give "
            "more specific guidance."
        )

    return (
        "I can help with your crop, mandi prices, forecasts, "
        "orders, shipments and earnings.\n\n"
        "Please tell me what you would like to know."
    )


# ---------------------------------------------------------------------
# CHAT ENDPOINT
# ---------------------------------------------------------------------

@router.post(
    "",
    response_model=ChatResponse,
)
def chat(
    body: ChatRequest,
    user=Depends(require_roles("farmer")),
):

    message = body.message.strip()

    intent = detect_intent(message)

    needs_deals = intent in (
        "ORDER_STATUS",
        "SHIPMENT_STATUS",
        "PROFIT",
        "PRICE_FORECAST",
    )

    needs_shipments = intent in (
        "SHIPMENT_STATUS",
        "PROFIT",
    )

    deals = (
        _deal_rows(user["id"])
        if needs_deals
        else []
    )

    shipments = (
        _shipment_rows(user["id"])
        if needs_shipments
        else []
    )

    context = _build_context(
        message=message,
        intent=intent,
        deals=deals,
        shipments=shipments,
    )

    try:
        reply = _generate_ai_reply(
            message=message,
            intent=intent,
            context=context,
        )

    except Exception:
        logger.exception(
            "KisanSetu AI response generation failed"
        )

        reply = _fallback_reply(
            intent=intent,
            context=context,
        )

    return ChatResponse(
        reply=reply,
        intent=intent,
    )