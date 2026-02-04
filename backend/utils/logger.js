/**
 * Logger utility for GreenTrace
 * Provides structured logging with different log levels
 */

const winston = require("winston")
const path = require("path")

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`

    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`
    }

    if (stack) {
      log += `\n${stack}`
    }

    return log
  }),
)

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(winston.format.colorize(), logFormat),
  }),
]

// Add file transports in production
if (process.env.NODE_ENV === "production") {
  transports.push(
    // Error log file
    new winston.transports.File({
      filename: path.join(__dirname, "../logs/error.log"),
      level: "error",
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    // Combined log file
    new winston.transports.File({
      filename: path.join(__dirname, "../logs/combined.log"),
      maxsize: 10485760,
      maxFiles: 10,
    }),
  )
}

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: logFormat,
  transports,
  exitOnError: false,
})

// Add stream for Morgan HTTP logging
logger.stream = {
  write: (message) => {
    logger.http(message.trim())
  },
}

module.exports = logger
