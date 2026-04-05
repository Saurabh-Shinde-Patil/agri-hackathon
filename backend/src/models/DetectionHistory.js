const mongoose = require('mongoose');

const detectionHistorySchema = new mongoose.Schema({
    farm_id: {
        type: String,
        required: true,
        index: true
    },
    image_url: {
        type: String
    },
    result: {
        type: mongoose.Schema.Types.Mixed // For storing full API response flexible JSON
    },
    disease_name: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('DetectionHistory', detectionHistorySchema);
