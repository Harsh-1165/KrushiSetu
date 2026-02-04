/**
 * Request Validation Middleware
 * Validates incoming request data for user management routes
 *
 * @module middleware/validators
 */

const { body, param, query, validationResult } = require("express-validator")
const mongoose = require("mongoose")
const AppError = require("../utils/AppError")

/**
 * Process validation results and throw error if invalid
 */
const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }))

    return res.status(400).json({
      success: false,
      error: "Validation failed",
      details: errorMessages,
    })
  }
  next()
}

/**
 * Validate MongoDB ObjectId parameter
 */
const validateObjectId = (paramName) => [
  param(paramName).custom((value) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new Error(`Invalid ${paramName} format`)
    }
    return true
  }),
  validate,
]

/**
 * Validate pagination query parameters
 */
const validatePagination = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  query("sortOrder").optional().isIn(["asc", "desc"]).withMessage("Sort order must be asc or desc"),
  validate,
]

/**
 * Validate user profile update request
 */
const validateUserUpdate = [
  body("profile.firstName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be 2-50 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage("First name contains invalid characters"),

  body("profile.lastName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be 2-50 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage("Last name contains invalid characters"),

  body("profile.bio").optional().trim().isLength({ max: 500 }).withMessage("Bio must not exceed 500 characters"),

  body("phone")
    .optional()
    .matches(/^[+]?[0-9]{10,15}$/)
    .withMessage("Invalid phone number format"),

  body("profile.address.street").optional().trim().isLength({ max: 200 }).withMessage("Street address too long"),

  body("profile.address.city")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("City must be 2-100 characters"),

  body("profile.address.state")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("State must be 2-100 characters"),

  body("profile.address.pincode")
    .optional()
    .matches(/^[0-9]{5,10}$/)
    .withMessage("Invalid pincode format"),

  body("profile.location.lat")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be between -90 and 90"),

  body("profile.location.lng")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be between -180 and 180"),

  // Farmer profile validations
  body("farmerProfile.landSize")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Land size must be a positive number"),

  body("farmerProfile.landUnit")
    .optional()
    .isIn(["acres", "hectares", "bigha", "gunta"])
    .withMessage("Invalid land unit"),

  body("farmerProfile.cropTypes").optional().isArray().withMessage("Crop types must be an array"),

  body("farmerProfile.farmingType")
    .optional()
    .isIn(["organic", "conventional", "mixed", "hydroponic", "permaculture"])
    .withMessage("Invalid farming type"),

  // Expert profile validations
  body("expertProfile.specializations")
    .optional()
    .isArray({ min: 1 })
    .withMessage("At least one specialization required"),

  body("expertProfile.experience").optional().isInt({ min: 0, max: 70 }).withMessage("Experience must be 0-70 years"),

  body("expertProfile.qualifications").optional().isArray().withMessage("Qualifications must be an array"),

  // Notification preferences
  body("notificationPreferences.email")
    .optional()
    .isBoolean()
    .withMessage("Email preference must be boolean"),

  body("notificationPreferences.push").optional().isBoolean().withMessage("Push preference must be boolean"),

  body("notificationPreferences.sms").optional().isBoolean().withMessage("SMS preference must be boolean"),

  validate,
]

/**
 * Validate location parameters
 */
const validateLocation = [
  param("lat").isFloat({ min: -90, max: 90 }).withMessage("Latitude must be between -90 and 90"),
  param("lng").isFloat({ min: -180, max: 180 }).withMessage("Longitude must be between -180 and 180"),
  query("radius").optional().isFloat({ min: 1, max: 500 }).withMessage("Radius must be between 1 and 500 km"),
  validate,
]

/**
 * Validate verification status update
 */
const validateVerification = [
  body("kycStatus").optional().isIn(["pending", "submitted", "verified", "rejected"]).withMessage("Invalid KYC status"),

  body("isVerified").optional().isBoolean().withMessage("isVerified must be boolean"),

  body("verificationNotes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Notes must not exceed 1000 characters"),

  body("rejectionReason")
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage("Rejection reason must be 10-500 characters"),

  validate,
]

/**
 * Validate registration request
 */
const validateRegistration = [
  body("email").trim().isEmail().normalizeEmail().withMessage("Valid email is required"),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage("Password must contain uppercase, lowercase, number, and special character"),

  body("role").isIn(["farmer", "expert", "consumer"]).withMessage("Role must be farmer, expert, or consumer"),

  body("profile.firstName").trim().isLength({ min: 2, max: 50 }).withMessage("First name must be 2-50 characters"),

  body("profile.lastName").trim().isLength({ min: 2, max: 50 }).withMessage("Last name must be 2-50 characters"),

  body("phone")
    .optional()
    .matches(/^[+]?[0-9]{10,15}$/)
    .withMessage("Invalid phone number"),

  validate,
]

/**
 * Validate login request
 */
const validateLogin = [
  body("email").trim().isEmail().normalizeEmail().withMessage("Valid email is required"),

  body("password").notEmpty().withMessage("Password is required"),

  validate,
]

/**
 * Validate password reset request
 */
const validatePasswordReset = [
  body("token").notEmpty().withMessage("Reset token is required"),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage("Password must contain uppercase, lowercase, number, and special character"),

  validate,
]

module.exports = {
  validate,
  validateObjectId,
  validatePagination,
  validateUserUpdate,
  validateLocation,
  validateVerification,
  validateRegistration,
  validateLogin,
  validatePasswordReset,
}
