const IotData = require('../models/IotData');
const Alert = require('../models/Alert');
const { predictPestRisk } = require('./predictionController');

// In-memory cache for real-time monitoring
let latest_data_cache = null;
let latest_alerts_cache = [];

const postIotData = async (req, res) => {
    try {
        const { farm_id = 'farm123' } = req.body;
        const temperature = req.body.temperature;
        const humidity = req.body.humidity;
        const soil_moisture = req.body.soil_moisture ?? req.body.soilMoisture;
        const rain_status = req.body.rain_status ?? req.body.rainStatus;
        const light_intensity = req.body.light_intensity ?? req.body.lightIntensity;

        // Optional lightweight validation
        if (temperature === undefined && humidity === undefined) {
            return res.status(400).json({ error: 'No sensor data provided' });
        }

        // Create the record object (but do NOT save to DB yet)
        const iotData = {
            farm_id,
            temperature: temperature ?? null,
            humidity: humidity ?? null,
            soil_moisture: soil_moisture ?? null,
            rain_status: rain_status ?? null,
            light_intensity: light_intensity ?? null,
            timestamp: new Date()
        };

        // Store in memory cache
        latest_data_cache = iotData;
        
        // Generate alerts based on thresholds
        const generatedAlerts = [];
        if (humidity > 80) {
            generatedAlerts.push({ farm_id, type: 'Fungal Risk', message: 'Humidity is above 80%. High risk for fungal spread.', severity: 'High', timestamp: new Date() });
        }
        if (soil_moisture < 30 && soil_moisture !== null) {
            generatedAlerts.push({ farm_id, type: 'Irrigation Alert', message: 'Soil moisture is below 30%. Needs irrigation.', severity: 'Medium', timestamp: new Date() });
        }
        if (rain_status === 1) { // 1 or equivalent for raining
            generatedAlerts.push({ farm_id, type: 'Disease Spread Risk', message: 'Rain detected. Potential risk for airborne disease spread.', severity: 'High', timestamp: new Date() });
        }

        // Store latest alerts in memory
        latest_alerts_cache = generatedAlerts;

        res.status(200).json({ 
            message: 'IoT data received and cached', 
            alerts: generatedAlerts
        });

    } catch (error) {
        console.error('Error receiving IoT data:', error.message);
        res.status(500).json({ error: 'Failed to process data' });
    }
};

const getLiveIotData = async (req, res) => {
    try {
        if (!latest_data_cache) {
            // If cache empty, try to get last known from DB to initialize
            const lastKnown = await IotData.findOne().sort({ timestamp: -1 });
            if (lastKnown) {
                latest_data_cache = lastKnown;
            } else {
                return res.status(404).json({ error: 'No live or historical data found' });
            }
        }
        
        res.json({
            ...latest_data_cache.toObject ? latest_data_cache.toObject() : latest_data_cache,
            alerts: latest_alerts_cache
        });
    } catch (error) {
        console.error('Error fetching live IoT data:', error.message);
        res.status(500).json({ error: 'Failed to fetch live data' });
    }
};

const saveIotData = async (req, res) => {
    try {
        if (!latest_data_cache) {
            return res.status(400).json({ error: 'No data in memory to save' });
        }

        const iotData = new IotData(latest_data_cache);
        await iotData.save();

        res.status(201).json({ message: 'IoT data persisted to MongoDB', data: iotData });
    } catch (error) {
        console.error('Error persisting IoT data:', error.message);
        res.status(500).json({ error: 'Failed to save data' });
    }
};

const saveAlert = async (req, res) => {
    try {
        const { alert } = req.body;
        if (!alert) {
            return res.status(400).json({ error: 'No alert data provided' });
        }

        const newAlert = new Alert(alert);
        await newAlert.save();

        res.status(201).json({ message: 'Alert saved successfully', id: newAlert._id });
    } catch (error) {
        console.error('Error saving alert:', error.message);
        res.status(500).json({ error: 'Failed to save alert' });
    }
};

const runAnalysis = async (req, res) => {
    try {
        let analysisData = latest_data_cache;

        if (!analysisData) {
            // Fallback to latest entry in MongoDB if cache is entirely empty
            analysisData = await IotData.findOne().sort({ timestamp: -1 });
            if (!analysisData) {
                return res.status(400).json({ error: 'No live or historical data available for analysis' });
            }
            // Populate memory cache so dashboard also shows this last known state
            latest_data_cache = analysisData;
        }

        // 1. Save state at time of analysis to MongoDB
        // We strip the _id in case analysisData came directly from DB, to create a fresh telemetry snapshot
        const rawData = analysisData.toObject ? analysisData.toObject() : analysisData;
        delete rawData._id;
        rawData.timestamp = new Date();
        
        const iotData = new IotData(rawData);
        await iotData.save();

        // 2. Trigger prediction using analysis data
        req.body = {
            ...req.body,
            farm_id: rawData.farm_id || 'farm123',
            temperature: rawData.temperature,
            humidity: rawData.humidity,
            soil_moisture: rawData.soil_moisture,
            rain_status: rawData.rain_status,
            light_intensity: rawData.light_intensity,
            data_sources: {
                temperature: 'sensor',
                humidity: 'sensor',
                soil_moisture: 'sensor',
                rainfall: 'sensor'
            }
        };

        // Call predictPestRisk from predictionController
        return predictPestRisk(req, res);

    } catch (error) {
        console.error('Error running analysis on live data:', error.message);
        res.status(500).json({ error: 'Analysis failed' });
    }
};

module.exports = {
    postIotData,
    getLiveIotData,
    saveIotData,
    saveAlert,
    runAnalysis,
    // Keep this for legacy if needed, but point it to cache
    getLatestIotData: getLiveIotData 
};

