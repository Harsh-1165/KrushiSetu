/**
 * Notification Model
 * Stores user notifications
 *
 * @module models/Notification
 */

const mongoose = require("mongoose")
const Schema = mongoose.Schema

const NotificationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: [
        "order",
        "payment",
        "delivery",
        "review",
        "question",
        "answer",
        "price_alert",
        "system",
        "promotion",
        "verification",
        "message",
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    // Reference to related entity
    reference: {
      model: {
        type: String,
        enum: ["Order", "Product", "Question", "Answer", "User", "Article"],
      },
      id: Schema.Types.ObjectId,
    },

    // Action URL
    actionUrl: String,

    // Priority
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },

    // Status
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: Date,

    // Delivery channels
    channels: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: false },
      push: { type: Boolean, default: false },
      sms: { type: Boolean, default: false },
    },

    // Delivery status
    deliveryStatus: {
      email: { sent: Boolean, sentAt: Date, error: String },
      push: { sent: Boolean, sentAt: Date, error: String },
      sms: { sent: Boolean, sentAt: Date, error: String },
    },

    // Expiry
    expiresAt: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes
NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 })
NotificationSchema.index({ user: 1, type: 1, createdAt: -1 })
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// TTL - auto delete after 90 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 })

module.exports = mongoose.model("Notification", NotificationSchema)
