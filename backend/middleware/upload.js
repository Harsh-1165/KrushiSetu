/**
 * Multer + Sharp + Cloudinary upload middleware for product images.
 * Pipeline: multer (memoryStorage) → Sharp compress to <8MB → Cloudinary upload
 * This ensures files stay within Cloudinary free-tier 10MB limit.
 */

const multer = require("multer")
const AppError = require("../utils/AppError")

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
  if (allowed.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new AppError("Only JPEG, PNG, and WebP images are allowed", 400), false)
  }
}

// Accept up to 25MB from client — Sharp will compress before sending to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB from client
    files: 10,
  },
})

// ── Cloudinary config ────────────────────────────────────────────
const cloudName = process.env.CLOUDINARY_CLOUD_NAME
const apiKey = process.env.CLOUDINARY_API_KEY
const apiSecret = process.env.CLOUDINARY_API_SECRET
const hasCloudinaryConfig =
  cloudName &&
  apiKey &&
  apiSecret &&
  cloudName !== "your_cloud_name" &&
  apiKey !== "your_api_key" &&
  apiSecret !== "your_api_secret"

const hasCloudinary = () => hasCloudinaryConfig

// ── Sharp compress + Cloudinary upload helper ────────────────────
async function compressAndUpload(buffer, mimetype, folder) {
  let sharp
  try {
    sharp = require("sharp")
  } catch {
    throw new AppError("Sharp image processor not available", 500)
  }

  const cloudinary = require("../config/cloudinary")
  const { Readable } = require("stream")

  // Compress: convert to WebP, limit to 1800px wide, quality 80
  const compressed = await sharp(buffer)
    .resize({ width: 1800, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer()

  // Upload compressed buffer via stream
  return new Promise((resolve, reject) => {
    const publicId = `product-${Date.now()}-${Math.round(Math.random() * 1e9)}`
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: "image",
        format: "webp",
      },
      (error, result) => {
        if (error) return reject(new AppError(error.message, 500))
        resolve(result)
      }
    )
    const readable = Readable.from(compressed)
    readable.pipe(uploadStream)
  })
}

// ── Post-multer middleware: compress & upload each file ──────────
async function processProductImages(req, res, next) {
  try {
    if (!req.files || req.files.length === 0) return next()

    if (!hasCloudinaryConfig) {
      // No Cloudinary — just attach placeholder URLs so the route doesn't crash
      req.files = req.files.map((f, i) => ({
        ...f,
        path: `/placeholder-product-${i}.jpg`,
        filename: f.originalname,
        secure_url: `/placeholder-product-${i}.jpg`,
      }))
      return next()
    }

    const uploaded = await Promise.all(
      req.files.map((file) =>
        compressAndUpload(file.buffer, file.mimetype, "greentrace/products")
      )
    )

    // Attach cloudinary results to req.files so route handler can use them
    req.files = req.files.map((f, i) => ({
      ...f,
      path: uploaded[i].secure_url,
      filename: uploaded[i].public_id,
      secure_url: uploaded[i].secure_url,
      public_id: uploaded[i].public_id,
    }))

    next()
  } catch (err) {
    next(err)
  }
}

// Combined middleware: multer parse → compress → upload
const uploadProductImages = [
  upload.array("images", 10),
  processProductImages,
]

module.exports = {
  upload,
  uploadProductImages,
  hasCloudinary,
}
