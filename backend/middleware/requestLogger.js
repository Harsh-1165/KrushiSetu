/**
 * Request Logging Middleware
 * Logs all incoming requests with timing and details
 */

const morgan = require("morgan")
const logger = require("../utils/logger")

// Custom Morgan tokens
morgan.token("user-id", (req) => req.user?.id || "anonymous")
morgan.token("user-role", (req) => req.user?.role || "none")
morgan.token("body", (req) => {
  // Don't log sensitive data
  const sensitiveFields = ["password", "passwordConfirm", "token", "otp", "cardNumber", "cvv"]
  const body = { ...req.body }

  sensitiveFields.forEach((field) => {
    if (body[field]) body[field] = "[REDACTED]"
  })

  return JSON.stringify(body)
})
morgan.token("query", (req) => JSON.stringify(req.query))

/**
 * Development logging format
 */
const devFormat = ":method :url :status :response-time ms - :res[content-length]"

/**
 * Production logging format (JSON)
 */
const prodFormat = JSON.stringify({
  method: ":method",
  url: ":url",
  status: ":status",
  responseTime: ":response-time ms",
  contentLength: ":res[content-length]",
  userId: ":user-id",
  userRole: ":user-role",
  userAgent: ":user-agent",
  ip: ":remote-addr",
})

/**
 * Stream for Winston logger
 */
const stream = {
  write: (message) => {
    // Remove newline character
    const logMessage = message.trim()

    try {
      // Try to parse as JSON (production format)
      const logData = JSON.parse(logMessage)
      logger.http("Request", logData)
    } catch {
      // Log as plain string (development format)
      logger.http(logMessage)
    }
  },
}

/**
 * Skip logging for certain routes
 */
const skip = (req) => {
  // Skip health check and static files
  const skipPaths = ["/health", "/favicon.ico", "/robots.txt"]
  return skipPaths.some((path) => req.url.startsWith(path))
}

/**
 * Morgan middleware for development
 */
const devLogger = morgan(devFormat, { skip })

/**
 * Morgan middleware for production
 */
const prodLogger = morgan(prodFormat, { stream, skip })

/**
 * Custom request logging middleware
 * Adds request timing and additional context
 */
const requestLogger = (req, res, next) => {
  // Start timer
  req.startTime = Date.now()

  // Generate request ID
  req.requestId = req.headers["x-request-id"] || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // Add request ID to response headers
  res.setHeader("X-Request-ID", req.requestId)

  // Log request start
  logger.debug("Request started", {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  })

  // Log response on finish
  res.on("finish", () => {
    const duration = Date.now() - req.startTime
    const logLevel = res.statusCode >= 400 ? "warn" : "debug"

    logger[logLevel]("Request completed", {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id,
    })
  })

  next()
}

/**
 * Get appropriate logger based on environment
 */
const getLogger = () => {
  if (process.env.NODE_ENV === "development") {
    return devLogger
  }
  return prodLogger
}

module.exports = {
  requestLogger,
  morganLogger: getLogger(),
  devLogger,
  prodLogger,
}
