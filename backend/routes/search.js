/**
 * Search & Filtering Engine for GreenTrace Agricultural Marketplace
 *
 * Features:
 * - Full-text search across products, questions, articles, experts
 * - Advanced filtering with faceted search
 * - Geospatial search for nearby results
 * - Search ranking algorithm
 * - Pagination and sorting
 * - Search suggestions and autocomplete
 * - Recent searches and popular searches
 * - Optional Elasticsearch integration
 */

const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")
const { asyncHandler } = require("../utils/asyncHandler")
const { AppError } = require("../utils/AppError")
const { authenticate, optionalAuth } = require("../middleware/auth")
const { query, validationResult } = require("express-validator")

// Models
const Product = require("../models/Product")
const Question = require("../models/Question")
const Article = require("../models/Article")
const User = require("../models/User")
const SearchHistory = require("../models/SearchHistory")

// Caching disabled — Redis removed

// ===========================================
// SEARCH INDEX SETUP (Run once during setup)
// ===========================================

/**
 * Setup MongoDB text indexes for all searchable collections
 * Run this during database initialization
 */
const setupTextIndexes = async () => {
  try {
    // Product text index
    await Product.collection.createIndex(
      {
        name: "text",
        description: "text",
        "category.name": "text",
        "category.subcategory": "text",
        tags: "text",
        variety: "text",
      },
      {
        weights: {
          name: 10,
          "category.name": 8,
          tags: 6,
          variety: 5,
          description: 3,
          "category.subcategory": 2,
        },
        name: "product_text_index",
        default_language: "english",
      },
    )

    // Question text index
    await Question.collection.createIndex(
      {
        title: "text",
        description: "text",
        "category.name": "text",
        tags: "text",
      },
      {
        weights: {
          title: 10,
          tags: 6,
          "category.name": 5,
          description: 3,
        },
        name: "question_text_index",
      },
    )

    // Article text index
    await Article.collection.createIndex(
      {
        title: "text",
        content: "text",
        excerpt: "text",
        "category.name": "text",
        tags: "text",
      },
      {
        weights: {
          title: 10,
          tags: 8,
          excerpt: 5,
          "category.name": 4,
          content: 2,
        },
        name: "article_text_index",
      },
    )

    // User text index (for expert search)
    await User.collection.createIndex(
      {
        name: "text",
        "expertProfile.bio": "text",
        "expertProfile.specializations": "text",
        "farmerProfile.farmName": "text",
        "address.city": "text",
        "address.state": "text",
      },
      {
        weights: {
          name: 10,
          "expertProfile.specializations": 8,
          "farmerProfile.farmName": 6,
          "address.city": 4,
          "expertProfile.bio": 2,
        },
        name: "user_text_index",
      },
    )

    console.log("Text indexes created successfully")
  } catch (error) {
    console.error("Error creating text indexes:", error)
  }
}

// Export for setup script
module.exports.setupTextIndexes = setupTextIndexes

// ===========================================
// VALIDATION MIDDLEWARE
// ===========================================

const searchValidation = [
  query("q").optional().isString().trim().isLength({ min: 1, max: 200 }),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("sort").optional().isIn(["relevance", "newest", "oldest", "price_asc", "price_desc", "rating", "popular"]),
  query("minPrice").optional().isFloat({ min: 0 }).toFloat(),
  query("maxPrice").optional().isFloat({ min: 0 }).toFloat(),
  query("lat").optional().isFloat({ min: -90, max: 90 }).toFloat(),
  query("lng").optional().isFloat({ min: -180, max: 180 }).toFloat(),
  query("radius").optional().isFloat({ min: 1, max: 500 }).toFloat(),
]

const validateSearch = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    })
  }
  next()
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Build MongoDB text search query with ranking
 */
const buildTextSearchQuery = (searchTerm, additionalFilters = {}) => {
  const query = {
    $text: { $search: searchTerm },
    ...additionalFilters,
  }

  return query
}

/**
 * Build sort options based on sort parameter
 */
const buildSortOptions = (sort, hasTextSearch = false) => {
  const sortOptions = {}

  switch (sort) {
    case "relevance":
      if (hasTextSearch) {
        sortOptions.score = { $meta: "textScore" }
      }
      sortOptions.createdAt = -1
      break
    case "newest":
      sortOptions.createdAt = -1
      break
    case "oldest":
      sortOptions.createdAt = 1
      break
    case "price_asc":
      sortOptions["pricing.price"] = 1
      break
    case "price_desc":
      sortOptions["pricing.price"] = -1
      break
    case "rating":
      sortOptions["ratings.average"] = -1
      sortOptions["ratings.count"] = -1
      break
    case "popular":
      sortOptions["stats.views"] = -1
      sortOptions["stats.sales"] = -1
      break
    default:
      sortOptions.createdAt = -1
  }

  return sortOptions
}

/**
 * Calculate search relevance score
 */
const calculateRelevanceScore = (item, searchTerm, type) => {
  let score = item.score || 0

  // Boost factors
  if (type === "product") {
    // Boost verified sellers
    if (item.seller?.isVerified) score += 2
    // Boost organic products
    if (item.organic?.certified) score += 1.5
    // Boost highly rated
    if (item.ratings?.average >= 4.5) score += 2
    // Boost in-stock items
    if (item.inventory?.quantity > 0) score += 1
    // Penalize old listings
    const daysSinceCreated = (Date.now() - new Date(item.createdAt)) / (1000 * 60 * 60 * 24)
    if (daysSinceCreated > 30) score -= 0.5
    if (daysSinceCreated > 90) score -= 1
  }

  if (type === "expert") {
    // Boost verified experts
    if (item.expertProfile?.isVerified) score += 3
    // Boost highly rated
    if (item.rating >= 4.5) score += 2
    // Boost by experience
    score += Math.min(item.expertProfile?.experience || 0, 10) * 0.2
    // Boost by answer count
    score += Math.min(item.expertProfile?.stats?.totalAnswers || 0, 100) * 0.01
  }

  return score
}

/**
 * Cache search results
 */
const cacheKey = (type, params) => {
  return `search:${type}:${JSON.stringify(params)}`
}

const getCachedResults = async (_key) => null
const setCachedResults = async (_key, _data, _ttl) => { }

// ===========================================
// UNIFIED SEARCH ENDPOINT
// ===========================================

/**
 * @route   GET /api/search
 * @desc    Unified search across all content types
 * @access  Public
 */
router.get(
  "/",
  optionalAuth,
  searchValidation,
  validateSearch,
  asyncHandler(async (req, res) => {
    const {
      q: searchTerm,
      type = "all", // all, products, questions, articles, experts
      page = 1,
      limit = 20,
      sort = "relevance",
    } = req.query

    if (!searchTerm || searchTerm.trim().length < 2) {
      throw new AppError("Search term must be at least 2 characters", 400)
    }

    const skip = (page - 1) * limit
    const results = {
      products: [],
      questions: [],
      articles: [],
      experts: [],
      totalResults: 0,
    }

    // Check cache
    const cacheKeyStr = cacheKey("unified", { searchTerm, type, page, limit, sort })
    const cached = await getCachedResults(cacheKeyStr)
    if (cached) {
      return res.json({ success: true, ...cached, fromCache: true })
    }

    const searchPromises = []

    // Search Products
    if (type === "all" || type === "products") {
      searchPromises.push(
        Product.find(buildTextSearchQuery(searchTerm, { status: "active" }), { score: { $meta: "textScore" } })
          .sort(buildSortOptions(sort, true))
          .skip(type === "products" ? skip : 0)
          .limit(type === "products" ? limit : 5)
          .populate("seller", "name avatar rating isVerified")
          .select("name images pricing category ratings inventory organic location")
          .lean()
          .then((products) => {
            results.products = products.map((p) => ({
              ...p,
              _type: "product",
              relevanceScore: calculateRelevanceScore(p, searchTerm, "product"),
            }))
          }),
      )
    }

    // Search Questions
    if (type === "all" || type === "questions") {
      searchPromises.push(
        Question.find(buildTextSearchQuery(searchTerm, { status: "open" }), { score: { $meta: "textScore" } })
          .sort(buildSortOptions(sort, true))
          .skip(type === "questions" ? skip : 0)
          .limit(type === "questions" ? limit : 5)
          .populate("author", "name avatar")
          .select("title category tags answersCount views createdAt")
          .lean()
          .then((questions) => {
            results.questions = questions.map((q) => ({
              ...q,
              _type: "question",
              relevanceScore: q.score || 0,
            }))
          }),
      )
    }

    // Search Articles
    if (type === "all" || type === "articles") {
      searchPromises.push(
        Article.find(buildTextSearchQuery(searchTerm, { status: "published" }), { score: { $meta: "textScore" } })
          .sort(buildSortOptions(sort, true))
          .skip(type === "articles" ? skip : 0)
          .limit(type === "articles" ? limit : 5)
          .populate("author", "name avatar")
          .select("title excerpt coverImage category tags readTime views createdAt")
          .lean()
          .then((articles) => {
            results.articles = articles.map((a) => ({
              ...a,
              _type: "article",
              relevanceScore: a.score || 0,
            }))
          }),
      )
    }

    // Search Experts
    if (type === "all" || type === "experts") {
      searchPromises.push(
        User.find(
          buildTextSearchQuery(searchTerm, {
            role: "expert",
            "expertProfile.isVerified": true,
            status: "active",
          }),
          { score: { $meta: "textScore" } },
        )
          .sort(buildSortOptions(sort, true))
          .skip(type === "experts" ? skip : 0)
          .limit(type === "experts" ? limit : 5)
          .select("name avatar rating expertProfile.specializations expertProfile.experience expertProfile.stats")
          .lean()
          .then((experts) => {
            results.experts = experts.map((e) => ({
              ...e,
              _type: "expert",
              relevanceScore: calculateRelevanceScore(e, searchTerm, "expert"),
            }))
          }),
      )
    }

    await Promise.all(searchPromises)

    // Calculate totals
    results.totalResults =
      results.products.length + results.questions.length + results.articles.length + results.experts.length

    // Save search history if user is authenticated
    if (req.user) {
      await SearchHistory.findOneAndUpdate(
        { user: req.user._id, query: searchTerm.toLowerCase() },
        {
          $set: { lastSearchedAt: new Date() },
          $inc: { count: 1 },
        },
        { upsert: true },
      )
    }

    // Update popular searches
    await updatePopularSearches(searchTerm)

    // Cache results
    await setCachedResults(cacheKeyStr, results, 300)

    res.json({
      success: true,
      query: searchTerm,
      type,
      ...results,
      pagination: {
        page,
        limit,
        hasMore: results.totalResults >= limit,
      },
    })
  }),
)

// ===========================================
// PRODUCT SEARCH WITH ADVANCED FILTERS
// ===========================================

/**
 * @route   GET /api/search/products
 * @desc    Advanced product search with faceted filtering
 * @access  Public
 */
router.get(
  "/products",
  optionalAuth,
  searchValidation,
  validateSearch,
  asyncHandler(async (req, res) => {
    const {
      q: searchTerm,
      page = 1,
      limit = 20,
      sort = "relevance",
      // Filters
      category,
      subcategory,
      minPrice,
      maxPrice,
      quality,
      organic,
      verified,
      inStock,
      minRating,
      state,
      city,
      lat,
      lng,
      radius = 50, // km
      harvestDate,
      tags,
    } = req.query

    const skip = (page - 1) * limit

    // Build match stage
    const matchStage = {
      status: "active",
    }

    // Text search
    if (searchTerm && searchTerm.trim()) {
      matchStage.$text = { $search: searchTerm }
    }

    // Category filter
    if (category) {
      matchStage["category.name"] = category
    }
    if (subcategory) {
      matchStage["category.subcategory"] = subcategory
    }

    // Price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      matchStage["pricing.price"] = {}
      if (minPrice !== undefined) matchStage["pricing.price"].$gte = minPrice
      if (maxPrice !== undefined) matchStage["pricing.price"].$lte = maxPrice
    }

    // Quality grade
    if (quality) {
      const qualities = Array.isArray(quality) ? quality : [quality]
      matchStage.quality = { $in: qualities }
    }

    // Organic filter
    if (organic === "true") {
      matchStage["organic.certified"] = true
    }

    // Verified seller filter
    if (verified === "true") {
      // This will be applied after lookup
    }

    // In stock filter
    if (inStock === "true") {
      matchStage["inventory.quantity"] = { $gt: 0 }
    }

    // Rating filter
    if (minRating) {
      matchStage["ratings.average"] = { $gte: Number.parseFloat(minRating) }
    }

    // Location filters
    if (state) {
      matchStage["location.state"] = new RegExp(state, "i")
    }
    if (city) {
      matchStage["location.city"] = new RegExp(city, "i")
    }

    // Geospatial filter
    if (lat && lng) {
      matchStage["location.coordinates"] = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number.parseFloat(lng), Number.parseFloat(lat)],
          },
          $maxDistance: radius * 1000, // Convert km to meters
        },
      }
    }

    // Harvest date filter
    if (harvestDate) {
      const date = new Date(harvestDate)
      matchStage.harvestDate = { $gte: date }
    }

    // Tags filter
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(",")
      matchStage.tags = { $in: tagArray }
    }

    // Aggregation pipeline
    const pipeline = [{ $match: matchStage }]

    // Add text score if searching
    if (searchTerm) {
      pipeline.push({
        $addFields: {
          textScore: { $meta: "textScore" },
        },
      })
    }

    // Lookup seller info
    pipeline.push({
      $lookup: {
        from: "users",
        localField: "seller",
        foreignField: "_id",
        as: "sellerInfo",
        pipeline: [{ $project: { name: 1, avatar: 1, rating: 1, isVerified: 1, "farmerProfile.farmName": 1 } }],
      },
    })
    pipeline.push({ $unwind: "$sellerInfo" })

    // Verified seller filter (after lookup)
    if (verified === "true") {
      pipeline.push({ $match: { "sellerInfo.isVerified": true } })
    }

    // Add computed relevance score
    pipeline.push({
      $addFields: {
        relevanceScore: {
          $add: [
            { $ifNull: ["$textScore", 0] },
            { $cond: [{ $eq: ["$sellerInfo.isVerified", true] }, 2, 0] },
            { $cond: [{ $eq: ["$organic.certified", true] }, 1.5, 0] },
            { $cond: [{ $gte: ["$ratings.average", 4.5] }, 2, 0] },
            { $cond: [{ $gt: ["$inventory.quantity", 0] }, 1, 0] },
          ],
        },
      },
    })

    // Sort
    const sortStage = {}
    switch (sort) {
      case "relevance":
        sortStage.relevanceScore = -1
        sortStage.createdAt = -1
        break
      case "newest":
        sortStage.createdAt = -1
        break
      case "oldest":
        sortStage.createdAt = 1
        break
      case "price_asc":
        sortStage["pricing.price"] = 1
        break
      case "price_desc":
        sortStage["pricing.price"] = -1
        break
      case "rating":
        sortStage["ratings.average"] = -1
        sortStage["ratings.count"] = -1
        break
      case "popular":
        sortStage["stats.views"] = -1
        sortStage["stats.sales"] = -1
        break
      default:
        sortStage.createdAt = -1
    }
    pipeline.push({ $sort: sortStage })

    // Facets for counts and results
    pipeline.push({
      $facet: {
        // Main results
        results: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              name: 1,
              slug: 1,
              images: { $slice: ["$images", 1] },
              pricing: 1,
              category: 1,
              quality: 1,
              organic: 1,
              ratings: 1,
              inventory: 1,
              location: 1,
              seller: "$sellerInfo",
              relevanceScore: 1,
              createdAt: 1,
            },
          },
        ],
        // Total count
        totalCount: [{ $count: "count" }],
        // Category facets
        categoryFacets: [
          { $group: { _id: "$category.name", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 20 },
        ],
        // Quality facets
        qualityFacets: [{ $group: { _id: "$quality", count: { $sum: 1 } } }, { $sort: { count: -1 } }],
        // Price range
        priceRange: [
          {
            $group: {
              _id: null,
              minPrice: { $min: "$pricing.price" },
              maxPrice: { $max: "$pricing.price" },
              avgPrice: { $avg: "$pricing.price" },
            },
          },
        ],
        // Location facets
        locationFacets: [
          { $group: { _id: "$location.state", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 15 },
        ],
        // Organic count
        organicCount: [{ $match: { "organic.certified": true } }, { $count: "count" }],
        // Verified sellers count
        verifiedCount: [{ $match: { "sellerInfo.isVerified": true } }, { $count: "count" }],
      },
    })

    const [result] = await Product.aggregate(pipeline)

    const totalCount = result.totalCount[0]?.count || 0
    const totalPages = Math.ceil(totalCount / limit)

    // Build facets response
    const facets = {
      categories: result.categoryFacets.map((f) => ({ name: f._id, count: f.count })),
      qualities: result.qualityFacets.map((f) => ({ name: f._id, count: f.count })),
      priceRange: result.priceRange[0] || { minPrice: 0, maxPrice: 0, avgPrice: 0 },
      locations: result.locationFacets.map((f) => ({ state: f._id, count: f.count })),
      organicCount: result.organicCount[0]?.count || 0,
      verifiedCount: result.verifiedCount[0]?.count || 0,
    }

    res.json({
      success: true,
      query: searchTerm || null,
      filters: {
        category,
        subcategory,
        minPrice,
        maxPrice,
        quality,
        organic,
        verified,
        inStock,
        minRating,
        state,
        city,
      },
      products: result.results,
      facets,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    })
  }),
)

// ===========================================
// EXPERT SEARCH
// ===========================================

/**
 * @route   GET /api/search/experts
 * @desc    Search experts by specialization, location, rating
 * @access  Public
 */
router.get(
  "/experts",
  searchValidation,
  validateSearch,
  asyncHandler(async (req, res) => {
    const {
      q: searchTerm,
      page = 1,
      limit = 20,
      sort = "relevance",
      specialization,
      minExperience,
      maxExperience,
      minRating,
      verified,
      available,
      state,
      city,
      lat,
      lng,
      radius = 100,
    } = req.query

    const skip = (page - 1) * limit

    // Build match stage
    const matchStage = {
      role: "expert",
      status: "active",
    }

    // Text search
    if (searchTerm && searchTerm.trim()) {
      matchStage.$text = { $search: searchTerm }
    }

    // Specialization filter
    if (specialization) {
      const specs = Array.isArray(specialization) ? specialization : [specialization]
      matchStage["expertProfile.specializations"] = { $in: specs }
    }

    // Experience range
    if (minExperience !== undefined || maxExperience !== undefined) {
      matchStage["expertProfile.experience"] = {}
      if (minExperience !== undefined) {
        matchStage["expertProfile.experience"].$gte = Number.parseInt(minExperience)
      }
      if (maxExperience !== undefined) {
        matchStage["expertProfile.experience"].$lte = Number.parseInt(maxExperience)
      }
    }

    // Rating filter
    if (minRating) {
      matchStage.rating = { $gte: Number.parseFloat(minRating) }
    }

    // Verified filter
    if (verified === "true") {
      matchStage["expertProfile.isVerified"] = true
    }

    // Availability filter
    if (available === "true") {
      matchStage["expertProfile.availability.isAvailable"] = true
    }

    // Location filters
    if (state) {
      matchStage["address.state"] = new RegExp(state, "i")
    }
    if (city) {
      matchStage["address.city"] = new RegExp(city, "i")
    }

    // Geospatial filter
    if (lat && lng) {
      matchStage["location.coordinates"] = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number.parseFloat(lng), Number.parseFloat(lat)],
          },
          $maxDistance: radius * 1000,
        },
      }
    }

    // Aggregation pipeline
    const pipeline = [{ $match: matchStage }]

    // Add text score
    if (searchTerm) {
      pipeline.push({
        $addFields: {
          textScore: { $meta: "textScore" },
        },
      })
    }

    // Add computed score
    pipeline.push({
      $addFields: {
        relevanceScore: {
          $add: [
            { $ifNull: ["$textScore", 0] },
            { $cond: [{ $eq: ["$expertProfile.isVerified", true] }, 3, 0] },
            { $cond: [{ $gte: ["$rating", 4.5] }, 2, 0] },
            { $multiply: [{ $min: [{ $ifNull: ["$expertProfile.experience", 0] }, 10] }, 0.2] },
            { $multiply: [{ $min: [{ $ifNull: ["$expertProfile.stats.totalAnswers", 0] }, 100] }, 0.01] },
          ],
        },
      },
    })

    // Sort
    const sortStage = {}
    switch (sort) {
      case "relevance":
        sortStage.relevanceScore = -1
        break
      case "rating":
        sortStage.rating = -1
        sortStage.ratingCount = -1
        break
      case "experience":
        sortStage["expertProfile.experience"] = -1
        break
      case "answers":
        sortStage["expertProfile.stats.totalAnswers"] = -1
        break
      default:
        sortStage.relevanceScore = -1
    }
    pipeline.push({ $sort: sortStage })

    // Facets
    pipeline.push({
      $facet: {
        results: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              name: 1,
              avatar: 1,
              rating: 1,
              ratingCount: 1,
              "expertProfile.specializations": 1,
              "expertProfile.experience": 1,
              "expertProfile.qualification": 1,
              "expertProfile.isVerified": 1,
              "expertProfile.availability": 1,
              "expertProfile.stats": 1,
              "expertProfile.bio": 1,
              "address.city": 1,
              "address.state": 1,
              relevanceScore: 1,
            },
          },
        ],
        totalCount: [{ $count: "count" }],
        specializationFacets: [
          { $unwind: "$expertProfile.specializations" },
          { $group: { _id: "$expertProfile.specializations", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
        experienceRange: [
          {
            $group: {
              _id: null,
              minExp: { $min: "$expertProfile.experience" },
              maxExp: { $max: "$expertProfile.experience" },
              avgExp: { $avg: "$expertProfile.experience" },
            },
          },
        ],
        locationFacets: [
          { $group: { _id: "$address.state", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 15 },
        ],
      },
    })

    const [result] = await User.aggregate(pipeline)

    const totalCount = result.totalCount[0]?.count || 0
    const totalPages = Math.ceil(totalCount / limit)

    const facets = {
      specializations: result.specializationFacets.map((f) => ({ name: f._id, count: f.count })),
      experienceRange: result.experienceRange[0] || { minExp: 0, maxExp: 0, avgExp: 0 },
      locations: result.locationFacets.map((f) => ({ state: f._id, count: f.count })),
    }

    res.json({
      success: true,
      query: searchTerm || null,
      experts: result.results,
      facets,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    })
  }),
)

// ===========================================
// QUESTION & ARTICLE SEARCH
// ===========================================

/**
 * @route   GET /api/search/questions
 * @desc    Search questions in crop advisory
 * @access  Public
 */
router.get(
  "/questions",
  searchValidation,
  validateSearch,
  asyncHandler(async (req, res) => {
    const {
      q: searchTerm,
      page = 1,
      limit = 20,
      sort = "relevance",
      category,
      status,
      hasAnswer,
      tags,
      cropType,
    } = req.query

    const skip = (page - 1) * limit

    const matchStage = {}

    if (searchTerm && searchTerm.trim()) {
      matchStage.$text = { $search: searchTerm }
    }

    if (category) {
      matchStage["category.name"] = category
    }

    if (status) {
      matchStage.status = status
    } else {
      matchStage.status = { $in: ["open", "answered", "resolved"] }
    }

    if (hasAnswer === "true") {
      matchStage.answersCount = { $gt: 0 }
    } else if (hasAnswer === "false") {
      matchStage.answersCount = 0
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(",")
      matchStage.tags = { $in: tagArray }
    }

    if (cropType) {
      matchStage["cropInfo.name"] = new RegExp(cropType, "i")
    }

    const pipeline = [{ $match: matchStage }]

    if (searchTerm) {
      pipeline.push({
        $addFields: { textScore: { $meta: "textScore" } },
      })
    }

    // Lookup author
    pipeline.push({
      $lookup: {
        from: "users",
        localField: "author",
        foreignField: "_id",
        as: "authorInfo",
        pipeline: [{ $project: { name: 1, avatar: 1, role: 1 } }],
      },
    })
    pipeline.push({ $unwind: { path: "$authorInfo", preserveNullAndEmptyArrays: true } })

    // Sort
    const sortStage = {}
    switch (sort) {
      case "relevance":
        if (searchTerm) sortStage.textScore = -1
        sortStage.createdAt = -1
        break
      case "newest":
        sortStage.createdAt = -1
        break
      case "oldest":
        sortStage.createdAt = 1
        break
      case "popular":
        sortStage.views = -1
        sortStage.answersCount = -1
        break
      case "unanswered":
        sortStage.answersCount = 1
        sortStage.createdAt = -1
        break
      default:
        sortStage.createdAt = -1
    }
    pipeline.push({ $sort: sortStage })

    // Facets
    pipeline.push({
      $facet: {
        results: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              title: 1,
              description: { $substr: ["$description", 0, 200] },
              category: 1,
              tags: 1,
              status: 1,
              answersCount: 1,
              views: 1,
              author: "$authorInfo",
              createdAt: 1,
            },
          },
        ],
        totalCount: [{ $count: "count" }],
        categoryFacets: [{ $group: { _id: "$category.name", count: { $sum: 1 } } }, { $sort: { count: -1 } }],
        statusFacets: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
        tagFacets: [
          { $unwind: "$tags" },
          { $group: { _id: "$tags", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 20 },
        ],
      },
    })

    const [result] = await Question.aggregate(pipeline)

    const totalCount = result.totalCount[0]?.count || 0
    const totalPages = Math.ceil(totalCount / limit)

    res.json({
      success: true,
      query: searchTerm || null,
      questions: result.results,
      facets: {
        categories: result.categoryFacets.map((f) => ({ name: f._id, count: f.count })),
        statuses: result.statusFacets.map((f) => ({ status: f._id, count: f.count })),
        tags: result.tagFacets.map((f) => ({ tag: f._id, count: f.count })),
      },
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    })
  }),
)

/**
 * @route   GET /api/search/articles
 * @desc    Search knowledge base articles
 * @access  Public
 */
router.get(
  "/articles",
  searchValidation,
  validateSearch,
  asyncHandler(async (req, res) => {
    const {
      q: searchTerm,
      page = 1,
      limit = 20,
      sort = "relevance",
      category,
      author,
      tags,
      minReadTime,
      maxReadTime,
    } = req.query

    const skip = (page - 1) * limit

    const matchStage = {
      status: "published",
    }

    if (searchTerm && searchTerm.trim()) {
      matchStage.$text = { $search: searchTerm }
    }

    if (category) {
      matchStage["category.name"] = category
    }

    if (author) {
      matchStage.author = new mongoose.Types.ObjectId(author)
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(",")
      matchStage.tags = { $in: tagArray }
    }

    if (minReadTime || maxReadTime) {
      matchStage.readTime = {}
      if (minReadTime) matchStage.readTime.$gte = Number.parseInt(minReadTime)
      if (maxReadTime) matchStage.readTime.$lte = Number.parseInt(maxReadTime)
    }

    const pipeline = [{ $match: matchStage }]

    if (searchTerm) {
      pipeline.push({
        $addFields: { textScore: { $meta: "textScore" } },
      })
    }

    // Lookup author
    pipeline.push({
      $lookup: {
        from: "users",
        localField: "author",
        foreignField: "_id",
        as: "authorInfo",
        pipeline: [{ $project: { name: 1, avatar: 1, "expertProfile.specializations": 1 } }],
      },
    })
    pipeline.push({ $unwind: { path: "$authorInfo", preserveNullAndEmptyArrays: true } })

    // Sort
    const sortStage = {}
    switch (sort) {
      case "relevance":
        if (searchTerm) sortStage.textScore = -1
        sortStage.createdAt = -1
        break
      case "newest":
        sortStage.createdAt = -1
        break
      case "popular":
        sortStage.views = -1
        sortStage["stats.likes"] = -1
        break
      case "readTime":
        sortStage.readTime = 1
        break
      default:
        sortStage.createdAt = -1
    }
    pipeline.push({ $sort: sortStage })

    // Facets
    pipeline.push({
      $facet: {
        results: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              title: 1,
              slug: 1,
              excerpt: 1,
              coverImage: 1,
              category: 1,
              tags: 1,
              readTime: 1,
              views: 1,
              "stats.likes": 1,
              author: "$authorInfo",
              createdAt: 1,
            },
          },
        ],
        totalCount: [{ $count: "count" }],
        categoryFacets: [{ $group: { _id: "$category.name", count: { $sum: 1 } } }, { $sort: { count: -1 } }],
        tagFacets: [
          { $unwind: "$tags" },
          { $group: { _id: "$tags", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 20 },
        ],
        readTimeRange: [
          {
            $group: {
              _id: null,
              minReadTime: { $min: "$readTime" },
              maxReadTime: { $max: "$readTime" },
              avgReadTime: { $avg: "$readTime" },
            },
          },
        ],
      },
    })

    const [result] = await Article.aggregate(pipeline)

    const totalCount = result.totalCount[0]?.count || 0
    const totalPages = Math.ceil(totalCount / limit)

    res.json({
      success: true,
      query: searchTerm || null,
      articles: result.results,
      facets: {
        categories: result.categoryFacets.map((f) => ({ name: f._id, count: f.count })),
        tags: result.tagFacets.map((f) => ({ tag: f._id, count: f.count })),
        readTimeRange: result.readTimeRange[0] || { minReadTime: 0, maxReadTime: 0, avgReadTime: 0 },
      },
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    })
  }),
)

// ===========================================
// AUTOCOMPLETE & SUGGESTIONS
// ===========================================

/**
 * @route   GET /api/search/autocomplete
 * @desc    Get search suggestions as user types
 * @access  Public
 */
router.get(
  "/autocomplete",
  query("q").isString().trim().isLength({ min: 1, max: 100 }),
  query("type").optional().isIn(["products", "questions", "articles", "experts", "all"]),
  validateSearch,
  asyncHandler(async (req, res) => {
    const { q: prefix, type = "all" } = req.query

    if (prefix.length < 2) {
      return res.json({ success: true, suggestions: [] })
    }

    // Check cache
    const cacheKeyStr = `autocomplete:${type}:${prefix.toLowerCase()}`
    const cached = await getCachedResults(cacheKeyStr)
    if (cached) {
      return res.json({ success: true, suggestions: cached, fromCache: true })
    }

    const suggestions = []
    const regex = new RegExp(`^${prefix}`, "i")
    const limit = 5

    const promises = []

    // Product names
    if (type === "all" || type === "products") {
      promises.push(
        Product.find({ name: regex, status: "active" }, { name: 1, "category.name": 1 })
          .limit(limit)
          .lean()
          .then((products) => {
            products.forEach((p) => {
              suggestions.push({
                text: p.name,
                type: "product",
                category: p.category?.name,
              })
            })
          }),
      )
    }

    // Question titles
    if (type === "all" || type === "questions") {
      promises.push(
        Question.find({ title: regex, status: { $ne: "deleted" } }, { title: 1 })
          .limit(limit)
          .lean()
          .then((questions) => {
            questions.forEach((q) => {
              suggestions.push({
                text: q.title,
                type: "question",
              })
            })
          }),
      )
    }

    // Article titles
    if (type === "all" || type === "articles") {
      promises.push(
        Article.find({ title: regex, status: "published" }, { title: 1 })
          .limit(limit)
          .lean()
          .then((articles) => {
            articles.forEach((a) => {
              suggestions.push({
                text: a.title,
                type: "article",
              })
            })
          }),
      )
    }

    // Expert names
    if (type === "all" || type === "experts") {
      promises.push(
        User.find({ name: regex, role: "expert", status: "active" }, { name: 1, "expertProfile.specializations": 1 })
          .limit(limit)
          .lean()
          .then((experts) => {
            experts.forEach((e) => {
              suggestions.push({
                text: e.name,
                type: "expert",
                specializations: e.expertProfile?.specializations?.slice(0, 2),
              })
            })
          }),
      )
    }

    await Promise.all(promises)

    // Sort by relevance (exact prefix match first)
    suggestions.sort((a, b) => {
      const aStartsWith = a.text.toLowerCase().startsWith(prefix.toLowerCase())
      const bStartsWith = b.text.toLowerCase().startsWith(prefix.toLowerCase())
      if (aStartsWith && !bStartsWith) return -1
      if (!aStartsWith && bStartsWith) return 1
      return a.text.localeCompare(b.text)
    })

    // Limit total suggestions
    const limitedSuggestions = suggestions.slice(0, 10)

    // Cache for 5 minutes
    await setCachedResults(cacheKeyStr, limitedSuggestions, 300)

    res.json({
      success: true,
      suggestions: limitedSuggestions,
    })
  }),
)

/**
 * @route   GET /api/search/popular
 * @desc    Get popular searches
 * @access  Public
 */
router.get(
  "/popular",
  asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query

    // Check cache
    const cacheKeyStr = "search:popular"
    const cached = await getCachedResults(cacheKeyStr)
    if (cached) {
      return res.json({ success: true, searches: cached, fromCache: true })
    }

    // Get popular searches from last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const popularSearches = await SearchHistory.aggregate([
      {
        $match: {
          lastSearchedAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: "$query",
          totalCount: { $sum: "$count" },
          uniqueUsers: { $addToSet: "$user" },
        },
      },
      {
        $project: {
          query: "$_id",
          count: "$totalCount",
          uniqueSearchers: { $size: "$uniqueUsers" },
        },
      },
      {
        $sort: { count: -1, uniqueSearchers: -1 },
      },
      {
        $limit: Number.parseInt(limit),
      },
    ])

    // Cache for 1 hour
    await setCachedResults(cacheKeyStr, popularSearches, 3600)

    res.json({
      success: true,
      searches: popularSearches,
    })
  }),
)

/**
 * @route   GET /api/search/recent
 * @desc    Get user's recent searches
 * @access  Private
 */
router.get(
  "/recent",
  authenticate,
  asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query

    const recentSearches = await SearchHistory.find({ user: req.user._id })
      .sort({ lastSearchedAt: -1 })
      .limit(Number.parseInt(limit))
      .select("query count lastSearchedAt")
      .lean()

    res.json({
      success: true,
      searches: recentSearches,
    })
  }),
)

/**
 * @route   DELETE /api/search/recent
 * @desc    Clear user's search history
 * @access  Private
 */
router.delete(
  "/recent",
  authenticate,
  asyncHandler(async (req, res) => {
    await SearchHistory.deleteMany({ user: req.user._id })

    res.json({
      success: true,
      message: "Search history cleared",
    })
  }),
)

// ===========================================
// TRENDING & RECOMMENDED
// ===========================================

/**
 * @route   GET /api/search/trending
 * @desc    Get trending products and topics
 * @access  Public
 */
router.get(
  "/trending",
  asyncHandler(async (req, res) => {
    const { type = "all" } = req.query

    const cacheKeyStr = `trending:${type}`
    const cached = await getCachedResults(cacheKeyStr)
    if (cached) {
      return res.json({ success: true, ...cached, fromCache: true })
    }

    const results = {
      products: [],
      questions: [],
      articles: [],
      topics: [],
    }

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const promises = []

    // Trending products (by views and sales in last week)
    if (type === "all" || type === "products") {
      promises.push(
        Product.find({
          status: "active",
          updatedAt: { $gte: oneWeekAgo },
        })
          .sort({ "stats.views": -1, "stats.sales": -1 })
          .limit(10)
          .populate("seller", "name avatar isVerified")
          .select("name images pricing ratings category")
          .lean()
          .then((products) => {
            results.products = products
          }),
      )
    }

    // Trending questions (by views and answers in last week)
    if (type === "all" || type === "questions") {
      promises.push(
        Question.find({
          status: { $in: ["open", "answered"] },
          createdAt: { $gte: oneWeekAgo },
        })
          .sort({ views: -1, answersCount: -1 })
          .limit(10)
          .populate("author", "name avatar")
          .select("title category tags answersCount views")
          .lean()
          .then((questions) => {
            results.questions = questions
          }),
      )
    }

    // Trending articles (by views in last week)
    if (type === "all" || type === "articles") {
      promises.push(
        Article.find({
          status: "published",
          updatedAt: { $gte: oneWeekAgo },
        })
          .sort({ views: -1, "stats.likes": -1 })
          .limit(10)
          .populate("author", "name avatar")
          .select("title excerpt coverImage category readTime views")
          .lean()
          .then((articles) => {
            results.articles = articles
          }),
      )
    }

    // Trending topics (aggregate tags from recent content)
    if (type === "all" || type === "topics") {
      promises.push(
        (async () => {
          const [productTags, questionTags] = await Promise.all([
            Product.aggregate([
              { $match: { createdAt: { $gte: oneWeekAgo }, status: "active" } },
              { $unwind: "$tags" },
              { $group: { _id: "$tags", count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 10 },
            ]),
            Question.aggregate([
              { $match: { createdAt: { $gte: oneWeekAgo } } },
              { $unwind: "$tags" },
              { $group: { _id: "$tags", count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 10 },
            ]),
          ])

          // Merge and dedupe
          const topicMap = new Map()
            ;[...productTags, ...questionTags].forEach((t) => {
              const existing = topicMap.get(t._id) || 0
              topicMap.set(t._id, existing + t.count)
            })

          results.topics = Array.from(topicMap.entries())
            .map(([topic, count]) => ({ topic, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 15)
        })(),
      )
    }

    await Promise.all(promises)

    // Cache for 30 minutes
    await setCachedResults(cacheKeyStr, results, 1800)

    res.json({
      success: true,
      ...results,
    })
  }),
)

// ===========================================
// HELPER: Update popular searches counter
// ===========================================

const updatePopularSearches = async (searchTerm) => {
  if (!redis) return

  try {
    const key = "popular_searches"
    const normalizedTerm = searchTerm.toLowerCase().trim()

    // Increment score in sorted set
    await redis.zincrby(key, 1, normalizedTerm)

    // Keep only top 1000 searches
    const count = await redis.zcard(key)
    if (count > 1000) {
      await redis.zremrangebyrank(key, 0, count - 1001)
    }
  } catch (err) {
    // Ignore errors
  }
}

// ===========================================
// SEARCH HISTORY MODEL
// ===========================================

// Export model definition (should be in separate file)
const searchHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    query: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 200,
    },
    count: {
      type: Number,
      default: 1,
    },
    lastSearchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

// Compound index for user + query uniqueness
searchHistorySchema.index({ user: 1, query: 1 }, { unique: true })

// TTL index - auto delete after 90 days of inactivity
searchHistorySchema.index({ lastSearchedAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 })

// Create model if not exists
let SearchHistoryModel
try {
  SearchHistoryModel = mongoose.model("SearchHistory")
} catch {
  SearchHistoryModel = mongoose.model("SearchHistory", searchHistorySchema)
}

module.exports = router
