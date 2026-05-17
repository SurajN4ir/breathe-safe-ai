from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
from pathlib import Path
from prometheus_client import Counter, generate_latest
from starlette.responses import Response
from src.features.live_preprocessing import extract_live_features
from src.services.forecasting import forecast_aqi
from src.services.llm_insights import get_environment_insight

from src.services.live_aqi import (
    get_weather_data,
    get_air_pollution_data,
    get_weather_forecast_data,
)
# -----------------------------
# LOAD TRAINED MODEL
# -----------------------------
MODEL_PATH = Path("models/aqi_model.pkl")
_model = None


def _get_model():
    global _model
    if _model is None:
        if not MODEL_PATH.exists():
            return None
        _model = joblib.load(MODEL_PATH)
    return _model

# -----------------------------
# CREATE FASTAPI APP
# -----------------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

REQUEST_COUNT = Counter(
    "breathe_safe_api_requests_total",
    "Total API requests served by Breathe Safe AI",
    ["endpoint"],
)

CITY_COORDINATES = {
    "new delhi": (28.6139, 77.2090),
    "delhi": (28.6139, 77.2090),
    "mumbai": (19.0760, 72.8777),
    "bengaluru": (12.9716, 77.5946),
    "bangalore": (12.9716, 77.5946),
    "hyderabad": (17.3850, 78.4867),
    "chennai": (13.0827, 80.2707),
    "kolkata": (22.5726, 88.3639),
    "pune": (18.5204, 73.8567),
    "ahmedabad": (23.0225, 72.5714),
    "jaipur": (26.9124, 75.7873),
    "lucknow": (26.8467, 80.9462),
}

VALID_FORECAST_HOURS = {1, 3, 6, 12, 24}
# -----------------------------
# INPUT SCHEMA
# -----------------------------
class AQIInput(BaseModel):
    state: int
    area: int
    number_of_monitoring_stations: int
    prominent_pollutants: int
    air_quality_status: int
    year: int
    month: int
    day: int

# -----------------------------
# ROOT ENDPOINT
# -----------------------------
@app.get("/")
def home():
    REQUEST_COUNT.labels(endpoint="/").inc()
    return {
        "message": "Breathe Safe AI API is running!"
    }


@app.get("/metrics")
def metrics():
    return Response(generate_latest(), media_type="text/plain")

# -----------------------------
# PREDICTION ENDPOINT
# -----------------------------
@app.post("/predict")
def predict(data: AQIInput):
    REQUEST_COUNT.labels(endpoint="/predict").inc()
    model = _get_model()
    if model is None:
        raise HTTPException(status_code=503, detail="AQI model artifact not found. Train the model or mount models/aqi_model.pkl.")

    input_data = np.array([[
        data.state,
        data.area,
        data.number_of_monitoring_stations,
        data.prominent_pollutants,
        data.air_quality_status,
        data.year,
        data.month,
        data.day
    ]])

    prediction = model.predict(input_data)

    return {
        "predicted_aqi": round(float(prediction[0]), 2)
    }

@app.get("/live-environment")
def get_live_environment(lat: float, lon: float):
    REQUEST_COUNT.labels(endpoint="/live-environment").inc()

    weather_data, pollution_data = _fetch_live_environment(lat, lon)

    return {
        "weather": weather_data,
        "pollution": pollution_data
    }
# -----------------------------
# LIVE AQI PREDICTION ENDPOINT
# -----------------------------
@app.get("/predict-live")
def predict_live(lat: float, lon: float):
    REQUEST_COUNT.labels(endpoint="/predict-live").inc()

    weather_data, pollution_data = _fetch_live_environment(lat, lon)

    live_features = extract_live_features(
        weather_data,
        pollution_data
    )

    return {
        "live_features": live_features,
        "message": "Live environmental intelligence fetched successfully"
    }

# -----------------------------
# FORECAST ENDPOINT
# -----------------------------
@app.get("/forecast")
def get_forecast(
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    hours: int = Query(6, description="Forecast horizon. Supported values: 1, 3, 6, 12, 24."),
    city: str = "Hyderabad",
):
    """
    Lightweight AQI forecasting endpoint.
    Uses current live conditions + heuristic drift model to estimate future AQI.
    Optionally enriches response with Groq LLM-generated health insight.
    """
    REQUEST_COUNT.labels(endpoint="/forecast").inc()
    if hours not in VALID_FORECAST_HOURS:
        raise HTTPException(status_code=400, detail="hours must be one of: 1, 3, 6, 12, 24")

    resolved_lat, resolved_lon = _resolve_location(lat, lon, city)

    weather_data, pollution_data = _fetch_live_environment(resolved_lat, resolved_lon)
    live_features = extract_live_features(weather_data, pollution_data)
    future_weather = _fetch_future_weather_at_horizon(resolved_lat, resolved_lon, hours)

    forecast = forecast_aqi(live_features, hours, future_weather=future_weather)

    # LLM insight falls back to a deterministic rule-based interpretation when
    # GROQ_API_KEY is not available.
    insight = get_environment_insight(
        city=city,
        live_features=live_features,
        forecast=forecast,
        hours=hours,
    )

    return {
        "city":            city,
        "forecast_hours":  hours,
        "current_aqi":     forecast["base_aqi"],
        "predicted_aqi":   forecast["predicted_aqi"],
        "aqi_category":    forecast["aqi_category"],
        "trend":           forecast["trend"],
        "walking_safety":  forecast["walking_safety"],
        "risk_level":      forecast["risk_level"],
        "health_warning":  forecast["health_warning"],
        "recommendation":  forecast["recommendation"],
        "respiratory_warning": forecast["respiratory_warning"],
        "confidence":      forecast["confidence"],
        "method":          forecast["method"],
        "drift":           forecast["drift"],
        "factors":         forecast["factors"],
        "factor_explanations": forecast["factor_explanations"],
        "ai_insight":      insight,
        "message":         "Forecast generated successfully"
    }


def _resolve_location(lat: Optional[float], lon: Optional[float], city: str):
    if lat is not None and lon is not None:
        return lat, lon

    city_key = city.strip().lower()
    if city_key in CITY_COORDINATES:
        return CITY_COORDINATES[city_key]

    raise HTTPException(
        status_code=400,
        detail="Provide lat/lon or use a supported city name.",
    )


def _fetch_live_environment(lat: float, lon: float):
    try:
        return get_weather_data(lat, lon), get_air_pollution_data(lat, lon)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Unable to fetch live environmental data: {exc}",
        ) from exc


def _fetch_future_weather_at_horizon(lat: float, lon: float, hours: int):
    """
    Retrieves nearest forecast weather snapshot for the target horizon.
    Returns None when unavailable so forecasting can safely fall back.
    """
    try:
        forecast_payload = get_weather_forecast_data(lat, lon)
        items = forecast_payload.get("list") or []
        if not items:
            return None

        # OpenWeather forecast is in 3-hour steps; choose nearest bucket index.
        target_hours = float(hours)
        idx = min(max(int(round(target_hours / 3.0)) - 1, 0), len(items) - 1)
        nearest = items[idx]

        weather_desc = "unknown"
        if nearest.get("weather"):
            weather_desc = nearest["weather"][0].get("description", "unknown")

        return {
            "temperature": nearest.get("main", {}).get("temp"),
            "humidity": nearest.get("main", {}).get("humidity"),
            "wind_speed": nearest.get("wind", {}).get("speed"),
            "weather_condition": weather_desc,
        }
    except Exception:
        return None
