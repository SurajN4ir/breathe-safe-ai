from pathlib import Path
import json

import joblib
import mlflow
import mlflow.sklearn
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error


HORIZONS = [1, 3, 6, 12, 24]
MODEL_DIR = Path("models/forecast_models")
MODEL_DIR.mkdir(parents=True, exist_ok=True)

# Expected hourly dataset path.
DATA_PATH = Path("data/processed/city_hourly_aqi.csv")


def _build_features(df: pd.DataFrame, horizon: int) -> pd.DataFrame:
    data = df.copy()
    data["timestamp"] = pd.to_datetime(data["timestamp"], utc=True, errors="coerce")
    data = data.dropna(subset=["timestamp"]).sort_values(["city", "timestamp"])

    # Build features that exactly match forecast runtime inference schema.
    data["base_aqi"] = data["aqi"]
    data["forecast_temp"] = data.groupby("city")["temperature"].shift(-horizon)
    data["forecast_humidity"] = data.groupby("city")["humidity"].shift(-horizon)
    data["forecast_wind"] = data.groupby("city")["wind_speed"].shift(-horizon)
    data["horizon_hours"] = horizon

    # Target for horizon (future AQI).
    data["target_aqi"] = data.groupby("city")["aqi"].shift(-horizon)
    return data


def _feature_columns(data: pd.DataFrame):
    candidate = [
        "base_aqi",
        "pm2_5",
        "pm10",
        "no2",
        "co",
        "temperature",
        "humidity",
        "wind_speed",
        "forecast_temp",
        "forecast_humidity",
        "forecast_wind",
        "horizon_hours",
    ]
    return [c for c in candidate if c in data.columns]


def train():
    if not DATA_PATH.exists():
        raise FileNotFoundError(
            f"Dataset not found at {DATA_PATH}. Expected columns: "
            "timestamp, city, aqi, pm2_5, pm10, no2, co, temperature, humidity, wind_speed, pressure"
        )

    raw = pd.read_csv(DATA_PATH)
    required = {"timestamp", "city", "aqi"}
    if not required.issubset(set(raw.columns)):
        raise ValueError(f"Missing required columns: {required - set(raw.columns)}")

    mlflow.set_experiment("BreatheSafeAQI_Forecast_MultiHorizon")
    report = {}

    for horizon in HORIZONS:
        data = _build_features(raw, horizon)
        features = _feature_columns(data)
        data = data.dropna(subset=features + ["target_aqi"])
        if len(data) < 500:
            print(f"Skipping {horizon}h model due to limited rows: {len(data)}")
            continue

        # Time split for realistic forecasting evaluation.
        data = data.sort_values("timestamp")
        split_idx = int(len(data) * 0.8)
        train_df = data.iloc[:split_idx]
        test_df = data.iloc[split_idx:]

        X_train = train_df[features].to_numpy(dtype=float)
        y_train = train_df["target_aqi"].to_numpy(dtype=float)
        X_test = test_df[features].to_numpy(dtype=float)
        y_test = test_df["target_aqi"].to_numpy(dtype=float)

        with mlflow.start_run(run_name=f"forecast_{horizon}h"):
            model = HistGradientBoostingRegressor(
                loss="squared_error",
                learning_rate=0.05,
                max_depth=8,
                max_iter=450,
                min_samples_leaf=25,
                l2_regularization=0.15,
                random_state=42,
            )
            model.fit(X_train, y_train)
            preds = model.predict(X_test)

            mae = float(mean_absolute_error(y_test, preds))
            rmse = float(np.sqrt(mean_squared_error(y_test, preds)))

            mlflow.log_param("horizon_hours", horizon)
            mlflow.log_param("num_features", len(features))
            mlflow.log_param("train_rows", len(train_df))
            mlflow.log_param("test_rows", len(test_df))
            mlflow.log_metric("mae", mae)
            mlflow.log_metric("rmse", rmse)
            mlflow.sklearn.log_model(model, name=f"aqi_forecast_{horizon}h")

            model_path = MODEL_DIR / f"aqi_forecast_{horizon}h.joblib"
            joblib.dump(model, model_path)

            report[horizon] = {
                "mae": round(mae, 3),
                "rmse": round(rmse, 3),
                "rows": int(len(data)),
                "features": features,
                "model_path": str(model_path),
            }

            print(f"{horizon}h model saved -> {model_path} (MAE={mae:.2f}, RMSE={rmse:.2f})")

    summary_path = MODEL_DIR / "training_summary.json"
    summary_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"Training summary written to {summary_path}")


if __name__ == "__main__":
    train()
