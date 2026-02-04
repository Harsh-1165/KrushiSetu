/**
 * Question Model
 * Crop advisory questions from farmers and consumers
 */

const mongoose = require("mongoose")

const questionSchema = new mongoose.Schema(
  {
    // Question content
    title: {
      type: String,
      required: [true, "Question title is required"],
      trim: true,
      minlength: [10, "Title must be at least 10 characters"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Question description is required"],
      trim: true,
      minlength: [20, "Description must be at least 20 characters"],
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },

    // Categorization
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "crop_diseases",
        "irrigation",
        "soil_health",
        "crop_selection",
        "pest_control",
        "harvesting",
        "organic_farming",
        "equipment",
        "weather",
        "market_advice",
      ],
      index: true,
    },
    subcategory: {
      type: String,
      trim: true,
    },
    cropType: {
      type: String,
      trim: true,
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    // Urgency level
    urgency: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
      index: true,
    },

    // Status
    status: {
      type: String,
      enum: ["open", "answered", "resolved", "closed"],
      default: "open",
      index: true,
    },

    // Author
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Assigned expert
    assignedExpert: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    // Attachments (images, videos)
    attachments: [
      {
        type: {
          type: String,
          enum: ["image", "video"],
        },
        url: String,
        filename: String,
        size: Number,
      },
    ],

    // Location
    location: {
      state: String,
      district: String,
      coordinates: {
        type: {
          type: String,
          enum: ["Point"],
        },
        coordinates: [Number], // [longitude, latitude]
      },
    },

    // Engagement metrics
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    answerCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Resolution
    resolvedAt: Date,

    // Edit tracking
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,

    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: Date,
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Indexes
questionSchema.index({ title: "text", description: "text", tags: "text" })
questionSchema.index({ "location.coordinates": "2dsphere" })
questionSchema.index({ category: 1, status: 1 })
questionSchema.index({ author: 1, createdAt: -1 })
questionSchema.index({ urgency: 1, createdAt: -1 })
questionSchema.index({ createdAt: -1 })

// Virtual for answers
questionSchema.virtual("answers", {
  ref: "Answer",
  localField: "_id",
  foreignField: "question",
})

// Virtual for time since posted
questionSchema.virtual("timeSincePosted").get(function () {
  const now = new Date()
  const diff = now - this.createdAt
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`
  return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
})

// Pre-save middleware
questionSchema.pre("save", function (next) {
  // Auto-close old unanswered questions
  if (this.status === "open" && this.answerCount === 0) {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    if (this.createdAt < thirtyDaysAgo) {
      this.status = "closed"
    }
  }
  next()
})

// Static: Find questions by location
questionSchema.statics.findNearby = function (coordinates, maxDistance = 50000) {
  return this.find({
    "location.coordinates": {
      $near: {
        $geometry: {
          type: "Point",
          coordinates,
        },
        $maxDistance: maxDistance,
      },
    },
    isDeleted: false,
  })
}

// Static: Get trending questions
questionSchema.statics.getTrending = function (limit = 10, days = 7) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  return this.find({
    createdAt: { $gte: startDate },
    isDeleted: false,
  })
    .sort({ viewCount: -1, answerCount: -1 })
    .limit(limit)
}

const Question = mongoose.model("Question", questionSchema)

module.exports = Question
