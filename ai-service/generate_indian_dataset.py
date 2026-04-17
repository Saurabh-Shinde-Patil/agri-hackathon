"""
Indian Agriculture Pest & Disease Dataset Generator 🇮🇳🌾

This script automatically generates a highly realistic dataset (50,000+ rows) modeling 
the complex biological relationship between Indian weather conditions, soil metrics, 
and typical pest/disease occurrences.

It accounts for:
- Major Indian crops: Rice, Wheat, Cotton, Sugarcane, Soybean, Tomato, Potato, Onion, Chili, Maize.
- Biological realities: High humidity and temperature spawn fungal diseases in Monsoons.
- Sensor parameters mimicking raw hardware ranges.
"""

import pandas as pd
import numpy as np
import random
import os

# ─── Configuration ───────────────────────────────────────────────
NUM_SAMPLES = 50000
OUTPUT_FILE = "indian_crop_disease_dataset.csv"

# Set random seeds for reproducibility
np.random.seed(42)
random.seed(42)

# ─── Indian Agricultural Biological Constants ────────────────────
CROPS = ["rice", "wheat", "cotton", "potato", "tomato", "sugarcane", "soybean", "chili", "onion", "maize"]

# Base weather profiles for random generation ranges (simulating different days/locations in India)
WEATHER_PROFILES = [
    {"name": "Monsoon_Humid", "t_range": (24, 32), "h_range": (75, 95), "r_range": (10, 40), "l_range": (20, 60)},
    {"name": "Summer_Dry", "t_range": (30, 42), "h_range": (20, 45), "r_range": (0, 2), "l_range": (60, 100)},
    {"name": "Winter_Mild", "t_range": (10, 25), "h_range": (40, 70), "r_range": (0, 5), "l_range": (40, 80)},
    {"name": "Post_Monsoon", "t_range": (22, 30), "h_range": (60, 80), "r_range": (2, 10), "l_range": (50, 75)}
]

def generate_row():
    # 1. Pick a random crop
    crop = random.choice(CROPS)
    
    # 2. Pick a season profile
    profile = random.choice(WEATHER_PROFILES)
    
    # 3. Generate sensor readings with some Gaussian noise
    temperature = max(5, min(50, round(random.uniform(*profile["t_range"]) + random.gauss(0, 2), 1)))
    humidity = max(10, min(100, round(random.uniform(*profile["h_range"]) + random.gauss(0, 3), 1)))
    rainfall = max(0, round(random.uniform(*profile["r_range"]) + random.gauss(0, 1), 1))
    
    # Light intensity (0-100%). Usually inversely proportional to heavy rainfall/clouds
    if rainfall > 15:
        base_light = random.uniform(10, 40)
    else:
        base_light = random.uniform(*profile["l_range"])
    light_intensity = max(0, min(100, round(base_light + random.gauss(0, 5), 1)))
    
    # Age of plant
    plant_age_days = random.randint(5, 180)
    
    # Soil moisture correlates to rainfall, but human irrigation affects it
    # If recent rain, soil is moist. Else random based on farmer's irrigation schedule.
    if rainfall > 5:
        soil_moisture = round(random.uniform(60, 95), 1)
    else:
        soil_moisture = round(random.uniform(20, 80), 1)

    # 4. Expert System: Calculate Ground-Truth Risk Score based on Agronomy Logic
    risk_score = 0.0
    
    # Rule A: High Humidity + Optimal Temp = Fungal/Bacterial Explosion (Very common in India)
    if humidity > 75 and 20 <= temperature <= 32:
        risk_score += 4.0
    elif humidity > 65:
        risk_score += 2.0
        
    # Rule B: Extreme dryness + High heat = Certain pests like spider mites or aphids
    if humidity < 40 and temperature > 32:
        risk_score += 3.0
        
    # Rule C: Heavy rain can wash away some pests, but increases rot
    if rainfall > 20:
        risk_score += 2.5 # Root rot, bacterial blights
        
    # Rule D: Plant Age (younger plants = higher vulnerability to death, older = fruit damage)
    if plant_age_days < 30:
        risk_score += 1.5
        
    # Rule E: Soil Stress (Over-watering or Under-watering weakens plant defenses)
    if soil_moisture > 85:
        risk_score += 2.0 # Fungal root rot
    elif soil_moisture < 30:
        risk_score += 2.0 # Stress susceptibility
        
    # Rule F: Low light + High moisture = Bad news
    if light_intensity < 30 and humidity > 70:
        risk_score += 1.5
        
    # Add small chaotic factor (nature is unpredictable)
    risk_score += random.gauss(0, 1)
    
    # Crop Specific Indian Logic Boost
    if crop == "cotton" and (temperature > 30 and humidity < 50): # Whitefly explosion
        risk_score += 1.5
    elif crop == "rice" and rainfall > 15 and humidity > 85: # Rice Blast / BPH
        risk_score += 2.0
    elif crop == "tomato" and humidity > 80 and 20 <= temperature <= 25: # Late Blight perfect storm
        risk_score += 2.5
        
    # Map raw math score to categorical label
    if risk_score >= 8.5:
        risk_level = "Critical"
    elif risk_score >= 6.0:
        risk_level = "High"
    elif risk_score >= 3.5:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    return {
        "temperature": temperature,
        "humidity": humidity,
        "rainfall": rainfall,
        "soil_moisture": soil_moisture,
        "plant_age_days": plant_age_days,
        "light_intensity": light_intensity,
        "crop_type": crop,
        "risk_level": risk_level
    }

def main():
    print(f"Generating {NUM_SAMPLES} rows of realistic Indian crop data...")
    data = [generate_row() for _ in range(NUM_SAMPLES)]
    
    df = pd.DataFrame(data)
    df.to_csv(OUTPUT_FILE, index=False)
    
    print(f"Successfully written to {OUTPUT_FILE}")
    print("\nDataset Sample:")
    print(df.head())
    
    print("\nLabel Distribution:")
    print(df['risk_level'].value_counts(normalize=True) * 100)

if __name__ == "__main__":
    main()
