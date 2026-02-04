/**
 * Date Formatting Utilities
 * Common date operations and formatting
 */

/**
 * Format date to ISO string
 */
const toISOString = (date) => {
  return new Date(date).toISOString()
}

/**
 * Format date to readable string
 * @param {Date|string} date - Date to format
 * @param {string} locale - Locale for formatting
 * @param {Object} options - Intl.DateTimeFormat options
 */
const formatDate = (date, locale = "en-IN", options = {}) => {
  const defaultOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  }
  return new Intl.DateTimeFormat(locale, defaultOptions).format(new Date(date))
}

/**
 * Format date with time
 */
const formatDateTime = (date, locale = "en-IN") => {
  return formatDate(date, locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Format date as relative time (e.g., "2 hours ago")
 */
const formatRelativeTime = (date) => {
  const now = new Date()
  const then = new Date(date)
  const diffInSeconds = Math.floor((now - then) / 1000)

  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
    { label: "second", seconds: 1 },
  ]

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds)
    if (count >= 1) {
      return `${count} ${interval.label}${count !== 1 ? "s" : ""} ago`
    }
  }

  return "just now"
}

/**
 * Get start of day
 */
const startOfDay = (date = new Date()) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Get end of day
 */
const endOfDay = (date = new Date()) => {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

/**
 * Get start of week (Monday)
 */
const startOfWeek = (date = new Date()) => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Get start of month
 */
const startOfMonth = (date = new Date()) => {
  const d = new Date(date)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Get start of year
 */
const startOfYear = (date = new Date()) => {
  const d = new Date(date)
  d.setMonth(0, 1)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Add days to date
 */
const addDays = (date, days) => {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

/**
 * Add months to date
 */
const addMonths = (date, months) => {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

/**
 * Check if date is today
 */
const isToday = (date) => {
  const today = new Date()
  const d = new Date(date)
  return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
}

/**
 * Check if date is in past
 */
const isPast = (date) => {
  return new Date(date) < new Date()
}

/**
 * Check if date is in future
 */
const isFuture = (date) => {
  return new Date(date) > new Date()
}

/**
 * Get difference between two dates in days
 */
const diffInDays = (date1, date2) => {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  const diffTime = Math.abs(d2 - d1)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Get difference between two dates in hours
 */
const diffInHours = (date1, date2) => {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  const diffTime = Math.abs(d2 - d1)
  return Math.ceil(diffTime / (1000 * 60 * 60))
}

/**
 * Check if date is within range
 */
const isWithinRange = (date, startDate, endDate) => {
  const d = new Date(date)
  return d >= new Date(startDate) && d <= new Date(endDate)
}

/**
 * Get date range for period
 * @param {string} period - Period name (today, week, month, year, custom)
 * @param {Date} customStart - Custom start date
 * @param {Date} customEnd - Custom end date
 */
const getDateRange = (period, customStart = null, customEnd = null) => {
  const now = new Date()

  switch (period) {
    case "today":
      return { start: startOfDay(), end: endOfDay() }
    case "yesterday":
      const yesterday = addDays(now, -1)
      return { start: startOfDay(yesterday), end: endOfDay(yesterday) }
    case "week":
      return { start: startOfWeek(), end: endOfDay() }
    case "month":
      return { start: startOfMonth(), end: endOfDay() }
    case "year":
      return { start: startOfYear(), end: endOfDay() }
    case "last7days":
      return { start: startOfDay(addDays(now, -7)), end: endOfDay() }
    case "last30days":
      return { start: startOfDay(addDays(now, -30)), end: endOfDay() }
    case "last90days":
      return { start: startOfDay(addDays(now, -90)), end: endOfDay() }
    case "custom":
      if (customStart && customEnd) {
        return { start: startOfDay(customStart), end: endOfDay(customEnd) }
      }
      return { start: startOfMonth(), end: endOfDay() }
    default:
      return { start: startOfMonth(), end: endOfDay() }
  }
}

/**
 * Format duration in milliseconds to human readable
 */
const formatDuration = (ms) => {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

/**
 * Parse Indian date string (DD/MM/YYYY)
 */
const parseIndianDate = (dateString) => {
  const [day, month, year] = dateString.split("/").map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Format to Indian date string
 */
const toIndianDate = (date) => {
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, "0")
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

module.exports = {
  toISOString,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  startOfDay,
  endOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  addDays,
  addMonths,
  isToday,
  isPast,
  isFuture,
  diffInDays,
  diffInHours,
  isWithinRange,
  getDateRange,
  formatDuration,
  parseIndianDate,
  toIndianDate,
}
