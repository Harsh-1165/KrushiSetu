const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables FIRST
dotenv.config({ path: path.join(__dirname, '../.env') });

const agmarknetService = require('../services/agmarknetService');

const seedPrices = async () => {
    try {
        console.log('Starting seed process...');
        const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/greentrace";
        await mongoose.connect(mongoURI);
        console.log('MongoDB Connected');

        // Fetch smaller batch for initial test/seed
        await agmarknetService.fetchAndStorePrices(50);

        console.log('Seeding Completed');
        // Allow time for logs to flush before exit
        setTimeout(() => process.exit(0), 1000);
    } catch (error) {
        console.error('Seeding Failed Full Error:', error);
        if (error.response) console.error('Response Data:', error.response.data);
        setTimeout(() => process.exit(1), 1000);
    }
};

seedPrices();
