/**
 * General Helper Utilities
 * Common utility functions
 */

const crypto = require("crypto")

/**
 * Generate random string
 * @param {number} length - Length of string
 * @param {string} charset - Character set to use
 */
const generateRandomString = (length = 32, charset = "alphanumeric") => {
  const charsets = {
    alphanumeric: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    alphabetic: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    numeric: "0123456789",
    hex: "0123456789abcdef",
    urlSafe: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_",
  }

  const chars = charsets[charset] || charsets.alphanumeric
  let result = ""

  const randomBytes = crypto.randomBytes(length)
  for (let i = 0; i < length; i++) {
    result += chars[randomBytes[i] % chars.length]
  }

  return result
}

/**
 * Generate OTP
 */
const generateOTP = (length = 6) => {
  return generateRandomString(length, "numeric")
}

/**
 * Generate unique ID
 */
const generateUniqueId = (prefix = "") => {
  const timestamp = Date.now().toString(36)
  const random = generateRandomString(8, "alphanumeric").toLowerCase()
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`
}

/**
 * Generate slug from string
 */
const generateSlug = (str, maxLength = 100) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, maxLength)
}

/**
 * Generate unique slug with suffix if needed
 */
const generateUniqueSlug = async (str, Model, field = "slug") => {
  const slug = generateSlug(str)
  let counter = 0
  let uniqueSlug = slug

  while (await Model.exists({ [field]: uniqueSlug })) {
    counter++
    uniqueSlug = `${slug}-${counter}`
  }

  return uniqueSlug
}

/**
 * Hash string with SHA256
 */
const hashString = (str) => {
  return crypto.createHash("sha256").update(str).digest("hex")
}

/**
 * Sleep/delay function
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Retry function with exponential backoff
 */
const retry = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i)
        await sleep(delay)
      }
    }
  }

  throw lastError
}

/**
 * Deep clone object
 */
const deepClone = (obj) => {
  if (obj === null || typeof obj !== "object") return obj
  if (obj instanceof Date) return new Date(obj)
  if (Array.isArray(obj)) return obj.map(deepClone)

  const cloned = {}
  for (const key of Object.keys(obj)) {
    cloned[key] = deepClone(obj[key])
  }
  return cloned
}

/**
 * Deep merge objects
 */
const deepMerge = (target, ...sources) => {
  if (!sources.length) return target
  const source = sources.shift()

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} })
        deepMerge(target[key], source[key])
      } else {
        Object.assign(target, { [key]: source[key] })
      }
    }
  }

  return deepMerge(target, ...sources)
}

/**
 * Check if value is plain object
 */
const isObject = (item) => {
  return item && typeof item === "object" && !Array.isArray(item)
}

/**
 * Pick specific keys from object
 */
const pick = (obj, keys) => {
  return keys.reduce((acc, key) => {
    if (obj && Object.prototype.hasOwnProperty.call(obj, key)) {
      acc[key] = obj[key]
    }
    return acc
  }, {})
}

/**
 * Omit specific keys from object
 */
const omit = (obj, keys) => {
  return Object.keys(obj)
    .filter((key) => !keys.includes(key))
    .reduce((acc, key) => {
      acc[key] = obj[key]
      return acc
    }, {})
}

/**
 * Flatten nested object
 */
const flatten = (obj, prefix = "") => {
  return Object.keys(obj).reduce((acc, key) => {
    const pre = prefix.length ? `${prefix}.` : ""
    if (isObject(obj[key])) {
      Object.assign(acc, flatten(obj[key], `${pre}${key}`))
    } else {
      acc[`${pre}${key}`] = obj[key]
    }
    return acc
  }, {})
}

/**
 * Remove undefined/null values from object
 */
const compact = (obj) => {
  return Object.keys(obj).reduce((acc, key) => {
    if (obj[key] !== undefined && obj[key] !== null) {
      acc[key] = obj[key]
    }
    return acc
  }, {})
}

/**
 * Capitalize first letter
 */
const capitalize = (str) => {
  if (!str) return ""
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Title case string
 */
const titleCase = (str) => {
  if (!str) return ""
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => capitalize(word))
    .join(" ")
}

/**
 * Truncate string
 */
const truncate = (str, length = 100, suffix = "...") => {
  if (!str || str.length <= length) return str
  return str.substring(0, length - suffix.length) + suffix
}

/**
 * Format currency (INR)
 */
const formatCurrency = (amount, currency = "INR", locale = "en-IN") => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format number with commas (Indian system)
 */
const formatNumber = (num, locale = "en-IN") => {
  return new Intl.NumberFormat(locale).format(num)
}

/**
 * Parse number from string (handles Indian comma format)
 */
const parseNumber = (str) => {
  if (typeof str === "number") return str
  return Number.parseFloat(String(str).replace(/,/g, ""))
}

/**
 * Calculate percentage
 */
const percentage = (value, total, decimals = 2) => {
  if (!total) return 0
  return Number.parseFloat(((value / total) * 100).toFixed(decimals))
}

/**
 * Group array by key
 */
const groupBy = (arr, key) => {
  return arr.reduce((groups, item) => {
    const group = typeof key === "function" ? key(item) : item[key]
    groups[group] = groups[group] || []
    groups[group].push(item)
    return groups
  }, {})
}

/**
 * Remove duplicates from array
 */
const unique = (arr, key = null) => {
  if (!key) return [...new Set(arr)]
  const seen = new Set()
  return arr.filter((item) => {
    const val = typeof key === "function" ? key(item) : item[key]
    if (seen.has(val)) return false
    seen.add(val)
    return true
  })
}

/**
 * Chunk array into smaller arrays
 */
const chunk = (arr, size) => {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size))
}

/**
 * Shuffle array
 */
const shuffle = (arr) => {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Safe JSON parse
 */
const safeJSONParse = (str, fallback = null) => {
  try {
    return JSON.parse(str)
  } catch {
    return fallback
  }
}

/**
 * Mask sensitive data
 */
const maskData = (data, visibleChars = 4) => {
  if (!data) return ""
  const str = String(data)
  if (str.length <= visibleChars) return "*".repeat(str.length)
  return "*".repeat(str.length - visibleChars) + str.slice(-visibleChars)
}

/**
 * Mask email address
 */
const maskEmail = (email) => {
  if (!email) return ""
  const [local, domain] = email.split("@")
  const maskedLocal = local.charAt(0) + "*".repeat(Math.max(local.length - 2, 1)) + local.slice(-1)
  return `${maskedLocal}@${domain}`
}

/**
 * Mask phone number
 */
const maskPhone = (phone) => {
  if (!phone) return ""
  const str = String(phone).replace(/\D/g, "")
  if (str.length < 4) return "*".repeat(str.length)
  return "*".repeat(str.length - 4) + str.slice(-4)
}

module.exports = {
  generateRandomString,
  generateOTP,
  generateUniqueId,
  generateSlug,
  generateUniqueSlug,
  hashString,
  sleep,
  retry,
  deepClone,
  deepMerge,
  isObject,
  pick,
  omit,
  flatten,
  compact,
  capitalize,
  titleCase,
  truncate,
  formatCurrency,
  formatNumber,
  parseNumber,
  percentage,
  groupBy,
  unique,
  chunk,
  shuffle,
  safeJSONParse,
  maskData,
  maskEmail,
  maskPhone,
}
