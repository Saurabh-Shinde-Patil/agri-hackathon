const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'iot_data.sqlite');
console.log(`Connecting to IoT Database at ${dbPath}`);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to IoT SQLite database:', err.message);
    } else {
        console.log('Connected to the IoT SQLite database.');
        
        // Initialize table
        db.serialize(() => {
            db.run(`
                CREATE TABLE IF NOT EXISTS iot_data (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    temperature REAL,
                    humidity REAL,
                    soil_moisture REAL,
                    rain_status INTEGER,
                    light_intensity REAL,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (createErr) => {
                if (createErr) {
                    console.error('Error creating iot_data table:', createErr.message);
                } else {
                    console.log('iot_data table initialized/ready.');
                }
            });
        });
    }
});

module.exports = db;
