const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri || uri === 'your_mongodb_atlas_url_here') {
            console.warn('⚠️ MONGODB_URI is missing or not configured in .env. Falling back to local MongoDB or please configure it.');
            // Fallback for development purposes if Atlas is not yet provided
            // mongoose.connect('mongodb://127.0.0.1:27017/agri_ai_system')
            return;
        }

        const conn = await mongoose.connect(uri, { family: 4 });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
