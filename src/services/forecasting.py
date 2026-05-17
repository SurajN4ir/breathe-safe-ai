"""
Lightweight AQI forecasting logic for Breathe Safe AI.

This module is intentionally heuristic. It estimates near-term AQI movement
from current pollution and weather conditions instead of pretending to be a
trained atmospheric time-series model.
"""

from typing import Any, Dict


VALID_HORIZONS = {1, 3, 6, 12, 24}


def forecast_aqi(live_features: Dict[str, Any], hours: int) -> Dict[str, Any]:
    """Estimate future AQI from current environmental conditions."""
    safe_hours = hours if hours in VALID_HORIZONS else 6

    pm25 = _num(live_features.get("pm2_5"), 20)
    pm10 = _num(live_features.get("pm10"), 40)
    wind = _num(live_features.get("wind_speed"), 3)
    humidity = _num(live_features.get("humidity"), 50)
    no2 = _num(live_features.get("no2"), 10)
    co = _num(live_features.get("co"), 200)
    temperature = _num(live_features.get("temperature"), 25)
    weather_condition = live_features.get("weather_condition", "not provided")
    owm_aqi = int(_num(live_features.get("aqi"), 2))

    base_aqi = round(_owm_to_numeric(owm_aqi, pm25))
    horizon_scale = safe_hours / 6

    wind_dispersion = -1.4 * wind * horizon_scale
    low_wind_accumulation = max(0, 2.2 - wind) * 8 * horizon_scale
    humidity_trapping = max(0, humidity - 55) * 0.22 * horizon_scale
    pm25_pressure = max(0, pm25 - 25) * 0.48 * horizon_scale
    pm10_pressure = max(0, pm10 - 60) * 0.12 * horizon_scale
    traffic_pressure = max(0, no2 - 25) * 0.10 * horizon_scale

    total_drift = (
        wind_dispersion
        + low_wind_accumulation
        + humidity_trapping
        + pm25_pressure
        + pm10_pressure
        + traffic_pressure
    )

    max_drift = safe_hours * 5.5
    total_drift = max(-max_drift, min(max_drift, total_drift))
    predicted_aqi = round(max(0, min(500, base_aqi + total_drift)))

    category = _aqi_category(predicted_aqi)
    walking_safety = _walking_safety(predicted_aqi)

    return {
        "base_aqi": base_aqi,
        "predicted_aqi": predicted_aqi,
        "drift": round(total_drift, 1),
        "trend": _trend_label(total_drift),
        "aqi_category": category,
        "walking_safety": walking_safety,
        "risk_level": _risk_level(predicted_aqi),
        "health_warning": _health_warning(predicted_aqi),
        "recommendation": _recommendation(predicted_aqi),
        "respiratory_warning": _respiratory_warning(predicted_aqi, pm25),
        "confidence": _confidence_label(safe_hours),
        "method": "Heuristic near-term forecast using current AQI, particulate matter, humidity, wind, and NO2.",
        "factors": {
            "wind_speed_ms": wind,
            "humidity_pct": humidity,
            "pm25_ugm3": pm25,
            "pm10_ugm3": pm10,
            "no2_ugm3": no2,
            "co_ugm3": co,
            "temperature_c": temperature,
            "weather_condition": weather_condition,
        },
        "factor_explanations": _factor_explanations(pm25, pm10, wind, humidity, no2),
    }


def _num(value: Any, default: float) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _owm_to_numeric(owm_aqi: int, pm25: float) -> float:
    """Approximate a US-style numeric AQI from OpenWeather's 1-5 scale and PM2.5."""
    if pm25 <= 12:
        pm25_aqi = 25 + pm25 * 2
    elif pm25 <= 35.4:
        pm25_aqi = 51 + (pm25 - 12) * 2.1
    elif pm25 <= 55.4:
        pm25_aqi = 101 + (pm25 - 35.4) * 2.5
    elif pm25 <= 150.4:
        pm25_aqi = 151 + (pm25 - 55.4) * 0.52
    else:
        pm25_aqi = min(300, 201 + (pm25 - 150.4) * 0.4)

    scale_anchor = {1: 35, 2: 75, 3: 125, 4: 175, 5: 240}.get(owm_aqi, 75)
    return (pm25_aqi * 0.72) + (scale_anchor * 0.28)


def _aqi_category(aqi: int) -> str:
    if aqi <= 50:
        return "Good"
    if aqi <= 100:
        return "Moderate"
    if aqi <= 150:
        return "Unhealthy for Sensitive Groups"
    if aqi <= 200:
        return "Unhealthy"
    if aqi <= 300:
        return "Very Unhealthy"
    return "Hazardous"


def _walking_safety(aqi: int) -> str:
    if aqi <= 50:
        return "Safe for Everyone"
    if aqi <= 100:
        return "Generally Safe"
    if aqi <= 150:
        return "Use Caution"
    if aqi <= 200:
        return "Not Recommended"
    return "Avoid Outdoor Activity"


def _risk_level(aqi: int) -> str:
    if aqi <= 50:
        return "low"
    if aqi <= 100:
        return "moderate"
    if aqi <= 150:
        return "elevated"
    if aqi <= 200:
        return "high"
    return "severe"


def _trend_label(drift: float) -> str:
    if drift < -10:
        return "Improving significantly"
    if drift < -3:
        return "Improving"
    if drift <= 3:
        return "Stable"
    if drift <= 10:
        return "Worsening"
    return "Worsening significantly"


def _health_warning(aqi: int) -> str:
    if aqi <= 50:
        return "Air quality should remain comfortable for most people."
    if aqi <= 100:
        return "Air quality may cause mild discomfort for unusually sensitive individuals."
    if aqi <= 150:
        return "Sensitive individuals may notice breathing discomfort during prolonged outdoor exposure."
    if aqi <= 200:
        return "People with asthma, children, and older adults should reduce outdoor exposure."
    return "Outdoor exposure can be risky, especially for people with respiratory or heart conditions."


def _recommendation(aqi: int) -> str:
    if aqi <= 100:
        return "Normal outdoor activity is acceptable, with basic awareness for sensitive individuals."
    if aqi <= 150:
        return "Keep walks shorter and avoid intense exercise near traffic-heavy areas."
    if aqi <= 200:
        return "Avoid prolonged outdoor activity and consider a well-fitted mask if travel is necessary."
    return "Stay indoors where possible, keep windows closed, and use filtration if available."


def _respiratory_warning(aqi: int, pm25: float) -> str:
    if aqi <= 100 and pm25 <= 35:
        return "Respiratory risk is limited for most people."
    if aqi <= 150:
        return "Fine particle pollution may irritate sensitive lungs."
    return "Fine particle exposure may increase breathing discomfort and asthma symptoms."


def _confidence_label(hours: int) -> str:
    if hours <= 3:
        return "higher"
    if hours <= 12:
        return "moderate"
    return "directional"


def _factor_explanations(pm25: float, pm10: float, wind: float, humidity: float, no2: float) -> Dict[str, str]:
    return {
        "wind": "Low wind can allow pollution to accumulate; stronger wind usually disperses particles.",
        "humidity": "Higher humidity can keep fine particles suspended near the surface.",
        "particulate_matter": "PM2.5 and PM10 are weighted strongly because they drive respiratory discomfort.",
        "traffic_pollution": "Elevated NO2 can indicate traffic or combustion-related pollution pressure.",
        "current_state": f"Current PM2.5 is {pm25:.1f} ug/m3 and PM10 is {pm10:.1f} ug/m3 with wind at {wind:.1f} m/s.",
    }
