import requests
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("OPENWEATHER_API_KEY")
BASE_URL = "http://api.openweathermap.org/data/2.5"
REQUEST_TIMEOUT_SECONDS = 10


def _require_api_key():
    if not API_KEY:
        raise RuntimeError("OPENWEATHER_API_KEY is not configured")


def get_weather_data(lat, lon):
    _require_api_key()

    url = (
        f"{BASE_URL}/weather?"
        f"lat={lat}&lon={lon}"
        f"&appid={API_KEY}&units=metric"
    )

    response = requests.get(url, timeout=REQUEST_TIMEOUT_SECONDS)
    response.raise_for_status()

    return response.json()


def get_air_pollution_data(lat, lon):
    _require_api_key()

    url = (
        f"{BASE_URL}/air_pollution?"
        f"lat={lat}&lon={lon}"
        f"&appid={API_KEY}"
    )

    response = requests.get(url, timeout=REQUEST_TIMEOUT_SECONDS)
    response.raise_for_status()

    return response.json()
