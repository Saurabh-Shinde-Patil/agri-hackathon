from ultralytics import YOLO
import os

model_path = "best.pt"
if os.path.exists(model_path):
    print(f"✅ Model found: {model_path} ({os.path.getsize(model_path)} bytes)")
    try:
        model = YOLO(model_path)
        print("✅ YOLOv8 successfully loaded the model!")
        print(f"Model classes: {model.names}")
    except Exception as e:
        print(f"❌ Error loading YOLO model: {e}")
else:
    print(f"❌ Model file {model_path} NOT found!")
