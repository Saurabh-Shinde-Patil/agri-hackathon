from typing import List, Dict, Any
import numpy as np

class FeatureEngineer:
    """
    Translates raw historical sensor lists into intelligent biological indicators.
    """

    @staticmethod
    def extract_patterns(history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze the history and return a dictionary of trends.
        """
        if not history:
            return {
                "avg_humidity_72h": None,
                "high_humidity_duration": 0,
                "temp_trend": "stable",
                "soil_stress": False
            }

        # Extract values
        humidities = [h.get('humidity', 0) for h in history if h.get('humidity') is not None]
        temperatures = [t.get('temperature', 0) for t in history if t.get('temperature') is not None]
        soil_moistures = [s.get('soil_moisture', 0) for s in history if s.get('soil_moisture') is not None]

        # 1. Average Humidity (High humidity over time = Fungal Growth)
        avg_h = np.mean(humidities) if humidities else 0
        
        # 2. Persistence of High Humidity (DANGER ZONE)
        # Count consecutive records with humidity > 80% (assuming records are frequent)
        high_h_count = 0
        for h in humidities:
            if h > 80:
                high_h_count += 1
            else:
                break # Stop at first break in pattern

        # 3. Temp Stability
        temp_std = np.std(temperatures) if temperatures else 0
        temp_trend = "volatile" if temp_std > 5 else "stable"

        # 4. Soil Stress (Multiple low readings)
        soil_stress = bool(np.mean(soil_moistures) < 30) if soil_moistures else False

        return {
            "avg_humidity_historical": round(float(avg_h), 1),
            "high_humidity_duration_records": high_h_count,
            "temp_trend": temp_trend,
            "soil_stress_detected": soil_stress,
            "history_count": len(history)
        }

    @staticmethod
    def format_reason(patterns: Dict[str, Any], current_input: Dict[str, Any]) -> str:
        """
        Generate a human-readable explanation based on history + current.
        """
        reasons = []
        
        # Current logic
        if current_input.get('humidity', 0) > 80:
            reasons.append("Current humidity is dangerously high.")
            
        # Historical context
        if patterns.get('high_humidity_duration_records', 0) > 5:
            reasons.append(f"High humidity has persisted for the last {patterns['high_humidity_duration_records']} readings, creating a major breeding ground for fungus.")
        elif patterns.get('avg_humidity_historical', 0) > 75:
            reasons.append("Historical trend shows consistently damp conditions.")

        if patterns.get('soil_stress_detected'):
            reasons.append("Long-term soil moisture has been low, weakening plant immunity.")

        if not reasons:
            reasons.append("Environmental conditions are currently within normal ranges.")

        return " ".join(reasons)
