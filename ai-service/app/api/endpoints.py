import io
from fastapi import APIRouter, File, UploadFile, HTTPException
from PIL import Image
from ..plugins.yolo_plugin import YOLOPlugin
from ..plugins.api_plugin import APIPlugin
from fastapi import Form
from ..core.config import settings

router = APIRouter()

# Initialize plugins
model_plugin = YOLOPlugin(model_path=settings.model_path)
api_plugin = APIPlugin()

@router.post("/detect")
async def detect_disease(
    image: UploadFile = File(...),
    mode: str = Form("model")
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
            result_raw = api_plugin.predict(pil_image)
            source = "api"
        elif mode == "hybrid":
            res_model = model_plugin.predict(pil_image)
            res_api = api_plugin.predict(pil_image)
            
            # Compare confidence
            if res_api.get("confidence_score", 0) > res_model.get("confidence_score", 0):
                result_raw = res_api
                source = "api"
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
            enrichment = api_plugin.get_advisory(disease_name)
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
        
        return final_response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
