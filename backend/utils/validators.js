/**
 * Data Validation Helpers
 * Common validation functions
 */

/**
 * Email validation regex (RFC 5322)
 */
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

/**
 * Indian phone number regex
 */
const INDIAN_PHONE_REGEX = /^(?:\+91|91)?[6-9]\d{9}$/

/**
 * MongoDB ObjectId regex
 */
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/

/**
 * PIN code regex (Indian)
 */
const PIN_CODE_REGEX = /^[1-9][0-9]{5}$/

/**
 * PAN card regex
 */
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/

/**
 * Aadhaar number regex
 */
const AADHAAR_REGEX = /^[2-9]{1}[0-9]{11}$/

/**
 * GSTIN regex
 */
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/

/**
 * Validate email address
 */
const isValidEmail = (email) => {
  if (!email || typeof email !== "string") return false
  return EMAIL_REGEX.test(email.trim().toLowerCase())
}

/**
 * Validate Indian phone number
 */
const isValidPhone = (phone) => {
  if (!phone) return false
  const cleaned = String(phone).replace(/[\s-]/g, "")
  return INDIAN_PHONE_REGEX.test(cleaned)
}

/**
 * Validate MongoDB ObjectId
 */
const isValidObjectId = (id) => {
  if (!id) return false
  return OBJECT_ID_REGEX.test(String(id))
}

/**
 * Validate PIN code
 */
const isValidPinCode = (pinCode) => {
  if (!pinCode) return false
  return PIN_CODE_REGEX.test(String(pinCode))
}

/**
 * Validate PAN card number
 */
const isValidPAN = (pan) => {
  if (!pan) return false
  return PAN_REGEX.test(String(pan).toUpperCase())
}

/**
 * Validate Aadhaar number
 */
const isValidAadhaar = (aadhaar) => {
  if (!aadhaar) return false
  const cleaned = String(aadhaar).replace(/[\s-]/g, "")
  return AADHAAR_REGEX.test(cleaned)
}

/**
 * Validate GSTIN
 */
const isValidGSTIN = (gstin) => {
  if (!gstin) return false
  return GSTIN_REGEX.test(String(gstin).toUpperCase())
}

/**
 * Validate URL
 */
const isValidURL = (url) => {
  if (!url) return false
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validate date string
 */
const isValidDate = (date) => {
  if (!date) return false
  const d = new Date(date)
  return !isNaN(d.getTime())
}

/**
 * Validate date is in future
 */
const isFutureDate = (date) => {
  if (!isValidDate(date)) return false
  return new Date(date) > new Date()
}

/**
 * Validate date is in past
 */
const isPastDate = (date) => {
  if (!isValidDate(date)) return false
  return new Date(date) < new Date()
}

/**
 * Validate number is within range
 */
const isInRange = (value, min, max) => {
  const num = Number.parseFloat(value)
  if (isNaN(num)) return false
  return num >= min && num <= max
}

/**
 * Validate string length
 */
const isValidLength = (str, min, max) => {
  if (typeof str !== "string") return false
  const len = str.trim().length
  return len >= min && len <= max
}

/**
 * Validate enum value
 */
const isValidEnum = (value, allowedValues) => {
  return allowedValues.includes(value)
}

/**
 * Validate coordinates
 */
const isValidCoordinates = (lat, lng) => {
  const latitude = Number.parseFloat(lat)
  const longitude = Number.parseFloat(lng)
  return (
    !isNaN(latitude) && !isNaN(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180
  )
}

/**
 * Validate file extension
 */
const isValidFileExtension = (filename, allowedExtensions) => {
  if (!filename) return false
  const ext = filename.split(".").pop()?.toLowerCase()
  return allowedExtensions.includes(ext)
}

/**
 * Validate file size (in bytes)
 */
const isValidFileSize = (size, maxSize) => {
  return size > 0 && size <= maxSize
}

/**
 * Password strength validator
 */
const validatePasswordStrength = (password) => {
  const result = {
    isValid: false,
    score: 0,
    errors: [],
    suggestions: [],
  }

  if (!password || typeof password !== "string") {
    result.errors.push("Password is required")
    return result
  }

  // Length check
  if (password.length < 8) {
    result.errors.push("Password must be at least 8 characters long")
  } else {
    result.score += 1
    if (password.length >= 12) result.score += 1
    if (password.length >= 16) result.score += 1
  }

  // Uppercase check
  if (!/[A-Z]/.test(password)) {
    result.errors.push("Password must contain at least one uppercase letter")
    result.suggestions.push("Add an uppercase letter")
  } else {
    result.score += 1
  }

  // Lowercase check
  if (!/[a-z]/.test(password)) {
    result.errors.push("Password must contain at least one lowercase letter")
    result.suggestions.push("Add a lowercase letter")
  } else {
    result.score += 1
  }

  // Number check
  if (!/[0-9]/.test(password)) {
    result.errors.push("Password must contain at least one number")
    result.suggestions.push("Add a number")
  } else {
    result.score += 1
  }

  // Special character check
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    result.suggestions.push("Add a special character for extra security")
  } else {
    result.score += 2
  }

  // Common password check
  const commonPasswords = ["password", "123456", "qwerty", "admin", "letmein", "welcome"]
  if (commonPasswords.some((p) => password.toLowerCase().includes(p))) {
    result.errors.push("Password is too common")
    result.score = Math.max(0, result.score - 2)
  }

  // Determine strength level
  result.isValid = result.errors.length === 0
  result.strength = result.score <= 2 ? "weak" : result.score <= 4 ? "fair" : result.score <= 6 ? "good" : "strong"

  return result
}

/**
 * Sanitize and validate username
 */
const isValidUsername = (username) => {
  if (!username || typeof username !== "string") return false
  // 3-30 chars, alphanumeric, underscores, hyphens, no consecutive special chars
  const usernameRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9_-]*[a-zA-Z0-9])?$/
  return username.length >= 3 && username.length <= 30 && usernameRegex.test(username)
}

/**
 * Format and validate phone number
 */
const formatPhoneNumber = (phone) => {
  if (!phone) return null
  const cleaned = String(phone).replace(/[\s-]/g, "")

  if (!INDIAN_PHONE_REGEX.test(cleaned)) return null

  // Extract 10 digits
  const digits = cleaned.slice(-10)
  return `+91${digits}`
}

/**
 * Validate array of ObjectIds
 */
const isValidObjectIdArray = (arr) => {
  if (!Array.isArray(arr)) return false
  return arr.every(isValidObjectId)
}

module.exports = {
  EMAIL_REGEX,
  INDIAN_PHONE_REGEX,
  OBJECT_ID_REGEX,
  PIN_CODE_REGEX,
  PAN_REGEX,
  AADHAAR_REGEX,
  GSTIN_REGEX,
  isValidEmail,
  isValidPhone,
  isValidObjectId,
  isValidPinCode,
  isValidPAN,
  isValidAadhaar,
  isValidGSTIN,
  isValidURL,
  isValidDate,
  isFutureDate,
  isPastDate,
  isInRange,
  isValidLength,
  isValidEnum,
  isValidCoordinates,
  isValidFileExtension,
  isValidFileSize,
  validatePasswordStrength,
  isValidUsername,
  formatPhoneNumber,
  isValidObjectIdArray,
}
