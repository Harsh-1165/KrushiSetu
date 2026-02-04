/**
 * Articles/Knowledge Hub API Routes
 * Complete article management system for experts and readers
 *
 * @module routes/articles
 * @requires express
 * @requires mongoose
 */

const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")
const multer = require("multer")
const path = require("path")
const fs = require("fs").promises

const Article = require("../models/Article")
const User = require("../models/User")
const Notification = require("../models/Notification")
const { asyncHandler } = require("../utils/asyncHandler")
const AppError = require("../utils/AppError")
const { authenticate, optionalAuth, authorize } = require("../middleware/auth")
const { apiLimiter } = require("../middleware/rateLimiter")

// ============================================================================
// MULTER CONFIGURATION FOR ARTICLE IMAGES
// ============================================================================

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads/articles")
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
    cb(null, `article-${uniqueSuffix}${ext}`)
  },
})

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new AppError("Only JPEG, PNG, WebP and GIF images are allowed", 400), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 10,
  },
})

// ============================================================================
// ARTICLE CATEGORIES
// ============================================================================

const ARTICLE_CATEGORIES = [
  "Crop Management",
  "Pest Control",
  "Soil Health",
  "Irrigation",
  "Organic Farming",
  "Market Insights",
  "Government Schemes",
  "Technology",
  "Weather Advisory",
  "Success Stories",
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const buildArticleFilter = (query) => {
  const filter = { status: "published", isDeleted: { $ne: true } }

  if (query.category && ARTICLE_CATEGORIES.includes(query.category)) {
    filter["category.name"] = query.category
  }

  if (query.author && mongoose.Types.ObjectId.isValid(query.author)) {
    filter.author = new mongoose.Types.ObjectId(query.author)
  }

  if (query.difficulty) {
    filter.difficulty = query.difficulty
  }

  if (query.tags) {
    const tags = query.tags.split(",").map((t) => t.trim().toLowerCase())
    filter.tags = { $in: tags }
  }

  if (query.featured === "true") {
    filter.isFeatured = true
  }

  if (query.language) {
    filter.language = query.language
  }

  return filter
}

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
// ARTICLE ROUTES
// ============================================================================

/**
 * @route   GET /api/articles
 * @desc    Get all published articles with filters and pagination
 * @access  Public
 */
router.get(
  "/",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12))
    const skip = (page - 1) * limit

    const filter = buildArticleFilter(req.query)

    // Search filter
    if (req.query.search) {
      filter.$text = { $search: req.query.search }
    }

    // Build sort
    let sort = {}
    switch (req.query.sort) {
      case "popular":
        sort = { views: -1, "stats.likes": -1 }
        break
      case "trending":
        sort = { "stats.likes": -1, views: -1, publishedAt: -1 }
        break
      case "oldest":
        sort = { publishedAt: 1 }
        break
      default:
        sort = { isPinned: -1, publishedAt: -1 }
    }

    const [articles, total] = await Promise.all([
      Article.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate("author", "name avatar role expertProfile.specializations expertProfile.verified")
        .select("-content -translations")
        .lean(),
      Article.countDocuments(filter),
    ])

    const pages = Math.ceil(total / limit)

    res.json({
      success: true,
      data: {
        articles,
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
 * @route   GET /api/articles/featured
 * @desc    Get featured articles
 * @access  Public
 */
router.get(
  "/featured",
  asyncHandler(async (req, res) => {
    const limit = Math.min(10, parseInt(req.query.limit, 10) || 5)

    const articles = await Article.find({
      status: "published",
      isFeatured: true,
      isDeleted: { $ne: true },
    })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .populate("author", "name avatar")
      .select("title slug excerpt coverImage category readTime views stats publishedAt")
      .lean()

    res.json({
      success: true,
      data: { articles },
    })
  }),
)

/**
 * @route   GET /api/articles/trending
 * @desc    Get trending articles (most viewed in last 7 days)
 * @access  Public
 */
router.get(
  "/trending",
  asyncHandler(async (req, res) => {
    const limit = Math.min(20, parseInt(req.query.limit, 10) || 10)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const articles = await Article.find({
      status: "published",
      isDeleted: { $ne: true },
      publishedAt: { $gte: sevenDaysAgo },
    })
      .sort({ views: -1, "stats.likes": -1 })
      .limit(limit)
      .populate("author", "name avatar")
      .select("title slug excerpt coverImage category readTime views stats publishedAt")
      .lean()

    res.json({
      success: true,
      data: { articles },
    })
  }),
)

/**
 * @route   GET /api/articles/categories/stats
 * @desc    Get article count per category
 * @access  Public
 */
router.get(
  "/categories/stats",
  asyncHandler(async (req, res) => {
    const stats = await Article.aggregate([
      { $match: { status: "published", isDeleted: { $ne: true } } },
      {
        $group: {
          _id: "$category.name",
          count: { $sum: 1 },
          totalViews: { $sum: "$views" },
        },
      },
      { $sort: { count: -1 } },
    ])

    const categories = ARTICLE_CATEGORIES.map((cat) => {
      const stat = stats.find((s) => s._id === cat) || { count: 0, totalViews: 0 }
      return {
        id: cat.toLowerCase().replace(/\s+/g, "-"),
        name: cat,
        articleCount: stat.count,
        totalViews: stat.totalViews,
      }
    })

    res.json({
      success: true,
      data: { categories },
    })
  }),
)

/**
 * @route   GET /api/articles/category/:category
 * @desc    Get articles by category
 * @access  Public
 */
router.get(
  "/category/:category",
  asyncHandler(async (req, res) => {
    const { category } = req.params
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.min(50, parseInt(req.query.limit, 10) || 12)
    const skip = (page - 1) * limit

    // Convert slug to category name
    const categoryName = ARTICLE_CATEGORIES.find(
      (cat) => cat.toLowerCase().replace(/\s+/g, "-") === category.toLowerCase()
    )

    if (!categoryName) {
      throw new AppError("Category not found", 404)
    }

    const filter = {
      status: "published",
      "category.name": categoryName,
      isDeleted: { $ne: true },
    }

    const [articles, total, featuredArticles] = await Promise.all([
      Article.find(filter)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "name avatar")
        .select("-content")
        .lean(),
      Article.countDocuments(filter),
      Article.find({ ...filter, isFeatured: true })
        .sort({ publishedAt: -1 })
        .limit(3)
        .populate("author", "name avatar")
        .select("title slug excerpt coverImage readTime")
        .lean(),
    ])

    res.json({
      success: true,
      data: {
        articles,
        category: {
          id: category,
          name: categoryName,
          articleCount: total,
          featuredArticles,
        },
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
 * @route   GET /api/articles/my
 * @desc    Get current user's articles (for experts)
 * @access  Private (Expert only)
 */
router.get(
  "/my",
  authenticate,
  authorize("expert", "admin"),
  asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.min(50, parseInt(req.query.limit, 10) || 20)
    const skip = (page - 1) * limit

    const filter = {
      author: req.user._id,
      isDeleted: { $ne: true },
    }

    if (req.query.status) {
      filter.status = req.query.status
    }

    const [articles, total] = await Promise.all([
      Article.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).select("-content").lean(),
      Article.countDocuments(filter),
    ])

    res.json({
      success: true,
      data: {
        articles,
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
 * @route   GET /api/articles/bookmarks
 * @desc    Get user's bookmarked articles
 * @access  Private
 */
router.get(
  "/bookmarks",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("bookmarkedArticles")

    if (!user.bookmarkedArticles || user.bookmarkedArticles.length === 0) {
      return res.json({
        success: true,
        data: { articles: [] },
      })
    }

    const articles = await Article.find({
      _id: { $in: user.bookmarkedArticles },
      status: "published",
    })
      .populate("author", "name avatar")
      .select("-content")
      .lean()

    res.json({
      success: true,
      data: { articles },
    })
  }),
)

/**
 * @route   GET /api/articles/author/:authorId
 * @desc    Get author profile and their articles
 * @access  Public
 */
router.get(
  "/author/:authorId",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { authorId } = req.params

    if (!mongoose.Types.ObjectId.isValid(authorId)) {
      throw new AppError("Invalid author ID", 400)
    }

    const author = await User.findById(authorId).select(
      "name avatar bio role expertProfile followers followersCount"
    )

    if (!author) {
      throw new AppError("Author not found", 404)
    }

    const [articles, stats] = await Promise.all([
      Article.find({
        author: authorId,
        status: "published",
        isDeleted: { $ne: true },
      })
        .sort({ publishedAt: -1 })
        .limit(20)
        .select("-content")
        .lean(),
      Article.aggregate([
        { $match: { author: new mongoose.Types.ObjectId(authorId), status: "published" } },
        {
          $group: {
            _id: null,
            totalArticles: { $sum: 1 },
            totalViews: { $sum: "$views" },
            totalLikes: { $sum: "$stats.likes" },
          },
        },
      ]),
    ])

    const authorStats = stats[0] || { totalArticles: 0, totalViews: 0, totalLikes: 0 }

    // Check if current user is following
    let isFollowing = false
    if (req.user) {
      isFollowing = author.followers?.includes(req.user._id) || false
    }

    res.json({
      success: true,
      data: {
        author: {
          ...author.toObject(),
          isFollowing,
        },
        articles,
        stats: {
          ...authorStats,
          followers: author.followersCount || 0,
        },
      },
    })
  }),
)

/**
 * @route   GET /api/articles/:slug
 * @desc    Get single article by slug
 * @access  Public
 */
router.get(
  "/:slug",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { slug } = req.params

    const article = await Article.findOneAndUpdate(
      { slug, status: "published", isDeleted: { $ne: true } },
      { $inc: { views: 1 } },
      { new: true }
    ).populate("author", "name avatar bio role expertProfile followers followersCount")

    if (!article) {
      throw new AppError("Article not found", 404)
    }

    // Get related articles
    const relatedArticles = await Article.find({
      _id: { $ne: article._id },
      status: "published",
      isDeleted: { $ne: true },
      $or: [{ "category.name": article.category.name }, { tags: { $in: article.tags } }],
    })
      .sort({ views: -1 })
      .limit(5)
      .populate("author", "name avatar")
      .select("title slug excerpt coverImage readTime category publishedAt")
      .lean()

    // Check if user has liked/bookmarked
    let isLiked = false
    let isBookmarked = false
    let isFollowingAuthor = false
    if (req.user) {
      const user = await User.findById(req.user._id).select("likedArticles bookmarkedArticles")
      isLiked = user.likedArticles?.includes(article._id) || false
      isBookmarked = user.bookmarkedArticles?.includes(article._id) || false
      isFollowingAuthor = article.author.followers?.includes(req.user._id) || false
    }

    res.json({
      success: true,
      data: {
        article: {
          ...article.toObject(),
          isLiked,
          isBookmarked,
          author: {
            ...article.author.toObject(),
            isFollowing: isFollowingAuthor,
          },
        },
        relatedArticles,
      },
    })
  }),
)

/**
 * @route   POST /api/articles
 * @desc    Create a new article
 * @access  Private (Expert only)
 */
router.post(
  "/",
  authenticate,
  authorize("expert", "admin"),
  asyncHandler(async (req, res) => {
    const { title, excerpt, content, category, subcategory, tags, coverImage, difficulty, seo, status } = req.body

    // Validate category
    if (!ARTICLE_CATEGORIES.includes(category)) {
      throw new AppError("Invalid category", 400)
    }

    const article = await Article.create({
      title,
      excerpt,
      content,
      category: { name: category, subcategory },
      tags: tags || [],
      coverImage: coverImage ? { url: coverImage } : undefined,
      difficulty: difficulty || "beginner",
      seo,
      status: status || "draft",
      author: req.user._id,
    })

    await article.populate("author", "name avatar")

    // If published, notify followers
    if (status === "published") {
      const author = await User.findById(req.user._id).select("followers name")
      if (author.followers && author.followers.length > 0) {
        for (const followerId of author.followers.slice(0, 100)) {
          await sendNotification({
            userId: followerId,
            type: "new_article",
            title: "New Article Published",
            message: `${author.name.first} ${author.name.last} published a new article: "${title}"`,
            data: { articleId: article._id, slug: article.slug },
          })
        }
      }
    }

    res.status(201).json({
      success: true,
      message: status === "published" ? "Article published successfully" : "Article saved as draft",
      data: { article },
    })
  }),
)

/**
 * @route   PUT /api/articles/:id
 * @desc    Update an article
 * @access  Private (Author only)
 */
router.put(
  "/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const updates = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid article ID", 400)
    }

    const article = await Article.findById(id)

    if (!article) {
      throw new AppError("Article not found", 404)
    }

    // Check ownership
    if (article.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      throw new AppError("Not authorized to edit this article", 403)
    }

    // Validate category if updating
    if (updates.category && !ARTICLE_CATEGORIES.includes(updates.category)) {
      throw new AppError("Invalid category", 400)
    }

    // Build update object
    const allowedUpdates = [
      "title",
      "excerpt",
      "content",
      "category",
      "subcategory",
      "tags",
      "coverImage",
      "difficulty",
      "seo",
      "status",
    ]

    const updateData = {}
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        if (key === "category") {
          updateData["category.name"] = updates.category
        } else if (key === "subcategory") {
          updateData["category.subcategory"] = updates.subcategory
        } else if (key === "coverImage") {
          updateData.coverImage = { url: updates.coverImage }
        } else {
          updateData[key] = updates[key]
        }
      }
    }

    // Check if publishing for the first time
    const wasPublished = article.status === "published"
    const isPublishing = updates.status === "published" && !wasPublished

    if (isPublishing) {
      updateData.publishedAt = new Date()
    }

    updateData.lastEditedBy = req.user._id
    updateData.version = article.version + 1

    const updatedArticle = await Article.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true })
      .populate("author", "name avatar")
      .lean()

    // Notify followers if just published
    if (isPublishing) {
      const author = await User.findById(req.user._id).select("followers name")
      if (author.followers && author.followers.length > 0) {
        for (const followerId of author.followers.slice(0, 100)) {
          await sendNotification({
            userId: followerId,
            type: "new_article",
            title: "New Article Published",
            message: `${author.name.first} ${author.name.last} published a new article: "${updatedArticle.title}"`,
            data: { articleId: updatedArticle._id, slug: updatedArticle.slug },
          })
        }
      }
    }

    res.json({
      success: true,
      message: "Article updated successfully",
      data: { article: updatedArticle },
    })
  }),
)

/**
 * @route   DELETE /api/articles/:id
 * @desc    Delete an article (soft delete)
 * @access  Private (Author only)
 */
router.delete(
  "/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid article ID", 400)
    }

    const article = await Article.findById(id)

    if (!article) {
      throw new AppError("Article not found", 404)
    }

    // Check ownership
    if (article.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      throw new AppError("Not authorized to delete this article", 403)
    }

    article.isDeleted = true
    article.deletedAt = new Date()
    article.deletedBy = req.user._id
    await article.save()

    res.json({
      success: true,
      message: "Article deleted successfully",
    })
  }),
)

/**
 * @route   POST /api/articles/:id/like
 * @desc    Like/unlike an article
 * @access  Private
 */
router.post(
  "/:id/like",
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid article ID", 400)
    }

    const article = await Article.findOne({ _id: id, status: "published" })

    if (!article) {
      throw new AppError("Article not found", 404)
    }

    const user = await User.findById(req.user._id)
    const likedIndex = user.likedArticles?.indexOf(id) ?? -1
    const isLiked = likedIndex > -1

    if (isLiked) {
      // Remove like
      user.likedArticles.splice(likedIndex, 1)
      article.stats.likes = Math.max(0, article.stats.likes - 1)
    } else {
      // Add like
      if (!user.likedArticles) user.likedArticles = []
      user.likedArticles.push(id)
      article.stats.likes += 1
    }

    await Promise.all([user.save(), article.save()])

    res.json({
      success: true,
      message: isLiked ? "Removed like" : "Liked article",
      data: {
        likes: article.stats.likes,
        isLiked: !isLiked,
      },
    })
  }),
)

/**
 * @route   POST /api/articles/:id/bookmark
 * @desc    Bookmark/unbookmark an article
 * @access  Private
 */
router.post(
  "/:id/bookmark",
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid article ID", 400)
    }

    const article = await Article.findOne({ _id: id, status: "published" })

    if (!article) {
      throw new AppError("Article not found", 404)
    }

    const user = await User.findById(req.user._id)
    const bookmarkedIndex = user.bookmarkedArticles?.indexOf(id) ?? -1
    const isBookmarked = bookmarkedIndex > -1

    if (isBookmarked) {
      // Remove bookmark
      user.bookmarkedArticles.splice(bookmarkedIndex, 1)
      article.stats.bookmarks = Math.max(0, article.stats.bookmarks - 1)
    } else {
      // Add bookmark
      if (!user.bookmarkedArticles) user.bookmarkedArticles = []
      user.bookmarkedArticles.push(id)
      article.stats.bookmarks += 1
    }

    await Promise.all([user.save(), article.save()])

    res.json({
      success: true,
      message: isBookmarked ? "Removed bookmark" : "Bookmarked article",
      data: {
        bookmarks: article.stats.bookmarks,
        isBookmarked: !isBookmarked,
      },
    })
  }),
)

/**
 * @route   POST /api/articles/:id/share
 * @desc    Track article share
 * @access  Public
 */
router.post(
  "/:id/share",
  asyncHandler(async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid article ID", 400)
    }

    await Article.findByIdAndUpdate(id, { $inc: { "stats.shares": 1 } })

    res.json({
      success: true,
      message: "Share tracked",
    })
  }),
)

/**
 * @route   GET /api/articles/:id/comments
 * @desc    Get comments for an article
 * @access  Public
 */
router.get(
  "/:id/comments",
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.min(50, parseInt(req.query.limit, 10) || 20)
    const skip = (page - 1) * limit

    // For now, we'll use a simple comment structure embedded or in a separate collection
    // This is a placeholder - in production, use a Comment model
    const article = await Article.findById(id).select("comments")

    if (!article) {
      throw new AppError("Article not found", 404)
    }

    // Simulated comments - in production, query from Comment collection
    const comments = []
    const total = 0

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
 * @route   POST /api/articles/:id/comments
 * @desc    Add a comment to an article
 * @access  Private
 */
router.post(
  "/:id/comments",
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const { content, parentCommentId } = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid article ID", 400)
    }

    const article = await Article.findOne({ _id: id, status: "published" })

    if (!article) {
      throw new AppError("Article not found", 404)
    }

    // In production, create in Comment collection
    // For now, increment comment count
    article.stats.comments += 1
    await article.save()

    // Notify article author
    if (article.author.toString() !== req.user._id.toString()) {
      await sendNotification({
        userId: article.author,
        type: "article_comment",
        title: "New Comment on Your Article",
        message: `Someone commented on your article "${article.title}"`,
        data: { articleId: article._id, slug: article.slug },
      })
    }

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: {
        comment: {
          _id: new mongoose.Types.ObjectId(),
          content,
          author: {
            _id: req.user._id,
            name: req.user.name,
            avatar: req.user.avatar,
          },
          createdAt: new Date(),
        },
      },
    })
  }),
)

/**
 * @route   POST /api/articles/comments/:commentId/like
 * @desc    Like/unlike a comment
 * @access  Private
 */
router.post(
  "/comments/:commentId/like",
  authenticate,
  asyncHandler(async (req, res) => {
    // Placeholder - implement with Comment model
    res.json({
      success: true,
      message: "Comment like toggled",
      data: { likeCount: 1, isLiked: true },
    })
  }),
)

/**
 * @route   POST /api/uploads/article-image
 * @desc    Upload an image for article content
 * @access  Private (Expert only)
 */
router.post(
  "/upload-image",
  authenticate,
  authorize("expert", "admin"),
  upload.single("image"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new AppError("No image uploaded", 400)
    }

    const imageUrl = `/uploads/articles/${req.file.filename}`

    res.json({
      success: true,
      data: {
        url: imageUrl,
        filename: req.file.filename,
      },
    })
  }),
)

// Apply rate limiting
router.use(apiLimiter)

module.exports = router
