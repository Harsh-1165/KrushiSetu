/**
 * Product Marketplace API Routes
 * Complete CRUD operations for agricultural products in GreenTrace
 *
 * @module routes/products
 * @requires express
 * @requires mongoose
 */

const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")
const path = require("path")
const fs = require("fs").promises

const Product = require("../models/Product")
const Review = require("../models/Review")
const User = require("../models/User")
const { asyncHandler } = require("../utils/asyncHandler")
const AppError = require("../utils/AppError")
const { authenticate, optionalAuth, authorize } = require("../middleware/auth")
const { apiLimiter } = require("../middleware/rateLimiter")
const { uploadProductImages, hasCloudinary } = require("../middleware/upload")

// Alias for compatibility
const protect = authenticate

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build filter query from request parameters
 * @param {Object} query - Express request query
 * @returns {Object} MongoDB filter object
 */
/**
 * Safely parse JSON from form body (multipart sends strings)
 */
const safeParse = (value, fallback) => {
  if (value === undefined || value === null) return fallback
  if (typeof value !== "string") return value
  try {
    return value.trim() ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

const buildProductFilter = (query) => {
  // Treat both "active" and "available" as listed
  const filter = { status: { $in: ["active", "available"] } }

  // Category filter
  if (query.category) {
    filter.category = query.category
  }

  // Subcategory filter
  if (query.subcategory) {
    filter.subcategory = query.subcategory
  }

  // Seller filter
  if (query.seller) {
    if (mongoose.Types.ObjectId.isValid(query.seller)) {
      filter.seller = new mongoose.Types.ObjectId(query.seller)
    }
  }

  // Price range filter
  if (query.minPrice || query.maxPrice) {
    filter["price.current"] = {}
    if (query.minPrice) {
      filter["price.current"].$gte = Number.parseFloat(query.minPrice)
    }
    if (query.maxPrice) {
      filter["price.current"].$lte = Number.parseFloat(query.maxPrice)
    }
  }

  // Availability filter
  if (query.inStock === "true") {
    filter["inventory.available"] = { $gt: 0 }
  }

  // Organic filter
  if (query.organic === "true") {
    filter["attributes.isOrganic"] = true
  }

  // Location/State filter
  if (query.state) {
    filter["location.state"] = new RegExp(query.state, "i")
  }

  if (query.district) {
    filter["location.district"] = new RegExp(query.district, "i")
  }

  // Rating filter
  if (query.minRating) {
    filter["ratings.average"] = { $gte: Number.parseFloat(query.minRating) }
  }

  // Search query (text search)
  if (query.search) {
    filter.$text = { $search: query.search }
  }

  // Date filters
  if (query.createdAfter) {
    filter.createdAt = { $gte: new Date(query.createdAfter) }
  }

  // Harvest date filter
  if (query.harvestedAfter) {
    filter["attributes.harvestDate"] = { $gte: new Date(query.harvestedAfter) }
  }

  return filter
}

/**
 * Build sort options from request parameters
 */
const buildSortOptions = (sortBy = "createdAt", sortOrder = "desc") => {
  const allowedSortFields = ["createdAt", "price.current", "ratings.average", "inventory.sold", "name", "views"]

  const field = allowedSortFields.includes(sortBy) ? sortBy : "createdAt"
  const order = sortOrder === "asc" ? 1 : -1

  return { [field]: order }
}

/**
 * Calculate shipping cost based on distance and weight
 */
const calculateShipping = (product, buyerLocation) => {
  const baseRate = 50 // Base shipping rate in INR
  const perKgRate = 10 // Per kg rate
  const weight = product.inventory?.weight || 1

  // Simplified distance-based calculation
  let distanceMultiplier = 1
  if (buyerLocation && product.location) {
    // Same state = 1x, different state = 1.5x
    distanceMultiplier = buyerLocation.state === product.location.state ? 1 : 1.5
  }

  return Math.round(baseRate + weight * perKgRate * distanceMultiplier)
}

// ============================================================================
// PRODUCT ROUTES
// ============================================================================

/**
 * @route   POST /api/products
 * @desc    Create a new product listing
 * @access  Private (Farmer only, KYC required)
 *
 * Request Body (multipart/form-data):
 * - name (string, required): Product name
 * - description (string, required): Detailed description
 * - category (string, required): Product category
 * - subcategory (string): Product subcategory
 * - price.current (number, required): Current selling price
 * - price.unit (string, required): Price unit (kg, quintal, ton, piece, dozen)
 * - price.mrp (number): Maximum retail price
 * - price.bulkPricing (array): Bulk pricing tiers
 * - inventory.available (number, required): Available quantity
 * - inventory.minOrder (number): Minimum order quantity
 * - inventory.maxOrder (number): Maximum order quantity
 * - attributes.variety (string): Product variety
 * - attributes.grade (string): Quality grade
 * - attributes.isOrganic (boolean): Organic certification
 * - attributes.harvestDate (date): Harvest date
 * - attributes.expiryDate (date): Expiry/best before date
 * - images (files): Product images (max 10)
 *
 * Response:
 * {
 *   success: true,
 *   message: "Product created successfully",
 *   data: { product: {...} }
 * }
 */
router.post(
  "/",
  apiLimiter,
  protect,
  authorize("farmer", "admin"),
  uploadProductImages,
  asyncHandler(async (req, res) => {
    const {
      name,
      description,
      category,
      subcategory,
      price,
      inventory,
      attributes,
      shipping,
      tags,
      cropType,
      harvestDate,
      isOrganic,
      certifications,
      minOrderQty,
      priceType,
      status,
      needsExpertReview,
    } = req.body

    // Validate required fields
    if (!name || !description || !category) {
      throw new AppError("Name, description, and category are required", 400)
    }

    // Require at least 1 image (file present; Cloudinary optional – use placeholders if not configured)
    if (!req.files || req.files.length < 1) {
      throw new AppError("At least one product image is required", 400)
    }

    // Parse JSON fields if sent as strings (safe parse to avoid 500 on invalid JSON)
    const parsedPrice = safeParse(price, null)
    const parsedInventory = safeParse(inventory, null)
    const parsedAttributes = safeParse(attributes, undefined)
    const parsedShipping = safeParse(shipping, undefined)
    const parsedTags = safeParse(tags, undefined)
    const parsedCerts = Array.isArray(safeParse(certifications, [])) ? safeParse(certifications, []) : []

    if (!parsedPrice?.current || !parsedPrice?.unit) {
      throw new AppError("Price and unit are required", 400)
    }

    if (!parsedInventory?.available || parsedInventory.available <= 0) {
      throw new AppError("Available inventory must be greater than 0", 400)
    }

    // Get seller's location from farmer profile (farmLocation auto from profile)
    const seller = await User.findById(req.user._id).select("address farmerProfile")
    if (!seller) {
      throw new AppError("Seller not found", 404)
    }

    // Build location from farmer profile (farmLocation auto from profile)
    const farmLocation = {
      state: seller.address?.state || "",
      district: seller.address?.district || "",
      pincode: seller.address?.pincode || "",
      coordinates: seller.address?.coordinates && seller.address.coordinates.length === 2
        ? seller.address.coordinates
        : { type: "Point", coordinates: [0, 0] },
    }

    // Process uploaded images: use Cloudinary URLs when available, else placeholder so product still saves
    const cloudinaryUrls = (req.files || []).map((file) => (file.path ? file.path : file.url || file.secure_url)).filter(Boolean)
    const placeholderUrl = "https://placehold.co/400x300?text=Product+Image"
    const images = cloudinaryUrls.length > 0 ? cloudinaryUrls : Array(req.files.length).fill(placeholderUrl)

    // priceType: fixed -> negotiable false, negotiable -> negotiable true
    const isNegotiable = priceType === "negotiable" || parsedPrice?.negotiable === true

    // Normalize certifications: array of strings to array of { name }
    const certsArray = Array.isArray(parsedCerts)
      ? parsedCerts.map((c) => (typeof c === "string" ? { name: c } : c))
      : []

    // Default status = available, default rating = 0 (set in schema)
    const productStatus = status === "out-of-stock" || status === "upcoming" ? status : "available"
    const needsReview = needsExpertReview === true || needsExpertReview === "true"
    const approved = !needsReview // approved = true unless needsExpertReview

    const product = new Product({
      name: name.trim(),
      slug: generateSlug(name),
      description: description.trim(),
      category,
      subcategory: subcategory || null,
      seller: req.user._id,
      farmer: req.user._id,
      approved,
      needsExpertReview: needsReview,
      price: {
        current: Number.parseFloat(parsedPrice.current),
        mrp: parsedPrice.mrp ? Number.parseFloat(parsedPrice.mrp) : null,
        unit: parsedPrice.unit,
        currency: parsedPrice.currency || "INR",
        bulkPricing: parsedPrice.bulkPricing || [],
        negotiable: isNegotiable,
      },
      inventory: {
        available: Number.parseInt(parsedInventory.available),
        reserved: 0,
        sold: 0,
        minOrder: minOrderQty != null ? Number.parseInt(minOrderQty) : parsedInventory?.minOrder || 1,
        maxOrder: parsedInventory?.maxOrder ?? parsedInventory?.available,
        weight: parsedInventory?.weight || null,
        dimensions: parsedInventory?.dimensions || null,
      },
      attributes: {
        variety: parsedAttributes?.variety || null,
        cropType: cropType?.trim() || parsedAttributes?.cropType || null,
        grade: parsedAttributes?.grade || null,
        isOrganic: isOrganic === true || isOrganic === "true" || parsedAttributes?.isOrganic === true,
        certifications: certsArray.length ? certsArray : parsedAttributes?.certifications || [],
        harvestDate: harvestDate ? new Date(harvestDate) : parsedAttributes?.harvestDate ? new Date(parsedAttributes.harvestDate) : null,
        expiryDate: parsedAttributes?.expiryDate ? new Date(parsedAttributes.expiryDate) : null,
        storageInstructions: parsedAttributes?.storageInstructions || null,
        nutritionalInfo: parsedAttributes?.nutritionalInfo || null,
      },
      images,
      location: farmLocation,
      shipping: {
        available: parsedShipping?.available !== false,
        freeShippingAbove: parsedShipping?.freeShippingAbove || null,
        estimatedDays: parsedShipping?.estimatedDays || { min: 3, max: 7 },
        availableLocations: parsedShipping?.availableLocations || ["all"],
      },
      tags: parsedTags || [],
      status: productStatus,
      visibility: "public",
      ratings: { average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
    })

    await product.save()

    // Update seller's product count (non-fatal if User schema has no stats)
    try {
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { "stats.totalProducts": 1 },
      })
    } catch {
      // Ignore if User model has no stats path
    }

    // Populate seller info for response (User has name.first, name.last, not profile)
    await product.populate("seller", "name avatar ratings")

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: { product },
    })
  }),
)

/**
 * Generate URL-friendly slug from product name
 */
function generateSlug(name) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .substring(0, 100) + `-${Date.now().toString(36)}`
  )
}

/**
 * @route   GET /api/products
 * @desc    List all products with search, filters, and pagination
 * @access  Public (with optional auth for personalized results)
 *
 * Query Parameters:
 * - page (number): Page number (default: 1)
 * - limit (number): Items per page (default: 20, max: 100)
 * - search (string): Text search in name and description
 * - category (string): Filter by category
 * - subcategory (string): Filter by subcategory
 * - seller (string): Filter by seller ID
 * - minPrice (number): Minimum price
 * - maxPrice (number): Maximum price
 * - inStock (boolean): Only show in-stock items
 * - organic (boolean): Only show organic products
 * - state (string): Filter by state
 * - district (string): Filter by district
 * - minRating (number): Minimum rating
 * - sortBy (string): Sort field (createdAt, price.current, ratings.average, inventory.sold)
 * - sortOrder (string): Sort order (asc/desc)
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     products: [...],
 *     pagination: { page, limit, total, pages, hasNext, hasPrev },
 *     filters: { categories: [...], priceRange: {...} }
 *   }
 * }
 */
router.get(
  "/",
  apiLimiter,
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, sortBy = "createdAt", sortOrder = "desc" } = req.query

    const pageNum = Math.max(1, Number.parseInt(page))
    const limitNum = Math.min(100, Math.max(1, Number.parseInt(limit)))
    const skip = (pageNum - 1) * limitNum

    // Build filter and sort
    const filter = buildProductFilter(req.query)
    const sort = buildSortOptions(sortBy, sortOrder)

    // If text search is used, add score sorting
    const projection = req.query.search ? { score: { $meta: "textScore" } } : {}

    // Execute queries in parallel
    const [products, total, aggregateStats] = await Promise.all([
      Product.find(filter, projection)
        .populate("seller", "profile.firstName profile.lastName profile.avatar ratings location")
        .sort(req.query.search ? { score: { $meta: "textScore" }, ...sort } : sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(filter),
      Product.aggregate([
        { $match: { status: { $in: ["active", "available"] } } },
        {
          $group: {
            _id: null,
            minPrice: { $min: "$price.current" },
            maxPrice: { $max: "$price.current" },
            categories: { $addToSet: "$category" },
          },
        },
      ]),
    ])

    const pages = Math.ceil(total / limitNum)
    const stats = aggregateStats[0] || { minPrice: 0, maxPrice: 0, categories: [] }

    res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages,
          hasNext: pageNum < pages,
          hasPrev: pageNum > 1,
        },
        filters: {
          categories: stats.categories,
          priceRange: {
            min: stats.minPrice,
            max: stats.maxPrice,
          },
        },
      },
    })
  }),
)

/**
 * @route   GET /api/products/categories
 * @desc    Get all product categories with counts
 * @access  Public
 */
router.get(
  "/categories",
  apiLimiter,
  asyncHandler(async (req, res) => {
    const categories = await Product.aggregate([
      { $match: { status: "active" } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          subcategories: { $addToSet: "$subcategory" },
        },
      },
      { $sort: { count: -1 } },
      {
        $project: {
          _id: 0,
          name: "$_id",
          count: 1,
          subcategories: {
            $filter: {
              input: "$subcategories",
              as: "sub",
              cond: { $ne: ["$$sub", null] },
            },
          },
        },
      },
    ])

    res.status(200).json({
      success: true,
      data: { categories },
    })
  }),
)

/**
 * @route   GET /api/products/featured
 * @desc    Get featured/trending products
 * @access  Public
 */
router.get(
  "/featured",
  apiLimiter,
  asyncHandler(async (req, res) => {
    const { limit = 12 } = req.query
    const limitNum = Math.min(50, Math.max(1, Number.parseInt(limit)))

    // Get products with high ratings and recent sales
    const products = await Product.find({
      status: { $in: ["active", "available"] },
      "inventory.available": { $gt: 0 },
      "ratings.count": { $gte: 5 },
      "ratings.average": { $gte: 4 },
    })
      .populate("seller", "profile.firstName profile.lastName profile.avatar")
      .sort({ "ratings.average": -1, "inventory.sold": -1 })
      .limit(limitNum)
      .lean()

    res.status(200).json({
      success: true,
      data: { products },
    })
  }),
)

/**
 * @route   GET /api/products/public
 * @desc    Public marketplace for consumers - only approved, available products
 * @access  Public
 */
router.get(
  "/public",
  apiLimiter,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, sortBy = "createdAt", sortOrder = "desc", category, search, minPrice, maxPrice, state, minRating } = req.query
    const pageNum = Math.max(1, Number.parseInt(page))
    const limitNum = Math.min(100, Math.max(1, Number.parseInt(limit)))
    const skip = (pageNum - 1) * limitNum

    const filter = {
      status: "available",
      approved: true,
      "inventory.available": { $gt: 0 },
    }
    if (category) filter.category = category

    // Search
    if (search && search.trim()) {
      filter.$text = { $search: search.trim() }
    }

    // Price Filter
    if ((minPrice !== undefined && minPrice !== "") || (maxPrice !== undefined && maxPrice !== "")) {
      filter["price.current"] = {}
      if (minPrice !== undefined && minPrice !== "") filter["price.current"].$gte = Number.parseFloat(minPrice)
      if (maxPrice !== undefined && maxPrice !== "") filter["price.current"].$lte = Number.parseFloat(maxPrice)
    }

    // Location Filter
    if (state && state.trim()) {
      filter["location.state"] = new RegExp(state.trim(), "i")
    }

    // Rating Filter
    if (minRating) {
      filter["ratings.average"] = { $gte: Number.parseFloat(minRating) }
    }

    const sort = buildSortOptions(sortBy, sortOrder)
    const projection = search ? { score: { $meta: "textScore" } } : {}
    const sortOptions = search ? { score: { $meta: "textScore" }, ...sort } : sort

    const [products, total] = await Promise.all([
      Product.find(filter, projection)
        .populate("seller", "name profile farmerProfile address")
        .populate("farmer", "name profile farmerProfile address")
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(filter),
    ])
    const pages = Math.ceil(total / limitNum)

    res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages,
          hasNext: pageNum < pages,
          hasPrev: pageNum > 1,
        },
      },
    })
  }),
)

/**
 * @route   GET /api/products/farmer
 * @desc    Get all products for the authenticated farmer (inventory management)
 * @access  Private (Farmer only)
 */
router.get(
  "/farmer",
  apiLimiter,
  authenticate,
  authorize("farmer", "admin"),
  asyncHandler(async (req, res) => {
    const { status, search, sortBy = "createdAt", sortOrder = "desc" } = req.query

    console.log(`[DEBUG] /api/products/farmer called by user: ${req.user._id}`)

    const filter = { seller: req.user._id }

    // Status filter
    if (status) {
      if (status === "low_stock") {
        filter["inventory.available"] = { $lte: 10 }
      } else if (status === "out_of_stock") {
        filter["inventory.available"] = 0
      } else {
        filter.status = status
      }
    }

    // Search
    if (search) {
      filter.$text = { $search: search }
    }

    const sort = buildSortOptions(sortBy, sortOrder)

    const products = await Product.find(filter)
      .sort(sort)
      .select("name category subcategory price inventory status images ratings attributes createdAt")
      .lean()

    console.log(`[DEBUG] Found ${products.length} products for inventory dashboard`)

    // Calculate stats for the dashboard summary
    const stats = {
      totalProducts: products.length,
      lowStock: products.filter((p) => p.inventory.available <= 10 && p.inventory.available > 0).length,
      outOfStock: products.filter((p) => p.inventory.available === 0).length,
      totalQuantity: products.reduce((sum, p) => sum + p.inventory.available, 0),
    }

    res.status(200).json({
      success: true,
      data: {
        products,
        stats,
      },
    })
  }),
)

/**
 * @route   GET /api/products/nearby
 * @desc    Get products near a location
 * @access  Public
 */
router.get(
  "/nearby/:lat/:lng",
  apiLimiter,
  asyncHandler(async (req, res) => {
    const lat = Number.parseFloat(req.params.lat)
    const lng = Number.parseFloat(req.params.lng)

    if (isNaN(lat) || isNaN(lng)) {
      throw new AppError("Invalid coordinates", 400)
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new AppError("Coordinates out of range", 400)
    }

    const { radius = 100, limit = 20, category } = req.query
    const radiusKm = Math.min(500, Math.max(1, Number.parseFloat(radius)))
    const limitNum = Math.min(100, Math.max(1, Number.parseInt(limit)))

    const filter = {
      status: { $in: ["active", "available"] },
      "inventory.available": { $gt: 0 },
      "location.coordinates": {
        $geoWithin: {
          $centerSphere: [[lng, lat], radiusKm / 6371],
        },
      },
    }

    if (category) {
      filter.category = category
    }

    const products = await Product.find(filter)
      .populate("seller", "profile.firstName profile.lastName profile.avatar")
      .limit(limitNum)
      .lean()

    res.status(200).json({
      success: true,
      data: {
        products,
        center: { lat, lng },
        radius: radiusKm,
      },
    })
  }),
)

/**
 * @route   GET /api/products/:id
 * @desc    Get single product details
 * @access  Public
 *
 * URL Parameters:
 * - id (string): Product ID or slug
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     product: {...},
 *     relatedProducts: [...],
 *     sellerProducts: [...]
 *   }
 * }
 */
router.get(
  "/:id",
  apiLimiter,
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params

    // Find by ID or slug
    let product
    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id).populate(
        "seller",
        "name profile ratings stats.totalProducts stats.totalSales farmerProfile address createdAt",
      )
    } else {
      product = await Product.findOne({ slug: id }).populate(
        "seller",
        "name profile ratings stats.totalProducts stats.totalSales farmerProfile address createdAt",
      )
    }

    if (!product) {
      throw new AppError("Product not found", 404)
    }

    // Check visibility
    const isListed = product.status === "active" || product.status === "available"
    if (!isListed && product.visibility !== "public") {
      if (!req.user || (req.user._id.toString() !== product.seller._id.toString() && req.user.role !== "admin")) {
        throw new AppError("Product not found", 404)
      }
    }

    // Increment view count (fire and forget)
    Product.findByIdAndUpdate(product._id, { $inc: { views: 1 } }).exec()

    // Get related products and seller's other products in parallel
    const [relatedProducts, sellerProducts] = await Promise.all([
      // Related products (same category, excluding current)
      Product.find({
        _id: { $ne: product._id },
        category: product.category,
        status: { $in: ["active", "available"] },
        "inventory.available": { $gt: 0 },
      })
        .select("name slug images price ratings inventory.available")
        .limit(6)
        .lean(),
      // More from this seller
      Product.find({
        _id: { $ne: product._id },
        seller: product.seller._id,
        status: { $in: ["active", "available"] },
        "inventory.available": { $gt: 0 },
      })
        .select("name slug images price ratings inventory.available")
        .limit(4)
        .lean(),
    ])

    res.status(200).json({
      success: true,
      data: {
        product,
        relatedProducts,
        sellerProducts,
      },
    })
  }),
)

/**
 * @route   PUT /api/products/:id
 * @desc    Update product details
 * @access  Private (Owner or Admin only)
 *
 * Request Body:
 * Same as POST /api/products (all fields optional)
 */
router.put(
  "/:id",
  apiLimiter,
  authenticate,
  authorize("farmer", "admin"),
  uploadProductImages,
  asyncHandler(async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid product ID", 400)
    }

    const product = await Product.findById(id)
    if (!product) {
      throw new AppError("Product not found", 404)
    }

    // Check ownership
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      throw new AppError("You do not have permission to update this product", 403)
    }

    const updates = req.body

    // Parse JSON fields
    const parsedPrice = updates.price
      ? typeof updates.price === "string"
        ? JSON.parse(updates.price)
        : updates.price
      : null
    const parsedInventory = updates.inventory
      ? typeof updates.inventory === "string"
        ? JSON.parse(updates.inventory)
        : updates.inventory
      : null
    const parsedAttributes = updates.attributes
      ? typeof updates.attributes === "string"
        ? JSON.parse(updates.attributes)
        : updates.attributes
      : null
    const parsedShipping = updates.shipping
      ? typeof updates.shipping === "string"
        ? JSON.parse(updates.shipping)
        : updates.shipping
      : null

    // Update basic fields
    if (updates.name) {
      product.name = updates.name.trim()
      product.slug = generateSlug(updates.name)
    }
    if (updates.description) product.description = updates.description.trim()
    if (updates.category) product.category = updates.category
    if (updates.subcategory !== undefined) product.subcategory = updates.subcategory
    if (updates.tags) product.tags = typeof updates.tags === "string" ? JSON.parse(updates.tags) : updates.tags
    if (updates.status && req.user.role === "admin") product.status = updates.status
    if (updates.visibility) product.visibility = updates.visibility

    // Update price
    if (parsedPrice) {
      if (parsedPrice.current) product.price.current = Number.parseFloat(parsedPrice.current)
      if (parsedPrice.mrp) product.price.mrp = Number.parseFloat(parsedPrice.mrp)
      if (parsedPrice.unit) product.price.unit = parsedPrice.unit
      if (parsedPrice.bulkPricing) product.price.bulkPricing = parsedPrice.bulkPricing
      if (parsedPrice.negotiable !== undefined) product.price.negotiable = parsedPrice.negotiable
    }

    // Update inventory
    if (parsedInventory) {
      if (parsedInventory.available !== undefined)
        product.inventory.available = Number.parseInt(parsedInventory.available)
      if (parsedInventory.minOrder) product.inventory.minOrder = Number.parseInt(parsedInventory.minOrder)
      if (parsedInventory.maxOrder) product.inventory.maxOrder = Number.parseInt(parsedInventory.maxOrder)
      if (parsedInventory.weight) product.inventory.weight = parsedInventory.weight
    }

    // Update attributes
    if (parsedAttributes) {
      Object.keys(parsedAttributes).forEach((key) => {
        if (key === "harvestDate" || key === "expiryDate") {
          product.attributes[key] = parsedAttributes[key] ? new Date(parsedAttributes[key]) : null
        } else {
          product.attributes[key] = parsedAttributes[key]
        }
      })
    }

    // Update shipping
    if (parsedShipping) {
      Object.assign(product.shipping, parsedShipping)
    }

    // Handle new images (Cloudinary URLs as strings)
    if (req.files && req.files.length > 0) {
      const urls = req.files.map((f) => f.path || f.url || f.secure_url).filter(Boolean)
      product.images = (product.images || []).concat(urls)
    }

    // Handle image deletion (pass array of image URLs to delete)
    if (updates.deleteImages) {
      const toDelete =
        typeof updates.deleteImages === "string" ? JSON.parse(updates.deleteImages) : updates.deleteImages
      product.images = (product.images || []).filter((img) => !toDelete.includes(typeof img === "string" ? img : img.url))
    }

    // Handle primary image change (reorder so selected URL is first)
    if (updates.primaryImage && Array.isArray(product.images)) {
      const idx = product.images.findIndex((img) => (typeof img === "string" ? img : img?.url) === updates.primaryImage)
      if (idx > 0) {
        const arr = [...product.images]
        const [primary] = arr.splice(idx, 1)
        product.images = [primary, ...arr]
      }
    }

    product.updatedAt = new Date()
    await product.save()

    await product.populate("seller", "profile.firstName profile.lastName profile.avatar ratings")

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: { product },
    })
  }),
)

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete product (soft delete)
 * @access  Private (Owner or Admin only)
 */
router.delete(
  "/:id",
  apiLimiter,
  authenticate,
  authorize("farmer", "admin"),
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const { permanent = false } = req.query

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid product ID", 400)
    }

    const product = await Product.findById(id)
    if (!product) {
      throw new AppError("Product not found", 404)
    }

    // Check ownership
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      throw new AppError("You do not have permission to delete this product", 403)
    }

    // Check for pending orders
    const Order = require("../models/Order")
    const pendingOrders = await Order.countDocuments({
      "items.product": id,
      status: { $in: ["pending", "confirmed", "processing", "shipped"] },
    })

    if (pendingOrders > 0) {
      throw new AppError(`Cannot delete product with ${pendingOrders} pending order(s)`, 400)
    }

    if (permanent === "true" && req.user.role === "admin") {
      // Hard delete - remove images first
      for (const image of product.images) {
        const filePath = path.join(__dirname, "..", image.url)
        try {
          await fs.unlink(filePath)
        } catch (err) {
          // Continue even if file doesn't exist
        }
      }

      await Product.findByIdAndDelete(id)

      // Update seller's product count
      await User.findByIdAndUpdate(product.seller, {
        $inc: { "stats.totalProducts": -1 },
      })
    } else {
      // Soft delete
      product.status = "deleted"
      product.deletedAt = new Date()
      await product.save()
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    })
  }),
)

// ============================================================================
// PRODUCT REVIEW ROUTES
// ============================================================================

/**
 * @route   POST /api/products/:id/reviews
 * @desc    Add a review to a product
 * @access  Private (Consumers who have purchased the product)
 *
 * Request Body:
 * {
 *   rating (number, required): 1-5 star rating
 *   title (string): Review title
 *   comment (string, required): Review text
 *   images (array): Review images
 * }
 */
router.post(
  "/:id/reviews",
  apiLimiter,
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const { rating, title, comment, images } = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid product ID", 400)
    }

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      throw new AppError("Rating must be between 1 and 5", 400)
    }

    if (!comment || comment.trim().length < 10) {
      throw new AppError("Review comment must be at least 10 characters", 400)
    }

    const product = await Product.findById(id)
    if (!product) {
      throw new AppError("Product not found", 404)
    }

    // Check if user has already reviewed this product
    const existingReview = await Review.findOne({
      reviewer: req.user._id,
      targetType: "product",
      targetId: id,
    })

    if (existingReview) {
      throw new AppError("You have already reviewed this product", 400)
    }

    // Verify user has purchased this product (optional but recommended)
    const Order = require("../models/Order")
    const hasPurchased = await Order.findOne({
      buyer: req.user._id,
      "items.product": id,
      status: "delivered",
    })

    if (!hasPurchased && req.user.role !== "admin") {
      throw new AppError("You can only review products you have purchased", 400)
    }

    // Create review
    const review = new Review({
      reviewer: req.user._id,
      targetType: "product",
      targetId: id,
      sellerId: product.seller,
      orderId: hasPurchased?._id,
      rating: Number.parseInt(rating),
      title: title?.trim() || null,
      comment: comment.trim(),
      images: images || [],
      isVerifiedPurchase: !!hasPurchased,
      status: "published",
    })

    await review.save()

    // Update product ratings
    const allReviews = await Review.find({
      targetType: "product",
      targetId: id,
      status: "published",
    }).select("rating")

    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0)
    const avgRating = totalRating / allReviews.length

    // Calculate rating distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    allReviews.forEach((r) => {
      distribution[r.rating]++
    })

    await Product.findByIdAndUpdate(id, {
      "ratings.average": Math.round(avgRating * 10) / 10,
      "ratings.count": allReviews.length,
      "ratings.distribution": distribution,
    })

    // Also update seller ratings
    await updateSellerRatings(product.seller)

    await review.populate("reviewer", "profile.firstName profile.lastName profile.avatar")

    res.status(201).json({
      success: true,
      message: "Review added successfully",
      data: { review },
    })
  }),
)

/**
 * Update seller's aggregate ratings
 */
async function updateSellerRatings(sellerId) {
  const reviews = await Review.find({
    sellerId,
    status: "published",
  }).select("rating")

  if (reviews.length === 0) return

  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0)
  const avgRating = totalRating / reviews.length

  await User.findByIdAndUpdate(sellerId, {
    "ratings.average": Math.round(avgRating * 10) / 10,
    "ratings.count": reviews.length,
  })
}

/**
 * @route   GET /api/products/:id/reviews
 * @desc    Get all reviews for a product
 * @access  Public
 *
 * Query Parameters:
 * - page (number): Page number
 * - limit (number): Items per page
 * - sortBy (string): Sort field (createdAt, rating, helpfulCount)
 * - sortOrder (string): Sort order (asc/desc)
 * - rating (number): Filter by rating
 */
router.get(
  "/:id/reviews",
  apiLimiter,
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc", rating } = req.query

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid product ID", 400)
    }

    const pageNum = Math.max(1, Number.parseInt(page))
    const limitNum = Math.min(50, Math.max(1, Number.parseInt(limit)))
    const skip = (pageNum - 1) * limitNum

    // Build filter
    const filter = {
      targetType: "product",
      targetId: new mongoose.Types.ObjectId(id),
      status: "published",
    }

    if (rating) {
      filter.rating = Number.parseInt(rating)
    }

    // Build sort
    const allowedSortFields = ["createdAt", "rating", "helpfulCount"]
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt"
    const sort = { [sortField]: sortOrder === "asc" ? 1 : -1 }

    const [reviews, total, stats] = await Promise.all([
      Review.find(filter)
        .populate("reviewer", "profile.firstName profile.lastName profile.avatar")
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Review.countDocuments(filter),
      Review.aggregate([
        { $match: { targetType: "product", targetId: new mongoose.Types.ObjectId(id), status: "published" } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: "$rating" },
            count: { $sum: 1 },
            distribution: {
              $push: "$rating",
            },
          },
        },
      ]),
    ])

    const pages = Math.ceil(total / limitNum)

    // Calculate distribution from stats
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    if (stats[0]?.distribution) {
      stats[0].distribution.forEach((r) => {
        distribution[r]++
      })
    }

    res.status(200).json({
      success: true,
      data: {
        reviews,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages,
          hasNext: pageNum < pages,
          hasPrev: pageNum > 1,
        },
        stats: {
          average: stats[0]?.avgRating ? Math.round(stats[0].avgRating * 10) / 10 : 0,
          count: stats[0]?.count || 0,
          distribution,
        },
      },
    })
  }),
)

/**
 * @route   PUT /api/products/:id/reviews/:reviewId
 * @desc    Update a review
 * @access  Private (Review owner only)
 */
router.put(
  "/:id/reviews/:reviewId",
  apiLimiter,
  authenticate,
  asyncHandler(async (req, res) => {
    const { id, reviewId } = req.params
    const { rating, title, comment } = req.body

    const review = await Review.findOne({
      _id: reviewId,
      targetType: "product",
      targetId: id,
    })

    if (!review) {
      throw new AppError("Review not found", 404)
    }

    if (review.reviewer.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      throw new AppError("You can only edit your own reviews", 403)
    }

    // Update fields
    if (rating && rating >= 1 && rating <= 5) review.rating = Number.parseInt(rating)
    if (title !== undefined) review.title = title?.trim() || null
    if (comment && comment.trim().length >= 10) review.comment = comment.trim()

    review.isEdited = true
    review.updatedAt = new Date()
    await review.save()

    // Recalculate product ratings
    const product = await Product.findById(id)
    if (product) {
      const allReviews = await Review.find({
        targetType: "product",
        targetId: id,
        status: "published",
      }).select("rating")

      const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0)
      const avgRating = totalRating / allReviews.length

      await Product.findByIdAndUpdate(id, {
        "ratings.average": Math.round(avgRating * 10) / 10,
      })

      await updateSellerRatings(product.seller)
    }

    await review.populate("reviewer", "profile.firstName profile.lastName profile.avatar")

    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      data: { review },
    })
  }),
)

/**
 * @route   DELETE /api/products/:id/reviews/:reviewId
 * @desc    Delete a review
 * @access  Private (Review owner or Admin)
 */
router.delete(
  "/:id/reviews/:reviewId",
  apiLimiter,
  authenticate,
  asyncHandler(async (req, res) => {
    const { id, reviewId } = req.params

    const review = await Review.findOne({
      _id: reviewId,
      targetType: "product",
      targetId: id,
    })

    if (!review) {
      throw new AppError("Review not found", 404)
    }

    if (review.reviewer.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      throw new AppError("You can only delete your own reviews", 403)
    }

    await Review.findByIdAndDelete(reviewId)

    // Recalculate product ratings
    const product = await Product.findById(id)
    if (product) {
      const allReviews = await Review.find({
        targetType: "product",
        targetId: id,
        status: "published",
      }).select("rating")

      if (allReviews.length > 0) {
        const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0)
        const avgRating = totalRating / allReviews.length
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        allReviews.forEach((r) => {
          distribution[r.rating]++
        })

        await Product.findByIdAndUpdate(id, {
          "ratings.average": Math.round(avgRating * 10) / 10,
          "ratings.count": allReviews.length,
          "ratings.distribution": distribution,
        })
      } else {
        await Product.findByIdAndUpdate(id, {
          "ratings.average": 0,
          "ratings.count": 0,
          "ratings.distribution": { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        })
      }

      await updateSellerRatings(product.seller)
    }

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    })
  }),
)

/**
 * @route   POST /api/products/:id/reviews/:reviewId/helpful
 * @desc    Mark a review as helpful
 * @access  Private
 */
router.post(
  "/:id/reviews/:reviewId/helpful",
  apiLimiter,
  authenticate,
  asyncHandler(async (req, res) => {
    const { reviewId } = req.params

    const review = await Review.findById(reviewId)
    if (!review) {
      throw new AppError("Review not found", 404)
    }

    // Check if user already marked as helpful
    const alreadyMarked = review.helpfulBy?.includes(req.user._id)

    if (alreadyMarked) {
      // Remove helpful vote
      await Review.findByIdAndUpdate(reviewId, {
        $pull: { helpfulBy: req.user._id },
        $inc: { helpfulCount: -1 },
      })

      res.status(200).json({
        success: true,
        message: "Removed helpful vote",
        data: { isHelpful: false },
      })
    } else {
      // Add helpful vote
      await Review.findByIdAndUpdate(reviewId, {
        $addToSet: { helpfulBy: req.user._id },
        $inc: { helpfulCount: 1 },
      })

      res.status(200).json({
        success: true,
        message: "Marked as helpful",
        data: { isHelpful: true },
      })
    }
  }),
)

module.exports = router
