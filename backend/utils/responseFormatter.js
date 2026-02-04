/**
 * Response Formatter Utility
 * Standardized API response structure
 */

/**
 * Success response formatter
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {Object} data - Response data
 * @param {Object} meta - Additional metadata (pagination, etc.)
 */
const successResponse = (res, statusCode = 200, message = "Success", data = null, meta = null) => {
  const response = {
    success: true,
    status: "success",
    message,
  }

  if (data !== null) {
    response.data = data
  }

  if (meta !== null) {
    response.meta = meta
  }

  return res.status(statusCode).json(response)
}

/**
 * Error response formatter
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Object} errors - Validation errors array
 * @param {string} code - Error code for client handling
 */
const errorResponse = (res, statusCode = 500, message = "An error occurred", errors = null, code = null) => {
  const response = {
    success: false,
    status: statusCode >= 500 ? "error" : "fail",
    message,
  }

  if (code) {
    response.code = code
  }

  if (errors) {
    response.errors = errors
  }

  return res.status(statusCode).json(response)
}

/**
 * Paginated response formatter
 * @param {Object} res - Express response object
 * @param {Array} data - Array of items
 * @param {Object} pagination - Pagination info
 * @param {string} message - Success message
 */
const paginatedResponse = (res, data, pagination, message = "Data retrieved successfully") => {
  // Set pagination headers
  res.setHeader("X-Total-Count", pagination.total)
  res.setHeader("X-Page", pagination.page)
  res.setHeader("X-Per-Page", pagination.limit)
  res.setHeader("X-Total-Pages", pagination.totalPages)

  return res.status(200).json({
    success: true,
    status: "success",
    message,
    data,
    meta: {
      pagination: {
        total: pagination.total,
        count: data.length,
        perPage: pagination.limit,
        currentPage: pagination.page,
        totalPages: pagination.totalPages,
        hasNextPage: pagination.page < pagination.totalPages,
        hasPrevPage: pagination.page > 1,
        nextPage: pagination.page < pagination.totalPages ? pagination.page + 1 : null,
        prevPage: pagination.page > 1 ? pagination.page - 1 : null,
      },
    },
  })
}

/**
 * Created resource response (201)
 */
const createdResponse = (res, message, data) => {
  return successResponse(res, 201, message, data)
}

/**
 * No content response (204)
 */
const noContentResponse = (res) => {
  return res.status(204).send()
}

/**
 * Bad request response (400)
 */
const badRequestResponse = (res, message = "Bad request", errors = null) => {
  return errorResponse(res, 400, message, errors, "BAD_REQUEST")
}

/**
 * Unauthorized response (401)
 */
const unauthorizedResponse = (res, message = "Unauthorized access") => {
  return errorResponse(res, 401, message, null, "UNAUTHORIZED")
}

/**
 * Forbidden response (403)
 */
const forbiddenResponse = (res, message = "Access forbidden") => {
  return errorResponse(res, 403, message, null, "FORBIDDEN")
}

/**
 * Not found response (404)
 */
const notFoundResponse = (res, message = "Resource not found") => {
  return errorResponse(res, 404, message, null, "NOT_FOUND")
}

/**
 * Conflict response (409)
 */
const conflictResponse = (res, message = "Resource already exists") => {
  return errorResponse(res, 409, message, null, "CONFLICT")
}

/**
 * Validation error response (422)
 */
const validationErrorResponse = (res, errors, message = "Validation failed") => {
  return errorResponse(res, 422, message, errors, "VALIDATION_ERROR")
}

/**
 * Too many requests response (429)
 */
const rateLimitResponse = (res, message = "Too many requests, please try again later") => {
  return errorResponse(res, 429, message, null, "RATE_LIMIT_EXCEEDED")
}

/**
 * Internal server error response (500)
 */
const serverErrorResponse = (res, message = "Internal server error") => {
  return errorResponse(res, 500, message, null, "INTERNAL_ERROR")
}

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
  createdResponse,
  noContentResponse,
  badRequestResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  conflictResponse,
  validationErrorResponse,
  rateLimitResponse,
  serverErrorResponse,
}
