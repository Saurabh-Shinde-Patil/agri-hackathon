require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
    console.log("Testing connection out to: ", process.env.MONGODB_URI.substring(0, 50) + "...");
    try {
        await mongoose.connect(process.env.MONGODB_URI, { 
            family: 4, 
            serverSelectionTimeoutMS: 5000 
        });
        console.log("✅ SUCCESS! Connected to MongoDB.");
        process.exit(0);
    } catch (e) {
        console.error("❌ ERROR:", e.message);
        process.exit(1);
    }
}

testConnection();
