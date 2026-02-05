/**
 * User Model
 * MongoDB/Mongoose schema for user accounts
 */

const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Don't include in queries by default
    },
    name: {
      first: {
        type: String,
        required: [true, "First name is required"],
        trim: true,
        minlength: [2, "First name must be at least 2 characters"],
        maxlength: [50, "First name cannot exceed 50 characters"],
      },
      last: {
        type: String,
        required: [true, "Last name is required"],
        trim: true,
        minlength: [2, "Last name must be at least 2 characters"],
        maxlength: [50, "Last name cannot exceed 50 characters"],
      },
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      match: [/^[6-9]\d{9}$/, "Please provide a valid 10-digit Indian mobile number"],
    },
    role: {
      type: String,
      enum: ["farmer", "expert", "consumer", "admin"],
      default: "consumer",
    },
    avatar: {
      url: String,
      publicId: String,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended", "deleted"],
      default: "active",
    },
    permissions: [
      {
        type: String,
        enum: [
          "products:read",
          "products:write",
          "products:delete",
          "orders:read",
          "orders:write",
          "orders:manage",
          "users:read",
          "users:write",
          "users:delete",
          "questions:read",
          "questions:write",
          "questions:answer",
          "articles:read",
          "articles:write",
          "articles:publish",
          "prices:read",
          "prices:write",
          "reviews:read",
          "reviews:write",
          "reviews:moderate",
          "admin:access",
        ],
      },
    ],
    verification: {
      email: {
        verified: { type: Boolean, default: false },
        verifiedAt: Date,
        token: String,
        expiresAt: Date,
      },
      phone: {
        verified: { type: Boolean, default: false },
        verifiedAt: Date,
        otp: String,
        otpExpiresAt: Date,
      },
      kyc: {
        status: {
          type: String,
          enum: ["pending", "submitted", "approved", "rejected"],
          default: "pending",
        },
        documents: [
          {
            type: { type: String, enum: ["aadhaar", "pan", "gst", "fssai"] },
            number: String,
            imageUrl: String,
            verifiedAt: Date,
          },
        ],
        submittedAt: Date,
        reviewedAt: Date,
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        rejectionReason: String,
      },
    },
    security: {
      lastLogin: Date,
      lastPasswordChange: Date,
      failedLoginAttempts: { type: Number, default: 0 },
      lockUntil: Date,
      passwordResetToken: String,
      passwordResetExpires: Date,
      tokenVersion: { type: Number, default: 0 },
      twoFactorEnabled: { type: Boolean, default: false },
      twoFactorSecret: String,
    },
    preferences: {
      language: { type: String, default: "en" },
      currency: { type: String, default: "INR" },
      notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
      },
      newsletter: { type: Boolean, default: true },
    },
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    address: {
      street: String,
      village: String,
      city: String,
      district: String,
      state: String,
      pincode: String,
      country: { type: String, default: "India" },
      coordinates: {
        type: { type: String, enum: ["Point"] },
        coordinates: [Number], // [longitude, latitude]
      },
    },
    // Role-specific profiles
    farmerProfile: {
      farmName: String,
      farmSize: Number,
      farmSizeUnit: { type: String, enum: ["acres", "hectares", "bigha"] },
      experience: Number, // Years of farming experience
      crops: [String],
      farmingType: { type: String, enum: ["organic", "conventional", "mixed"] },
      certifications: [{ type: mongoose.Schema.Types.ObjectId, ref: "Certification" }],
      rating: { type: Number, default: 0, min: 0, max: 5 },
      totalSales: { type: Number, default: 0 },
      bankDetails: {
        accountName: String,
        accountNumber: String,
        ifscCode: String,
        bankName: String,
        branch: String,
      },
    },
    expertProfile: {
      specializations: [String],
      credentials: String, // Added field for simple text credentials
      qualifications: [
        {
          degree: String,
          institution: String,
          year: Number,
        },
      ],
      experience: Number,
      rating: { type: Number, default: 0, min: 0, max: 5 },
      totalAnswers: { type: Number, default: 0 },
      verified: { type: Boolean, default: false },
      consultationFee: Number,
    },
    activity: [
      {
        type: { type: String },
        timestamp: Date,
        ipAddress: String,
        userAgent: String,
        details: mongoose.Schema.Types.Mixed,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// ============================================
// INDEXES
// ============================================

userSchema.index({ role: 1 })
userSchema.index({ status: 1 })
userSchema.index({ "address.coordinates": "2dsphere" })
userSchema.index({ createdAt: -1 })

// ============================================
// VIRTUALS
// ============================================

userSchema.virtual("fullName").get(function () {
  return `${this.name.first} ${this.name.last}`
})

userSchema.virtual("isLocked").get(function () {
  return this.security?.lockUntil && this.security.lockUntil > new Date()
})

// ============================================
// INSTANCE METHODS
// ============================================

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

userSchema.methods.hasPermission = function (permission) {
  if (this.role === "admin") return true
  return this.permissions.includes(permission)
}

// ============================================
// STATIC METHODS
// ============================================

userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() })
}

userSchema.statics.findActiveUsers = function () {
  return this.find({ status: "active" })
}

// ============================================
// MIDDLEWARE
// ============================================

// Don't return password in JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  delete obj.security
  delete obj.__v
  return obj
}

const User = mongoose.model("User", userSchema)

module.exports = User
