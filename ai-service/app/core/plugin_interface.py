from abc import ABC, abstractmethod
from typing import Dict, Any, Union
from PIL import Image

class BaseDetectionPlugin(ABC):
    """
    Abstract base class for all detection plugins.
    Enforces a strict interface to ensure modularity.
    """
    
    @abstractmethod
    def load_model(self) -> None:
        """
        Loads the model weights and initializes the plugin.
        """
        pass
        
    @abstractmethod
    def predict(self, image: Image.Image) -> Dict[str, Union[str, float]]:
        """
        Runs inference on the provided image and returns a standardized result.
        
        Expected Return Format:
        {
            "disease_name": str,
            "confidence_score": float
        }
        """
        pass
