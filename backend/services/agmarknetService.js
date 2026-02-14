const axios = require('axios');
const mongoose = require('mongoose');
const MandiPrice = require('../models/MandiPrice');
const Mandi = require('../models/Mandi');

/**
 * Service to interact with Agmarknet API and store data
 */
class AgmarknetService {
    constructor() {
        this.apiKey = process.env.AGMARKET_API_KEY;
        this.baseUrl = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
    }

    /**
     * Fetch data from Agmarknet API
     * @param {Object} params - Query parameters
     * @returns {Promise<Array>} - Array of records
     */
    async fetchData(params = {}) {
        try {
            if (!this.apiKey) {
                throw new Error('Agmarknet API Key missing');
            }

            // Default params
            const queryParams = new URLSearchParams({
                'api-key': this.apiKey,
                'format': 'json',
                'limit': params.limit || 1000,
                ...params
            });

            // Construct URL with filters
            let url = `${this.baseUrl}?${queryParams.toString()}`;

            if (params.state) url += `&filters[state]=${encodeURIComponent(params.state)}`;
            if (params.district) url += `&filters[district]=${encodeURIComponent(params.district)}`;
            if (params.commodity) url += `&filters[commodity]=${encodeURIComponent(params.commodity)}`;

            console.log(`[Agmarknet] Requesting URL: ${url}`);
            console.log(`[Agmarknet] Key Present: ${!!this.apiKey}`);

            const MAX_RETRIES = 3;
            let lastError;

            for (let i = 0; i < MAX_RETRIES; i++) {
                try {
                    console.log(`[Agmarknet] Attempt ${i + 1}/${MAX_RETRIES}...`);
                    const response = await axios.get(url, {
                        timeout: 60000, // 60s timeout
                        headers: {
                            'User-Agent': 'GreenTrace-Backend/1.0',
                            'Accept': 'application/json'
                        }
                    });

                    console.log(`[Agmarknet] Response received. Status: ${response.status}`);

                    if (!response.data || !response.data.records) {
                        console.warn('[Agmarknet] No records found in response');
                        return [];
                    }

                    return response.data.records;
                } catch (error) {
                    console.error(`[Agmarknet] Attempt ${i + 1} failed:`, error.message);
                    lastError = error;
                    // Wait 2 seconds before retry
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }

            throw lastError;

        } catch (error) {
            console.error('[Agmarknet] API Error Details:', {
                message: error.message,
                code: error.code,
                response: error.response ? {
                    status: error.response.status,
                    data: error.response.data
                } : 'No response'
            });
            throw error;
        }
    }

    /**
     * Fetch and store latest prices
     * @param {number} limit - Number of records to fetch
     */
    async fetchAndStorePrices(limit = 2000) {
        console.log('[Agmarknet Service] Starting price ingestion job...');
        try {
            const records = await this.fetchData({ limit });

            if (records.length === 0) {
                console.log('[Agmarknet Service] No data to process.');
                return;
            }

            console.log(`[Agmarknet Service] Processing ${records.length} records...`);
            let newCount = 0;
            let updatedCount = 0;

            for (const record of records) {
                try {
                    // Parse date (dd/mm/yyyy) to Date object
                    const [day, month, year] = record.arrival_date.split('/');
                    const priceDate = new Date(`${year}-${month}-${day}`);

                    // 1. Find or Create Mandi Reference
                    // We use a compound key of mandi + state + district to ensure uniqueness
                    // Use regex for case-insensitive matching
                    let mandiDoc = await Mandi.findOne({
                        name: new RegExp(`^${record.market}$`, 'i'),
                        state: new RegExp(`^${record.state}$`, 'i'),
                        district: new RegExp(`^${record.district}$`, 'i')
                    });

                    if (!mandiDoc) {
                        // Create new Mandi if not exists
                        // console.log(`[Agmarknet] Creating new Mandi: ${record.market}, ${record.state}`);
                        mandiDoc = await Mandi.create({
                            name: record.market,
                            state: record.state,
                            district: record.district,
                            location: {
                                type: "Point",
                                coordinates: [0, 0] // Default until geocoded
                            },
                            grade: record.grade || "FAQ"
                        });
                    }

                    const priceData = {
                        state: record.state,
                        district: record.district,
                        mandi: mandiDoc._id, // Use the MongoDB ObjectId
                        crop: record.commodity,
                        variety: record.variety,
                        arrivalQuantity: parseFloat(record.arrival) || 0,
                        minPrice: parseFloat(record.min_price) || 0,
                        maxPrice: parseFloat(record.max_price) || 0,
                        modalPrice: parseFloat(record.modal_price) || 0,
                        priceDate: priceDate,
                        grade: record.grade || 'FAQ',
                        source: 'agmarknet'
                    };

                    // Upsert logic
                    const filter = {
                        mandi: mandiDoc._id,
                        crop: priceData.crop,
                        variety: priceData.variety,
                        priceDate: {
                            $gte: new Date(priceDate.setHours(0, 0, 0, 0)),
                            $lt: new Date(priceDate.setHours(23, 59, 59, 999))
                        }
                    };

                    const result = await MandiPrice.findOneAndUpdate(
                        filter,
                        priceData,
                        { upsert: true, new: true, setDefaultsOnInsert: true }
                    );

                    if (result.isNew) newCount++;
                    else updatedCount++;
                } catch (recordError) {
                    console.error(`[Agmarknet] Error processing record ${record.market} - ${record.commodity}:`, recordError.message);
                }
            }

            console.log(`[Agmarknet Service] Job Complete. New: ${newCount}, Updated: ${updatedCount}`);
            return { newCount, updatedCount };

        } catch (error) {
            console.error('[Agmarknet Service] Job Failed:', error);
            throw error;
        }
    }
}

module.exports = new AgmarknetService();
