/**
 * Mandi (Agricultural Market) Model
 */

const mongoose = require("mongoose")

const mandiSchema = new mongoose.Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: [true, "Mandi name is required"],
      trim: true,
      index: true,
    },
    code: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["APMC", "Private", "Cooperative", "Farmers Market", "Wholesale"],
      default: "APMC",
    },

    // Location
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
      index: true,
    },
    district: {
      type: String,
      required: [true, "District is required"],
      trim: true,
      index: true,
    },
    taluka: {
      type: String,
      trim: true,
    },
    address: {
      street: String,
      city: String,
      pincode: {
        type: String,
        match: [/^[0-9]{6}$/, "Invalid pincode"],
      },
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },

    // Contact Information
    contactInfo: {
      phone: [String],
      email: String,
      website: String,
      secretary: {
        name: String,
        phone: String,
        email: String,
      },
    },

    // Operating Details
    operatingDays: {
      type: [String],
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    },
    operatingHours: {
      open: {
        type: String,
        default: "06:00",
      },
      close: {
        type: String,
        default: "18:00",
      },
    },
    auctionTimings: [
      {
        commodity: String,
        startTime: String,
        endTime: String,
      },
    ],

    // Commodities Traded
    commodities: [
      {
        name: String,
        varieties: [String],
        isMain: { type: Boolean, default: false },
      },
    ],
    mainCommodities: [String],

    // Facilities
    facilities: {
      coldStorage: { type: Boolean, default: false },
      warehouse: { type: Boolean, default: false },
      parking: { type: Boolean, default: false },
      weighbridge: { type: Boolean, default: false },
      restrooms: { type: Boolean, default: false },
      bankingFacility: { type: Boolean, default: false },
      eNAMEnabled: { type: Boolean, default: false },
      grading: { type: Boolean, default: false },
      assaying: { type: Boolean, default: false },
    },

    // Capacity & Statistics
    capacity: {
      dailyArrival: Number, // in quintals
      storageCapacity: Number, // in quintals
      shopCount: Number,
      traderCount: Number,
    },

    // Fees & Charges
    fees: {
      marketFee: { type: Number, default: 0 }, // Percentage
      commissionRate: { type: Number, default: 0 }, // Percentage
      weighingCharges: { type: Number, default: 0 }, // Per quintal
      loadingCharges: { type: Number, default: 0 }, // Per quintal
    },

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

    // Images
    images: [
      {
        url: String,
        caption: String,
        isPrimary: { type: Boolean, default: false },
      },
    ],

    // Ratings
    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
      distribution: {
        1: { type: Number, default: 0 },
        2: { type: Number, default: 0 },
        3: { type: Number, default: 0 },
        4: { type: Number, default: 0 },
        5: { type: Number, default: 0 },
      },
    },

    // Metadata
    establishedYear: Number,
    licenseNumber: String,
    lastPriceUpdate: Date,
    dataSource: {
      type: String,
      enum: ["agmarknet", "enam", "manual", "api"],
      default: "manual",
    },
  },
  {
    timestamps: true,
  },
)

// Geospatial index for location-based queries
mandiSchema.index({ location: "2dsphere" })

// Compound indexes
mandiSchema.index({ state: 1, district: 1, isActive: 1 })
mandiSchema.index({ mainCommodities: 1, state: 1 })

// Text index for search
mandiSchema.index({
  name: "text",
  state: "text",
  district: "text",
  mainCommodities: "text",
})

// Virtual for full address
mandiSchema.virtual("fullAddress").get(function () {
  const parts = []
  if (this.address?.street) parts.push(this.address.street)
  if (this.taluka) parts.push(this.taluka)
  if (this.district) parts.push(this.district)
  if (this.state) parts.push(this.state)
  if (this.address?.pincode) parts.push(this.address.pincode)
  return parts.join(", ")
})

// Virtual for open status
mandiSchema.virtual("isOpen").get(function () {
  const now = new Date()
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const today = dayNames[now.getDay()]

  if (!this.operatingDays.includes(today)) return false

  const currentTime = now.getHours() * 100 + now.getMinutes()
  const openTime = Number.parseInt(this.operatingHours.open.replace(":", ""))
  const closeTime = Number.parseInt(this.operatingHours.close.replace(":", ""))

  return currentTime >= openTime && currentTime <= closeTime
})

// Static method to find nearby mandis
mandiSchema.statics.findNearby = async function (lat, lng, maxDistance = 50000, options = {}) {
  const { limit = 20, commodities } = options

  const query = {
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [lng, lat],
        },
        $maxDistance: maxDistance, // in meters
      },
    },
    isActive: true,
  }

  if (commodities && commodities.length > 0) {
    query.mainCommodities = { $in: commodities }
  }

  return this.find(query)
    .select("name state district location mainCommodities operatingHours facilities.eNAMEnabled")
    .limit(limit)
    .lean()
}

// Static method to get mandis by state
mandiSchema.statics.getByState = async function (state) {
  return this.aggregate([
    { $match: { state: new RegExp(state, "i"), isActive: true } },
    {
      $group: {
        _id: "$district",
        mandis: {
          $push: {
            _id: "$_id",
            name: "$name",
            mainCommodities: "$mainCommodities",
            facilities: "$facilities",
          },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ])
}

module.exports = mongoose.model("Mandi", mandiSchema)
