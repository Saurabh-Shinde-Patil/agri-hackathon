import axios from 'axios';

// Create an Axios instance with base URL from environment variables
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    // You can add default headers, timeouts, etc. here
    headers: {
        'Accept': 'application/json'
    }
});

export default api;
