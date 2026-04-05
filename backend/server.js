const app = require('./src/app');
const config = require('./src/config/env');

const PORT = config.PORT;

app.listen(PORT, () => {
    console.log(`Backend API Gateway running on http://localhost:${PORT}`);
    console.log(`Configured AI Service URL: ${config.AI_SERVICE_URL}`);
});

// nodemon trigger
// auto restart
// restarted
