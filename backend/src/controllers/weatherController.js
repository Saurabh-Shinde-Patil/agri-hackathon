const axios = require('axios');

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || '65e4bbf78127efc4ed07cc49c838b7b5';

const getWeather = async (req, res) => {
    const { location } = req.query;

    if (!location || !location.trim()) {
        return res.status(400).json({ error: 'Location is required. Provide a city name or coordinates.' });
    }

    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location.trim())}&appid=${OPENWEATHER_API_KEY}&units=metric`;
        const response = await axios.get(url, { timeout: 10000 });
        const data = response.data;

        res.json({
            temperature: data.main.temp,
            humidity: data.main.humidity,
            rainfall: data.rain ? (data.rain['1h'] || data.rain['3h'] || 0) : 0,
            wind_speed: data.wind.speed,
            description: data.weather[0].description,
            icon: data.weather[0].icon,
            location_name: data.name,
            country: data.sys.country,
            feels_like: data.main.feels_like,
            pressure: data.main.pressure,
            visibility: data.visibility,
            clouds: data.clouds.all
        });
    } catch (error) {
        console.error('Weather API error:', error.message);
        
        if (error.response && error.response.status === 404) {
            return res.status(404).json({ error: `City "${location}" not found. Please check the spelling.` });
        }
        
        res.status(500).json({ error: 'Failed to fetch weather data. Please try again.' });
    }
};

module.exports = { getWeather };
