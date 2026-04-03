import io
from fastapi import APIRouter, File, UploadFile, HTTPException
from PIL import Image
from ..plugins.yolo_plugin import YOLOPlugin
from ..core.config import settings

router = APIRouter()

# Initialize active plugin using config
active_plugin = YOLOPlugin(model_path=settings.model_path)

@router.post("/detect")
async def detect_disease(image: UploadFile = File(...)):
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")
        
    try:
        contents = await image.read()
        pil_image = Image.open(io.BytesIO(contents)).convert("RGB")
        
        # Pass image to active plugin
        result = active_plugin.predict(pil_image)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
