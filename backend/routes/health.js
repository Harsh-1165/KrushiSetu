/**
 * Health Check Route — GET /api/v1/health
 * Returns DB status, ML model status, Agmarknet API last fetch, and cache status.
 * Safe to call from load balancers and monitoring tools (no auth required).
 */

const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const { mlStatus } = require('../utils/mlStartup')
const agmarknetService = require('../services/agmarknetService')

/**
 * @route   GET /api/v1/health
 * @desc    Platform health check — DB, ML, Govt API, Cache
 * @access  Public
 */
router.get('/', (req, res) => {
    // 1. Database status
    const dbState = mongoose.connection.readyState
    // readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
    const dbStateMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' }
    const dbStatus = {
        status: dbStateMap[dbState] || 'unknown',
        ok: dbState === 1,
        name: mongoose.connection.name || null,
    }

    // 2. ML model status (populated by validateMLStartup in background)
    const mlHealth = {
        available: mlStatus.available,
        pythonOk: mlStatus.pythonOk,
        tensorflowOk: mlStatus.tensorflowOk,
        modelsOk: mlStatus.modelsOk,
        missingModels: mlStatus.missingModels,
        warmupMs: mlStatus.warmupMs,
        error: mlStatus.error,
        checkedAt: mlStatus.checkedAt,
        mode: mlStatus.available ? 'full' : (mlStatus.checkedAt ? 'degraded' : 'pending'),
    }

    // 3. Agmarknet (Govt API) status
    const agmarknetStatus = {
        circuit: agmarknetService.circuitStatus(),
        lastFetch: agmarknetService.cacheStatus(),
    }

    // 4. Overall health
    const degraded = !dbStatus.ok
    const healthy = dbStatus.ok   // ML degraded mode is acceptable

    const status = healthy ? (mlHealth.available ? 'healthy' : 'degraded') : 'unhealthy'

    res.status(healthy ? 200 : 503).json({
        success: healthy,
        status,
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        environment: process.env.NODE_ENV || 'development',
        services: {
            database: dbStatus,
            ml: mlHealth,
            govtApi: agmarknetStatus,
        },
    })
})

module.exports = router
