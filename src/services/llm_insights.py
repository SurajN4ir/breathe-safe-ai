"""
Groq-powered environmental interpretation layer.

The LLM is not used as a chatbot. It converts measured and forecasted
environmental values into concise, grounded health guidance.
"""

import json
import os
from typing import Any, Dict, Optional

try:
    from groq import Groq

    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False


INSIGHT_SCHEMA = {
    "summary": "Short current or future environmental summary.",
    "risk_interpretation": "Plain-language respiratory risk interpretation.",
    "outdoor_guidance": "Walking/exercise guidance.",
    "health_recommendation": "Practical action recommendation.",
}


def build_environment_prompt(
    city: str,
    live_features: Dict[str, Any],
    forecast: Optional[Dict[str, Any]] = None,
    hours: Optional[int] = None,
) -> str:
    """Build a deterministic prompt that can be evaluated later with Promptfoo."""
    payload = {
        "city": city,
        "current_conditions": {
            "aqi_openweather_scale": live_features.get("aqi"),
            "temperature_c": live_features.get("temperature"),
            "humidity_pct": live_features.get("humidity"),
            "pressure_hpa": live_features.get("pressure"),
            "wind_speed_ms": live_features.get("wind_speed"),
            "weather_condition": live_features.get("weather_condition", "not provided"),
            "pm25_ugm3": live_features.get("pm2_5"),
            "pm10_ugm3": live_features.get("pm10"),
            "no2_ugm3": live_features.get("no2"),
            "co_ugm3": live_features.get("co"),
        },
        "forecast": None,
        "required_json_schema": INSIGHT_SCHEMA,
    }

    if forecast and hours:
        payload["forecast"] = {
            "horizon_hours": hours,
            "current_numeric_aqi": forecast.get("base_aqi"),
            "predicted_numeric_aqi": forecast.get("predicted_aqi"),
            "category": forecast.get("aqi_category"),
            "trend": forecast.get("trend"),
            "walking_safety": forecast.get("walking_safety"),
            "respiratory_warning": forecast.get("respiratory_warning"),
            "model_method": forecast.get("method"),
        }

    return f"""
You are the Environmental Health Intelligence Engine for Breathe Safe AI.

Task:
Transform the supplied environmental data into grounded, human-readable health guidance.
This is not a chatbot response. Do not ask follow-up questions.

Rules:
- Use only the supplied data.
- Do not fabricate scientific certainty, hidden sensors, or external conditions.
- Keep the tone calm, professional, and useful.
- Avoid dramatic language.
- Mention uncertainty for longer forecasts when relevant.
- Return only valid JSON with these keys:
  summary, risk_interpretation, outdoor_guidance, health_recommendation

Data:
{json.dumps(payload, indent=2)}
""".strip()


def get_environment_insight(
    city: str,
    live_features: Dict[str, Any],
    forecast: Optional[Dict[str, Any]] = None,
    hours: Optional[int] = None,
) -> Dict[str, str]:
    """Return structured environmental insight from Groq, with a rule-based fallback."""
    api_key = os.getenv("GROQ_API_KEY")

    if not api_key or not GROQ_AVAILABLE:
        return _fallback_structured_insight(city, live_features, forecast, hours)

    try:
        client = Groq(api_key=api_key)
        response = client.chat.completions.create(
            model=os.getenv("GROQ_MODEL", "llama3-8b-8192"),
            messages=[
                {
                    "role": "system",
                    "content": "You produce concise JSON environmental health interpretations from provided metrics only.",
                },
                {
                    "role": "user",
                    "content": build_environment_prompt(city, live_features, forecast, hours),
                },
            ],
            temperature=0.25,
            max_tokens=280,
            response_format={"type": "json_object"},
        )
        parsed = json.loads(response.choices[0].message.content)
        return _normalize_insight(parsed)
    except Exception as exc:
        print(f"[LLM] Groq insight generation failed: {exc}")
        return _fallback_structured_insight(city, live_features, forecast, hours)


def get_llm_insight(
    city: str,
    live_features: Dict[str, Any],
    forecast: Optional[Dict[str, Any]] = None,
    hours: Optional[int] = None,
) -> str:
    """Backward-compatible string insight used by existing frontend code."""
    insight = get_environment_insight(city, live_features, forecast, hours)
    return " ".join(
        [
            insight["summary"],
            insight["risk_interpretation"],
            insight["outdoor_guidance"],
            insight["health_recommendation"],
        ]
    )


def _normalize_insight(value: Dict[str, Any]) -> Dict[str, str]:
    fallback = {
        "summary": "Environmental conditions were analyzed from the available live metrics.",
        "risk_interpretation": "Respiratory risk depends mainly on particulate matter and AQI category.",
        "outdoor_guidance": "Use the AQI category to plan outdoor activity.",
        "health_recommendation": "Sensitive individuals should reduce exposure if symptoms appear.",
    }
    return {
        key: str(value.get(key) or fallback[key]).strip()
        for key in fallback
    }


def _fallback_structured_insight(
    city: str,
    live_features: Dict[str, Any],
    forecast: Optional[Dict[str, Any]],
    hours: Optional[int],
) -> Dict[str, str]:
    pm25 = _num(live_features.get("pm2_5"), 20)
    wind = _num(live_features.get("wind_speed"), 3)

    if forecast:
        predicted_aqi = int(forecast.get("predicted_aqi", 100))
        category = forecast.get("aqi_category", "Moderate")
        trend = forecast.get("trend", "Stable").lower()
        horizon = f"{hours} hour" if hours == 1 else f"{hours} hours" if hours else "the selected period"

        return {
            "summary": f"Air quality in {city} is expected to be {category.lower()} over the next {horizon}.",
            "risk_interpretation": forecast.get("health_warning", "Sensitive individuals should monitor symptoms during outdoor exposure."),
            "outdoor_guidance": forecast.get("walking_safety", "Use caution for outdoor activity."),
            "health_recommendation": forecast.get("recommendation", "Reduce prolonged outdoor exposure if discomfort appears."),
        } | (
            {
                "summary": f"Air quality in {city} is expected to be {category.lower()} over the next {horizon}, with conditions {trend}."
            }
            if predicted_aqi > 0
            else {}
        )

    if pm25 <= 12:
        return {
            "summary": f"Air quality in {city} currently appears comfortable based on fine particle levels.",
            "risk_interpretation": "Respiratory risk is low for most people.",
            "outdoor_guidance": "Walking and light exercise are suitable for most people.",
            "health_recommendation": "Continue normal activity and recheck conditions if weather changes.",
        }
    if pm25 <= 35:
        return {
            "summary": f"Air quality in {city} is acceptable, with moderate fine particle presence.",
            "risk_interpretation": "Most people can tolerate these conditions, though highly sensitive individuals may notice mild irritation.",
            "outdoor_guidance": "Outdoor walking is generally reasonable.",
            "health_recommendation": "Take breaks if you have asthma or respiratory sensitivity.",
        }
    return {
        "summary": f"Fine particle pollution in {city} is elevated, and wind speed is {wind:.1f} m/s.",
        "risk_interpretation": "Sensitive groups may experience breathing discomfort during longer outdoor exposure.",
        "outdoor_guidance": "Keep outdoor exercise lighter and shorter.",
        "health_recommendation": "Consider a protective mask for extended travel and avoid high-traffic areas where possible.",
    }


def _num(value: Any, default: float) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default
