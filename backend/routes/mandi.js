/**
 * Mandi Prices & Market Intelligence API
 * Real-time market prices, trends, predictions, and alerts
 */

const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")
const { body, query, param, validationResult } = require("express-validator")

const MandiPrice = require("../models/MandiPrice")
const Mandi = require("../models/Mandi")
const PriceAlert = require("../models/PriceAlert")
const { protect, authorize } = require("../middleware/auth")
const { asyncHandler } = require("../utils/asyncHandler")
const AppError = require("../utils/AppError")
const { sendEmail } = require("../utils/email")

// =============================================================================
// VALIDATION MIDDLEWARE
// =============================================================================

const validatePriceQuery = [
  query("crop").optional().isString().trim(),
  query("variety").optional().isString().trim(),
  query("mandi").optional().isMongoId().withMessage("Invalid mandi ID"),
  query("state").optional().isString().trim(),
  query("district").optional().isString().trim(),
  query("minPrice").optional().isFloat({ min: 0 }),
  query("maxPrice").optional().isFloat({ min: 0 }),
  query("date").optional().isISO8601().toDate(),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("sortBy").optional().isIn(["price", "arrival", "date", "crop"]),
  query("sortOrder").optional().isIn(["asc", "desc"]),
]

const validateAlert = [
  body("crop").notEmpty().withMessage("Crop name is required").trim(),
  body("variety").optional().isString().trim(),
  body("mandi").optional().isMongoId().withMessage("Invalid mandi ID"),
  body("state").optional().isString().trim(),
  body("condition").isIn(["above", "below", "equals"]).withMessage("Invalid condition"),
  body("targetPrice").isFloat({ min: 0 }).withMessage("Valid target price is required"),
  body("priceType").optional().isIn(["modal", "min", "max"]).default("modal"),
  body("notifyVia").optional().isArray(),
  body("notifyVia.*").optional().isIn(["email", "sms", "push"]),
  body("expiresAt").optional().isISO8601().toDate(),
]

const validateCompare = [
  query("crop").notEmpty().withMessage("Crop name is required"),
  query("mandis")
    .optional()
    .isString(), // Comma-separated mandi IDs
  query("states")
    .optional()
    .isString(), // Comma-separated state names
  query("period").optional().isIn(["today", "7d", "30d"]).default("today"),
]

// Validation error handler
const handleValidation = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    })
  }
  next()
}

// =============================================================================
// PRICE ROUTES
// =============================================================================

/**
 * @route   GET /api/mandi/prices
 * @desc    Get current mandi prices with filters
 * @access  Public
 */
router.get(
  "/prices",
  validatePriceQuery,
  handleValidation,
  asyncHandler(async (req, res) => {
    const {
      crop,
      variety,
      mandi,
      state,
      district,
      minPrice,
      maxPrice,
      date,
      lat,
      lng,
      radius = 100, // km
      page = 1,
      limit = 20,
      sortBy = "date",
      sortOrder = "desc",
    } = req.query

    // Build query
    const query = { isActive: true }

    if (crop) {
      query.crop = new RegExp(crop, "i")
    }

    if (variety) {
      query.variety = new RegExp(variety, "i")
    }

    if (mandi) {
      query.mandi = mandi
    }

    if (state) {
      query.state = new RegExp(state, "i")
    }

    if (district) {
      query.district = new RegExp(district, "i")
    }

    if (minPrice || maxPrice) {
      query.modalPrice = {}
      if (minPrice) query.modalPrice.$gte = Number.parseFloat(minPrice)
      if (maxPrice) query.modalPrice.$lte = Number.parseFloat(maxPrice)
    }

    // Date filter - get prices for specific date or today
    if (date) {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)
      query.priceDate = { $gte: startOfDay, $lte: endOfDay }
    } else {
      // Get latest prices (within last 24 hours)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      query.priceDate = { $gte: yesterday }
    }

    // Geospatial query
    if (lat && lng) {
      query["mandiDetails.location"] = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number.parseFloat(lng), Number.parseFloat(lat)],
          },
          $maxDistance: Number.parseInt(radius) * 1000, // Convert km to meters
        },
      }
    }

    // Sort options
    const sortOptions = {}
    sortOptions[sortBy === "price" ? "modalPrice" : sortBy] = sortOrder === "asc" ? 1 : -1

    // Execute query with pagination
    const skip = (page - 1) * limit

    const [prices, total] = await Promise.all([
      MandiPrice.find(query)
        .populate("mandi", "name state district location")
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      MandiPrice.countDocuments(query),
    ])

    // Add trend indicators
    const pricesWithTrends = prices.map((price) => ({
      ...price,
      trendIndicator: getTrendIndicator(price.priceChange24h),
    }))

    res.status(200).json({
      success: true,
      data: pricesWithTrends,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    })
  }),
)

/**
 * @route   GET /api/mandi/prices/:id
 * @desc    Get specific price details
 * @access  Public
 */
router.get(
  "/prices/:id",
  asyncHandler(async (req, res) => {
    const price = await MandiPrice.findById(req.params.id).populate("mandi").lean()

    if (!price) {
      throw new AppError("Price record not found", 404)
    }

    // Get historical prices for this crop at this mandi (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const historicalPrices = await MandiPrice.find({
      crop: price.crop,
      variety: price.variety,
      mandi: price.mandi._id,
      priceDate: { $gte: thirtyDaysAgo },
    })
      .select("priceDate minPrice maxPrice modalPrice arrivalQuantity")
      .sort({ priceDate: -1 })
      .limit(30)
      .lean()

    // Calculate statistics
    const stats = calculatePriceStats(historicalPrices)

    res.status(200).json({
      success: true,
      data: {
        ...price,
        historicalPrices,
        statistics: stats,
      },
    })
  }),
)

// =============================================================================
// TRENDS ROUTES
// =============================================================================

/**
 * @route   GET /api/mandi/trends
 * @desc    Get price trends for specified period
 * @access  Public
 */
router.get(
  "/trends",
  asyncHandler(async (req, res) => {
    const {
      crop,
      variety,
      mandi,
      state,
      period = "7d", // 24h, 7d, 30d, 90d, 1y
    } = req.query

    if (!crop) {
      throw new AppError("Crop name is required", 400)
    }

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()

    switch (period) {
      case "24h":
        startDate.setHours(startDate.getHours() - 24)
        break
      case "7d":
        startDate.setDate(startDate.getDate() - 7)
        break
      case "30d":
        startDate.setDate(startDate.getDate() - 30)
        break
      case "90d":
        startDate.setDate(startDate.getDate() - 90)
        break
      case "1y":
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
      default:
        startDate.setDate(startDate.getDate() - 7)
    }

    // Build match query
    const matchQuery = {
      crop: new RegExp(crop, "i"),
      priceDate: { $gte: startDate, $lte: endDate },
    }

    if (variety) matchQuery.variety = new RegExp(variety, "i")
    if (mandi) matchQuery.mandi = new mongoose.Types.ObjectId(mandi)
    if (state) matchQuery.state = new RegExp(state, "i")

    // Aggregate trends
    const groupBy = getGroupByPeriod(period)

    const trends = await MandiPrice.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: groupBy,
          avgMinPrice: { $avg: "$minPrice" },
          avgMaxPrice: { $avg: "$maxPrice" },
          avgModalPrice: { $avg: "$modalPrice" },
          totalArrival: { $sum: "$arrivalQuantity" },
          priceCount: { $sum: 1 },
          highestPrice: { $max: "$maxPrice" },
          lowestPrice: { $min: "$minPrice" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.hour": 1 } },
    ])

    // Format trends data
    const formattedTrends = formatTrendsData(trends, period)

    // Calculate overall statistics
    const overallStats = await MandiPrice.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          avgPrice: { $avg: "$modalPrice" },
          minPrice: { $min: "$minPrice" },
          maxPrice: { $max: "$maxPrice" },
          totalArrival: { $sum: "$arrivalQuantity" },
          recordCount: { $sum: 1 },
        },
      },
    ])

    // Calculate price change
    const firstPrice = formattedTrends[0]?.avgModalPrice || 0
    const lastPrice = formattedTrends[formattedTrends.length - 1]?.avgModalPrice || 0
    const priceChange = firstPrice ? (((lastPrice - firstPrice) / firstPrice) * 100).toFixed(2) : 0

    res.status(200).json({
      success: true,
      data: {
        crop,
        variety: variety || "All varieties",
        period,
        startDate,
        endDate,
        trends: formattedTrends,
        statistics: {
          ...overallStats[0],
          priceChange: Number.parseFloat(priceChange),
          trend: priceChange > 0 ? "up" : priceChange < 0 ? "down" : "stable",
        },
      },
    })
  }),
)

// =============================================================================
// MARKET (MANDI) ROUTES
// =============================================================================

/**
 * @route   GET /api/mandi/markets
 * @desc    Get list of all mandis
 * @access  Public
 */
router.get(
  "/markets",
  asyncHandler(async (req, res) => {
    const { state, district, search, lat, lng, radius = 100, page = 1, limit = 50 } = req.query

    const query = { isActive: true }

    if (state) {
      query.state = new RegExp(state, "i")
    }

    if (district) {
      query.district = new RegExp(district, "i")
    }

    if (search) {
      query.$or = [
        { name: new RegExp(search, "i") },
        { state: new RegExp(search, "i") },
        { district: new RegExp(search, "i") },
      ]
    }

    // Geospatial query for nearby mandis
    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number.parseFloat(lng), Number.parseFloat(lat)],
          },
          $maxDistance: Number.parseInt(radius) * 1000,
        },
      }
    }

    const skip = (page - 1) * limit

    const [mandis, total] = await Promise.all([
      Mandi.find(query)
        .select("name state district location address contactInfo commodities operatingDays")
        .skip(skip)
        .limit(Number.parseInt(limit))
        .lean(),
      Mandi.countDocuments(query),
    ])

    // Get today's price count for each mandi
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const mandisWithStats = await Promise.all(
      mandis.map(async (mandi) => {
        const priceCount = await MandiPrice.countDocuments({
          mandi: mandi._id,
          priceDate: { $gte: today },
        })
        return {
          ...mandi,
          todayPriceCount: priceCount,
        }
      }),
    )

    res.status(200).json({
      success: true,
      data: mandisWithStats,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    })
  }),
)

/**
 * @route   GET /api/mandi/markets/:id
 * @desc    Get specific mandi details
 * @access  Public
 */
router.get(
  "/markets/:id",
  asyncHandler(async (req, res) => {
    const mandi = await Mandi.findById(req.params.id).lean()

    if (!mandi) {
      throw new AppError("Mandi not found", 404)
    }

    // Get today's prices for this mandi
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayPrices = await MandiPrice.find({
      mandi: mandi._id,
      priceDate: { $gte: today },
    })
      .select("crop variety minPrice maxPrice modalPrice arrivalQuantity priceChange24h")
      .sort({ crop: 1 })
      .lean()

    // Get top commodities by arrival
    const topCommodities = await MandiPrice.aggregate([
      {
        $match: {
          mandi: new mongoose.Types.ObjectId(mandi._id),
          priceDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: "$crop",
          totalArrival: { $sum: "$arrivalQuantity" },
          avgPrice: { $avg: "$modalPrice" },
          priceCount: { $sum: 1 },
        },
      },
      { $sort: { totalArrival: -1 } },
      { $limit: 10 },
    ])

    res.status(200).json({
      success: true,
      data: {
        ...mandi,
        todayPrices,
        topCommodities,
        statistics: {
          todayPriceCount: todayPrices.length,
          totalCommodities: topCommodities.length,
        },
      },
    })
  }),
)

/**
 * @route   GET /api/mandi/markets/states
 * @desc    Get list of all states with mandi counts
 * @access  Public
 */
router.get(
  "/markets/states",
  asyncHandler(async (req, res) => {
    const states = await Mandi.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$state",
          mandiCount: { $sum: 1 },
          districts: { $addToSet: "$district" },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          state: "$_id",
          mandiCount: 1,
          districtCount: { $size: "$districts" },
          _id: 0,
        },
      },
    ])

    res.status(200).json({
      success: true,
      data: states,
    })
  }),
)

// =============================================================================
// PREDICTIONS ROUTES
// =============================================================================

/**
 * @route   GET /api/mandi/predictions
 * @desc    Get AI-based price predictions
 * @access  Public
 */
router.get(
  "/predictions",
  asyncHandler(async (req, res) => {
    const {
      crop,
      variety,
      mandi,
      state,
      days = 7, // Predict for next N days
    } = req.query

    if (!crop) {
      throw new AppError("Crop name is required", 400)
    }

    // Get historical data for prediction (last 90 days)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const matchQuery = {
      crop: new RegExp(crop, "i"),
      priceDate: { $gte: ninetyDaysAgo },
    }

    if (variety) matchQuery.variety = new RegExp(variety, "i")
    if (mandi) matchQuery.mandi = new mongoose.Types.ObjectId(mandi)
    if (state) matchQuery.state = new RegExp(state, "i")

    const historicalData = await MandiPrice.find(matchQuery)
      .select("priceDate modalPrice arrivalQuantity")
      .sort({ priceDate: 1 })
      .lean()

    if (historicalData.length < 7) {
      throw new AppError("Insufficient historical data for prediction", 400)
    }

    // Generate predictions using simple moving average and trend analysis
    const predictions = generatePricePredictions(historicalData, Number.parseInt(days))

    // Calculate confidence based on data consistency
    const confidence = calculatePredictionConfidence(historicalData)

    res.status(200).json({
      success: true,
      data: {
        crop,
        variety: variety || "All varieties",
        location: state || mandi || "All India",
        predictionDays: Number.parseInt(days),
        predictions,
        confidence,
        methodology: "Moving Average with Trend Analysis",
        disclaimer:
          "Predictions are based on historical data and should not be used as sole basis for trading decisions.",
        generatedAt: new Date(),
      },
    })
  }),
)

// =============================================================================
// PRICE ALERTS ROUTES
// =============================================================================

/**
 * @route   POST /api/mandi/alerts
 * @desc    Create price alert
 * @access  Private
 */
router.post(
  "/alerts",
  protect,
  validateAlert,
  handleValidation,
  asyncHandler(async (req, res) => {
    const {
      crop,
      variety,
      mandi,
      state,
      condition,
      targetPrice,
      priceType = "modal",
      notifyVia = ["email", "push"],
      expiresAt,
    } = req.body

    // Check if user already has similar alert
    const existingAlert = await PriceAlert.findOne({
      user: req.user._id,
      crop: new RegExp(`^${crop}$`, "i"),
      condition,
      targetPrice,
      isActive: true,
    })

    if (existingAlert) {
      throw new AppError("You already have a similar price alert", 400)
    }

    // Limit alerts per user
    const alertCount = await PriceAlert.countDocuments({
      user: req.user._id,
      isActive: true,
    })

    if (alertCount >= 20) {
      throw new AppError("Maximum alert limit (20) reached. Please delete some alerts.", 400)
    }

    const alert = await PriceAlert.create({
      user: req.user._id,
      crop,
      variety,
      mandi,
      state,
      condition,
      targetPrice,
      priceType,
      notifyVia,
      expiresAt: expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
    })

    res.status(201).json({
      success: true,
      message: "Price alert created successfully",
      data: alert,
    })
  }),
)

/**
 * @route   GET /api/mandi/alerts
 * @desc    Get user's price alerts
 * @access  Private
 */
router.get(
  "/alerts",
  protect,
  asyncHandler(async (req, res) => {
    const { status = "all" } = req.query

    const query = { user: req.user._id }

    if (status === "active") {
      query.isActive = true
      query.expiresAt = { $gt: new Date() }
    } else if (status === "triggered") {
      query.triggeredAt = { $ne: null }
    } else if (status === "expired") {
      query.$or = [{ expiresAt: { $lte: new Date() } }, { isActive: false }]
    }

    const alerts = await PriceAlert.find(query).populate("mandi", "name state district").sort({ createdAt: -1 }).lean()

    // Get current prices for alert crops
    const alertsWithCurrentPrice = await Promise.all(
      alerts.map(async (alert) => {
        const priceQuery = {
          crop: new RegExp(alert.crop, "i"),
          priceDate: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        }

        if (alert.mandi) priceQuery.mandi = alert.mandi._id
        if (alert.state) priceQuery.state = new RegExp(alert.state, "i")

        const latestPrice = await MandiPrice.findOne(priceQuery)
          .sort({ priceDate: -1 })
          .select("modalPrice minPrice maxPrice priceDate")
          .lean()

        return {
          ...alert,
          currentPrice: latestPrice,
          distanceFromTarget: latestPrice ? calculateDistanceFromTarget(latestPrice, alert) : null,
        }
      }),
    )

    res.status(200).json({
      success: true,
      data: alertsWithCurrentPrice,
      count: alerts.length,
    })
  }),
)

/**
 * @route   PUT /api/mandi/alerts/:id
 * @desc    Update price alert
 * @access  Private
 */
router.put(
  "/alerts/:id",
  protect,
  asyncHandler(async (req, res) => {
    const alert = await PriceAlert.findOne({
      _id: req.params.id,
      user: req.user._id,
    })

    if (!alert) {
      throw new AppError("Alert not found", 404)
    }

    const allowedUpdates = ["targetPrice", "condition", "notifyVia", "isActive", "expiresAt"]

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        alert[field] = req.body[field]
      }
    })

    // Reset triggered status if price target changed
    if (req.body.targetPrice && req.body.targetPrice !== alert.targetPrice) {
      alert.triggeredAt = null
      alert.triggeredPrice = null
    }

    await alert.save()

    res.status(200).json({
      success: true,
      message: "Alert updated successfully",
      data: alert,
    })
  }),
)

/**
 * @route   DELETE /api/mandi/alerts/:id
 * @desc    Delete price alert
 * @access  Private
 */
router.delete(
  "/alerts/:id",
  protect,
  asyncHandler(async (req, res) => {
    const alert = await PriceAlert.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    })

    if (!alert) {
      throw new AppError("Alert not found", 404)
    }

    res.status(200).json({
      success: true,
      message: "Alert deleted successfully",
    })
  }),
)

// =============================================================================
// COMPARISON ROUTES
// =============================================================================

/**
 * @route   GET /api/mandi/compare
 * @desc    Compare prices across mandis
 * @access  Public
 */
router.get(
  "/compare",
  validateCompare,
  handleValidation,
  asyncHandler(async (req, res) => {
    const { crop, variety, mandis, states, period = "today" } = req.query

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()

    switch (period) {
      case "today":
        startDate.setHours(0, 0, 0, 0)
        break
      case "7d":
        startDate.setDate(startDate.getDate() - 7)
        break
      case "30d":
        startDate.setDate(startDate.getDate() - 30)
        break
    }

    const matchQuery = {
      crop: new RegExp(crop, "i"),
      priceDate: { $gte: startDate, $lte: endDate },
    }

    if (variety) {
      matchQuery.variety = new RegExp(variety, "i")
    }

    if (mandis) {
      const mandiIds = mandis.split(",").map((id) => new mongoose.Types.ObjectId(id.trim()))
      matchQuery.mandi = { $in: mandiIds }
    }

    if (states) {
      const stateList = states.split(",").map((s) => s.trim())
      matchQuery.state = { $in: stateList.map((s) => new RegExp(s, "i")) }
    }

    // Aggregate comparison data
    const comparison = await MandiPrice.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            mandi: "$mandi",
            state: "$state",
            district: "$district",
          },
          avgMinPrice: { $avg: "$minPrice" },
          avgMaxPrice: { $avg: "$maxPrice" },
          avgModalPrice: { $avg: "$modalPrice" },
          totalArrival: { $sum: "$arrivalQuantity" },
          priceCount: { $sum: 1 },
          latestPrice: { $last: "$modalPrice" },
          latestDate: { $max: "$priceDate" },
        },
      },
      {
        $lookup: {
          from: "mandis",
          localField: "_id.mandi",
          foreignField: "_id",
          as: "mandiDetails",
        },
      },
      { $unwind: { path: "$mandiDetails", preserveNullAndEmptyArrays: true } },
      { $sort: { avgModalPrice: 1 } },
    ])

    // Calculate statistics
    const prices = comparison.map((c) => c.avgModalPrice)
    const stats = {
      lowestPrice: Math.min(...prices),
      highestPrice: Math.max(...prices),
      avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length,
      priceRange: Math.max(...prices) - Math.min(...prices),
      marketCount: comparison.length,
    }

    // Find best and worst markets
    const bestMarket = comparison[0]
    const worstMarket = comparison[comparison.length - 1]

    res.status(200).json({
      success: true,
      data: {
        crop,
        variety: variety || "All varieties",
        period,
        dateRange: { startDate, endDate },
        comparison: comparison.map((c) => ({
          mandi: c.mandiDetails?.name || "Unknown",
          state: c._id.state,
          district: c._id.district,
          avgMinPrice: Math.round(c.avgMinPrice * 100) / 100,
          avgMaxPrice: Math.round(c.avgMaxPrice * 100) / 100,
          avgModalPrice: Math.round(c.avgModalPrice * 100) / 100,
          totalArrival: c.totalArrival,
          priceCount: c.priceCount,
          latestPrice: c.latestPrice,
          latestDate: c.latestDate,
        })),
        statistics: stats,
        recommendation: {
          bestMarketToBuy: bestMarket
            ? {
                name: bestMarket.mandiDetails?.name,
                state: bestMarket._id.state,
                price: Math.round(bestMarket.avgModalPrice * 100) / 100,
              }
            : null,
          bestMarketToSell: worstMarket
            ? {
                name: worstMarket.mandiDetails?.name,
                state: worstMarket._id.state,
                price: Math.round(worstMarket.avgModalPrice * 100) / 100,
              }
            : null,
          priceDifference: Math.round(stats.priceRange * 100) / 100,
        },
      },
    })
  }),
)

/**
 * @route   GET /api/mandi/crops
 * @desc    Get list of all crops with price data
 * @access  Public
 */
router.get(
  "/crops",
  asyncHandler(async (req, res) => {
    const crops = await MandiPrice.aggregate([
      {
        $group: {
          _id: { crop: "$crop", variety: "$variety" },
          avgPrice: { $avg: "$modalPrice" },
          marketCount: { $addToSet: "$mandi" },
          latestDate: { $max: "$priceDate" },
        },
      },
      {
        $group: {
          _id: "$_id.crop",
          varieties: {
            $push: {
              name: "$_id.variety",
              avgPrice: "$avgPrice",
            },
          },
          totalMarkets: { $sum: { $size: "$marketCount" } },
          avgPrice: { $avg: "$avgPrice" },
        },
      },
      { $sort: { _id: 1 } },
    ])

    res.status(200).json({
      success: true,
      data: crops.map((c) => ({
        crop: c._id,
        varieties: c.varieties.filter((v) => v.name),
        avgPrice: Math.round(c.avgPrice * 100) / 100,
        marketCount: c.totalMarkets,
      })),
      count: crops.length,
    })
  }),
)

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get trend indicator based on price change
 */
function getTrendIndicator(priceChange) {
  if (!priceChange) return "stable"
  if (priceChange > 5) return "up_strong"
  if (priceChange > 0) return "up"
  if (priceChange < -5) return "down_strong"
  if (priceChange < 0) return "down"
  return "stable"
}

/**
 * Calculate price statistics
 */
function calculatePriceStats(prices) {
  if (!prices.length) return null

  const modalPrices = prices.map((p) => p.modalPrice)
  const sorted = [...modalPrices].sort((a, b) => a - b)

  return {
    average: Math.round(modalPrices.reduce((a, b) => a + b, 0) / modalPrices.length),
    median: sorted[Math.floor(sorted.length / 2)],
    min: Math.min(...modalPrices),
    max: Math.max(...modalPrices),
    stdDev: Math.round(calculateStdDev(modalPrices) * 100) / 100,
    volatility: Math.round(((Math.max(...modalPrices) - Math.min(...modalPrices)) / Math.min(...modalPrices)) * 100),
  }
}

/**
 * Calculate standard deviation
 */
function calculateStdDev(values) {
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const squareDiffs = values.map((value) => Math.pow(value - avg, 2))
  return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / values.length)
}

/**
 * Get group by clause based on period
 */
function getGroupByPeriod(period) {
  switch (period) {
    case "24h":
      return {
        year: { $year: "$priceDate" },
        month: { $month: "$priceDate" },
        day: { $dayOfMonth: "$priceDate" },
        hour: { $hour: "$priceDate" },
      }
    case "7d":
    case "30d":
      return {
        year: { $year: "$priceDate" },
        month: { $month: "$priceDate" },
        day: { $dayOfMonth: "$priceDate" },
      }
    case "90d":
    case "1y":
      return {
        year: { $year: "$priceDate" },
        week: { $week: "$priceDate" },
      }
    default:
      return {
        year: { $year: "$priceDate" },
        month: { $month: "$priceDate" },
        day: { $dayOfMonth: "$priceDate" },
      }
  }
}

/**
 * Format trends data for response
 */
function formatTrendsData(trends, period) {
  return trends.map((t) => {
    let date
    if (t._id.hour !== undefined) {
      date = new Date(t._id.year, t._id.month - 1, t._id.day, t._id.hour)
    } else if (t._id.day !== undefined) {
      date = new Date(t._id.year, t._id.month - 1, t._id.day)
    } else if (t._id.week !== undefined) {
      // Calculate date from week number
      date = getDateFromWeek(t._id.year, t._id.week)
    } else {
      date = new Date(t._id.year, t._id.month - 1)
    }

    return {
      date: date.toISOString(),
      avgMinPrice: Math.round(t.avgMinPrice * 100) / 100,
      avgMaxPrice: Math.round(t.avgMaxPrice * 100) / 100,
      avgModalPrice: Math.round(t.avgModalPrice * 100) / 100,
      totalArrival: t.totalArrival,
      priceCount: t.priceCount,
      highestPrice: t.highestPrice,
      lowestPrice: t.lowestPrice,
    }
  })
}

/**
 * Get date from week number
 */
function getDateFromWeek(year, week) {
  const date = new Date(year, 0, 1)
  date.setDate(date.getDate() + (week - 1) * 7)
  return date
}

/**
 * Generate price predictions using moving average
 */
function generatePricePredictions(historicalData, days) {
  const predictions = []
  const prices = historicalData.map((d) => d.modalPrice)

  // Calculate 7-day moving average
  const ma7 = calculateMovingAverage(prices, 7)

  // Calculate trend
  const recentMA = ma7.slice(-7)
  const trend = (recentMA[recentMA.length - 1] - recentMA[0]) / recentMA.length

  // Calculate seasonality factor (simplified)
  const lastPrice = prices[prices.length - 1]
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
  const seasonalFactor = lastPrice / avgPrice

  for (let i = 1; i <= days; i++) {
    const basePrice = lastPrice + trend * i
    const predictedPrice = basePrice * (0.95 + Math.random() * 0.1) // Add some variance

    const predictionDate = new Date()
    predictionDate.setDate(predictionDate.getDate() + i)

    predictions.push({
      date: predictionDate.toISOString().split("T")[0],
      predictedPrice: Math.round(predictedPrice * 100) / 100,
      confidenceRange: {
        low: Math.round(predictedPrice * 0.95 * 100) / 100,
        high: Math.round(predictedPrice * 1.05 * 100) / 100,
      },
      trend: trend > 0 ? "up" : trend < 0 ? "down" : "stable",
    })
  }

  return predictions
}

/**
 * Calculate moving average
 */
function calculateMovingAverage(data, window) {
  const result = []
  for (let i = window - 1; i < data.length; i++) {
    const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0)
    result.push(sum / window)
  }
  return result
}

/**
 * Calculate prediction confidence
 */
function calculatePredictionConfidence(historicalData) {
  const prices = historicalData.map((d) => d.modalPrice)
  const stdDev = calculateStdDev(prices)
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
  const cv = (stdDev / avgPrice) * 100 // Coefficient of variation

  if (cv < 10) return { level: "high", score: 85, message: "Price data is stable, predictions are reliable" }
  if (cv < 20)
    return { level: "medium", score: 65, message: "Moderate price volatility, predictions have some uncertainty" }
  return { level: "low", score: 45, message: "High price volatility, predictions should be used with caution" }
}

/**
 * Calculate distance from target price
 */
function calculateDistanceFromTarget(currentPrice, alert) {
  const price =
    alert.priceType === "min"
      ? currentPrice.minPrice
      : alert.priceType === "max"
        ? currentPrice.maxPrice
        : currentPrice.modalPrice

  const difference = price - alert.targetPrice
  const percentage = ((difference / alert.targetPrice) * 100).toFixed(2)

  return {
    currentPrice: price,
    targetPrice: alert.targetPrice,
    difference: Math.round(difference * 100) / 100,
    percentage: Number.parseFloat(percentage),
    status:
      alert.condition === "above"
        ? price >= alert.targetPrice
          ? "triggered"
          : "pending"
        : alert.condition === "below"
          ? price <= alert.targetPrice
            ? "triggered"
            : "pending"
          : price === alert.targetPrice
            ? "triggered"
            : "pending",
  }
}

module.exports = router
