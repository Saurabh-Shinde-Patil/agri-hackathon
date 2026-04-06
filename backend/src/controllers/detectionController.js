const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const config = require('../config/env');
const DetectionHistory = require('../models/DetectionHistory');
const AdminSettings = require('../models/AdminSettings');

const detectDisease = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded. Please provide an image file.' });
        }

        const farm_id = req.body.farm_id || 'farm123';
        const language = req.body.language || 'en';
        
        let mode = req.body.mode || 'model';
        let ai_provider = req.body.ai_provider || 'gemini';

        // Fetch Global Admin Settings
        let settings = await AdminSettings.findOne();
        const modeSelectionEnabled = settings ? settings.modeSelectionEnabled : false;

        if (!modeSelectionEnabled) {
            mode = 'hybrid';
        }

        const executeDetection = async (providerOverride) => {
            const formData = new FormData();
            formData.append('image', fs.createReadStream(req.file.path), req.file.originalname);
            formData.append('mode', mode);
            formData.append('ai_provider', providerOverride);
            formData.append('language', language);
            
            const response = await axios.post(config.AI_SERVICE_URL, formData, {
                headers: { ...formData.getHeaders() },
                timeout: 30000
            });
            return response.data;
        };

        console.log(`Forwarding image to AI Service at ${config.AI_SERVICE_URL}`);

        let pythonData = null;
        let successfulProvider = ai_provider;

        if (modeSelectionEnabled) {
            pythonData = await executeDetection(ai_provider);
        } else {
            const providersToTry = ['gemini', 'grok', 'together'];
            let lastError = null;

            for (const p of providersToTry) {
                try {
                    console.log(`[Detection Fallback] Trying provider: ${p}`);
                    pythonData = await executeDetection(p);
                    successfulProvider = p;
                    break;
                } catch (err) {
                    console.error(`[Detection Fallback] Provider ${p} failed.`);
                    lastError = err;
                }
            }

            if (!pythonData && lastError) {
                throw lastError;
            }
        }

        // Save detection history
        const detectionRecord = new DetectionHistory({
            farm_id: farm_id,
            result: pythonData,
            disease_name: pythonData.disease_name || pythonData.disease || 'Unknown',
        });

        await detectionRecord.save();

        res.json(pythonData);

    } catch (error) {
        console.error('Error forwarding to AI service:', error.message);
        
        let errorMessage = 'Failed to process image detection.';
        if (error.response && error.response.data && error.response.data.detail) {
            errorMessage = error.response.data.detail;
        }

        res.status(500).json({ error: errorMessage });
    } finally {
        // Clean up temp file safely at the very end
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
    }
};

module.exports = {
    detectDisease
};
