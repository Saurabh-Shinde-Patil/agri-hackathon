const IotData = require('../models/IotData');
const Alert = require('../models/Alert');

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

        const iotData = new IotData({
            farm_id,
            temperature: temperature ?? null,
            humidity: humidity ?? null,
            soil_moisture: soil_moisture ?? null,
            rain_status: rain_status ?? null,
            light_intensity: light_intensity ?? null
        });

        await iotData.save();
        
        // Generate alerts based on thresholds
        const generatedAlerts = [];
        if (humidity > 80) {
            generatedAlerts.push({ farm_id, type: 'Fungal Risk', message: 'Humidity is above 80%. High risk for fungal spread.', severity: 'High' });
        }
        if (soil_moisture < 30 && soil_moisture !== null) {
            generatedAlerts.push({ farm_id, type: 'Irrigation Alert', message: 'Soil moisture is below 30%. Needs irrigation.', severity: 'Medium' });
        }
        if (rain_status === 1) { // 1 or equivalent for raining
            generatedAlerts.push({ farm_id, type: 'Disease Spread Risk', message: 'Rain detected. Potential risk for airborne disease spread.', severity: 'High' });
        }

        if (generatedAlerts.length > 0) {
            await Alert.insertMany(generatedAlerts);
        }

        res.status(201).json({ 
            message: 'IoT data recorded successfully', 
            id: iotData._id,
            alerts: generatedAlerts
        });

    } catch (error) {
        console.error('Error inserting IoT data:', error.message);
        res.status(500).json({ error: 'Failed to insert data' });
    }
};

const getLatestIotData = async (req, res) => {
    try {
        const { farm_id = 'farm123' } = req.query;
        
        // Temporarily ignore farm_id filter since there is only one ESP32 device
        const latestData = await IotData.findOne()
                                        .sort({ timestamp: -1 });

        if (!latestData) {
            return res.status(404).json({ error: 'No IoT data found for this farm' });
        }
        res.json(latestData);
    } catch (error) {
        console.error('Error fetching latest IoT data:', error.message);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
};

module.exports = {
    postIotData,
    getLatestIotData
};
