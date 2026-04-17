import requests
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.environ.get("GEMINI_API_KEY")

url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
r = requests.get(url)

data = r.json()
print("Available Models:")
for m in data.get('models', []):
    if "flash" in m['name'].lower() or "pro" in m['name'].lower():
        print(f" - {m['name']} (supported methods: {m.get('supportedGenerationMethods', [])})")
