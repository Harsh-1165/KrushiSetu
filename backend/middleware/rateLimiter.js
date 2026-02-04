/**
 * Rate Limiting Middleware
 * Protects against brute force and DDoS attacks
 */

const rateLimit = require("express-rate-limit")

// ============================================
// NOTE: Redis is disabled for local development
// For production, uncomment and configure Redis
// ============================================

// let redisClient = null
// let RedisStore = null

// // Initialize Redis if URL is provided
// if (process.env.REDIS_URL) {
//   try {
//     const Redis = require("ioredis")
//     RedisStore = require("rate-limit-redis")
//     redisClient = new Redis(process.env.REDIS_URL)
//   } catch (error) {
//     console.warn("Redis not available, using memory store:", error.message)
//   }
// }

/**
 * Create rate limiter with in-memory store
 * For production, configure Redis for distributed rate limiting
 */
const createLimiter = (options) => {
  const config = {
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: "Too many requests. Please try again later.",
    },
    ...options,
  }

  // Note: Using default in-memory store for development
  // In production, configure Redis store for distributed systems
  // if (redisClient && RedisStore) {
  //   config.store = new RedisStore({
  //     client: redisClient,
  //     prefix: "rl:",
  //   })
  // }

  return rateLimit(config)
}

// ============================================
// RATE LIMITERS
// ============================================

/**
 * General API rate limiter
 * 1000 requests per 15 minutes (Relaxed for dev)
 */
const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: {
    success: false,
    error: "Too many API requests. Please try again in 15 minutes.",
  },
})

/**
 * Authentication rate limiter (stricter)
 * 50 attempts per 15 minutes per IP (Relaxed for dev)
 */
const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: {
    success: false,
    error: "Too many authentication attempts. Please try again in 15 minutes.",
  },
  skipSuccessfulRequests: true, // Don't count successful logins
})

/**
 * Password reset rate limiter
 * 30 attempts per hour per IP (Relaxed for dev)
 */
const passwordResetLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  message: {
    success: false,
    error: "Too many password reset requests. Please try again in 1 hour.",
  },
})

/**
 * Account creation rate limiter
 * 30 accounts per hour per IP (Relaxed for dev)
 */
const registrationLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  message: {
    success: false,
    error: "Too many accounts created from this IP. Please try again in 1 hour.",
  },
})

/**
 * File upload rate limiter
 * 200 uploads per hour (Relaxed for dev)
 */
const uploadLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 200,
  message: {
    success: false,
    error: "Too many file uploads. Please try again later.",
  },
})

/**
 * Search rate limiter
 * 300 searches per minute (Relaxed for dev)
 */
const searchLimiter = createLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 300,
  message: {
    success: false,
    error: "Too many search requests. Please slow down.",
  },
})

/**
 * Strict limiter for sensitive operations
 * 3 attempts per 30 minutes
 */
const strictLimiter = createLimiter({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 3,
  message: {
    success: false,
    error: "Too many attempts. Please try again in 30 minutes.",
  },
})

module.exports = {
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
  registrationLimiter,
  uploadLimiter,
  searchLimiter,
  strictLimiter,
  createLimiter,
}
