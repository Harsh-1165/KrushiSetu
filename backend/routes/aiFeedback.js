const express = require('express');
const router = express.Router();
const AiFeedback = require('../models/AiFeedback');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/ai-feedback/stats
// @desc    Get aggregated AI accuracy statistics
// @access  Private (Expert/Admin)
router.get('/stats', protect, authorize('expert', 'admin'), async (req, res) => {
    try {
        const totalCases = await AiFeedback.countDocuments();

        // accuracy breakdown
        const accuracyStats = await AiFeedback.aggregate([
            {
                $group: {
                    _id: '$accuracyStatus',
                    count: { $sum: 1 }
                }
            }
        ]);

        // crop specific accuracy
        const cropStats = await AiFeedback.aggregate([
            {
                $group: {
                    _id: '$cropType',
                    total: { $sum: 1 },
                    correct: {
                        $sum: {
                            $cond: [{ $eq: ['$accuracyStatus', 'accurate'] }, 1, 0]
                        }
                    }
                }
            },
            {
                $addFields: {
                    accuracyPercentage: { $multiply: [{ $divide: ['$correct', '$total'] }, 100] }
                }
            }
        ]);

        // most common misdiagnoses (where AI was wrong)
        const misdiagnoses = await AiFeedback.aggregate([
            { $match: { accuracyStatus: { $ne: 'accurate' } } },
            {
                $group: {
                    _id: { ai: '$aiPrediction.disease', expert: '$expertDiagnosis' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        res.status(200).json({
            success: true,
            totalCases,
            accuracyStats,
            cropStats,
            misdiagnoses
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   GET /api/ai-feedback/export
// @desc    Export labeled dataset for fine-tuning
// @access  Private (Admin only)
router.get('/export', protect, authorize('expert', 'admin'), async (req, res) => {
    try {
        const feedback = await AiFeedback.find()
            .populate('advisory', 'images location description')
            .sort({ createdAt: -1 });

        const dataset = feedback.map(item => ({
            id: item._id,
            imageUrl: item.advisory?.images?.[0] || "",
            cropType: item.cropType,
            description: item.advisory?.description,
            aiPrediction: item.aiPrediction,
            expertLabel: item.expertDiagnosis,
            status: item.accuracyStatus,
            correctionReason: item.correctionReason,
            timestamp: item.createdAt
        }));

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=labeled_dataset.json');

        res.status(200).send(JSON.stringify(dataset, null, 2));
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Export Failed' });
    }
});

module.exports = router;
