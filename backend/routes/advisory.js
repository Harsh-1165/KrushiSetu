const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const aiAdvisoryService = require("../services/aiAdvisoryService");
const logger = require("../utils/logger");
const { protect } = require("../middleware/auth"); // Assuming strict auth for advisory

// Helper to ensure 'uploads' directory exists
const fs = require('fs');
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer Storage (Cloudinary)
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "greentrace/crops",
        allowed_formats: ["jpg", "png", "jpeg"],
        transformation: [{ width: 1000, height: 1000, crop: "limit" }]
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

/**
 * @route   POST /api/v1/advisory/analyze
 * @desc    Analyze crop image or text prompt
 * @access  Private (User/Farmer)
 */
// Custom Upload Middleware to handle Multer errors
const uploadMiddleware = (req, res, next) => {
    upload.single("image")(req, res, (err) => {
        if (err) {
            logger.error("Multer/Cloudinary Upload Error:", err);
            // Check for specific Cloudinary errors
            if (err.message && err.message.includes("Cloudinary")) {
                return res.status(500).json({ success: false, message: "Image upload failed. Cloudinary Error." });
            }
            // Check for file size limit
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({ success: false, message: "File too large. Max size is 5MB." });
            }
            return res.status(500).json({ success: false, message: "Image upload failed.", error: err.message });
        }
        next();
    });
};

/**
 * @route   POST /api/v1/advisory/analyze
 * @desc    Analyze crop image or text prompt
 * @access  Private (User/Farmer)
 */
router.post("/analyze", uploadMiddleware, async (req, res) => {
    try {
        const { prompt, lat, lng, soilData, analysisMode } = req.body;
        const file = req.file;

        if (!prompt && !file) {
            fs.appendFileSync('debug.log', `[${new Date().toISOString()}] No prompt or file provided\n`);
            return res.status(400).json({
                success: false,
                message: "Please provide either a crop image or a text prompt."
            });
        }
        // ... (rest of the route logic remains same, but I need to make sure I don't delete it or I copy it back)
        // Only replacing the wrapper and top part of route
        // Debug logging
        // logger.info("Advisory Request Body:", req.body);
        fs.appendFileSync('debug.log', `[${new Date().toISOString()}] processing request. hasFile: ${!!file}, Soil: ${!!soilData}\n`);

        if (file) {
            logger.info(`Processing image: ${file.originalname}, Cloudinary URL: ${file.path}`);
        } else {
            logger.info("No image provided, using text-only/soil analysis.");
        }

        let parsedSoilData = null;
        if (soilData) {
            try {
                parsedSoilData = typeof soilData === 'string' ? JSON.parse(soilData) : soilData;
            } catch (e) {
                logger.warn("Failed to parse soilData:", e.message);
            }
        }

        const result = await aiAdvisoryService.analyzeCrop({
            imageUrl: file ? file.path : null, // Cloudinary URL
            prompt: prompt,
            location: (lat && lng) ? { lat, lng } : null,
            soilData: parsedSoilData,
            analysisMode: analysisMode || "crop"
        });

        // Cleanup: Optionally delete file after analysis if not storing permanently
        // (For now, we keep it or rely on cron cleanup, or delete immediately)
        // if (file) fs.unlinkSync(file.path); 

        fs.appendFileSync('debug.log', `[Route] Service returned. Sending response...\n`);

        // Safety check: Ensure result is serializable
        try {
            JSON.stringify(result);
        } catch (e) {
            fs.appendFileSync('debug.log', `[Route] Result is not serializable: ${e.message}\n`);
            throw new Error("Analysis result is not valid JSON.");
        }

        res.status(200).json({
            success: true,
            data: result
        });
        fs.appendFileSync('debug.log', `[Route] Response sent successfully.\n`);

    } catch (error) {
        logger.error("Advisory Analysis Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "AI Analysis failed. Please try again."
        });
    }
});

module.exports = router;
