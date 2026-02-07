const mongoose = require('mongoose');

const cropAdvisorySchema = new mongoose.Schema({
    farmer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    images: [{
        type: String, // Cloudinary URLs
        required: true
    }],
    cropType: {
        type: String,
        required: true
    },
    growthStage: {
        type: String,
        enum: ['Seedling', 'Vegetative', 'Flowering', 'Fruiting', 'Harvest'],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    location: {
        type: String, // Or object if more detailed
    },
    status: {
        type: String,
        enum: ['pending', 'answered'],
        default: 'pending'
    },
    // Expert Response
    expertDiagnosis: {
        type: String
    },
    treatment: {
        type: String
    },
    confidence: {
        type: Number, // 0-100
        min: 0,
        max: 100
    },
    expert: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    answeredAt: {
        type: Date
    },
    // Mock AI Prediction
    aiPrediction: {
        disease: String,
        confidence: Number,
        description: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('CropAdvisory', cropAdvisorySchema);
