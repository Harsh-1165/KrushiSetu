/**
 * Async Handler Utility
 * Wraps async functions to catch errors and pass them to Express error handler
 */

/**
 * Wrap an async function to handle errors
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Express middleware function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

module.exports = { asyncHandler }
module.exports.default = asyncHandler
