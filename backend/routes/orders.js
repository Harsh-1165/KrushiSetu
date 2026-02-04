/**
 * Order API Routes
 * Complete CRUD operations for orders in GreenTrace
 *
 * @module routes/orders
 * @requires express
 * @requires mongoose
 */

const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")

const Order = require("../models/Order")
const Product = require("../models/Product")
const User = require("../models/User")
const { asyncHandler } = require("../utils/asyncHandler")
const AppError = require("../utils/AppError")
const { authenticate, authorize, optionalAuth } = require("../middleware/auth")
const { apiLimiter } = require("../middleware/rateLimiter")

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate cart items and calculate totals
 */
const validateAndCalculateOrder = async (items, coupon = null) => {
  const validatedItems = []
  let subtotal = 0
  const sellers = new Set()

  for (const item of items) {
    const product = await Product.findById(item.productId)
      .populate("seller", "profile.firstName profile.lastName farmerProfile.farmName")

    if (!product) {
      throw new AppError(`Product not found: ${item.productId}`, 404)
    }

    if (product.status !== "active" && product.status !== "available") {
      throw new AppError(`Product is not available: ${product.name}`, 400)
    }

    // Check inventory
    const available = product.inventory?.available || 0
    if (item.quantity > available) {
      throw new AppError(`Only ${available} units of ${product.name} available`, 400)
    }

    // Check min/max order quantities
    const minOrder = product.inventory?.minOrder || 1
    const maxOrder = product.inventory?.maxOrder || available

    if (item.quantity < minOrder) {
      throw new AppError(`Minimum order quantity for ${product.name} is ${minOrder}`, 400)
    }

    if (item.quantity > maxOrder) {
      throw new AppError(`Maximum order quantity for ${product.name} is ${maxOrder}`, 400)
    }

    const pricePerUnit = product.price?.current || 0
    const itemTotal = pricePerUnit * item.quantity

    sellers.add(product.seller._id.toString())

    validatedItems.push({
      product: product._id,
      productSnapshot: {
        name: product.name,
        slug: product.slug,
        image: product.images?.[0]?.url || null,
        category: product.category,
        seller: product.seller._id,
        sellerName: `${product.seller.profile?.firstName || ""} ${product.seller.profile?.lastName || ""}`.trim(),
        farmName: product.seller.farmerProfile?.farmName || "Unknown Farm",
      },
      quantity: item.quantity,
      unit: product.price?.unit || "kg",
      pricePerUnit,
      totalPrice: itemTotal,
      discount: 0,
      tax: 0,
      status: "pending",
      statusHistory: [
        {
          status: "pending",
          timestamp: new Date(),
          note: "Item added to order",
        },
      ],
    })

    subtotal += itemTotal
  }

  // Calculate discount
  let discountAmount = 0
  let discountInfo = null

  if (coupon) {
    const validCoupons = {
      FRESH10: { type: "percentage", value: 10 },
      ORGANIC20: { type: "percentage", value: 20 },
      WELCOME15: { type: "percentage", value: 15 },
      FARM25: { type: "percentage", value: 25 },
    }

    const couponData = validCoupons[coupon.toUpperCase()]
    if (couponData) {
      if (couponData.type === "percentage") {
        discountAmount = Math.round((subtotal * couponData.value) / 100)
        discountInfo = {
          amount: discountAmount,
          code: coupon.toUpperCase(),
          type: "percentage",
          percentage: couponData.value,
        }
      } else {
        discountAmount = couponData.value
        discountInfo = {
          amount: discountAmount,
          code: coupon.toUpperCase(),
          type: "fixed",
        }
      }
    }
  }

  // Calculate tax (5%)
  const taxRate = 5
  const taxAmount = Math.round(((subtotal - discountAmount) * taxRate) / 100)

  // Calculate shipping
  const freeShippingThreshold = 500
  const shippingCost = subtotal >= freeShippingThreshold ? 0 : 50

  const total = subtotal - discountAmount + taxAmount + shippingCost

  return {
    items: validatedItems,
    sellers: Array.from(sellers).map((id) => new mongoose.Types.ObjectId(id)),
    pricing: {
      subtotal,
      discount: discountInfo || { amount: 0 },
      tax: {
        amount: taxAmount,
        rate: taxRate,
        breakdown: [{ type: "GST", rate: taxRate, amount: taxAmount }],
      },
      shipping: shippingCost,
      handlingFee: 0,
      total,
      currency: "INR",
    },
  }
}

// ============================================================================
// ORDER ROUTES
// ============================================================================

/**
 * @route   POST /api/v1/orders
 * @desc    Create a new order
 * @access  Private
 */
router.post(
  "/",
  apiLimiter,
  authenticate,
  asyncHandler(async (req, res) => {
    const { items, shippingAddress, billingAddress, paymentMethod, couponCode, buyerNote, deliveryMethod } = req.body

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new AppError("Order must have at least one item", 400)
    }

    if (!shippingAddress) {
      throw new AppError("Shipping address is required", 400)
    }

    if (!paymentMethod) {
      throw new AppError("Payment method is required", 400)
    }

    // Validate shipping address fields
    const requiredAddressFields = ["fullName", "phone", "district", "state", "pincode"]
    for (const field of requiredAddressFields) {
      if (!shippingAddress[field]) {
        throw new AppError(`Shipping address ${field} is required`, 400)
      }
    }

    // Validate and calculate order totals
    const orderData = await validateAndCalculateOrder(items, couponCode)

    // Generate order number
    const orderNumber = await Order.generateOrderNumber()

    // Create order
    const order = new Order({
      orderNumber,
      buyer: req.user._id,
      sellers: orderData.sellers,
      items: orderData.items,
      pricing: orderData.pricing,
      shippingAddress: {
        fullName: shippingAddress.fullName,
        phone: shippingAddress.phone,
        alternatePhone: shippingAddress.alternatePhone,
        email: shippingAddress.email || req.user.email,
        street: shippingAddress.street,
        landmark: shippingAddress.landmark,
        village: shippingAddress.village,
        city: shippingAddress.city,
        district: shippingAddress.district,
        state: shippingAddress.state,
        pincode: shippingAddress.pincode,
        country: shippingAddress.country || "India",
        addressType: shippingAddress.addressType || "home",
      },
      billingAddress: billingAddress || shippingAddress,
      billingAddressSameAsShipping: !billingAddress,
      payment: {
        method: paymentMethod,
        status: paymentMethod === "cod" ? "pending" : "pending",
      },
      delivery: {
        method: deliveryMethod || "standard",
        cost: orderData.pricing.shipping,
        estimatedDelivery: {
          from: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
          to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        },
      },
      buyerNote,
      status: "pending",
      source: "web",
    })

    await order.save()

    // Update product inventory (reserve)
    for (const item of orderData.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: {
          "inventory.available": -item.quantity,
          "inventory.reserved": item.quantity,
        },
      })
    }

    // Update buyer's order count
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { "stats.totalOrders": 1 },
    })

    // If COD, automatically confirm order
    if (paymentMethod === "cod") {
      order.status = "confirmed"
      order.confirmedAt = new Date()
      order.statusHistory.push({
        status: "confirmed",
        timestamp: new Date(),
        note: "COD order confirmed automatically",
      })
      await order.save()
    }

    // Populate for response
    await order.populate([
      { path: "buyer", select: "profile.firstName profile.lastName email" },
      { path: "items.product", select: "name slug images price" },
    ])

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: { order },
    })
  })
)

/**
 * @route   GET /api/v1/orders
 * @desc    Get orders for the authenticated user
 * @access  Private
 */
router.get(
  "/",
  apiLimiter,
  authenticate,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status, sortBy = "createdAt", sortOrder = "desc" } = req.query

    const pageNum = Math.max(1, parseInt(page))
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)))
    const skip = (pageNum - 1) * limitNum

    // Build query based on user role
    const query = {}

    if (req.user.role === "farmer") {
      query.sellers = req.user._id
    } else {
      query.buyer = req.user._id
    }

    if (status) {
      query.status = status
    }

    const sort = {}
    sort[sortBy] = sortOrder === "asc" ? 1 : -1

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate("buyer", "profile.firstName profile.lastName email phone")
        .populate("items.product", "name slug images") // Only populate minimal fields for display
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(query),
    ])

    // If user is a farmer, filter items to only show their products
    if (req.user.role === "farmer") {
      orders.forEach(order => {
        // 1. Filter items belonging to this farmer
        const farmerItems = order.items.filter(item =>
          item.productSnapshot &&
          item.productSnapshot.seller &&
          item.productSnapshot.seller.toString() === req.user._id.toString()
        )

        // 2. Overwrite items with filtered list
        order.items = farmerItems

        // 3. Recalculate total for this farmer (Sum of item.totalPrice)
        // Note: item.totalPrice is calculated as pricePerUnit * quantity during order creation
        const farmerTotal = farmerItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0)

        // 4. Update pricing object for display
        // We override the total so the dashboard card shows the correct amount for this farmer
        order.pricing = {
          ...order.pricing,
          subtotal: farmerTotal,
          total: farmerTotal,
          // Clear tax/shipping broken down if strictly needed, but total is key
        }
      })
    }

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
          hasNext: pageNum < Math.ceil(total / limitNum),
          hasPrev: pageNum > 1,
        },
      },
    })
  })
)

/**
 * @route   GET /api/v1/orders/stats
 * @desc    Get order statistics for the authenticated user
 * @access  Private
 */
router.get(
  "/stats",
  apiLimiter,
  authenticate,
  asyncHandler(async (req, res) => {
    const role = req.user.role === "farmer" ? "seller" : "buyer"
    console.log(`[DEBUG] Getting stats for user: ${req.user._id} (${req.user.role} -> ${role})`)

    const stats = await Order.getStats(req.user._id, role)
    console.log(`[DEBUG] Stats result:`, JSON.stringify(stats, null, 2))

    res.status(200).json({
      success: true,
      data: { stats },
    })
  })
)

/**
 * @route   GET /api/v1/orders/:id
 * @desc    Get a single order by ID
 * @access  Private
 */
router.get(
  "/:id",
  apiLimiter,
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params

    let order

    // Check if id is order number or ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id)
    } else {
      order = await Order.findOne({ orderNumber: id })
    }

    if (!order) {
      throw new AppError("Order not found", 404)
    }

    // Check authorization
    const isOwner = order.buyer.toString() === req.user._id.toString()
    const isSeller = order.sellers.some((s) => s.toString() === req.user._id.toString())
    const isAdmin = req.user.role === "admin"

    if (!isOwner && !isSeller && !isAdmin) {
      throw new AppError("Not authorized to view this order", 403)
    }

    await order.populate([
      { path: "buyer", select: "profile.firstName profile.lastName email phone" },
      { path: "items.product", select: "name slug images price category" },
      { path: "sellers", select: "profile.firstName profile.lastName farmerProfile.farmName" },
    ])

    res.status(200).json({
      success: true,
      data: { order },
    })
  })
)

/**
 * @route   PUT /api/v1/orders/:id/status
 * @desc    Update order status
 * @access  Private (Seller or Admin)
 */
router.put(
  "/:id/status",
  apiLimiter,
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const { status, note } = req.body

    const order = await Order.findById(id)

    if (!order) {
      throw new AppError("Order not found", 404)
    }

    // Check authorization
    const isSeller = order.sellers.some((s) => s.toString() === req.user._id.toString())
    const isAdmin = req.user.role === "admin"

    if (!isSeller && !isAdmin) {
      throw new AppError("Not authorized to update this order", 403)
    }

    // Update order status
    await order.updateStatus(status, note, req.user._id)

    // If order is delivered, update product sold count
    if (status === "delivered") {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: {
            "inventory.reserved": -item.quantity,
            "inventory.sold": item.quantity,
            "stats.orders": 1,
            "stats.sold": item.quantity,
          },
        })
      }

      // Update buyer's purchase stats
      await User.findByIdAndUpdate(order.buyer, {
        $inc: { "stats.totalPurchases": order.pricing.total },
      })
    }

    await order.populate([
      { path: "buyer", select: "profile.firstName profile.lastName email" },
      { path: "items.product", select: "name slug images" },
    ])

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      data: { order },
    })
  })
)

/**
 * @route   PUT /api/v1/orders/:id/cancel
 * @desc    Cancel an order
 * @access  Private
 */
router.put(
  "/:id/cancel",
  apiLimiter,
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const { reason, reasonDetail } = req.body

    const order = await Order.findById(id)

    if (!order) {
      throw new AppError("Order not found", 404)
    }

    // Check authorization
    const isOwner = order.buyer.toString() === req.user._id.toString()
    const isSeller = order.sellers.some((s) => s.toString() === req.user._id.toString())
    const isAdmin = req.user.role === "admin"

    if (!isOwner && !isSeller && !isAdmin) {
      throw new AppError("Not authorized to cancel this order", 403)
    }

    if (!reason) {
      throw new AppError("Cancellation reason is required", 400)
    }

    // Cancel order
    await order.cancelOrder(reason, reasonDetail, req.user._id)

    // Restore inventory
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: {
          "inventory.available": item.quantity,
          "inventory.reserved": -item.quantity,
        },
      })
    }

    await order.populate([
      { path: "buyer", select: "profile.firstName profile.lastName email" },
      { path: "items.product", select: "name slug images" },
    ])

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: { order },
    })
  })
)

/**
 * @route   PUT /api/v1/orders/:id/payment
 * @desc    Update payment status (for webhook or manual update)
 * @access  Private
 */
router.put(
  "/:id/payment",
  apiLimiter,
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const { transactionId, gatewayPaymentId, gatewaySignature, amount, status } = req.body

    const order = await Order.findById(id)

    if (!order) {
      throw new AppError("Order not found", 404)
    }

    // Check authorization
    const isOwner = order.buyer.toString() === req.user._id.toString()
    const isAdmin = req.user.role === "admin"

    if (!isOwner && !isAdmin) {
      throw new AppError("Not authorized to update payment for this order", 403)
    }

    if (status === "completed") {
      await order.markPaymentComplete({
        amount: amount || order.pricing.total,
        transactionId,
        gatewayPaymentId,
        gatewaySignature,
      })
    } else {
      order.payment.status = status
      if (transactionId) order.payment.transactionId = transactionId
      if (gatewayPaymentId) order.payment.gatewayPaymentId = gatewayPaymentId
      await order.save()
    }

    res.status(200).json({
      success: true,
      message: "Payment updated successfully",
      data: { order },
    })
  })
)

/**
 * @route   POST /api/v1/orders/:id/return
 * @desc    Request a return for an order
 * @access  Private (Buyer only)
 */
router.post(
  "/:id/return",
  apiLimiter,
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const { reason, reasonDetail, images } = req.body

    const order = await Order.findById(id)

    if (!order) {
      throw new AppError("Order not found", 404)
    }

    // Check authorization
    const isOwner = order.buyer.toString() === req.user._id.toString()

    if (!isOwner) {
      throw new AppError("Not authorized to request return for this order", 403)
    }

    if (!reason) {
      throw new AppError("Return reason is required", 400)
    }

    await order.requestReturn(reason, reasonDetail, images || [])

    res.status(200).json({
      success: true,
      message: "Return request submitted successfully",
      data: { order },
    })
  })
)

/**
 * @route   GET /api/v1/orders/validate-coupon
 * @desc    Validate a coupon code
 * @access  Public
 */
router.post(
  "/validate-coupon",
  apiLimiter,
  asyncHandler(async (req, res) => {
    const { code, subtotal } = req.body

    if (!code) {
      throw new AppError("Coupon code is required", 400)
    }

    const validCoupons = {
      FRESH10: { type: "percentage", value: 10, minOrder: 100 },
      ORGANIC20: { type: "percentage", value: 20, minOrder: 300 },
      WELCOME15: { type: "percentage", value: 15, minOrder: 0 },
      FARM25: { type: "percentage", value: 25, minOrder: 500 },
    }

    const coupon = validCoupons[code.toUpperCase()]

    if (!coupon) {
      throw new AppError("Invalid coupon code", 400)
    }

    if (subtotal && subtotal < coupon.minOrder) {
      throw new AppError(`Minimum order amount for this coupon is Rs. ${coupon.minOrder}`, 400)
    }

    let discount = 0
    if (subtotal) {
      if (coupon.type === "percentage") {
        discount = Math.round((subtotal * coupon.value) / 100)
      } else {
        discount = coupon.value
      }
    }

    res.status(200).json({
      success: true,
      data: {
        valid: true,
        code: code.toUpperCase(),
        type: coupon.type,
        value: coupon.value,
        minOrder: coupon.minOrder,
        discount,
      },
    })
  })
)

module.exports = router
