const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const config = require('../config/env');

const detectDisease = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded. Please provide an image file.' });
        }

        // Prepare the file payload to send to the AI service
        const formData = new FormData();
        formData.append('image', fs.createReadStream(req.file.path), req.file.originalname);

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

        // Send back the prediction
        res.json(response.data);

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
