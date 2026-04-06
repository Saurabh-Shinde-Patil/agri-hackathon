const AdminSettings = require('../models/AdminSettings');

const getSettings = async (req, res) => {
    try {
        let settings = await AdminSettings.findOne();
        if (!settings) {
            settings = await AdminSettings.create({ modeSelectionEnabled: false });
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateSettings = async (req, res) => {
    try {
        const { modeSelectionEnabled } = req.body;
        let settings = await AdminSettings.findOne();
        if (!settings) {
            settings = await AdminSettings.create({ modeSelectionEnabled });
        } else {
            settings.modeSelectionEnabled = modeSelectionEnabled;
            await settings.save();
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getSettings,
    updateSettings
};
