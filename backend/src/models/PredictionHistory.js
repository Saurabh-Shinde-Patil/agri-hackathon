const mongoose = require('mongoose');

const predictionHistorySchema = new mongoose.Schema({
    farm_id: {
        type: String,
        required: true,
        index: true
    },
    mode: {
        type: String, // 'model', 'api', 'hybrid'
    },
    risk: {
        type: String
    },
    confidence: {
        type: String
    },
    reason: {
        type: String
    },
    suggestion: {
        type: String
    },
    source: {
        type: String
    },
    raw_response: {
        type: mongoose.Schema.Types.Mixed
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('PredictionHistory', predictionHistorySchema);
