const express = require('express');
const router = express.Router();
const { postIotData, getLatestIotData } = require('../controllers/iotController');

// Define routes
router.post('/iot-data', postIotData);
router.get('/iot-data/latest', getLatestIotData);

module.exports = router;
