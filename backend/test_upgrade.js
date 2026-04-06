const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function test() {
    console.log('--- Testing IoT Upgrade ---');

    try {
        // 1. Send data to /iot-data (should only cache)
        console.log('\n1. Sending data to /iot-data...');
        const postRes = await axios.post(`${BASE_URL}/iot-data`, {
            temperature: 25,
            humidity: 85, // Should trigger alert
            soil_moisture: 20, // Should trigger alert
            rain_status: 0,
            light_intensity: 500
        });
        console.log('Response:', postRes.data);

        // 2. Fetch from /live-iot-data
        console.log('\n2. Fetching from /live-iot-data...');
        const liveRes = await axios.get(`${BASE_URL}/live-iot-data`);
        console.log('Live Data:', liveRes.data);

        if (liveRes.data.temperature === 25 && liveRes.data.alerts.length > 0) {
            console.log('SUCCESS: Data cached and alerts generated.');
        } else {
            console.log('FAILURE: Cache or alerts missing.');
        }

        // 3. Verify NOT in database yet (we'll check via script later or assume if _id is missing in liveRes if it didn't come from model)
        // Actually getLiveIotData might return the model object if it found it in DB (fallback), 
        // but for new data it should be a plain object.

        // 4. Save Data
        console.log('\n4. Saving data to MongoDB...');
        const saveRes = await axios.post(`${BASE_URL}/save-iot-data`);
        console.log('Save Response:', saveRes.data);
        const savedId = saveRes.data.data._id;

        // 5. Save Alert
        if (liveRes.data.alerts.length > 0) {
            console.log('\n5. Saving one alert...');
            const alertSaveRes = await axios.post(`${BASE_URL}/save-alert`, { alert: liveRes.data.alerts[0] });
            console.log('Alert Save Response:', alertSaveRes.data);
        }

        // 6. Run Analysis
        console.log('\n6. Running Analysis...');
        const analysisRes = await axios.post(`${BASE_URL}/run-analysis`, {
            crop_type: 'tomato',
            plant_age_days: 30,
            mode: 'model'
        });
        console.log('Analysis Response (Partial):', {
            risk: analysisRes.data.risk,
            confidence: analysisRes.data.confidence
        });

    } catch (err) {
        console.error('Test Failed:', err.response ? err.response.data : err.message);
    }
}

test();
