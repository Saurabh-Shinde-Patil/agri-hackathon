import base64
import requests
import json
import io
from typing import Dict, Any
from PIL import Image
from ..core.plugin_interface import BaseDetectionPlugin
from ..core.config import settings

class APIPlugin(BaseDetectionPlugin):
    """
    Calls external AI (Gemini) to detect plant disease.
    Dynamically finds the best available Flash model.
    """
    
    def __init__(self):
        self.api_key = None
        self.model_name = "gemini-1.5-flash" # Default fallback
        self.load_model()
        
    def load_model(self) -> None:
        self.api_key = settings.gemini_api_key
        if not self.api_key:
            print("WARNING: Gemini API Key not found. API mode will fallback to mock.")
        self.model_name = "gemini-2.5-flash"

    def predict(self, image: Image.Image) -> Dict[str, Any]:
        if not self.api_key:
            return {
                "disease_name": "API Key Missing (Mock Result)",
                "confidence_score": 0.88,
                "suggestions": [{"name": "Provide actual key", "confidence": 1.0}]
            }
            
        try:
            # Convert PIL image to base64
            buffered = io.BytesIO()
            image.save(buffered, format="JPEG")
            img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
            
            headers = {
                "Content-Type": "application/json"
            }
            
            payload = {
                "contents": [
                    {
                        "parts": [
                            {
                                "text": 'Analyze this plant leaf. If there is a disease, what is it? If it is healthy, state "Healthy". Respond in strict JSON format ONLY without markdown formatting: {"disease_name": "...", "confidence_score": 0.95}'
                            },
                            {
                                "inline_data": {
                                    "mime_type": "image/jpeg",
                                    "data": img_str
                                }
                            }
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.2,
                    "maxOutputTokens": 1024,
                    "responseMimeType": "application/json",
                    "responseSchema": {
                        "type": "object",
                        "properties": {
                            "disease_name": {
                                "type": "string",
                                "description": "Name of the plant disease, or 'Healthy' if healthy."
                            },
                            "confidence_score": {
                                "type": "number",
                                "description": "Confidence score between 0.0 and 1.0"
                            }
                        },
                        "required": ["disease_name", "confidence_score"]
                    }
                }
            }
            
            # Use v1beta for widest model support
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={self.api_key}"
            response = requests.post(url, headers=headers, json=payload, timeout=20)
            
            if response.status_code != 200:
                # Handle common quota/model errors
                error_data = response.json()
                msg = error_data.get("error", {}).get("message", "Unknown API error")
                return {"disease_name": f"Gemini Error: {msg}", "confidence_score": 0.0, "suggestions": []}

            result_json = response.json()
            
            # Check for candidates
            if not result_json.get("candidates") or len(result_json["candidates"]) == 0:
                error_msg = result_json.get("error", {}).get("message", "No candidates returned (Safety Blocked).")
                return {"disease_name": f"API Error: {error_msg}", "confidence_score": 0.0, "suggestions": []}

            candidate = result_json["candidates"][0]
            if "content" not in candidate:
                return {"disease_name": "API Error: Safety Filter Blocked Response", "confidence_score": 0.0, "suggestions": []}

            content = candidate["content"]["parts"][0]["text"].strip()
            
            # Helper to strip markdown if it exists
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.replace("```", "").strip()

            import re
            
            # Fallback values
            d_name = "Analysis Complete (See Details)"
            c_score = 0.80

            try:
                # Find the first { and last }
                print(f"DEBUG GEMINI RAW CONTENT: {content}")
                start_idx = content.find('{')
                end_idx = content.rfind('}')
                if start_idx != -1 and end_idx != -1:
                    json_str = content[start_idx:end_idx+1]
                    parsed = json.loads(json_str)
                    
                    # Account for capitalization variations
                    d_name = parsed.get("disease_name", parsed.get("Disease_name", parsed.get("disease", "Unknown Disease")))
                    c_score = float(parsed.get("confidence_score", parsed.get("Confidence_score", parsed.get("confidence", 0.80))))
                else:
                    raise json.JSONDecodeError("No JSON brackets found", content, 0)
            except Exception:
                # Failsafe regex extraction if JSON is malformed
                d_match = re.search(r'"(?:disease|Disease|disease_name|name|prediction|class)"\s*:\s*"([^"]+)"', content, re.IGNORECASE)
                if d_match:
                    d_name = d_match.group(1)
                else:
                    # Just grab the first quoted string as a highly loose fallback
                    any_str = re.search(r'"([^"]+)"', content)
                    if any_str and len(any_str.group(1)) > 3 and not any_str.group(1).replace(".", "").isdigit():
                        d_name = any_str.group(1).title()

                c_match = re.search(r'"(?:confidence_score|confidence|score|prob|probability)"\s*:\s*([\d\.]+)', content, re.IGNORECASE)
                if c_match:
                    c_score = float(c_match.group(1))
                else:
                    # Look for any naked decimal number
                    any_num = re.search(r'0\.[\d]+', content)
                    if any_num:
                        c_score = float(any_num.group(0))

            return {
                "disease_name": d_name,
                "confidence_score": min(max(c_score, 0.0), 1.0),
                "suggestions": []
            }

        except Exception as e:
            print(f"ERROR in API plugin: {e}")
            return {
                "disease_name": f"System Error: {str(e)}",
                "confidence_score": 0.0,
                "suggestions": []
            }
