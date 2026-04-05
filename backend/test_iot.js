const axios = require('axios');

async function testIoT() {
  try {
    console.log('Sending mock sensor data to POST /api/iot-data...');
    const response = await axios.post('http://localhost:5000/api/iot-data', {
      temperature: 28.5,
      humidity: 88, // High humidity (should trigger disease alert)
      soil_moisture: 25, // Low moisture (should trigger irrigation alert)
      rain_status: 1, // Rain detected
      light_intensity: 850
    });
    console.log('POST Response:', response.status, response.data);
    
    console.log('\nFetching latest data via GET /api/iot-data/latest...');
    const getResp = await axios.get('http://localhost:5000/api/iot-data/latest');
    console.log('GET Response:', getResp.status, getResp.data);

    console.log('\nSimulation successful. You can view this on the Frontend Dashboard now!');
  } catch (err) {
    console.error('Test failed. Make sure backend is running on port 5000.', err.message);
  }
}

testIoT();
