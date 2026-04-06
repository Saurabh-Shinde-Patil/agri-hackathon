const mongoose = require('mongoose');

const AdminSettingsSchema = new mongoose.Schema({
    modeSelectionEnabled: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('AdminSettings', AdminSettingsSchema);
