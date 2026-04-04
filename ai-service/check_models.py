import requests
import os
import json
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("No API key found in .env")
    exit(1)

url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
response = requests.get(url)

if response.status_code == 200:
    models = response.json().get("models", [])
    print("Models supporting generateContent:")
    for m in models:
        if "generateContent" in m.get("supportedMethods", []):
            print(f"- {m['name']}")
else:
    print(f"Error: {response.status_code}")
    print(response.text)
