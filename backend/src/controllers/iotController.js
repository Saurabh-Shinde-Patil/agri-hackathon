const db = require('../config/db');

const postIotData = (req, res) => {
    const temperature = req.body.temperature;
    const humidity = req.body.humidity;
    const soil_moisture = req.body.soil_moisture ?? req.body.soilMoisture;
    const rain_status = req.body.rain_status ?? req.body.rainStatus;
    const light_intensity = req.body.light_intensity ?? req.body.lightIntensity;

    // Optional lightweight validation
    if (temperature === undefined && humidity === undefined) {
        return res.status(400).json({ error: 'No sensor data provided' });
    }

    const query = `
        INSERT INTO iot_data (temperature, humidity, soil_moisture, rain_status, light_intensity)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.run(query, [
        temperature ?? null,
        humidity ?? null,
        soil_moisture ?? null,
        rain_status ?? null,
        light_intensity ?? null
    ], function(err) {
        if (err) {
            console.error('Error inserting IoT data:', err.message);
            return res.status(500).json({ error: 'Failed to insert data' });
        }
        res.status(201).json({ 
            message: 'IoT data recorded successfully', 
            id: this.lastID 
        });
    });
};

const getLatestIotData = (req, res) => {
    const query = `
        SELECT * FROM iot_data 
        ORDER BY timestamp DESC 
        LIMIT 1
    `;

    db.get(query, [], (err, row) => {
        if (err) {
            console.error('Error fetching latest IoT data:', err.message);
            return res.status(500).json({ error: 'Failed to fetch data' });
        }
        if (!row) {
            return res.status(404).json({ error: 'No IoT data found' });
        }
        res.json(row);
    });
};

module.exports = {
    postIotData,
    getLatestIotData
};
