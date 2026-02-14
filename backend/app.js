/**
 * Express Application Setup
 * Main application configuration with all middleware
 */

const express = require("express")
const helmet = require("helmet")
const compression = require("compression")
const cookieParser = require("cookie-parser")
const mongoSanitize = require("express-mongo-sanitize")
const hpp = require("hpp")
const path = require("path")

// Import middleware
const { corsMiddleware, corsErrorHandler } = require("./middleware/corsConfig")
const { requestLogger, morganLogger } = require("./middleware/requestLogger")
const { sanitizeRequest, sanitizeMongoQuery } = require("./middleware/sanitizer")
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler")
const { apiLimiter } = require("./middleware/rateLimiter")

// Import routes
const authRoutes = require("./routes/auth")
const userRoutes = require("./routes/users")
const productRoutes = require("./routes/products")
const advisoryRoutes = require("./routes/advisory")
const mandiRoutes = require("./routes/mandi")
const searchRoutes = require("./routes/search")
const uploadRoutes = require("./routes/uploads")
const orderRoutes = require("./routes/orders")
const expertRoutes = require("./routes/expert")
const cartRoutes = require("./routes/cart")
const articleRoutes = require("./routes/articles")
const aiFeedbackRoutes = require("./routes/aiFeedback")

// Initialize Express app
const app = express()

// ======================
// SECURITY MIDDLEWARE
// ======================

// Set security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
)

// Enable CORS
app.use(corsMiddleware)
app.use(corsErrorHandler)

// ======================
// PARSING MIDDLEWARE
// ======================

// Body parser - reading data from body into req.body
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: true, limit: "50mb" }))

// Cookie parser
app.use(cookieParser())

// ======================
// SANITIZATION MIDDLEWARE
// ======================

// Data sanitization against NoSQL query injection
app.use(sanitizeMongoQuery)

// Data sanitization against XSS
app.use(sanitizeRequest)

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      "price",
      "rating",
      "category",
      "sort",
      "fields",
      "page",
      "limit",
      "minPrice",
      "maxPrice",
      "state",
      "district",
    ],
  }),
)

// ======================
// PERFORMANCE MIDDLEWARE
// ======================

// Compression
app.use(
  compression({
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) return false
      return compression.filter(req, res)
    },
    level: 6,
  }),
)

// ======================
// LOGGING MIDDLEWARE
// ======================

// Request logging
app.use(requestLogger)
app.use(morganLogger)

// ======================
// RATE LIMITING
// ======================

// Apply general rate limiter to all requests
app.use("/api", apiLimiter)

// ======================
// STATIC FILES
// ======================

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// ======================
// HEALTH CHECK
// ======================

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  })
})

// ======================
// API ROUTES
// ======================

// Mount routes
app.use("/api/v1/auth", authRoutes)
app.use("/api/v1/users", userRoutes)
app.use("/api/v1/products", productRoutes)
app.use("/api/v1/advisory", advisoryRoutes)
app.use("/api/v1/mandi", mandiRoutes)
app.use("/api/v1/search", searchRoutes)
app.use("/api/v1/uploads", uploadRoutes)
app.use("/api/v1/orders", orderRoutes)
app.use("/api/v1/expert", expertRoutes)
app.use("/api/v1/cart", cartRoutes)
app.use("/api/v1/articles", articleRoutes)
app.use("/api/v1/ai-feedback", aiFeedbackRoutes)

// ======================
// ERROR HANDLING
// ======================

// Handle 404 - Route not found
app.use(notFoundHandler)

// Global error handler
app.use(errorHandler)

module.exports = app
