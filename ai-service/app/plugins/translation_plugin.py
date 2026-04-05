import json
from ..core.config import settings
import requests
import google.generativeai as genai

class TranslationPlugin:
    """
    Translates JSON dictionary values continuously based on language.
    """
    def __init__(self):
        self.gemini_key = settings.gemini_api_key
        self.grok_key = settings.grok_api_key
        if self.gemini_key:
            genai.configure(api_key=self.gemini_key)

    def translate(self, data_dict: dict, target_lang: str) -> dict:
        """
        Takes a python dictionary, serializes to JSON string, and asks LLM to translate ALL String values 
        into target_lang, keeping the JSON structure and keys completely intact.
        Fallback to Grok if Gemini fails.
        """
        if target_lang == "en":
            return data_dict

        lang_map = {"hi": "Hindi", "mr": "Marathi"}
        mapped_lang = lang_map.get(target_lang, target_lang)

        prompt = f"""You are a professional agricultural translator. 
I have a JSON object containing plant disease symptoms, advisories, and prediction metrics. 
Translate ALL the text string VALUES within this JSON object into precisely native {mapped_lang}, but strictly preserve all standard english JSON KEYS and structure. 
Return ONLY the raw JSON format with no markdown blocks. 
Strictly ensure that string properties like 'disease_name', 'symptoms', 'causes', and 'suggestion' are accurately translated for a farmer mapping.
JSON to translate:
{json.dumps(data_dict, ensure_ascii=False)}
"""

        # 1. Try Gemini
        if self.gemini_key:
            try:
                model = genai.GenerativeModel("gemini-2.5-flash")
                response = model.generate_content(prompt)
                translated_text = response.text.replace('```json', '').replace('```', '').strip()
                return json.loads(translated_text)
            except Exception as e:
                print(f"⚠️ Gemini Translation failed: {str(e)}. Falling back to Grok.")

        # 2. Fallback to Grok
        if self.grok_key:
            try:
                headers = {"Authorization": f"Bearer {self.grok_key}", "Content-Type": "application/json"}
                payload = {
                    "model": "grok-2-latest",
                    "messages": [{"role": "user", "content": prompt}],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.2
                }
                resp = requests.post("https://api.x.ai/v1/chat/completions", headers=headers, json=payload)
                if resp.status_code == 200:
                    translated_text = resp.json()["choices"][0]["message"]["content"]
                    translated_text = translated_text.replace('```json', '').replace('```', '').strip()
                    return json.loads(translated_text)
            except Exception as e:
                print(f"⚠️ Grok Translation failed: {str(e)}.")

        return data_dict # Fallback to untranslated English if everything fails
