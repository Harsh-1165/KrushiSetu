/**
 * CORS Configuration Middleware
 * Cross-Origin Resource Sharing setup
 */

const cors = require("cors")

/**
 * Allowed origins based on environment
 */
const getAllowedOrigins = () => {
  const origins = [process.env.FRONTEND_URL, process.env.ADMIN_URL].filter(Boolean)

  // Add development origins
  // Allow localhost if in development mode or if NODE_ENV is unset
  if (!process.env.NODE_ENV || process.env.NODE_ENV.trim() === "development") {
    origins.push(
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173",
    )
  }

  return origins
}

/**
 * Dynamic origin validation
 */
const originValidator = (origin, callback) => {
  const allowedOrigins = getAllowedOrigins()

  // Allow requests with no origin (mobile apps, curl, Postman)
  if (!origin) {
    return callback(null, true)
  }

  // Check if origin is in allowed list
  if (allowedOrigins.includes(origin)) {
    return callback(null, true)
  }

  // Check for wildcard subdomains (e.g., *.greentrace.com)
  const wildcardDomains = process.env.CORS_WILDCARD_DOMAINS?.split(",") || []
  for (const domain of wildcardDomains) {
    const regex = new RegExp(`^https?://.*${domain.replace(".", "\\.")}$`)
    if (regex.test(origin)) {
      return callback(null, true)
    }
  }

  // Origin not allowed
  callback(new Error("Not allowed by CORS"))
}

/**
 * CORS options
 */
const corsOptions = {
  origin: originValidator,
  credentials: true, // Allow cookies
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "X-Request-ID",
    "X-CSRF-Token",
    "Accept",
    "Accept-Language",
    "Origin",
  ],
  exposedHeaders: [
    "X-Request-ID",
    "X-RateLimit-Limit",
    "X-RateLimit-Remaining",
    "X-RateLimit-Reset",
    "X-Total-Count",
    "X-Page",
    "X-Per-Page",
    "X-Total-Pages",
  ],
  maxAge: 86400, // 24 hours preflight cache
  preflightContinue: false,
  optionsSuccessStatus: 204,
}

/**
 * CORS middleware
 */
const corsMiddleware = cors(corsOptions)

/**
 * CORS error handler
 */
const corsErrorHandler = (err, req, res, next) => {
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "CORS policy does not allow access from this origin",
    })
  }
  next(err)
}

/**
 * Strict CORS for sensitive routes
 */
const strictCorsOptions = {
  ...corsOptions,
  origin: (origin, callback) => {
    const strictOrigins = [process.env.FRONTEND_URL].filter(Boolean)

    if (!origin || strictOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error("Not allowed by CORS"))
    }
  },
}

const strictCors = cors(strictCorsOptions)

module.exports = {
  corsMiddleware,
  corsErrorHandler,
  strictCors,
  corsOptions,
}
