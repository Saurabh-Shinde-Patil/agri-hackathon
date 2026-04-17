import requests
import json

def test_prediction_with_history():
    url = "http://127.0.0.1:8000/api/predict"
    
    payload = {
        "temperature": 28.5,
        "humidity": 82.0,
        "rainfall": 5.0,
        "crop_type": "tomato",
        "soil_moisture": 45.0,
        "plant_age_days": 45,
        "mode": "model",
        "farm_id": "test_farm_001", # This will trigger the history fetch
        "location": "Pune",
        "language": "en"
    }

    print(f"🚀 Sending Prediction Request for Tomato (High Humidity)...")
    try:
        response = requests.post(url, json=payload)
        if response.status_code == 200:
            result = response.json()
            print("\n✨ Result Summary:")
            print(f"Risk Level: {result.get('risk_level')}")
            print(f"Probability: {result.get('probability')}")
            print(f"Reason: {result.get('reason')}")
            
            # Check for historical data markers
            patterns = result.get('historical_patterns', {})
            if patterns:
                print("\n📈 Historical Intelligence Detected:")
                print(json.dumps(patterns, indent=2))
            else:
                print("\n⚠️ No historical patterns returned. Check MongoDB connection logs.")
                
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Connection Failed: {e}")

if __name__ == "__main__":
    test_prediction_with_history()
