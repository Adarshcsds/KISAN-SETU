"""
KisanSetu - Daily Government Mandi Data Importer

Source:
    data.gov.in
    Current Daily Price of Various Commodities from Various Markets (Mandi)

Purpose:
    Fetch today's real Maharashtra mandi prices and store them in PostgreSQL.

Rules:
    1. Only today's API records are inserted.
    2. Future-dated records are rejected.
    3. Historical records are ignored.
    4. Duplicate records are ignored using PostgreSQL's unique index.
    5. No fake/mock market prices are generated.
    6. API key is loaded from .env.
"""

import json
import os
import subprocess
from datetime import date, datetime
from urllib.parse import urlencode

import psycopg2
from dotenv import load_dotenv


# =========================================================
# LOAD ENVIRONMENT
# =========================================================

load_dotenv()


# =========================================================
# CONFIGURATION
# =========================================================

API_URL = (
    "https://api.data.gov.in/resource/"
    "9ef84268-d588-465a-a308-a864a43d0070"
)

STATE = "Maharashtra"
BATCH_SIZE = 100


# =========================================================
# DATABASE CONFIGURATION
# =========================================================

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432"),
    "database": os.getenv("DB_NAME", "kisanmitra"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv(
        "DB_PASSWORD",
        "KisanMitra123"
    ),
}


# =========================================================
# DATE CONVERSION
# =========================================================

def convert_date(value: str) -> date:
    """
    Convert API date:

        25/08/2026

    into Python date:

        2026-08-25
    """

    return datetime.strptime(
        value,
        "%d/%m/%Y"
    ).date()


# =========================================================
# API REQUEST
# =========================================================

def api_request(
    api_key: str,
    offset: int,
    retries: int = 3
):
    """
    Fetch one page from data.gov.in.

    Retries temporary API/network failures
    before giving up.
    """

    params = {
        "api-key": api_key,
        "format": "json",
        "limit": BATCH_SIZE,
        "offset": offset,
        "filters[state.keyword]": STATE,
    }

    url = f"{API_URL}?{urlencode(params)}"

    last_error = None

    for attempt in range(1, retries + 1):

        try:

            print(
                f"  Attempt {attempt}/{retries}"
            )

            result = subprocess.run(
                [
                    "curl.exe",
                    "-s",
                    "--fail",
                    "--max-time",
                    "120",
                    url,
                ],
                capture_output=True,
                text=True,
                timeout=130,
                check=True,
            )

            if not result.stdout.strip():
                raise RuntimeError(
                    "API returned an empty response."
                )

            return json.loads(
                result.stdout
            )

        except (
            subprocess.CalledProcessError,
            subprocess.TimeoutExpired,
            json.JSONDecodeError,
            RuntimeError,
        ) as error:

            last_error = error

            print(
                f"  Request failed: {error}"
            )

            if attempt < retries:

                print(
                    "  Retrying..."
                )

    raise RuntimeError(
        f"Data.gov.in request failed "
        f"after {retries} attempts."
    ) from last_error

# =========================================================
# FETCH TODAY'S DATA
# =========================================================

def fetch_today_data(
    today: date
):
    """
    Fetch all Maharashtra records from the API.

    The API's arrival_date is checked locally.

    This is intentional because the API's
    arrival_date filter did not reliably return
    the expected result.

    Returns:

        records
        total_api_records
    """

    api_key = os.getenv(
        "DATA_GOV_API_KEY"
    )

    if not api_key:

        raise RuntimeError(
            "DATA_GOV_API_KEY is not set.\n"
            "Add it to the .env file."
        )

    print()
    print("=" * 60)
    print("FETCHING GOVERNMENT MANDI DATA")
    print("=" * 60)

    print(
        f"Target date : {today}"
    )

    print(
        f"State       : {STATE}"
    )

    print(
        "Source      : data.gov.in"
    )

    all_records = []

    offset = 0
    total = None

    while True:

        print(
            f"Requesting offset {offset}..."
        )

        payload = api_request(
            api_key,
            offset
        )

        records = payload.get(
            "records",
            []
        )

        if total is None:

            total = int(
                payload.get(
                    "total",
                    0
                )
            )

            print(
                f"API total records: {total}"
            )

        if not records:

            break

        all_records.extend(
            records
        )

        print(
            f"Fetched: "
            f"{len(all_records)}/{total}"
        )

        offset += BATCH_SIZE

        if offset >= total:

            break

    print(
        f"Total records downloaded: "
        f"{len(all_records)}"
    )

    return (
        all_records,
        total or 0
    )


# =========================================================
# INSERT TODAY'S RECORDS
# =========================================================

def insert_today_records(
    connection,
    records,
    today: date
):
    """
    Insert only records whose arrival_date
    exactly matches today.

    Database protection:

        market_prices_unique_daily

    prevents duplicate:

        state
        district
        market
        commodity
        variety
        grade
        date
    """

    counters = {
        "api_records": len(records),
        "today": 0,
        "future": 0,
        "historical": 0,
        "invalid": 0,
        "duplicates": 0,
        "inserted": 0,
    }

    query = """
        INSERT INTO market_prices
        (
            state,
            district,
            market,
            commodity,
            variety,
            grade,
            date,
            min_price,
            max_price,
            modal_price,
            arrival_quantity
        )
        VALUES
        (
            %s,
            %s,
            %s,
            %s,
            %s,
            %s,
            %s,
            %s,
            %s,
            %s,
            %s
        )

        ON CONFLICT
        (
            state,
            district,
            market,
            commodity,
            variety,
            grade,
            date
        )

        DO NOTHING

        RETURNING id
    """

    with connection.cursor() as cursor:

        for record in records:

            try:

                # -----------------------------------------
                # Required fields
                # -----------------------------------------

                record_date = convert_date(
                    record["arrival_date"]
                )

                state = record["state"]
                district = record["district"]
                market = record["market"]
                commodity = record["commodity"]

                variety = record.get(
                    "variety"
                )

                grade = record.get(
                    "grade"
                )

                min_price = float(
                    record["min_price"]
                )

                max_price = float(
                    record["max_price"]
                )

                modal_price = float(
                    record["modal_price"]
                )

                # -----------------------------------------
                # Reject invalid prices
                # -----------------------------------------

                if min_price < 0:
                    raise ValueError(
                        "Negative minimum price"
                    )

                if max_price < 0:
                    raise ValueError(
                        "Negative maximum price"
                    )

                if modal_price < 0:
                    raise ValueError(
                        "Negative modal price"
                    )

                # -----------------------------------------
                # Reject logically impossible prices
                # -----------------------------------------

                if min_price > max_price:

                    raise ValueError(
                        "min_price > max_price"
                    )

                if not (
                    min_price
                    <= modal_price
                    <= max_price
                ):

                    raise ValueError(
                        "modal_price outside "
                        "min/max range"
                    )

                # -----------------------------------------
                # DATE VALIDATION
                # -----------------------------------------

                if record_date > today:

                    counters["future"] += 1

                    continue

                if record_date < today:

                    counters["historical"] += 1

                    continue

                # This is genuinely today's data.
                counters["today"] += 1

                # -----------------------------------------
                # INSERT
                # -----------------------------------------

                cursor.execute(
                    query,
                    (
                        state,
                        district,
                        market,
                        commodity,
                        variety,
                        grade,
                        record_date,
                        min_price,
                        max_price,
                        modal_price,

                        # API does not provide arrival
                        # quantity.
                        #
                        # Therefore:
                        # DO NOT INVENT IT.
                        None,
                    )
                )

                inserted_row = cursor.fetchone()

                if inserted_row:

                    counters["inserted"] += 1

                else:

                    counters["duplicates"] += 1

            except (
                KeyError,
                TypeError,
                ValueError
            ) as error:

                counters["invalid"] += 1

                print(
                    "Skipping invalid API record:"
                )

                print(
                    f"  {error}"
                )

    connection.commit()

    return counters


# =========================================================
# DATABASE CONNECTION
# =========================================================

def connect_database():

    print()
    print(
        "Connecting to PostgreSQL..."
    )

    connection = psycopg2.connect(
        **DB_CONFIG
    )

    print(
        "PostgreSQL connected."
    )

    return connection


# =========================================================
# MAIN
# =========================================================

def main():

    today = date.today()

    print()
    print("=" * 60)
    print("KISANSETU DAILY MARKET DATA IMPORT")
    print("=" * 60)

    print(
        f"Today: {today}"
    )

    try:

        # ---------------------------------------------
        # Fetch API data
        # ---------------------------------------------

        records, total = fetch_today_data(
            today
        )

        # ---------------------------------------------
        # Connect database
        # ---------------------------------------------

        connection = connect_database()

        try:

            counters = insert_today_records(
                connection,
                records,
                today
            )

        finally:

            connection.close()

        # ---------------------------------------------
        # REPORT
        # ---------------------------------------------

        print()
        print("=" * 60)
        print("IMPORT RESULT")
        print("=" * 60)

        print(
            f"API records received : "
            f"{counters['api_records']}"
        )

        print(
            f"Today's records      : "
            f"{counters['today']}"
        )

        print(
            f"Records inserted     : "
            f"{counters['inserted']}"
        )

        print(
            f"Duplicates skipped   : "
            f"{counters['duplicates']}"
        )

        print(
            f"Historical skipped   : "
            f"{counters['historical']}"
        )

        print(
            f"Future rejected      : "
            f"{counters['future']}"
        )

        print(
            f"Invalid skipped      : "
            f"{counters['invalid']}"
        )

        print("=" * 60)

        if counters["inserted"] == 0:

            if counters["duplicates"] > 0:

                print(
                    "Today's data already exists "
                    "in PostgreSQL."
                )

            elif counters["today"] == 0:

                print(
                    "No actual data for today "
                    "was available from the API."
                )

        else:

            print(
                "Today's government mandi data "
                "was successfully stored."
            )

        return 0

    except (
        RuntimeError,
        psycopg2.Error
    ) as error:

        print()
        print(
            "MARKET DATA IMPORT FAILED"
        )

        print(
            error
        )

        return 1


# =========================================================
# ENTRY POINT
# =========================================================

if __name__ == "__main__":

    raise SystemExit(
        main()
    )