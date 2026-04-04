from abc import ABC, abstractmethod
from typing import Dict, Any


class BasePredictionPlugin(ABC):
    """
    Abstract base class for all prediction plugins.
    Enforces a strict interface for plug-and-play model swapping.
    
    To replace the model:
        1. Create a new class extending BasePredictionPlugin
        2. Implement load_model() and predict()
        3. Register it in endpoints.py
    """

    @abstractmethod
    def load_model(self) -> None:
        """
        Load model weights, initialize resources, or set up API connections.
        Called once during plugin initialization.
        """
        pass

    @abstractmethod
    def predict(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Run prediction on the provided environmental/crop inputs.
        
        Args:
            inputs: {
                "temperature": float,      # °C
                "humidity": float,          # % (0-100)
                "rainfall": float,          # mm
                "crop_type": str,           # e.g. "tomato", "rice", "wheat"
                "soil_moisture": float,     # % (0-100)
                "plant_age_days": int,      # days since planting
            }
        
        Returns:
            {
                "risk_level": str,          # "Low" | "Medium" | "High" | "Critical"
                "probability": float,       # 0.0 - 1.0
                "reason": str,              # Human-readable explanation
                "pest_threats": list[str],   # Likely pest/disease names
                "recommendations": {
                    "immediate": str,
                    "preventive": str,
                    "organic": str
                }
            }
        """
        pass
