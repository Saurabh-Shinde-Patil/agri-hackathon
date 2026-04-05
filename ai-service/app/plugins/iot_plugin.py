class IoTPlugin:
    """
    Handles alerts and risk analysis based on real-time IoT hardware telemetry.
    """
    
    def __init__(self):
        # Thresholds customized for optimal crop health
        self.max_humidity = 85.0
        self.min_soil_moisture = 30.0
        
    def analyze_sensor_data(self, data: dict) -> list[str]:
        """
        Analyze incoming sensory data (like temperature, humidity, rain_status, light_intensity)
        and generate a list of actionable alerts.
        """
        alerts = []
        
        # Safe extraction of variables handling potential missing or null values
        humidity = float(data.get("humidity", 0)) if data.get("humidity") is not None else None
        soil_moisture = float(data.get("soil_moisture", 0)) if data.get("soil_moisture") is not None else None
        rain_status = int(data.get("rain_status", 0)) if data.get("rain_status") is not None else 0
        light = float(data.get("light_intensity", 0)) if data.get("light_intensity") is not None else None
        
        if humidity is not None and humidity > self.max_humidity:
            alerts.append(f"⚠️ High Humidity Alert ({humidity}%). High risk of fungal diseases. Ensure proper ventilation or apply preventive fungicides.")
            
        if soil_moisture is not None and soil_moisture < self.min_soil_moisture:
            alerts.append(f"💧 Low Soil Moisture ({soil_moisture}%). Irrigation required immediately to prevent drought stress.")
            
        if rain_status == 1:
            alerts.append("🌧️ Rain Detected. High risk of disease spread. Avoid applying water-soluble chemical treatments until foliage dries.")
            
        if light is not None and light < 20: # 20% brightness
            alerts.append(f"🌑 Low Light Intensity ({light}%). Plant photosynthesis might drop. Consider supplemental lighting if this persists.")
            
        if not alerts:
            alerts.append("✅ All sensor readings are within optimal ranges. Crop health is stable.")
            
        return alerts
