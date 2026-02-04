/**
 * Multer + Cloudinary upload middleware for product images
 * Uses Cloudinary when CLOUDINARY_* env is set; otherwise memory storage (product route uses placeholder URLs).
 */

const multer = require("multer")
const AppError = require("../utils/AppError")
const fs = require("fs")
const path = require("path")

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
  if (allowed.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new AppError("Only JPEG, PNG, and WebP images are allowed", 400), false)
  }
}

const limits = {
  fileSize: 10 * 1024 * 1024, // 10MB per file
  files: 5,
}

const cloudName = process.env.CLOUDINARY_CLOUD_NAME
const apiKey = process.env.CLOUDINARY_API_KEY
const apiSecret = process.env.CLOUDINARY_API_SECRET
const hasCloudinary =
  cloudName &&
  apiKey &&
  apiSecret &&
  cloudName !== "your_cloud_name" &&
  apiKey !== "your_api_key" &&
  cloudName !== "your_cloud_name" &&
  apiKey !== "your_api_key" &&
  apiSecret !== "your_api_secret"

let productStorage
if (hasCloudinary) {
  const { CloudinaryStorage } = require("multer-storage-cloudinary")
  const cloudinary = require("../config/cloudinary")
  productStorage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "greentrace/products",
      allowed_formats: ["jpg", "png", "jpeg", "webp"],
      resource_type: "image",
      public_id: (req, file) => `product-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
    },
  })
} else {
  productStorage = multer.memoryStorage()
}

const upload = multer({
  storage: productStorage,
  fileFilter,
  limits,
})

module.exports = {
  upload,
  uploadProductImages: upload.array("images", 5),
  hasCloudinary: () => hasCloudinary,
}
