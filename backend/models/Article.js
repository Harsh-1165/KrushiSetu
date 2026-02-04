/**
 * Article Model for Knowledge Base
 * Stores educational content, guides, and farming tips
 */

const mongoose = require("mongoose")
const slugify = require("slugify")

const articleSchema = new mongoose.Schema(
  {
    // Basic Info
    title: {
      type: String,
      required: [true, "Article title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    excerpt: {
      type: String,
      required: [true, "Article excerpt is required"],
      maxlength: [500, "Excerpt cannot exceed 500 characters"],
    },
    content: {
      type: String,
      required: [true, "Article content is required"],
    },

    // Media
    coverImage: {
      url: String,
      alt: String,
      caption: String,
    },
    images: [
      {
        url: String,
        alt: String,
        caption: String,
      },
    ],

    // Categorization
    category: {
      name: {
        type: String,
        required: true,
        enum: [
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
        ],
      },
      subcategory: String,
    },
    tags: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],

    // Author
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Publishing
    status: {
      type: String,
      enum: ["draft", "review", "published", "archived"],
      default: "draft",
      index: true,
    },
    publishedAt: Date,

    // Reading
    readTime: {
      type: Number, // in minutes
      default: 5,
    },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },

    // Engagement
    views: {
      type: Number,
      default: 0,
    },
    stats: {
      likes: { type: Number, default: 0 },
      bookmarks: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
    },

    // SEO
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
    },

    // Related
    relatedArticles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Article",
      },
    ],

    // Versioning
    version: {
      type: Number,
      default: 1,
    },
    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Translations
    language: {
      type: String,
      default: "en",
      enum: ["en", "hi", "mr", "gu", "pa", "ta", "te", "kn", "bn"],
    },
    translations: [
      {
        language: String,
        title: String,
        excerpt: String,
        content: String,
      },
    ],

    // Feature flags
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Indexes
articleSchema.index({ title: "text", content: "text", excerpt: "text", tags: "text" })
articleSchema.index({ status: 1, publishedAt: -1 })
articleSchema.index({ "category.name": 1, status: 1 })
articleSchema.index({ author: 1, status: 1 })
articleSchema.index({ tags: 1 })
articleSchema.index({ views: -1 })
articleSchema.index({ isFeatured: 1, publishedAt: -1 })

// Generate slug before saving
articleSchema.pre("save", function (next) {
  if (this.isModified("title") || !this.slug) {
    this.slug = slugify(this.title, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    })
    // Add unique suffix if needed
    this.slug = `${this.slug}-${Date.now().toString(36)}`
  }

  // Calculate read time (average 200 words per minute)
  if (this.isModified("content")) {
    const wordCount = this.content.split(/\s+/).length
    this.readTime = Math.ceil(wordCount / 200)
  }

  // Set publishedAt when status changes to published
  if (this.isModified("status") && this.status === "published" && !this.publishedAt) {
    this.publishedAt = new Date()
  }

  next()
})

// Virtual for comments
articleSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "article",
})

// Methods
articleSchema.methods.incrementViews = async function () {
  this.views += 1
  await this.save()
}

articleSchema.methods.like = async function (userId) {
  // This would typically involve a separate ArticleLike model
  this.stats.likes += 1
  await this.save()
}

// Statics
articleSchema.statics.getFeatured = function (limit = 5) {
  return this.find({ status: "published", isFeatured: true })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .populate("author", "name avatar")
}

articleSchema.statics.getByCategory = function (category, options = {}) {
  const { page = 1, limit = 10 } = options
  return this.find({
    status: "published",
    "category.name": category,
  })
    .sort({ publishedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("author", "name avatar")
}

articleSchema.statics.getRelated = async function (articleId, limit = 5) {
  const article = await this.findById(articleId)
  if (!article) return []

  return this.find({
    _id: { $ne: articleId },
    status: "published",
    $or: [{ "category.name": article.category.name }, { tags: { $in: article.tags } }],
  })
    .sort({ views: -1 })
    .limit(limit)
    .select("title slug excerpt coverImage readTime")
}

module.exports = mongoose.model("Article", articleSchema)
