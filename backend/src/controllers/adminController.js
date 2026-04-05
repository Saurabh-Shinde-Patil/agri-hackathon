const User = require('../models/User');
const Farm = require('../models/Farm');

const getAdminStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalFarms = await Farm.countDocuments();
        
        // Mock inferences / load for now, could be dynamic later if tracking exists
        const systemLoad = 'Low';
        const totalInferences = await User.aggregate([{ $group: { _id: null, sum: { $sum: "$usageCount" } } }]);

        const recentUsers = await User.find({}).sort({ createdAt: -1 }).limit(5).select('-password');

        res.json({
            totalUsers,
            totalFarms,
            systemLoad,
            totalInferences: totalInferences.length ? totalInferences[0].sum : 0,
            recentUsers
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAdminStats
};
