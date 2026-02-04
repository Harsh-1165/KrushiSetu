/**
 * PriceAlert Model
 * User price alerts for notifications
 */

const mongoose = require("mongoose")

const priceAlertSchema = new mongoose.Schema(
  {
    // User Reference
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      index: true,
    },

    // Alert Criteria
    crop: {
      type: String,
      required: [true, "Crop name is required"],
      trim: true,
      index: true,
    },
    variety: {
      type: String,
      trim: true,
    },
    mandi: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mandi",
      index: true,
    },
    state: {
      type: String,
      trim: true,
    },

    // Price Condition
    condition: {
      type: String,
      enum: ["above", "below", "equals"],
      required: [true, "Price condition is required"],
    },
    targetPrice: {
      type: Number,
      required: [true, "Target price is required"],
      min: [0, "Target price must be positive"],
    },
    priceType: {
      type: String,
      enum: ["modal", "min", "max"],
      default: "modal",
    },

    // Notification Settings
    notifyVia: {
      type: [String],
      enum: ["email", "sms", "push"],
      default: ["email", "push"],
    },
    frequency: {
      type: String,
      enum: ["once", "daily", "always"],
      default: "once",
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    // Trigger Information
    triggeredAt: {
      type: Date,
      default: null,
    },
    triggeredPrice: {
      type: Number,
      default: null,
    },
    triggerCount: {
      type: Number,
      default: 0,
    },
    lastNotifiedAt: Date,

    // Metadata
    notes: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  },
)

// Compound indexes
priceAlertSchema.index({ user: 1, isActive: 1, expiresAt: 1 })
priceAlertSchema.index({ crop: 1, isActive: 1, expiresAt: 1 })
priceAlertSchema.index({ mandi: 1, crop: 1, isActive: 1 })

// TTL index to auto-delete expired alerts after 7 days
priceAlertSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 })

// Virtual for alert status
priceAlertSchema.virtual("status").get(function () {
  if (!this.isActive) return "inactive"
  if (this.expiresAt < new Date()) return "expired"
  if (this.triggeredAt) return "triggered"
  return "active"
})

// Static method to check and trigger alerts
priceAlertSchema.statics.checkAlerts = async function (priceData) {
  const { crop, variety, mandi, state, modalPrice, minPrice, maxPrice } = priceData

  // Find matching active alerts
  const query = {
    crop: new RegExp(`^${crop}$`, "i"),
    isActive: true,
    expiresAt: { $gt: new Date() },
    $or: [{ triggeredAt: null }, { frequency: { $in: ["daily", "always"] } }],
  }

  if (variety) query.variety = new RegExp(`^${variety}$`, "i")
  if (mandi) query.$or = [...(query.$or || []), { mandi }, { mandi: null }]
  if (state) query.$or = [...(query.$or || []), { state: new RegExp(`^${state}$`, "i") }, { state: null }]

  const alerts = await this.find(query).populate("user", "email phone name")
  const triggeredAlerts = []

  for (const alert of alerts) {
    const price = alert.priceType === "min" ? minPrice : alert.priceType === "max" ? maxPrice : modalPrice

    let shouldTrigger = false

    switch (alert.condition) {
      case "above":
        shouldTrigger = price >= alert.targetPrice
        break
      case "below":
        shouldTrigger = price <= alert.targetPrice
        break
      case "equals":
        shouldTrigger = Math.abs(price - alert.targetPrice) < 1 // Within 1 rupee
        break
    }

    // Check daily frequency - only trigger once per day
    if (shouldTrigger && alert.frequency === "daily" && alert.lastNotifiedAt) {
      const lastNotified = new Date(alert.lastNotifiedAt)
      const today = new Date()
      if (lastNotified.toDateString() === today.toDateString()) {
        shouldTrigger = false
      }
    }

    if (shouldTrigger) {
      alert.triggeredAt = new Date()
      alert.triggeredPrice = price
      alert.triggerCount += 1
      alert.lastNotifiedAt = new Date()

      if (alert.frequency === "once") {
        alert.isActive = false
      }

      await alert.save()
      triggeredAlerts.push(alert)
    }
  }

  return triggeredAlerts
}

// Static method to get user's alert summary
priceAlertSchema.statics.getUserSummary = async function (userId) {
  return this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: {
          $sum: {
            $cond: [{ $and: [{ $eq: ["$isActive", true] }, { $gt: ["$expiresAt", new Date()] }] }, 1, 0],
          },
        },
        triggered: {
          $sum: { $cond: [{ $ne: ["$triggeredAt", null] }, 1, 0] },
        },
        expired: {
          $sum: {
            $cond: [{ $or: [{ $eq: ["$isActive", false] }, { $lte: ["$expiresAt", new Date()] }] }, 1, 0],
          },
        },
      },
    },
  ])
}

module.exports = mongoose.model("PriceAlert", priceAlertSchema)
