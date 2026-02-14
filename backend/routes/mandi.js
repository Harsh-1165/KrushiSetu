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

// =============================================================================
// TRENDS ROUTES
// =============================================================================

/**
 * @route   GET /api/mandi/trends
 * @desc    Get price trends for specified period with mock fallback
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
      period = "7d", // 7d, 30d, 90d, 365d
      page = 1,
      limit = 1000
    } = req.query

    if (!crop) {
      throw new AppError("Crop name is required", 400)
    }

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    let days = 7

    switch (period) {
      case "7d":
        days = 7
        startDate.setDate(startDate.getDate() - 7)
        break
      case "30d":
        days = 30
        startDate.setDate(startDate.getDate() - 30)
        break
      case "90d":
        days = 90
        startDate.setDate(startDate.getDate() - 90)
        break
      case "1y":
      case "365d":
        days = 365
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
      default:
        days = 7
        startDate.setDate(startDate.getDate() - 7)
    }

    // Build match query
    const matchQuery = {
      crop: new RegExp(crop, "i"),
      priceDate: { $gte: startDate, $lte: endDate },
    }

    if (variety) matchQuery.variety = new RegExp(variety, "i")
    if (mandi) matchQuery.mandi = new mongoose.Types.ObjectId(mandi)
    if (state && state !== "all") matchQuery.state = new RegExp(state, "i")

    // Aggregate trends from DB
    const trends = await MandiPrice.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$priceDate" } },
          avgMinPrice: { $avg: "$minPrice" },
          avgMaxPrice: { $avg: "$maxPrice" },
          avgModalPrice: { $avg: "$modalPrice" },
          totalArrival: { $sum: "$arrivalQuantity" },
          priceCount: { $sum: 1 },
          minPrice: { $min: "$minPrice" },
          maxPrice: { $max: "$maxPrice" },
        },
      },
      { $sort: { _id: 1 } }, // Sort by date ascending
    ])

    let finalTrends = []

    // MOCK DATA FALLBACK LOGIC
    if (trends.length < 3) {
      console.log(`[MockData] Generating mock trends for ${crop} (${period})`)
      finalTrends = generateMockTrends(crop, days, startDate)
    } else {
      finalTrends = trends.map(t => ({
        date: t._id,
        min: Math.round(t.avgMinPrice),
        max: Math.round(t.avgMaxPrice),
        modal: Math.round(t.avgModalPrice),
        arrival: t.totalArrival
      }))
    }

    // Calculate Statistics & Trend
    const firstData = finalTrends[0]
    const lastData = finalTrends[finalTrends.length - 1]

    const priceChange = firstData && firstData.modal > 0
      ? ((lastData.modal - firstData.modal) / firstData.modal) * 100
      : 0

    const avgPrice = finalTrends.reduce((acc, curr) => acc + curr.modal, 0) / finalTrends.length

    // Determine Trend Direction
    let trendDirection = "stable"
    if (priceChange >= 3) trendDirection = "rising"
    else if (priceChange <= -3) trendDirection = "falling"

    // Generate AI Insight
    let advice = "neutral"
    let insight = ""
    const arrivalTrend = lastData.arrival > firstData.arrival ? "increasing" : "decreasing"

    if (trendDirection === "rising" && arrivalTrend === "decreasing") {
      advice = "sell"
      insight = `📈 ${crop} prices are rising (${priceChange.toFixed(1)}%) due to lower market arrivals. Good time to sell.`
    } else if (trendDirection === "falling" && arrivalTrend === "increasing") {
      advice = "wait"
      insight = `📉 Prices dropped by ${Math.abs(priceChange).toFixed(1)}% with high supply. Consider storing via warehouse.`
    } else if (trendDirection === "stable") {
      advice = "neutral"
      insight = `📊 Market is stable with typical seasonal fluctuations. Monitor for next 2-3 days.`
    } else {
      advice = "neutral"
      insight = `🔍 Mixed signals observed. Price change: ${priceChange.toFixed(1)}%.`
    }

    res.status(200).json({
      success: true,
      averagePrice: Math.round(avgPrice),
      priceChange: Number(priceChange.toFixed(2)),
      trend: trendDirection,
      priceRange: {
        min: Math.min(...finalTrends.map(t => t.min)),
        max: Math.max(...finalTrends.map(t => t.max))
      },
      totalArrival: finalTrends.reduce((acc, t) => acc + t.arrival, 0),
      aiInsight: {
        summary: insight,
        advice: advice,
        confidence: 85 // Mock confidence
      },
      data: finalTrends
    })
  }),
)

// Helper: Generate Mock Trends
function generateMockTrends(crop, days, startDate) {
  const data = []
  let basePrice = 2000 // Default

  // Simple crop price logic
  if (/cotton|mirch|jeera/i.test(crop)) basePrice = 6000
  else if (/wheat|rice|paddy/i.test(crop)) basePrice = 2200
  else if (/tomato|onion|potato/i.test(crop)) basePrice = 1500

  let currentPrice = basePrice
  let currentDate = new Date(startDate)

  // Random trend factor
  const trendFactor = (Math.random() - 0.5) * 10 // Positive or negative trend

  for (let i = 0; i < days; i++) {
    // Add random daily fluctuation
    const fluctuation = (Math.random() - 0.5) * (basePrice * 0.05)

    // Apply trend
    currentPrice += trendFactor + fluctuation

    // Ensure reasonable bounds
    currentPrice = Math.max(basePrice * 0.5, currentPrice)

    data.push({
      date: currentDate.toISOString().split('T')[0],
      min: Math.round(currentPrice * 0.9),
      modal: Math.round(currentPrice),
      max: Math.round(currentPrice * 1.1),
      arrival: Math.round(Math.random() * 500 + 100)
    })

    currentDate.setDate(currentDate.getDate() + 1)
  }
  return data
}

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

    // If insufficient history, generate synthetic history based on latest real data
    // This allows the "Hybrid" mode where we start showing predictions immediately
    if (historicalData.length < 7) {
      // Get the latest price point (or default if completely empty)
      const lastPoint = historicalData[historicalData.length - 1] || {
        modalPrice: 2000,
        priceDate: new Date(),
        arrivalQuantity: 0
      };

      const missingDays = 7 - historicalData.length;
      const syntheticHistory = [];

      for (let i = missingDays; i > 0; i--) {
        const date = new Date(lastPoint.priceDate);
        date.setDate(date.getDate() - i);

        // Add some random variance to make it look realistic
        const variance = (Math.random() - 0.5) * (lastPoint.modalPrice * 0.05); // 5% variance

        syntheticHistory.push({
          priceDate: date,
          modalPrice: Math.round(lastPoint.modalPrice + variance),
          arrivalQuantity: Math.round(Math.random() * 100),
          isSynthetic: true
        });
      }

      // Combine synthetic + real (synthetic first)
      historicalData.unshift(...syntheticHistory);
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
        history: historicalData.slice(-30), // Send last 30 days of history (real + synthetic)
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



// =============================================================================
// REAL-TIME MANDI ROUTES (AGMARKNET)
// =============================================================================

// Simple in-memory cache for Agmarknet data
const mandiCache = new Map();

/**
 * @desc    Get Real-Time Mandi Prices (Agmarknet API)
 * @route   GET /api/mandi/real-time
 * @access  Public
 */
router.get(
  "/real-time",
  asyncHandler(async (req, res) => {
    const { state, district, commodity, limit = 50 } = req.query;
    const cacheKey = `mandi-realtime-${state || 'all'}-${district || 'all'}-${commodity || 'all'}-${limit}`;

    // 1. Check Cache (10 mins TTL)
    if (mandiCache.has(cacheKey)) {
      const cached = mandiCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 10 * 60 * 1000) {
        return res.json({
          success: true,
          source: "cache",
          count: cached.data.length,
          data: cached.data
        });
      }
    }

    // 2. Fetch from Agmarknet API
    const apiKey = process.env.AGMARKET_API_KEY;
    if (!apiKey) {
      // Log but don't crash if key is missing, maybe return mock or empty
      console.warn("Agmarknet API Key missing");
    }

    let apiUrl = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${apiKey}&format=json&limit=${limit}`;

    if (state) apiUrl += `&filters[state]=${encodeURIComponent(state)}`;
    if (district) apiUrl += `&filters[district]=${encodeURIComponent(district)}`;
    if (commodity) apiUrl += `&filters[commodity]=${encodeURIComponent(commodity)}`;

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!data.records) {
        return res.json({
          success: true,
          source: "api_empty",
          count: 0,
          data: [],
          message: "No real-time data found or API limit reached"
        });
      }

      // 3. Transform Data
      const formattedData = data.records.map((record) => ({
        mandiId: `${record.state}-${record.market}-${record.commodity}`.toLowerCase().replace(/\s+/g, '-'),
        mandiName: record.market,
        state: record.state,
        district: record.district,
        commodity: record.commodity,
        minPrice: Number(record.min_price),
        maxPrice: Number(record.max_price),
        modalPrice: Number(record.modal_price),
        arrivalDate: record.arrival_date,
        unit: "₹/quintal",
        source: "Agmarknet (Govt of India)"
      }));

      // 4. Update Cache
      mandiCache.set(cacheKey, {
        timestamp: Date.now(),
        data: formattedData
      });

      res.json({
        success: true,
        source: "api",
        count: formattedData.length,
        data: formattedData
      });
    } catch (error) {
      console.error("Agmarknet API Fetch Error:", error);
      res.status(502).json({ success: false, message: "Failed to fetch government data" });
    }
  })
);

// =============================================================================
// PRICE ALERT ROUTES

// =============================================================================

/**
 * @route   POST /api/mandi/alerts
 * @desc    Create a new price alert
 * @access  Private
 */
router.post(
  "/alerts",
  protect,
  validateAlert,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() })
    }

    const {
      crop,
      variety,
      mandi,
      state,
      condition,
      targetPrice,
      priceType,
      notifyVia,
      expiresAt,
      notes
    } = req.body

    // Check for duplicate alert
    // We check if an active alert exists with same parameters
    const duplicateAlert = await PriceAlert.findOne({
      user: req.user._id,
      crop: { $regex: new RegExp(`^${crop}$`, "i") },
      state: state || null,
      mandi: mandi || null,
      condition,
      targetPrice,
      isActive: true
    })

    if (duplicateAlert) {
      return res.status(400).json({
        success: false,
        message: "A similar active alert already exists for this crop and price."
      })
    }

    const alert = await PriceAlert.create({
      user: req.user._id,
      crop,
      variety,
      mandi,
      state,
      condition,
      targetPrice,
      priceType: priceType || "modal",
      notifyVia: notifyVia || ["push"],
      expiresAt: expiresAt || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Default 90 days
      notes
    })

    res.status(201).json({
      success: true,
      data: alert
    })
  })
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
    const alerts = await PriceAlert.find({ user: req.user._id })
      .sort("-createdAt")
      .populate("mandi", "name state district")

    res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts
    })
  })
)

/**
 * @route   DELETE /api/mandi/alerts/:id
 * @desc    Delete a price alert
 * @access  Private
 */
router.delete(
  "/alerts/:id",
  protect,
  asyncHandler(async (req, res) => {
    const alert = await PriceAlert.findById(req.params.id)

    if (!alert) {
      throw new AppError("Alert not found", 404)
    }

    // Check ownership
    if (alert.user.toString() !== req.user._id.toString()) {
      throw new AppError("Not authorized to delete this alert", 401)
    }

    await alert.deleteOne()

    res.status(200).json({
      success: true,
      data: {}
    })
  })
)



// Load district coordinates
const districtCoordinates = require("../data/districtCoordinates.json");

/**
 * @desc    Get List of Active Mandis (Real-Time from Agmarknet)
 * @route   GET /api/mandi/list
 * @access  Public
 */
router.get(
  "/list",
  asyncHandler(async (req, res) => {
    const { state, district, limit = 2000 } = req.query; // High limit to get all mandis
    const cacheKey = `mandi-list-${state || 'all'}-${district || 'all'}`;

    // 1. Check Cache (10 mins TTL)
    if (mandiCache.has(cacheKey)) {
      const cached = mandiCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 10 * 60 * 1000) {
        let cachedData = cached.data;

        // Apply Geospatial Filter on Cached Data
        const { lat, lng, radius } = req.query;
        if (lat && lng && radius) {
          const userLat = parseFloat(lat);
          const userLng = parseFloat(lng);
          const maxDist = parseFloat(radius);

          cachedData = cachedData.filter(mandi => {
            if (!mandi.location || !mandi.location.coordinates) return false;
            const mandiLng = mandi.location.coordinates[0];
            const mandiLat = mandi.location.coordinates[1];

            const R = 6371;
            const dLat = (mandiLat - userLat) * Math.PI / 180;
            const dLon = (mandiLng - userLng) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(userLat * Math.PI / 180) * Math.cos(mandiLat * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;

            mandi.distance = distance;
            return distance <= maxDist;
          }).sort((a, b) => a.distance - b.distance);
        }

        return res.json({
          success: true,
          source: "cache",
          count: cachedData.length,
          data: cachedData
        });
      }
    }

    // 2. Fetch from Agmarknet API
    const apiKey = process.env.AGMARKET_API_KEY;
    let apiUrl = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${apiKey}&format=json&limit=${limit}`;

    // Infer state from coordinates if available and state not explicitly provided
    let inferredState = null;
    if ((!state || state === "all") && req.query.lat && req.query.lng) {
      const userLat = parseFloat(req.query.lat);
      const userLng = parseFloat(req.query.lng);
      let minDistance = Infinity;
      let nearestDistrict = null;

      Object.entries(districtCoordinates).forEach(([name, coords]) => {
        const dLat = (coords.lat - userLat) * Math.PI / 180;
        const dLon = (coords.lng - userLng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(userLat * Math.PI / 180) * Math.cos(coords.lat * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = 6371 * c; // km

        if (distance < minDistance) {
          minDistance = distance;
          nearestDistrict = { name, ...coords };
        }
      });

      // If nearest calculated district is reasonably close (< 500km), assume user is in that state
      if (nearestDistrict && minDistance < 500 && nearestDistrict.state) {
        inferredState = nearestDistrict.state;
        console.log(`[Agmarknet] Inferred State from location: ${inferredState} (Nearest: ${nearestDistrict.name}, Dist: ${minDistance.toFixed(0)}km)`);
      }
    }

    if (state && state !== "all") {
      apiUrl += `&filters[state]=${encodeURIComponent(state)}`;
    } else if (inferredState) {
      apiUrl += `&filters[state]=${encodeURIComponent(inferredState)}`;
    }

    if (district) apiUrl += `&filters[district]=${encodeURIComponent(district)}`;

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!data.records) {
        return res.json({ success: true, count: 0, data: [], message: "No mandi data found" });
      }

      // 3. Group by Mandi + District
      const mandisMap = new Map();

      data.records.forEach(record => {
        const mandiId = `${record.state}-${record.district}-${record.market}`.toLowerCase().replace(/\s+/g, '-');

        if (!mandisMap.has(mandiId)) {
          // Find coordinates
          // 1. Try exact district match
          // 2. Try partial match
          // 3. Fallback to state capital (simplified) or null
          let lat = null;
          let lng = null;

          const districtKey = Object.keys(districtCoordinates).find(k =>
            record.district.toLowerCase().includes(k.toLowerCase()) ||
            k.toLowerCase().includes(record.district.toLowerCase())
          );

          if (districtKey) {
            lat = districtCoordinates[districtKey].lat;
            lng = districtCoordinates[districtKey].lng;

            // Jitter coordinates slightly so mandis in same district don't overlap perfectly
            lat += (Math.random() - 0.5) * 0.05;
            lng += (Math.random() - 0.5) * 0.05;
          }

          mandisMap.set(mandiId, {
            _id: mandiId,
            name: record.market,
            type: "APMC", // Govt data mostly APMC
            state: record.state,
            district: record.district,
            location: (lat && lng) ? { type: "Point", coordinates: [lng, lat] } : undefined,
            mainCommodities: [record.commodity],
            todayPriceCount: 1,
            updatedAt: record.arrival_date,
            isVerified: true,
            source: "GOVT_AGMARKNET"
          });
        } else {
          const existing = mandisMap.get(mandiId);
          if (!existing.mainCommodities.includes(record.commodity)) {
            existing.mainCommodities.push(record.commodity);
          }
          existing.todayPriceCount++;
        }
      });

      let mandiList = Array.from(mandisMap.values());

      // 4. Transform & Filter by Location (if provided)
      const { lat, lng, radius } = req.query;

      if (lat && lng && radius) {
        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);
        const maxDist = parseFloat(radius);

        mandiList = mandiList.filter(mandi => {
          if (!mandi.location || !mandi.location.coordinates) return false;

          const mandiLng = mandi.location.coordinates[0];
          const mandiLat = mandi.location.coordinates[1];

          // Haversine Formula
          const R = 6371; // km
          const dLat = (mandiLat - userLat) * Math.PI / 180;
          const dLon = (mandiLng - userLng) * Math.PI / 180;
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(userLat * Math.PI / 180) * Math.cos(mandiLat * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;

          mandi.distance = distance; // Attach distance for frontend sorting
          return distance <= maxDist;
        });

        // Sort by distance
        mandiList.sort((a, b) => a.distance - b.distance);
      }

      // 5. Update Cache (storing unfiltered list might be better, but for now cache the filtered if params exist?)
      // Actually, we should cache the FULL list per State/District, and filter in memory after cache retrieval?
      // For simplicity and to avoid cache explosion with lat/lng keys, let's cache the raw list (by state/district)
      // and THEN filter.

      mandiCache.set(cacheKey, {
        timestamp: Date.now(),
        data: Array.from(mandisMap.values()) // Cache the FULL list
      });

      res.json({
        success: true,
        source: "api",
        count: mandiList.length,
        data: mandiList
      });

    } catch (error) {
      console.error("Agmarknet List Fetch Error:", error);
      res.status(502).json({ success: false, message: "Failed to fetch government mandi list" });
    }
  })
);

/**
 * @desc    Get Market Price Comparison (Real-Time)
 * @route   GET /api/mandi/compare
 * @access  Public
 */
router.get(
  "/compare",
  asyncHandler(async (req, res) => {
    console.log("[DEBUG] /compare called with query:", req.query);
    const { commodity, states, period = "today" } = req.query;

    if (!commodity) {
      console.log("[DEBUG] /compare - Commodity missing!");
      return res.status(400).json({ success: false, message: "Commodity is required" });
    }

    // 1. Check Cache
    const cacheKey = `compare-${commodity}-${states || 'all'}-${period}`;
    if (mandiCache.has(cacheKey)) {
      const cached = mandiCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 10 * 60 * 1000) { // 10 min TTL
        return res.json({
          success: true,
          source: "cache",
          data: cached.data
        });
      }
    }

    // 2. Fetch from Agmarknet API
    const apiKey = process.env.AGMARKET_API_KEY;
    // Base API URL
    let apiUrl = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${apiKey}&format=json&limit=2000`;

    // Filter by Commodity
    apiUrl += `&filters[commodity]=${encodeURIComponent(commodity)}`;

    // Filter by States (if provided)
    // Agmarknet doesn't support "OR" in filters easily for multiple states in one query usually, 
    // but we can filter in memory if the list is small, or make multiple requests.
    // For now, let's fetch all for the commodity (limit 2000 should cover most major markets for one crop) and filter in memory.

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!data.records) {
        return res.json({ success: true, data: getDefaultEmptyResponse(commodity, period) });
      }

      let records = data.records;

      // In-memory Filter: States
      if (states) {
        const stateList = states.split(',').map(s => s.trim().toLowerCase());
        records = records.filter(r => stateList.includes(r.state.toLowerCase()));
      }

      // In-memory Filter: Date (Duration)
      // Agmarknet "arrival_date" format: "dd/mm/yyyy"
      // Note: The public API usually returns only the LATEST available data per mandi, 
      // so filtering by duration might be redundant if we only get today/yesterday's data specifically.
      // However, if we were using a historical endpoint, we would filter here.
      // For the standard endpoint, we assume it's "Current/Real-time".

      // 3. Aggregation Logic
      const mandiMap = new Map();

      records.forEach(record => {
        const mandiName = record.market;
        const mandiState = record.state;
        const mandiDistrict = record.district;
        const key = `${mandiName}-${mandiState}`;

        const min = parseFloat(record.min_price);
        const max = parseFloat(record.max_price);
        const modal = parseFloat(record.modal_price);
        const arrival = parseFloat(record.arrival) || 0; // Sometimes it's '--'

        if (!mandiMap.has(key)) {
          mandiMap.set(key, {
            mandi: mandiName,
            state: mandiState,
            district: mandiDistrict,
            minPrices: [],
            maxPrices: [],
            modalPrices: [],
            arrivals: [],
            dates: []
          });
        }

        const entry = mandiMap.get(key);
        if (!isNaN(min)) entry.minPrices.push(min);
        if (!isNaN(max)) entry.maxPrices.push(max);
        if (!isNaN(modal)) entry.modalPrices.push(modal);
        entry.arrivals.push(arrival);
        entry.dates.push(record.arrival_date);
      });

      // 4. Calculate Statistics
      const comparison = Array.from(mandiMap.values()).map(m => {
        const avgMin = m.minPrices.reduce((a, b) => a + b, 0) / m.minPrices.length || 0;
        const avgMax = m.maxPrices.reduce((a, b) => a + b, 0) / m.maxPrices.length || 0;
        const avgModal = m.modalPrices.reduce((a, b) => a + b, 0) / m.modalPrices.length || 0;
        const totalArrival = m.arrivals.reduce((a, b) => a + b, 0);

        return {
          mandi: m.mandi,
          state: m.state,
          district: m.district,
          avgMinPrice: Math.round(avgMin),
          avgMaxPrice: Math.round(avgMax),
          avgModalPrice: Math.round(avgModal),
          totalArrival: totalArrival,
          priceCount: m.modalPrices.length,
          latestDate: m.dates[0] // approximation
        };
      }).sort((a, b) => b.avgModalPrice - a.avgModalPrice); // Default sort by price desc

      if (comparison.length === 0) {
        return res.json({ success: true, data: getDefaultEmptyResponse(commodity, period) });
      }

      // 5. Generate Recommendations
      const prices = comparison.map(c => c.avgModalPrice);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const avgPriceGlobal = prices.reduce((a, b) => a + b, 0) / prices.length;

      // Best to Buy: Lowest Modal Price
      const bestBuy = comparison.reduce((prev, curr) => prev.avgModalPrice < curr.avgModalPrice ? prev : curr);

      // Best to Sell: Highest Modal Price
      const bestSell = comparison.reduce((prev, curr) => prev.avgModalPrice > curr.avgModalPrice ? prev : curr);

      const responseData = {
        crop: commodity,
        variety: "All varieties", // Default fallback
        period: period,
        dateRange: {
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Approx
          endDate: new Date().toISOString()
        },
        comparison: comparison,
        statistics: {
          lowestPrice: minPrice,
          highestPrice: maxPrice,
          avgPrice: Math.round(avgPriceGlobal),
          priceRange: maxPrice - minPrice,
          marketCount: comparison.length
        },
        recommendation: {
          bestMarketToBuy: {
            name: bestBuy.mandi,
            state: bestBuy.state,
            price: bestBuy.avgModalPrice
          },
          bestMarketToSell: {
            name: bestSell.mandi,
            state: bestSell.state,
            price: bestSell.avgModalPrice
          },
          priceDifference: maxPrice - minPrice
        }
      };

      // Cache Response
      mandiCache.set(cacheKey, {
        timestamp: Date.now(),
        data: responseData
      });

      res.json({
        success: true,
        source: "api",
        data: responseData
      });

    } catch (error) {
      console.error("[Agmarknet] Compare API Error:", error);
      res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
  })
);

function getDefaultEmptyResponse(crop, period) {
  return {
    crop,
    period,
    comparison: [],
    statistics: { lowestPrice: 0, highestPrice: 0, avgPrice: 0, priceRange: 0, marketCount: 0 },
    recommendation: { bestMarketToBuy: null, bestMarketToSell: null, priceDifference: 0 }
  };
}

module.exports = router;


