/**
 * Crop Advisory System API Routes
 * Complete Q&A system connecting farmers with agricultural experts
 *
 * @module routes/advisory
 * @requires express
 * @requires mongoose
 */

const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")
const multer = require("multer")
const path = require("path")
const fs = require("fs").promises

const Question = require("../models/Question")
const Answer = require("../models/Answer")
const Comment = require("../models/Comment")
const User = require("../models/User")
const Notification = require("../models/Notification")
const { asyncHandler } = require("../utils/asyncHandler")
const AppError = require("../utils/AppError")
const { authenticate, optionalAuth, authorize } = require("../middleware/auth")
const { apiLimiter } = require("../middleware/rateLimiter")

// ============================================================================
// MULTER CONFIGURATION FOR QUESTION ATTACHMENTS
// ============================================================================

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads/advisory")
    try {
      await fs.mkdir(uploadDir, { recursive: true })
      cb(null, uploadDir)
    } catch (error) {
      cb(error, null)
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `advisory-${uniqueSuffix}${ext}`)
  },
})

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime"]
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new AppError("Only JPEG, PNG, WebP images and MP4/MOV videos are allowed", 400), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max (for videos)
    files: 5, // Max 5 attachments
  },
})

// ============================================================================
// ADVISORY CATEGORIES
// ============================================================================

const ADVISORY_CATEGORIES = {
  crop_diseases: {
    name: "Crop Diseases",
    subcategories: ["fungal", "bacterial", "viral", "pest_damage", "nutrient_deficiency"],
    icon: "bug",
  },
  irrigation: {
    name: "Irrigation & Water Management",
    subcategories: ["drip_irrigation", "sprinkler", "flood_irrigation", "water_scheduling", "drought_management"],
    icon: "droplet",
  },
  soil_health: {
    name: "Soil Health",
    subcategories: ["soil_testing", "fertilization", "organic_matter", "ph_management", "erosion_control"],
    icon: "layers",
  },
  crop_selection: {
    name: "Crop Selection",
    subcategories: ["seasonal_crops", "intercropping", "crop_rotation", "variety_selection", "climate_adaptation"],
    icon: "sprout",
  },
  pest_control: {
    name: "Pest Control",
    subcategories: ["insects", "rodents", "birds", "organic_methods", "integrated_pest_management"],
    icon: "shield",
  },
  harvesting: {
    name: "Harvesting & Post-Harvest",
    subcategories: ["harvest_timing", "storage", "processing", "quality_control", "packaging"],
    icon: "package",
  },
  organic_farming: {
    name: "Organic Farming",
    subcategories: ["certification", "composting", "natural_pesticides", "biofertilizers", "organic_seeds"],
    icon: "leaf",
  },
  equipment: {
    name: "Farm Equipment",
    subcategories: ["tractors", "harvesters", "sprayers", "maintenance", "modern_tech"],
    icon: "cog",
  },
  weather: {
    name: "Weather & Climate",
    subcategories: ["monsoon", "frost_protection", "heat_stress", "seasonal_planning", "climate_change"],
    icon: "cloud",
  },
  market_advice: {
    name: "Market & Selling",
    subcategories: ["pricing", "mandi_selection", "contract_farming", "export", "value_addition"],
    icon: "trending-up",
  },
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build filter query for questions
 * @param {Object} query - Express request query
 * @returns {Object} MongoDB filter object
 */
const buildQuestionFilter = (query) => {
  const filter = { isDeleted: false }

  // Category filter
  if (query.category && ADVISORY_CATEGORIES[query.category]) {
    filter.category = query.category
  }

  // Subcategory filter
  if (query.subcategory) {
    filter.subcategory = query.subcategory
  }

  // Status filter
  if (query.status) {
    const validStatuses = ["open", "answered", "resolved", "closed"]
    if (validStatuses.includes(query.status)) {
      filter.status = query.status
    }
  }

  // Urgency filter
  if (query.urgency) {
    const validUrgency = ["low", "medium", "high", "critical"]
    if (validUrgency.includes(query.urgency)) {
      filter.urgency = query.urgency
    }
  }

  // Crop type filter
  if (query.cropType) {
    filter.cropType = { $regex: query.cropType, $options: "i" }
  }

  // User's questions
  if (query.userId) {
    if (mongoose.Types.ObjectId.isValid(query.userId)) {
      filter.author = new mongoose.Types.ObjectId(query.userId)
    }
  }

  // Assigned expert filter
  if (query.expertId) {
    if (mongoose.Types.ObjectId.isValid(query.expertId)) {
      filter.assignedExpert = new mongoose.Types.ObjectId(query.expertId)
    }
  }

  // Has answers filter
  if (query.hasAnswers === "true") {
    filter.answerCount = { $gt: 0 }
  } else if (query.hasAnswers === "false") {
    filter.answerCount = 0
  }

  // Date range filter
  if (query.startDate || query.endDate) {
    filter.createdAt = {}
    if (query.startDate) {
      filter.createdAt.$gte = new Date(query.startDate)
    }
    if (query.endDate) {
      filter.createdAt.$lte = new Date(query.endDate)
    }
  }

  return filter
}

/**
 * Send notification to user
 * @param {Object} params - Notification parameters
 */
const sendNotification = async ({ userId, type, title, message, data }) => {
  try {
    await Notification.create({
      user: userId,
      type,
      title,
      message,
      data,
      channels: ["in_app", "push"],
    })
  } catch (error) {
    console.error("Failed to send notification:", error)
  }
}

// ============================================================================
// QUESTION ROUTES
// ============================================================================

/**
 * @route   POST /api/advisory/questions
 * @desc    Create a new advisory question
 * @access  Private (Farmer, Consumer)
 *
 * @body {
 *   title: string (required, 10-200 chars),
 *   description: string (required, 20-5000 chars),
 *   category: string (required, from ADVISORY_CATEGORIES),
 *   subcategory: string (optional),
 *   cropType: string (optional),
 *   urgency: string (optional, default: medium),
 *   location: { state, district, coordinates },
 *   tags: string[] (optional)
 * }
 *
 * @response 201 {
 *   success: true,
 *   message: "Question posted successfully",
 *   data: { question }
 * }
 */
router.post(
  "/questions",
  authenticate,
  authorize("farmer", "consumer", "expert"),
  upload.array("attachments", 5),
  asyncHandler(async (req, res) => {
    const { title, description, category, subcategory, cropType, urgency, location, tags } = req.body

    // Validate category
    if (!ADVISORY_CATEGORIES[category]) {
      throw new AppError("Invalid category", 400)
    }

    // Validate subcategory if provided
    if (subcategory && !ADVISORY_CATEGORIES[category].subcategories.includes(subcategory)) {
      throw new AppError("Invalid subcategory for the selected category", 400)
    }

    // Process uploaded attachments
    const attachments = req.files
      ? req.files.map((file) => ({
        type: file.mimetype.startsWith("image/") ? "image" : "video",
        url: `/uploads/advisory/${file.filename}`,
        filename: file.originalname,
        size: file.size,
      }))
      : []

    // Parse location if provided as string
    let parsedLocation = location
    if (typeof location === "string") {
      try {
        parsedLocation = JSON.parse(location)
      } catch (e) {
        parsedLocation = null
      }
    }

    // Parse tags if provided as string
    let parsedTags = tags
    if (typeof tags === "string") {
      try {
        parsedTags = JSON.parse(tags)
      } catch (e) {
        parsedTags = tags.split(",").map((t) => t.trim())
      }
    }

    // Create question
    const question = await Question.create({
      title,
      description,
      category,
      subcategory,
      cropType,
      urgency: urgency || "medium",
      author: req.user._id,
      attachments,
      location: parsedLocation,
      tags: parsedTags || [],
    })

    // Populate author info
    await question.populate("author", "name avatar role farmerProfile.farmLocation")

    // Find and notify relevant experts based on category
    const relevantExperts = await User.find({
      role: "expert",
      isActive: true,
      "expertProfile.specializations": { $in: [category] },
      "expertProfile.isAvailable": true,
    })
      .limit(10)
      .select("_id")

    // Send notifications to relevant experts
    for (const expert of relevantExperts) {
      await sendNotification({
        userId: expert._id,
        type: "new_question",
        title: "New Question in Your Expertise Area",
        message: `A new ${ADVISORY_CATEGORIES[category].name} question has been posted: "${title.substring(0, 50)}..."`,
        data: {
          questionId: question._id,
          category,
        },
      })
    }

    res.status(201).json({
      success: true,
      message: "Question posted successfully",
      data: { question },
    })
  }),
)

/**
 * @route   GET /api/advisory/questions
 * @desc    Get all questions with filters and pagination
 * @access  Public (optional auth for personalization)
 *
 * @query {
 *   page: number (default: 1),
 *   limit: number (default: 20, max: 100),
 *   sort: string (default: -createdAt),
 *   category: string,
 *   subcategory: string,
 *   status: string (open|answered|resolved|closed),
 *   urgency: string (low|medium|high|critical),
 *   cropType: string,
 *   search: string,
 *   hasAnswers: boolean,
 *   trending: boolean
 * }
 *
 * @response 200 {
 *   success: true,
 *   data: {
 *     questions: [],
 *     pagination: { page, limit, total, pages, hasNext, hasPrev }
 *   }
 * }
 */
router.get(
  "/questions",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1)
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20))
    const skip = (page - 1) * limit

    // Build filter
    const filter = buildQuestionFilter(req.query)

    // Search filter
    if (req.query.search) {
      filter.$text = { $search: req.query.search }
    }

    // Build sort
    let sort = {}
    if (req.query.trending === "true") {
      // Trending: combination of views, answers, and recency
      sort = { viewCount: -1, answerCount: -1, createdAt: -1 }
    } else if (req.query.sort) {
      const sortField = req.query.sort.startsWith("-") ? req.query.sort.substring(1) : req.query.sort
      const sortOrder = req.query.sort.startsWith("-") ? -1 : 1
      const allowedSorts = ["createdAt", "viewCount", "answerCount", "urgency"]
      if (allowedSorts.includes(sortField)) {
        sort[sortField] = sortOrder
      }
    } else {
      sort = { createdAt: -1 }
    }

    // Execute query with pagination
    const [questions, total] = await Promise.all([
      Question.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate("author", "name avatar role farmerProfile.farmLocation")
        .populate("assignedExpert", "name avatar expertProfile.specializations expertProfile.experience")
        .lean(),
      Question.countDocuments(filter),
    ])

    const pages = Math.ceil(total / limit)

    res.json({
      success: true,
      data: {
        questions,
        pagination: {
          page,
          limit,
          total,
          pages,
          hasNext: page < pages,
          hasPrev: page > 1,
        },
      },
    })
  }),
)

/**
 * @route   GET /api/advisory/questions/trending
 * @desc    Get trending questions
 * @access  Public
 */
router.get(
  "/questions/trending",
  asyncHandler(async (req, res) => {
    const limit = Math.min(20, Math.max(1, Number.parseInt(req.query.limit, 10) || 10))

    // Get questions from last 7 days with high engagement
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const questions = await Question.find({
      isDeleted: false,
      createdAt: { $gte: sevenDaysAgo },
    })
      .sort({ viewCount: -1, answerCount: -1 })
      .limit(limit)
      .populate("author", "name avatar")
      .lean()

    res.json({
      success: true,
      data: { questions },
    })
  }),
)

/**
 * @route   GET /api/advisory/questions/my
 * @desc    Get current user's questions
 * @access  Private
 */
router.get(
  "/questions/my",
  authenticate,
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1)
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20))
    const skip = (page - 1) * limit

    const filter = {
      author: req.user._id,
      isDeleted: false,
    }

    if (req.query.status) {
      filter.status = req.query.status
    }

    const [questions, total] = await Promise.all([
      Question.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("assignedExpert", "name avatar")
        .lean(),
      Question.countDocuments(filter),
    ])

    res.json({
      success: true,
      data: {
        questions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })
  }),
)

/**
 * @route   GET /api/advisory/questions/assigned
 * @desc    Get questions assigned to current expert
 * @access  Private (Expert only)
 */
router.get(
  "/questions/assigned",
  authenticate,
  authorize("expert"),
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1)
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20))
    const skip = (page - 1) * limit

    const filter = {
      assignedExpert: req.user._id,
      isDeleted: false,
    }

    if (req.query.status) {
      filter.status = req.query.status
    }

    const [questions, total] = await Promise.all([
      Question.find(filter)
        .sort({ urgency: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "name avatar")
        .lean(),
      Question.countDocuments(filter),
    ])

    res.json({
      success: true,
      data: {
        questions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })
  }),
)

/**
 * @route   GET /api/advisory/questions/:id
 * @desc    Get single question with details
 * @access  Public
 */
router.get(
  "/questions/:id",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid question ID", 400)
    }

    const question = await Question.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $inc: { viewCount: 1 } },
      { new: true },
    )
      .populate("author", "name avatar role farmerProfile.farmLocation farmerProfile.crops")
      .populate(
        "assignedExpert",
        "name avatar expertProfile.specializations expertProfile.experience expertProfile.qualifications",
      )
      .populate({
        path: "answers",
        match: { isDeleted: false },
        options: { sort: { isAccepted: -1, helpfulCount: -1, createdAt: -1 } },
        populate: {
          path: "author",
          select: "name avatar role expertProfile.specializations expertProfile.experience",
        },
      })

    if (!question) {
      throw new AppError("Question not found", 404)
    }

    // Get related questions
    const relatedQuestions = await Question.find({
      _id: { $ne: question._id },
      category: question.category,
      isDeleted: false,
    })
      .sort({ viewCount: -1 })
      .limit(5)
      .select("title category answerCount viewCount createdAt")
      .lean()

    res.json({
      success: true,
      data: {
        question,
        relatedQuestions,
      },
    })
  }),
)

/**
 * @route   PUT /api/advisory/questions/:id
 * @desc    Update a question
 * @access  Private (Author only)
 */
router.put(
  "/questions/:id",
  authenticate,
  upload.array("attachments", 5),
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const { title, description, category, subcategory, cropType, urgency, tags, removeAttachments } = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid question ID", 400)
    }

    const question = await Question.findOne({ _id: id, isDeleted: false })

    if (!question) {
      throw new AppError("Question not found", 404)
    }

    // Check ownership (only author can edit)
    if (question.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      throw new AppError("Not authorized to edit this question", 403)
    }

    // Cannot edit if resolved or has accepted answer
    if (question.status === "resolved") {
      throw new AppError("Cannot edit a resolved question", 400)
    }

    // Build update object
    const updates = {}

    if (title) updates.title = title
    if (description) updates.description = description
    if (cropType) updates.cropType = cropType
    if (urgency) updates.urgency = urgency
    if (tags) {
      updates.tags = typeof tags === "string" ? tags.split(",").map((t) => t.trim()) : tags
    }

    // Validate and update category
    if (category) {
      if (!ADVISORY_CATEGORIES[category]) {
        throw new AppError("Invalid category", 400)
      }
      updates.category = category

      if (subcategory) {
        if (!ADVISORY_CATEGORIES[category].subcategories.includes(subcategory)) {
          throw new AppError("Invalid subcategory for the selected category", 400)
        }
        updates.subcategory = subcategory
      }
    }

    // Handle attachment removal
    if (removeAttachments) {
      const toRemove = typeof removeAttachments === "string" ? JSON.parse(removeAttachments) : removeAttachments
      updates.attachments = question.attachments.filter((att) => !toRemove.includes(att.url))

      // Delete files from disk
      for (const url of toRemove) {
        const filePath = path.join(__dirname, "..", url)
        try {
          await fs.unlink(filePath)
        } catch (e) {
          console.error("Failed to delete attachment:", e)
        }
      }
    }

    // Handle new attachments
    if (req.files && req.files.length > 0) {
      const newAttachments = req.files.map((file) => ({
        type: file.mimetype.startsWith("image/") ? "image" : "video",
        url: `/uploads/advisory/${file.filename}`,
        filename: file.originalname,
        size: file.size,
      }))

      updates.attachments = [...(updates.attachments || question.attachments), ...newAttachments]
    }

    updates.isEdited = true
    updates.editedAt = new Date()

    const updatedQuestion = await Question.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true },
    ).populate("author", "name avatar")

    res.json({
      success: true,
      message: "Question updated successfully",
      data: { question: updatedQuestion },
    })
  }),
)

/**
 * @route   DELETE /api/advisory/questions/:id
 * @desc    Delete a question (soft delete)
 * @access  Private (Author or Admin)
 */
router.delete(
  "/questions/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid question ID", 400)
    }

    const question = await Question.findOne({ _id: id, isDeleted: false })

    if (!question) {
      throw new AppError("Question not found", 404)
    }

    // Check ownership
    if (question.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      throw new AppError("Not authorized to delete this question", 403)
    }

    // Soft delete
    question.isDeleted = true
    question.deletedAt = new Date()
    question.deletedBy = req.user._id
    await question.save()

    // Also soft delete all answers
    await Answer.updateMany({ question: id }, { $set: { isDeleted: true, deletedAt: new Date() } })

    res.json({
      success: true,
      message: "Question deleted successfully",
    })
  }),
)

// ============================================================================
// ANSWER ROUTES
// ============================================================================

/**
 * @route   POST /api/advisory/questions/:id/answers
 * @desc    Post an answer to a question (Expert only)
 * @access  Private (Expert)
 *
 * @body {
 *   content: string (required, 50-10000 chars),
 *   recommendations: [{ type, description, priority }],
 *   attachments: files (optional)
 * }
 */
router.post(
  "/questions/:id/answers",
  authenticate,
  authorize("expert", "admin"),
  upload.array("attachments", 3),
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const { content, recommendations } = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid question ID", 400)
    }

    const question = await Question.findOne({ _id: id, isDeleted: false })

    if (!question) {
      throw new AppError("Question not found", 404)
    }

    if (question.status === "closed") {
      throw new AppError("This question is closed and no longer accepting answers", 400)
    }

    // Check if expert already answered
    const existingAnswer = await Answer.findOne({
      question: id,
      author: req.user._id,
      isDeleted: false,
    })

    if (existingAnswer) {
      throw new AppError("You have already answered this question", 400)
    }

    // Process attachments
    const attachments = req.files
      ? req.files.map((file) => ({
        type: file.mimetype.startsWith("image/") ? "image" : "video",
        url: `/uploads/advisory/${file.filename}`,
        filename: file.originalname,
        size: file.size,
      }))
      : []

    // Parse recommendations if provided as string
    let parsedRecommendations = recommendations
    if (typeof recommendations === "string") {
      try {
        parsedRecommendations = JSON.parse(recommendations)
      } catch (e) {
        parsedRecommendations = []
      }
    }

    // Create answer
    const answer = await Answer.create({
      question: id,
      author: req.user._id,
      content,
      recommendations: parsedRecommendations || [],
      attachments,
    })

    // Update question
    question.answerCount += 1
    if (question.status === "open") {
      question.status = "answered"
    }
    if (!question.assignedExpert) {
      question.assignedExpert = req.user._id
    }
    await question.save()

    // Populate answer
    await answer.populate("author", "name avatar expertProfile.specializations expertProfile.experience")

    // Notify question author
    await sendNotification({
      userId: question.author,
      type: "answer_received",
      title: "New Answer to Your Question",
      message: `An expert has answered your question: "${question.title.substring(0, 50)}..."`,
      data: {
        questionId: question._id,
        answerId: answer._id,
      },
    })

    // Update expert's answer count
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { "expertProfile.totalAnswers": 1 },
    })

    res.status(201).json({
      success: true,
      message: "Answer posted successfully",
      data: { answer },
    })
  }),
)

/**
 * @route   GET /api/advisory/questions/:id/answers
 * @desc    Get all answers for a question
 * @access  Public
 */
router.get(
  "/questions/:id/answers",
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1)
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20))
    const skip = (page - 1) * limit

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid question ID", 400)
    }

    const [answers, total] = await Promise.all([
      Answer.find({ question: id, isDeleted: false })
        .sort({ isAccepted: -1, helpfulCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate(
          "author",
          "name avatar role expertProfile.specializations expertProfile.experience expertProfile.rating",
        )
        .lean(),
      Answer.countDocuments({ question: id, isDeleted: false }),
    ])

    res.json({
      success: true,
      data: {
        answers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })
  }),
)

/**
 * @route   PUT /api/advisory/answers/:id
 * @desc    Update an answer (Expert only)
 * @access  Private (Author only)
 */
router.put(
  "/answers/:id",
  authenticate,
  authorize("expert", "admin"),
  upload.array("attachments", 3),
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const { content, recommendations, removeAttachments } = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid answer ID", 400)
    }

    const answer = await Answer.findOne({ _id: id, isDeleted: false })

    if (!answer) {
      throw new AppError("Answer not found", 404)
    }

    // Check ownership
    if (answer.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      throw new AppError("Not authorized to edit this answer", 403)
    }

    // Build updates
    const updates = {}

    if (content) updates.content = content
    if (recommendations) {
      updates.recommendations = typeof recommendations === "string" ? JSON.parse(recommendations) : recommendations
    }

    // Handle attachment removal
    if (removeAttachments) {
      const toRemove = typeof removeAttachments === "string" ? JSON.parse(removeAttachments) : removeAttachments
      updates.attachments = answer.attachments.filter((att) => !toRemove.includes(att.url))
    }

    // Handle new attachments
    if (req.files && req.files.length > 0) {
      const newAttachments = req.files.map((file) => ({
        type: file.mimetype.startsWith("image/") ? "image" : "video",
        url: `/uploads/advisory/${file.filename}`,
        filename: file.originalname,
        size: file.size,
      }))

      updates.attachments = [...(updates.attachments || answer.attachments), ...newAttachments]
    }

    updates.isEdited = true
    updates.editedAt = new Date()

    const updatedAnswer = await Answer.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true },
    ).populate("author", "name avatar expertProfile")

    res.json({
      success: true,
      message: "Answer updated successfully",
      data: { answer: updatedAnswer },
    })
  }),
)

/**
 * @route   DELETE /api/advisory/answers/:id
 * @desc    Delete an answer (soft delete)
 * @access  Private (Author or Admin)
 */
router.delete(
  "/answers/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid answer ID", 400)
    }

    const answer = await Answer.findOne({ _id: id, isDeleted: false })

    if (!answer) {
      throw new AppError("Answer not found", 404)
    }

    // Check ownership
    if (answer.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      throw new AppError("Not authorized to delete this answer", 403)
    }

    // Soft delete
    answer.isDeleted = true
    answer.deletedAt = new Date()
    await answer.save()

    // Update question answer count
    await Question.findByIdAndUpdate(answer.question, {
      $inc: { answerCount: -1 },
    })

    // Update expert's answer count
    await User.findByIdAndUpdate(answer.author, {
      $inc: { "expertProfile.totalAnswers": -1 },
    })

    res.json({
      success: true,
      message: "Answer deleted successfully",
    })
  }),
)

/**
 * @route   POST /api/advisory/answers/:id/helpful
 * @desc    Mark an answer as helpful (toggle)
 * @access  Private
 */
router.post(
  "/answers/:id/helpful",
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid answer ID", 400)
    }

    const answer = await Answer.findOne({ _id: id, isDeleted: false })

    if (!answer) {
      throw new AppError("Answer not found", 404)
    }

    // Cannot mark own answer as helpful
    if (answer.author.toString() === req.user._id.toString()) {
      throw new AppError("Cannot mark your own answer as helpful", 400)
    }

    const helpfulIndex = answer.helpfulBy.findIndex((userId) => userId.toString() === req.user._id.toString())

    if (helpfulIndex > -1) {
      // Remove helpful
      answer.helpfulBy.splice(helpfulIndex, 1)
      answer.helpfulCount = Math.max(0, answer.helpfulCount - 1)
    } else {
      // Add helpful
      answer.helpfulBy.push(req.user._id)
      answer.helpfulCount += 1
    }

    await answer.save()

    res.json({
      success: true,
      message: helpfulIndex > -1 ? "Removed helpful mark" : "Marked as helpful",
      data: {
        helpfulCount: answer.helpfulCount,
        isHelpful: helpfulIndex === -1,
      },
    })
  }),
)

/**
 * @route   POST /api/advisory/answers/:id/accept
 * @desc    Accept an answer (Question author only)
 * @access  Private (Question author)
 */
router.post(
  "/answers/:id/accept",
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid answer ID", 400)
    }

    const answer = await Answer.findOne({ _id: id, isDeleted: false }).populate("question")

    if (!answer) {
      throw new AppError("Answer not found", 404)
    }

    const question = await Question.findById(answer.question)

    if (!question) {
      throw new AppError("Question not found", 404)
    }

    // Only question author can accept
    if (question.author.toString() !== req.user._id.toString()) {
      throw new AppError("Only the question author can accept an answer", 403)
    }

    // Unaccept previous accepted answer if exists
    await Answer.updateMany({ question: question._id, isAccepted: true }, { $set: { isAccepted: false } })

    // Accept this answer
    answer.isAccepted = true
    answer.acceptedAt = new Date()
    await answer.save()

    // Update question status
    question.status = "resolved"
    question.resolvedAt = new Date()
    await question.save()

    // Notify the expert
    await sendNotification({
      userId: answer.author,
      type: "answer_accepted",
      title: "Your Answer Was Accepted!",
      message: `Your answer to "${question.title.substring(0, 50)}..." was accepted as the best answer.`,
      data: {
        questionId: question._id,
        answerId: answer._id,
      },
    })

    // Update expert's accepted answer count
    await User.findByIdAndUpdate(answer.author, {
      $inc: { "expertProfile.acceptedAnswers": 1 },
    })

    res.json({
      success: true,
      message: "Answer accepted successfully",
      data: { answer },
    })
  }),
)

// ============================================================================
// EXPERT ROUTES
// ============================================================================

/**
 * @route   GET /api/advisory/experts
 * @desc    Find experts by specialization
 * @access  Public
 */
router.get(
  "/experts",
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1)
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20))
    const skip = (page - 1) * limit

    const filter = {
      role: "expert",
      isActive: true,
      "expertProfile.isVerified": true,
    }

    // Specialization filter
    if (req.query.specialization) {
      filter["expertProfile.specializations"] = req.query.specialization
    }

    // Experience filter
    if (req.query.minExperience) {
      filter["expertProfile.experience"] = { $gte: Number.parseInt(req.query.minExperience, 10) }
    }

    // Availability filter
    if (req.query.available === "true") {
      filter["expertProfile.isAvailable"] = true
    }

    // Rating filter
    if (req.query.minRating) {
      filter["expertProfile.rating"] = { $gte: Number.parseFloat(req.query.minRating) }
    }

    // Build sort
    let sort = {}
    switch (req.query.sort) {
      case "rating":
        sort = { "expertProfile.rating": -1 }
        break
      case "experience":
        sort = { "expertProfile.experience": -1 }
        break
      case "answers":
        sort = { "expertProfile.totalAnswers": -1 }
        break
      default:
        sort = { "expertProfile.rating": -1, "expertProfile.totalAnswers": -1 }
    }

    const [experts, total] = await Promise.all([
      User.find(filter).sort(sort).skip(skip).limit(limit).select("name avatar expertProfile createdAt").lean(),
      User.countDocuments(filter),
    ])

    res.json({
      success: true,
      data: {
        experts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })
  }),
)

/**
 * @route   GET /api/advisory/experts/:id
 * @desc    Get expert profile with stats
 * @access  Public
 */
router.get(
  "/experts/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid expert ID", 400)
    }

    const expert = await User.findOne({
      _id: id,
      role: "expert",
      isActive: true,
    }).select("name avatar expertProfile createdAt")

    if (!expert) {
      throw new AppError("Expert not found", 404)
    }

    // Get recent answers
    const recentAnswers = await Answer.find({
      author: id,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("question", "title category status")
      .select("content helpfulCount isAccepted createdAt")
      .lean()

    // Get answer stats by category
    const categoryStats = await Answer.aggregate([
      {
        $match: {
          author: new mongoose.Types.ObjectId(id),
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: "questions",
          localField: "question",
          foreignField: "_id",
          as: "questionData",
        },
      },
      { $unwind: "$questionData" },
      {
        $group: {
          _id: "$questionData.category",
          count: { $sum: 1 },
          accepted: { $sum: { $cond: ["$isAccepted", 1, 0] } },
        },
      },
      { $sort: { count: -1 } },
    ])

    res.json({
      success: true,
      data: {
        expert,
        recentAnswers,
        categoryStats,
      },
    })
  }),
)

/**
 * @route   POST /api/advisory/questions/:id/assign
 * @desc    Assign expert to a question (Admin only)
 * @access  Private (Admin)
 */
router.post(
  "/questions/:id/assign",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const { expertId } = req.body

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(expertId)) {
      throw new AppError("Invalid ID", 400)
    }

    const [question, expert] = await Promise.all([
      Question.findOne({ _id: id, isDeleted: false }),
      User.findOne({ _id: expertId, role: "expert", isActive: true }),
    ])

    if (!question) {
      throw new AppError("Question not found", 404)
    }

    if (!expert) {
      throw new AppError("Expert not found", 404)
    }

    question.assignedExpert = expertId
    await question.save()

    // Notify expert
    await sendNotification({
      userId: expertId,
      type: "question_assigned",
      title: "New Question Assigned",
      message: `You have been assigned to answer: "${question.title.substring(0, 50)}..."`,
      data: {
        questionId: question._id,
      },
    })

    res.json({
      success: true,
      message: "Expert assigned successfully",
      data: { question },
    })
  }),
)

// ============================================================================
// CATEGORY ROUTES
// ============================================================================

/**
 * @route   GET /api/advisory/categories
 * @desc    Get all question categories with counts
 * @access  Public
 */
router.get(
  "/categories",
  asyncHandler(async (req, res) => {
    // Get question counts per category
    const categoryCounts = await Question.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          openCount: { $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] } },
        },
      },
    ])

    const countMap = {}
    categoryCounts.forEach((c) => {
      countMap[c._id] = { total: c.count, open: c.openCount }
    })

    // Build category response
    const categories = Object.entries(ADVISORY_CATEGORIES).map(([key, value]) => ({
      id: key,
      name: value.name,
      subcategories: value.subcategories,
      icon: value.icon,
      questionCount: countMap[key]?.total || 0,
      openQuestionCount: countMap[key]?.open || 0,
    }))

    // Sort by question count
    categories.sort((a, b) => b.questionCount - a.questionCount)

    res.json({
      success: true,
      data: { categories },
    })
  }),
)

/**
 * @route   GET /api/advisory/stats
 * @desc    Get advisory system statistics
 * @access  Public
 */
router.get(
  "/stats",
  asyncHandler(async (req, res) => {
    const [questionStats, answerStats, expertCount] = await Promise.all([
      Question.aggregate([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            open: { $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] } },
            answered: { $sum: { $cond: [{ $eq: ["$status", "answered"] }, 1, 0] } },
            resolved: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } },
            totalViews: { $sum: "$viewCount" },
          },
        },
      ]),
      Answer.aggregate([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            accepted: { $sum: { $cond: ["$isAccepted", 1, 0] } },
            totalHelpful: { $sum: "$helpfulCount" },
          },
        },
      ]),
      User.countDocuments({ role: "expert", isActive: true, "expertProfile.isVerified": true }),
    ])

    const qStats = questionStats[0] || { total: 0, open: 0, answered: 0, resolved: 0, totalViews: 0 }
    const aStats = answerStats[0] || { total: 0, accepted: 0, totalHelpful: 0 }

    res.json({
      success: true,
      data: {
        questions: {
          total: qStats.total,
          open: qStats.open,
          answered: qStats.answered,
          resolved: qStats.resolved,
          totalViews: qStats.totalViews,
          resolutionRate: qStats.total > 0 ? ((qStats.resolved / qStats.total) * 100).toFixed(1) : 0,
        },
        answers: {
          total: aStats.total,
          accepted: aStats.accepted,
          totalHelpful: aStats.totalHelpful,
          acceptanceRate: aStats.total > 0 ? ((aStats.accepted / aStats.total) * 100).toFixed(1) : 0,
        },
        experts: {
          total: expertCount,
        },
      },
    })
  }),
)

// ============================================================================
// COMMENT ROUTES
// ============================================================================

/**
 * @route   POST /api/advisory/answers/:id/comments
 * @desc    Add a comment to an answer
 * @access  Private
 */
router.post(
  "/answers/:id/comments",
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const { content, parentCommentId } = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid answer ID", 400)
    }

    const answer = await Answer.findOne({ _id: id, isDeleted: false })

    if (!answer) {
      throw new AppError("Answer not found", 404)
    }

    // Validate parent comment if provided
    let parentComment = null
    if (parentCommentId) {
      if (!mongoose.Types.ObjectId.isValid(parentCommentId)) {
        throw new AppError("Invalid parent comment ID", 400)
      }
      parentComment = await Comment.findOne({
        _id: parentCommentId,
        answer: id,
        isDeleted: false,
      })
      if (!parentComment) {
        throw new AppError("Parent comment not found", 404)
      }
    }

    // Create comment
    const comment = await Comment.create({
      answer: id,
      question: answer.question,
      author: req.user._id,
      content,
      parentComment: parentCommentId || null,
    })

    // Populate author info
    await comment.populate("author", "name avatar role")

    // Update parent comment reply count if this is a reply
    if (parentCommentId) {
      await Comment.findByIdAndUpdate(parentCommentId, {
        $inc: { replyCount: 1 },
      })
    }

    // Notify answer author if commenter is different
    if (answer.author.toString() !== req.user._id.toString()) {
      const question = await Question.findById(answer.question)
      await sendNotification({
        userId: answer.author,
        type: "comment_on_answer",
        title: "New Comment on Your Answer",
        message: `Someone commented on your answer to "${question?.title?.substring(0, 50) || "a question"}..."`,
        data: {
          questionId: answer.question,
          answerId: id,
          commentId: comment._id,
        },
      })
    }

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: { comment },
    })
  }),
)

/**
 * @route   GET /api/advisory/answers/:id/comments
 * @desc    Get all comments for an answer
 * @access  Public
 */
router.get(
  "/answers/:id/comments",
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1)
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 50))
    const skip = (page - 1) * limit

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid answer ID", 400)
    }

    const [comments, total] = await Promise.all([
      Comment.find({
        answer: id,
        parentComment: null,
        isDeleted: false,
      })
        .sort({ likeCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "name avatar role")
        .populate({
          path: "replies",
          match: { isDeleted: false },
          options: { sort: { createdAt: 1 }, limit: 5 },
          populate: { path: "author", select: "name avatar role" },
        })
        .lean(),
      Comment.countDocuments({
        answer: id,
        parentComment: null,
        isDeleted: false,
      }),
    ])

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })
  }),
)

/**
 * @route   GET /api/advisory/comments/:id/replies
 * @desc    Get replies for a comment
 * @access  Public
 */
router.get(
  "/comments/:id/replies",
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1)
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20))
    const skip = (page - 1) * limit

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid comment ID", 400)
    }

    const [replies, total] = await Promise.all([
      Comment.find({
        parentComment: id,
        isDeleted: false,
      })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "name avatar role")
        .lean(),
      Comment.countDocuments({
        parentComment: id,
        isDeleted: false,
      }),
    ])

    res.json({
      success: true,
      data: {
        replies,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })
  }),
)

/**
 * @route   PUT /api/advisory/comments/:id
 * @desc    Update a comment
 * @access  Private (Author only)
 */
router.put(
  "/comments/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const { content } = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid comment ID", 400)
    }

    const comment = await Comment.findOne({ _id: id, isDeleted: false })

    if (!comment) {
      throw new AppError("Comment not found", 404)
    }

    // Check ownership
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      throw new AppError("Not authorized to edit this comment", 403)
    }

    comment.content = content
    comment.isEdited = true
    comment.editedAt = new Date()
    await comment.save()

    await comment.populate("author", "name avatar role")

    res.json({
      success: true,
      message: "Comment updated successfully",
      data: { comment },
    })
  }),
)

/**
 * @route   DELETE /api/advisory/comments/:id
 * @desc    Delete a comment (soft delete)
 * @access  Private (Author or Admin)
 */
router.delete(
  "/comments/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid comment ID", 400)
    }

    const comment = await Comment.findOne({ _id: id, isDeleted: false })

    if (!comment) {
      throw new AppError("Comment not found", 404)
    }

    // Check ownership
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      throw new AppError("Not authorized to delete this comment", 403)
    }

    // Soft delete
    comment.isDeleted = true
    comment.deletedAt = new Date()
    comment.deletedBy = req.user._id
    await comment.save()

    // Update parent comment reply count if this was a reply
    if (comment.parentComment) {
      await Comment.findByIdAndUpdate(comment.parentComment, {
        $inc: { replyCount: -1 },
      })
    }

    res.json({
      success: true,
      message: "Comment deleted successfully",
    })
  }),
)

/**
 * @route   POST /api/advisory/comments/:id/like
 * @desc    Like/unlike a comment (toggle)
 * @access  Private
 */
router.post(
  "/comments/:id/like",
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid comment ID", 400)
    }

    const comment = await Comment.findOne({ _id: id, isDeleted: false })

    if (!comment) {
      throw new AppError("Comment not found", 404)
    }

    // Cannot like own comment
    if (comment.author.toString() === req.user._id.toString()) {
      throw new AppError("Cannot like your own comment", 400)
    }

    const likedIndex = comment.likedBy.findIndex((userId) => userId.toString() === req.user._id.toString())

    if (likedIndex > -1) {
      // Remove like
      comment.likedBy.splice(likedIndex, 1)
      comment.likeCount = Math.max(0, comment.likeCount - 1)
    } else {
      // Add like
      comment.likedBy.push(req.user._id)
      comment.likeCount += 1
    }

    await comment.save()

    res.json({
      success: true,
      message: likedIndex > -1 ? "Removed like" : "Liked comment",
      data: {
        likeCount: comment.likeCount,
        isLiked: likedIndex === -1,
      },
    })
  }),
)

// ============================================================================
// VOTING ROUTES (for questions - upvote/downvote)
// ============================================================================

/**
 * @route   POST /api/advisory/answers/:id/vote
 * @desc    Vote on an answer (helpful/not helpful)
 * @access  Private
 */
router.post(
  "/answers/:id/vote",
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const { voteType } = req.body // 'helpful' or 'not_helpful'

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid answer ID", 400)
    }

    if (!["helpful", "not_helpful"].includes(voteType)) {
      throw new AppError("Invalid vote type. Must be 'helpful' or 'not_helpful'", 400)
    }

    const answer = await Answer.findOne({ _id: id, isDeleted: false })

    if (!answer) {
      throw new AppError("Answer not found", 404)
    }

    // Cannot vote on own answer
    if (answer.author.toString() === req.user._id.toString()) {
      throw new AppError("Cannot vote on your own answer", 400)
    }

    const helpfulIndex = answer.helpfulBy.findIndex((userId) => userId.toString() === req.user._id.toString())

    if (voteType === "helpful") {
      if (helpfulIndex === -1) {
        // Add helpful vote
        answer.helpfulBy.push(req.user._id)
        answer.helpfulCount += 1
      }
    } else {
      if (helpfulIndex > -1) {
        // Remove helpful vote
        answer.helpfulBy.splice(helpfulIndex, 1)
        answer.helpfulCount = Math.max(0, answer.helpfulCount - 1)
      }
    }

    await answer.save()

    res.json({
      success: true,
      message: voteType === "helpful" ? "Marked as helpful" : "Marked as not helpful",
      data: {
        helpfulCount: answer.helpfulCount,
        isHelpful: answer.helpfulBy.some((userId) => userId.toString() === req.user._id.toString()),
      },
    })
  }),
)

// Apply rate limiting
router.use(apiLimiter)

module.exports = router
