/**
 * GreenTrace Authentication Routes
 * Complete JWT-based authentication system for agricultural marketplace
 *
 * Endpoints:
 * POST /api/auth/register - User registration
 * POST /api/auth/login - User login
 * POST /api/auth/logout - User logout
 * POST /api/auth/refresh-token - Refresh access token
 * POST /api/auth/forgot-password - Request password reset
 * POST /api/auth/reset-password - Reset password with token
 * POST /api/auth/verify-email - Verify email address
 * POST /api/auth/resend-verification - Resend verification email
 * GET /api/auth/me - Get current user profile
 * PUT /api/auth/change-password - Change password
 */

const express = require("express")
const router = express.Router()
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const { body, validationResult } = require("express-validator")

// Models
const User = require("../models/User")
const Token = require("../models/Token")

// Middleware
const { authenticate, authorize } = require("../middleware/auth")
const { authLimiter, passwordResetLimiter } = require("../middleware/rateLimiter")

// Utils
const { sendEmail } = require("../utils/email")
const { generateTokens, verifyRefreshToken } = require("../utils/tokenUtils")
const AppError = require("../utils/AppError")
const { asyncHandler } = require("../utils/asyncHandler")

// ============================================
// VALIDATION RULES
// ============================================

const registerValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email address"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage("Password must contain uppercase, lowercase, number, and special character"),
  body("confirmPassword")
    .custom((value, { req }) => value === req.body.password)
    .withMessage("Passwords do not match"),
  body("name.first").trim().isLength({ min: 2, max: 50 }).withMessage("First name must be 2-50 characters"),
  body("name.last").trim().isLength({ min: 2, max: 50 }).withMessage("Last name must be 2-50 characters"),
  body("phone")
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Please provide a valid 10-digit Indian mobile number"),
  body("role").isIn(["farmer", "expert", "consumer"]).withMessage("Role must be farmer, expert, or consumer"),
]

const loginValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email address"),
  body("password").notEmpty().withMessage("Password is required"),
]

const passwordResetValidation = [
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage("Password must contain uppercase, lowercase, number, and special character"),
  body("confirmPassword")
    .custom((value, { req }) => value === req.body.password)
    .withMessage("Passwords do not match"),
]

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Validate request and throw error if validation fails
 */
const validateRequest = (req) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const errorMessages = errors
      .array()
      .map((err) => err.msg)
      .join(", ")
    throw new AppError(errorMessages, 400)
  }
}

/**
 * Set HTTP-only cookies for tokens
 */
const setTokenCookies = (res, accessToken, refreshToken) => {
  // Access token cookie (15 minutes)
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000, // 15 minutes
  })

  // Refresh token cookie (7 days)
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/api/auth/refresh-token", // Only sent to refresh endpoint
  })
}

/**
 * Clear authentication cookies
 */
const clearTokenCookies = (res) => {
  res.clearCookie("accessToken")
  res.clearCookie("refreshToken", { path: "/api/auth/refresh-token" })
}

/**
 * Generate email verification token
 */
const generateVerificationToken = () => {
  const token = crypto.randomBytes(32).toString("hex")
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex")
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  return { token, hashedToken, expiresAt }
}

/**
 * Generate password reset token
 */
const generatePasswordResetToken = () => {
  const token = crypto.randomBytes(32).toString("hex")
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex")
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
  return { token, hashedToken, expiresAt }
}

// ============================================
// ROUTES
// ============================================

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  "/register",
  authLimiter,
  registerValidation,
  asyncHandler(async (req, res) => {
    validateRequest(req)

    const { email, password, name, phone, role } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    })

    if (existingUser) {
      if (existingUser.email === email) {
        throw new AppError("Email already registered", 409)
      }
      throw new AppError("Phone number already registered", 409)
    }

    // Hash password
    const salt = await bcrypt.genSalt(12)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Generate email verification token
    const { token: verificationToken, hashedToken, expiresAt } = generateVerificationToken()

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      phone,
      role,
      verification: {
        email: {
          token: hashedToken,
          expiresAt,
          verified: false,
        },
      },
      security: {
        lastPasswordChange: new Date(),
      },
    })

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}&email=${email}`

    try {
      await sendEmail({
        to: email,
        subject: "GreenTrace - Verify Your Email",
        template: "emailVerification",
        data: {
          name: name.first,
          verificationUrl,
          expiresIn: "24 hours",
        },
      })
    } catch (err) {
      // In development, don't block signup if email isn't configured.
      if (process.env.NODE_ENV === "production") throw err
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user)

    // Store refresh token in database
    await Token.create({
      userId: user._id,
      token: refreshToken,
      type: "refresh",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    })

    // Set cookies
    setTokenCookies(res, accessToken, refreshToken)

    // Return response (exclude sensitive data)
    res.status(201).json({
      success: true,
      message: "Registration successful. Please verify your email.",
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          isEmailVerified: false,
        },
        accessToken, // Also return in body for non-cookie clients
      },
    })
  }),
)

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and get tokens
 * @access  Public
 */
router.post(
  "/login",
  authLimiter,
  loginValidation,
  asyncHandler(async (req, res) => {
    validateRequest(req)

    const { email, password, rememberMe } = req.body

    // Find user by email (include password for comparison)
    const user = await User.findOne({ email }).select("+password +security")

    if (!user) {
      throw new AppError("Invalid email or password", 401)
    }

    // Check if account is locked
    if (user.security?.lockUntil && user.security.lockUntil > new Date()) {
      const remainingTime = Math.ceil((user.security.lockUntil - new Date()) / 60000)
      throw new AppError(`Account locked. Try again in ${remainingTime} minutes`, 423)
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      // Increment failed login attempts
      user.security.failedLoginAttempts = (user.security.failedLoginAttempts || 0) + 1

      // Lock account after 5 failed attempts
      if (user.security.failedLoginAttempts >= 5) {
        user.security.lockUntil = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
        await user.save()
        throw new AppError("Account locked due to too many failed attempts. Try again in 30 minutes", 423)
      }

      await user.save()
      throw new AppError("Invalid email or password", 401)
    }

    // Check if account is active
    if (user.status !== "active") {
      throw new AppError(`Account is ${user.status}. Please contact support.`, 403)
    }

    // Reset failed login attempts on successful login
    user.security.failedLoginAttempts = 0
    user.security.lockUntil = undefined
    user.security.lastLogin = new Date()
    await user.save()

    // Generate tokens
    const tokenExpiry = rememberMe ? "30d" : "7d"
    const { accessToken, refreshToken } = generateTokens(user, tokenExpiry)

    // Revoke old refresh tokens for this device (optional: keep multiple sessions)
    await Token.updateMany(
      {
        userId: user._id,
        type: "refresh",
        userAgent: req.headers["user-agent"],
      },
      { isRevoked: true },
    )

    // Store new refresh token
    await Token.create({
      userId: user._id,
      token: refreshToken,
      type: "refresh",
      expiresAt: new Date(Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000),
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    })

    // Set cookies
    setTokenCookies(res, accessToken, refreshToken)

    // Log login activity
    user.activity.push({
      type: "login",
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    })
    await user.save()

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          avatar: user.avatar,
          isEmailVerified: user.verification?.email?.verified || false,
          permissions: user.permissions,
        },
        accessToken,
      },
    })
  }),
)

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and revoke tokens
 * @access  Private
 */
router.post(
  "/logout",
  authenticate,
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (refreshToken) {
      // Revoke the refresh token
      await Token.findOneAndUpdate({ token: refreshToken, userId: req.user._id }, { isRevoked: true })
    }

    // Optionally revoke all tokens for this user (logout from all devices)
    if (req.body.logoutAll) {
      await Token.updateMany({ userId: req.user._id, type: "refresh" }, { isRevoked: true })
    }

    // Clear cookies
    clearTokenCookies(res)

    res.json({
      success: true,
      message: "Logout successful",
    })
  }),
)

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token using refresh token
 * @access  Public (with valid refresh token)
 */
router.post(
  "/refresh-token",
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!refreshToken) {
      throw new AppError("Refresh token required", 401)
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken)

    // Check if token exists and is not revoked
    const storedToken = await Token.findOne({
      token: refreshToken,
      userId: decoded.userId,
      type: "refresh",
      isRevoked: false,
    })

    if (!storedToken) {
      throw new AppError("Invalid or revoked refresh token", 401)
    }

    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      storedToken.isRevoked = true
      await storedToken.save()
      throw new AppError("Refresh token expired", 401)
    }

    // Get user
    const user = await User.findById(decoded.userId)

    if (!user || user.status !== "active") {
      throw new AppError("User not found or inactive", 401)
    }

    // Generate new tokens (token rotation for security)
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user)

    // Revoke old refresh token
    storedToken.isRevoked = true
    await storedToken.save()

    // Store new refresh token
    await Token.create({
      userId: user._id,
      token: newRefreshToken,
      type: "refresh",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    })

    // Set cookies
    setTokenCookies(res, accessToken, newRefreshToken)

    res.json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        accessToken,
      },
    })
  }),
)

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 */
router.post(
  "/forgot-password",
  passwordResetLimiter,
  [body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email")],
  asyncHandler(async (req, res) => {
    validateRequest(req)

    const { email } = req.body

    const user = await User.findOne({ email })

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: "If an account exists with this email, you will receive a password reset link",
      })
    }

    // Generate password reset token
    const { token, hashedToken, expiresAt } = generatePasswordResetToken()

    // Store hashed token
    user.security.passwordResetToken = hashedToken
    user.security.passwordResetExpires = expiresAt
    await user.save()

    // Send password reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}&email=${email}`

    try {
      await sendEmail({
        to: email,
        subject: "GreenTrace - Password Reset Request",
        template: "passwordReset",
        data: {
          name: user.name.first,
          resetUrl,
          expiresIn: "1 hour",
        },
      })

      res.json({
        success: true,
        message: "If an account exists with this email, you will receive a password reset link",
      })
    } catch (error) {
      // Clear reset token on email failure
      user.security.passwordResetToken = undefined
      user.security.passwordResetExpires = undefined
      await user.save()

      throw new AppError("Error sending email. Please try again later.", 500)
    }
  }),
)

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post(
  "/reset-password",
  passwordResetValidation,
  asyncHandler(async (req, res) => {
    validateRequest(req)

    const { token, email, password } = req.body

    // Hash the provided token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex")

    // Find user with valid reset token
    const user = await User.findOne({
      email,
      "security.passwordResetToken": hashedToken,
      "security.passwordResetExpires": { $gt: new Date() },
    }).select("+password")

    if (!user) {
      throw new AppError("Invalid or expired password reset token", 400)
    }

    // Check if new password is same as old
    const isSamePassword = await bcrypt.compare(password, user.password)
    if (isSamePassword) {
      throw new AppError("New password must be different from current password", 400)
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12)
    user.password = await bcrypt.hash(password, salt)

    // Clear reset token
    user.security.passwordResetToken = undefined
    user.security.passwordResetExpires = undefined
    user.security.lastPasswordChange = new Date()

    // Revoke all existing refresh tokens (force re-login)
    await Token.updateMany({ userId: user._id, type: "refresh" }, { isRevoked: true })

    await user.save()

    // Send confirmation email
    await sendEmail({
      to: email,
      subject: "GreenTrace - Password Changed Successfully",
      template: "passwordChanged",
      data: {
        name: user.name.first,
        timestamp: new Date().toISOString(),
      },
    })

    res.json({
      success: true,
      message: "Password reset successful. Please login with your new password.",
    })
  }),
)

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email address with token
 * @access  Public
 */
router.post(
  "/verify-email",
  asyncHandler(async (req, res) => {
    const { token, email } = req.body

    if (!token || !email) {
      throw new AppError("Token and email are required", 400)
    }

    // Hash the provided token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex")

    // Find user with valid verification token
    const user = await User.findOne({
      email,
      "verification.email.token": hashedToken,
      "verification.email.expiresAt": { $gt: new Date() },
    })

    if (!user) {
      throw new AppError("Invalid or expired verification token", 400)
    }

    // Mark email as verified
    user.verification.email.verified = true
    user.verification.email.verifiedAt = new Date()
    user.verification.email.token = undefined
    user.verification.email.expiresAt = undefined

    await user.save()

    res.json({
      success: true,
      message: "Email verified successfully",
    })
  }),
)

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend email verification link
 * @access  Private
 */
router.post(
  "/resend-verification",
  authenticate,
  authLimiter,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)

    if (user.verification?.email?.verified) {
      throw new AppError("Email already verified", 400)
    }

    // Generate new verification token
    const { token, hashedToken, expiresAt } = generateVerificationToken()

    user.verification.email.token = hashedToken
    user.verification.email.expiresAt = expiresAt
    await user.save()

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}&email=${user.email}`

    await sendEmail({
      to: user.email,
      subject: "GreenTrace - Verify Your Email",
      template: "emailVerification",
      data: {
        name: user.name.first,
        verificationUrl,
        expiresIn: "24 hours",
      },
    })

    res.json({
      success: true,
      message: "Verification email sent successfully",
    })
  }),
)

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).lean()
    if (!user) {
      throw new AppError("User not found", 404)
    }

    // Build a plain, serializable response (avoid any Mongoose/getter issues)
    const userId = user._id && (user._id.toString ? user._id.toString() : String(user._id))
    const payload = {
      success: true,
      data: {
        user: {
          _id: userId,
          id: userId,
          email: user.email || null,
          name: user.name || { first: "", last: "" },
          phone: user.phone || null,
          role: user.role || null,
          avatar: user.avatar || null,
          status: user.status || "active",
          isEmailVerified: !!(user.verification && user.verification.email && user.verification.email.verified),
          isPhoneVerified: !!(user.verification && user.verification.phone && user.verification.phone.verified),
          isKycVerified: !!(user.verification && user.verification.kyc && user.verification.kyc.status === "approved"),
          permissions: Array.isArray(user.permissions) ? user.permissions : [],
          preferences: user.preferences || {},
          address: user.address || null,
          createdAt: user.createdAt || null,
        },
      },
    }
    if (user.role === "farmer" && user.farmerProfile) payload.data.user.farmerProfile = user.farmerProfile
    if (user.role === "expert" && user.expertProfile) payload.data.user.expertProfile = user.expertProfile

    res.json(payload)
  }),
)

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change password for authenticated user
 * @access  Private
 */
router.put(
  "/change-password",
  authenticate,
  [body("currentPassword").notEmpty().withMessage("Current password is required"), ...passwordResetValidation],
  asyncHandler(async (req, res) => {
    validateRequest(req)

    const { currentPassword, password } = req.body

    // Get user with password
    const user = await User.findById(req.user._id).select("+password")

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isPasswordValid) {
      throw new AppError("Current password is incorrect", 401)
    }

    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(password, user.password)
    if (isSamePassword) {
      throw new AppError("New password must be different from current password", 400)
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12)
    user.password = await bcrypt.hash(password, salt)
    user.security.lastPasswordChange = new Date()

    // Optionally revoke other sessions
    if (req.body.logoutOtherDevices) {
      const currentToken = req.cookies.refreshToken || req.body.refreshToken
      await Token.updateMany(
        {
          userId: user._id,
          type: "refresh",
          token: { $ne: currentToken },
        },
        { isRevoked: true },
      )
    }

    await user.save()

    // Send notification email
    await sendEmail({
      to: user.email,
      subject: "GreenTrace - Password Changed",
      template: "passwordChanged",
      data: {
        name: user.name.first,
        timestamp: new Date().toISOString(),
      },
    })

    res.json({
      success: true,
      message: "Password changed successfully",
    })
  }),
)

/**
 * @route   GET /api/auth/sessions
 * @desc    Get all active sessions for current user
 * @access  Private
 */
router.get(
  "/sessions",
  authenticate,
  asyncHandler(async (req, res) => {
    const sessions = await Token.find({
      userId: req.user._id,
      type: "refresh",
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    }).select("userAgent ipAddress createdAt")

    res.json({
      success: true,
      data: {
        sessions: sessions.map((session) => ({
          id: session._id,
          device: session.userAgent,
          ipAddress: session.ipAddress,
          createdAt: session.createdAt,
          isCurrent: session.token === req.cookies.refreshToken,
        })),
      },
    })
  }),
)

/**
 * @route   DELETE /api/auth/sessions/:sessionId
 * @desc    Revoke a specific session
 * @access  Private
 */
router.delete(
  "/sessions/:sessionId",
  authenticate,
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params

    const session = await Token.findOneAndUpdate({ _id: sessionId, userId: req.user._id }, { isRevoked: true })

    if (!session) {
      throw new AppError("Session not found", 404)
    }

    res.json({
      success: true,
      message: "Session revoked successfully",
    })
  }),
)

/**
 * @route   GET /api/auth/activity
 * @desc    Get login activity history for current user
 * @access  Private
 */
router.get(
  "/activity",
  authenticate,
  asyncHandler(async (req, res) => {
    const { limit = 20, page = 1 } = req.query
    const limitNum = Math.min(50, Math.max(1, Number.parseInt(limit)))
    const pageNum = Math.max(1, Number.parseInt(page))
    const skip = (pageNum - 1) * limitNum

    const user = await User.findById(req.user._id).select("activity")

    // Sort by timestamp descending and paginate
    const activity = (user.activity || [])
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(skip, skip + limitNum)

    res.json({
      success: true,
      data: {
        activity,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: (user.activity || []).length,
        },
      },
    })
  }),
)

/**
 * @route   GET /api/auth/security-info
 * @desc    Get security information for current user
 * @access  Private
 */
router.get(
  "/security-info",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("security verification")

    res.json({
      success: true,
      data: {
        lastLogin: user.security?.lastLogin,
        lastPasswordChange: user.security?.lastPasswordChange,
        twoFactorEnabled: user.security?.twoFactorEnabled || false,
        emailVerified: user.verification?.email?.verified || false,
        phoneVerified: user.verification?.phone?.verified || false,
        kycStatus: user.verification?.kyc?.status || "pending",
      },
    })
  }),
)

module.exports = router
