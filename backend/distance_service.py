import os
import openrouteservice
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("OPENROUTESERVICE_API_KEY")

if not API_KEY:
    raise RuntimeError("OPENROUTESERVICE_API_KEY is not configured.")

client = openrouteservice.Client(key=API_KEY)


def get_road_distance(
    farmer_lat: float,
    farmer_lon: float,
    mandi_lat: float,
    mandi_lon: float,
):
    """
    Calculate actual road distance and estimated driving time
    between farmer and mandi.
    """

    result = client.directions(
        coordinates=[
            (farmer_lon, farmer_lat),
            (mandi_lon, mandi_lat),
        ],
        profile="driving-car",
        format="geojson",
    )

    route = result["features"][0]["properties"]["segments"][0]

    distance_km = round(
        route["distance"] / 1000,
        2,
    )

    duration_minutes = round(
        route["duration"] / 60,
        1,
    )

    return {
        "distance_km": distance_km,
        "duration_minutes": duration_minutes,
    }