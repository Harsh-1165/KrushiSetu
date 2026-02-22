/**
 * Agmarknet Service
 * Fetches and stores govt mandi price data from data.gov.in.
 *
 * Production hardening:
 *  - Circuit breaker (5 failures → 5 min cooldown)
 *  - Reduced timeout: 10s per attempt
 *  - 3 retries with 2s backoff
 *  - All logging via Winston logger (not console)
 *  - Cached "last good" response served when circuit is open
 */

const axios = require('axios')
const mongoose = require('mongoose')
const MandiPrice = require('../models/MandiPrice')
const Mandi = require('../models/Mandi')
const logger = require('../utils/logger')
const { CircuitBreaker } = require('../utils/circuitBreaker')

// Circuit breaker: 5 consecutive failures → open for 5 minutes
const agmarknetCB = new CircuitBreaker({
    name: 'agmarknet',
    threshold: 5,
    cooldownMs: 5 * 60 * 1000,
})

// Last-good cache — served when circuit is open
let lastGoodFetch = null   // { timestamp, records }

class AgmarknetService {
    constructor() {
        this.apiKey = process.env.AGMARKET_API_KEY
        this.baseUrl = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070'
    }

    /**
     * Fetch data from Agmarknet API (with circuit breaker + retry).
     * Falls back to lastGoodFetch cache when circuit is open.
     */
    async fetchData(params = {}) {
        if (!this.apiKey) {
            logger.warn('[Agmarknet] API Key missing — skipping live fetch')
            return lastGoodFetch?.records ?? []
        }

        const queryParams = new URLSearchParams({
            'api-key': this.apiKey,
            'format': 'json',
            'limit': params.limit || 1000,
            ...params,
        })

        let url = `${this.baseUrl}?${queryParams.toString()}`
        if (params.state) url += `&filters[state]=${encodeURIComponent(params.state)}`
        if (params.district) url += `&filters[district]=${encodeURIComponent(params.district)}`
        if (params.commodity) url += `&filters[commodity]=${encodeURIComponent(params.commodity)}`

        const MAX_RETRIES = 3
        let lastError

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                logger.info(`[Agmarknet] Attempt ${attempt}/${MAX_RETRIES}`)

                const response = await agmarknetCB.call(() =>
                    axios.get(url, {
                        timeout: 10000,   // 10s per spec
                        headers: {
                            'User-Agent': 'GreenTrace-Backend/1.0',
                            'Accept': 'application/json',
                        },
                    })
                )

                const records = response.data?.records ?? []
                if (records.length === 0) {
                    logger.warn('[Agmarknet] Response received but no records found')
                }

                // Update last-good cache on success
                lastGoodFetch = { timestamp: new Date().toISOString(), records }
                logger.info(`[Agmarknet] ✓ Fetched ${records.length} records`)
                return records

            } catch (err) {
                lastError = err

                if (err.isCircuitOpen) {
                    // Circuit is open — serve cache immediately, no more retries
                    if (lastGoodFetch) {
                        logger.warn(`[Agmarknet] Circuit OPEN — serving cached data from ${lastGoodFetch.timestamp}`)
                        return lastGoodFetch.records
                    }
                    logger.error('[Agmarknet] Circuit OPEN and no cache available — returning empty')
                    return []
                }

                logger.warn(`[Agmarknet] Attempt ${attempt} failed: ${err.message}`)
                if (attempt < MAX_RETRIES) {
                    await new Promise(r => setTimeout(r, 2000))
                }
            }
        }

        // All retries exhausted — serve cache if available
        if (lastGoodFetch) {
            logger.warn(`[Agmarknet] All retries failed — serving cached data from ${lastGoodFetch.timestamp}`)
            return lastGoodFetch.records
        }

        logger.error('[Agmarknet] All retries failed and no cache available')
        throw lastError
    }

    /**
     * Fetch and store prices into MongoDB.
     */
    async fetchAndStorePrices(limit = 2000) {
        logger.info('[Agmarknet] Starting price ingestion job...')
        try {
            const records = await this.fetchData({ limit })

            if (!records || records.length === 0) {
                logger.info('[Agmarknet] No data to process.')
                return { newCount: 0, updatedCount: 0 }
            }

            logger.info(`[Agmarknet] Processing ${records.length} records...`)
            let newCount = 0
            let updatedCount = 0

            for (const record of records) {
                try {
                    const [day, month, year] = record.arrival_date.split('/')
                    const priceDate = new Date(`${year}-${month}-${day}`)

                    let mandiDoc = await Mandi.findOne({
                        name: new RegExp(`^${record.market}$`, 'i'),
                        state: new RegExp(`^${record.state}$`, 'i'),
                        district: new RegExp(`^${record.district}$`, 'i'),
                    })

                    if (!mandiDoc) {
                        mandiDoc = await Mandi.create({
                            name: record.market,
                            state: record.state,
                            district: record.district,
                            location: { type: 'Point', coordinates: [0, 0] },
                            grade: record.grade || 'FAQ',
                        })
                    }

                    const priceData = {
                        state: record.state,
                        district: record.district,
                        mandi: mandiDoc._id,
                        crop: record.commodity,
                        variety: record.variety,
                        arrivalQuantity: parseFloat(record.arrival) || 0,
                        minPrice: parseFloat(record.min_price) || 0,
                        maxPrice: parseFloat(record.max_price) || 0,
                        modalPrice: parseFloat(record.modal_price) || 0,
                        priceDate,
                        grade: record.grade || 'FAQ',
                        source: 'agmarknet',
                    }

                    const filter = {
                        mandi: mandiDoc._id,
                        crop: priceData.crop,
                        variety: priceData.variety,
                        priceDate: {
                            $gte: new Date(new Date(priceDate).setHours(0, 0, 0, 0)),
                            $lt: new Date(new Date(priceDate).setHours(23, 59, 59, 999)),
                        },
                    }

                    const result = await MandiPrice.findOneAndUpdate(filter, priceData, {
                        upsert: true, new: true, setDefaultsOnInsert: true,
                    })

                    if (result.isNew) newCount++
                    else updatedCount++

                } catch (recordErr) {
                    logger.error(`[Agmarknet] Error processing record ${record.market} - ${record.commodity}: ${recordErr.message}`)
                }
            }

            logger.info(`[Agmarknet] Job complete. New: ${newCount}, Updated: ${updatedCount}`)
            return { newCount, updatedCount }

        } catch (error) {
            logger.error('[Agmarknet] Job failed:', error.message)
            throw error
        }
    }

    /** Expose circuit breaker status for /health */
    circuitStatus() {
        return agmarknetCB.status()
    }

    /** Expose last-good cache info for /health */
    cacheStatus() {
        return lastGoodFetch
            ? { available: true, timestamp: lastGoodFetch.timestamp, count: lastGoodFetch.records.length }
            : { available: false }
    }
}

module.exports = new AgmarknetService()
