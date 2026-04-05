const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const config = require('../config/env');
const DetectionHistory = require('../models/DetectionHistory');

const detectDisease = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded. Please provide an image file.' });
        }

        const farm_id = req.body.farm_id || 'farm123';

        // Prepare the file payload and mode to send to the AI service
        const formData = new FormData();
        formData.append('image', fs.createReadStream(req.file.path), req.file.originalname);
        
        // Pass standard flags
        let mode = req.body.mode || 'model';
        let ai_provider = req.body.ai_provider || 'gemini';
        formData.append('mode', mode);
        formData.append('ai_provider', ai_provider);

        console.log(`Forwarding image to AI Service at ${config.AI_SERVICE_URL}`);
        
        // Forward request to Python FastAPI backend
        const response = await axios.post(config.AI_SERVICE_URL, formData, {
            headers: {
                ...formData.getHeaders()
            }
        });

        // Delete temporary file after forwarding
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        const pythonData = response.data;

        // Save detection history
        const detectionRecord = new DetectionHistory({
            farm_id: farm_id,
            result: pythonData,
            disease_name: pythonData.disease_name || pythonData.disease || 'Unknown',
            // image_url could be set here if we integrated S3 or local static serving, for now leave blank
        });

        await detectionRecord.save();

        // Send back the prediction
        res.json(pythonData);

    } catch (error) {
        console.error('Error forwarding to AI service:', error.message);
        
        // Clean up temp file
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        let errorMessage = 'Failed to process image detection.';
        if (error.response && error.response.data && error.response.data.detail) {
            errorMessage = error.response.data.detail;
        }

        res.status(500).json({ error: errorMessage });
    }
};

module.exports = {
    detectDisease
};
