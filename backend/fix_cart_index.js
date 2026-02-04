const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config(); // Defaults to .env in current dir

const connectDB = async () => {
    try {
        const uri = "mongodb+srv://harshmaniya64:HarshManiya1165@greentrace.mftbrzy.mongodb.net/test?retryWrites=true&w=majority";
        const conn = await mongoose.connect(uri);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const fixIndexes = async () => {
    await connectDB();

    try {
        const collection = mongoose.connection.collection('carts');
        const indexes = await collection.indexes();
        console.log('Current Indexes:', indexes);

        const indexName = 'userId_1';
        const indexExists = indexes.some(idx => idx.name === indexName);

        if (indexExists) {
            console.log(`Dropping index: ${indexName}...`);
            await collection.dropIndex(indexName);
            console.log('Index dropped successfully.');
        } else {
            console.log(`Index ${indexName} not found.`);
        }

    } catch (error) {
        console.error('Error dropping index:', error.message);
    } finally {
        mongoose.disconnect();
    }
};

fixIndexes();
