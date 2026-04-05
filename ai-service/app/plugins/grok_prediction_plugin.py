"""
Grok API Prediction Plugin for Pest & Disease Forecasting.

Uses xAI's Grok API to analyze environmental + crop parameters
and predict pest/disease risks.

Requires GROK_API_KEY in .env.
"""

import requests
import json
import time
from typing import Dict, Any, List
from ..core.prediction_interface import BasePredictionPlugin
from ..core.config import settings

GROK_MODELS = [
    "grok-2-latest",
]

class GrokPredictionPlugin(BasePredictionPlugin):
    """
    Uses Grok AI to predict pest/disease risk from environmental data.
    """

    def __init__(self):
        self.api_key = None
        self.models = GROK_MODELS
        self.load_model()

    def load_model(self) -> None:
        """Initialize Grok API connection."""
        self.api_key = settings.grok_api_key
        if not self.api_key:
            print("⚠️  GROK_API_KEY not set. API prediction mode will return error.")
        else:
            print(f"✅ Grok API key loaded for pest prediction. Models: {' → '.join(self.models)}")

    def _call_grok(self, model_name: str, prompt: str) -> dict:
        """
        Make a single Grok API call. Returns the raw response dict.
        Raises an exception with the error message if it fails.
        """
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        
        payload = {
            "model": model_name,
            "messages": [
                {
                    "role": "system",
                    "content": "You are an expert agricultural scientist specializing in Integrated Pest Management (IPM) and plant pathology. You MUST strictly output raw, valid JSON. DO NOT wrap your output in markdown blocks like ```json."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.3,
            "response_format": {"type": "json_object"}
        }

        url = "https://api.x.ai/v1/chat/completions"
        if self.api_key and self.api_key.startswith("gsk_"):
            url = "https://api.groq.com/openai/v1/chat/completions"
            payload["model"] = "llama-3.3-70b-versatile"
            
        response = requests.post(url, headers=headers, json=payload, timeout=25)

        if response.status_code == 429 or response.status_code == 503:
            error_data = response.json() if "application/json" in response.headers.get("Content-Type", "") else {}
            msg = error_data.get("error", {}).get("message", f"HTTP {response.status_code}")
            raise Exception(f"RATE_LIMITED:{model_name}:{msg}")

        if response.status_code != 200:
            try:
                error_data = response.json()
                msg = error_data.get("error", {}).get("message", f"HTTP {response.status_code}")
            except Exception:
                msg = f"HTTP {response.status_code} - {response.text}"
            raise Exception(msg)

        return response.json()

    def predict(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Use Grok AI to predict pest/disease risk.
        """
        if not self.api_key:
            return {
                "risk_level": "Medium",
                "probability": 0.0,
                "reason": "Grok API key is not configured. Please add GROK_API_KEY to your .env file.",
                "pest_threats": [],
                "recommendations": {
                    "immediate": "Configure GROK_API_KEY in .env to enable AI predictions.",
                    "preventive": "N/A",
                    "organic": "N/A"
                },
                "source": "grok_api",
                "error": "GROK_API_KEY not configured"
            }

        prompt = self._build_prompt(inputs)
        last_error = None

        # Try each model in the fallback chain (though normally just 1 for Grok)
        for i, model_name in enumerate(self.models):
            try:
                print(f"🔄 Trying Grok model: {model_name} (attempt {i+1}/{len(self.models)})")
                result_json = self._call_grok(model_name, prompt)

                # Extract response
                if not result_json.get("choices") or len(result_json["choices"]) == 0:
                    last_error = "No response from Grok."
                    continue

                content = result_json["choices"][0]["message"]["content"].strip()

                # Robust JSON parsing
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    content = content.replace("```", "").strip()

                start_idx = content.find('{')
                end_idx = content.rfind('}')
                if start_idx != -1 and end_idx != -1:
                    parsed = json.loads(content[start_idx:end_idx + 1])
                else:
                    last_error = "Could not parse Grok response as JSON."
                    continue

                # Normalize risk level
                risk_level = parsed.get("risk_level", "Medium")
                if risk_level not in ("Low", "Medium", "High", "Critical"):
                    risk_level = "Medium"

                probability = float(parsed.get("probability", 0.5))
                probability = min(max(probability, 0.0), 1.0)

                print(f"✅ Grok prediction successful using {model_name}")
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
                    "source": "grok_api",
                    "model": model_name
                }

            except json.JSONDecodeError as e:
                print(f"❌ JSON parse error from {model_name}: {e}\nContent was: {content}")
                last_error = f"Failed to parse response from {model_name}"
                continue
            except Exception as e:
                error_msg = str(e)
                print(f"⚠️ {model_name} failed: {error_msg}")
                if "RATE_LIMITED" in error_msg:
                    last_error = f"{model_name} rate-limited"
                    if i < len(self.models) - 1:
                        print(f"   ↳ Falling back to next model...")
                        time.sleep(1)
                    continue
                else:
                    last_error = error_msg
                    continue

        return self._error_result(
            f"All Grok models exhausted ({', '.join(self.models)}). "
            f"Last error: {last_error}. Please use 'Model' mode which works offline."
        )

    def _build_prompt(self, inputs: Dict[str, Any]) -> str:
        """Build the analysis prompt and enforce JSON format for Grok."""
        return (
            f"Analyze the following crop and environmental conditions and predict "
            f"the pest and disease risk level.\n\n"
            f"CROP & ENVIRONMENTAL DATA:\n"
            f"- Crop Type: {inputs.get('crop_type', 'unknown')}\n"
            f"- Temperature: {inputs.get('temperature', 'N/A')}°C\n"
            f"- Humidity: {inputs.get('humidity', 'N/A')}%\n"
            f"- Rainfall: {inputs.get('rainfall', 'N/A')} mm\n"
            f"- Light Intensity: {inputs.get('light_intensity', 'Unknown')} lux\n"
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
            f"You MUST strictly format your response matching this JSON schema exactly:\n"
            f"{{\n"
            f"  \"risk_level\": \"High\",\n"
            f"  \"probability\": 0.85,\n"
            f"  \"reason\": \"...\",\n"
            f"  \"pest_threats\": [\n"
            f"    {{\"name\": \"...\", \"probability\": 85, \"advisory\": {{\"immediate\": \"...\", \"preventive\": \"...\", \"organic\": \"...\"}}}}\n"
            f"  ],\n"
            f"  \"recommendations\": {{\"immediate\": \"...\", \"preventive\": \"...\", \"organic\": \"...\"}}\n"
            f"}}\n\n"
            f"Ensure output is strictly JSON without markdown."
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
            "source": "grok_api",
            "error": message
        }
