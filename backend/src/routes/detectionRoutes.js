const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { detectDisease } = require('../controllers/detectionController');

const router = express.Router();

// Setup multer to store uploaded files temporarily
// Create uploads folder if it doesn't exist
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}
const upload = multer({ dest: uploadDir });

// Route for detecting plant disease
router.post('/detect', upload.single('image'), detectDisease);

module.exports = router;
