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
    location: {
        type: String,
        required: true
    },
    // Environmental Context
    soilType: {
        type: String,
        enum: ['Red', 'Black', 'Alluvial', 'Clay', 'Sandy', 'Loam', 'Other'],
        default: 'Other'
    },
    irrigationType: {
        type: String,
        enum: ['Rainfed', 'Drip', 'Sprinkler', 'Canal', 'Borewell', 'Other'],
        default: 'Other'
    },
    weatherContext: {
        temperature: Number,
        humidity: Number,
        rainfall: Number,
        forecast: String
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'answered'],
        default: 'pending'
    },
    // AI Analysis & Risk

    aiRiskAssessment: {
        riskLevel: {
            type: String,
            enum: ['Low', 'Medium', 'High'],
            default: 'Low'
        },
        fungalRisk: Boolean,
        droughtRisk: Boolean,
        next7DaysForecast: String,
        weatherAlert: String
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
    // AI Analysis (Detailed)
    aiAnalysis: {
        disease: { type: String },
        confidence: { type: Number }, // 0-100
        severity: {
            type: String,
            enum: ['Low', 'Moderate', 'High', 'Critical', 'Unknown'],
            default: 'Unknown'
        },
        description: { type: String },
        treatment: [{ type: String }],
        prevention: [{ type: String }],
        analyzedAt: { type: Date, default: Date.now }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    // Feedback Tracking
    reviewStatus: {
        type: String,
        enum: ['pending_review', 'reviewed'],
        default: 'pending_review'
    }
});

module.exports = mongoose.model('CropAdvisory', cropAdvisorySchema);
