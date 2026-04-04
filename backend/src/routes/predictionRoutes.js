const express = require('express');
const { predictPestRisk } = require('../controllers/predictionController');

const router = express.Router();

// Route for pest/disease risk prediction
router.post('/predict', predictPestRisk);

module.exports = router;
