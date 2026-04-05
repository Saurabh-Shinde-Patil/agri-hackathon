const mongoose = require('mongoose');

const iotDataSchema = new mongoose.Schema({
    farm_id: {
        type: String,
        required: true,
        index: true
    },
    temperature: {
        type: Number
    },
    humidity: {
        type: Number
    },
    soil_moisture: {
        type: Number
    },
    rain_status: {
        type: Number
    },
    light_intensity: {
        type: Number
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('IotData', iotDataSchema);
