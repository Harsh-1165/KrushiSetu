/**
 * User Management Routes
 * Complete CRUD operations for user management in GreenTrace
 *
 * @module routes/users
 * @requires express
 * @requires mongoose
 */

const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")
const multer = require("multer")
const path = require("path")
const fs = require("fs").promises

const User = require("../models/User")
const Review = require("../models/Review")
const { asyncHandler } = require("../utils/asyncHandler")
const AppError = require("../utils/AppError")
const { authenticate, authorize, isOwnerOrAdmin, checkPermission } = require("../middleware/auth")
const { apiLimiter } = require("../middleware/rateLimiter")
const {
  validateUserUpdate,
  validatePagination,
  validateObjectId,
  validateLocation,
  validateVerification,
} = require("../middleware/validators")

// ============================================================================
// MULTER CONFIGURATION FOR AVATAR UPLOADS
// ============================================================================

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads/avatars")
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
    cb(null, `avatar-${req.params.id}-${uniqueSuffix}${ext}`)
  },
})

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new AppError("Only JPEG, PNG, WebP, and GIF images are allowed", 400), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 1,
  },
})

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build filter query from request parameters
 * @param {Object} query - Express request query
 * @returns {Object} MongoDB filter object
 */
const buildFilterQuery = (query) => {
  const filter = { isActive: true }

  // Role filter
  if (query.role && ["farmer", "expert", "consumer", "admin"].includes(query.role)) {
    filter.role = query.role
  }

  // Verification status filter
  if (query.isVerified !== undefined) {
    filter.isVerified = query.isVerified === "true"
  }

  // KYC status filter
  if (query.kycStatus && ["pending", "submitted", "verified", "rejected"].includes(query.kycStatus)) {
    filter["kycDetails.status"] = query.kycStatus
  }

  // Search by name or email
  if (query.search) {
    const searchRegex = new RegExp(query.search, "i")
    filter.$or = [
      { "profile.firstName": searchRegex },
      { "profile.lastName": searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
    ]
  }

  // State/District filter
  if (query.state) {
    filter["profile.address.state"] = new RegExp(query.state, "i")
  }
  if (query.district) {
    filter["profile.address.district"] = new RegExp(query.district, "i")
  }

  // Date range filter (registration date)
  if (query.startDate || query.endDate) {
    filter.createdAt = {}
    if (query.startDate) {
      filter.createdAt.$gte = new Date(query.startDate)
    }
    if (query.endDate) {
      filter.createdAt.$lte = new Date(query.endDate)
    }
  }

  // Rating filter
  if (query.minRating) {
    filter["ratings.average"] = { $gte: Number.parseFloat(query.minRating) }
  }

  return filter
}

/**
 * Build sort options from request parameters
 * @param {string} sortBy - Sort field
 * @param {string} sortOrder - Sort order (asc/desc)
 * @returns {Object} MongoDB sort object
 */
const buildSortOptions = (sortBy = "createdAt", sortOrder = "desc") => {
  const allowedSortFields = [
    "createdAt",
    "profile.firstName",
    "profile.lastName",
    "ratings.average",
    "stats.totalSales",
    "stats.totalOrders",
  ]

  const field = allowedSortFields.includes(sortBy) ? sortBy : "createdAt"
  const order = sortOrder === "asc" ? 1 : -1

  return { [field]: order }
}

/**
 * Sanitize user object for response (remove sensitive fields)
 * @param {Object} user - User document
 * @param {boolean} isOwner - Whether requester is the owner
 * @returns {Object} Sanitized user object
 */
const sanitizeUser = (user, isOwner = false) => {
  const userObj = user.toObject ? user.toObject() : { ...user }

  // Always remove these fields
  delete userObj.password
  delete userObj.passwordResetToken
  delete userObj.passwordResetExpires
  delete userObj.emailVerificationToken
  delete userObj.loginAttempts
  delete userObj.lockUntil
  delete userObj.__v

  // Remove sensitive fields for non-owners
  if (!isOwner) {
    delete userObj.email
    delete userObj.phone
    delete userObj.kycDetails
    delete userObj.bankDetails
    delete userObj.notificationPreferences
    delete userObj.deviceTokens
  }

  return userObj
}

// ============================================================================
// ROUTES
// ============================================================================

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and filters
 * @access  Private (Admin only for full list, limited for others)
 *
 * Query Parameters:
 * - page (number): Page number (default: 1)
 * - limit (number): Items per page (default: 20, max: 100)
 * - role (string): Filter by role (farmer/expert/consumer/admin)
 * - isVerified (boolean): Filter by verification status
 * - kycStatus (string): Filter by KYC status
 * - search (string): Search by name, email, or phone
 * - state (string): Filter by state
 * - district (string): Filter by district
 * - startDate (date): Registration date range start
 * - endDate (date): Registration date range end
 * - minRating (number): Minimum rating filter
 * - sortBy (string): Sort field
 * - sortOrder (string): Sort order (asc/desc)
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     users: [...],
 *     pagination: { page, limit, total, pages, hasNext, hasPrev }
 *   }
 * }
 */
router.get(
  "/",
  apiLimiter,
  authenticate,
  validatePagination,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, sortBy = "createdAt", sortOrder = "desc" } = req.query

    const pageNum = Math.max(1, Number.parseInt(page))
    const limitNum = Math.min(100, Math.max(1, Number.parseInt(limit)))
    const skip = (pageNum - 1) * limitNum

    // Build filter query
    const filter = buildFilterQuery(req.query)

    // Non-admins can only see active, verified users
    if (req.user.role !== "admin") {
      filter.isVerified = true
      filter.isActive = true
    }

    // Build sort options
    const sort = buildSortOptions(sortBy, sortOrder)

    // Select fields based on role
    const selectFields =
      req.user.role === "admin"
        ? "-password -passwordResetToken -emailVerificationToken"
        : "profile.firstName profile.lastName profile.avatar role ratings stats.totalProducts stats.totalSales createdAt"

    // Execute query with pagination
    const [users, total] = await Promise.all([
      User.find(filter).select(selectFields).sort(sort).skip(skip).limit(limitNum).lean(),
      User.countDocuments(filter),
    ])

    const pages = Math.ceil(total / limitNum)

    res.status(200).json({
      success: true,
      data: {
        users: users.map((u) => sanitizeUser(u, false)),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages,
          hasNext: pageNum < pages,
          hasPrev: pageNum > 1,
        },
      },
    })
  }),
)

/**
 * @route   GET /api/users/role/:role
 * @desc    Get users by specific role
 * @access  Private
 *
 * URL Parameters:
 * - role (string): User role (farmer/expert/consumer)
 *
 * Query Parameters:
 * - page, limit, sortBy, sortOrder (same as GET /api/users)
 * - specialization (string): For experts - filter by specialization
 * - cropTypes (string): For farmers - filter by crop types (comma-separated)
 *
 * Response:
 * {
 *   success: true,
 *   data: { users: [...], pagination: {...} }
 * }
 */
router.get(
  "/role/:role",
  apiLimiter,
  authenticate,
  asyncHandler(async (req, res) => {
    const { role } = req.params
    const validRoles = ["farmer", "expert", "consumer"]

    if (!validRoles.includes(role)) {
      throw new AppError(`Invalid role. Must be one of: ${validRoles.join(", ")}`, 400)
    }

    const {
      page = 1,
      limit = 20,
      specialization,
      cropTypes,
      sortBy = "ratings.average",
      sortOrder = "desc",
    } = req.query

    const pageNum = Math.max(1, Number.parseInt(page))
    const limitNum = Math.min(100, Math.max(1, Number.parseInt(limit)))
    const skip = (pageNum - 1) * limitNum

    // Build filter
    const filter = {
      role,
      isActive: true,
      isVerified: true,
    }

    // Role-specific filters
    if (role === "expert" && specialization) {
      filter["expertProfile.specializations"] = new RegExp(specialization, "i")
    }

    if (role === "farmer" && cropTypes) {
      const crops = cropTypes.split(",").map((c) => c.trim())
      filter["farmerProfile.cropTypes"] = { $in: crops }
    }

    const sort = buildSortOptions(sortBy, sortOrder)

    // Select fields based on role type
    let selectFields = "profile.firstName profile.lastName profile.avatar ratings createdAt"
    if (role === "farmer") {
      selectFields += " farmerProfile stats.totalProducts stats.totalSales"
    } else if (role === "expert") {
      selectFields += " expertProfile stats.questionsAnswered"
    }

    const [users, total] = await Promise.all([
      User.find(filter).select(selectFields).sort(sort).skip(skip).limit(limitNum).lean(),
      User.countDocuments(filter),
    ])

    const pages = Math.ceil(total / limitNum)

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages,
          hasNext: pageNum < pages,
          hasPrev: pageNum > 1,
        },
      },
    })
  }),
)

/**
 * @route   GET /api/users/nearby/:lat/:lng
 * @desc    Get users near a location (geospatial query)
 * @access  Private
 *
 * URL Parameters:
 * - lat (number): Latitude (-90 to 90)
 * - lng (number): Longitude (-180 to 180)
 *
 * Query Parameters:
 * - radius (number): Search radius in kilometers (default: 50, max: 500)
 * - role (string): Filter by user role
 * - limit (number): Max results (default: 20, max: 100)
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     users: [...],
 *     center: { lat, lng },
 *     radius: 50
 *   }
 * }
 */
router.get(
  "/nearby/:lat/:lng",
  apiLimiter,
  authenticate,
  validateLocation,
  asyncHandler(async (req, res) => {
    const lat = Number.parseFloat(req.params.lat)
    const lng = Number.parseFloat(req.params.lng)

    // Validate coordinates
    if (isNaN(lat) || isNaN(lng)) {
      throw new AppError("Invalid coordinates", 400)
    }
    if (lat < -90 || lat > 90) {
      throw new AppError("Latitude must be between -90 and 90", 400)
    }
    if (lng < -180 || lng > 180) {
      throw new AppError("Longitude must be between -180 and 180", 400)
    }

    const { radius = 50, role, limit = 20 } = req.query

    const radiusKm = Math.min(500, Math.max(1, Number.parseFloat(radius)))
    const limitNum = Math.min(100, Math.max(1, Number.parseInt(limit)))

    // Convert radius to radians for MongoDB (Earth radius ≈ 6371 km)
    const radiusRadians = radiusKm / 6371

    // Build filter
    const filter = {
      isActive: true,
      isVerified: true,
      "profile.location": {
        $geoWithin: {
          $centerSphere: [[lng, lat], radiusRadians],
        },
      },
    }

    if (role && ["farmer", "expert", "consumer"].includes(role)) {
      filter.role = role
    }

    // Exclude current user from results
    filter._id = { $ne: req.user._id }

    const users = await User.find(filter)
      .select(
        "profile.firstName profile.lastName profile.avatar profile.address.district profile.address.state role ratings",
      )
      .limit(limitNum)
      .lean()

    // Calculate distance for each user
    const usersWithDistance = users
      .map((user) => {
        if (user.profile?.location?.coordinates) {
          const [userLng, userLat] = user.profile.location.coordinates
          const distance = calculateDistance(lat, lng, userLat, userLng)
          return { ...user, distance: Math.round(distance * 10) / 10 }
        }
        return { ...user, distance: null }
      })
      .sort((a, b) => (a.distance || Number.POSITIVE_INFINITY) - (b.distance || Number.POSITIVE_INFINITY))

    res.status(200).json({
      success: true,
      data: {
        users: usersWithDistance,
        center: { lat, lng },
        radius: radiusKm,
        count: usersWithDistance.length,
      },
    })
  }),
)

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg) {
  return deg * (Math.PI / 180)
}

/**
 * @route   GET /api/users/:id
 * @desc    Get single user profile by ID
 * @access  Private (Full details for owner/admin, limited for others)
 *
 * URL Parameters:
 * - id (string): User ID (MongoDB ObjectId)
 *
 * Query Parameters:
 * - includeProducts (boolean): Include user's products (for farmers)
 * - includeStats (boolean): Include detailed statistics
 *
 * Response:
 * {
 *   success: true,
 *   data: { user: {...} }
 * }
 */
router.get(
  "/:id",
  apiLimiter,
  authenticate,
  validateObjectId("id"),
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const { includeProducts, includeStats } = req.query

    const user = await User.findById(id).select(
      "-password -passwordResetToken -emailVerificationToken -loginAttempts -lockUntil",
    )

    if (!user) {
      throw new AppError("User not found", 404)
    }

    // Check if user is active (unless requester is admin)
    if (!user.isActive && req.user.role !== "admin") {
      throw new AppError("User not found", 404)
    }

    const isOwner = req.user._id.toString() === id
    const isAdmin = req.user.role === "admin"

    // Sanitize based on ownership
    const sanitizedUser = sanitizeUser(user, isOwner || isAdmin)

    // Optionally include products for farmers
    if (includeProducts === "true" && user.role === "farmer") {
      const Product = require("../models/Product")
      const products = await Product.find({
        seller: id,
        status: "active",
      })
        .select("name images.primary price.current quantity.available ratings")
        .limit(10)
        .lean()
      sanitizedUser.products = products
    }

    // Optionally include detailed stats
    if (includeStats === "true" && (isOwner || isAdmin)) {
      const Order = require("../models/Order")
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

      const recentStats = await Order.aggregate([
        {
          $match: {
            $or: [{ buyer: user._id }, { seller: user._id }],
            createdAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: {
              $sum: {
                $cond: [{ $eq: ["$seller", user._id] }, "$pricing.total", 0],
              },
            },
            totalSpent: {
              $sum: {
                $cond: [{ $eq: ["$buyer", user._id] }, "$pricing.total", 0],
              },
            },
          },
        },
      ])

      sanitizedUser.recentStats = recentStats[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        totalSpent: 0,
      }
    }

    res.status(200).json({
      success: true,
      data: { user: sanitizedUser },
    })
  }),
)

/**
 * @route   PUT /api/users/:id
 * @desc    Update user profile
 * @access  Private (Owner or Admin only)
 *
 * URL Parameters:
 * - id (string): User ID
 *
 * Request Body:
 * {
 *   profile: { firstName, lastName, bio, address: {...} },
 *   phone: "string",
 *   farmerProfile: { landSize, cropTypes, farmingType, ... },
 *   expertProfile: { specializations, experience, ... },
 *   notificationPreferences: { ... }
 * }
 *
 * Response:
 * {
 *   success: true,
 *   message: "Profile updated successfully",
 *   data: { user: {...} }
 * }
 */
router.put(
  "/:id",
  apiLimiter,
  authenticate,
  validateObjectId("id"),
  isOwnerOrAdmin,
  validateUserUpdate,
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const updates = req.body

    // Fields that cannot be updated through this endpoint
    const restrictedFields = [
      "password",
      "email",
      "role",
      "isVerified",
      "isActive",
      "kycDetails.status",
      "ratings",
      "stats",
      "createdAt",
      "passwordResetToken",
      "emailVerificationToken",
    ]

    // Remove restricted fields from updates
    restrictedFields.forEach((field) => {
      const parts = field.split(".")
      if (parts.length === 1) {
        delete updates[field]
      } else {
        if (updates[parts[0]]) {
          delete updates[parts[0]][parts[1]]
        }
      }
    })

    // Only admin can update certain fields
    if (req.user.role !== "admin") {
      delete updates.role
      delete updates.isActive
      delete updates.kycDetails
    }

    const user = await User.findById(id)
    if (!user) {
      throw new AppError("User not found", 404)
    }

    // Update profile fields
    if (updates.profile) {
      Object.keys(updates.profile).forEach((key) => {
        if (key === "address" && updates.profile.address) {
          Object.keys(updates.profile.address).forEach((addrKey) => {
            user.profile.address[addrKey] = updates.profile.address[addrKey]
          })
        } else if (key === "location" && updates.profile.location) {
          // Update geospatial location
          user.profile.location = {
            type: "Point",
            coordinates: [
              updates.profile.location.lng || updates.profile.location.coordinates?.[0],
              updates.profile.location.lat || updates.profile.location.coordinates?.[1],
            ],
          }
        } else {
          user.profile[key] = updates.profile[key]
        }
      })
    }

    // Update role-specific profiles
    if (updates.farmerProfile && user.role === "farmer") {
      Object.assign(user.farmerProfile, updates.farmerProfile)
    }

    if (updates.expertProfile && user.role === "expert") {
      Object.assign(user.expertProfile, updates.expertProfile)
    }

    // Update notification preferences
    if (updates.notificationPreferences) {
      Object.assign(user.notificationPreferences, updates.notificationPreferences)
    }

    // Update phone if provided
    if (updates.phone) {
      // Check if phone is already in use
      const phoneExists = await User.findOne({
        phone: updates.phone,
        _id: { $ne: id },
      })
      if (phoneExists) {
        throw new AppError("Phone number already in use", 400)
      }
      user.phone = updates.phone
    }

    user.updatedAt = new Date()
    await user.save()

    const isOwner = req.user._id.toString() === id
    const sanitizedUser = sanitizeUser(user, isOwner || req.user.role === "admin")

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: { user: sanitizedUser },
    })
  }),
)

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user account (soft delete)
 * @access  Private (Owner or Admin only)
 *
 * URL Parameters:
 * - id (string): User ID
 *
 * Query Parameters:
 * - permanent (boolean): Hard delete (Admin only)
 *
 * Request Body:
 * {
 *   password: "string" (required for owner deletion),
 *   reason: "string" (optional)
 * }
 *
 * Response:
 * {
 *   success: true,
 *   message: "Account deleted successfully"
 * }
 */
router.delete(
  "/:id",
  apiLimiter,
  authenticate,
  validateObjectId("id"),
  isOwnerOrAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const { permanent } = req.query
    const { password, reason } = req.body

    const user = await User.findById(id).select("+password")
    if (!user) {
      throw new AppError("User not found", 404)
    }

    const isOwner = req.user._id.toString() === id
    const isAdmin = req.user.role === "admin"

    // Owner must provide password for deletion
    if (isOwner && !isAdmin) {
      if (!password) {
        throw new AppError("Password is required to delete your account", 400)
      }
      const isPasswordValid = await user.comparePassword(password)
      if (!isPasswordValid) {
        throw new AppError("Incorrect password", 401)
      }
    }

    // Prevent deleting admin accounts (except by super admin)
    if (user.role === "admin" && !req.user.isSuperAdmin) {
      throw new AppError("Cannot delete admin accounts", 403)
    }

    // Check for pending orders
    const Order = require("../models/Order")
    const pendingOrders = await Order.countDocuments({
      $or: [{ buyer: id }, { seller: id }],
      status: { $in: ["pending", "confirmed", "processing", "shipped"] },
    })

    if (pendingOrders > 0) {
      throw new AppError(
        `Cannot delete account with ${pendingOrders} pending order(s). Please complete or cancel them first.`,
        400,
      )
    }

    // Hard delete (Admin only)
    if (permanent === "true" && isAdmin) {
      // Delete related data
      await Promise.all([
        Review.deleteMany({ $or: [{ reviewer: id }, { reviewee: id }] }),
        require("../models/Product").updateMany({ seller: id }, { status: "deleted", isActive: false }),
        require("../models/Notification").deleteMany({ user: id }),
        require("../models/Token").deleteMany({ user: id }),
      ])

      await User.findByIdAndDelete(id)

      // Log deletion
      console.log(`[ADMIN] User ${id} permanently deleted by ${req.user._id}. Reason: ${reason || "Not specified"}`)

      return res.status(200).json({
        success: true,
        message: "Account permanently deleted",
      })
    }

    // Soft delete
    user.isActive = false
    user.deletedAt = new Date()
    user.deletionReason = reason || "User requested deletion"
    user.email = `deleted_${Date.now()}_${user.email}` // Free up email
    user.phone = `deleted_${Date.now()}_${user.phone}` // Free up phone
    await user.save()

    // Deactivate user's products
    await require("../models/Product").updateMany({ seller: id }, { status: "inactive", isActive: false })

    // Invalidate all tokens
    await require("../models/Token").deleteMany({ user: id })

    res.status(200).json({
      success: true,
      message: "Account deleted successfully. You have 30 days to recover your account.",
    })
  }),
)

/**
 * @route   PUT /api/users/:id/avatar
 * @desc    Upload or update profile picture
 * @access  Private (Owner only)
 *
 * URL Parameters:
 * - id (string): User ID
 *
 * Request Body:
 * - Form-data with 'avatar' field (image file)
 *
 * Response:
 * {
 *   success: true,
 *   message: "Avatar updated successfully",
 *   data: { avatarUrl: "string" }
 * }
 */
router.put(
  "/:id/avatar",
  apiLimiter,
  authenticate,
  validateObjectId("id"),
  isOwnerOrAdmin,
  upload.single("avatar"),
  asyncHandler(async (req, res) => {
    const { id } = req.params

    if (!req.file) {
      throw new AppError("Please upload an image file", 400)
    }

    const user = await User.findById(id)
    if (!user) {
      // Clean up uploaded file
      await fs.unlink(req.file.path).catch(() => { })
      throw new AppError("User not found", 404)
    }

    // Delete old avatar if exists
    if (user.profile.avatar && !user.profile.avatar.includes("default")) {
      const oldAvatarPath = path.join(__dirname, "..", user.profile.avatar)
      await fs.unlink(oldAvatarPath).catch(() => { })
    }

    // Update avatar path
    const avatarUrl = `/uploads/avatars/${req.file.filename}`
    user.profile.avatar = avatarUrl
    user.updatedAt = new Date()
    await user.save()

    res.status(200).json({
      success: true,
      message: "Avatar updated successfully",
      data: { avatarUrl },
    })
  }),
)

/**
 * @route   DELETE /api/users/:id/avatar
 * @desc    Remove profile picture
 * @access  Private (Owner only)
 */
router.delete(
  "/:id/avatar",
  apiLimiter,
  authenticate,
  validateObjectId("id"),
  isOwnerOrAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const user = await User.findById(id)
    if (!user) {
      throw new AppError("User not found", 404)
    }

    // Delete avatar file if exists
    if (user.profile.avatar && !user.profile.avatar.includes("default")) {
      const avatarPath = path.join(__dirname, "..", user.profile.avatar)
      await fs.unlink(avatarPath).catch(() => { })
    }

    // Set default avatar
    user.profile.avatar = "/uploads/avatars/default.png"
    user.updatedAt = new Date()
    await user.save()

    res.status(200).json({
      success: true,
      message: "Avatar removed successfully",
    })
  }),
)

/**
 * @route   GET /api/users/:id/ratings
 * @desc    Get user ratings and reviews
 * @access  Public
 *
 * URL Parameters:
 * - id (string): User ID
 *
 * Query Parameters:
 * - page (number): Page number (default: 1)
 * - limit (number): Items per page (default: 10)
 * - sortBy (string): Sort field (createdAt/rating)
 * - sortOrder (string): Sort order (asc/desc)
 * - minRating (number): Filter by minimum rating
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     summary: { average, total, distribution },
 *     reviews: [...],
 *     pagination: {...}
 *   }
 * }
 */
router.get(
  "/:id/ratings",
  apiLimiter,
  validateObjectId("id"),
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc", minRating } = req.query

    // Verify user exists
    const user = await User.findById(id).select("ratings profile.firstName profile.lastName")
    if (!user) {
      throw new AppError("User not found", 404)
    }

    const pageNum = Math.max(1, Number.parseInt(page))
    const limitNum = Math.min(50, Math.max(1, Number.parseInt(limit)))
    const skip = (pageNum - 1) * limitNum

    // Build filter
    const filter = {
      reviewee: id,
      status: "approved",
    }

    if (minRating) {
      filter.rating = { $gte: Number.parseInt(minRating) }
    }

    // Build sort
    const sortField = ["createdAt", "rating", "helpfulVotes.count"].includes(sortBy) ? sortBy : "createdAt"
    const sort = { [sortField]: sortOrder === "asc" ? 1 : -1 }

    // Get reviews with pagination
    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate("reviewer", "profile.firstName profile.lastName profile.avatar")
        .populate("product", "name images.primary")
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Review.countDocuments(filter),
    ])

    // Get rating distribution
    const distribution = await Review.aggregate([
      { $match: { reviewee: new mongoose.Types.ObjectId(id), status: "approved" } },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ])

    const ratingDistribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    }
    distribution.forEach((d) => {
      ratingDistribution[d._id] = d.count
    })

    const pages = Math.ceil(total / limitNum)

    res.status(200).json({
      success: true,
      data: {
        summary: {
          average: user.ratings.average,
          total: user.ratings.count,
          distribution: ratingDistribution,
        },
        reviews,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages,
          hasNext: pageNum < pages,
          hasPrev: pageNum > 1,
        },
      },
    })
  }),
)

/**
 * @route   PUT /api/users/:id/verification
 * @desc    Update user verification status (KYC)
 * @access  Private (Admin only)
 *
 * URL Parameters:
 * - id (string): User ID
 *
 * Request Body:
 * {
 *   kycStatus: "pending" | "submitted" | "verified" | "rejected",
 *   isVerified: boolean,
 *   verificationNotes: "string",
 *   rejectionReason: "string" (required if status is rejected)
 * }
 *
 * Response:
 * {
 *   success: true,
 *   message: "Verification status updated",
 *   data: { user: {...} }
 * }
 */
router.put(
  "/:id/verification",
  apiLimiter,
  authenticate,
  authorize("admin"),
  validateObjectId("id"),
  validateVerification,
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const { kycStatus, isVerified, verificationNotes, rejectionReason } = req.body

    const user = await User.findById(id)
    if (!user) {
      throw new AppError("User not found", 404)
    }

    // Validate rejection reason
    if (kycStatus === "rejected" && !rejectionReason) {
      throw new AppError("Rejection reason is required", 400)
    }

    // Update verification status
    if (kycStatus) {
      user.kycDetails.status = kycStatus

      if (kycStatus === "verified") {
        user.kycDetails.verifiedAt = new Date()
        user.kycDetails.verifiedBy = req.user._id
        user.isVerified = true
      } else if (kycStatus === "rejected") {
        user.kycDetails.rejectionReason = rejectionReason
        user.isVerified = false
      }
    }

    if (typeof isVerified === "boolean") {
      user.isVerified = isVerified
    }

    if (verificationNotes) {
      user.kycDetails.notes = verificationNotes
    }

    user.updatedAt = new Date()
    await user.save()

    // Send notification to user
    const Notification = require("../models/Notification")
    await Notification.create({
      user: id,
      type: "system",
      title:
        kycStatus === "verified"
          ? "Account Verified!"
          : kycStatus === "rejected"
            ? "Verification Rejected"
            : "Verification Status Updated",
      message:
        kycStatus === "verified"
          ? "Congratulations! Your account has been verified. You now have access to all features."
          : kycStatus === "rejected"
            ? `Your verification was rejected. Reason: ${rejectionReason}`
            : "Your verification status has been updated.",
      priority: "high",
    })

    const sanitizedUser = sanitizeUser(user, true)

    res.status(200).json({
      success: true,
      message: "Verification status updated",
      data: { user: sanitizedUser },
    })
  }),
)

/**
 * @route   POST /api/users/:id/kyc
 * @desc    Submit KYC documents for verification
 * @access  Private (Owner only)
 */
router.post(
  "/:id/kyc",
  apiLimiter,
  authenticate,
  validateObjectId("id"),
  isOwnerOrAdmin,
  upload.fields([
    { name: "idProof", maxCount: 1 },
    { name: "addressProof", maxCount: 1 },
    { name: "bankProof", maxCount: 1 },
  ]),
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const { idType, idNumber } = req.body

    const user = await User.findById(id)
    if (!user) {
      throw new AppError("User not found", 404)
    }

    if (user.kycDetails.status === "verified") {
      throw new AppError("Account is already verified", 400)
    }

    // Update KYC details
    if (idType) user.kycDetails.documentType = idType
    if (idNumber) user.kycDetails.documentNumber = idNumber

    if (req.files) {
      if (req.files.idProof) {
        user.kycDetails.documents.idProof = `/uploads/kyc/${req.files.idProof[0].filename}`
      }
      if (req.files.addressProof) {
        user.kycDetails.documents.addressProof = `/uploads/kyc/${req.files.addressProof[0].filename}`
      }
      if (req.files.bankProof) {
        user.kycDetails.documents.bankProof = `/uploads/kyc/${req.files.bankProof[0].filename}`
      }
    }

    user.kycDetails.status = "submitted"
    user.kycDetails.submittedAt = new Date()
    user.updatedAt = new Date()
    await user.save()

    res.status(200).json({
      success: true,
      message: "KYC documents submitted successfully. Verification typically takes 2-3 business days.",
      data: {
        kycStatus: user.kycDetails.status,
      },
    })
  }),
)

// ============================================================================
// ERROR HANDLING
// ============================================================================

// Handle multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: "File size too large. Maximum size is 5MB.",
      })
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        error: "Unexpected file field.",
      })
    }
  }
  next(error)
})
// ============================================
// WISHLIST ROUTES
// ============================================

/**
 * @route   GET /api/users/wishlist
 * @desc    Get user's wishlist
 * @access  Private
 */
router.get(
  "/profile/wishlist",
  apiLimiter,
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate({
      path: "wishlist",
      select: "name price images ratings seller status",
      populate: {
        path: "seller",
        select: "profile.firstName profile.lastName",
      },
    })

    if (!user) {
      throw new AppError("User not found", 404)
    }

    // Filter out null products (deleted ones)
    const validWishlist = user.wishlist.filter((p) => p !== null)

    if (validWishlist.length !== user.wishlist.length) {
      user.wishlist = validWishlist
      await user.save()
    }

    res.status(200).json({
      success: true,
      data: { wishlist: validWishlist },
    })
  }),
)

/**
 * @route   POST /api/users/wishlist/:productId
 * @desc    Add product to wishlist
 * @access  Private
 */
router.post(
  "/wishlist/:productId",
  apiLimiter,
  authenticate,
  validateObjectId("productId"),
  asyncHandler(async (req, res) => {
    const { productId } = req.params

    const Product = require("../models/Product") // Avoid circular dependency
    const product = await Product.findById(productId)

    if (!product) {
      throw new AppError("Product not found", 404)
    }

    const user = await User.findById(req.user._id)

    // Check if already in wishlist
    if (user.wishlist.includes(productId)) {
      return res.status(200).json({
        success: true,
        message: "Product already in wishlist",
        data: { wishlist: user.wishlist },
      })
    }

    // Add to wishlist
    user.wishlist.push(productId)
    await user.save()

    // Increment product wishlist count
    product.wishlistCount += 1
    await product.save()

    res.status(200).json({
      success: true,
      message: "Added to favorites",
      data: { wishlist: user.wishlist },
    })
  }),
)

/**
 * @route   DELETE /api/users/wishlist/:productId
 * @desc    Remove product from wishlist
 * @access  Private
 */
router.delete(
  "/wishlist/:productId",
  apiLimiter,
  authenticate,
  validateObjectId("productId"),
  asyncHandler(async (req, res) => {
    const { productId } = req.params

    const user = await User.findById(req.user._id)

    // Check if in wishlist
    const index = user.wishlist.indexOf(productId)
    if (index === -1) {
      return res.status(200).json({
        success: true,
        message: "Product not in wishlist",
        data: { wishlist: user.wishlist },
      })
    }

    // Remove from wishlist
    user.wishlist.splice(index, 1)
    await user.save()

    // Decrement product wishlist count
    const Product = require("../models/Product")
    const product = await Product.findById(productId)
    if (product) {
      product.wishlistCount = Math.max(0, product.wishlistCount - 1)
      await product.save()
    }

    res.status(200).json({
      success: true,
      message: "Removed from favorites",
      data: { wishlist: user.wishlist },
    })
  }),
)

module.exports = router
