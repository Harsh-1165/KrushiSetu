/**
 * Environment Variable Validation
 * Validates all required env vars at startup — fails fast with a clear error
 * rather than letting the server start in a broken state.
 */

const logger = require('./logger')

const REQUIRED_ENV = [
    { key: 'MONGODB_URI', severity: 'critical', desc: 'MongoDB connection string' },
    { key: 'JWT_SECRET', severity: 'critical', desc: 'JWT signing secret' },
    { key: 'JWT_REFRESH_SECRET', severity: 'warning', desc: 'JWT refresh signing secret (falls back to JWT_SECRET if unset)' },
    { key: 'CLOUDINARY_CLOUD_NAME', severity: 'critical', desc: 'Cloudinary cloud name' },
    { key: 'CLOUDINARY_API_KEY', severity: 'critical', desc: 'Cloudinary API key' },
    { key: 'CLOUDINARY_API_SECRET', severity: 'critical', desc: 'Cloudinary API secret' },
    { key: 'FRONTEND_URL', severity: 'warning', desc: 'Frontend origin URL (CORS)' },
    { key: 'AGMARKET_API_KEY', severity: 'warning', desc: 'Agmarknet govt API key (mandi prices)' },
    { key: 'NODE_ENV', severity: 'info', desc: 'Node environment (development/production)' },
]

/**
 * Validates all required environment variables.
 * Raises a fatal error and exits if any CRITICAL variables are missing.
 * Logs warnings for non-critical missing variables.
 *
 * @returns {void}
 */
function validateEnv() {
    const missing = { critical: [], warning: [], info: [] }

    for (const { key, severity, desc } of REQUIRED_ENV) {
        const value = process.env[key]
        if (!value || value.trim() === '') {
            missing[severity].push({ key, desc })
        }
    }

    // Log all warnings / info
    for (const { key, desc } of missing.warning) {
        logger.warn(`[ENV] Missing optional variable: ${key} — ${desc}. Some features may be degraded.`)
    }
    for (const { key, desc } of missing.info) {
        logger.info(`[ENV] ${key} not set — ${desc}. Using default.`)
    }

    // Fail fast on critical missing vars
    if (missing.critical.length > 0) {
        const list = missing.critical.map(({ key, desc }) => `  • ${key}: ${desc}`).join('\n')
        logger.error(`[ENV] CRITICAL: Missing required environment variables:\n${list}`)
        logger.error('[ENV] Server cannot start without the above variables. Exiting.')
        process.exit(1)
    }

    // Extra validation: JWT_SECRET must be strong enough
    const jwtSecret = process.env.JWT_SECRET || ''
    if (jwtSecret.length < 32) {
        logger.error('[ENV] CRITICAL: JWT_SECRET must be at least 32 characters long. Exiting.')
        process.exit(1)
    }

    // Warn about insecure defaults
    if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
        logger.warn('[ENV] Running in production without FRONTEND_URL — CORS will be restricted to no origin')
    }

    logger.info('[ENV] ✓ All critical environment variables validated successfully.')
}

module.exports = { validateEnv }
