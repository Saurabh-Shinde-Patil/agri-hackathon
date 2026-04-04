"""
Weather-based Prediction Plugin using OpenWeatherMap API.

Uses real-time weather data + expert agronomic rules to assess
pest and disease risk levels for crops.

Requires OPENWEATHER_API_KEY in .env — shows clear error if missing.
"""

import requests
from typing import Dict, Any, List
from ..core.prediction_interface import BasePredictionPlugin
from ..core.config import settings


# ─── Expert Rule Definitions ────────────────────────────────────
WEATHER_RULES = [
    {
        "id": "fungal_humidity",
        "name": "Fungal Disease Risk (High Humidity)",
        "condition": lambda w, inp: inp.get("humidity", 0) > 80 and 18 <= inp.get("temperature", 0) <= 32,
        "risk_add": 2.5,
        "reason": "High humidity (>80%) combined with warm temperatures (18-32°C) creates ideal conditions for fungal pathogens like blight, rust, and mildew.",
        "threats": ["Late Blight", "Powdery Mildew", "Downy Mildew", "Rust"]
    },
    {
        "id": "rain_young_plants",
        "name": "Damping-Off Risk (Rain + Young Plants)",
        "condition": lambda w, inp: inp.get("rainfall", 0) > 10 and inp.get("plant_age_days", 999) < 25,
        "risk_add": 2.0,
        "reason": "Heavy rainfall on young seedlings greatly increases damping-off and root rot disease risk.",
        "threats": ["Damping-Off", "Root Rot", "Pythium"]
    },
    {
        "id": "hot_dry_pests",
        "name": "Pest Infestation (Hot & Dry)",
        "condition": lambda w, inp: inp.get("temperature", 0) > 33 and inp.get("humidity", 0) < 45,
        "risk_add": 2.0,
        "reason": "Hot, dry conditions favor rapid reproduction of mites, thrips, and whiteflies.",
        "threats": ["Spider Mites", "Thrips", "Whitefly"]
    },
    {
        "id": "waterlogging",
        "name": "Waterlogging Stress",
        "condition": lambda w, inp: inp.get("soil_moisture", 0) > 85 and inp.get("rainfall", 0) > 15,
        "risk_add": 1.8,
        "reason": "Waterlogged soil reduces oxygen availability, weakening roots and inviting bacterial/fungal pathogens.",
        "threats": ["Bacterial Wilt", "Root Rot", "Fusarium"]
    },
    {
        "id": "temp_stress",
        "name": "Temperature Stress",
        "condition": lambda w, inp: inp.get("temperature", 0) < 10 or inp.get("temperature", 0) > 40,
        "risk_add": 1.5,
        "reason": "Extreme temperatures stress plants, weakening immune responses and making them susceptible to opportunistic infections.",
        "threats": ["General Stress-Induced Disease", "Secondary Infections"]
    },
    {
        "id": "prolonged_moisture",
        "name": "Prolonged Leaf Wetness",
        "condition": lambda w, inp: inp.get("humidity", 0) > 90 and inp.get("rainfall", 0) > 5,
        "risk_add": 2.2,
        "reason": "Prolonged leaf wetness from high humidity and rain creates a breeding ground for bacterial and fungal leaf diseases.",
        "threats": ["Bacterial Leaf Spot", "Anthracnose", "Cercospora Leaf Spot"]
    },
    {
        "id": "moderate_risk_general",
        "name": "Moderate Environmental Risk",
        "condition": lambda w, inp: 60 <= inp.get("humidity", 0) <= 80 and 20 <= inp.get("temperature", 0) <= 30,
        "risk_add": 0.8,
        "reason": "Moderate humidity and warm temperatures — conditions are favorable for pest growth. Monitor regularly.",
        "threats": ["Aphids", "General Pest Activity"]
    },
]


class WeatherPredictionPlugin(BasePredictionPlugin):
    """
    Weather-based pest/disease risk predictor.
    
    Fetches real-time weather from OpenWeatherMap (if API key present)
    and applies expert agronomic rules to determine risk.
    """

    def __init__(self):
        self.api_key = None
        self.base_url = "https://api.openweathermap.org/data/2.5/weather"
        self.load_model()

    def load_model(self) -> None:
        """Initialize the weather API connection."""
        self.api_key = settings.openweather_api_key
        if not self.api_key:
            print("⚠️  OPENWEATHER_API_KEY not set. Weather plugin will use input values only (no live weather fetch).")
        else:
            print("✅ OpenWeatherMap API key loaded for weather-based predictions.")

    def _fetch_weather(self, location: str) -> Dict[str, Any] | None:
        """Fetch current weather data from OpenWeatherMap API."""
        if not self.api_key:
            return None

        try:
            params = {
                "q": location,
                "appid": self.api_key,
                "units": "metric"
            }
            response = requests.get(self.base_url, params=params, timeout=10)

            if response.status_code == 401:
                return {"error": "Invalid OpenWeatherMap API key. Please check OPENWEATHER_API_KEY in .env"}
            
            if response.status_code == 404:
                return {"error": f"Location '{location}' not found. Try a different city name."}

            if response.status_code != 200:
                return {"error": f"Weather API error (HTTP {response.status_code}): {response.text}"}

            data = response.json()
            return {
                "temperature": data["main"]["temp"],
                "humidity": data["main"]["humidity"],
                "pressure": data["main"]["pressure"],
                "wind_speed": data.get("wind", {}).get("speed", 0),
                "description": data["weather"][0]["description"] if data.get("weather") else "N/A",
                "clouds": data.get("clouds", {}).get("all", 0),
                "rain_1h": data.get("rain", {}).get("1h", 0),
                "location": data.get("name", location),
                "country": data.get("sys", {}).get("country", "")
            }
        except requests.exceptions.Timeout:
            return {"error": "Weather API request timed out. Try again later."}
        except requests.exceptions.ConnectionError:
            return {"error": "Could not connect to OpenWeatherMap API. Check internet connection."}
        except Exception as e:
            return {"error": f"Weather API error: {str(e)}"}

    def _evaluate_rules(self, weather_data: Dict | None, inputs: Dict) -> Dict[str, Any]:
        """Apply expert rules to weather + input data and calculate risk."""
        triggered_rules = []
        total_risk_score = 0
        all_threats = []

        # Merge weather data into inputs if available (weather overrides if present)
        merged_inputs = {**inputs}
        if weather_data and "error" not in weather_data:
            if "temperature" in weather_data:
                merged_inputs["api_temperature"] = weather_data["temperature"]
            if "humidity" in weather_data:
                merged_inputs["api_humidity"] = weather_data["humidity"]

        for rule in WEATHER_RULES:
            try:
                if rule["condition"](weather_data, merged_inputs):
                    triggered_rules.append({
                        "id": rule["id"],
                        "name": rule["name"],
                        "reason": rule["reason"],
                        "risk_contribution": rule["risk_add"]
                    })
                    total_risk_score += rule["risk_add"]
                    all_threats.extend(rule["threats"])
            except Exception:
                continue

        # Determine risk level from score
        if total_risk_score >= 5.5:
            risk_level = "Critical"
        elif total_risk_score >= 3.5:
            risk_level = "High"
        elif total_risk_score >= 1.5:
            risk_level = "Medium"
        else:
            risk_level = "Low"

        # Calculate probability (normalize score to 0-1)
        probability = min(total_risk_score / 8.0, 1.0)
        probability = round(probability, 3)

        # Deduplicate threats
        unique_threats = list(dict.fromkeys(all_threats))

        return {
            "risk_level": risk_level,
            "probability": probability,
            "triggered_rules": triggered_rules,
            "risk_score": round(total_risk_score, 2),
            "pest_threats": unique_threats[:6],
        }

    def _generate_weather_recommendations(self, risk_level: str, triggered_rules: list, threats: list) -> Dict[str, str]:
        """Generate recommendations based on weather-triggered rules."""
        if risk_level in ["Critical", "High"]:
            return {
                "immediate": (
                    f"URGENT: Weather conditions are highly favorable for {', '.join(threats[:2])}. "
                    f"Apply preventive fungicide/insecticide spray immediately. Increase field scouting to daily."
                ),
                "preventive": (
                    f"Improve drainage, ensure proper plant spacing for air flow. "
                    f"Remove any infected plant material. Avoid overhead irrigation."
                ),
                "organic": (
                    f"Apply Trichoderma viride or Pseudomonas fluorescens as bio-control agents. "
                    f"Use neem oil spray (3ml/L) every 5-7 days during high-risk weather windows."
                )
            }
        elif risk_level == "Medium":
            return {
                "immediate": (
                    f"Monitor closely — weather patterns suggest moderate risk for pest activity. "
                    f"Scout fields every 3-4 days for early symptoms."
                ),
                "preventive": (
                    f"Maintain field sanitation. Ensure balanced fertilization. "
                    f"Keep track of weather forecasts for the next 48-72 hours."
                ),
                "organic": (
                    f"Preventive neem oil application (2ml/L). Deploy pheromone and sticky traps. "
                    f"Support beneficial insect populations."
                )
            }
        else:
            return {
                "immediate": "Current weather conditions pose low risk. Continue routine monitoring.",
                "preventive": "Maintain standard crop management practices. Follow seasonal advisories.",
                "organic": "Focus on soil health and biodiversity. Use compost and organic mulch."
            }

    def predict(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Run weather-based prediction using API + expert rules."""
        weather_data = None
        weather_error = None

        # Fetch live weather if location provided and API key exists
        location = inputs.get("location", "")
        if location and self.api_key:
            weather_data = self._fetch_weather(location)
            if weather_data and "error" in weather_data:
                weather_error = weather_data["error"]
                weather_data = None
        elif not self.api_key and location:
            weather_error = "OPENWEATHER_API_KEY is not configured in .env. Using manual input values only."

        # Evaluate rules
        evaluation = self._evaluate_rules(weather_data, inputs)

        # Build reason
        if evaluation["triggered_rules"]:
            reasons = [r["reason"] for r in evaluation["triggered_rules"][:3]]
            reason = " | ".join(reasons)
        else:
            reason = "Current weather and environmental conditions indicate low pest/disease risk. Maintain regular monitoring."

        recommendations = self._generate_weather_recommendations(
            evaluation["risk_level"],
            evaluation["triggered_rules"],
            evaluation["pest_threats"]
        )

        result = {
            "risk_level": evaluation["risk_level"],
            "probability": evaluation["probability"],
            "reason": reason,
            "pest_threats": evaluation["pest_threats"],
            "recommendations": recommendations,
            "triggered_rules": evaluation["triggered_rules"],
            "risk_score": evaluation["risk_score"],
            "source": "weather_api",
            "weather_data": weather_data,
        }

        if weather_error:
            result["weather_error"] = weather_error

        return result
