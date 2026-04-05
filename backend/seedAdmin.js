require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function seedAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
        console.log("Connected to MongoDB for seeding...");

        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        const adminRole = process.env.ADMIN_ROLE || 'admin';
        const adminTier = process.env.ADMIN_SUBSCRIPTION_TIER || 'premium';

        if (!adminEmail || !adminPassword) {
            console.error("Admin credentials missing in .env!");
            process.exit(1);
        }

        const adminExists = await User.findOne({ email: adminEmail });
        if (adminExists) {
            console.log("Admin already exists!");
            process.exit(0);
        }

        try {
            await mongoose.connection.collections.users.drop();
            console.log("Dropped old users collection to reset indexes.");
        } catch(e) {
            console.log("No old collections to drop/error ignored.");
        }

        await User.create({
            email: adminEmail,
            password: adminPassword,
            role: adminRole,
            subscriptionTier: adminTier
        });

        console.log(`✅ Admin seeded successfully: ${adminEmail}`);
        process.exit(0);
    } catch (e) {
        console.error("Error seeding admin:", e.message);
        process.exit(1);
    }
}

seedAdmin();
