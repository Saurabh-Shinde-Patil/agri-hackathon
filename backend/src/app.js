const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const detectionRoutes = require('./routes/detectionRoutes');
const predictionRoutes = require('./routes/predictionRoutes');
const iotRoutes = require('./routes/iotRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const farmRoutes = require('./routes/farmRoutes');
const adminRoutes = require('./routes/adminRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const app = express();

class App {
    constructor() {
        this.app = express();
        connectDB();
        this.middlewares();
        this.routes();
    }

    middlewares() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
    }

    routes() {
        // Health check
        this.app.get('/api/health', (req, res) => {
            res.json({ status: 'API Gateway is running smoothly' });
        });

        // Use routes
        this.app.use('/api', authRoutes);
        this.app.use('/api', detectionRoutes);
        this.app.use('/api', predictionRoutes);
        this.app.use('/api', iotRoutes);
        this.app.use('/api', weatherRoutes);
        this.app.use('/api/farms', farmRoutes);
        this.app.use('/api/admin', adminRoutes);
        this.app.use('/api/chatbot', chatbotRoutes);
        this.app.use('/api/settings', settingsRoutes);
    }
}

module.exports = new App().app;
