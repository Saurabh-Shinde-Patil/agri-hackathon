const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    farm_id: {
        type: String,
        required: true,
        index: true
    },
    type: {
        type: String // e.g., 'Fungal Risk', 'Irrigation Alert', 'Disease Spread Risk'
    },
    message: {
        type: String
    },
    severity: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium'
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Alert', alertSchema);
