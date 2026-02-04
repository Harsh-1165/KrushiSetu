/**
 * Answer Model
 * Expert answers to crop advisory questions
 */

const mongoose = require("mongoose")

const answerSchema = new mongoose.Schema(
  {
    // Reference to question
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
      index: true,
    },

    // Author (Expert)
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Answer content
    content: {
      type: String,
      required: [true, "Answer content is required"],
      trim: true,
      minlength: [50, "Answer must be at least 50 characters"],
      maxlength: [10000, "Answer cannot exceed 10000 characters"],
    },

    // Structured recommendations
    recommendations: [
      {
        type: {
          type: String,
          enum: ["immediate_action", "short_term", "long_term", "preventive", "treatment", "resource"],
        },
        description: {
          type: String,
          maxlength: 500,
        },
        priority: {
          type: String,
          enum: ["low", "medium", "high"],
          default: "medium",
        },
        estimatedCost: String,
        timeframe: String,
      },
    ],

    // Attachments (images, diagrams)
    attachments: [
      {
        type: {
          type: String,
          enum: ["image", "video", "document"],
        },
        url: String,
        filename: String,
        size: Number,
      },
    ],

    // Acceptance status
    isAccepted: {
      type: Boolean,
      default: false,
      index: true,
    },
    acceptedAt: Date,

    // Helpful votes
    helpfulCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    helpfulBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Verification (admin verified)
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    verifiedAt: Date,

    // Edit tracking
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,
    editHistory: [
      {
        content: String,
        editedAt: Date,
      },
    ],

    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Indexes
answerSchema.index({ question: 1, author: 1 }, { unique: true }) // One answer per expert per question
answerSchema.index({ author: 1, createdAt: -1 })
answerSchema.index({ helpfulCount: -1 })
answerSchema.index({ isAccepted: 1, createdAt: -1 })

// Virtual for helpfulness percentage
answerSchema.virtual("helpfulnessScore").get(function () {
  if (this.helpfulBy.length === 0) return 0
  return Math.round((this.helpfulCount / this.helpfulBy.length) * 100)
})

// Pre-save: Store edit history
answerSchema.pre("save", function (next) {
  if (this.isModified("content") && !this.isNew) {
    this.editHistory.push({
      content: this._original?.content || this.content,
      editedAt: new Date(),
    })
    this.isEdited = true
    this.editedAt = new Date()
  }
  next()
})

// Post-save: Update expert rating
answerSchema.post("save", async function () {
  if (this.isAccepted) {
    const User = mongoose.model("User")
    const expert = await User.findById(this.author)

    if (expert && expert.role === "expert") {
      // Calculate new rating based on accepted answers ratio
      const totalAnswers = expert.expertProfile.totalAnswers || 0
      const acceptedAnswers = (expert.expertProfile.acceptedAnswers || 0) + 1

      // Simple rating calculation: base 3.0 + bonus for acceptance rate
      const acceptanceRate = totalAnswers > 0 ? acceptedAnswers / totalAnswers : 0
      const newRating = Math.min(5, 3.0 + acceptanceRate * 2)

      await User.findByIdAndUpdate(this.author, {
        "expertProfile.rating": newRating.toFixed(1),
      })
    }
  }
})

// Static: Get top answers for a question
answerSchema.statics.getTopAnswers = function (questionId, limit = 5) {
  return this.find({
    question: questionId,
    isDeleted: false,
  })
    .sort({ isAccepted: -1, helpfulCount: -1, createdAt: 1 })
    .limit(limit)
    .populate("author", "name avatar expertProfile")
}

// Static: Get expert's best answers
answerSchema.statics.getExpertBestAnswers = function (expertId, limit = 10) {
  return this.find({
    author: expertId,
    isDeleted: false,
    $or: [{ isAccepted: true }, { helpfulCount: { $gte: 5 } }],
  })
    .sort({ isAccepted: -1, helpfulCount: -1 })
    .limit(limit)
    .populate("question", "title category")
}

const Answer = mongoose.model("Answer", answerSchema)

module.exports = Answer
