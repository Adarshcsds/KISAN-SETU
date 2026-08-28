import math
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("OPENROUTESERVICE_API_KEY")

client = None
try:
    import openrouteservice
    if API_KEY:
        client = openrouteservice.Client(key=API_KEY)
except ImportError:
    client = None


def _haversine_road_distance(lat1: float, lon1: float, lat2: float, lon2: float):
    """Fallback calculation using Haversine with 1.25 road winding factor."""
    r = 6371.0  # Earth radius in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    straight_km = r * c
    # Average Indian road winding factor is ~1.25x straight-line distance
    road_km = round(straight_km * 1.25, 2)
    # Average rural truck speed is ~40-45 km/h (1.4 minutes per km)
    duration_min = round(road_km * 1.4, 1)

    return {
        "distance_km": max(1.0, road_km),
        "duration_minutes": max(2.0, duration_min),
    }


def get_road_distance(
    farmer_lat: float,
    farmer_lon: float,
    mandi_lat: float,
    mandi_lon: float,
):
    """
    Calculate actual road distance and estimated driving time
    between farmer and mandi using OpenRouteService or reliable haversine routing fallback.
    """
    if client:
        try:
            result = client.directions(
                coordinates=[
                    (farmer_lon, farmer_lat),
                    (mandi_lon, mandi_lat),
                ],
                profile="driving-car",
                format="geojson",
            )
            route = result["features"][0]["properties"]["segments"][0]
            distance_km = round(route["distance"] / 1000, 2)
            duration_minutes = round(route["duration"] / 60, 1)
            return {
                "distance_km": distance_km,
                "duration_minutes": duration_minutes,
            }
        except Exception:
            pass

    return _haversine_road_distance(farmer_lat, farmer_lon, mandi_lat, mandi_lon)