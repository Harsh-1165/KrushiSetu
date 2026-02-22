/**
 * Server Entry Point
 * Database connection and server initialization
 */

const mongoose = require("mongoose")
const dotenv = require("dotenv")
const path = require("path")

// Load environment variables
dotenv.config({ path: path.join(__dirname, ".env") })

// Import app
const app = require("./app")
const logger = require("./utils/logger")
const { validateEnv } = require("./utils/validateEnv")
const { ensureIndexes } = require("./scripts/ensureIndexes")
const { validateMLStartup } = require("./utils/mlStartup")
const { uncaughtExceptionHandler, unhandledRejectionHandler } = require("./middleware/errorHandler")

// Validate env vars FIRST — exits immediately on critical missing vars
validateEnv()

// Handle uncaught exceptions
process.on("uncaughtException", uncaughtExceptionHandler)

// ======================
// DATABASE CONNECTION
// ======================

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/greentrace"

    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }

    await mongoose.connect(mongoURI, options)
    logger.info("MongoDB connected successfully")

    // Ensure indexes after connection (non-blocking on failure)
    await ensureIndexes()

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      logger.error("MongoDB connection error:", err)
    })

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected. Attempting to reconnect...")
    })

    mongoose.connection.on("reconnected", () => {
      logger.info("MongoDB reconnected successfully")
    })
  } catch (error) {
    logger.error("MongoDB connection failed:", error)
    process.exit(1)
  }
}

// ======================
// START SERVER
// ======================

const startServer = async () => {
  // Connect to database
  await connectDB()

  const PORT = process.env.PORT || 5000
  const HOST = process.env.HOST || "0.0.0.0"

  const server = app.listen(PORT, HOST, () => {
    logger.info(`Server running in ${process.env.NODE_ENV || "development"} mode`)
    logger.info(`Server listening on http://${HOST}:${PORT}`)
    logger.info(`API available at http://${HOST}:${PORT}/api/v1`)
  })

  // ML startup validation — runs in background, never blocks server start
  validateMLStartup().catch(err => logger.error('[ML Startup] Unexpected error:', err.message))

  // Handle unhandled promise rejections
  process.on("unhandledRejection", unhandledRejectionHandler(server))

  // Graceful shutdown
  const gracefulShutdown = (signal) => {
    logger.info(`${signal} received. Starting graceful shutdown...`)

    server.close(async () => {
      logger.info("HTTP server closed")

      try {
        await mongoose.connection.close()
        logger.info("MongoDB connection closed")
        process.exit(0)
      } catch (error) {
        logger.error("Error during shutdown:", error)
        process.exit(1)
      }
    })

    // Force close after 30 seconds
    setTimeout(() => {
      logger.error("Could not close connections in time, forcefully shutting down")
      process.exit(1)
    }, 30000)
  }

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))

  // ======================
  // SCHEDULED JOBS
  // ======================
  const cron = require("node-cron")
  const agmarknetService = require("./services/agmarknetService")

  // Schedule daily data ingestion at 12:00 AM (Midnight)
  cron.schedule("0 0 * * *", async () => {
    logger.info("Running daily Agmarknet data ingestion...")
    try {
      await agmarknetService.fetchAndStorePrices(2000)
    } catch (error) {
      logger.error("Daily ingestion failed:", error)
    }
  })

  // Optional: Run on startup if configured
  if (process.env.SEED_DATABASE === "true") {
    logger.info("Seeding database with initial data...")
    agmarknetService.fetchAndStorePrices(500).catch(err => logger.error("Startup seeding failed:", err))
  }

  process.on("SIGINT", () => gracefulShutdown("SIGINT"))
}

// Start the server
startServer()
