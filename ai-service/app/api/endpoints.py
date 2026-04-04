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
            
        # Format the final response according to requested specification
        final_response = {
            "mode": mode,
            "disease": result_raw.get("disease_name", "Unknown"),
            "confidence": str(result_raw.get("confidence_score", 0.0)),
            "source": source,
            "suggestions": result_raw.get("suggestions", [])
        }
        
        return final_response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
