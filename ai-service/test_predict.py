import numpy as np
from PIL import Image
from ultralytics import YOLO

print("NumPy version:", np.__version__)

import urllib.request
from PIL import Image
from ultralytics import YOLO

# Download a sample leaf image
url = "https://w7.pngwing.com/pngs/302/527/png-transparent-plant-disease-tomato-leaf-food-leaf-tomato-thumbnail.png"
urllib.request.urlretrieve(url, "sample_leaf.jpg")

model = YOLO('best.pt')
img = Image.open('sample_leaf.jpg').convert('RGB')

# Run prediction directly
result = model(img, conf=0.1)
print(result[0].boxes)
