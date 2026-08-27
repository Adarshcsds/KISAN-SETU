"""
KisanSetu - PostgreSQL based crop price forecasting trainer.

Data source:
    PostgreSQL -> market_prices

Models:
    GradientBoostingRegressor

Crops:
    wheat
    soyabean
    onion
    cotton
    chana
    rice

The trained model package remains compatible with ml_engine.py.
"""

import os
import pickle

import pandas as pd
import psycopg2
from dotenv import load_dotenv
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error


# ============================================================
# LOAD ENVIRONMENT
# ============================================================

load_dotenv()


# ============================================================
# DATABASE CONFIGURATION
# ============================================================

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432"),
    "dbname": os.getenv("DB_NAME", "kisanmitra"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD"),
}


# ============================================================
# MODEL DIRECTORY
# ============================================================

MODEL_DIR = "data/models"


# ============================================================
# CROP -> DATABASE COMMODITY
# ============================================================

CROP_COMMODITIES = {
    "wheat": "Wheat",
    "soyabean": "Soyabean",
    "onion": "Onion",
    "cotton": "Cotton",
    "chana": "Bengal Gram (Gram)(Whole)",
    "rice": "Rice",
}


# ============================================================
# FEATURES
#
# arrival_quantity intentionally removed because the current
# data.gov.in mandi API does not provide it.
# ============================================================

FEATURES = [
    "min_price",
    "max_price",
    "mandi_count",
    "days_since_previous",

    "day",
    "month",
    "day_of_week",
    "day_of_year",

    "lag_1",
    "lag_2",
    "lag_3",
    "lag_7",
    "lag_14",

    "ma_3",
    "ma_7",
    "ma_14",

    "std_7",

    "change_1",
    "change_3",
]


# ============================================================
# DATABASE CONNECTION
# ============================================================

def get_connection():

    print("Connecting to PostgreSQL...")

    connection = psycopg2.connect(**DB_CONFIG)

    print("PostgreSQL connected.")

    return connection


# ============================================================
# GET CROP HISTORY
# ============================================================

def get_crop_history(connection, commodity):

    query = """
        SELECT
            date,
            AVG(modal_price) AS avg_price,
            MIN(min_price) AS min_price,
            MAX(max_price) AS max_price,
            COUNT(*) AS mandi_count
        FROM market_prices
        WHERE LOWER(TRIM(commodity))
              =
              LOWER(TRIM(%s))
          AND modal_price IS NOT NULL
          AND modal_price > 0
          AND date <= CURRENT_DATE
        GROUP BY date
        ORDER BY date;
    """

    df = pd.read_sql_query(
        query,
        connection,
        params=(commodity,)
    )

    if df.empty:
        return df

    df["date"] = pd.to_datetime(df["date"])

    numeric_columns = [
        "avg_price",
        "min_price",
        "max_price",
        "mandi_count",
    ]

    for column in numeric_columns:

        df[column] = pd.to_numeric(
            df[column],
            errors="coerce"
        )

    df = (
        df
        .sort_values("date")
        .dropna(
            subset=[
                "avg_price",
                "min_price",
                "max_price",
                "mandi_count",
            ]
        )
        .reset_index(drop=True)
    )

    return df


# ============================================================
# BUILD FEATURES
# ============================================================

def build_features(df):

    df = df.copy()

    df = (
        df
        .sort_values("date")
        .reset_index(drop=True)
    )

    # --------------------------------------------------------
    # Calendar features
    # --------------------------------------------------------

    df["day"] = df["date"].dt.day

    df["month"] = df["date"].dt.month

    df["day_of_week"] = (
        df["date"].dt.dayofweek
    )

    df["day_of_year"] = (
        df["date"].dt.dayofyear
    )

    # --------------------------------------------------------
    # Time gap
    # --------------------------------------------------------

    df["days_since_previous"] = (
        df["date"]
        .diff()
        .dt.days
        .fillna(1)
    )

    # --------------------------------------------------------
    # Previous observations
    # --------------------------------------------------------

    df["lag_1"] = (
        df["avg_price"].shift(1)
    )

    df["lag_2"] = (
        df["avg_price"].shift(2)
    )

    df["lag_3"] = (
        df["avg_price"].shift(3)
    )

    df["lag_7"] = (
        df["avg_price"].shift(7)
    )

    df["lag_14"] = (
        df["avg_price"].shift(14)
    )

    # --------------------------------------------------------
    # Moving averages
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # Volatility
    # --------------------------------------------------------

    df["std_7"] = (
        df["avg_price"]
        .rolling(7)
        .std()
    )

    # --------------------------------------------------------
    # Price changes
    # --------------------------------------------------------

    df["change_1"] = (
        df["avg_price"]
        .pct_change(1)
    )

    df["change_3"] = (
        df["avg_price"]
        .pct_change(3)
    )

    return df


# ============================================================
# TRAIN ONE CROP
# ============================================================

def train_crop(
    connection,
    crop,
    commodity
):

    print()
    print("=" * 70)
    print(f"TRAINING MODEL: {crop.upper()}")
    print("=" * 70)

    print(f"Database commodity: {commodity}")

    # --------------------------------------------------------
    # Load PostgreSQL data
    # --------------------------------------------------------

    df = get_crop_history(
        connection,
        commodity
    )

    if df.empty:

        print(
            f"No PostgreSQL data found for {commodity}."
        )

        return None

    print(
        f"Rows from PostgreSQL: {len(df)}"
    )

    print(
        f"Date range: "
        f"{df['date'].min().date()} -> "
        f"{df['date'].max().date()}"
    )

    # --------------------------------------------------------
    # Build features
    # --------------------------------------------------------

    df = build_features(df)

    # --------------------------------------------------------
    # Remove rows that don't have enough history
    # --------------------------------------------------------

    df = (
        df
        .dropna(
            subset=FEATURES + ["avg_price"]
        )
        .reset_index(drop=True)
    )

    if len(df) < 50:

        print(
            f"Not enough usable observations: {len(df)}"
        )

        return None

    print(
        f"Usable observations: {len(df)}"
    )

    # --------------------------------------------------------
    # Chronological split
    #
    # No random split for time series.
    # --------------------------------------------------------

    split = int(
        len(df) * 0.80
    )

    train = df.iloc[:split].copy()

    test = df.iloc[split:].copy()

    X_train = train[FEATURES]

    y_train = train["avg_price"]

    X_test = test[FEATURES]

    y_test = test["avg_price"]

    print()
    print(
        f"Training rows: {len(train)}"
    )

    print(
        f"Testing rows : {len(test)}"
    )

    print(
        f"Training period: "
        f"{train['date'].min().date()} -> "
        f"{train['date'].max().date()}"
    )

    print(
        f"Testing period : "
        f"{test['date'].min().date()} -> "
        f"{test['date'].max().date()}"
    )

    # ========================================================
    # NAIVE BASELINE
    # ========================================================

    baseline_predictions = (
        test["lag_1"]
    )

    baseline_mae = mean_absolute_error(
        y_test,
        baseline_predictions
    )

    baseline_rmse = (
        mean_squared_error(
            y_test,
            baseline_predictions
        ) ** 0.5
    )

    # ========================================================
    # GRADIENT BOOSTING
    # ========================================================

    print()
    print(
        "Training Gradient Boosting..."
    )

    model = GradientBoostingRegressor(
        n_estimators=300,
        learning_rate=0.03,
        max_depth=3,
        min_samples_leaf=4,
        random_state=42,
        loss="huber",
    )

    model.fit(
        X_train,
        y_train
    )

    # ========================================================
    # TEST PREDICTIONS
    # ========================================================

    predictions = model.predict(
        X_test
    )

    model_mae = mean_absolute_error(
        y_test,
        predictions
    )

    model_rmse = (
        mean_squared_error(
            y_test,
            predictions
        ) ** 0.5
    )

    # --------------------------------------------------------
    # Improvement
    # --------------------------------------------------------

    if baseline_mae > 0:

        improvement = (
            (baseline_mae - model_mae)
            / baseline_mae
        ) * 100

    else:

        improvement = 0.0

    # ========================================================
    # RESULTS
    # ========================================================

    print()
    print("-" * 70)
    print(f"{crop.upper()} RESULTS")
    print("-" * 70)

    print()
    print("Naive Previous-Price Baseline")

    print(
        f"MAE : Rs {baseline_mae:.2f}"
    )

    print(
        f"RMSE: Rs {baseline_rmse:.2f}"
    )

    print()
    print("Gradient Boosting")

    print(
        f"MAE : Rs {model_mae:.2f}"
    )

    print(
        f"RMSE: Rs {model_rmse:.2f}"
    )

    print()
    print(
        f"Improvement over baseline: "
        f"{improvement:.2f}%"
    )

    # ========================================================
    # FEATURE IMPORTANCE
    # ========================================================

    importance = pd.DataFrame(
        {
            "feature": FEATURES,
            "importance":
                model.feature_importances_,
        }
    )

    importance = (
        importance
        .sort_values(
            "importance",
            ascending=False
        )
    )

    print()
    print("Top Features")

    print(
        importance
        .head(10)
        .to_string(index=False)
    )

    # ========================================================
    # LAST TEST PREDICTIONS
    # ========================================================

    results = test[
        [
            "date",
            "avg_price",
            "lag_1",
        ]
    ].copy()

    results["predicted_price"] = (
        predictions
    )

    results.rename(
        columns={
            "lag_1": "baseline_price"
        },
        inplace=True
    )

    print()
    print("Last 5 Predictions")

    print(
        results
        .tail(5)
        .to_string(index=False)
    )

    # ========================================================
    # SAVE MODEL
    # ========================================================

    os.makedirs(
        MODEL_DIR,
        exist_ok=True
    )

    model_file = os.path.join(
        MODEL_DIR,
        f"{crop}_gradient_boosting.pkl"
    )

    model_package = {

        "model": model,

        "features": FEATURES,

        "crop": crop,

        "commodity": commodity,

        "model_type":
            "GradientBoostingRegressor",

        "version":
            "postgresql-v1",

        "mae":
            model_mae,

        "rmse":
            model_rmse,

        "baseline_mae":
            baseline_mae,

        "baseline_rmse":
            baseline_rmse,

        "training_start":
            str(
                train["date"].min().date()
            ),

        "training_end":
            str(
                train["date"].max().date()
            ),

        "validation_start":
            str(
                test["date"].min().date()
            ),

        "validation_end":
            str(
                test["date"].max().date()
            ),

        "training_rows":
            len(train),

        "testing_rows":
            len(test),
    }

    with open(
        model_file,
        "wb"
    ) as file:

        pickle.dump(
            model_package,
            file
        )

    print()
    print(
        f"MODEL SAVED: {model_file}"
    )

    # ========================================================
    # RETURN
    # ========================================================

    return {

        "crop": crop,

        "rows": len(df),

        "train_rows":
            len(train),

        "test_rows":
            len(test),

        "baseline_mae":
            baseline_mae,

        "model_mae":
            model_mae,

        "baseline_rmse":
            baseline_rmse,

        "model_rmse":
            model_rmse,

        "improvement":
            improvement,
    }


# ============================================================
# MAIN
# ============================================================

def main():

    print()
    print("=" * 70)
    print(
        "KISANSETU - POSTGRESQL PRICE FORECASTING"
    )
    print("=" * 70)

    print()
    print(
        "Data source: PostgreSQL market_prices"
    )

    print(
        "Training: historical actual mandi prices"
    )

    print(
        "Forecast target: next available observation"
    )

    print()

    try:

        connection = get_connection()

    except psycopg2.Error as error:

        print()
        print(
            "DATABASE CONNECTION FAILED"
        )

        print(error)

        return 1

    results = []

    try:

        for crop, commodity in (
            CROP_COMMODITIES.items()
        ):

            try:

                result = train_crop(
                    connection,
                    crop,
                    commodity
                )

                if result:

                    results.append(
                        result
                    )

            except Exception as error:

                print()
                print(
                    f"FAILED TO TRAIN {crop.upper()}"
                )

                print(error)

    finally:

        connection.close()

    # ========================================================
    # FINAL SUMMARY
    # ========================================================

    print()
    print("=" * 70)
    print("TRAINING SUMMARY")
    print("=" * 70)

    if not results:

        print(
            "No models were trained."
        )

        return 1

    summary = pd.DataFrame(
        results
    )

    print(
        summary[
            [
                "crop",
                "rows",
                "train_rows",
                "test_rows",
                "model_mae",
                "model_rmse",
                "improvement",
            ]
        ].to_string(
            index=False
        )
    )

    print()
    print(
        "All available models have been saved."
    )

    return 0


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":

    raise SystemExit(
        main()
    )