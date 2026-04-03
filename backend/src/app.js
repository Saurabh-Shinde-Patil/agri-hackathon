const express = require('express');
const cors = require('cors');
const detectionRoutes = require('./routes/detectionRoutes');

const app = express();

class App {
    constructor() {
        this.app = express();
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

        // Use detection routes
        this.app.use('/api', detectionRoutes);
    }
}

module.exports = new App().app;
