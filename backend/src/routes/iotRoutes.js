const express = require('express');
const router = express.Router();
const { 
    postIotData, 
    getLiveIotData, 
    saveIotData, 
    saveAlert, 
    runAnalysis 
} = require('../controllers/iotController');

// Define routes
router.post('/iot-data', postIotData);
router.get('/live-iot-data', getLiveIotData);
router.post('/save-iot-data', saveIotData);
router.post('/save-alert', saveAlert);
router.post('/run-analysis', runAnalysis);

// Legacy support
router.get('/iot-data/latest', getLiveIotData);

module.exports = router;

