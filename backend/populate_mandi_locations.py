import os
import time
import requests
import psycopg2
from dotenv import load_dotenv

load_dotenv()

# =========================================================
# DATABASE
# =========================================================

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432"),
    "dbname": os.getenv("DB_NAME", "kisanmitra"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD"),
}

# OpenStreetMap Nominatim
GEOCODING_URL = "https://nominatim.openstreetmap.org/search"

HEADERS = {
    "User-Agent": "KisanSetu/1.0 agricultural mandi locator"
}


# =========================================================
# DATABASE CONNECTION
# =========================================================

def get_connection():
    return psycopg2.connect(**DB_CONFIG)


# =========================================================
# GEOCODE ONE MANDI
# =========================================================

def geocode_mandi(market, district, state):

    queries = [
        f"{market}, {district}, {state}, India",
        f"{market}, {district}, Maharashtra, India",
        f"{district}, Maharashtra, India",
    ]

    for query in queries:

        params = {
            "q": query,
            "format": "json",
            "limit": 1,
            "countrycodes": "in",
        }

        try:

            response = requests.get(
                GEOCODING_URL,
                params=params,
                headers=HEADERS,
                timeout=20,
            )

            response.raise_for_status()

            results = response.json()

            if results:

                return (
                    float(results[0]["lat"]),
                    float(results[0]["lon"]),
                )

        except Exception as error:

            print(
                f"  Geocoding error: {error}"
            )

        time.sleep(1)

    return None


# =========================================================
# MAIN
# =========================================================

def main():

    print("=" * 70)
    print("KISANSETU - MANDI COORDINATE IMPORT")
    print("=" * 70)

    connection = get_connection()

    cursor = connection.cursor()

    # -----------------------------------------------------
    # Get unique markets from actual market data
    # -----------------------------------------------------

    cursor.execute(
        """
        SELECT DISTINCT
            market,
            district,
            state
        FROM market_prices
        WHERE market IS NOT NULL
          AND TRIM(market) <> ''
        ORDER BY market
        """
    )

    markets = cursor.fetchall()

    print(
        f"Unique markets found: {len(markets)}"
    )

    # -----------------------------------------------------
    # Existing coordinates
    # -----------------------------------------------------

    cursor.execute(
        """
        SELECT market, district, state
        FROM mandi_locations
        """
    )

    existing = set(cursor.fetchall())

    print(
        f"Already geocoded: {len(existing)}"
    )

    inserted = 0
    failed = 0
    skipped = 0

    # -----------------------------------------------------
    # Process markets
    # -----------------------------------------------------

    for index, (
        market,
        district,
        state
    ) in enumerate(markets, start=1):

        key = (
            market,
            district,
            state
        )

        print()
        print(
            f"[{index}/{len(markets)}] "
            f"{market} | {district}"
        )

        if key in existing:

            print("  Already exists - skipped")

            skipped += 1

            continue

        coordinates = geocode_mandi(
            market,
            district,
            state
        )

        if coordinates is None:

            print("  COORDINATES NOT FOUND")

            failed += 1

            continue

        latitude, longitude = coordinates

        print(
            f"  Found: "
            f"{latitude:.6f}, "
            f"{longitude:.6f}"
        )

        try:

            cursor.execute(
                """
                INSERT INTO mandi_locations
                (
                    market,
                    district,
                    state,
                    latitude,
                    longitude
                )
                VALUES
                (%s, %s, %s, %s, %s)
                ON CONFLICT
                (market, district, state)
                DO NOTHING
                """,
                (
                    market,
                    district,
                    state,
                    latitude,
                    longitude,
                )
            )

            connection.commit()

            inserted += 1

        except Exception as error:

            connection.rollback()

            print(
                f"  Database error: {error}"
            )

            failed += 1

        # Nominatim usage policy:
        # keep requests slow and respectful.
        time.sleep(1)

    cursor.close()
    connection.close()

    print()
    print("=" * 70)
    print("IMPORT COMPLETE")
    print("=" * 70)

    print(
        f"Inserted : {inserted}"
    )

    print(
        f"Skipped  : {skipped}"
    )

    print(
        f"Failed   : {failed}"
    )

    print("=" * 70)


if __name__ == "__main__":
    main()