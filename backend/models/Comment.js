/**
 * Comment Model
 * Comments on answers in the advisory system
 */

const mongoose = require("mongoose")

const commentSchema = new mongoose.Schema(
  {
    // Reference to answer
    answer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Answer",
      required: true,
      index: true,
    },

    // Reference to question (for easier querying)
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
      index: true,
    },

    // Author of the comment
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Comment content
    content: {
      type: String,
      required: [true, "Comment content is required"],
      trim: true,
      minlength: [5, "Comment must be at least 5 characters"],
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },

    // Parent comment for replies
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },

    // Likes/upvotes
    likeCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    likedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Reply count (for parent comments)
    replyCount: {
      type: Number,
      default: 0,
      min: 0,
    },

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
commentSchema.index({ answer: 1, createdAt: -1 })
commentSchema.index({ parentComment: 1 })
commentSchema.index({ author: 1, createdAt: -1 })

// Virtual for replies
commentSchema.virtual("replies", {
  ref: "Comment",
  localField: "_id",
  foreignField: "parentComment",
})

// Pre-save middleware
commentSchema.pre("save", function (next) {
  if (this.isModified("content") && !this.isNew) {
    this.isEdited = true
    this.editedAt = new Date()
  }
  next()
})

// Post-save: Update parent comment reply count
commentSchema.post("save", async function () {
  if (this.parentComment && this.isNew) {
    await mongoose.model("Comment").findByIdAndUpdate(this.parentComment, {
      $inc: { replyCount: 1 },
    })
  }
})

// Static: Get comments for an answer
commentSchema.statics.getAnswerComments = function (answerId, limit = 50) {
  return this.find({
    answer: answerId,
    parentComment: null,
    isDeleted: false,
  })
    .sort({ likeCount: -1, createdAt: -1 })
    .limit(limit)
    .populate("author", "name avatar role")
    .populate({
      path: "replies",
      match: { isDeleted: false },
      options: { sort: { createdAt: 1 }, limit: 5 },
      populate: { path: "author", select: "name avatar role" },
    })
    .lean()
}

// Static: Get reply count for a comment
commentSchema.statics.getReplies = function (commentId, limit = 20) {
  return this.find({
    parentComment: commentId,
    isDeleted: false,
  })
    .sort({ createdAt: 1 })
    .limit(limit)
    .populate("author", "name avatar role")
    .lean()
}

const Comment = mongoose.model("Comment", commentSchema)

module.exports = Comment
