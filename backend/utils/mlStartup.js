/**
 * ML Startup Validation
 * Verifies Python runtime, TensorFlow availability, and .h5 model files at boot.
 * Runs a lightweight warm-up inference to pre-load TensorFlow into memory.
 * Never crashes the server — degrades to "ML unavailable" mode on failure.
 */

const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const logger = require('./logger')

const MODEL_DIR = path.join(__dirname, '../ml/models')
const SCRIPT = path.join(__dirname, '../ml/predict.py')

const REQUIRED_MODELS = [
    'crop_disease_model.h5',
    'soil_model.pkl',
    'class_indices.json',
    'disease_info.json',
]

/** Shared ML health status — updated at boot and re-checked by /health */
const mlStatus = {
    available: false,
    pythonOk: false,
    tensorflowOk: false,
    modelsOk: false,
    missingModels: [],
    warmupMs: null,
    error: null,
    checkedAt: null,
}

/**
 * Check Python is callable and TensorFlow can be imported.
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
function checkPythonAndTF() {
    return new Promise((resolve) => {
        // Quick one-liner: python -c "import tensorflow; print('ok')"
        const proc = spawn('python', ['-c', 'import tensorflow as tf; print("tf_ok"); print(tf.__version__)'], {
            timeout: 30000,
        })
        let out = ''
        let err = ''
        proc.stdout.on('data', (d) => { out += d.toString() })
        proc.stderr.on('data', (d) => { err += d.toString() })
        proc.on('error', (e) => resolve({ ok: false, error: `Python not found: ${e.message}` }))
        proc.on('close', (code) => {
            if (code === 0 && out.includes('tf_ok')) {
                const version = out.split('\n').find(l => /^\d/.test(l))?.trim() || 'unknown'
                resolve({ ok: true, tfVersion: version })
            } else {
                resolve({ ok: false, error: `TensorFlow import failed (exit ${code}): ${err.trim().slice(0, 200)}` })
            }
        })
    })
}

/**
 * Run a lightweight dry-run inference (--mode warmup) to pre-load TF weights.
 * @returns {Promise<{ok: boolean, ms?: number, error?: string}>}
 */
function runWarmup() {
    return new Promise((resolve) => {
        if (!fs.existsSync(SCRIPT)) {
            return resolve({ ok: false, error: 'predict.py not found' })
        }
        const t0 = Date.now()
        const proc = spawn('python', [SCRIPT, '--mode', 'warmup'], { timeout: 120000 })
        let out = ''
        let err = ''
        proc.stdout.on('data', (d) => { out += d.toString() })
        proc.stderr.on('data', (d) => { err += d.toString() })
        proc.on('error', (e) => resolve({ ok: false, error: e.message }))
        proc.on('close', (code) => {
            const ms = Date.now() - t0
            if (code === 0) {
                resolve({ ok: true, ms })
            } else {
                // Warmup failure is non-fatal — model may still work for real inference
                resolve({ ok: false, ms, error: `Warmup exit ${code}: ${err.trim().slice(0, 200)}` })
            }
        })
    })
}

/**
 * Full ML startup check. Updates mlStatus in-place.
 * Call this once after server starts (non-blocking — runs in background).
 */
async function validateMLStartup() {
    logger.info('[ML Startup] Beginning ML environment validation...')
    mlStatus.checkedAt = new Date().toISOString()

    // 1. Check model files exist
    const missing = REQUIRED_MODELS.filter(f => !fs.existsSync(path.join(MODEL_DIR, f)))
    mlStatus.missingModels = missing
    mlStatus.modelsOk = missing.length === 0

    if (!mlStatus.modelsOk) {
        logger.warn(`[ML Startup] Missing model files: ${missing.join(', ')}`)
    } else {
        logger.info('[ML Startup] ✓ All model files present.')
    }

    // 2. Check Python + TensorFlow
    const tfCheck = await checkPythonAndTF()
    mlStatus.pythonOk = tfCheck.ok
    mlStatus.tensorflowOk = tfCheck.ok

    if (!tfCheck.ok) {
        mlStatus.error = tfCheck.error
        logger.warn(`[ML Startup] Python/TF check failed — running in DEGRADED MODE: ${tfCheck.error}`)
        mlStatus.available = false
        return
    }
    logger.info(`[ML Startup] ✓ Python OK. TensorFlow version: ${tfCheck.tfVersion}`)

    // 3. Warm-up inference (only if models are present)
    if (mlStatus.modelsOk) {
        logger.info('[ML Startup] Running warm-up inference (this may take 30–60s first time)...')
        const warmup = await runWarmup()
        mlStatus.warmupMs = warmup.ms || null

        if (warmup.ok) {
            logger.info(`[ML Startup] ✓ Warm-up complete in ${warmup.ms}ms`)
            mlStatus.available = true
            mlStatus.error = null
        } else {
            logger.warn(`[ML Startup] Warm-up failed (non-fatal): ${warmup.error}`)
            // Still mark available — real inference may work
            mlStatus.available = true
            mlStatus.error = `Warmup warning: ${warmup.error}`
        }
    } else {
        mlStatus.available = false
        mlStatus.error = `Missing models: ${missing.join(', ')}`
    }

    logger.info(`[ML Startup] Final ML status: ${mlStatus.available ? 'AVAILABLE' : 'DEGRADED'}`)
}

module.exports = { validateMLStartup, mlStatus }
