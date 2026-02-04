/**
 * MandiPrice Model
 * Real-time market price records
 */

const mongoose = require("mongoose")

const mandiPriceSchema = new mongoose.Schema(
  {
    // Crop Information
    crop: {
      type: String,
      required: [true, "Crop name is required"],
      trim: true,
      index: true,
    },
    variety: {
      type: String,
      trim: true,
      default: "",
    },
    grade: {
      type: String,
      enum: ["A", "B", "C", "FAQ", "Premium", "Standard", ""],
      default: "",
    },

    // Market Information
    mandi: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mandi",
      required: [true, "Mandi reference is required"],
      index: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    district: {
      type: String,
      required: true,
      trim: true,
    },

    // Price Information (in INR per quintal)
    minPrice: {
      type: Number,
      required: [true, "Minimum price is required"],
      min: [0, "Price cannot be negative"],
    },
    maxPrice: {
      type: Number,
      required: [true, "Maximum price is required"],
      min: [0, "Price cannot be negative"],
    },
    modalPrice: {
      type: Number,
      required: [true, "Modal price is required"],
      min: [0, "Price cannot be negative"],
      index: true,
    },

    // MSP Comparison
    mspPrice: {
      type: Number,
      default: null,
    },
    mspComparison: {
      difference: Number,
      percentage: Number,
      status: {
        type: String,
        enum: ["above_msp", "below_msp", "at_msp", "no_msp"],
        default: "no_msp",
      },
    },

    // Arrival Information
    arrivalQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    arrivalUnit: {
      type: String,
      enum: ["quintal", "ton", "kg"],
      default: "quintal",
    },

    // Price Change Tracking
    priceChange24h: {
      type: Number,
      default: 0,
    },
    priceChange7d: {
      type: Number,
      default: 0,
    },
    priceChange30d: {
      type: Number,
      default: 0,
    },
    previousPrice: {
      type: Number,
      default: null,
    },

    // Date Information
    priceDate: {
      type: Date,
      required: [true, "Price date is required"],
      index: true,
    },

    // Data Source
    source: {
      type: String,
      enum: ["agmarknet", "manual", "api", "scraper"],
      default: "agmarknet",
    },
    sourceId: String,

    // Status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Metadata
    metadata: {
      weatherCondition: String,
      festivalSeason: Boolean,
      harvestSeason: Boolean,
      notes: String,
    },
  },
  {
    timestamps: true,
  },
)

// Compound indexes for common queries
mandiPriceSchema.index({ crop: 1, mandi: 1, priceDate: -1 })
mandiPriceSchema.index({ crop: 1, state: 1, priceDate: -1 })
mandiPriceSchema.index({ mandi: 1, priceDate: -1 })
mandiPriceSchema.index({ state: 1, district: 1, priceDate: -1 })
mandiPriceSchema.index({ priceDate: -1, isActive: 1 })

// Text index for search
mandiPriceSchema.index({ crop: "text", variety: "text", state: "text", district: "text" })

// Pre-save middleware to calculate MSP comparison
mandiPriceSchema.pre("save", async function (next) {
  if (this.mspPrice && this.modalPrice) {
    const difference = this.modalPrice - this.mspPrice
    const percentage = (difference / this.mspPrice) * 100

    this.mspComparison = {
      difference,
      percentage: Math.round(percentage * 100) / 100,
      status: difference > 0 ? "above_msp" : difference < 0 ? "below_msp" : "at_msp",
    }
  }
  next()
})

// Pre-save middleware to calculate price changes
mandiPriceSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      // Get previous day's price
      const yesterday = new Date(this.priceDate)
      yesterday.setDate(yesterday.getDate() - 1)

      const previousPrice = await this.constructor
        .findOne({
          crop: this.crop,
          variety: this.variety,
          mandi: this.mandi,
          priceDate: {
            $gte: new Date(yesterday.setHours(0, 0, 0, 0)),
            $lte: new Date(yesterday.setHours(23, 59, 59, 999)),
          },
        })
        .select("modalPrice")

      if (previousPrice) {
        this.previousPrice = previousPrice.modalPrice
        this.priceChange24h = ((this.modalPrice - previousPrice.modalPrice) / previousPrice.modalPrice) * 100
      }

      // Get 7-day ago price
      const sevenDaysAgo = new Date(this.priceDate)
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const price7d = await this.constructor
        .findOne({
          crop: this.crop,
          variety: this.variety,
          mandi: this.mandi,
          priceDate: { $lte: sevenDaysAgo },
        })
        .sort({ priceDate: -1 })
        .select("modalPrice")

      if (price7d) {
        this.priceChange7d = ((this.modalPrice - price7d.modalPrice) / price7d.modalPrice) * 100
      }

      // Get 30-day ago price
      const thirtyDaysAgo = new Date(this.priceDate)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const price30d = await this.constructor
        .findOne({
          crop: this.crop,
          variety: this.variety,
          mandi: this.mandi,
          priceDate: { $lte: thirtyDaysAgo },
        })
        .sort({ priceDate: -1 })
        .select("modalPrice")

      if (price30d) {
        this.priceChange30d = ((this.modalPrice - price30d.modalPrice) / price30d.modalPrice) * 100
      }
    } catch (error) {
      console.error("Error calculating price changes:", error)
    }
  }
  next()
})

// Static method to get latest prices for a crop
mandiPriceSchema.statics.getLatestPrices = async function (crop, options = {}) {
  const { state, limit = 10 } = options

  const query = {
    crop: new RegExp(crop, "i"),
    isActive: true,
    priceDate: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  }

  if (state) {
    query.state = new RegExp(state, "i")
  }

  return this.find(query).populate("mandi", "name state district").sort({ priceDate: -1 }).limit(limit).lean()
}

// Static method to get price statistics
mandiPriceSchema.statics.getPriceStats = async function (crop, days = 30) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  return this.aggregate([
    {
      $match: {
        crop: new RegExp(crop, "i"),
        priceDate: { $gte: startDate },
        isActive: true,
      },
    },
    {
      $group: {
        _id: null,
        avgMinPrice: { $avg: "$minPrice" },
        avgMaxPrice: { $avg: "$maxPrice" },
        avgModalPrice: { $avg: "$modalPrice" },
        minPrice: { $min: "$minPrice" },
        maxPrice: { $max: "$maxPrice" },
        totalArrival: { $sum: "$arrivalQuantity" },
        priceCount: { $sum: 1 },
        marketCount: { $addToSet: "$mandi" },
      },
    },
    {
      $project: {
        _id: 0,
        avgMinPrice: { $round: ["$avgMinPrice", 2] },
        avgMaxPrice: { $round: ["$avgMaxPrice", 2] },
        avgModalPrice: { $round: ["$avgModalPrice", 2] },
        minPrice: 1,
        maxPrice: 1,
        totalArrival: 1,
        priceCount: 1,
        marketCount: { $size: "$marketCount" },
      },
    },
  ])
}

module.exports = mongoose.model("MandiPrice", mandiPriceSchema)
