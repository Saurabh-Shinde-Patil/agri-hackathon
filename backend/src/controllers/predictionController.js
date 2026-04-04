const axios = require('axios');
const config = require('../config/env');

const predictPestRisk = async (req, res) => {
    try {
        const { temperature, humidity, rainfall, crop_type, soil_moisture, plant_age_days, mode, location } = req.body;

        // Validate ALWAYS-required fields (can never come from weather API)
        const missing = [];
        if (!crop_type) missing.push('crop_type');
        if (soil_moisture === undefined || soil_moisture === null) missing.push('soil_moisture');
        if (plant_age_days === undefined || plant_age_days === null) missing.push('plant_age_days');

        if (missing.length > 0) {
            return res.status(400).json({ 
                error: `Missing required fields: ${missing.join(', ')}. These values cannot be auto-fetched and must be provided manually.`,
                required: ['crop_type', 'soil_moisture', 'plant_age_days']
            });
        }

        // temp, humidity, rainfall are optional — AI service will auto-fetch if location is provided
        // If they're missing AND no location, AI service will return an error

        console.log(`Forwarding prediction request to AI Service at ${config.AI_PREDICT_URL}`);

        // Forward JSON body to Python FastAPI backend
        const response = await axios.post(config.AI_PREDICT_URL, {
            temperature: temperature !== undefined && temperature !== null && temperature !== '' ? parseFloat(temperature) : null,
            humidity: humidity !== undefined && humidity !== null && humidity !== '' ? parseFloat(humidity) : null,
            rainfall: rainfall !== undefined && rainfall !== null && rainfall !== '' ? parseFloat(rainfall) : null,
            crop_type: String(crop_type).trim(),
            soil_moisture: parseFloat(soil_moisture),
            plant_age_days: parseInt(plant_age_days),
            mode: mode || 'hybrid',
            location: location || null
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
        });

        res.json(response.data);

    } catch (error) {
        console.error('Error forwarding to AI prediction service:', error.message);
        
        let errorMessage = 'Failed to process pest prediction.';
        if (error.response && error.response.data && error.response.data.detail) {
            errorMessage = error.response.data.detail;
        }

        res.status(500).json({ error: errorMessage });
    }
};

module.exports = { predictPestRisk };
