const axios = require('axios');
const config = require('../config/env');
const IotData = require('../models/IotData');
const AdminSettings = require('../models/AdminSettings');
const PredictionHistory = require('../models/PredictionHistory');

const predictPestRisk = async (req, res) => {
    try {
        let { farm_id = 'farm123', crop_type, plant_age_days, mode, ai_provider, location, data_sources, rainfall } = req.body;
        
        let { temperature, humidity, soil_moisture, rain_status, light_intensity } = req.body;

        // Fetch Global Admin Settings
        let settings = await AdminSettings.findOne();
        const modeSelectionEnabled = settings ? settings.modeSelectionEnabled : false;

        if (!modeSelectionEnabled) {
            mode = 'hybrid';
        }

        // Fetch latest IoT data to supplement missing fields
        const latestIotData = await IotData.findOne({ farm_id }).sort({ timestamp: -1 });

        if (latestIotData) {
            temperature = temperature ?? latestIotData.temperature;
            humidity = humidity ?? latestIotData.humidity;
            soil_moisture = soil_moisture ?? latestIotData.soil_moisture;
            rain_status = rain_status ?? latestIotData.rain_status;
            light_intensity = light_intensity ?? latestIotData.light_intensity;
        }

        // Validate ALWAYS-required fields
        const missing = [];
        if (!crop_type) missing.push('crop_type');
        if (soil_moisture === undefined || soil_moisture === null) missing.push('soil_moisture');
        if (plant_age_days === undefined || plant_age_days === null) missing.push('plant_age_days');

        if (missing.length > 0) {
            return res.status(400).json({ 
                error: `Missing required fields: ${missing.join(', ')}. These values cannot be auto-fetched and must be provided.`,
                required: ['crop_type', 'soil_moisture', 'plant_age_days']
            });
        }

        console.log(`Forwarding prediction request to AI Service at ${config.AI_PREDICT_URL}`);

        const requestPayloadBase = {
            temperature: temperature !== undefined && temperature !== null && temperature !== '' ? parseFloat(temperature) : null,
            humidity: humidity !== undefined && humidity !== null && humidity !== '' ? parseFloat(humidity) : null,
            rainfall: rainfall !== undefined && rainfall !== null && rainfall !== '' ? parseFloat(rainfall) : null,
            crop_type: String(crop_type).trim(),
            soil_moisture: parseFloat(soil_moisture),
            plant_age_days: parseInt(plant_age_days),
            mode: mode || 'hybrid',
            location: location || null,
            data_sources: data_sources || null,
            rain_status: rain_status !== undefined && rain_status !== null ? parseInt(rain_status) : null,
            light_intensity: light_intensity !== undefined && light_intensity !== null ? parseFloat(light_intensity) : null
        };

        const executePrediction = async (providerOverride) => {
            const payload = { ...requestPayloadBase, ai_provider: providerOverride };
            const response = await axios.post(config.AI_PREDICT_URL, payload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 30000
            });
            return response.data;
        };

        let pythonData = null;
        let successfulProvider = ai_provider || 'gemini';

        if (modeSelectionEnabled) {
            pythonData = await executePrediction(successfulProvider);
        } else {
            const providersToTry = ['gemini', 'grok', 'together'];
            let lastError = null;

            for (const p of providersToTry) {
                try {
                    console.log(`[Prediction Fallback] Trying provider: ${p}`);
                    pythonData = await executePrediction(p);
                    successfulProvider = p;
                    // Note: If hybrid mode API fails inside Python, Python might not throw an HTTP error but return confidence: 0
                    // But if Python throws 503 for an API crash, we catch it here and continue to next provider!
                    break;
                } catch (err) {
                    console.error(`[Prediction Fallback] Provider ${p} failed.`);
                    lastError = err;
                }
            }

            if (!pythonData && lastError) {
                throw lastError;
            }
        }

        const predictionRecord = new PredictionHistory({
            farm_id: farm_id,
            mode: pythonData.mode || mode || 'hybrid',
            risk: pythonData.risk || pythonData.Risk || pythonData.primary_risk_level || 'Unknown',
            confidence: pythonData.confidence,
            reason: pythonData.reason || pythonData.analysis,
            suggestion: pythonData.suggestion || pythonData.recommendation || (pythonData.preventive_actions ? pythonData.preventive_actions.join(', ') : ''),
            source: pythonData.source || successfulProvider || 'Unknown',
            raw_response: pythonData
        });

        await predictionRecord.save();
        res.json(pythonData);

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
