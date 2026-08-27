import os

import pandas as pd
import psycopg2
from psycopg2.extras import execute_values


DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "database": "kisanmitra",
    "user": "postgres",
    "password": "KisanMitra123",
}

CSV_FILES = [
    "data/raw/2025.csv",
    "data/raw/2026.csv",
]

CHUNK_SIZE = 20_000


def clean_chunk(df):
    # Keep Maharashtra only
    df = df[
        df["State"]
        .astype(str)
        .str.strip()
        .str.lower()
        .eq("maharashtra")
    ].copy()

    if df.empty:
        return df

    # Clean text
    for column in [
        "State",
        "District",
        "Market",
        "Commodity",
        "Variety",
        "Grade",
    ]:
        df[column] = (
            df[column]
            .fillna("")
            .astype(str)
            .str.strip()
        )

    # Convert date
    df["Arrival_Date"] = pd.to_datetime(
        df["Arrival_Date"],
        dayfirst=True,
        errors="coerce",
    ).dt.date

    # Convert prices
    for column in [
        "Min_Price",
        "Max_Price",
        "Modal_Price",
    ]:
        df[column] = pd.to_numeric(
            df[column],
            errors="coerce",
        )

    # Remove invalid rows
    df = df.dropna(
        subset=[
            "Arrival_Date",
            "Min_Price",
            "Max_Price",
            "Modal_Price",
        ]
    )

    return df


def import_file(connection, file_path):
    print()
    print("=" * 60)
    print(f"Processing: {file_path}")
    print("=" * 60)

    total_rows = 0
    maharashtra_rows = 0
    inserted_rows = 0

    for chunk_number, chunk in enumerate(
        pd.read_csv(
            file_path,
            chunksize=CHUNK_SIZE,
            low_memory=False,
        ),
        start=1,
    ):
        total_rows += len(chunk)

        cleaned = clean_chunk(chunk)

        maharashtra_rows += len(cleaned)

        if cleaned.empty:
            print(
                f"Chunk {chunk_number}: "
                f"{len(chunk):,} rows -> "
                "0 Maharashtra rows"
            )
            continue

        records = []

        for row in cleaned.itertuples(index=False):
            records.append(
                (
                    row.State,
                    row.District,
                    row.Market,
                    row.Commodity,
                    row.Variety,
                    row.Grade,
                    row.Arrival_Date,
                    float(row.Min_Price),
                    float(row.Max_Price),
                    float(row.Modal_Price),
                )
            )

        with connection.cursor() as cursor:
            execute_values(
                cursor,
                """
                INSERT INTO market_prices (
                    state,
                    district,
                    market,
                    commodity,
                    variety,
                    grade,
                    date,
                    min_price,
                    max_price,
                    modal_price
                )
                SELECT
                    new_data.state,
                    new_data.district,
                    new_data.market,
                    new_data.commodity,
                    new_data.variety,
                    new_data.grade,
                    new_data.date,
                    new_data.min_price,
                    new_data.max_price,
                    new_data.modal_price
                FROM (
                    VALUES %s
                ) AS new_data(
                    state,
                    district,
                    market,
                    commodity,
                    variety,
                    grade,
                    date,
                    min_price,
                    max_price,
                    modal_price
                )
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM market_prices existing
                    WHERE existing.state = new_data.state
                      AND existing.district = new_data.district
                      AND existing.market = new_data.market
                      AND existing.commodity = new_data.commodity
                      AND COALESCE(existing.variety, '') =
                          COALESCE(new_data.variety, '')
                      AND COALESCE(existing.grade, '') =
                          COALESCE(new_data.grade, '')
                      AND existing.date = new_data.date
                      AND existing.min_price = new_data.min_price
                      AND existing.max_price = new_data.max_price
                      AND existing.modal_price = new_data.modal_price
                )
                RETURNING id;
                """,
                records,
                page_size=5000,
            )

            inserted = cursor.rowcount

        connection.commit()

        inserted_rows += inserted

        print(
            f"Chunk {chunk_number}: "
            f"{len(chunk):,} rows -> "
            f"{len(cleaned):,} Maharashtra -> "
            f"{inserted:,} inserted"
        )

    print()
    print(f"Rows read:         {total_rows:,}")
    print(f"Maharashtra rows:  {maharashtra_rows:,}")
    print(f"New rows inserted: {inserted_rows:,}")

    return inserted_rows


def main():
    print("KisanSetu Historical Mandi Data Import")
    print("=" * 60)
    print("Connecting to PostgreSQL...")

    try:
        connection = psycopg2.connect(**DB_CONFIG)
        print("Database connected.")
    except psycopg2.Error as error:
        print("Database connection failed:")
        print(error)
        return

    total_inserted = 0

    try:
        for file_path in CSV_FILES:

            if not os.path.exists(file_path):
                print(f"File not found: {file_path}")
                continue

            total_inserted += import_file(
                connection,
                file_path,
            )

    except (
        pd.errors.ParserError,
        OSError,
        ValueError,
        psycopg2.Error,
    ) as error:

        connection.rollback()

        print()
        print("Import error:")
        print(error)

    finally:
        connection.close()

    print()
    print("=" * 60)
    print("IMPORT COMPLETED")
    print("=" * 60)
    print(
        f"Total new records inserted: "
        f"{total_inserted:,}"
    )


if __name__ == "__main__":
    main()