import requests
import os
import json
from dotenv import load_dotenv

load_dotenv()
active_key = os.environ.get("GEMINI_API_KEY")

prompt_text = 'Provide Integrated Pest Management advisory for the plant condition: "Tomato - Late blight". Respond ONLY with valid JSON containing keys: plant_name, description, symptoms, causes, how_it_spreads, core_recommendation, and an advisory object (organic, chemical, preventive).'

url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={active_key}"
headers = {"Content-Type": "application/json"}
payload = {
    "contents": [{"parts": [{"text": prompt_text}]}],
    "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"}
}

response = requests.post(url, headers=headers, json=payload, timeout=15)
print(f"Status Code: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    content = data["candidates"][0]["content"]["parts"][0]["text"]
    print(f"Content: {content}")
else:
    print(response.text)
