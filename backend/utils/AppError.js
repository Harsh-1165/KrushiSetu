/**
 * Custom Application Error Class
 * Extends Error with HTTP status codes and operational flags
 */

class AppError extends Error {
  /**
   * Create an application error
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {Object} options - Additional options
   */
  constructor(message, statusCode = 500, options = {}) {
    super(message)

    this.statusCode = statusCode
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error"
    this.isOperational = true // Distinguishes from programming errors
    this.code = options.code || null
    this.errors = options.errors || null // For validation errors

    Error.captureStackTrace(this, this.constructor)
  }

  /**
   * Create a 400 Bad Request error
   */
  static badRequest(message = "Bad request", options = {}) {
    return new AppError(message, 400, options)
  }

  /**
   * Create a 401 Unauthorized error
   */
  static unauthorized(message = "Unauthorized", options = {}) {
    return new AppError(message, 401, options)
  }

  /**
   * Create a 403 Forbidden error
   */
  static forbidden(message = "Forbidden", options = {}) {
    return new AppError(message, 403, options)
  }

  /**
   * Create a 404 Not Found error
   */
  static notFound(message = "Resource not found", options = {}) {
    return new AppError(message, 404, options)
  }

  /**
   * Create a 409 Conflict error
   */
  static conflict(message = "Resource already exists", options = {}) {
    return new AppError(message, 409, options)
  }

  /**
   * Create a 422 Unprocessable Entity error
   */
  static unprocessable(message = "Unprocessable entity", options = {}) {
    return new AppError(message, 422, options)
  }

  /**
   * Create a 429 Too Many Requests error
   */
  static tooManyRequests(message = "Too many requests", options = {}) {
    return new AppError(message, 429, options)
  }

  /**
   * Create a 500 Internal Server Error
   */
  static internal(message = "Internal server error", options = {}) {
    return new AppError(message, 500, options)
  }

  /**
   * Convert error to JSON response
   */
  toJSON() {
    return {
      success: false,
      error: {
        message: this.message,
        code: this.code,
        ...(this.errors && { errors: this.errors }),
      },
    }
  }
}

module.exports = AppError
