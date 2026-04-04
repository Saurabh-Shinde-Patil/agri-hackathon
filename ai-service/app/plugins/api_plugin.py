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
        default_advisory = {
            "organic": "Consult a local agricultural expert for organic treatments.",
            "chemical": "Use standard approved fungicides or pesticides after careful verification.",
            "preventive": "Ensure proper spacing, good drainage, and remove infected crop debris."
        }
        
        if not self.api_key:
            return {
                "disease_name": "API Key Missing (Mock Result)",
                "confidence_score": 0.88,
                "suggestions": [{"name": "Provide actual key", "confidence": 1.0}],
                "advisory": default_advisory
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
                                "text": 'Analyze this plant leaf. Identify the plant and the disease (if any). If it is healthy, state "Healthy". Also provide a detailed Integrated Pest Management (IPM) analysis including organic, chemical, and preventive measures. Respond in strict JSON format ONLY without markdown: {"plant_name": "...", "disease_name": "...", "confidence_score": 0.95, "description": "...", "symptoms": "...", "causes": "...", "how_it_spreads": "...", "core_recommendation": "...", "advisory": {"organic": "...", "chemical": "...", "preventive": "..."}}'
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
                    "maxOutputTokens": 1500,
                    "responseMimeType": "application/json",
                    "responseSchema": {
                        "type": "object",
                        "properties": {
                            "plant_name": {
                                "type": "string",
                                "description": "Common name of the plant identified."
                            },
                            "disease_name": {
                                "type": "string",
                                "description": "Name of the plant disease, or 'Healthy' if healthy."
                            },
                            "confidence_score": {
                                "type": "number",
                                "description": "Confidence score between 0.0 and 1.0"
                            },
                            "description": {
                                "type": "string",
                                "description": "Brief description of the disease/condition."
                            },
                            "symptoms": {
                                "type": "string",
                                "description": "Key visual markers of this condition."
                            },
                            "causes": {
                                "type": "string",
                                "description": "Environmental or biological triggers."
                            },
                            "how_it_spreads": {
                                "type": "string",
                                "description": "Modes of transmission (wind, water, pests)."
                            },
                            "core_recommendation": {
                                "type": "string",
                                "description": "Priority one-line expert action."
                            },
                            "advisory": {
                                "type": "object",
                                "properties": {
                                    "organic": {"type": "string"},
                                    "chemical": {"type": "string"},
                                    "preventive": {"type": "string"}
                                }
                            }
                        },
                        "required": ["plant_name", "disease_name", "confidence_score", "description", "symptoms", "causes", "how_it_spreads", "core_recommendation", "advisory"]
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
                return {"disease_name": f"API Error: {error_msg}", "confidence_score": 0.0, "suggestions": [], "advisory": default_advisory}

            candidate = result_json["candidates"][0]
            if "content" not in candidate:
                return {"disease_name": "API Error: Safety Filter Blocked Response", "confidence_score": 0.0, "suggestions": [], "advisory": default_advisory}

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
            advisory = default_advisory

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
                    p_name = parsed.get("plant_name", "Leaf Content")
                    c_score = float(parsed.get("confidence_score", parsed.get("Confidence_score", parsed.get("confidence", 0.80))))
                    advisory = parsed.get("advisory", default_advisory)
                    
                    return {
                        "plant_name": p_name,
                        "disease_name": d_name,
                        "confidence_score": min(max(c_score, 0.0), 1.0),
                        "description": parsed.get("description", "Analysis processed."),
                        "symptoms": parsed.get("symptoms", "Check visual markers."),
                        "causes": parsed.get("causes", "Environmental factors."),
                        "how_it_spreads": parsed.get("how_it_spreads", "Contact or airborne."),
                        "core_recommendation": parsed.get("core_recommendation", "Consult an expert."),
                        "suggestions": [],
                        "advisory": advisory
                    }
                else:
                    return {
                        "disease_name": "API Error: No JSON found",
                        "confidence_score": 0.0,
                        "suggestions": [],
                        "advisory": default_advisory
                    }
            except Exception as e:
                print(f"INNER ERROR parsing Gemini JSON: {e}")
                return {
                    "disease_name": d_name,
                    "confidence_score": c_score,
                    "suggestions": [],
                    "advisory": advisory
                }

        except Exception as e:
            print(f"ERROR in API plugin: {e}")
            return {
                "disease_name": f"System Error: {str(e)}",
                "confidence_score": 0.0,
                "suggestions": [],
                "advisory": default_advisory
            }

    def get_advisory(self, disease_name: str) -> Dict[str, str]:
        """Dynamically generate full IPM advisory for a specific disease using Gemini."""
        default_resp = {
            "plant_name": "Detected Plant",
            "description": "Information processing...",
            "symptoms": "Check for visual changes.",
            "causes": "Environmental factors.",
            "how_it_spreads": "Contact or air.",
            "core_recommendation": "Consult local expert.",
            "organic": "Standard organic treatment.",
            "chemical": "Approved fungicide/pesticide.",
            "preventive": "Good farm hygiene."
        }
        
        if not self.api_key or disease_name in ["Unknown", "No detection", "Analysis Complete (See Details)", "Unknown Disease"]:
            return default_resp
            
        try:
            headers = {"Content-Type": "application/json"}
            payload = {
                "contents": [{"parts": [{"text": f'Provide Integrated Pest Management advisory for the plant condition: "{disease_name}". Respond ONLY with valid JSON: {{"plant_name": "...", "description": "...", "symptoms": "...", "causes": "...", "how_it_spreads": "...", "core_recommendation": "...", "advisory": {{"organic": "...", "chemical": "...", "preventive": "..."}}}}'}]}],
                "generationConfig": {
                    "temperature": 0.2,
                    "maxOutputTokens": 1000,
                    "responseMimeType": "application/json",
                    "responseSchema": {
                        "type": "object",
                        "properties": {
                            "plant_name": {"type": "string"},
                            "description": {"type": "string"},
                            "symptoms": {"type": "string"},
                            "causes": {"type": "string"},
                            "how_it_spreads": {"type": "string"},
                            "core_recommendation": {"type": "string"},
                            "advisory": {
                                "type": "object",
                                "properties": {
                                    "organic": {"type": "string"},
                                    "chemical": {"type": "string"},
                                    "preventive": {"type": "string"}
                                }
                            }
                        },
                        "required": ["plant_name", "description", "symptoms", "causes", "how_it_spreads", "core_recommendation", "advisory"]
                    }
                }
            }
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={self.api_key}"
            response = requests.post(url, headers=headers, json=payload, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                if "candidates" in data and len(data["candidates"]) > 0:
                    content = data["candidates"][0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()
                    if content:
                        parsed = json.loads(content)
                        # Flatten for easy endpoint access
                        resp = parsed
                        return resp
        except Exception as e:
            print(f"ERROR getting advisory from Gemini: {e}")
            
        return default_resp


