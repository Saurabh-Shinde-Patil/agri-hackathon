const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'data/iot_data.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Querying last 5 IoT data entries...');
db.each("SELECT * FROM iot_data ORDER BY timestamp DESC LIMIT 5", (err, row) => {
    if (err) {
        console.error(err);
    } else {
        console.log(JSON.stringify(row));
    }
}, () => {
    db.close();
});
