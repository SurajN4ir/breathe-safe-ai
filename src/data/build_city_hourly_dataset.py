from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from pathlib import Path
from typing import Dict, List

import pandas as pd
import requests


AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"
WEATHER_ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"
OUTPUT_PATH = Path("data/processed/city_hourly_aqi.csv")


@dataclass(frozen=True)
class City:
    name: str
    lat: float
    lon: float


CITIES: List[City] = [
    City("New Delhi", 28.6139, 77.2090),
    City("Mumbai", 19.0760, 72.8777),
    City("Bengaluru", 12.9716, 77.5946),
    City("Hyderabad", 17.3850, 78.4867),
    City("Chennai", 13.0827, 80.2707),
    City("Kolkata", 22.5726, 88.3639),
    City("Pune", 18.5204, 73.8567),
    City("Ahmedabad", 23.0225, 72.5714),
    City("Jaipur", 26.9124, 75.7873),
    City("Lucknow", 26.8467, 80.9462),
]


def _fetch_air_quality(city: City, start: date, end: date) -> pd.DataFrame:
    params = {
        "latitude": city.lat,
        "longitude": city.lon,
        "timezone": "Asia/Kolkata",
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "hourly": "pm2_5,pm10,nitrogen_dioxide,carbon_monoxide,european_aqi",
    }
    res = requests.get(AIR_QUALITY_URL, params=params, timeout=60)
    res.raise_for_status()
    payload = res.json()
    hourly = payload.get("hourly", {})

    return pd.DataFrame(
        {
            "timestamp": hourly.get("time", []),
            "pm2_5": hourly.get("pm2_5", []),
            "pm10": hourly.get("pm10", []),
            "no2": hourly.get("nitrogen_dioxide", []),
            "co": hourly.get("carbon_monoxide", []),
            "aqi": hourly.get("european_aqi", []),
        }
    )


def _fetch_weather(city: City, start: date, end: date) -> pd.DataFrame:
    params = {
        "latitude": city.lat,
        "longitude": city.lon,
        "timezone": "Asia/Kolkata",
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "hourly": "temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m",
    }
    res = requests.get(WEATHER_ARCHIVE_URL, params=params, timeout=60)
    res.raise_for_status()
    payload = res.json()
    hourly = payload.get("hourly", {})

    return pd.DataFrame(
        {
            "timestamp": hourly.get("time", []),
            "temperature": hourly.get("temperature_2m", []),
            "humidity": hourly.get("relative_humidity_2m", []),
            "pressure": hourly.get("surface_pressure", []),
            "wind_speed": hourly.get("wind_speed_10m", []),
        }
    )


def build_dataset(days: int = 365) -> pd.DataFrame:
    end = date.today() - timedelta(days=1)
    start = end - timedelta(days=days - 1)

    frames: List[pd.DataFrame] = []
    for city in CITIES:
        print(f"Fetching city data: {city.name} ({start} to {end})")
        aq = _fetch_air_quality(city, start, end)
        wx = _fetch_weather(city, start, end)
        merged = aq.merge(wx, on="timestamp", how="inner")
        merged["city"] = city.name
        frames.append(merged)

    all_data = pd.concat(frames, ignore_index=True)
    all_data["timestamp"] = pd.to_datetime(all_data["timestamp"], errors="coerce")
    all_data = all_data.dropna(subset=["timestamp"]).sort_values(["city", "timestamp"])

    # Keep target and features in consistent numeric format.
    numeric_cols = ["aqi", "pm2_5", "pm10", "no2", "co", "temperature", "humidity", "pressure", "wind_speed"]
    for col in numeric_cols:
        all_data[col] = pd.to_numeric(all_data[col], errors="coerce")

    all_data = all_data.dropna(subset=["aqi", "pm2_5", "pm10", "temperature", "humidity", "wind_speed"])
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    all_data.to_csv(OUTPUT_PATH, index=False)
    print(f"Saved dataset to {OUTPUT_PATH} with {len(all_data)} rows")
    return all_data


if __name__ == "__main__":
    build_dataset(days=365)
