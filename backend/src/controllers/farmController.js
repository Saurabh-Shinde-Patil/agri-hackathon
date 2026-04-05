const Farm = require('../models/Farm');

const getFarms = async (req, res) => {
    try {
        const farms = await Farm.find({ owner: req.user._id });
        res.json(farms);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createFarm = async (req, res) => {
    try {
        const { name, location } = req.body;
        const farm_id = 'farm_' + Math.random().toString(36).substr(2, 9);
        
        const farm = await Farm.create({
            farm_id,
            name,
            location,
            owner: req.user._id
        });
        
        res.status(201).json(farm);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getFarms,
    createFarm
};
