const axios = require('axios');
const IotData = require('../models/IotData');
const AdminSettings = require('../models/AdminSettings');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const chatWithAssistant = async (req, res) => {
    try {
        let { message, provider = 'gemini', farm_id } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required.' });
        }

        // Fetch Global Admin Settings
        let settings = await AdminSettings.findOne();
        const modeSelectionEnabled = settings ? settings.modeSelectionEnabled : false;

        // 1. Context Gathering: Fetch latest IoT Data
        let iotContextString = "No recent sensor data available.";
        try {
            const latestData = await IotData.findOne().sort({ timestamp: -1 });
            if (latestData) {
                iotContextString = `Temperature: ${latestData.temperature || 'N/A'}°C, Humidity: ${latestData.humidity || 'N/A'}%, Soil Moisture: ${latestData.soil_moisture || 'N/A'}%, Light Intensity: ${latestData.light_intensity || 'N/A'}%, Rain Status: ${latestData.rain_status ? 'Raining' : 'Clear'}.`;
            }
        } catch (e) {
            console.error("Failed to fetch IoT context", e);
        }

        // 2. Build the System Prompt
        const systemInstruction = `You are AgriShield AI, a conversational farming assistant. 
You provide expert agricultural advisory, disease detection guidance, and risk prediction context to farmers. 
You MUST analyze the following real-time IoT Telemetry for context:
[IoT Sensor Data: ${iotContextString}]

IMPORTANT INSTRUCTIONS:
1. Automatically detect the language of the user's message (e.g., English, Hindi, or Marathi).
2. Reply back EXCLUSIVELY in the same language the user typed in. If they type Marathi, reply in Marathi. If Hindi, Hindi.
3. Keep your advice practical, easy for a farmer to understand, and concise. Do not use overly complex academic terms without explaining them simply.
4. Output your response as a valid JSON object matching exactly this schema:
{
  "reply": "Your conversational response here, in the detected language.",
  "type": "advisory" | "prediction" | "disease" | "general"
}
Ensure the output is pure JSON without markdown blocks (\`\`\`).`;

        const runLLM = async (aiProvider) => {
            if (aiProvider === 'gemini') {
                if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('your_gemini')) {
                    throw new Error('Gemini API Key is not configured');
                }
                const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                const prompt = `${systemInstruction}\n\nUser Message: ${message}`;
                const result = await model.generateContent(prompt);
                return parseResponse(result.response.text());

            } else if (aiProvider === 'grok') {
                if (!process.env.GROK_API_KEY || process.env.GROK_API_KEY.includes('your_grok')) {
                    throw new Error('Grok API Key is not configured');
                }
                const response = await axios.post('https://api.x.ai/v1/chat/completions', {
                    model: 'grok-2-latest',
                    messages: [
                        { role: 'system', content: systemInstruction },
                        { role: 'user', content: message }
                    ],
                    response_format: { type: "json_object" },
                    temperature: 0.3
                }, {
                    headers: { 'Authorization': `Bearer ${process.env.GROK_API_KEY}`, 'Content-Type': 'application/json' }
                });
                return parseResponse(response.data.choices[0].message.content);

            } else if (aiProvider === 'together') {
                if (!process.env.TOGETHER_API_KEY || process.env.TOGETHER_API_KEY.includes('your_together')) {
                    throw new Error('Together API Key is not configured');
                }
                const response = await axios.post('https://api.together.xyz/v1/chat/completions', {
                    model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
                    messages: [
                        { role: 'system', content: systemInstruction },
                        { role: 'user', content: message }
                    ],
                    response_format: { type: "json_object" },
                    temperature: 0.3
                }, {
                    headers: { 'Authorization': `Bearer ${process.env.TOGETHER_API_KEY}`, 'Content-Type': 'application/json' }
                });
                return parseResponse(response.data.choices[0].message.content);
            } else {
                throw new Error('Unknown AI provider selected.');
            }
        };

        if (modeSelectionEnabled) {
            // Respect user selection
            try {
                const resultJson = await runLLM(provider);
                return res.status(200).json(resultJson);
            } catch (err) {
                console.error(`Chatbot Error with ${provider}:`, err.response?.data || err.message);
                return res.status(500).json({ error: `Failed to process chat query with ${provider}.` });
            }
        } else {
            // Intelligent Fallback System
            const providers = ['gemini', 'grok', 'together'];
            let lastError = null;

            for (const p of providers) {
                try {
                    const resultJson = await runLLM(p);
                    // On success, return
                    return res.status(200).json(resultJson);
                } catch (err) {
                    console.error(`Chatbot Fallback: ${p} failed. Trying next...`, err.response?.data || err.message);
                    lastError = err;
                }
            }

            // If all failed
            return res.status(500).json({ error: 'All Chatbot API providers failed.' });
        }

    } catch (error) {
        console.error('Chatbot Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to process chat query.' });
    }
};

// Helper to safely parse LLM JSON strings containing markdown tags
const parseResponse = (text) => {
    try {
        let cleaned = text.trim();
        if (cleaned.startsWith('```json')) {
            cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
        } else if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
        }
        return JSON.parse(cleaned);
    } catch(e) {
        console.error("Failed to parse JSON strictly. Falling back.", e);
        return {
            reply: text.replace(/^```json/, '').replace(/```$/, '').trim(),
            type: "general"
        };
    }
};

module.exports = {
    chatWithAssistant
};
