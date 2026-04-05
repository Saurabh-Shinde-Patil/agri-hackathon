import base64
import requests
import json
import io
from typing import Dict, Any
from PIL import Image
from ..core.plugin_interface import BaseDetectionPlugin
from ..core.config import settings
import re

class APIPlugin(BaseDetectionPlugin):
    """
    Calls external AI (Gemini or Grok) to detect plant disease.
    """
    
    def __init__(self):
        self.gemini_key = None
        self.grok_key = None
        self.load_model()
        
    def load_model(self) -> None:
        self.gemini_key = settings.gemini_api_key
        self.grok_key = settings.grok_api_key
        if not self.gemini_key and not self.grok_key:
            print("WARNING: No API Keys found. API mode will fallback to mock.")

    def predict(self, image: Image.Image, provider: str = "gemini") -> Dict[str, Any]:
        default_advisory = {
            "organic": "Consult a local agricultural expert for organic treatments.",
            "chemical": "Use standard approved fungicides or pesticides after careful verification.",
            "preventive": "Ensure proper spacing, good drainage, and remove infected crop debris."
        }
        
        active_key = self.grok_key if provider == "grok" else self.gemini_key
        
        if not active_key:
            return {
                "disease_name": f"{provider.upper()} API Key Missing (Mock Result)",
                "confidence_score": 0.88,
                "suggestions": [{"name": "Provide actual key", "confidence": 1.0}],
                "advisory": default_advisory
            }
            
        try:
            buffered = io.BytesIO()
            image.save(buffered, format="JPEG")
            img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
            
            prompt_text = 'Analyze this plant leaf. Identify the plant and the diseases (if any). If healthy, state "Healthy". Generate a ranked array of likely diseases affecting the plant sorted by highest probability first. Each disease must have a probability (integer 0-100) and a detailed Integrated Pest Management (IPM) analysis including organic, chemical, and preventive measures. Respond in strict JSON format ONLY without markdown: {"plant_name": "...", "diseases": [{"name": "...", "probability": 95, "description": "...", "symptoms": "...", "causes": "...", "how_it_spreads": "...", "core_recommendation": "...", "advisory": {"organic": "...", "chemical": "...", "preventive": "..."}}]}'
            
            if provider == "grok":
                is_groq = active_key and active_key.startswith("gsk_")
                has_together = settings.together_api_key is not None
                
                if has_together:
                    # Route to Together AI Llama Vision
                    url = "https://api.together.xyz/v1/chat/completions"
                    headers = {
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {settings.together_api_key}"
                    }
                    payload = {
                        "model": "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo",
                        "messages": [
                            {
                                "role": "user",
                                "content": [
                                    {"type": "text", "text": prompt_text},
                                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{img_str}"}}
                                ]
                            }
                        ],
                        "temperature": 0.2,
                        "response_format": {"type": "json_object"}
                    }
                elif is_groq:
                    return {
                        "disease_name": "Groq/Together Vision Required", 
                        "confidence_score": 0.0, 
                        "suggestions": [{"name": "Groq decommissioned vision models. To use Llama Vision, add TOGETHER_API_KEY to your .env file.", "confidence": 1.0}], 
                        "advisory": default_advisory,
                        "error": "Groq Vision Disabled"
                    }
                else:    
                    url = "https://api.x.ai/v1/chat/completions"
                    model_name = "grok-2-vision-1212"
                    
                    headers = {
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {active_key}"
                    }
                    payload = {
                        "model": model_name,
                        "messages": [
                            {
                                "role": "user",
                                "content": [
                                    {"type": "text", "text": prompt_text},
                                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{img_str}"}}
                                ]
                            }
                        ],
                        "temperature": 0.2,
                        "response_format": {"type": "json_object"}
                    }
            else:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={active_key}"
                headers = {"Content-Type": "application/json"}
                payload = {
                    "contents": [{
                        "parts": [
                            {"text": prompt_text},
                            {"inline_data": {"mime_type": "image/jpeg", "data": img_str}}
                        ]
                    }],
                    "generationConfig": {
                        "temperature": 0.2,
                        "responseMimeType": "application/json"
                    }
                }
            
            response = requests.post(url, headers=headers, json=payload, timeout=25)
            
            if response.status_code != 200:
                error_data = response.json() if "application/json" in response.headers.get("Content-Type", "") else {}
                msg = error_data.get("error", {}).get("message", "Unknown API error")
                return {"disease_name": f"{provider} Error: {msg}", "confidence_score": 0.0, "suggestions": []}

            result_json = response.json()
            
            # Extract content from response
            if provider == "grok":
                if not result_json.get("choices"):
                    return {"disease_name": "API Error: No response from Grok", "confidence_score": 0.0, "suggestions": [], "advisory": default_advisory}
                content = result_json["choices"][0]["message"]["content"].strip()
            else:
                if not result_json.get("candidates") or len(result_json["candidates"]) == 0:
                    return {"disease_name": "API Error: Safety Filter Blocked Response", "confidence_score": 0.0, "suggestions": [], "advisory": default_advisory}
                content = result_json["candidates"][0]["content"]["parts"][0]["text"].strip()
            
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.replace("```", "").strip()

            d_name = "Analysis Complete (See Details)"
            c_score = 0.80
            advisory = default_advisory

            try:
                start_idx = content.find('{')
                end_idx = content.rfind('}')
                if start_idx != -1 and end_idx != -1:
                    json_str = content[start_idx:end_idx+1]
                    parsed = json.loads(json_str)
                    
                    p_name = parsed.get("plant_name", "Leaf Content")
                    diseases = parsed.get("diseases", [])
                    if len(diseases) > 0:
                        top = diseases[0]
                        d_name = top.get("name", "Unknown Disease")
                        c_score = top.get("probability", 80) / 100.0 if top.get("probability", 80) > 1 else top.get("probability", 0.8)
                        advisory = top.get("advisory", default_advisory)
                        
                        return {
                            "plant_name": p_name,
                            "disease_name": d_name,
                            "confidence_score": min(max(c_score, 0.0), 1.0),
                            "description": top.get("description", "Analysis processed."),
                            "symptoms": top.get("symptoms", "Check visual markers."),
                            "causes": top.get("causes", "Environmental factors."),
                            "how_it_spreads": top.get("how_it_spreads", "Contact or airborne."),
                            "core_recommendation": top.get("core_recommendation", "Consult an expert."),
                            "diseases": diseases,
                            "suggestions": [],
                            "advisory": advisory
                        }
                    else:
                        d_name = "Healthy or No Clear Condition"
                        return {
                            "plant_name": p_name,
                            "disease_name": d_name,
                            "confidence_score": 0.8,
                            "description": "No imminent diseases found.",
                            "diseases": [{"name": "Healthy", "probability": 100, "description": "No symptoms detected.", "symptoms": "N/A", "causes": "N/A", "how_it_spreads": "N/A", "core_recommendation": "Continue healthy practices", "advisory": default_advisory}],
                            "suggestions": [],
                            "advisory": default_advisory
                        }
                else:
                    return {"disease_name": "API Error: No JSON found", "confidence_score": 0.0, "suggestions": [], "advisory": default_advisory}
            except Exception as e:
                print(f"INNER ERROR parsing API JSON: {e}")
                return {"disease_name": d_name, "confidence_score": c_score, "suggestions": [], "advisory": advisory}

        except Exception as e:
            print(f"ERROR in API plugin: {e}")
            return {"disease_name": f"System Error: {str(e)}", "confidence_score": 0.0, "suggestions": [], "advisory": default_advisory}

    def get_advisory(self, disease_name: str, provider: str = "gemini") -> Dict[str, str]:
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
        
        active_key = self.grok_key if provider == "grok" else self.gemini_key
        
        if not active_key or disease_name in ["Unknown", "No detection", "Analysis Complete (See Details)", "Unknown Disease"]:
            return default_resp
            
        try:
            prompt_text = f'Provide Integrated Pest Management advisory for the plant condition: "{disease_name}". Respond ONLY with valid JSON containing keys: plant_name, description, symptoms, causes, how_it_spreads, core_recommendation, and an advisory object (organic, chemical, preventive).'
            
            if provider == "grok":
                is_groq = active_key and active_key.startswith("gsk_")
                url = "https://api.groq.com/openai/v1/chat/completions" if is_groq else "https://api.x.ai/v1/chat/completions"
                model_name = "llama-3.3-70b-versatile" if is_groq else "grok-2-latest"
                
                headers = {"Content-Type": "application/json", "Authorization": f"Bearer {active_key}"}
                payload = {
                    "model": model_name,
                    "messages": [{"role": "user", "content": prompt_text}],
                    "temperature": 0.2,
                    "response_format": {"type": "json_object"}
                }
            else:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={active_key}"
                headers = {"Content-Type": "application/json"}
                payload = {
                    "contents": [{"parts": [{"text": prompt_text}]}],
                    "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"}
                }
            
            response = requests.post(url, headers=headers, json=payload, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                if provider == "grok" and "choices" in data:
                    content = data["choices"][0]["message"]["content"].strip()
                elif "candidates" in data and len(data["candidates"]) > 0:
                    content = data["candidates"][0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()
                else:
                    content = ""
                    
                if content:
                    start_idx = content.find('{')
                    end_idx = content.rfind('}')
                    if start_idx != -1 and end_idx != -1:
                        parsed = json.loads(content[start_idx:end_idx+1])
                        return parsed
        except Exception as e:
            print(f"ERROR getting advisory from API: {e}")
            
        return default_resp
