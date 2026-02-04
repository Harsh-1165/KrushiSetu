/**
 * Token Model
 * Stores refresh tokens for session management
 */

const mongoose = require("mongoose")

const tokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ["refresh", "email_verification", "password_reset", "api_key"],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    userAgent: String,
    ipAddress: String,
  },
  {
    timestamps: true,
  },
)

// Compound index for efficient queries
tokenSchema.index({ userId: 1, type: 1, isRevoked: 1 })
tokenSchema.index({ token: 1, isRevoked: 1 })

// TTL index to automatically delete expired tokens
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// Static method to clean up expired tokens
tokenSchema.statics.cleanupExpired = function () {
  return this.deleteMany({ expiresAt: { $lt: new Date() } })
}

// Static method to revoke all tokens for a user
tokenSchema.statics.revokeAllForUser = function (userId) {
  return this.updateMany({ userId, isRevoked: false }, { isRevoked: true })
}

const Token = mongoose.model("Token", tokenSchema)

module.exports = Token
