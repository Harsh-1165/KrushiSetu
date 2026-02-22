/**
 * GreenTrace AI Advisory Service
 * Runs LOCAL ML models via Python (child_process) — NO external AI APIs used.
 *
 * Modes:
 *  - Image: python ml/predict.py <imageUrl> --mode image   → crop disease CNN
 *  - Soil:  python ml/predict.py <features> --mode soil    → soil quality classifier
 *  - Weather: internal weatherService
 */
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const logger = require("../utils/logger");
const weatherService = require("./weatherService");

const DEBUG_LOG = path.join(__dirname, "../debug.log");

/**
 * Run a Python ML inference script and capture JSON output.
 * Returns parsed data object, or null on failure.
 */
const runPythonScript = (args) => {
    return new Promise((resolve) => {
        const scriptPath = path.join(__dirname, "../ml/predict.py");
        const startTime = Date.now();

        const cmdStr = `python "${scriptPath}" ${args.join(" ")}`;
        logger.info(`[ML] Executing: ${cmdStr}`);

        const proc = spawn("python", [scriptPath, ...args], { timeout: 60000 });

        let stdout = "";
        let stderr = "";

        proc.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
        proc.stderr.on("data", (chunk) => { stderr += chunk.toString(); });

        proc.on("error", (err) => {
            const elapsed = Date.now() - startTime;
            logger.error(`[ML] Failed to start Python process (${elapsed}ms):`, err.message);
            resolve({ error: `Python process failed to start: ${err.message}` });
        });

        proc.on("close", (code) => {
            const elapsed = Date.now() - startTime;

            if (stderr.trim()) {
                logger.debug(`[ML] Python stderr (${elapsed}ms): ${stderr.trim()}`);
            }

            if (code !== 0) {
                logger.error(`[ML] Python exited with code ${code} (${elapsed}ms)`);
                resolve({ error: `Python script exited with code ${code}`, stderr: stderr.trim() });
                return;
            }

            logger.info(`[ML] Raw output length: ${stdout.trim().length} chars (${elapsed}ms)`);

            // Parse JSON from stdout (find first { ... } block)
            try {
                const jsonStart = stdout.indexOf("{");
                const jsonEnd = stdout.lastIndexOf("}");
                if (jsonStart === -1 || jsonEnd === -1) {
                    logger.warn("[ML] No JSON found in Python output");
                    resolve({ error: "No JSON output from ML model", raw: stdout });
                    return;
                }

                const parsed = JSON.parse(stdout.substring(jsonStart, jsonEnd + 1));
                logger.info(`[ML] ML Model Executed Successfully (${elapsed}ms). Success: ${parsed.success}`);
                resolve(parsed);
            } catch (err) {
                logger.error("[ML] JSON parse error:", err.message, "| Raw:", stdout.slice(0, 200));
                resolve({ error: "JSON parse error from ML output", raw: stdout });
            }
        });
    });
};


/**
 * Main Advisory Analysis Function
 * Called by routes/advisory.js
 *
 * @param {object} params
 * @param {string|null} params.imageUrl    - Cloudinary URL of uploaded crop image
 * @param {string|null} params.prompt      - User text prompt
 * @param {object|null} params.location    - { lat, lng }
 * @param {object|null} params.soilData    - Soil feature object
 * @param {string}      params.analysisMode - "crop" | "soil" | "general"
 */
const analyzeCrop = async ({ imageUrl, prompt, location, soilData, analysisMode }) => {
    const results = {
        scan: null,
        soil: null,
        weather: null,
        prompt: prompt || null,
        analysisMode: analysisMode || "crop",
        generatedAt: new Date().toISOString(),
        modelInfo: {
            engine: "GreenTrace Local ML (Python CNN + Soil Classifier)",
            externalAPI: false,
        }
    };

    fs.appendFileSync(DEBUG_LOG,
        `[${new Date().toISOString()}] [Service] Starting. imageUrl=${!!imageUrl}, soilData=${!!soilData}, location=${!!location}, mode=${analysisMode}\n`
    );

    // ── 1. Image Analysis (Crop Disease Detection) ──────────────────────
    if (imageUrl) {
        logger.info(`[Advisory] Image received: ${imageUrl}`);
        fs.appendFileSync(DEBUG_LOG, `[${new Date().toISOString()}] [Service] Image path: ${imageUrl}\n`);

        const mlResult = await runPythonScript([imageUrl, "--mode", "image"]);

        if (mlResult.success === true) {
            if (mlResult.status === "invalid_image") {
                // Non-agricultural image detected by confidence threshold
                results.scan = {
                    status: "invalid_image",
                    message: mlResult.message || "Non-agricultural image detected. Please upload a clear photo of a crop leaf, plant, or soil."
                };
            } else {
                results.scan = mlResult.data || mlResult;
            }
        } else {
            // ML returned error — pass structured error to frontend, never fake data
            results.scan = {
                status: "model_error",
                error: mlResult.error || "ML model returned an error",
                message: "The local ML model encountered an error. Please ensure TensorFlow and model files are present."
            };
        }

        fs.appendFileSync(DEBUG_LOG, `[${new Date().toISOString()}] [Service] Image scan done. Status: ${results.scan?.status || "ok"}\n`);
    }

    // ── 2. Soil Analysis ──────────────────────────────────────────────────
    if (soilData) {
        logger.info("[Advisory] Running soil ML inference...");
        fs.appendFileSync(DEBUG_LOG, `[${new Date().toISOString()}] [Service] Running soil analysis...\n`);

        const features = [
            soilData.N || 0, soilData.P || 0, soilData.K || 0,
            soilData.pH || 7, soilData.EC || 0, soilData.OC || 0,
            soilData.S || 0, soilData.Zn || 0, soilData.Fe || 0,
            soilData.Cu || 0, soilData.Mn || 0, soilData.B || 0
        ].join(",");

        const soilResult = await runPythonScript([features, "--mode", "soil"]);

        if (soilResult.success === true) {
            results.soil = soilResult.data || soilResult;
        } else {
            results.soil = {
                status: "model_error",
                error: soilResult.error || "Soil ML model returned an error"
            };
        }

        fs.appendFileSync(DEBUG_LOG, `[${new Date().toISOString()}] [Service] Soil analysis done.\n`);
    }

    // ── 3. Weather Data ───────────────────────────────────────────────────
    if (location && location.lat && location.lng) {
        logger.info(`[Advisory] Fetching weather for lat=${location.lat}, lng=${location.lng}`);
        fs.appendFileSync(DEBUG_LOG, `[${new Date().toISOString()}] [Service] Fetching weather...\n`);
        try {
            results.weather = await weatherService.getWeatherData(location.lat, location.lng);
        } catch (err) {
            logger.warn("[Advisory] Weather fetch failed:", err.message);
            results.weather = null;
        }
        fs.appendFileSync(DEBUG_LOG, `[${new Date().toISOString()}] [Service] Weather done.\n`);
    }

    fs.appendFileSync(DEBUG_LOG, `[${new Date().toISOString()}] [Service] All done. Returning results.\n`);
    logger.info("[Advisory] Analysis complete. Scan OK:", !!results.scan, "| Soil OK:", !!results.soil);

    return results;
};

module.exports = { analyzeCrop };
