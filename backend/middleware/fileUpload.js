/**
 * =================================================================
 * FILE UPLOAD & MEDIA HANDLING SYSTEM
 * =================================================================
 * Complete file upload system for agricultural marketplace
 * Supports: Product images, Avatars, Documents, Article covers
 * Features: Validation, Compression, Local storage, Security
 * =================================================================
 */

const multer = require("multer")
const sharp = require("sharp")
const path = require("path")
const fs = require("fs").promises
const crypto = require("crypto")
const AppError = require("../utils/AppError")

// =================================================================
// CONFIGURATION
// =================================================================

const config = {
  // Local storage path (product images use Cloudinary via middleware/upload.js)
  localUploadPath: process.env.UPLOAD_PATH || "uploads",

  // File size limits (in bytes)
  limits: {
    avatar: 2 * 1024 * 1024, // 2MB
    productImage: 5 * 1024 * 1024, // 5MB
    document: 10 * 1024 * 1024, // 10MB
    articleCover: 5 * 1024 * 1024, // 5MB
    advisoryImage: 5 * 1024 * 1024, // 5MB
    totalUpload: 50 * 1024 * 1024, // 50MB total per request
  },

  // Allowed file types
  allowedTypes: {
    image: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    document: ["application/pdf", "image/jpeg", "image/jpg", "image/png"],
    all: ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"],
  },

  // Image optimization settings
  imageOptimization: {
    avatar: { width: 300, height: 300, quality: 80 },
    productImage: { width: 1200, height: 1200, quality: 85 },
    productThumbnail: { width: 400, height: 400, quality: 80 },
    articleCover: { width: 1600, height: 900, quality: 85 },
    articleThumbnail: { width: 600, height: 338, quality: 80 },
    advisoryImage: { width: 1200, height: 1200, quality: 85 },
  },
}

// =================================================================
// UTILITY FUNCTIONS
// =================================================================

/**
 * Generate unique filename with timestamp and random string
 */
const generateFilename = (originalName, prefix = "") => {
  const timestamp = Date.now()
  const randomString = crypto.randomBytes(8).toString("hex")
  const ext = path.extname(originalName).toLowerCase()
  const sanitizedName = path
    .basename(originalName, ext)
    .replace(/[^a-zA-Z0-9]/g, "-")
    .substring(0, 20)

  return `${prefix}${timestamp}-${randomString}-${sanitizedName}${ext}`
}

/**
 * Get file extension from mimetype
 */
const getExtensionFromMime = (mimetype) => {
  const mimeToExt = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
  }
  return mimeToExt[mimetype] || ".bin"
}

/**
 * Ensure upload directory exists
 */
const ensureDir = async (dirPath) => {
  try {
    await fs.access(dirPath)
  } catch {
    await fs.mkdir(dirPath, { recursive: true })
  }
}

/**
 * Validate file magic bytes (prevent fake extensions)
 */
const validateMagicBytes = (buffer) => {
  const signatures = {
    "image/jpeg": [0xff, 0xd8, 0xff],
    "image/png": [0x89, 0x50, 0x4e, 0x47],
    "image/webp": [0x52, 0x49, 0x46, 0x46], // RIFF
    "application/pdf": [0x25, 0x50, 0x44, 0x46], // %PDF
  }

  for (const [type, signature] of Object.entries(signatures)) {
    const matches = signature.every((byte, index) => buffer[index] === byte)
    if (matches) return type
  }

  return null
}

// =================================================================
// FILE VALIDATION MIDDLEWARE
// =================================================================

/**
 * Validate file type based on magic bytes and extension
 */
const validateFileType = (allowedTypes) => async (req, res, next) => {
  if (!req.file && !req.files) {
    return next()
  }

  const files = req.file ? [req.file] : Object.values(req.files).flat()

  try {
    for (const file of files) {
      // Check MIME type
      if (!allowedTypes.includes(file.mimetype)) {
        throw new AppError(`Invalid file type: ${file.mimetype}. Allowed: ${allowedTypes.join(", ")}`, 400)
      }

      // Validate magic bytes for security
      const detectedType = validateMagicBytes(file.buffer)
      if (!detectedType || !allowedTypes.includes(detectedType)) {
        throw new AppError("File content does not match its extension. Possible malicious file detected.", 400)
      }

      // Check for embedded scripts in images (basic XSS prevention)
      const bufferString = file.buffer.toString("utf8", 0, Math.min(1000, file.buffer.length))
      const dangerousPatterns = [/<script/i, /javascript:/i, /on\w+\s*=/i, /<\?php/i, /<%/]

      if (dangerousPatterns.some((pattern) => pattern.test(bufferString))) {
        throw new AppError("Potentially malicious content detected in file.", 400)
      }
    }

    next()
  } catch (error) {
    next(error)
  }
}

/**
 * Validate total upload size
 */
const validateTotalSize = (maxTotal) => (req, res, next) => {
  if (!req.file && !req.files) {
    return next()
  }

  const files = req.file ? [req.file] : Object.values(req.files).flat()
  const totalSize = files.reduce((sum, file) => sum + file.size, 0)

  if (totalSize > maxTotal) {
    return next(
      new AppError(
        `Total upload size (${(totalSize / 1024 / 1024).toFixed(2)}MB) exceeds limit (${(maxTotal / 1024 / 1024).toFixed(2)}MB)`,
        400,
      ),
    )
  }

  next()
}

// =================================================================
// IMAGE PROCESSING
// =================================================================

/**
 * Process and optimize image with Sharp
 */
const processImage = async (buffer, options = {}) => {
  const {
    width = 1200,
    height = 1200,
    quality = 85,
    format = "jpeg",
    fit = "inside",
    withoutEnlargement = true,
  } = options

  let processor = sharp(buffer)
    .rotate() // Auto-rotate based on EXIF
    .resize(width, height, {
      fit,
      withoutEnlargement,
    })

  // Strip metadata for privacy/security
  processor = processor.withMetadata({ orientation: undefined })

  // Convert to specified format with optimization
  switch (format) {
    case "jpeg":
    case "jpg":
      processor = processor.jpeg({ quality, progressive: true })
      break
    case "png":
      processor = processor.png({ quality, compressionLevel: 9 })
      break
    case "webp":
      processor = processor.webp({ quality })
      break
    default:
      processor = processor.jpeg({ quality, progressive: true })
  }

  return processor.toBuffer()
}

/**
 * Generate thumbnail from image
 */
const generateThumbnail = async (buffer, options = {}) => {
  const { width = 400, height = 400, quality = 80 } = options

  return sharp(buffer)
    .rotate()
    .resize(width, height, {
      fit: "cover",
      position: "center",
    })
    .jpeg({ quality, progressive: true })
    .toBuffer()
}

// =================================================================
// STORAGE HANDLERS
// =================================================================

/**
 * Upload file to local storage
 */
const uploadToLocal = async (buffer, relativePath) => {
  const fullPath = path.join(config.localUploadPath, relativePath)
  const dir = path.dirname(fullPath)

  await ensureDir(dir)
  await fs.writeFile(fullPath, buffer)

  // Return relative URL path
  return `/uploads/${relativePath}`
}

/**
 * Delete file from local storage
 */
const deleteFromLocal = async (relativePath) => {
  const fullPath = path.join(config.localUploadPath, relativePath)

  try {
    await fs.access(fullPath)
    await fs.unlink(fullPath)
  } catch (error) {
    // File doesn't exist, ignore
    if (error.code !== "ENOENT") {
      throw error
    }
  }
}

// =================================================================
// MULTER CONFIGURATIONS
// =================================================================

/**
 * Memory storage for processing before upload
 */
const memoryStorage = multer.memoryStorage()

/**
 * Base multer file filter
 */
const createFileFilter = (allowedTypes) => (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new AppError(`Invalid file type: ${file.mimetype}. Allowed: ${allowedTypes.join(", ")}`, 400), false)
  }
}

/**
 * Avatar upload configuration
 */
const avatarUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: config.limits.avatar,
    files: 1,
  },
  fileFilter: createFileFilter(config.allowedTypes.image),
}).single("avatar")

/**
 * Product images upload configuration (multiple)
 */
const productImagesUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: config.limits.productImage,
    files: 10,
  },
  fileFilter: createFileFilter(config.allowedTypes.image),
}).array("images", 10)

/**
 * Document upload configuration
 */
const documentUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: config.limits.document,
    files: 5,
  },
  fileFilter: createFileFilter(config.allowedTypes.document),
}).array("documents", 5)

/**
 * Article cover upload configuration
 */
const articleCoverUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: config.limits.articleCover,
    files: 1,
  },
  fileFilter: createFileFilter(config.allowedTypes.image),
}).single("cover")

/**
 * Advisory image upload configuration (single "image" field to match frontend)
 */
const advisoryImageUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: config.limits.advisoryImage,
    files: 1,
  },
  fileFilter: createFileFilter(config.allowedTypes.image),
}).single("image")

/**
 * Mixed upload (images + documents)
 */
const mixedUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: config.limits.document,
    files: 15,
  },
  fileFilter: createFileFilter(config.allowedTypes.all),
}).fields([
  { name: "images", maxCount: 10 },
  { name: "documents", maxCount: 5 },
])

// =================================================================
// FILE PROCESSING MIDDLEWARE
// =================================================================

/**
 * Process avatar upload
 */
const processAvatarUpload = async (req, res, next) => {
  if (!req.file) {
    return next()
  }

  try {
    const userId = req.user.id
    const filename = generateFilename(req.file.originalname, "avatar-")
    const key = `avatars/${userId}/${filename}`

    // Process and optimize image
    const processedBuffer = await processImage(req.file.buffer, {
      ...config.imageOptimization.avatar,
      fit: "cover",
    })

    // Upload to local storage
    const url = await uploadToLocal(processedBuffer, key)

    // Attach to request
    req.uploadedAvatar = {
      url,
      key,
      originalName: req.file.originalname,
      size: processedBuffer.length,
      mimetype: "image/jpeg",
    }

    next()
  } catch (error) {
    next(new AppError(`Avatar processing failed: ${error.message}`, 500))
  }
}

/**
 * Process product images upload
 */
const processProductImagesUpload = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next()
  }

  try {
    const productId = req.params.id || "new"
    const uploadedImages = []

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i]
      const filename = generateFilename(file.originalname, `product-${i}-`)
      const thumbnailFilename = filename.replace(/\.[^.]+$/, "-thumb.jpg")

      const key = `products/${productId}/${filename}`
      const thumbnailKey = `products/${productId}/thumbnails/${thumbnailFilename}`

      // Process main image
      const processedBuffer = await processImage(file.buffer, config.imageOptimization.productImage)

      // Generate thumbnail
      const thumbnailBuffer = await generateThumbnail(file.buffer, config.imageOptimization.productThumbnail)

      // Upload to local storage
      const [url, thumbnailUrl] = await Promise.all([
        uploadToLocal(processedBuffer, key),
        uploadToLocal(thumbnailBuffer, thumbnailKey),
      ])

      uploadedImages.push({
        url,
        thumbnailUrl,
        key,
        thumbnailKey,
        originalName: file.originalname,
        size: processedBuffer.length,
        isPrimary: i === 0,
        order: i,
      })
    }

    req.uploadedImages = uploadedImages
    next()
  } catch (error) {
    next(new AppError(`Product image processing failed: ${error.message}`, 500))
  }
}

/**
 * Process document upload (KYC, certificates)
 */
const processDocumentUpload = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next()
  }

  try {
    const userId = req.user.id
    const docType = req.body.documentType || "general"
    const uploadedDocuments = []

    for (const file of req.files) {
      const filename = generateFilename(file.originalname, `${docType}-`)
      const key = `documents/${userId}/${docType}/${filename}`

      let buffer = file.buffer
      let mimetype = file.mimetype

      // If image, optimize it
      if (config.allowedTypes.image.includes(file.mimetype)) {
        buffer = await processImage(file.buffer, {
          width: 2000,
          height: 2000,
          quality: 90,
        })
        mimetype = "image/jpeg"
      }

      // Upload to local storage
      const url = await uploadToLocal(buffer, key)

      uploadedDocuments.push({
        url,
        key,
        originalName: file.originalname,
        size: buffer.length,
        mimetype,
        documentType: docType,
        uploadedAt: new Date(),
      })
    }

    req.uploadedDocuments = uploadedDocuments
    next()
  } catch (error) {
    next(new AppError(`Document processing failed: ${error.message}`, 500))
  }
}

/**
 * Process article cover upload
 */
const processArticleCoverUpload = async (req, res, next) => {
  if (!req.file) {
    return next()
  }

  try {
    const articleId = req.params.id || "new"
    const filename = generateFilename(req.file.originalname, "cover-")
    const thumbnailFilename = filename.replace(/\.[^.]+$/, "-thumb.jpg")

    const key = `articles/${articleId}/${filename}`
    const thumbnailKey = `articles/${articleId}/${thumbnailFilename}`

    // Process cover image (16:9 aspect ratio)
    const processedBuffer = await processImage(req.file.buffer, {
      ...config.imageOptimization.articleCover,
      fit: "cover",
    })

    // Generate thumbnail
    const thumbnailBuffer = await generateThumbnail(req.file.buffer, config.imageOptimization.articleThumbnail)

    // Upload to local storage
    const [url, thumbnailUrl] = await Promise.all([
      uploadToLocal(processedBuffer, key),
      uploadToLocal(thumbnailBuffer, thumbnailKey),
    ])

    req.uploadedCover = {
      url,
      thumbnailUrl,
      key,
      thumbnailKey,
      originalName: req.file.originalname,
      size: processedBuffer.length,
    }

    next()
  } catch (error) {
    next(new AppError(`Article cover processing failed: ${error.message}`, 500))
  }
}

/**
 * Process advisory image upload
 */
const processAdvisoryImageUpload = async (req, res, next) => {
  if (!req.file) {
    return next()
  }

  try {
    const userId = req.user.id
    const filename = generateFilename(req.file.originalname, "advisory-")
    const key = `advisory/${userId}/${filename}`

    // Process image
    const processedBuffer = await processImage(req.file.buffer, {
      ...config.imageOptimization.advisoryImage,
      fit: "inside",
    })

    // Upload to local storage
    const url = await uploadToLocal(processedBuffer, key)

    req.uploadedFile = {
      url,
      key,
      originalName: req.file.originalname,
      size: processedBuffer.length,
    }

    next()
  } catch (error) {
    next(new AppError(`Advisory image processing failed: ${error.message}`, 500))
  }
}

// =================================================================
// FILE DELETION
// =================================================================

/**
 * Delete file from storage
 */
const deleteFile = async (fileUrl) => {
  if (!fileUrl) return
  try {
    const relativePath = fileUrl.replace("/uploads/", "")
    await deleteFromLocal(relativePath)
  } catch (error) {
    console.error("File deletion error:", error)
  }
}

/**
 * Delete multiple files
 */
const deleteFiles = async (fileUrls) => {
  await Promise.all(fileUrls.map((url) => deleteFile(url)))
}

/**
 * Delete user avatar
 */
const deleteAvatar = async (userId, avatarUrl) => {
  await deleteFile(avatarUrl)
}

/**
 * Delete product images (images can be URL strings or { url, thumbnailUrl } objects)
 */
const deleteProductImages = async (images) => {
  const urls = (images || []).flatMap((img) =>
    typeof img === "string" ? [img] : [img?.url, img?.thumbnailUrl].filter(Boolean),
  )
  await deleteFiles(urls)
}

// =================================================================
// ERROR HANDLING MIDDLEWARE
// =================================================================

/**
 * Multer error handler
 */
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    let message

    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        message = `File too large. Maximum size allowed is ${(config.limits.productImage / 1024 / 1024).toFixed(0)}MB`
        break
      case "LIMIT_FILE_COUNT":
        message = "Too many files. Please reduce the number of files."
        break
      case "LIMIT_UNEXPECTED_FILE":
        message = `Unexpected field: ${err.field}`
        break
      default:
        message = "File upload error"
    }

    return res.status(400).json({
      success: false,
      error: {
        code: "UPLOAD_ERROR",
        message,
      },
    })
  }

  next(err)
}

// =================================================================
// COMBINED UPLOAD MIDDLEWARE CHAINS
// =================================================================

/**
 * Avatar upload chain
 */
const uploadAvatar = [avatarUpload, handleMulterError, validateFileType(config.allowedTypes.image), processAvatarUpload]

/**
 * Product images upload chain
 */
const uploadProductImages = [
  productImagesUpload,
  handleMulterError,
  validateFileType(config.allowedTypes.image),
  validateTotalSize(config.limits.totalUpload),
  processProductImagesUpload,
]

/**
 * Document upload chain
 */
const uploadDocuments = [
  documentUpload,
  handleMulterError,
  validateFileType(config.allowedTypes.document),
  validateTotalSize(config.limits.totalUpload),
  processDocumentUpload,
]

/**
 * Article cover upload chain
 */
const uploadArticleCover = [
  articleCoverUpload,
  handleMulterError,
  validateFileType(config.allowedTypes.image),
  processArticleCoverUpload,
]

/**
 * Advisory image upload chain
 */
const uploadAdvisoryImage = [
  advisoryImageUpload,
  handleMulterError,
  validateFileType(config.allowedTypes.image),
  processAdvisoryImageUpload,
]

/**
 * Mixed upload chain (for questions with images and documents)
 */
const uploadMixed = [mixedUpload, handleMulterError, validateTotalSize(config.limits.totalUpload)]

// =================================================================
// EXPORTS
// =================================================================

module.exports = {
  // Configuration
  config,

  // Raw multer instances
  avatarUpload,
  productImagesUpload,
  documentUpload,
  articleCoverUpload,
  advisoryImageUpload,
  mixedUpload,

  // Middleware chains (recommended)
  uploadAvatar,
  uploadProductImages,
  uploadDocuments,
  uploadArticleCover,
  uploadAdvisoryImage,
  uploadMixed,

  // Processing functions
  processImage,
  generateThumbnail,

  // Storage functions
  uploadToLocal,
  deleteFile,
  deleteFiles,
  deleteAvatar,
  deleteProductImages,

  // Validation middleware
  validateFileType,
  validateTotalSize,
  handleMulterError,

  // Utilities
  generateFilename,
  validateMagicBytes,
}
