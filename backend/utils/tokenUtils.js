/**
 * JWT Token Utilities
 * Handles token generation and verification
 */

const jwt = require("jsonwebtoken")
const AppError = require("./AppError")

const getJwtSecrets = () => {
  const base = process.env.JWT_SECRET
  return {
    access: process.env.JWT_ACCESS_SECRET || base,
    refresh: process.env.JWT_REFRESH_SECRET || base,
    email: process.env.JWT_EMAIL_SECRET || base,
    reset: process.env.JWT_RESET_SECRET || base,
  }
}

// ============================================
// TOKEN GENERATION
// ============================================

/**
 * Generate access and refresh tokens for a user
 * @param {Object} user - User document
 * @param {string} refreshExpiry - Refresh token expiry (default: '7d')
 * @returns {Object} - { accessToken, refreshToken }
 */
const generateTokens = (user, refreshExpiry = "7d") => {
  const secrets = getJwtSecrets()
  if (!secrets.access || !secrets.refresh) {
    throw new AppError("JWT secrets are not configured", 500)
  }

  // Access token payload (short-lived, contains essential info)
  const accessPayload = {
    userId: user._id,
    email: user.email,
    role: user.role,
    permissions: user.permissions || [],
  }

  // Refresh token payload (longer-lived, minimal info)
  const refreshPayload = {
    userId: user._id,
    tokenVersion: user.security?.tokenVersion || 0,
  }

  // Generate access token (15 minutes)
  const accessToken = jwt.sign(accessPayload, secrets.access, {
    expiresIn: process.env.JWT_ACCESS_EXPIRY || "15m",
    issuer: "greentrace",
    audience: "greentrace-api",
  })

  // Generate refresh token (7 days default)
  const refreshToken = jwt.sign(refreshPayload, secrets.refresh, {
    expiresIn: refreshExpiry,
    issuer: "greentrace",
    audience: "greentrace-api",
  })

  return { accessToken, refreshToken }
}

/**
 * Generate a single access token
 * @param {Object} user - User document
 * @returns {string} - Access token
 */
const generateAccessToken = (user) => {
  const secrets = getJwtSecrets()
  if (!secrets.access) {
    throw new AppError("JWT access secret is not configured", 500)
  }
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
      permissions: user.permissions || [],
    },
    secrets.access,
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRY || "15m",
      issuer: "greentrace",
      audience: "greentrace-api",
    },
  )
}

// ============================================
// TOKEN VERIFICATION
// ============================================

/**
 * Verify access token
 * @param {string} token - JWT access token
 * @returns {Object} - Decoded payload
 */
const verifyAccessToken = (token) => {
  const secrets = getJwtSecrets()
  if (!secrets.access) {
    throw new AppError("JWT access secret is not configured", 500)
  }
  try {
    return jwt.verify(token, secrets.access, {
      issuer: "greentrace",
      audience: "greentrace-api",
    })
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new AppError("Access token expired", 401)
    }
    if (error.name === "JsonWebTokenError") {
      throw new AppError("Invalid access token", 401)
    }
    throw error
  }
}

/**
 * Verify refresh token
 * @param {string} token - JWT refresh token
 * @returns {Object} - Decoded payload
 */
const verifyRefreshToken = (token) => {
  const secrets = getJwtSecrets()
  if (!secrets.refresh) {
    throw new AppError("JWT refresh secret is not configured", 500)
  }
  try {
    return jwt.verify(token, secrets.refresh, {
      issuer: "greentrace",
      audience: "greentrace-api",
    })
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new AppError("Refresh token expired", 401)
    }
    if (error.name === "JsonWebTokenError") {
      throw new AppError("Invalid refresh token", 401)
    }
    throw error
  }
}

/**
 * Decode token without verification (for debugging)
 * @param {string} token - JWT token
 * @returns {Object} - Decoded payload
 */
const decodeToken = (token) => {
  return jwt.decode(token, { complete: true })
}

// ============================================
// SPECIALIZED TOKENS
// ============================================

/**
 * Generate email verification token (JWT-based)
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @returns {string} - Verification token
 */
const generateEmailToken = (userId, email) => {
  const secrets = getJwtSecrets()
  if (!secrets.email) {
    throw new AppError("JWT email secret is not configured", 500)
  }
  return jwt.sign({ userId, email, type: "email_verification" }, secrets.email, { expiresIn: "24h" })
}

/**
 * Verify email verification token
 * @param {string} token - Email verification token
 * @returns {Object} - Decoded payload
 */
const verifyEmailToken = (token) => {
  const secrets = getJwtSecrets()
  if (!secrets.email) {
    throw new AppError("JWT email secret is not configured", 500)
  }
  try {
    const decoded = jwt.verify(token, secrets.email)
    if (decoded.type !== "email_verification") {
      throw new AppError("Invalid token type", 400)
    }
    return decoded
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new AppError("Verification link expired", 400)
    }
    throw new AppError("Invalid verification link", 400)
  }
}

/**
 * Generate password reset token (JWT-based)
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @returns {string} - Reset token
 */
const generatePasswordResetToken = (userId, email) => {
  const secrets = getJwtSecrets()
  if (!secrets.reset) {
    throw new AppError("JWT reset secret is not configured", 500)
  }
  return jwt.sign({ userId, email, type: "password_reset" }, secrets.reset, { expiresIn: "1h" })
}

/**
 * Verify password reset token
 * @param {string} token - Password reset token
 * @returns {Object} - Decoded payload
 */
const verifyPasswordResetToken = (token) => {
  const secrets = getJwtSecrets()
  if (!secrets.reset) {
    throw new AppError("JWT reset secret is not configured", 500)
  }
  try {
    const decoded = jwt.verify(token, secrets.reset)
    if (decoded.type !== "password_reset") {
      throw new AppError("Invalid token type", 400)
    }
    return decoded
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new AppError("Password reset link expired", 400)
    }
    throw new AppError("Invalid password reset link", 400)
  }
}

module.exports = {
  generateTokens,
  generateAccessToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  generateEmailToken,
  verifyEmailToken,
  generatePasswordResetToken,
  verifyPasswordResetToken,
}
