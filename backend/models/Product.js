/**
 * Product Model
 * MongoDB schema for agricultural products in GreenTrace marketplace
 */

const mongoose = require("mongoose")
const Schema = mongoose.Schema

// ============================================================================
// SUB-SCHEMAS
// ============================================================================

const BulkPricingSchema = new Schema(
  {
    minQuantity: {
      type: Number,
      required: true,
      min: 1,
    },
    maxQuantity: {
      type: Number,
      default: null,
    },
    pricePerUnit: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  { _id: false },
)

const ImageSchema = new Schema(
  {
    url: {
      type: String,
      required: true,
    },
    alt: {
      type: String,
      default: "",
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
)

const DimensionsSchema = new Schema(
  {
    length: Number,
    width: Number,
    height: Number,
    unit: {
      type: String,
      enum: ["cm", "m", "inch"],
      default: "cm",
    },
  },
  { _id: false },
)

// ============================================================================
// MAIN PRODUCT SCHEMA
// ============================================================================

const ProductSchema = new Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [200, "Product name cannot exceed 200 characters"],
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    shortDescription: {
      type: String,
      maxlength: [500, "Short description cannot exceed 500 characters"],
    },

    // Categorization
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "grains",
        "vegetables",
        "fruits",
        "pulses",
        "spices",
        "oilseeds",
        "dairy",
        "poultry",
        "livestock",
        "seeds",
        "fertilizers",
        "pesticides",
        "equipment",
        "organic",
        "processed",
        "other",
      ],
      index: true,
    },
    subcategory: {
      type: String,
      default: null,
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    // Seller / Farmer Reference
    seller: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Seller is required"],
      index: true,
    },
    farmer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    approved: {
      type: Boolean,
      default: false,
      index: true,
    },
    rejectReason: {
      type: String,
      default: null,
    },

    // Pricing
    price: {
      current: {
        type: Number,
        required: [true, "Price is required"],
        min: [0, "Price cannot be negative"],
      },
      mrp: {
        type: Number,
        default: null,
        min: 0,
      },
      unit: {
        type: String,
        required: [true, "Price unit is required"],
        enum: ["kg", "quintal", "ton", "gram", "piece", "dozen", "bundle", "liter", "ml"],
      },
      currency: {
        type: String,
        default: "INR",
        enum: ["INR", "USD"],
      },
      bulkPricing: [BulkPricingSchema],
      negotiable: {
        type: Boolean,
        default: false,
      },
    },

    // Inventory Management
    inventory: {
      available: {
        type: Number,
        required: [true, "Available quantity is required"],
        min: [0, "Available quantity cannot be negative"],
        default: 0,
      },
      reserved: {
        type: Number,
        default: 0,
        min: 0,
      },
      sold: {
        type: Number,
        default: 0,
        min: 0,
      },
      minOrder: {
        type: Number,
        default: 1,
        min: 1,
      },
      maxOrder: {
        type: Number,
        default: null,
      },
      weight: {
        type: Number,
        default: null, // in kg
      },
      dimensions: DimensionsSchema,
      sku: {
        type: String,
        sparse: true,
        index: true,
      },
    },

    // Product Attributes
    attributes: {
      variety: {
        type: String,
        default: null,
      },
      cropType: {
        type: String,
        default: null,
        trim: true,
      },
      grade: {
        type: String,
        enum: ["A", "B", "C", "premium", "standard", "economy", null],
        default: null,
      },
      isOrganic: {
        type: Boolean,
        default: false,
        index: true,
      },
      certifications: [
        {
          name: String,
          issuer: String,
          validUntil: Date,
          documentUrl: String,
        },
      ],
      harvestDate: {
        type: Date,
        default: null,
      },
      expiryDate: {
        type: Date,
        default: null,
      },
      packagingDate: {
        type: Date,
        default: null,
      },
      storageInstructions: {
        type: String,
        default: null,
      },
      nutritionalInfo: {
        type: Map,
        of: String,
        default: null,
      },
      origin: {
        type: String,
        default: null,
      },
    },

    // Media (Cloudinary URLs as strings)
    images: [{ type: String }],
    videos: [
      {
        url: String,
        thumbnail: String,
        duration: Number,
      },
    ],

    // Location (where the product is available from)
    location: {
      state: {
        type: String,
        index: true,
      },
      district: {
        type: String,
        index: true,
      },
      pincode: {
        type: String,
      },
      coordinates: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          default: null,
        },
      },
    },

    // Shipping Information
    shipping: {
      available: {
        type: Boolean,
        default: true,
      },
      freeShippingAbove: {
        type: Number,
        default: null,
      },
      estimatedDays: {
        min: { type: Number, default: 3 },
        max: { type: Number, default: 7 },
      },
      availableLocations: [
        {
          type: String,
          default: "all",
        },
      ],
      weight: Number, // Shipping weight in kg
      handlingInstructions: String,
    },

    // Ratings & Reviews
    ratings: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
        min: 0,
      },
      distribution: {
        1: { type: Number, default: 0 },
        2: { type: Number, default: 0 },
        3: { type: Number, default: 0 },
        4: { type: Number, default: 0 },
        5: { type: Number, default: 0 },
      },
    },

    // Status & Visibility
    status: {
      type: String,
      enum: ["draft", "pending", "active", "inactive", "soldout", "deleted", "available", "out-of-stock", "upcoming"],
      default: "available",
      index: true,
    },
    needsExpertReview: {
      type: Boolean,
      default: false,
      index: true,
    },
    visibility: {
      type: String,
      enum: ["public", "private", "unlisted"],
      default: "public",
    },

    // Analytics
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    wishlistCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // SEO
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
    },

    // Timestamps
    publishedAt: {
      type: Date,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// ============================================================================
// INDEXES
// ============================================================================

// Text search index
ProductSchema.index({
  name: "text",
  description: "text",
  tags: "text",
  "attributes.variety": "text",
})

// Compound indexes for common queries
ProductSchema.index({ category: 1, status: 1, "price.current": 1 })
ProductSchema.index({ seller: 1, status: 1 })
ProductSchema.index({ status: 1, "ratings.average": -1 })
ProductSchema.index({ status: 1, createdAt: -1 })
ProductSchema.index({ "location.state": 1, category: 1 })
ProductSchema.index({ "attributes.isOrganic": 1, status: 1 })

// Geospatial index
ProductSchema.index({ "location.coordinates": "2dsphere" })

// ============================================================================
// VIRTUALS
// ============================================================================

// Get primary image (first URL when images are strings)
ProductSchema.virtual("primaryImage").get(function () {
  const first = this.images?.[0]
  return typeof first === "string" ? { url: first } : first || null
})

// Calculate discount percentage
ProductSchema.virtual("discountPercentage").get(function () {
  if (this.price.mrp && this.price.mrp > this.price.current) {
    return Math.round(((this.price.mrp - this.price.current) / this.price.mrp) * 100)
  }
  return 0
})

// Check if in stock
ProductSchema.virtual("inStock").get(function () {
  return this.inventory.available > 0
})

// Get actual available quantity (excluding reserved)
ProductSchema.virtual("actualAvailable").get(function () {
  return Math.max(0, this.inventory.available - this.inventory.reserved)
})

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Pre-save middleware
ProductSchema.pre("save", function (next) {
  // Update status to out-of-stock when no inventory
  if (this.inventory.available <= 0 && (this.status === "active" || this.status === "available")) {
    this.status = "out-of-stock"
  }

  // Set published date when status changes to active or available
  if (this.isModified("status") && (this.status === "active" || this.status === "available") && !this.publishedAt) {
    this.publishedAt = new Date()
  }

  // Generate short description if not provided
  if (!this.shortDescription && this.description) {
    this.shortDescription = this.description.substring(0, 200) + (this.description.length > 200 ? "..." : "")
  }

  next()
})

// ============================================================================
// STATIC METHODS
// ============================================================================

/**
 * Find products by category with pagination
 */
ProductSchema.statics.findByCategory = async function (category, options = {}) {
  const { page = 1, limit = 20, sort = { createdAt: -1 } } = options

  return this.find({ category, status: "active" })
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("seller", "profile.firstName profile.lastName profile.avatar ratings")
    .lean()
}

/**
 * Search products with filters
 */
ProductSchema.statics.searchProducts = async function (searchTerm, filters = {}, options = {}) {
  const { page = 1, limit = 20 } = options

  const query = {
    $text: { $search: searchTerm },
    status: "active",
    ...filters,
  }

  return this.find(query, { score: { $meta: "textScore" } })
    .sort({ score: { $meta: "textScore" } })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("seller", "profile.firstName profile.lastName profile.avatar")
    .lean()
}

/**
 * Reserve inventory for an order
 */
ProductSchema.statics.reserveInventory = async function (productId, quantity) {
  const product = await this.findById(productId)

  if (!product) {
    throw new Error("Product not found")
  }

  if (product.inventory.available - product.inventory.reserved < quantity) {
    throw new Error("Insufficient inventory")
  }

  product.inventory.reserved += quantity
  await product.save()

  return product
}

/**
 * Release reserved inventory
 */
ProductSchema.statics.releaseInventory = async function (productId, quantity) {
  return this.findByIdAndUpdate(productId, { $inc: { "inventory.reserved": -quantity } }, { new: true })
}

/**
 * Complete sale (move from reserved to sold)
 */
ProductSchema.statics.completeSale = async function (productId, quantity) {
  return this.findByIdAndUpdate(
    productId,
    {
      $inc: {
        "inventory.available": -quantity,
        "inventory.reserved": -quantity,
        "inventory.sold": quantity,
      },
    },
    { new: true },
  )
}

// ============================================================================
// INSTANCE METHODS
// ============================================================================

/**
 * Check if user can purchase this product
 */
ProductSchema.methods.canPurchase = function (quantity, buyerId) {
  // Check if product is active
  if (this.status !== "active") {
    return { allowed: false, reason: "Product is not available for purchase" }
  }

  // Check if buyer is not the seller
  if (this.seller.toString() === buyerId.toString()) {
    return { allowed: false, reason: "You cannot purchase your own product" }
  }

  // Check minimum order quantity
  if (quantity < this.inventory.minOrder) {
    return { allowed: false, reason: `Minimum order quantity is ${this.inventory.minOrder}` }
  }

  // Check maximum order quantity
  if (this.inventory.maxOrder && quantity > this.inventory.maxOrder) {
    return { allowed: false, reason: `Maximum order quantity is ${this.inventory.maxOrder}` }
  }

  // Check available inventory
  const available = this.inventory.available - this.inventory.reserved
  if (quantity > available) {
    return { allowed: false, reason: `Only ${available} units available` }
  }

  return { allowed: true }
}

/**
 * Calculate price for a given quantity (considering bulk pricing)
 */
ProductSchema.methods.calculatePrice = function (quantity) {
  let pricePerUnit = this.price.current

  // Check bulk pricing tiers
  if (this.price.bulkPricing && this.price.bulkPricing.length > 0) {
    // Sort by minQuantity descending to find the best applicable tier
    const sortedTiers = [...this.price.bulkPricing].sort((a, b) => b.minQuantity - a.minQuantity)

    for (const tier of sortedTiers) {
      if (quantity >= tier.minQuantity && (!tier.maxQuantity || quantity <= tier.maxQuantity)) {
        pricePerUnit = tier.pricePerUnit
        break
      }
    }
  }

  return {
    pricePerUnit,
    subtotal: pricePerUnit * quantity,
    quantity,
    unit: this.price.unit,
    currency: this.price.currency,
  }
}

module.exports = mongoose.model("Product", ProductSchema)
