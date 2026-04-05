import os
import random
import torch
from typing import Dict, Union
from PIL import Image
from ..core.plugin_interface import BaseDetectionPlugin

# Fix for PyTorch 2.6+: torch.load now defaults to weights_only=True,
# but YOLO .pt files need full unpickling. Patch it for trusted model files.
_original_torch_load = torch.load
def _patched_torch_load(*args, **kwargs):
    if 'weights_only' not in kwargs:
        kwargs['weights_only'] = False
    return _original_torch_load(*args, **kwargs)
torch.load = _patched_torch_load

class YOLOPlugin(BaseDetectionPlugin):
    """
    YOLOv8 Detection Plugin.
    If 'best.pt' is found, it uses the actual model.
    Otherwise, it falls back to a Mock implementation to allow development.
    """
    
    def __init__(self, model_path: str = "best.pt"):
        self.model_path = model_path
        self.model = None
        self.is_mock = False
        self.load_model()

    def load_model(self) -> None:
        if os.path.exists(self.model_path):
            try:
                from ultralytics import YOLO
                self.model = YOLO(self.model_path)
                print(f"Loaded YOLOv8 model from {self.model_path}")
            except ImportError:
                print("Ultralytics package not found. Falling back to Mock.")
                self.is_mock = True
            except Exception as e:
                print(f"Error loading model: {e}. Falling back to Mock.")
                self.is_mock = True
        else:
            print(f"Model file '{self.model_path}' not found. Falling back to Mock predictions.")
            self.is_mock = True

    def predict(self, image: Image.Image) -> Dict[str, any]:
        if self.is_mock:
            # Mock prediction logic (e.g., simulating model processing time)
            mock_diseases = ["Apple Scab", "Grape Black Rot", "Tomato Early Blight", "Healthy"]
            return {
                "disease_name": random.choice(mock_diseases),
                "confidence_score": round(random.uniform(0.70, 0.99), 2),
                "suggestions": []
            }
            
        # Actual YOLO prediction logic
        try:
            # --- PHASE 2: INFERENCE ---
            # Remove arbitrary PIL preprocessing that distorts colors. YOLO handles its own preprocessing.
            results = self.model(image, verbose=False, imgsz=640, conf=0.1)
            
            if not results or len(results) == 0:
                return {"disease_name": "No detection", "confidence_score": 0.0, "suggestions": []}

            result = results[0]
            suggestions = []
            
            # 1. Handle Classification Model (Top-N)
            if hasattr(result, "probs") and result.probs is not None:
                # Top 1
                top1_index = result.probs.top1
                confidence = float(result.probs.top1conf)
                disease_name = result.names[top1_index]
                
                # Get Top 3 if confidence is low to help the user
                top5_indices = result.probs.top5
                for idx in top5_indices:
                    if idx != top1_index:
                        suggestions.append({
                            "name": result.names[idx].replace("_", " "),
                            "confidence": round(float(result.probs.data[idx]), 3)
                        })

                return {
                    "disease_name": disease_name.replace("_", " "),
                    "confidence_score": round(confidence, 3),
                    "suggestions": suggestions[:3] # Return top 3 alternatives
                }
            
            # 2. Handle Detection Model (Multiple boxes)
            if hasattr(result, "boxes") and len(result.boxes) > 0:
                # Sort by confidence
                sorted_boxes = sorted(result.boxes, key=lambda x: x.conf[0], reverse=True)
                best_box = sorted_boxes[0]
                cls_id = int(best_box.cls[0])
                confidence = float(best_box.conf[0])
                disease_name = result.names[cls_id]
                
                # Collect other unique detections as suggestions
                seen_cls = {cls_id}
                for box in sorted_boxes[1:]:
                    other_cls = int(box.cls[0])
                    if other_cls not in seen_cls:
                        suggestions.append({
                            "name": result.names[other_cls].replace("_", " "),
                            "confidence": round(float(box.conf[0]), 3)
                        })
                        seen_cls.add(other_cls)

                return {
                    "disease_name": disease_name.replace("_", " "),
                    "confidence_score": round(confidence, 3),
                    "suggestions": suggestions[:3]
                }

        except Exception as e:
            print(f"ERROR inside prediction: {e}")
        
        return {
            "disease_name": "Unclear / No Disease Found",
            "confidence_score": 0.0,
            "suggestions": []
        }
