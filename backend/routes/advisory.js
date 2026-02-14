const express = require('express');
const router = express.Router();
const CropAdvisory = require('../models/CropAdvisory');
const { protect, authorize } = require('../middleware/auth');

const { analyzeCrop } = require('../services/aiAdvisory.service');
const { getMockWeather } = require('../services/weather.service');

// @route   POST /api/advisory/analyze
// @desc    Analyze crop image using AI (Stateless)
// @access  Private (Farmer)
router.post('/analyze', protect, async (req, res) => {
    try {
        const { imageUrl, cropType, growthStage, description, location, soilType, irrigationType, symptoms, temperature, recentRain } = req.body;

        if (!imageUrl) {
            return res.status(400).json({ success: false, message: 'Image URL is required' });
        }

        // 1. Get Weather Context (Simulated or from form data)
        let weatherContext = null;
        if (location) {
            weatherContext = getMockWeather(location);
            // Override with form data if provided
            if (temperature !== undefined) {
                weatherContext.temperature = temperature;
            }
            if (recentRain) {
                const rainMap = { 'No Rain': 0, 'Light Rain': 10, 'Heavy Rain': 50 };
                weatherContext.rainfall = rainMap[recentRain] || 0;
                weatherContext.humidity = recentRain === 'Heavy Rain' ? 85 : recentRain === 'Light Rain' ? 65 : 45;
            }
        }

        // 2. Perform AI Analysis with Context (including symptoms)
        const analysis = await analyzeCrop(
            imageUrl,
            cropType,
            growthStage,
            description,
            soilType,
            irrigationType,
            weatherContext,
            symptoms || [] // Pass symptoms array
        );

        // Return combined result
        res.status(200).json({
            success: true,
            data: {
                ...analysis,
                weatherContext // Return weather so frontend can display/submit it
            }
        });
    } catch (err) {
        console.error("Analysis Error:", err);
        res.status(500).json({ success: false, message: 'AI Analysis Failed' });
    }
});

// @route   POST /api/advisory
// @desc    Submit new advisory request (with AI data)
// @access  Private (Farmer)
router.post('/', protect, async (req, res) => {
    try {
        const {
            images,
            cropType,
            growthStage,
            description,
            location,
            soilType,
            irrigationType,
            weatherContext,
            aiAnalysis,
            aiRiskAssessment
        } = req.body;

        const advisory = await CropAdvisory.create({
            farmer: req.user.id,
            images,
            cropType,
            growthStage,
            description,
            location,
            soilType: soilType || 'Other',
            irrigationType: irrigationType || 'Other',
            weatherContext, // Save the snapshot
            aiRiskAssessment,
            aiAnalysis: aiAnalysis || {
                disease: 'Pending',
                confidence: 0,
                severity: 'Unknown',
                description: 'Analysis pending'
            }
        });

        res.status(201).json({
            success: true,
            data: advisory
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   GET /api/advisory
// @desc    Get all advisory requests (Expert) or My Requests (Farmer)
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        let query;

        console.log(`GET /api/advisory - User: ${req.user.id}, Role: ${req.user.role}`);

        if (req.user.role === 'expert') {
            // Expert sees all pending requests first, or filtered by status
            query = CropAdvisory.find().populate('farmer', 'name email').sort({ createdAt: -1 });
        } else {
            // Farmer sees only their own requests
            query = CropAdvisory.find({ farmer: req.user.id }).populate('farmer', 'name email').sort({ createdAt: -1 });
        }

        const advisories = await query;
        console.log(`Found ${advisories.length} advisories`);

        res.status(200).json({
            success: true,
            count: advisories.length,
            data: advisories
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   GET /api/advisory/:id
// @desc    Get single advisory request
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const advisory = await CropAdvisory.findById(req.params.id).populate('farmer', 'name email');

        if (!advisory) {
            return res.status(404).json({ success: false, message: 'Advisory request not found' });
        }

        // Ensure farmer owns it or user is expert
        if (advisory.farmer._id.toString() !== req.user.id && req.user.role !== 'expert') {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        res.status(200).json({
            success: true,
            data: advisory
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   PATCH /api/advisory/:id
// @desc    Expert provides advice
// @access  Private (Expert)
router.patch('/:id', protect, authorize('expert'), async (req, res) => {
    try {
        const { expertDiagnosis, treatment, confidence, accuracyStatus, correctionReason } = req.body;

        if (!expertDiagnosis || !treatment) {
            return res.status(400).json({ success: false, message: 'Diagnosis and treatment are required' });
        }

        let advisory = await CropAdvisory.findById(req.params.id);

        if (!advisory) {
            return res.status(404).json({ success: false, message: 'Advisory request not found' });
        }

        // Save Expert Response
        advisory.expertDiagnosis = expertDiagnosis;
        advisory.treatment = treatment;
        advisory.confidence = confidence;
        advisory.status = 'answered';
        advisory.expert = req.user.id;
        advisory.answeredAt = Date.now();
        advisory.reviewStatus = 'reviewed';

        await advisory.save();

        // ----------------------------------------------------
        // AI FEEDBACK LOOP: Log the correction
        // ----------------------------------------------------
        if (accuracyStatus) {
            const AiFeedback = require('../models/AiFeedback');

            await AiFeedback.create({
                advisory: advisory._id,
                expert: req.user.id,
                aiPrediction: {
                    disease: advisory.aiAnalysis?.disease || 'Unknown',
                    confidence: advisory.aiAnalysis?.confidence || 0,
                    severity: advisory.aiAnalysis?.severity || 'Unknown'
                },
                expertDiagnosis,
                accuracyStatus,
                correctionReason,
                cropType: advisory.cropType,
                growthStage: advisory.growthStage
            });
        }

        res.status(200).json({
            success: true,
            data: advisory
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
