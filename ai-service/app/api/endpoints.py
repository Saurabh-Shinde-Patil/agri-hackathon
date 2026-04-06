import io
import requests
from fastapi import APIRouter, File, UploadFile, HTTPException
from PIL import Image
from ..plugins.yolo_plugin import YOLOPlugin
from ..plugins.api_plugin import APIPlugin
from fastapi import Form
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from ..core.config import settings
from ..plugins.iot_plugin import IoTPlugin
from ..plugins.translation_plugin import TranslationPlugin

router = APIRouter()

# Initialize detection plugins
model_plugin = YOLOPlugin(model_path=settings.model_path)
api_plugin = APIPlugin()
iot_plugin = IoTPlugin()
translation_plugin = TranslationPlugin()

# Lazy-loaded prediction plugins (loaded on first /predict call)
_rf_plugin = None
_gemini_plugin = None
_hybrid_plugin = None

def _get_prediction_plugin(mode: str, provider: str = "gemini"):
    """Lazy-load prediction plugins on first use."""
    global _rf_plugin, _gemini_plugin, _hybrid_plugin
    
    if mode == "model":
        if _rf_plugin is None:
            from ..plugins.rf_prediction_plugin import RFPredictionPlugin
            _rf_plugin = RFPredictionPlugin()
        return _rf_plugin
    elif mode == "api":
        if provider == "grok":
            from ..plugins.grok_prediction_plugin import GrokPredictionPlugin
            return GrokPredictionPlugin()
        else:
            if _gemini_plugin is None:
                from ..plugins.gemini_prediction_plugin import GeminiPredictionPlugin
                _gemini_plugin = GeminiPredictionPlugin()
            return _gemini_plugin
    else:  # hybrid
        if _hybrid_plugin is None:
            from ..plugins.hybrid_prediction_plugin import HybridPredictionPlugin
            _hybrid_plugin = HybridPredictionPlugin()
        # Set the requested API provider inside the hybrid plugin
        _hybrid_plugin.set_api_provider(provider)
        return _hybrid_plugin


# ═══════════════════════════════════════════════════════════
#  Weather Data Fetcher (shared utility)
# ═══════════════════════════════════════════════════════════
def _fetch_weather_data(location: str) -> dict | None:
    """Fetch weather from OpenWeatherMap. Returns dict or None."""
    api_key = settings.openweather_api_key
    if not api_key or not location:
        return None
    try:
        params = {"q": location, "appid": api_key, "units": "metric"}
        resp = requests.get("https://api.openweathermap.org/data/2.5/weather", params=params, timeout=10)
        if resp.status_code != 200:
            return None
        data = resp.json()
        return {
            "temperature": data["main"]["temp"],
            "humidity": data["main"]["humidity"],
            "rainfall": data.get("rain", {}).get("1h", 0.0),
            "wind_speed": data.get("wind", {}).get("speed", 0),
            "description": data["weather"][0]["description"] if data.get("weather") else "N/A",
            "location_name": data.get("name", location),
            "country": data.get("sys", {}).get("country", ""),
        }
    except Exception as e:
        print(f"⚠️ Weather fetch failed: {e}")
        return None


# ═══════════════════════════════════════════════════════════
#  Prediction Request Schema
# ═══════════════════════════════════════════════════════════
class PredictionRequest(BaseModel):
    temperature: Optional[float] = Field(None, description="Temperature in °C (auto-fetched if empty)")
    humidity: Optional[float] = Field(None, description="Humidity in % (auto-fetched if empty)")
    rainfall: Optional[float] = Field(None, description="Rainfall in mm (auto-fetched if empty)")
    crop_type: str = Field(..., description="Crop type e.g. tomato, rice, wheat")
    soil_moisture: float = Field(..., description="Soil moisture in %")
    plant_age_days: int = Field(..., description="Plant age in days since sowing")
    mode: str = Field("hybrid", description="Prediction mode: model | api | hybrid")
    ai_provider: str = Field("gemini", description="gemini | grok")
    location: Optional[str] = Field(None, description="City name for weather API lookup")
    rain_status: Optional[int] = Field(None, description="Rain status from sensor (0 or 1)")
    light_intensity: Optional[float] = Field(None, description="Light intensity from sensor")
    data_sources: Optional[Dict[str, str]] = Field(None, description="Explicit data sources map supplied by frontend")
    language: str = Field("en", description="Output language (en, hi, mr)")


# ═══════════════════════════════════════════════════════════
#  POST /api/predict — Pest & Disease Forecasting
# ═══════════════════════════════════════════════════════════
@router.post("/predict")
async def predict_pest_risk(request: PredictionRequest):
    """
    Predict pest/disease risk based on environmental and crop parameters.
    
    - temperature, humidity, rainfall: Optional — auto-fetched from OpenWeatherMap if empty + location provided
    - crop_type, soil_moisture, plant_age_days: Always required (user must provide)
    
    Modes:
    - model: Uses Random Forest ML model
    - api: Uses Gemini AI for intelligent pest prediction
    - hybrid: Runs both, shows the one with higher confidence
    """
    try:
        # ── Track data sources ──
        data_sources = request.data_sources if request.data_sources else {
            "temperature": "user",
            "humidity": "user",
            "rainfall": "user",
            "crop_type": "user",
            "soil_moisture": "user",
            "plant_age_days": "user",
        }

        temperature = request.temperature
        humidity = request.humidity
        rainfall = request.rainfall
        location = (request.location or "").strip()

        # ── Auto-fetch missing weather values ──
        weather_data = None
        weather_error = None
        needs_fetch = (temperature is None or humidity is None or rainfall is None)

        if needs_fetch and location:
            weather_data = _fetch_weather_data(location)
            if weather_data:
                if temperature is None:
                    temperature = weather_data["temperature"]
                    data_sources["temperature"] = "weather_api"
                if humidity is None:
                    humidity = weather_data["humidity"]
                    data_sources["humidity"] = "weather_api"
                if rainfall is None:
                    rainfall = weather_data.get("rainfall", 0.0)
                    data_sources["rainfall"] = "weather_api"
            else:
                if not settings.openweather_api_key:
                    weather_error = "OPENWEATHER_API_KEY is not configured in .env. Cannot auto-fetch weather data."
                else:
                    weather_error = f"Could not fetch weather data for '{location}'. Please check the city name or enter values manually."

        # ── Validate: still missing after fetch? ──
        # ── Handle missing Rainfall from Hardware Sensors ──
        if rainfall is None:
            if request.rain_status == 1:
                rainfall = 15.0  # Estimated active rainfall
                data_sources["rainfall"] = "estimated_from_sensor"
            elif request.rain_status == 0:
                rainfall = 0.0
                data_sources["rainfall"] = "sensor_derived"
            else:
                rainfall = 0.0
                data_sources["rainfall"] = "default_fallback"

        # ── Validate: still missing after fetch? ──
        missing = []
        if temperature is None:
            missing.append("temperature")
        if humidity is None:
            missing.append("humidity")
        if rainfall is None:
            missing.append("rainfall")

        if missing:
            detail = f"Missing values: {', '.join(missing)}. "
            if not location:
                detail += "Provide these values manually OR enter a location to auto-fetch from weather API."
            else:
                detail += "Weather API could not provide these values. Please enter them manually."
            raise HTTPException(status_code=400, detail=detail)

        # ── Normalize Sensors ──
        # Light: 4095 (dark) -> 0 (bright). Normalize raw ADC to 0-100% Brightness for the ML Model.
        raw_light = request.light_intensity if request.light_intensity is not None else 2048
        normalized_light = max(0, min(100, round(((4095 - float(raw_light)) / 4095.0) * 100, 1)))

        # ── Build final inputs ──
        inputs = {
            "temperature": float(temperature),
            "humidity": float(humidity),
            "rainfall": float(rainfall),
            "crop_type": request.crop_type.strip().lower(),
            "soil_moisture": float(request.soil_moisture),
            "plant_age_days": int(request.plant_age_days),
            "location": location,
            "light_intensity": normalized_light,
            "raw_light_ldr": request.light_intensity, # Keep raw for reference if needed
            "rain_status": request.rain_status or 0
        }

        mode = request.mode.strip().lower()
        provider = request.ai_provider.strip().lower()

        if mode not in ("model", "api", "hybrid"):
            mode = "hybrid"

        plugin = _get_prediction_plugin(mode, provider)
        result = plugin.predict(inputs)

        # ── Throw an explicit HTTP error if standalone API mode fails ──
        # (If hybrid, we let it pass because we still have the ML model fallback)
        if mode == "api" and "error" in result and result.get("probability") == 0.0:
            raise HTTPException(status_code=503, detail=result["error"])

        # ── Add metadata ──
        result["mode"] = mode
        result["inputs"] = inputs
        result["data_sources"] = data_sources

        if weather_data:
            result["weather_data_fetched"] = weather_data
        if weather_error:
            result["weather_error"] = weather_error

        # ── Generate IoT Alerts ──
        iot_data_payload = {
            "humidity": inputs["humidity"],
            "soil_moisture": inputs["soil_moisture"],
            "rain_status": inputs["rain_status"],
            "light_intensity": inputs["light_intensity"]
        }
        iot_alerts = iot_plugin.analyze_sensor_data(iot_data_payload)
        result["iot_alerts"] = iot_alerts

        # ── Translate output if necessary ──
        if request.language != "en":
            result = translation_plugin.translate(result, request.language)

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


# ═══════════════════════════════════════════════════════════
#  POST /api/detect — Image-based Disease Detection
# ═══════════════════════════════════════════════════════════
@router.post("/detect")
async def detect_disease(
    image: UploadFile = File(...),
    mode: str = Form("model"),
    ai_provider: str = Form("gemini"),
    language: str = Form("en")
):
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")
        
    try:
        contents = await image.read()
        pil_image = Image.open(io.BytesIO(contents)).convert("RGB")
        
        # Select target plugin or run hybrid
        result = None
        source = mode
        
        if mode == "api":
            result_raw = api_plugin.predict(pil_image, provider=ai_provider)
            source = f"{ai_provider}_api"
        elif mode == "hybrid":
            res_model = model_plugin.predict(pil_image)
            res_api = api_plugin.predict(pil_image, provider=ai_provider)
            
            # Compare confidence
            if res_api.get("confidence_score", 0) > res_model.get("confidence_score", 0):
                result_raw = res_api
                source = f"{ai_provider}_api"
            else:
                result_raw = res_model
                source = "model"
        else: # default to model
            result_raw = model_plugin.predict(pil_image)
            source = "model"
            mode = "model"
            
        # Inject advisory if it's missing (e.g. from YOLO model)
        if "advisory" not in result_raw:
            disease_name = result_raw.get("disease_name", "Unknown")
            enrichment = api_plugin.get_advisory(disease_name, provider=ai_provider)
            # Spread enrichment fields into result_raw so causes, symptoms, etc. are available
            for key in ["description", "symptoms", "causes", "how_it_spreads", "core_recommendation", "plant_name"]:
                if key in enrichment and not result_raw.get(key):
                    result_raw[key] = enrichment[key]
            # Extract advisory sub-object
            if "advisory" in enrichment:
                result_raw["advisory"] = enrichment["advisory"]
            else:
                result_raw["advisory"] = {"organic": enrichment.get("organic", ""), "chemical": enrichment.get("chemical", ""), "preventive": enrichment.get("preventive", "")}

        # Format the final response according to requested specification
        final_response = {
            "mode": mode,
            "plant": result_raw.get("plant_name", "Unknown Plant"),
            "disease": result_raw.get("disease_name", "Unknown Disease"),
            "confidence": str(result_raw.get("confidence_score", 0.0)),
            "description": result_raw.get("description", ""),
            "symptoms": result_raw.get("symptoms", ""),
            "causes": result_raw.get("causes", ""),
            "how_it_spreads": result_raw.get("how_it_spreads", ""),
            "core_recommendation": result_raw.get("core_recommendation", ""),
            "source": source,
            "suggestions": result_raw.get("suggestions", []),
            "advisory": result_raw.get("advisory", {})
        }
        
        # ── Translate output if necessary ──
        if language != "en":
            final_response = translation_plugin.translate(final_response, language)
            
        return final_response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

