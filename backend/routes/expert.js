/**
 * Expert routes - product review flow
 * GET /expert/products/pending - products with needsExpertReview=true, approved=false
 * PATCH /expert/products/:id/approve - set approved: true
 * PATCH /expert/products/:id/reject - set approved: false (or reject reason)
 */

const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")
const Product = require("../models/Product")
const { asyncHandler } = require("../utils/asyncHandler")
const AppError = require("../utils/AppError")
const { authenticate, authorize } = require("../middleware/auth")
const { apiLimiter } = require("../middleware/rateLimiter")

/**
 * @route   GET /api/v1/expert/products/pending
 * @desc    List products pending expert review (needsExpertReview=true, approved=false)
 * @access  Private (Expert or Admin)
 */
router.get(
  "/products/pending",
  apiLimiter,
  authenticate,
  authorize("expert", "admin"),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query
    const pageNum = Math.max(1, Number.parseInt(page))
    const limitNum = Math.min(50, Math.max(1, Number.parseInt(limit)))
    const skip = (pageNum - 1) * limitNum

    const filter = {
      needsExpertReview: true,
      approved: false,
    }
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("seller", "name email profile farmerProfile")
        .populate("farmer", "name email profile farmerProfile")
        .sort({ createdAt: -1 })
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
 * @route   PATCH /api/v1/expert/products/:id/approve
 * @desc    Approve product - set approved: true (visible to consumers)
 * @access  Private (Expert or Admin)
 */
router.patch(
  "/products/:id/approve",
  apiLimiter,
  authenticate,
  authorize("expert", "admin"),
  asyncHandler(async (req, res) => {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid product ID", 400)
    }
    const product = await Product.findOneAndUpdate(
      {
        _id: id,
        needsExpertReview: true,
        approved: false,
      },
      { $set: { approved: true } },
      { new: true },
    )
      .populate("seller", "name profile farmerProfile")
      .populate("farmer", "name profile farmerProfile")

    if (!product) {
      throw new AppError("Product not found or already approved/rejected", 404)
    }

    res.status(200).json({
      success: true,
      message: "Product approved. It is now visible to consumers.",
      data: { product },
    })
  }),
)

/**
 * @route   PATCH /api/v1/expert/products/:id/reject
 * @desc    Reject product - keep approved: false (not visible to consumers)
 * @access  Private (Expert or Admin)
 */
router.patch(
  "/products/:id/reject",
  apiLimiter,
  authenticate,
  authorize("expert", "admin"),
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const { reason } = req.body || {}
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid product ID", 400)
    }
    const product = await Product.findOne({
      _id: id,
      needsExpertReview: true,
    })

    if (!product) {
      throw new AppError("Product not found", 404)
    }

    product.approved = false
    if (reason) {
      product.rejectReason = reason
    }
    await product.save()
    await product.populate("seller", "name profile farmerProfile")
    await product.populate("farmer", "name profile farmerProfile")

    res.status(200).json({
      success: true,
      message: "Product rejected. It will not be shown to consumers.",
      data: { product },
    })
  }),
)

module.exports = router
