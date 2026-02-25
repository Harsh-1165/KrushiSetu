const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const aiAdvisoryService = require("../services/aiAdvisoryService");
const logger = require("../utils/logger");
const { protect } = require("../middleware/auth"); // Assuming strict auth for advisory

// Import models
const Question = require("../models/Question");
const Answer = require("../models/Answer");

// Helper to ensure 'uploads' directory exists
const fs = require('fs');
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Check if Cloudinary is properly configured
const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

console.log("Cloudinary configured:", isCloudinaryConfigured);

// Configure Multer Storage
let storage;
if (isCloudinaryConfigured) {
    storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: "greentrace/crops",
            allowed_formats: ["jpg", "png", "jpeg"],
            transformation: [{ width: 1000, height: 1000, crop: "limit" }]
        },
    });
} else {
    // Fallback to memory storage if Cloudinary is not configured
    const multer = require("multer");
    storage = multer.memoryStorage();
    console.log("Using memory storage - Cloudinary not configured");
}

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        console.log("File filter called for file:", file.originalname, file.mimetype);
        // Check file type
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

/**
 * @route   POST /api/v1/advisory/analyze
 * @desc    Analyze crop image or text prompt
 * @access  Private (User/Farmer)
 */
// Custom Upload Middleware to handle Multer errors (optional)
const uploadMiddleware = (req, res, next) => {
    console.log("=== Upload Middleware Started ===");
    console.log("Content-Type:", req.get('Content-Type'));
    console.log("Request headers:", Object.keys(req.headers));

    upload.single("image")(req, res, (err) => {
        if (err) {
            console.error("Multer/Cloudinary Upload Error:", err);
            console.error("Error details:", err.message, err.code);
            // If there's an upload error, we still want to process form data
            // so we don't block entire question creation
            console.log("Upload failed, but continuing with form processing");
            req.file = null; // Ensure file is null if upload failed
        } else {
            console.log("Upload middleware completed successfully");
            console.log("File after upload:", req.file ? {
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                path: req.file.path
            } : 'No file');
        }
        next();
    });
};

/**
 * @route   POST /api/v1/advisory/analyze
 * @desc    Analyze crop image or text prompt
 * @access  Private (User/Farmer)
 */
router.post("/analyze", uploadMiddleware, async (req, res) => {
    try {
        const { prompt, lat, lng, soilData, analysisMode } = req.body;
        const file = req.file;

        if (!prompt && !file) {
            fs.appendFileSync('debug.log', `[${new Date().toISOString()}] No prompt or file provided\n`);
            return res.status(400).json({
                success: false,
                message: "Please provide either a crop image or a text prompt."
            });
        }
        // ... (rest of the route logic remains same, but I need to make sure I don't delete it or I copy it back)
        // Only replacing the wrapper and top part of route
        // Debug logging
        // logger.info("Advisory Request Body:", req.body);
        fs.appendFileSync('debug.log', `[${new Date().toISOString()}] processing request. hasFile: ${!!file}, Soil: ${!!soilData}\n`);

        if (file) {
            logger.info(`Processing image: ${file.originalname}, Cloudinary URL: ${file.path}`);
        } else {
            logger.info("No image provided, using text-only/soil analysis.");
        }

        let parsedSoilData = null;
        if (soilData) {
            try {
                parsedSoilData = typeof soilData === 'string' ? JSON.parse(soilData) : soilData;
            } catch (e) {
                logger.warn("Failed to parse soilData:", e.message);
            }
        }

        const result = await aiAdvisoryService.analyzeCrop({
            imageUrl: file ? file.path : null, // Cloudinary URL
            prompt: prompt,
            location: (lat && lng) ? { lat, lng } : null,
            soilData: parsedSoilData,
            analysisMode: analysisMode || "crop"
        });

        // Cleanup: Optionally delete file after analysis if not storing permanently
        // (For now, we keep it or rely on cron cleanup, or delete immediately)
        // if (file) fs.unlinkSync(file.path); 

        fs.appendFileSync('debug.log', `[Route] Service returned. Sending response...\n`);

        // Safety check: Ensure result is serializable
        try {
            JSON.stringify(result);
        } catch (e) {
            fs.appendFileSync('debug.log', `[Route] Result is not serializable: ${e.message}\n`);
            throw new Error("Analysis result is not valid JSON.");
        }

        res.status(200).json({
            success: true,
            data: result
        });
        fs.appendFileSync('debug.log', `[Route] Response sent successfully.\n`);

    } catch (error) {
        logger.error("Advisory Analysis Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "AI Analysis failed. Please try again."
        });
    }
});

/**
 * @route   POST /api/v1/advisory/questions
 * @desc    Create a new crop advisory question
 * @access  Private (Authenticated users)
 */
router.post("/questions", protect, uploadMiddleware, async (req, res) => {
    try {
        console.log("=== Question Creation Started ===");
        console.log("Request body keys:", Object.keys(req.body));
        console.log("File present:", !!req.file);
        if (req.file) {
            console.log("File details:", {
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                path: req.file.path
            });
        }

        const { title, description, category, subcategory, cropType, tags, urgency, location } = req.body;

        // Validate required fields
        if (!title || !description || !category) {
            return res.status(400).json({
                success: false,
                message: "Title, description, and category are required"
            });
        }

        // Handle attachments
        let attachments = [];
        if (req.file) {
            console.log("Processing attachment:", req.file.originalname, req.file.mimetype);
            if (isCloudinaryConfigured) {
                // Cloudinary storage - file.path contains URL
                attachments = [{
                    url: req.file.path, // Cloudinary URL
                    filename: req.file.originalname,
                    type: req.file.mimetype.startsWith('image/') ? 'image' : 'video',
                    size: req.file.size || 0
                }];
            } else {
                // Memory storage - create a data URL or just store file info
                const base64 = req.file.buffer.toString('base64');
                const dataUrl = `data:${req.file.mimetype};base64,${base64}`;
                attachments = [{
                    url: dataUrl,
                    filename: req.file.originalname,
                    type: req.file.mimetype.startsWith('image/') ? 'image' : 'video',
                    size: req.file.size || 0
                }];
            }
            console.log("Attachment created:", attachments[0]);
        } else {
            console.log("No file received in request");
        }

        // Parse tags if it's a string
        let parsedTags = [];
        if (tags) {
            try {
                parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
            } catch (e) {
                parsedTags = [];
            }
        }

        // Parse location if it's a string
        let parsedLocation = null;
        if (location) {
            try {
                parsedLocation = typeof location === 'string' ? JSON.parse(location) : location;
            } catch (e) {
                parsedLocation = null;
            }
        }

        // Create new question
        const questionData = {
            title,
            description,
            category,
            subcategory,
            cropType,
            tags: parsedTags,
            urgency: urgency || "medium",
            location: parsedLocation,
            attachments,
            author: req.user._id
        };

        const question = await Question.create(questionData);

        console.log("Question created with attachments:", question.attachments);
        console.log("Full question data:", JSON.stringify(question, null, 2));

        // Populate author info
        await question.populate('author', 'name email avatar');

        res.status(201).json({
            success: true,
            data: question,
            message: "Question posted successfully"
        });
    } catch (error) {
        logger.error("Create Question Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to create question"
        });
    }
});

/**
 * @route   POST /api/v1/advisory/questions/:id/answers
 * @desc    Create a new answer for a question
 * @access  Private (Authenticated users)
 */
router.post("/questions/:id/answers", protect, uploadMiddleware, async (req, res) => {
    try {
        console.log("=== Answer Creation Started ===");
        console.log("Request body keys:", Object.keys(req.body));
        console.log("Request body content:", req.body.content);
        console.log("Request file:", req.file);

        const { id } = req.params;
        const { content } = req.body;

        // Validate required fields
        if (!content || content.trim().length === 0) {
            console.log("Validation failed - content missing or empty");
            return res.status(400).json({
                success: false,
                message: "Answer content is required"
            });
        }

        // Check if question exists
        const question = await Question.findById(id);
        if (!question || question.isDeleted) {
            return res.status(404).json({
                success: false,
                message: "Question not found"
            });
        }

        // Create new answer
        const answerData = {
            content,
            question: id,
            author: req.user._id
        };

        const answer = await Answer.create(answerData);

        // Populate author info
        await answer.populate('author', 'name email avatar');

        // Update question's answer count
        question.answerCount = (question.answerCount || 0) + 1;
        await question.save();

        res.status(201).json({
            success: true,
            data: answer,
            message: "Answer posted successfully"
        });
    } catch (error) {
        logger.error("Create Answer Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to create answer"
        });
    }
});

/**
 * @route   POST /api/v1/advisory/answers/:id/accept
 * @desc    Accept an answer as the solution
 * @access  Private (Question author or admin)
 */
router.post("/answers/:id/accept", protect, async (req, res) => {
    try {
        const { id } = req.params;

        // Find the answer
        const answer = await Answer.findById(id).populate('question');
        if (!answer) {
            return res.status(404).json({
                success: false,
                message: "Answer not found"
            });
        }

        // Check if user is the question author or admin
        const question = answer.question;
        const isAuthor = question.author.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isAuthor && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Only the question author can accept answers"
            });
        }

        // Update answer to be accepted
        answer.isAccepted = true;
        await answer.save();

        // Update question status to resolved
        question.status = 'resolved';
        await question.save();

        res.status(200).json({
            success: true,
            data: answer,
            message: "Answer accepted successfully"
        });
    } catch (error) {
        logger.error("Accept Answer Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to accept answer"
        });
    }
});

/**
 * @route   POST /api/v1/advisory/answers/:id/vote
 * @desc    Mark an answer as helpful or remove helpful vote
 * @access  Private (Authenticated users)
 */
router.post("/answers/:id/vote", protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { voteType } = req.body;

        if (!["helpful", "not_helpful"].includes(voteType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid vote type"
            });
        }

        const answer = await Answer.findById(id);
        if (!answer || answer.isDeleted) {
            return res.status(404).json({
                success: false,
                message: "Answer not found"
            });
        }

        const userId = req.user._id.toString();
        const alreadyHelpful = answer.helpfulBy.some((u) => u.toString() === userId);

        if (voteType === "helpful") {
            if (!alreadyHelpful) {
                answer.helpfulBy.push(req.user._id);
                answer.helpfulCount = (answer.helpfulCount || 0) + 1;
            }
        } else {
            if (alreadyHelpful) {
                answer.helpfulBy.pull(req.user._id);
                answer.helpfulCount = Math.max(0, (answer.helpfulCount || 0) - 1);
            }
        }

        await answer.save();

        const isHelpful = answer.helpfulBy.some((u) => u.toString() === userId);

        res.status(200).json({
            success: true,
            isHelpful,
            helpfulCount: answer.helpfulCount
        });
    } catch (error) {
        logger.error("Vote Answer Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to vote"
        });
    }
});

/**
 * @route   GET /api/v1/advisory/stats
 * @desc    Get advisory statistics
 * @access  Public
 */
router.get("/stats", async (req, res) => {
    try {
        // Get overall statistics
        const totalQuestions = await Question.countDocuments({ isDeleted: false });
        const openQuestions = await Question.countDocuments({
            isDeleted: false,
            status: { $in: ['open', 'answered'] }
        });
        const resolvedQuestions = await Question.countDocuments({
            isDeleted: false,
            status: 'resolved'
        });

        // Calculate resolution rate
        const resolutionRate = totalQuestions > 0
            ? Math.round((resolvedQuestions / totalQuestions) * 100)
            : 0;

        // Get category counts
        const categoryStats = await Question.aggregate([
            { $match: { isDeleted: false } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Get status counts
        const statusStats = await Question.aggregate([
            { $match: { isDeleted: false } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Get urgency counts
        const urgencyStats = await Question.aggregate([
            { $match: { isDeleted: false } },
            { $group: { _id: '$urgency', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Get crop type counts
        const cropTypeStats = await Question.aggregate([
            { $match: { isDeleted: false, cropType: { $exists: true, $ne: null } } },
            { $group: { _id: '$cropType', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        res.status(200).json({
            success: true,
            data: {
                questions: {
                    total: totalQuestions,
                    open: openQuestions,
                    resolved: resolvedQuestions,
                    resolutionRate
                },
                categories: categoryStats.map(stat => ({
                    id: stat._id,
                    count: stat.count
                })),
                statuses: statusStats.map(stat => ({
                    id: stat._id,
                    count: stat.count
                })),
                urgencies: urgencyStats.map(stat => ({
                    id: stat._id,
                    count: stat.count
                })),
                cropTypes: cropTypeStats.map(stat => ({
                    id: stat._id,
                    count: stat.count
                }))
            }
        });
    } catch (error) {
        logger.error("Get Stats Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch statistics"
        });
    }
});

/**
 * @route   POST /api/v1/advisory/answers/:id/need-more-guidance
 * @desc    Request more guidance for an answer
 * @access  Private (Question author)
 */
router.post("/answers/:id/need-more-guidance", protect, async (req, res) => {
    try {
        const { id } = req.params;

        // Find answer and populate question
        const answer = await Answer.findById(id).populate('question');
        if (!answer) {
            return res.status(404).json({
                success: false,
                message: "Answer not found"
            });
        }

        // Check if user is the question author (not answer author)
        const question = answer.question;
        const isQuestionAuthor = question.author.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isQuestionAuthor && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Only the question author can request more guidance"
            });
        }

        // Update answer to indicate more guidance is needed
        answer.needsMoreGuidance = true;
        answer.isAccepted = false; // Unaccept current answer if it was accepted
        await answer.save();

        // Update question status back to open if it was resolved
        if (question.status === 'resolved') {
            question.status = 'open';
            await question.save();
        }

        res.status(200).json({
            success: true,
            data: answer,
            message: "Request for more guidance sent successfully"
        });
    } catch (error) {
        logger.error("Need More Guidance Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to request more guidance"
        });
    }
});

/**
 * @route   GET /api/v1/advisory/answers/expert/:expertId
 * @desc    Get all answers by a specific expert
 * @access  Private (Expert or admin)
 */
router.get("/answers/expert/:expertId", protect, async (req, res) => {
    try {
        const { expertId } = req.params;
        const { page = 1, limit = 20 } = req.query;

        // Check if user is requesting their own answers or is admin
        const isOwnAnswers = req.user._id.toString() === expertId;
        const isAdmin = req.user.role === 'admin';

        if (!isOwnAnswers && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "You can only view your own answers"
            });
        }

        // Get expert's best answers (accepted or highly helpful)
        const answers = await Answer.find({
            author: expertId,
            isDeleted: false,
        })
            .populate('question', 'title category viewCount')
            .populate('author', 'name avatar expertProfile')
            .sort({ isAccepted: -1, helpfulCount: -1, createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Answer.countDocuments({
            author: expertId,
            isDeleted: false,
        });

        res.status(200).json({
            success: true,
            data: answers,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
                hasNext: page * limit < total,
            }
        });
    } catch (error) {
        logger.error("Get Expert Answers Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch expert answers"
        });
    }
});

/**
 * @route   GET /api/v1/advisory/answers/my
 * @desc    Get all answers posted by the currently authenticated user
 * @access  Private (Authenticated)
 */
router.get("/answers/my", protect, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const userId = req.user._id;

        const answers = await Answer.find({
            author: userId,
            isDeleted: false,
        })
            .populate('question', 'title category viewCount status')
            .populate('author', 'name avatar expertProfile')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Answer.countDocuments({
            author: userId,
            isDeleted: false,
        });

        res.status(200).json({
            success: true,
            data: answers,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / limit),
                hasNext: page * limit < total,
            }
        });
    } catch (error) {
        logger.error("Get My Answers Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch your answers"
        });
    }
});

/**
 * @route   GET /api/v1/advisory/questions/trending
 * @desc    Get trending questions
 * @access  Public
 */
router.get("/questions/trending", async (req, res) => {
    try {
        const { limit = 5, days = 7 } = req.query;

        const questions = await Question.getTrending(Number(limit), Number(days))
            .populate('author', 'name email avatar');

        res.status(200).json({
            success: true,
            data: questions
        });
    } catch (error) {
        logger.error("Get Trending Questions Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch trending questions"
        });
    }
});

/**
 * @route   GET /api/v1/advisory/questions/:id
 * @desc    Get question by ID
 * @access  Public
 */
router.get("/questions/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const question = await Question.findById(id)
            .populate('author', 'name email avatar')
            .populate('assignedExpert', 'name email avatar')
            .populate({
                path: 'answers',
                populate: {
                    path: 'author',
                    select: 'name email avatar'
                }
            });

        if (!question || question.isDeleted) {
            return res.status(404).json({
                success: false,
                message: "Question not found"
            });
        }

        // Increment view count
        question.viewCount = (question.viewCount || 0) + 1;
        await question.save();

        res.status(200).json({
            success: true,
            data: question
        });
    } catch (error) {
        logger.error("Get Question Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch question"
        });
    }
});

/**
 * @route   GET /api/v1/advisory/questions
 * @desc    Get all questions with pagination and filters
 * @access  Public
 */
router.get("/questions", async (req, res) => {
    try {
        const { page = 1, limit = 10, category, status, search, cropType } = req.query;

        // Build filter query
        const filter = { isDeleted: false };

        if (category) filter.category = category;
        if (status) filter.status = status;
        if (cropType) filter.cropType = cropType;
        if (search) {
            filter.$text = { $search: search };
        }

        const skip = (page - 1) * limit;

        // Get questions
        const questions = await Question.find(filter)
            .populate('author', 'name email avatar')
            .populate('assignedExpert', 'name email avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        // Get total count for pagination
        const total = await Question.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: questions,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                currentPage: Number(page),
                limit: Number(limit)
            }
        });
    } catch (error) {
        logger.error("Get Questions Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch questions"
        });
    }
});

module.exports = router;
