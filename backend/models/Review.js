/**
 * Review Model
 * Stores product and user reviews
 *
 * @module models/Review
 */

const mongoose = require("mongoose")
const Schema = mongoose.Schema

const ReviewSchema = new Schema(
  {
    // Review type
    type: {
      type: String,
      enum: ["product", "seller", "expert"],
      required: true,
    },

    // Who wrote the review
    reviewer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Who/what is being reviewed
    reviewee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      index: true,
    },

    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
    },

    // Rating (1-5)
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    // Review content
    title: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },

    // Detailed ratings
    detailedRatings: {
      quality: { type: Number, min: 1, max: 5 },
      communication: { type: Number, min: 1, max: 5 },
      delivery: { type: Number, min: 1, max: 5 },
      value: { type: Number, min: 1, max: 5 },
    },

    // Images
    images: [
      {
        url: String,
        caption: String,
      },
    ],

    // Helpful votes
    helpfulVotes: {
      count: { type: Number, default: 0 },
      users: [{ type: Schema.Types.ObjectId, ref: "User" }],
    },

    // Seller response
    response: {
      content: String,
      respondedAt: Date,
    },

    // Status
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "flagged"],
      default: "pending",
    },

    // Verification
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes
ReviewSchema.index({ reviewee: 1, status: 1, createdAt: -1 })
ReviewSchema.index({ product: 1, status: 1, rating: -1 })
ReviewSchema.index({ reviewer: 1, createdAt: -1 })

// Prevent duplicate reviews
ReviewSchema.index(
  { reviewer: 1, product: 1 },
  { unique: true, partialFilterExpression: { product: { $exists: true } } },
)
ReviewSchema.index(
  { reviewer: 1, reviewee: 1, order: 1 },
  { unique: true, partialFilterExpression: { reviewee: { $exists: true } } },
)

// Update user/product ratings after review
ReviewSchema.post("save", async function () {
  if (this.status !== "approved") return

  const Review = this.constructor

  if (this.reviewee) {
    const stats = await Review.aggregate([
      { $match: { reviewee: this.reviewee, status: "approved" } },
      {
        $group: {
          _id: null,
          average: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ])

    if (stats.length > 0) {
      await mongoose.model("User").findByIdAndUpdate(this.reviewee, {
        "ratings.average": Math.round(stats[0].average * 10) / 10,
        "ratings.count": stats[0].count,
      })
    }
  }

  if (this.product) {
    const stats = await Review.aggregate([
      { $match: { product: this.product, status: "approved" } },
      {
        $group: {
          _id: null,
          average: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ])

    if (stats.length > 0) {
      await mongoose.model("Product").findByIdAndUpdate(this.product, {
        "ratings.average": Math.round(stats[0].average * 10) / 10,
        "ratings.count": stats[0].count,
      })
    }
  }
})

module.exports = mongoose.model("Review", ReviewSchema)
