/**
 * Order Model
 * Manages purchase transactions, order lifecycle, payments, and delivery tracking
 *
 * @module models/Order
 * @requires mongoose
 */

const mongoose = require("mongoose")
const crypto = require("crypto")

// Sub-schema for order items
const OrderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productSnapshot: {
      name: String,
      slug: String,
      image: String,
      category: String,
      seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      sellerName: String,
      farmName: String,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    unit: {
      type: String,
      required: true,
    },
    pricePerUnit: {
      type: Number,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"],
      default: "pending",
    },
    statusHistory: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        note: String,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
  },
  { _id: true }
)

// Sub-schema for shipping address
const ShippingAddressSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
    },
    alternatePhone: String,
    email: String,
    street: String,
    landmark: String,
    village: String,
    city: String,
    district: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    pincode: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      default: "India",
    },
    coordinates: {
      type: [Number],
    },
    addressType: {
      type: String,
      enum: ["home", "office", "farm", "warehouse", "other"],
      default: "home",
    },
  },
  { _id: false }
)

// Sub-schema for payment
const PaymentSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      required: true,
      enum: ["cod", "upi", "card", "netbanking", "wallet", "bank_transfer", "razorpay"],
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "refunded", "partially_refunded"],
      default: "pending",
    },
    transactionId: String,
    gatewayOrderId: String,
    gatewayPaymentId: String,
    gatewaySignature: String,
    paidAmount: {
      type: Number,
      default: 0,
    },
    paidAt: Date,
    refundedAmount: {
      type: Number,
      default: 0,
    },
    refundedAt: Date,
    refundReason: String,
    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
      select: false,
    },
  },
  { _id: false }
)

// Sub-schema for shipping/delivery
const DeliverySchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: ["standard", "express", "pickup", "self_delivery"],
      default: "standard",
    },
    partner: {
      name: String,
      trackingId: String,
      trackingUrl: String,
      awbNumber: String,
    },
    cost: {
      type: Number,
      default: 0,
    },
    estimatedDelivery: {
      from: Date,
      to: Date,
    },
    actualDelivery: Date,
    pickupScheduled: Date,
    pickedUpAt: Date,
    dispatchedAt: Date,
    outForDeliveryAt: Date,
    deliveredAt: Date,
    deliveryProof: {
      type: String, // Image URL
    },
    deliveryOtp: {
      code: { type: String, select: false },
      expiresAt: Date,
      verified: { type: Boolean, default: false },
    },
    instructions: String,
    trackingHistory: [
      {
        status: String,
        location: String,
        timestamp: { type: Date, default: Date.now },
        description: String,
      },
    ],
  },
  { _id: false }
)

// Main Order Schema
const OrderSchema = new mongoose.Schema(
  {
    // Order Identification
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Parties
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Buyer is required"],
      index: true,
    },
    sellers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Order Items
    items: {
      type: [OrderItemSchema],
      validate: [
        {
          validator: function (items) {
            return items.length > 0
          },
          message: "Order must have at least one item",
        },
      ],
    },

    // Pricing Summary
    pricing: {
      subtotal: {
        type: Number,
        required: true,
        min: 0,
      },
      discount: {
        amount: { type: Number, default: 0 },
        code: String,
        type: { type: String, enum: ["percentage", "fixed"] },
        percentage: Number,
      },
      tax: {
        amount: { type: Number, default: 0 },
        rate: { type: Number, default: 5 }, // 5% default tax
        breakdown: [
          {
            type: { type: String }, // GST, CGST, SGST, etc.
            rate: Number,
            amount: Number,
          },
        ],
      },
      shipping: {
        type: Number,
        default: 0,
      },
      handlingFee: {
        type: Number,
        default: 0,
      },
      total: {
        type: Number,
        required: true,
        min: 0,
      },
      currency: {
        type: String,
        default: "INR",
      },
    },

    // Addresses
    shippingAddress: {
      type: ShippingAddressSchema,
      required: true,
    },
    billingAddress: ShippingAddressSchema,
    billingAddressSameAsShipping: {
      type: Boolean,
      default: true,
    },

    // Payment
    payment: PaymentSchema,

    // Delivery
    delivery: DeliverySchema,

    // Order Status
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "partially_shipped",
        "shipped",
        "out_for_delivery",
        "delivered",
        "completed",
        "cancelled",
        "returned",
        "refunded",
      ],
      default: "pending",
      index: true,
    },
    statusHistory: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        note: String,
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],

    // Order Type
    orderType: {
      type: String,
      enum: ["instant", "bulk", "contract", "auction"],
      default: "instant",
    },

    // Source
    source: {
      type: String,
      enum: ["web", "mobile_app", "api", "phone"],
      default: "web",
    },

    // Notes
    buyerNote: {
      type: String,
      maxlength: 500,
    },
    sellerNote: {
      type: String,
      maxlength: 500,
    },
    internalNote: {
      type: String,
      maxlength: 1000,
      select: false,
    },

    // Cancellation
    cancellation: {
      requestedAt: Date,
      requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      reason: {
        type: String,
        enum: [
          "changed_mind",
          "found_better_price",
          "wrong_product",
          "delivery_delay",
          "seller_cancelled",
          "out_of_stock",
          "payment_failed",
          "other",
        ],
      },
      reasonDetail: String,
      approvedAt: Date,
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },

    // Return/Refund
    returnRequest: {
      requestedAt: Date,
      reason: {
        type: String,
        enum: ["damaged", "wrong_product", "quality_issue", "not_as_described", "missing_items", "other"],
      },
      reasonDetail: String,
      images: [String],
      status: {
        type: String,
        enum: ["pending", "approved", "rejected", "pickup_scheduled", "picked_up", "refund_processed"],
      },
      processedAt: Date,
      processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },

    // Invoice
    invoice: {
      number: String,
      generatedAt: Date,
      url: String,
    },

    // Timestamps for key events
    confirmedAt: Date,
    processedAt: Date,
    shippedAt: Date,
    deliveredAt: Date,
    completedAt: Date,
    cancelledAt: Date,

    // Soft Delete
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: Date,
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// ============ INDEXES ============

OrderSchema.index({ buyer: 1, status: 1, createdAt: -1 })
OrderSchema.index({ "sellers": 1, status: 1, createdAt: -1 })
OrderSchema.index({ status: 1, createdAt: -1 })
OrderSchema.index({ "payment.status": 1 })
OrderSchema.index({ createdAt: -1 })
OrderSchema.index({ orderNumber: 1 })

// ============ VIRTUALS ============

OrderSchema.virtual("itemCount").get(function () {
  return this.items.reduce((total, item) => total + item.quantity, 0)
})

OrderSchema.virtual("canCancel").get(function () {
  const cancellableStatuses = ["pending", "confirmed", "processing"]
  return cancellableStatuses.includes(this.status)
})

OrderSchema.virtual("canReturn").get(function () {
  if (this.status !== "delivered") return false
  if (!this.deliveredAt) return false

  // Allow returns within 7 days of delivery
  const returnWindow = 7 * 24 * 60 * 60 * 1000 // 7 days in ms
  return Date.now() - this.deliveredAt.getTime() <= returnWindow
})

// ============ PRE-SAVE MIDDLEWARE ============

// Generate order number before saving
OrderSchema.pre("save", async function (next) {
  if (!this.orderNumber) {
    this.orderNumber = await generateOrderNumber()
  }

  // Initialize status history if new
  if (this.isNew) {
    this.statusHistory = [
      {
        status: this.status,
        timestamp: new Date(),
        note: "Order created",
      },
    ]
  }

  next()
})

// Filter out deleted orders
OrderSchema.pre(/^find/, function (next) {
  this.find({ isDeleted: { $ne: true } })
  next()
})

// ============ METHODS ============

// Update order status with history tracking
OrderSchema.methods.updateStatus = async function (newStatus, note = "", updatedBy = null) {
  const validTransitions = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["processing", "cancelled"],
    processing: ["partially_shipped", "shipped", "cancelled"],
    partially_shipped: ["shipped", "cancelled"],
    shipped: ["out_for_delivery", "delivered", "returned"],
    out_for_delivery: ["delivered", "returned"],
    delivered: ["completed", "returned"],
    completed: ["returned"],
    returned: ["refunded"],
    cancelled: [],
    refunded: [],
  }

  if (!validTransitions[this.status]?.includes(newStatus)) {
    throw new Error(`Invalid status transition from ${this.status} to ${newStatus}`)
  }

  this.status = newStatus
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    note,
    updatedBy,
  })

  // Update timestamp fields
  const timestampFields = {
    confirmed: "confirmedAt",
    processing: "processedAt",
    shipped: "shippedAt",
    delivered: "deliveredAt",
    completed: "completedAt",
    cancelled: "cancelledAt",
  }

  if (timestampFields[newStatus]) {
    this[timestampFields[newStatus]] = new Date()
  }

  return this.save()
}

// Cancel order
OrderSchema.methods.cancelOrder = async function (reason, reasonDetail = "", requestedBy = null) {
  if (!this.canCancel) {
    throw new Error("Order cannot be cancelled at this stage")
  }

  this.cancellation = {
    requestedAt: new Date(),
    requestedBy,
    reason,
    reasonDetail,
    approvedAt: new Date(),
    approvedBy: requestedBy,
  }

  return this.updateStatus("cancelled", `Cancelled: ${reason}`, requestedBy)
}

// Request return
OrderSchema.methods.requestReturn = async function (reason, reasonDetail = "", images = []) {
  if (!this.canReturn) {
    throw new Error("Return window has expired or order is not eligible for return")
  }

  this.returnRequest = {
    requestedAt: new Date(),
    reason,
    reasonDetail,
    images,
    status: "pending",
  }

  return this.save()
}

// Mark payment as completed
OrderSchema.methods.markPaymentComplete = async function (paymentDetails) {
  this.payment.status = "completed"
  this.payment.paidAmount = paymentDetails.amount || this.pricing.total
  this.payment.paidAt = new Date()
  this.payment.transactionId = paymentDetails.transactionId
  this.payment.gatewayPaymentId = paymentDetails.gatewayPaymentId
  this.payment.gatewaySignature = paymentDetails.gatewaySignature

  // If payment is complete and status is pending, move to confirmed
  if (this.status === "pending") {
    return this.updateStatus("confirmed", "Payment received")
  }

  return this.save()
}

// ============ STATICS ============

// Generate unique order number
async function generateOrderNumber() {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")
  const random = crypto.randomBytes(3).toString("hex").toUpperCase()

  return `GT${year}${month}${day}${random}`
}

OrderSchema.statics.generateOrderNumber = generateOrderNumber

// Find orders by buyer
OrderSchema.statics.findByBuyer = function (buyerId, options = {}) {
  const query = this.find({ buyer: buyerId })

  if (options.status) {
    query.where("status", options.status)
  }

  if (options.limit) {
    query.limit(options.limit)
  }

  return query.sort({ createdAt: -1 }).populate("items.product", "name slug images")
}

// Find orders by seller
OrderSchema.statics.findBySeller = function (sellerId, options = {}) {
  const query = this.find({ sellers: sellerId })

  if (options.status) {
    query.where("status", options.status)
  }

  if (options.limit) {
    query.limit(options.limit)
  }

  return query.sort({ createdAt: -1 }).populate("buyer", "profile.firstName profile.lastName profile.avatar")
}

// Get order statistics
OrderSchema.statics.getStats = async function (userId, role = "buyer") {
  const matchField = role === "buyer" ? "buyer" : "sellers"
  const match = { [matchField]: new mongoose.Types.ObjectId(userId) }

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalAmount: { $sum: "$pricing.total" },
      },
    },
  ])

  return stats.reduce(
    (acc, stat) => {
      acc.byStatus[stat._id] = { count: stat.count, amount: stat.totalAmount }
      acc.totalOrders += stat.count
      acc.totalAmount += stat.totalAmount
      return acc
    },
    { byStatus: {}, totalOrders: 0, totalAmount: 0 }
  )
}

const Order = mongoose.model("Order", OrderSchema)

module.exports = Order
