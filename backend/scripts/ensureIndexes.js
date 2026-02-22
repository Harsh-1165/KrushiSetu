/**
 * MongoDB Index Enforcement
 * Creates all required compound indexes for production performance.
 * Safe to call multiple times — MongoDB ignores duplicate index creation.
 *
 * Called from server.js immediately after DB connect.
 */

const logger = require('../utils/logger')

async function ensureIndexes() {
    try {
        // Lazy-require models (mongoose must already be connected)
        const mongoose = require('mongoose')
        const db = mongoose.connection.db
        if (!db) {
            logger.warn('[Indexes] DB not connected — skipping index creation')
            return
        }

        // -----------------------------------------------------------
        // Products
        // -----------------------------------------------------------
        const products = db.collection('products')
        await products.createIndex({ seller: 1, createdAt: -1 }, { background: true, name: 'idx_products_seller_created' })
        await products.createIndex({ category: 1, status: 1 }, { background: true, name: 'idx_products_cat_status' })
        await products.createIndex({ status: 1, createdAt: -1 }, { background: true, name: 'idx_products_status_created' })
        await products.createIndex({ 'location.state': 1, category: 1 }, { background: true, name: 'idx_products_state_cat' })
        await products.createIndex({ name: 'text', description: 'text' }, {
            background: true, name: 'idx_products_text',
            weights: { name: 10, description: 1 }
        })

        // -----------------------------------------------------------
        // Orders
        // -----------------------------------------------------------
        const orders = db.collection('orders')
        await orders.createIndex({ buyer: 1, createdAt: -1 }, { background: true, name: 'idx_orders_buyer_created' })
        await orders.createIndex({ sellers: 1, createdAt: -1 }, { background: true, name: 'idx_orders_sellers_created' })
        await orders.createIndex({ status: 1, createdAt: -1 }, { background: true, name: 'idx_orders_status_created' })
        await orders.createIndex({ orderNumber: 1 }, { background: true, name: 'idx_orders_number', unique: true, sparse: true })

        // -----------------------------------------------------------
        // MandiPrices
        // -----------------------------------------------------------
        const mandiPrices = db.collection('mandiprices')
        await mandiPrices.createIndex({ crop: 1, state: 1, priceDate: -1 }, { background: true, name: 'idx_mandi_crop_state_date' })
        await mandiPrices.createIndex({ mandi: 1, priceDate: -1 }, { background: true, name: 'idx_mandi_mandi_date' })
        await mandiPrices.createIndex({ state: 1, priceDate: -1 }, { background: true, name: 'idx_mandi_state_date' })
        await mandiPrices.createIndex({ crop: 1, variety: 1, priceDate: -1 }, { background: true, name: 'idx_mandi_crop_variety_date' })

        // -----------------------------------------------------------
        // Users (advisory queries)
        // -----------------------------------------------------------
        const users = db.collection('users')
        await users.createIndex({ role: 1, 'stats.rating': -1 }, { background: true, name: 'idx_users_role_rating' })
        await users.createIndex({ email: 1 }, { background: true, name: 'idx_users_email', unique: true, sparse: true })

        logger.info('[Indexes] ✓ All MongoDB indexes ensured successfully.')
    } catch (err) {
        // Never crash the server over index creation
        logger.error('[Indexes] Failed to ensure indexes:', err.message)
    }
}

module.exports = { ensureIndexes }
