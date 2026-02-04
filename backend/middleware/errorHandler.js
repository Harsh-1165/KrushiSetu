/**
 * Global Error Handling Middleware
 * Centralized error handling with logging and formatted responses
 */

const AppError = require("../utils/AppError")
const logger = require("../utils/logger")
const fs = require("fs")
const path = require("path")

/**
 * Handle MongoDB Cast Errors (invalid ObjectId)
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`
  return new AppError(message, 400)
}

/**
 * Handle MongoDB Duplicate Key Errors
 */
const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0]
  const value = err.keyValue[field]
  const message = `${field} "${value}" already exists. Please use a different value.`
  return new AppError(message, 409)
}

/**
 * Handle MongoDB Validation Errors
 */
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => ({
    field: el.path,
    message: el.message,
    value: el.value,
  }))
  const message = `Validation failed: ${errors.map((e) => e.message).join(". ")}`
  const error = new AppError(message, 400)
  error.errors = errors
  return error
}

/**
 * Handle JWT Errors
 */
const handleJWTError = () => new AppError("Invalid token. Please log in again.", 401)

const handleJWTExpiredError = () => new AppError("Your token has expired. Please log in again.", 401)

/**
 * Handle Multer Errors
 */
const handleMulterError = (err) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return new AppError("File too large. Maximum size allowed is 5MB.", 400)
  }
  if (err.code === "LIMIT_FILE_COUNT") {
    return new AppError("Too many files. Maximum 10 files allowed.", 400)
  }
  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return new AppError(`Unexpected field: ${err.field}`, 400)
  }
  return new AppError(err.message, 400)
}

/**
 * Send error response in development
 */
const sendErrorDev = (err, req, res) => {
  // API Error
  if (req.originalUrl.startsWith("/api")) {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
      errors: err.errors || undefined,
    })
  }

  // Rendered Website Error
  console.error("ERROR 💥", err)
  return res.status(err.statusCode).render("error", {
    title: "Something went wrong!",
    msg: err.message,
  })
}

/**
 * Send error response in production
 */
const sendErrorProd = (err, req, res) => {
  // API Error
  if (req.originalUrl.startsWith("/api")) {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        success: false,
        status: err.status,
        message: err.message,
        code: err.code || undefined,
        errors: err.errors || undefined,
      })
    }

    // Programming or other unknown error: don't leak error details
    logger.error("ERROR 💥", { error: err, stack: err.stack })

    return res.status(500).json({
      success: false,
      status: "error",
      message: "Something went wrong. Please try again later.",
    })
  }

  // Rendered Website Error
  if (err.isOperational) {
    return res.status(err.statusCode).render("error", {
      title: "Something went wrong!",
      msg: err.message,
    })
  }

  logger.error("ERROR 💥", { error: err, stack: err.stack })
  return res.status(err.statusCode).render("error", {
    title: "Something went wrong!",
    msg: "Please try again later.",
  })
}

/**
 * Treat Cloudinary/upload errors as 503 with a clear message
 */
const normalizeUploadError = (err, req) => {
  if (!req.originalUrl.includes("/products")) return err
  const msg = (err.message || "").toLowerCase()
  if (
    msg.includes("cloudinary") ||
    msg.includes("invalid") && (msg.includes("key") || msg.includes("credential") || msg.includes("api"))
  ) {
    err.statusCode = 503
    err.message =
      `Image upload failed (${err.message}). Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend .env.`
  }
  return err
}

/**
 * Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  const normalized = normalizeUploadError(err, req)
  normalized.statusCode = normalized.statusCode || 500
  normalized.status = normalized.status || "error"

  // Log error
  logger.error(`${normalized.statusCode} - ${normalized.message}`, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id,
    error: normalized.stack,
  })

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(normalized, req, res)
  } else {
    let error = { ...normalized }
    error.message = normalized.message
    error.name = normalized.name

    // Handle specific error types
    if (normalized.name === "CastError") error = handleCastErrorDB(normalized)
    if (normalized.code === 11000) error = handleDuplicateFieldsDB(normalized)
    if (normalized.name === "ValidationError") error = handleValidationErrorDB(normalized)
    if (normalized.name === "JsonWebTokenError") error = handleJWTError()
    if (normalized.name === "TokenExpiredError") error = handleJWTExpiredError()
    if (normalized.name === "MulterError") error = handleMulterError(normalized)

    sendErrorProd(error, req, res)
  }
}

/**
 * Handle 404 Not Found
 */
const notFoundHandler = (req, res, next) => {
  const err = new AppError(`Cannot find ${req.originalUrl} on this server`, 404)
  next(err)
}

/**
 * Handle Uncaught Exceptions
 */
const uncaughtExceptionHandler = (err) => {
  logger.error("UNCAUGHT EXCEPTION! 💥 Shutting down...", {
    name: err.name,
    message: err.message,
    stack: err.stack,
  })
  process.exit(1)
}

/**
 * Handle Unhandled Promise Rejections
 */
const unhandledRejectionHandler = (server) => (reason, promise) => {
  logger.error("UNHANDLED REJECTION! 💥 Shutting down...", {
    reason: reason?.message || reason,
    stack: reason?.stack,
  })
  server.close(() => {
    process.exit(1)
  })
}

module.exports = {
  errorHandler,
  notFoundHandler,
  uncaughtExceptionHandler,
  unhandledRejectionHandler,
}
