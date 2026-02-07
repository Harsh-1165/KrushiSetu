const express = require('express');
const router = express.Router();
const CropAdvisory = require('../models/CropAdvisory');
const { protect, authorize } = require('../middleware/auth');

// Mock AI Logic
const generateMockAI = () => {
  const diseases = [
    { name: 'Healthy', confidence: 95, desc: 'Your crop looks healthy! Keep up the good work.' },
    { name: 'Leaf Rust', confidence: 88, desc: 'Fungal disease affecting leaves. Recommended: Fungicide application.' },
    { name: 'Blight', confidence: 75, desc: 'Early signs of blight. Monitor moisture levels.' },
    { name: 'Pest Infestation', confidence: 82, desc: 'Signs of pest damage. Check for insects under leaves.' }
  ];
  return diseases[Math.floor(Math.random() * diseases.length)];
};

// @route   POST /api/advisory
// @desc    Submit new advisory request
// @access  Private (Farmer)
router.post('/', protect, async (req, res) => {
  try {
    const { images, cropType, growthStage, description, location } = req.body;

    // Simulate AI processing delay (in a real app, this might be a background job)
    // For demo, we just generate it immediately but frontend will simulate delay
    const aiResult = generateMockAI();

    const advisory = await CropAdvisory.create({
      farmer: req.user.id,
      images,
      cropType,
      growthStage,
      description,
      location,
      aiPrediction: {
        disease: aiResult.name,
        confidence: aiResult.confidence,
        description: aiResult.desc
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

    if (req.user.role === 'expert') {
      // Expert sees all pending requests first, or filtered by status
      query = CropAdvisory.find().populate('farmer', 'name email').sort({ createdAt: -1 });
    } else {
      // Farmer sees only their own requests
      query = CropAdvisory.find({ farmer: req.user.id }).sort({ createdAt: -1 });
    }

    const advisories = await query;

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
    const { expertDiagnosis, treatment, confidence } = req.body;

    let advisory = await CropAdvisory.findById(req.params.id);

    if (!advisory) {
      return res.status(404).json({ success: false, message: 'Advisory request not found' });
    }

    advisory.expertDiagnosis = expertDiagnosis;
    advisory.treatment = treatment;
    advisory.confidence = confidence;
    advisory.status = 'answered';
    advisory.expert = req.user.id;
    advisory.answeredAt = Date.now();

    await advisory.save();

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
