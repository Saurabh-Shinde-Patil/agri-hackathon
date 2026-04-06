"""
Hybrid Prediction Plugin — ML Model vs Gemini AI Comparison.

Runs both the Random Forest model and Gemini AI prediction,
then shows the result with HIGHER confidence.

Both predictions are included in the response for full transparency.
"""

from typing import Dict, Any
from ..core.prediction_interface import BasePredictionPlugin
from .rf_prediction_plugin import RFPredictionPlugin

class HybridPredictionPlugin(BasePredictionPlugin):
    """
    Runs ML model + Cloud API in parallel.
    Returns the prediction with higher confidence.
    """

    def __init__(self):
        self.rf_plugin = None
        self.api_plugin = None
        self.load_model()

    def set_api_provider(self, provider: str):
        if provider == "grok":
            from .grok_prediction_plugin import GrokPredictionPlugin
            self.api_plugin = GrokPredictionPlugin()
            self.provider_name = "Grok AI"
        else:
            from .gemini_prediction_plugin import GeminiPredictionPlugin
            self.api_plugin = GeminiPredictionPlugin()
            self.provider_name = "Gemini AI"

    def load_model(self) -> None:
        """Initialize both sub-plugins."""
        self.rf_plugin = RFPredictionPlugin()
        self.set_api_provider("gemini")
        print("✅ Hybrid Prediction Engine initialized (ML Model vs Cloud API)")

    def _merge_threats(self, threats_a: list, threats_b: list) -> list:
        """Merge and deduplicate pest threats from both sources."""
        seen = set()
        merged = []
        for threat in threats_a + threats_b:
            name = threat.get("name", "") if isinstance(threat, dict) else str(threat)
            name_lower = name.lower()
            if name_lower not in seen:
                seen.add(name_lower)
                merged.append(threat)
        
        # Ensure it's sorted by highest probability first
        merged.sort(key=lambda x: x.get("probability", 0) if isinstance(x, dict) else 0, reverse=True)
        return merged[:8]

    def predict(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Run both ML and Cloud predictions, return the higher-confidence one."""

        # Run both predictions
        ml_result = self.rf_plugin.predict(inputs)
        
        try:
            api_result = self.api_plugin.predict(inputs)
            api_has_error = "error" in api_result
        except Exception as e:
            print(f"⚠️ Hybrid mode: API call failed: {e}")
            api_result = {"error": str(e), "probability": 0.0}
            api_has_error = True

        ml_prob = ml_result.get("probability", 0.0)
        api_prob = api_result.get("probability", 0.0)
        
        # Determine winner based on confidence
        if api_has_error:
            # API failed — SILENT FALLBACK to ML model
            winner = "ml_model"
            primary = ml_result
            error_note = api_result.get("error", "API unavailable")
            reason_suffix = f" (Note: {self.provider_name} is currently unavailable: {error_note})"
        elif ml_prob >= api_prob:
            winner = "ml_model"
            primary = ml_result
            reason_suffix = ""
        else:
            winner = "cloud_api"
            primary = api_result
            reason_suffix = ""

        # Merge threats from both
        merged_threats = self._merge_threats(
            ml_result.get("pest_threats", []),
            api_result.get("pest_threats", [])
        )

        # Build combined reason
        combined_reason = (
            f"[Primary: {winner.upper()}] {primary.get('reason', '')}{reason_suffix} "
            f"|| [ML Model: {ml_prob:.0%} conf]"
        )
        if not api_has_error:
            combined_reason += f" || [{self.provider_name}: {api_prob:.0%} conf]"

        result = {
            "risk_level": primary.get("risk_level", "Medium"),
            "probability": primary.get("probability", 0.5),
            "reason": combined_reason,
            "pest_threats": merged_threats,
            "recommendations": primary.get("recommendations", {}),
            "source": "hybrid",
            "winner": winner,
            "ml_confidence": round(ml_prob, 3),
            "gemini_confidence": round(api_prob, 3),  # keeping the key 'gemini_confidence' for frontend compatibility
            "ml_prediction": ml_result,
            "api_prediction": api_result,
        }

        # Propagate API errors
        if api_has_error:
            result["weather_error"] = f"{self.provider_name} API issue: {api_result.get('error', 'Unknown')}. Result shown is from ML model only."

        return result
