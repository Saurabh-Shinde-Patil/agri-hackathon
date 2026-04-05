const express = require('express');
const { getAdminStats } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/stats').get(protect, admin, getAdminStats);

module.exports = router;
