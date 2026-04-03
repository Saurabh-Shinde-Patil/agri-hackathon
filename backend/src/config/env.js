const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

module.exports = {
  PORT: process.env.PORT || 5000,
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000/api/detect',
};
