const express = require('express');
const { getFarms, createFarm } = require('../controllers/farmController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(protect, getFarms).post(protect, createFarm);

module.exports = router;
