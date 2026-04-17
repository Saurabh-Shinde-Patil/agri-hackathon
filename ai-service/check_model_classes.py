from ultralytics import YOLO

def main():
    model = YOLO("best.pt")
    print("\n--- YOLOv8 Model Diagnostics ---")
    print(f"Task type: {model.task}")
    print(f"Total Classes: {len(model.names)}")
    print("Class mapping:")
    
    # Print first 10 and last 3 to get an idea
    keys = list(model.names.keys())
    for k in keys[:5]:
        print(f"ID {k}: {model.names[k]}")
    print("...")
    for k in keys[-3:]:
        print(f"ID {k}: {model.names[k]}")

if __name__ == "__main__":
    main()
