/**
 * =================================================================
 * FILE UPLOAD ROUTES
 * =================================================================
 * Dedicated routes for file management operations
 * =================================================================
 */

const express = require("express")
const router = express.Router()
const { protect, authorize } = require("../middleware/auth")
const {
  uploadAvatar,
  uploadProductImages,
  uploadDocuments,
  uploadArticleCover,
  uploadAdvisoryImage,
  deleteFile,
  config,
} = require("../middleware/fileUpload")
const { asyncHandler } = require("../utils/asyncHandler")
const AppError = require("../utils/AppError")
const User = require("../models/User")
const Product = require("../models/Product")
const Article = require("../models/Article")

// =================================================================
// ADVISORY IMAGE ROUTES
// =================================================================

/**
 * @route   POST /api/uploads/advisory
 * @desc    Upload advisory crop image
 * @access  Private
 */
router.post(
  "/advisory",
  protect,
  uploadAdvisoryImage,
  asyncHandler(async (req, res) => {
    if (!req.uploadedFile) {
      throw new AppError("No image uploaded", 400)
    }

    res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      url: req.uploadedFile.url,
    })
  }),
)

// =================================================================
// AVATAR ROUTES
// =================================================================

/**
 * @route   POST /api/uploads/avatar
 * @desc    Upload user avatar
 * @access  Private
 */
router.post(
  "/avatar",
  protect,
  uploadAvatar,
  asyncHandler(async (req, res) => {
    if (!req.uploadedAvatar) {
      throw new AppError("No file uploaded", 400)
    }

    const user = await User.findById(req.user.id)

    // Delete old avatar if exists
    if (user.avatar && user.avatar.url) {
      await deleteFile(user.avatar.url)
    }

    // Update user avatar
    user.avatar = {
      url: req.uploadedAvatar.url,
      key: req.uploadedAvatar.key,
    }
    await user.save({ validateBeforeSave: false })

    res.status(200).json({
      success: true,
      message: "Avatar uploaded successfully",
      data: {
        avatar: user.avatar,
      },
    })
  }),
)

/**
 * @route   DELETE /api/uploads/avatar
 * @desc    Delete user avatar
 * @access  Private
 */
router.delete(
  "/avatar",
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id)

    if (user.avatar && user.avatar.url) {
      await deleteFile(user.avatar.url)

      user.avatar = undefined
      await user.save({ validateBeforeSave: false })
    }

    res.status(200).json({
      success: true,
      message: "Avatar deleted successfully",
    })
  }),
)

// =================================================================
// PRODUCT IMAGE ROUTES
// =================================================================

/**
 * @route   POST /api/uploads/products/:productId/images
 * @desc    Upload product images
 * @access  Private (Farmer, Admin)
 */
router.post(
  "/products/:productId/images",
  protect,
  authorize("farmer", "admin"),
  uploadProductImages,
  asyncHandler(async (req, res) => {
    if (!req.uploadedImages || req.uploadedImages.length === 0) {
      throw new AppError("No images uploaded", 400)
    }

    const product = await Product.findById(req.params.productId)

    if (!product) {
      // Cleanup uploaded files
      for (const img of req.uploadedImages) {
        await deleteFile(img.url)
        await deleteFile(img.thumbnailUrl)
      }
      throw new AppError("Product not found", 404)
    }

    // Check ownership
    if (product.seller.toString() !== req.user.id && req.user.role !== "admin") {
      for (const img of req.uploadedImages) {
        await deleteFile(img.url)
        await deleteFile(img.thumbnailUrl)
      }
      throw new AppError("Not authorized to update this product", 403)
    }

    // Check total image limit
    const currentCount = product.images ? product.images.length : 0
    if (currentCount + req.uploadedImages.length > 10) {
      for (const img of req.uploadedImages) {
        await deleteFile(img.url)
        await deleteFile(img.thumbnailUrl)
      }
      throw new AppError(`Cannot add more images. Maximum 10 images allowed. Current: ${currentCount}`, 400)
    }

    // Add new images
    const newImages = req.uploadedImages.map((img, index) => ({
      url: img.url,
      thumbnailUrl: img.thumbnailUrl,
      key: img.key,
      thumbnailKey: img.thumbnailKey,
      isPrimary: currentCount === 0 && index === 0,
      order: currentCount + index,
    }))

    product.images = [...(product.images || []), ...newImages]
    await product.save()

    res.status(200).json({
      success: true,
      message: `${req.uploadedImages.length} image(s) uploaded successfully`,
      data: {
        images: product.images,
      },
    })
  }),
)

/**
 * @route   DELETE /api/uploads/products/:productId/images/:imageId
 * @desc    Delete product image
 * @access  Private (Farmer, Admin)
 */
router.delete(
  "/products/:productId/images/:imageId",
  protect,
  authorize("farmer", "admin"),
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.productId)

    if (!product) {
      throw new AppError("Product not found", 404)
    }

    // Check ownership
    if (product.seller.toString() !== req.user.id && req.user.role !== "admin") {
      throw new AppError("Not authorized to update this product", 403)
    }

    // Find image
    const imageIndex = product.images.findIndex((img) => img._id.toString() === req.params.imageId)

    if (imageIndex === -1) {
      throw new AppError("Image not found", 404)
    }

    const image = product.images[imageIndex]

    // Delete from storage
    await deleteFile(image.url)
    if (image.thumbnailUrl) {
      await deleteFile(image.thumbnailUrl)
    }

    // Remove from array
    product.images.splice(imageIndex, 1)

    // Reorder remaining images
    product.images.forEach((img, idx) => {
      img.order = idx
    })

    // Set new primary if needed
    if (image.isPrimary && product.images.length > 0) {
      product.images[0].isPrimary = true
    }

    await product.save()

    res.status(200).json({
      success: true,
      message: "Image deleted successfully",
      data: {
        images: product.images,
      },
    })
  }),
)

/**
 * @route   PUT /api/uploads/products/:productId/images/:imageId/primary
 * @desc    Set image as primary
 * @access  Private (Farmer, Admin)
 */
router.put(
  "/products/:productId/images/:imageId/primary",
  protect,
  authorize("farmer", "admin"),
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.productId)

    if (!product) {
      throw new AppError("Product not found", 404)
    }

    if (product.seller.toString() !== req.user.id && req.user.role !== "admin") {
      throw new AppError("Not authorized to update this product", 403)
    }

    // Reset all to non-primary
    product.images.forEach((img) => {
      img.isPrimary = img._id.toString() === req.params.imageId
    })

    await product.save()

    res.status(200).json({
      success: true,
      message: "Primary image updated",
      data: {
        images: product.images,
      },
    })
  }),
)

/**
 * @route   PUT /api/uploads/products/:productId/images/reorder
 * @desc    Reorder product images
 * @access  Private (Farmer, Admin)
 */
router.put(
  "/products/:productId/images/reorder",
  protect,
  authorize("farmer", "admin"),
  asyncHandler(async (req, res) => {
    const { imageIds } = req.body

    if (!imageIds || !Array.isArray(imageIds)) {
      throw new AppError("imageIds array is required", 400)
    }

    const product = await Product.findById(req.params.productId)

    if (!product) {
      throw new AppError("Product not found", 404)
    }

    if (product.seller.toString() !== req.user.id && req.user.role !== "admin") {
      throw new AppError("Not authorized to update this product", 403)
    }

    // Reorder images based on provided order
    const reorderedImages = imageIds
      .map((id, index) => {
        const image = product.images.find((img) => img._id.toString() === id)
        if (image) {
          image.order = index
        }
        return image
      })
      .filter(Boolean)

    product.images = reorderedImages
    await product.save()

    res.status(200).json({
      success: true,
      message: "Images reordered successfully",
      data: {
        images: product.images,
      },
    })
  }),
)

// =================================================================
// DOCUMENT ROUTES (KYC, Certificates)
// =================================================================

/**
 * @route   POST /api/uploads/documents
 * @desc    Upload verification documents
 * @access  Private
 */
router.post(
  "/documents",
  protect,
  uploadDocuments,
  asyncHandler(async (req, res) => {
    if (!req.uploadedDocuments || req.uploadedDocuments.length === 0) {
      throw new AppError("No documents uploaded", 400)
    }

    const user = await User.findById(req.user.id)

    // Add documents to user's verification documents
    if (!user.verificationDocuments) {
      user.verificationDocuments = []
    }

    user.verificationDocuments.push(
      ...req.uploadedDocuments.map((doc) => ({
        type: doc.documentType,
        url: doc.url,
        key: doc.key,
        uploadedAt: doc.uploadedAt,
        status: "pending",
      })),
    )

    // Update KYC status
    if (user.kycStatus === "not_submitted") {
      user.kycStatus = "pending"
    }

    await user.save({ validateBeforeSave: false })

    res.status(200).json({
      success: true,
      message: `${req.uploadedDocuments.length} document(s) uploaded successfully`,
      data: {
        documents: user.verificationDocuments,
      },
    })
  }),
)

/**
 * @route   DELETE /api/uploads/documents/:documentId
 * @desc    Delete verification document
 * @access  Private
 */
router.delete(
  "/documents/:documentId",
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id)

    const docIndex = user.verificationDocuments.findIndex((doc) => doc._id.toString() === req.params.documentId)

    if (docIndex === -1) {
      throw new AppError("Document not found", 404)
    }

    const doc = user.verificationDocuments[docIndex]

    // Can only delete pending documents
    if (doc.status !== "pending") {
      throw new AppError("Cannot delete verified or rejected documents", 400)
    }

    // Delete from storage
    await deleteFile(doc.url)

    // Remove from array
    user.verificationDocuments.splice(docIndex, 1)
    await user.save({ validateBeforeSave: false })

    res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    })
  }),
)

// =================================================================
// ARTICLE COVER ROUTES
// =================================================================

/**
 * @route   POST /api/uploads/articles/:articleId/cover
 * @desc    Upload article cover image
 * @access  Private (Expert, Admin)
 */
router.post(
  "/articles/:articleId/cover",
  protect,
  authorize("expert", "admin"),
  uploadArticleCover,
  asyncHandler(async (req, res) => {
    if (!req.uploadedCover) {
      throw new AppError("No cover image uploaded", 400)
    }

    const article = await Article.findById(req.params.articleId)

    if (!article) {
      await deleteFile(req.uploadedCover.url)
      await deleteFile(req.uploadedCover.thumbnailUrl)
      throw new AppError("Article not found", 404)
    }

    // Check ownership
    if (article.author.toString() !== req.user.id && req.user.role !== "admin") {
      await deleteFile(req.uploadedCover.url)
      await deleteFile(req.uploadedCover.thumbnailUrl)
      throw new AppError("Not authorized to update this article", 403)
    }

    // Delete old cover if exists
    if (article.coverImage) {
      await deleteFile(article.coverImage.url)
      if (article.coverImage.thumbnailUrl) {
        await deleteFile(article.coverImage.thumbnailUrl)
      }
    }

    // Update article cover
    article.coverImage = {
      url: req.uploadedCover.url,
      thumbnailUrl: req.uploadedCover.thumbnailUrl,
      key: req.uploadedCover.key,
      thumbnailKey: req.uploadedCover.thumbnailKey,
    }
    await article.save()

    res.status(200).json({
      success: true,
      message: "Cover image uploaded successfully",
      data: {
        coverImage: article.coverImage,
      },
    })
  }),
)

// =================================================================
// BULK OPERATIONS
// =================================================================

/**
 * @route   DELETE /api/uploads/bulk
 * @desc    Delete multiple files (Admin only)
 * @access  Private (Admin)
 */
router.delete(
  "/bulk",
  protect,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const { urls } = req.body

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      throw new AppError("urls array is required", 400)
    }

    if (urls.length > 50) {
      throw new AppError("Maximum 50 files can be deleted at once", 400)
    }

    const results = await Promise.allSettled(urls.map((url) => deleteFile(url)))

    const deleted = results.filter((r) => r.status === "fulfilled").length
    const failed = results.filter((r) => r.status === "rejected").length

    res.status(200).json({
      success: true,
      message: `Deleted ${deleted} files. ${failed} failed.`,
      data: {
        deleted,
        failed,
      },
    })
  }),
)

module.exports = router
