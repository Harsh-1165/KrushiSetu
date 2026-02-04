/**
 * Authentication & Authorization Middleware
 * Handles JWT verification and role-based access control
 */

const jwt = require("jsonwebtoken")
const User = require("../models/User")
const Token = require("../models/Token")
const AppError = require("../utils/AppError")
const { asyncHandler } = require("../utils/asyncHandler")

// ============================================
// JWT VERIFICATION MIDDLEWARE
// ============================================

/**
 * Authenticate user via JWT token
 * Checks cookies first, then Authorization header
 */
const authenticate = asyncHandler(async (req, res, next) => {
  let token

  // Check for token in cookies (preferred for web clients)
  if (req.cookies.accessToken) {
    token = req.cookies.accessToken
  }
  // Check for token in Authorization header (for API clients)
  else if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1]
  }

  if (!token) {
    throw new AppError("Authentication required. Please login.", 401)
  }

  try {
    // Verify token (fallback to JWT_SECRET if JWT_ACCESS_SECRET not set)
    const accessSecret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET
    if (!accessSecret) {
      throw new AppError("JWT secret not configured", 500)
    }
    const decoded = jwt.verify(token, accessSecret)

    // Check if user still exists and is active
    const user = await User.findById(decoded.userId).select("-password")

    if (!user) {
      throw new AppError("User no longer exists", 401)
    }

    if (user.status !== "active") {
      throw new AppError(`Account is ${user.status}. Please contact support.`, 403)
    }

    // Check if password was changed after token was issued
    if (user.security?.lastPasswordChange) {
      const passwordChangedAt = Number.parseInt(user.security.lastPasswordChange.getTime() / 1000, 10)
      if (decoded.iat < passwordChangedAt) {
        throw new AppError("Password recently changed. Please login again.", 401)
      }
    }

    // Attach user to request
    req.user = user
    req.token = token
    next()
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new AppError("Token expired. Please refresh your token.", 401)
    }
    if (error.name === "JsonWebTokenError") {
      throw new AppError("Invalid token. Please login again.", 401)
    }
    throw error
  }
})

/**
 * Optional authentication - doesn't fail if no token
 * Useful for routes that work differently for authenticated vs anonymous users
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token

  if (req.cookies.accessToken) {
    token = req.cookies.accessToken
  } else if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1]
  }

  if (!token) {
    return next() // Continue without user
  }

  try {
    const accessSecret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET
    if (!accessSecret) {
      return next() // Continue without user if secret not configured
    }
    const decoded = jwt.verify(token, accessSecret)
    const user = await User.findById(decoded.userId).select("-password")

    if (user && user.status === "active") {
      req.user = user
    }
  } catch (error) {
    // Silently fail - continue without user
  }

  next()
})

// ============================================
// ROLE-BASED ACCESS CONTROL (RBAC)
// ============================================

/**
 * Restrict access to specific roles
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError("Authentication required", 401)
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(`Access denied. This action requires one of these roles: ${roles.join(", ")}`, 403)
    }

    next()
  }
}

/**
 * Check for specific permissions
 * @param {...string} permissions - Required permissions
 */
const requirePermissions = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError("Authentication required", 401)
    }

    // Admin has all permissions
    if (req.user.role === "admin") {
      return next()
    }

    const userPermissions = req.user.permissions || []
    const hasAllPermissions = permissions.every((p) => userPermissions.includes(p))

    if (!hasAllPermissions) {
      throw new AppError(`Access denied. Required permissions: ${permissions.join(", ")}`, 403)
    }

    next()
  }
}

/**
 * Require email verification for certain actions
 */
const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401)
  }

  if (!req.user.verification?.email?.verified) {
    throw new AppError("Email verification required to perform this action", 403)
  }

  next()
}

/**
 * Require KYC verification for certain actions (e.g., selling products)
 */
const requireKycVerification = (req, res, next) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401)
  }

  if (req.user.verification?.kyc?.status !== "approved") {
    throw new AppError("KYC verification required to perform this action", 403)
  }

  next()
}

/**
 * Resource ownership check
 * Ensures user can only access their own resources
 * @param {string} resourceField - Field name containing owner ID
 */
const requireOwnership = (resourceField = "userId") => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError("Authentication required", 401)
    }

    // Admin can access all resources
    if (req.user.role === "admin") {
      return next()
    }

    // Check if resource exists and user owns it
    const resource = req.resource // Set by previous middleware
    if (!resource) {
      throw new AppError("Resource not found", 404)
    }

    const ownerId = resource[resourceField]
    if (!ownerId || ownerId.toString() !== req.user._id.toString()) {
      throw new AppError("Access denied. You do not own this resource.", 403)
    }

    next()
  }
}

// ============================================
// RATE LIMITING BY USER
// ============================================

/**
 * Per-user rate limiting for sensitive operations
 */
const userRateLimit = (maxRequests, windowMs) => {
  const requests = new Map()

  return (req, res, next) => {
    if (!req.user) {
      return next()
    }

    const key = req.user._id.toString()
    const now = Date.now()
    const windowStart = now - windowMs

    // Get existing requests for this user
    let userRequests = requests.get(key) || []

    // Filter out old requests
    userRequests = userRequests.filter((timestamp) => timestamp > windowStart)

    if (userRequests.length >= maxRequests) {
      throw new AppError(
        `Too many requests. Please try again in ${Math.ceil((userRequests[0] + windowMs - now) / 1000)} seconds`,
        429,
      )
    }

    // Add current request
    userRequests.push(now)
    requests.set(key, userRequests)

    // Cleanup old entries periodically
    if (requests.size > 10000) {
      for (const [k, v] of requests) {
        if (v.every((t) => t <= windowStart)) {
          requests.delete(k)
        }
      }
    }

    next()
  }
}

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  requirePermissions,
  requireEmailVerification,
  requireKycVerification,
  requireOwnership,
  userRateLimit,
  isOwnerOrAdmin: authorize,
  checkPermission: requirePermissions,
  protect: authenticate,
}
