import urllib.request
import os

def download_model():
    # Direct download link from a reliable HuggingFace agriculture model
    url = "https://huggingface.co/peachfawn/yolov8-plant-disease/resolve/main/best.pt"
    filename = "best.pt"
    
    print(f"--- AI-Powered Plant Protection System ---")
    print(f"Downloading pre-trained 'best.pt' model weights...")
    print(f"This is a large file (approx 100MB+), please wait...")
    
    try:
        # Use a more robust download method
        import requests
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        with open(filename, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    
        print(f"\n✅ SUCCESS! {filename} downloaded.")
        print("Now run 'python main.py' to start real detection.")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("Please download manually from: https://github.com/Wb-az/yolov8-disease-detection-agriculture/blob/main/best.pt")
        print("And place it in: c:/Users/MANTHAN/Desktop/agri-hack/ai-service/")

if __name__ == "__main__":
    download_model()
