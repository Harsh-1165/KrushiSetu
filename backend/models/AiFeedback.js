const mongoose = require('mongoose');

const aiFeedbackSchema = new mongoose.Schema({
    advisory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CropAdvisory',
        required: true
    },
    expert: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Snapshot of what AI said
    aiPrediction: {
        disease: { type: String },
        confidence: { type: Number },
        severity: { type: String }
    },
    // Expert's final decision
    expertDiagnosis: {
        type: String,
        required: true
    },
    // The core feedback
    accuracyStatus: {
        type: String,
        enum: ['accurate', 'partially_correct', 'incorrect'],
        required: true
    },
    correctionReason: {
        type: String // Optional: why was AI wrong? (e.g., "Lighting info", "Similar symptoms")
    },
    // Meta data for analytics
    cropType: { type: String },
    growthStage: { type: String },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('AiFeedback', aiFeedbackSchema);
