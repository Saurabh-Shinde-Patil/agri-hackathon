import requests, os, json, base64
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

with open("sample_leaf.jpg", "rb") as image_file:
    img_str = base64.b64encode(image_file.read()).decode('utf-8')

payload = {
    "contents": [{
        "parts": [
            {"text": 'Analyze this plant leaf. If there is a disease, what is it? If it is healthy, state "Healthy". Respond in strict JSON format ONLY without markdown formatting: {"disease_name": "...", "confidence_score": 0.95}'},
            {"inline_data": {"mime_type": "image/jpeg", "data": img_str}}
        ]
    }],
    "generationConfig": {
        "temperature": 0.2,
        "maxOutputTokens": 150,
        "responseMimeType": "application/json",
        "responseSchema": {
            "type": "object",
            "properties": {
                "disease_name": {"type": "string"},
                "confidence_score": {"type": "number"}
            },
            "required": ["disease_name", "confidence_score"]
        }
    }
}
url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
resp = requests.post(url, headers={"Content-Type": "application/json"}, json=payload)
print(resp.status_code)
try:
    content = resp.json()
    print(f"RAW TEXT: {content['candidates'][0]['content']['parts'][0]['text']}")
except Exception as e:
    print(resp.text)
