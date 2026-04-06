"""
Gemini AI Prediction Plugin for Pest & Disease Forecasting.

Uses Google Gemini API to analyze environmental + crop parameters
and predict pest/disease risks with expert-level reasoning.

Requires GEMINI_API_KEY in .env.
"""

import requests
import json
import time
from typing import Dict, Any, List
from ..core.prediction_interface import BasePredictionPlugin
from ..core.config import settings

# ─── Model fallback chain (tries in order until one works) ───────
GEMINI_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
]


class GeminiPredictionPlugin(BasePredictionPlugin):
    """
    Uses Gemini AI to predict pest/disease risk from environmental data.
    Automatically falls back to alternative models if rate-limited.
    """

    def __init__(self):
        self.api_key = None
        self.models = GEMINI_MODELS
        self.load_model()

    def load_model(self) -> None:
        """Initialize Gemini API connection."""
        self.api_key = settings.gemini_api_key
        if not self.api_key:
            print("⚠️  GEMINI_API_KEY not set. API prediction mode will return error.")
        else:
            print(f"✅ Gemini API key loaded for pest prediction. Models: {' → '.join(self.models)}")

    def _call_gemini(self, model_name: str, prompt: str) -> dict:
        """
        Make a single Gemini API call. Returns the raw response dict.
        Raises an exception with the error message if it fails.
        """
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 2000,
                "responseMimeType": "application/json",
                "responseSchema": {
                    "type": "object",
                    "properties": {
                        "risk_level": {
                            "type": "string",
                            "description": "Risk level: Low, Medium, High, or Critical"
                        },
                        "probability": {
                            "type": "number",
                            "description": "Risk probability between 0.0 and 1.0"
                        },
                        "reason": {
                            "type": "string",
                            "description": "Detailed explanation of the risk assessment"
                        },
                        "pest_threats": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "name": {"type": "string", "description": "Name of disease/pest"},
                                    "probability": {"type": "number", "description": "Probability percentage 0-100"},
                                    "advisory": {
                                        "type": "object",
                                        "properties": {
                                            "immediate": {"type": "string"},
                                            "preventive": {"type": "string"},
                                            "organic": {"type": "string"}
                                        }
                                    }
                                },
                                "required": ["name", "probability", "advisory"]
                            },
                            "description": "List of likely pest and disease threats sorted by probability"
                        },
                        "recommendations": {
                            "type": "object",
                            "properties": {
                                "immediate": {"type": "string"},
                                "preventive": {"type": "string"},
                                "organic": {"type": "string"}
                            },
                            "description": "General top-level IPM recommendations"
                        }
                    },
                    "required": ["risk_level", "probability", "reason", "pest_threats", "recommendations"]
                }
            }
        }

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.api_key}"
        response = requests.post(url, headers=headers, json=payload, timeout=25)

        if response.status_code == 429 or response.status_code == 503:
            # Rate limited or overloaded — raise so fallback kicks in
            error_data = response.json()
            msg = error_data.get("error", {}).get("message", f"HTTP {response.status_code}")
            raise Exception(f"RATE_LIMITED:{model_name}:{msg}")

        if response.status_code != 200:
            error_data = response.json()
            msg = error_data.get("error", {}).get("message", f"HTTP {response.status_code}")
            raise Exception(msg)

        return response.json()

    def predict(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Use Gemini AI to predict pest/disease risk.
        Automatically falls back through model chain if rate-limited.
        """
        if not self.api_key:
            return {
                "risk_level": "Medium",
                "probability": 0.0,
                "reason": "Gemini API key is not configured. Please add GEMINI_API_KEY to your .env file.",
                "pest_threats": [],
                "recommendations": {
                    "immediate": "Configure GEMINI_API_KEY in .env to enable AI predictions.",
                    "preventive": "N/A",
                    "organic": "N/A"
                },
                "source": "gemini_api",
                "error": "GEMINI_API_KEY not configured"
            }

        prompt = self._build_prompt(inputs)
        last_error = None

        # Try each model in the fallback chain
        for i, model_name in enumerate(self.models):
            try:
                print(f"🔄 Trying Gemini model: {model_name} (attempt {i+1}/{len(self.models)})")
                result_json = self._call_gemini(model_name, prompt)

                # Extract response
                if not result_json.get("candidates") or len(result_json["candidates"]) == 0:
                    last_error = "No response from Gemini (possibly blocked by safety filters)."
                    continue

                candidate = result_json["candidates"][0]
                if "content" not in candidate:
                    last_error = "Gemini response blocked by safety filters."
                    continue

                content = candidate["content"]["parts"][0]["text"].strip()

                # Parse JSON
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    content = content.replace("```", "").strip()

                print(f"RAW GEMINI CONTENT: {content}")

                start_idx = content.find('{')
                end_idx = content.rfind('}')
                if start_idx != -1 and end_idx != -1:
                    parsed = json.loads(content[start_idx:end_idx + 1])
                else:
                    last_error = "Could not parse Gemini response as JSON."
                    continue

                # Normalize risk level
                risk_level = parsed.get("risk_level", "Medium")
                if risk_level not in ("Low", "Medium", "High", "Critical"):
                    risk_level = "Medium"

                probability = float(parsed.get("probability", 0.5))
                probability = min(max(probability, 0.0), 1.0)

                print(f"✅ Gemini prediction successful using {model_name}")
                return {
                    "risk_level": risk_level,
                    "probability": round(probability, 3),
                    "reason": parsed.get("reason", "AI analysis complete."),
                    "pest_threats": parsed.get("pest_threats", []),
                    "recommendations": parsed.get("recommendations", {
                        "immediate": "Consult local agricultural expert.",
                        "preventive": "Maintain field hygiene.",
                        "organic": "Use standard organic practices."
                    }),
                    "source": "gemini_api",
                    "model": model_name
                }

            except json.JSONDecodeError as e:
                print(f"❌ JSON parse error from {model_name}: {e}")
                last_error = f"Failed to parse response from {model_name}"
                continue
            except Exception as e:
                error_msg = str(e)
                print(f"⚠️ {model_name} failed: {error_msg}")
                if "RATE_LIMITED" in error_msg:
                    last_error = f"{model_name} rate-limited"
                    if i < len(self.models) - 1:
                        print(f"   ↳ Falling back to next model...")
                        time.sleep(1)  # Brief pause before trying next model
                    continue
                else:
                    last_error = error_msg
                    continue

        # All models failed
        return self._error_result(
            f"All Gemini models exhausted ({', '.join(self.models)}). "
            f"Last error: {last_error}. Please wait 60 seconds and try again, "
            f"or use 'Model' mode which works offline."
        )

    def _build_prompt(self, inputs: Dict[str, Any]) -> str:
        """Build the analysis prompt for Gemini."""
        return (
            f"You are an expert agricultural scientist specializing in Integrated Pest Management (IPM) "
            f"and plant pathology. Analyze the following crop and environmental conditions and predict "
            f"the pest and disease risk level.\n\n"
            f"CROP & ENVIRONMENTAL DATA:\n"
            f"- Crop Type: {inputs.get('crop_type', 'unknown')}\n"
            f"- Temperature: {inputs.get('temperature', 'N/A')}°C\n"
            f"- Humidity: {inputs.get('humidity', 'N/A')}%\n"
            f"- Rainfall: {inputs.get('rainfall', 'N/A')} mm\n"
            f"- Light Intensity: {inputs.get('raw_light_ldr', inputs.get('light_intensity', 'Unknown'))} lux\n"
            f"- Soil Moisture: {inputs.get('soil_moisture', 'N/A')}%\n"
            f"- Plant Age: {inputs.get('plant_age_days', 'N/A')} days since sowing\n"
            f"- Location: {inputs.get('location', 'Not specified')}\n\n"
            f"Based on your expertise, provide:\n"
            f"1. risk_level: One of 'Low', 'Medium', 'High', or 'Critical'\n"
            f"2. probability: A decimal between 0.0 and 1.0 representing the confidence\n"
            f"3. reason: A detailed 2-3 sentence explanation of WHY this risk level\n"
            f"4. pest_threats: An array of objects, where each object contains a 'name' (string) of the pest/disease, a 'probability' (integer 0-100 representing percentage likelihood), and an 'advisory' object.\n"
            f"5. recommendations: An object with 'immediate' (urgent action), 'preventive' (long-term), "
            f"and 'organic' (eco-friendly) treatment recommendations\n\n"
            f"Consider seasonal patterns, regional pest pressure, and the interaction between "
            f"environmental factors including light intensity when making your assessment."
        )

    def _error_result(self, message: str) -> Dict[str, Any]:
        """Return a standardized error result."""
        return {
            "risk_level": "Medium",
            "probability": 0.0,
            "reason": message,
            "pest_threats": [],
            "recommendations": {
                "immediate": "Unable to generate AI recommendations. Please try again or consult a local expert.",
                "preventive": "N/A",
                "organic": "N/A"
            },
            "source": "gemini_api",
            "error": message
        }
