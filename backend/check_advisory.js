const mongoose = require('mongoose');
const CropAdvisory = require('./models/CropAdvisory');
const User = require('./models/User');
const dotenv = require('dotenv');

console.log('Current directory:', process.cwd());
const result = dotenv.config();
console.log('Dotenv result:', result.error ? result.error : 'Success');
console.log('MONGODB_URI present:', !!process.env.MONGODB_URI);

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        const advisories = await CropAdvisory.find({});
        console.log(`Found ${advisories.length} advisories:`);
        advisories.forEach(a => {
            console.log(`- ID: ${a._id}, Farmer: ${a.farmer}, Status: ${a.status}, Crop: ${a.cropType}`);
        });

        const userId = "697a62adcf89895f771960ef";
        const user = await User.findById(userId);
        if (user) {
            console.log(`User ${userId}: Role=${user.role}, Name=${user.name?.first}`);
        } else {
            console.log(`User ${userId} not found`);
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

connectDB();
