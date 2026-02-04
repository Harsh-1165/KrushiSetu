/**
 * Request Sanitization Middleware
 * XSS protection and input sanitization
 */

const xss = require("xss")
const mongoSanitize = require("express-mongo-sanitize")

/**
 * XSS sanitization options
 */
const xssOptions = {
  whiteList: {
    // Allow basic formatting tags for rich text fields
    a: ["href", "title", "target"],
    b: [],
    i: [],
    u: [],
    em: [],
    strong: [],
    p: [],
    br: [],
    ul: [],
    ol: [],
    li: [],
    h1: [],
    h2: [],
    h3: [],
    h4: [],
    h5: [],
    h6: [],
    blockquote: [],
    code: [],
    pre: [],
  },
  stripIgnoreTag: true,
  stripIgnoreTagBody: ["script", "style"],
}

/**
 * Recursively sanitize object values
 */
const sanitizeObject = (obj, allowHtml = false) => {
  if (obj === null || obj === undefined) return obj

  if (typeof obj === "string") {
    // Remove null bytes
    let sanitized = obj.replace(/\0/g, "")

    // XSS sanitization
    if (!allowHtml) {
      sanitized = xss(sanitized, { whiteList: {}, stripIgnoreTag: true })
    } else {
      sanitized = xss(sanitized, xssOptions)
    }

    return sanitized.trim()
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, allowHtml))
  }

  if (typeof obj === "object") {
    const sanitized = {}
    for (const [key, value] of Object.entries(obj)) {
      // Skip files and certain fields
      if (key === "password" || key === "passwordConfirm") {
        sanitized[key] = value
      } else {
        // Allow HTML in specific fields
        const htmlAllowedFields = ["content", "description", "bio", "body"]
        const allowHtmlForField = htmlAllowedFields.includes(key)
        sanitized[key] = sanitizeObject(value, allowHtmlForField)
      }
    }
    return sanitized
  }

  return obj
}

/**
 * SQL Injection patterns to detect
 */
const sqlPatterns = [
  /(%27)|(')|(--)|(%23)|(#)/i,
  /((%3D)|(=))[^\n]*((%27)|(')|(--)|(%3B)|(;))/i,
  /\w*((%27)|('))((%6F)|o|(%4F))((%72)|r|(%52))/i,
  /((%27)|('))union/i,
]

/**
 * Check for SQL injection attempts
 */
const detectSqlInjection = (value) => {
  if (typeof value !== "string") return false
  return sqlPatterns.some((pattern) => pattern.test(value))
}

/**
 * NoSQL Injection patterns
 */
const noSqlPatterns = [/\$where/i, /\$gt/i, /\$lt/i, /\$ne/i, /\$regex/i, /\$or/i, /\$and/i]

/**
 * Check for NoSQL injection in strings
 */
const detectNoSqlInjection = (value) => {
  if (typeof value !== "string") return false
  return noSqlPatterns.some((pattern) => pattern.test(value))
}

/**
 * Main sanitization middleware
 */
const sanitizeRequest = (req, res, next) => {
  // Check for injection attempts in query params
  for (const [key, value] of Object.entries(req.query)) {
    if (detectSqlInjection(value) || detectNoSqlInjection(value)) {
      return res.status(400).json({
        success: false,
        message: "Invalid characters detected in request",
      })
    }
  }

  // Sanitize request body
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body)
  }

  // Sanitize query params
  if (req.query && typeof req.query === "object") {
    req.query = sanitizeObject(req.query)
  }

  // Sanitize URL params
  if (req.params && typeof req.params === "object") {
    req.params = sanitizeObject(req.params)
  }

  next()
}

/**
 * MongoDB query sanitization middleware
 * Prevents NoSQL injection attacks
 */
const sanitizeMongoQuery = mongoSanitize({
  replaceWith: "_",
  onSanitize: ({ req, key }) => {
    console.warn(`Sanitized NoSQL injection attempt: ${key} in ${req.originalUrl}`)
  },
})

/**
 * Sanitize specific fields (for use in routes)
 */
const sanitizeFields = (fields) => (req, res, next) => {
  for (const field of fields) {
    if (req.body[field]) {
      req.body[field] = xss(req.body[field], xssOptions)
    }
  }
  next()
}

/**
 * Strip dangerous characters from filename
 */
const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\.{2,}/g, ".")
    .substring(0, 255)
}

/**
 * Sanitize URL/path
 */
const sanitizePath = (path) => {
  return path
    .replace(/\.\./g, "")
    .replace(/[<>:"|?*]/g, "")
    .replace(/\/{2,}/g, "/")
}

module.exports = {
  sanitizeRequest,
  sanitizeMongoQuery,
  sanitizeFields,
  sanitizeObject,
  sanitizeFilename,
  sanitizePath,
  detectSqlInjection,
  detectNoSqlInjection,
}
