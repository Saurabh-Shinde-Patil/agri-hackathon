"""
Hybrid Prediction Plugin — ML Model vs Gemini AI Comparison.

Runs both the Random Forest model and Gemini AI prediction,
then shows the result with HIGHER confidence.

Both predictions are included in the response for full transparency.
"""

from typing import Dict, Any
from ..core.prediction_interface import BasePredictionPlugin
from .rf_prediction_plugin import RFPredictionPlugin
from .gemini_prediction_plugin import GeminiPredictionPlugin


class HybridPredictionPlugin(BasePredictionPlugin):
    """
    Runs ML model + Gemini AI in parallel.
    Returns the prediction with higher confidence.
    Includes both predictions for transparency.
    """

    def __init__(self):
        self.rf_plugin = None
        self.gemini_plugin = None
        self.load_model()

    def load_model(self) -> None:
        """Initialize both sub-plugins."""
        self.rf_plugin = RFPredictionPlugin()
        self.gemini_plugin = GeminiPredictionPlugin()
        print("✅ Hybrid Prediction Engine initialized (ML Model vs Gemini AI)")

    def _merge_threats(self, threats_a: list, threats_b: list) -> list:
        """Merge and deduplicate pest threats from both sources."""
        seen = set()
        merged = []
        for threat in threats_a + threats_b:
            if threat.lower() not in seen:
                seen.add(threat.lower())
                merged.append(threat)
        return merged[:8]

    def predict(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Run both ML and Gemini predictions, return the higher-confidence one."""

        # Run both predictions
        ml_result = self.rf_plugin.predict(inputs)
        
        try:
            gemini_result = self.gemini_plugin.predict(inputs)
            gemini_has_error = "error" in gemini_result
        except Exception as e:
            print(f"⚠️ Hybrid mode: Gemini call failed: {e}")
            gemini_result = {"error": str(e), "probability": 0.0}
            gemini_has_error = True

        ml_prob = ml_result.get("probability", 0.0)
        gemini_prob = gemini_result.get("probability", 0.0)
        
        # Determine winner based on confidence
        if gemini_has_error:
            # Gemini failed — SILENT FALLBACK to ML model
            winner = "ml_model"
            primary = ml_result
            error_note = gemini_result.get("error", "API unavailable")
            reason_suffix = f" (Note: Gemini AI is currently unavailable: {error_note})"
        elif ml_prob >= gemini_prob:
            winner = "ml_model"
            primary = ml_result
            reason_suffix = ""
        else:
            winner = "gemini_api"
            primary = gemini_result
            reason_suffix = ""

        # Merge threats from both
        merged_threats = self._merge_threats(
            ml_result.get("pest_threats", []),
            gemini_result.get("pest_threats", [])
        )

        # Build combined reason
        combined_reason = (
            f"[Primary: {winner.upper()}] {primary.get('reason', '')}{reason_suffix} "
            f"|| [ML Model: {ml_prob:.0%} conf]"
        )
        if not gemini_has_error:
            combined_reason += f" || [Gemini AI: {gemini_prob:.0%} conf]"

        result = {
            "risk_level": primary.get("risk_level", "Medium"),
            "probability": primary.get("probability", 0.5),
            "reason": combined_reason,
            "pest_threats": merged_threats,
            "recommendations": primary.get("recommendations", {}),
            "source": "hybrid",
            "winner": winner,
            "ml_confidence": round(ml_prob, 3),
            "gemini_confidence": round(gemini_prob, 3),
            "ml_prediction": ml_result,
            "gemini_prediction": gemini_result,
        }

        # Propagate Gemini errors
        if gemini_has_error:
            result["weather_error"] = f"Gemini API issue: {gemini_result.get('error', 'Unknown')}. Result shown is from ML model only."

        return result
