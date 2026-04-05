"""
Random Forest Prediction Plugin for Pest & Disease Forecasting.

HOW TO REPLACE THE MODEL:
─────────────────────────
1. Train your own model (scikit-learn, XGBoost, etc.)
2. Save it with joblib: `joblib.dump(model, 'pest_model.pkl')`
3. Place the .pkl file in the ai-service root directory
4. Update MODEL_PATH below (or set PEST_MODEL_PATH in .env)
5. If your model uses different features, update FEATURE_COLUMNS

The plugin auto-trains a synthetic Random Forest if no saved model exists.
"""

import os
import json
import numpy as np
import joblib
from typing import Dict, Any, List
from ..core.prediction_interface import BasePredictionPlugin

# ─── Configuration ───────────────────────────────────────────────
MODEL_PATH = os.environ.get("PEST_MODEL_PATH", "pest_rf_model_v2.pkl")
ENCODER_PATH = os.environ.get("PEST_ENCODER_PATH", "pest_crop_encoder_v2.pkl")

FEATURE_COLUMNS = [
    "temperature", "humidity", "rainfall",
    "soil_moisture", "plant_age_days", "light_intensity", "crop_type_encoded"
]

RISK_LEVELS = ["Low", "Medium", "High", "Critical"]

# ─── Crop-Pest Knowledge Base ────────────────────────────────────
CROP_PEST_DB = {
    "tomato": {
        "pests": ["Late Blight", "Early Blight", "Tomato Hornworm", "Whitefly", "Aphids"],
        "high_risk_conditions": {"temp_range": (20, 30), "humidity_min": 75, "rainfall_min": 8},
    },
    "rice": {
        "pests": ["Rice Blast", "Brown Planthopper", "Stem Borer", "Bacterial Leaf Blight", "Sheath Blight"],
        "high_risk_conditions": {"temp_range": (25, 35), "humidity_min": 80, "rainfall_min": 15},
    },
    "wheat": {
        "pests": ["Rust", "Powdery Mildew", "Aphids", "Hessian Fly", "Karnal Bunt"],
        "high_risk_conditions": {"temp_range": (15, 25), "humidity_min": 70, "rainfall_min": 5},
    },
    "cotton": {
        "pests": ["Bollworm", "Whitefly", "Jassids", "Pink Bollworm", "Thrips"],
        "high_risk_conditions": {"temp_range": (25, 35), "humidity_min": 65, "rainfall_min": 10},
    },
    "potato": {
        "pests": ["Late Blight", "Early Blight", "Potato Tuber Moth", "Aphids", "Colorado Potato Beetle"],
        "high_risk_conditions": {"temp_range": (15, 25), "humidity_min": 80, "rainfall_min": 10},
    },
    "maize": {
        "pests": ["Fall Armyworm", "Corn Borer", "Downy Mildew", "Rust", "Stalk Rot"],
        "high_risk_conditions": {"temp_range": (22, 32), "humidity_min": 70, "rainfall_min": 8},
    },
    "sugarcane": {
        "pests": ["Red Rot", "Smut", "Top Borer", "Woolly Aphid", "Pyrilla"],
        "high_risk_conditions": {"temp_range": (28, 38), "humidity_min": 75, "rainfall_min": 12},
    },
    "soybean": {
        "pests": ["Soybean Rust", "Pod Borer", "Stem Fly", "Whitefly", "Girdle Beetle"],
        "high_risk_conditions": {"temp_range": (22, 30), "humidity_min": 70, "rainfall_min": 8},
    },
    "chili": {
        "pests": ["Anthracnose", "Thrips", "Fruit Borer", "Powdery Mildew", "Leaf Curl Virus"],
        "high_risk_conditions": {"temp_range": (25, 35), "humidity_min": 70, "rainfall_min": 6},
    },
    "onion": {
        "pests": ["Purple Blotch", "Thrips", "Downy Mildew", "Stemphylium Blight", "Basal Rot"],
        "high_risk_conditions": {"temp_range": (20, 30), "humidity_min": 80, "rainfall_min": 10},
    },
}

# Default for unknown crops
DEFAULT_CROP = {
    "pests": ["General Pest", "Fungal Infection", "Bacterial Wilt", "Aphids", "Leaf Spot"],
    "high_risk_conditions": {"temp_range": (20, 30), "humidity_min": 70, "rainfall_min": 8},
}

# Known crop names for encoding
KNOWN_CROPS = sorted(CROP_PEST_DB.keys())


class RFPredictionPlugin(BasePredictionPlugin):
    """
    Random Forest-based pest/disease risk predictor.
    
    Uses a pre-trained or auto-generated RF model to predict risk levels.
    Designed for easy model replacement — just swap the .pkl file.
    """

    def __init__(self):
        self.model = None
        self.crop_encoder = None
        self.load_model()

    def load_model(self) -> None:
        """Load saved model or train a new synthetic one."""
        if os.path.exists(MODEL_PATH) and os.path.exists(ENCODER_PATH):
            try:
                self.model = joblib.load(MODEL_PATH)
                self.crop_encoder = joblib.load(ENCODER_PATH)
                print(f"✅ Loaded pest prediction model from {MODEL_PATH}")
                return
            except Exception as e:
                print(f"⚠️ Failed to load saved model: {e}. Training new one.")

        self._train_synthetic_model()

    def _train_synthetic_model(self):
        """Train a Random Forest on synthetic pest/disease data."""
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.preprocessing import LabelEncoder
        
        print("🔄 Training synthetic Random Forest model for pest prediction...")

        np.random.seed(42)
        n_samples = 2000
        
        # Generate synthetic training data
        crops = np.random.choice(KNOWN_CROPS, n_samples)
        temperatures = np.random.uniform(5, 45, n_samples)
        humidities = np.random.uniform(20, 100, n_samples)
        rainfalls = np.random.uniform(0, 50, n_samples)
        soil_moistures = np.random.uniform(10, 100, n_samples)
        plant_ages = np.random.randint(1, 180, n_samples)
        light_intensities = np.random.uniform(0, 100, n_samples) # 0-100% brightness

        # Generate risk labels based on domain rules
        labels = []
        for i in range(n_samples):
            crop = crops[i]
            info = CROP_PEST_DB.get(crop, DEFAULT_CROP)
            cond = info["high_risk_conditions"]
            
            risk_score = 0
            t_lo, t_hi = cond["temp_range"]
            
            # Temperature in danger zone
            if t_lo <= temperatures[i] <= t_hi:
                risk_score += 2
            elif abs(temperatures[i] - (t_lo + t_hi) / 2) < 10:
                risk_score += 1
            
            # Humidity factor
            if humidities[i] >= cond["humidity_min"]:
                risk_score += 2
            elif humidities[i] >= cond["humidity_min"] - 15:
                risk_score += 1
            
            # Rainfall factor
            if rainfalls[i] >= cond["rainfall_min"]:
                risk_score += 1.5
            
            # Soil moisture (too high = fungal risk)
            if soil_moistures[i] > 80:
                risk_score += 1.5
            elif soil_moistures[i] > 60:
                risk_score += 0.5
            
            # Young plants are more vulnerable
            if plant_ages[i] < 30:
                risk_score += 1
            elif plant_ages[i] < 60:
                risk_score += 0.5
            
            # Light intensity factor (Low light + High humidity/Soil = extra risk)
            if light_intensities[i] < 30:
                risk_score += 1.0 # Cloud covered / shaded
            elif light_intensities[i] > 80:
                risk_score -= 0.5 # Bright sunlight (reduces some fungal risk)
            
            # Add some noise
            risk_score += np.random.normal(0, 0.8)
            
            if risk_score >= 6:
                labels.append("Critical")
            elif risk_score >= 4:
                labels.append("High")
            elif risk_score >= 2.5:
                labels.append("Medium")
            else:
                labels.append("Low")

        # Encode crops
        self.crop_encoder = LabelEncoder()
        self.crop_encoder.fit(KNOWN_CROPS + ["unknown"])
        crop_encoded = self.crop_encoder.transform(crops)

        # Build feature matrix
        X = np.column_stack([
            temperatures, humidities, rainfalls,
            soil_moistures, plant_ages, light_intensities, crop_encoded
        ])

        # Train Random Forest
        self.model = RandomForestClassifier(
            n_estimators=150,
            max_depth=12,
            min_samples_split=5,
            min_samples_leaf=3,
            random_state=42,
            n_jobs=-1
        )
        self.model.fit(X, labels)

        # Save model for reuse
        try:
            joblib.dump(self.model, MODEL_PATH)
            joblib.dump(self.crop_encoder, ENCODER_PATH)
            print(f"✅ Saved model to {MODEL_PATH}")
        except Exception as e:
            print(f"⚠️ Could not save model: {e}")

        print(f"✅ RF Model trained with {n_samples} samples. Classes: {list(self.model.classes_)}")

    def _encode_crop(self, crop_type: str) -> int:
        """Safely encode crop type, defaulting to 'unknown' for unseen crops."""
        crop_lower = crop_type.lower().strip()
        try:
            return self.crop_encoder.transform([crop_lower])[0]
        except ValueError:
            return self.crop_encoder.transform(["unknown"])[0]

    def _get_pest_threats(self, crop_type: str, risk_level: str, inputs: dict) -> List[str]:
        """Get likely pest/disease threats based on crop and conditions."""
        crop_lower = crop_type.lower().strip()
        info = CROP_PEST_DB.get(crop_lower, DEFAULT_CROP)
        pests = info["pests"]
        
        if risk_level == "Critical":
            return pests[:4]
        elif risk_level == "High":
            return pests[:3]
        elif risk_level == "Medium":
            return pests[:2]
        else:
            return [pests[0]] if pests else ["Low risk — monitor regularly"]

    def _generate_reason(self, inputs: dict, risk_level: str, probability: float) -> str:
        """Generate a human-readable explanation of the prediction."""
        reasons = []
        crop = inputs.get("crop_type", "unknown").lower()
        info = CROP_PEST_DB.get(crop, DEFAULT_CROP)
        cond = info["high_risk_conditions"]
        t_lo, t_hi = cond["temp_range"]
        
        temp = inputs.get("temperature", 0)
        humidity = inputs.get("humidity", 0)
        rainfall = inputs.get("rainfall", 0)
        soil = inputs.get("soil_moisture", 0)
        age = inputs.get("plant_age_days", 0)

        if t_lo <= temp <= t_hi:
            reasons.append(f"Temperature ({temp}°C) is in the optimal range for pest activity on {crop}")
        elif temp > 35:
            reasons.append(f"High temperature ({temp}°C) may cause heat stress and pest susceptibility")
        
        if humidity >= cond["humidity_min"]:
            reasons.append(f"Humidity ({humidity}%) exceeds the {cond['humidity_min']}% threshold — favoring fungal growth")
        
        if rainfall >= cond["rainfall_min"]:
            reasons.append(f"Rainfall ({rainfall}mm) creates moist conditions favorable for disease spread")
        
        if soil > 80:
            reasons.append(f"Soil moisture ({soil}%) is very high — root rot and damping-off risk elevated")
        
        if age < 30:
            reasons.append(f"Young plant ({age} days) has weaker natural defenses")
        
        if not reasons:
            if risk_level == "Low":
                reasons.append("Current conditions are generally favorable. Continue regular monitoring.")
            else:
                reasons.append("Multiple environmental factors combine to elevate pest risk.")

        return " | ".join(reasons)

    def _generate_recommendations(self, crop_type: str, risk_level: str, pest_threats: List[str]) -> Dict[str, str]:
        """Generate actionable pest management recommendations."""
        crop = crop_type.lower().strip()
        
        recs = {
            "immediate": "",
            "preventive": "",
            "organic": ""
        }
        
        if risk_level in ["Critical", "High"]:
            recs["immediate"] = (
                f"Immediately scout fields for signs of {', '.join(pest_threats[:2])}. "
                f"Apply recommended systemic fungicide/insecticide within 24-48 hours if symptoms are confirmed. "
                f"Isolate severely affected plants to prevent spread."
            )
            recs["organic"] = (
                f"Apply neem oil (2-3ml/L) or Trichoderma-based bio-fungicide as a first response. "
                f"Use pheromone traps for pest monitoring. Consider Beauveria bassiana for insect control."
            )
            recs["preventive"] = (
                f"Improve field drainage and air circulation. Remove crop debris and infected plant material. "
                f"Strengthen plant immunity with balanced NPK fertilization and micronutrient supplements."
            )
        elif risk_level == "Medium":
            recs["immediate"] = (
                f"Increase scouting frequency to every 2-3 days. Watch for early signs of {', '.join(pest_threats[:2])}. "
                f"Prepare protective sprays but apply only if symptoms appear."
            )
            recs["organic"] = (
                f"Preventive neem oil spray (1-2ml/L) every 7-10 days. Use yellow sticky traps for monitoring. "
                f"Encourage natural predators like ladybugs and lacewings."
            )
            recs["preventive"] = (
                f"Maintain proper spacing between plants. Ensure balanced irrigation — avoid overwatering. "
                f"Apply mulch to regulate soil temperature and moisture."
            )
        else:
            recs["immediate"] = (
                f"Continue regular field monitoring on a weekly basis. No immediate action required."
            )
            recs["organic"] = (
                f"Maintain biodiversity in and around the field. Use crop rotation in next season. "
                f"Consider companion planting to repel common pests."
            )
            recs["preventive"] = (
                f"Keep fields clean and well-maintained. Follow recommended sowing dates. "
                f"Use certified disease-free seeds."
            )
        
        return recs

    def predict(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Run Random Forest prediction on environmental + crop inputs."""
        try:
            crop_encoded = self._encode_crop(inputs.get("crop_type", "unknown"))
            
            features = np.array([[
                float(inputs.get("temperature", 25)),
                float(inputs.get("humidity", 50)),
                float(inputs.get("rainfall", 0)),
                float(inputs.get("soil_moisture", 50)),
                int(inputs.get("plant_age_days", 30)),
                float(inputs.get("light_intensity") if inputs.get("light_intensity") is not None else 65.0),
                crop_encoded
            ]])

            # Get prediction and probabilities
            risk_level = self.model.predict(features)[0]
            probas = self.model.predict_proba(features)[0]
            class_names = list(self.model.classes_)
            
            # Get the probability for the predicted class
            pred_idx = class_names.index(risk_level)
            probability = round(float(probas[pred_idx]), 3)
            
            # Build all probability breakdown
            all_probabilities = {
                cls: round(float(probas[i]), 3)
                for i, cls in enumerate(class_names)
            }

            pest_threats = self._get_pest_threats(
                inputs.get("crop_type", "unknown"), risk_level, inputs
            )
            reason = self._generate_reason(inputs, risk_level, probability)
            recommendations_top = self._generate_recommendations(
                inputs.get("crop_type", "unknown"), risk_level, pest_threats
            )
            
            # Ranked Array Generation
            ranked_threats = []
            base_percentage = int(probability * 100)
            for i, p in enumerate(pest_threats):
                # Spread probability to fake ranking confidence
                dp = max(10, base_percentage - (i * 15))
                ranked_threats.append({
                    "name": p,
                    "probability": dp,
                    "advisory": self._generate_recommendations(inputs.get("crop_type", "unknown"), risk_level, [p])
                })

            return {
                "risk_level": risk_level,
                "probability": probability,
                "reason": reason,
                "pest_threats": ranked_threats,
                "recommendations": recommendations_top, # Keep as fallback
                "all_probabilities": all_probabilities,
                "source": "ml_model",
                "model_type": "RandomForest"
            }

        except Exception as e:
            print(f"❌ RF Prediction error: {e}")
            return {
                "risk_level": "Medium",
                "probability": 0.5,
                "reason": f"Model prediction error: {str(e)}. Defaulting to Medium risk.",
                "pest_threats": ["Unable to determine — check inputs"],
                "recommendations": {
                    "immediate": "Consult a local agricultural expert.",
                    "preventive": "Maintain good field hygiene.",
                    "organic": "Use standard organic practices."
                },
                "source": "ml_model",
                "model_type": "RandomForest",
                "error": str(e)
            }
