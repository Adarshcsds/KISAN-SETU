import os
import pandas as pd

from backend.database import get_connection


# =========================================================
# CROP → POSTGRESQL COMMODITY NAME
# =========================================================

CROPS = {
    "wheat": "Wheat",
    "soyabean": "Soyabean",
    "onion": "Onion",
    "cotton": "Cotton",
    "chana": "Bengal Gram (Gram)(Whole)",
    "rice": "Rice",
}


# =========================================================
# OUTPUT DIRECTORY
# =========================================================

OUTPUT_DIR = "data/processed"


# =========================================================
# PREPARE ONE CROP
# =========================================================

def prepare_crop(crop_id, db_commodity, connection):

    print()
    print("=" * 60)
    print(f"Preparing ML dataset: {crop_id.upper()}")
    print(f"PostgreSQL commodity: {db_commodity}")
    print("=" * 60)

    query = """
        SELECT
            date,
            AVG(modal_price) AS avg_price,
            MIN(modal_price) AS min_price,
            MAX(modal_price) AS max_price,
            COUNT(*) AS mandi_count,
            COALESCE(SUM(arrival_quantity), 0) AS arrival_quantity
        FROM market_prices
        WHERE LOWER(TRIM(commodity)) = LOWER(TRIM(%s))
          AND date <= CURRENT_DATE
          AND modal_price IS NOT NULL
          AND modal_price > 0
        GROUP BY date
        ORDER BY date
    """

    df = pd.read_sql(
        query,
        connection,
        params=[db_commodity]
    )

    print(f"Observed dates: {len(df)}")

    if df.empty:
        print(f"WARNING: No data found for {crop_id}")
        return False

    # =====================================================
    # DATE
    # =====================================================

    df["date"] = pd.to_datetime(df["date"])

    df = (
        df
        .sort_values("date")
        .drop_duplicates("date")
        .reset_index(drop=True)
    )

    # =====================================================
    # TIME BETWEEN OBSERVATIONS
    # =====================================================

    df["days_since_previous"] = (
        df["date"]
        .diff()
        .dt.days
        .fillna(0)
    )

    # =====================================================
    # CALENDAR FEATURES
    # =====================================================

    df["day"] = df["date"].dt.day
    df["month"] = df["date"].dt.month
    df["day_of_week"] = df["date"].dt.dayofweek
    df["day_of_year"] = df["date"].dt.dayofyear

    # =====================================================
    # LAG FEATURES
    # =====================================================

    df["lag_1"] = df["avg_price"].shift(1)
    df["lag_2"] = df["avg_price"].shift(2)
    df["lag_3"] = df["avg_price"].shift(3)
    df["lag_7"] = df["avg_price"].shift(7)
    df["lag_14"] = df["avg_price"].shift(14)

    # =====================================================
    # ROLLING FEATURES
    # =====================================================

    df["ma_3"] = (
        df["avg_price"]
        .rolling(3)
        .mean()
    )

    df["ma_7"] = (
        df["avg_price"]
        .rolling(7)
        .mean()
    )

    df["ma_14"] = (
        df["avg_price"]
        .rolling(14)
        .mean()
    )

    df["std_7"] = (
        df["avg_price"]
        .rolling(7)
        .std()
    )

    # =====================================================
    # PRICE CHANGE FEATURES
    # =====================================================

    df["change_1"] = (
        df["avg_price"] /
        df["lag_1"] - 1
    )

    df["change_3"] = (
        df["avg_price"] /
        df["lag_3"] - 1
    )

    # =====================================================
    # REMOVE ROWS WITHOUT ENOUGH HISTORY
    # =====================================================

    df = (
        df
        .dropna()
        .reset_index(drop=True)
    )

    # =====================================================
    # SAVE
    # =====================================================

    os.makedirs(
        OUTPUT_DIR,
        exist_ok=True
    )

    output_file = os.path.join(
        OUTPUT_DIR,
        f"{crop_id}_observed.csv"
    )

    df.to_csv(
        output_file,
        index=False
    )

    print()
    print(f"Dataset created successfully")
    print(f"Crop      : {crop_id}")
    print(f"Rows      : {len(df)}")
    print(f"Columns   : {len(df.columns)}")
    print(f"Date range: {df['date'].min().date()} -> {df['date'].max().date()}")
    print(f"Saved     : {output_file}")

    print()
    print("Columns:")
    print(df.columns.tolist())

    print()
    print("Last 5 observations:")

    print(
        df[
            [
                "date",
                "avg_price",
                "min_price",
                "max_price",
                "arrival_quantity",
                "lag_1",
                "ma_7",
                "change_1"
            ]
        ]
        .tail(5)
        .to_string(index=False)
    )

    return True


# =========================================================
# PREPARE ALL CROPS
# =========================================================

def prepare_dataset():

    print()
    print("=" * 65)
    print("KISANSETU - MULTI CROP ML DATA PREPARATION")
    print("=" * 65)

    print()
    print("Crops to process:")

    for crop_id, commodity in CROPS.items():
        print(f"  {crop_id:<12} -> {commodity}")

    connection = None

    try:

        connection = get_connection()

        successful = []
        failed = []

        for crop_id, db_commodity in CROPS.items():

            try:

                success = prepare_crop(
                    crop_id,
                    db_commodity,
                    connection
                )

                if success:
                    successful.append(crop_id)
                else:
                    failed.append(crop_id)

            except Exception as error:

                print()
                print(
                    f"ERROR while processing {crop_id}:"
                )

                print(error)

                failed.append(crop_id)

    finally:

        if connection:
            connection.close()

    # =====================================================
    # FINAL SUMMARY
    # =====================================================

    print()
    print("=" * 65)
    print("MULTI-CROP DATA PREPARATION COMPLETE")
    print("=" * 65)

    print()
    print(f"Successful crops: {len(successful)}")

    for crop in successful:
        print(f"  ✓ {crop}")

    if failed:

        print()
        print(f"Failed crops: {len(failed)}")

        for crop in failed:
            print(f"  ✗ {crop}")

    print()
    print("Processed datasets are located in:")
    print(OUTPUT_DIR)


# =========================================================
# ENTRY POINT
# =========================================================

if __name__ == "__main__":
    prepare_dataset()