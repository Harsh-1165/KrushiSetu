/**
 * Analytics Route
 * Returns real aggregated analytics from MongoDB collections.
 * Falls back gracefully to a structured empty-but-labeled response when DB has no data yet.
 *
 * @route   GET /api/v1/analytics/summary
 * @access  Private
 */

const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")
const { protect } = require("../middleware/auth")
const { asyncHandler } = require("../utils/asyncHandler")

// Lazy-load models (they may not exist in all deployments)
let Order, Product

function getOrder() {
    if (!Order) Order = require("../models/Order")
    return Order
}

function getProduct() {
    try {
        if (!Product) Product = require("../models/Product")
        return Product
    } catch (e) {
        return null
    }
}

// Helper: build last-6-month bucket labels (e.g. "Feb '26")
function last6MonthLabels() {
    const months = []
    for (let i = 5; i >= 0; i--) {
        const d = new Date()
        d.setDate(1)
        d.setMonth(d.getMonth() - i)
        months.push({
            label: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
            year: d.getFullYear(),
            month: d.getMonth() + 1, // 1-indexed
        })
    }
    return months
}

/**
 * GET /api/v1/analytics/summary
 * Returns analytics metrics for the logged-in user based on their role.
 */
router.get(
    "/summary",
    protect,
    asyncHandler(async (req, res) => {
        const userId = req.user._id
        const role = req.user.role // "farmer" | "expert" | "consumer"
        const buckets = last6MonthLabels()
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
        sixMonthsAgo.setDate(1)
        sixMonthsAgo.setHours(0, 0, 0, 0)

        // ============ FARMER ANALYTICS ============
        if (role === "farmer") {
            const OrderModel = getOrder()

            // Monthly revenue & order count from Order collection
            // Farmer is stored in `sellers` array
            const revenueAgg = await OrderModel.aggregate([
                {
                    $match: {
                        sellers: new mongoose.Types.ObjectId(userId),
                        createdAt: { $gte: sixMonthsAgo },
                        status: { $nin: ["cancelled", "returned", "refunded"] },
                        isDeleted: { $ne: true },
                    },
                },
                {
                    $group: {
                        _id: {
                            year: { $year: "$createdAt" },
                            month: { $month: "$createdAt" },
                        },
                        revenue: { $sum: "$pricing.total" },
                        orders: { $sum: 1 },
                    },
                },
            ])

            // Map aggregation results onto month buckets
            const revenueMap = new Map(
                revenueAgg.map((r) => [`${r._id.year}-${r._id.month}`, r])
            )

            const revenueData = buckets.map((b) => {
                const entry = revenueMap.get(`${b.year}-${b.month}`)
                return {
                    month: b.label,
                    revenue: entry ? Math.round(entry.revenue) : 0,
                    orders: entry ? entry.orders : 0,
                }
            })

            // Totals
            const totalRevenue = revenueData.reduce((s, d) => s + d.revenue, 0)
            const totalOrders = revenueData.reduce((s, d) => s + d.orders, 0)

            // Active products count
            const ProductModel = getProduct()
            let activeProducts = 0
            let pendingProducts = 0
            if (ProductModel) {
                activeProducts = await ProductModel.countDocuments({ seller: userId, status: "active" }).catch(() => 0)
                pendingProducts = await ProductModel.countDocuments({ seller: userId, status: "pending" }).catch(() => 0)
            }

            // Pending orders
            const pendingOrders = await OrderModel.countDocuments({
                sellers: new mongoose.Types.ObjectId(userId),
                status: "pending",
                isDeleted: { $ne: true },
            }).catch(() => 0)

            const hasRealData = totalRevenue > 0 || totalOrders > 0

            return res.json({
                success: true,
                role: "farmer",
                isDemo: !hasRealData,
                stats: {
                    totalRevenue,
                    totalOrders,
                    pendingOrders,
                    activeProducts,
                    pendingProducts,
                },
                charts: {
                    revenueData,
                },
            })
        }

        // ============ EXPERT ANALYTICS ============
        if (role === "expert") {
            // Try to fetch from Q&A / articles collections if they exist
            let answersData = buckets.map((b) => ({ month: b.label, answers: 0 }))
            let articleViewsData = buckets.map((b) => ({ month: b.label, views: 0 }))
            let upvotesData = buckets.map((b) => ({ month: b.label, upvotes: 0 }))
            let hasRealData = false

            try {
                // Try to load Question / Answer model dynamically
                const Question = mongoose.modelNames().includes("Question")
                    ? mongoose.model("Question")
                    : null

                if (Question) {
                    const expertAnswers = await Question.aggregate([
                        {
                            $unwind: "$answers",
                        },
                        {
                            $match: {
                                "answers.author": new mongoose.Types.ObjectId(userId),
                                "answers.createdAt": { $gte: sixMonthsAgo },
                            },
                        },
                        {
                            $group: {
                                _id: {
                                    year: { $year: "$answers.createdAt" },
                                    month: { $month: "$answers.createdAt" },
                                },
                                answers: { $sum: 1 },
                                upvotes: { $sum: { $size: { $ifNull: ["$answers.upvotes", []] } } },
                            },
                        },
                    ])

                    if (expertAnswers.length > 0) {
                        hasRealData = true
                        const ansMap = new Map(expertAnswers.map((r) => [`${r._id.year}-${r._id.month}`, r]))
                        answersData = buckets.map((b) => ({
                            month: b.label,
                            answers: ansMap.get(`${b.year}-${b.month}`)?.answers || 0,
                        }))
                        upvotesData = buckets.map((b) => ({
                            month: b.label,
                            upvotes: ansMap.get(`${b.year}-${b.month}`)?.upvotes || 0,
                        }))
                    }
                }

                // Article views
                const Article = mongoose.modelNames().includes("Article")
                    ? mongoose.model("Article")
                    : null

                if (Article) {
                    const articleAgg = await Article.aggregate([
                        { $match: { author: new mongoose.Types.ObjectId(userId), createdAt: { $gte: sixMonthsAgo } } },
                        {
                            $group: {
                                _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
                                views: { $sum: { $ifNull: ["$viewCount", 0] } },
                            },
                        },
                    ])

                    if (articleAgg.length > 0) {
                        hasRealData = true
                        const artMap = new Map(articleAgg.map((r) => [`${r._id.year}-${r._id.month}`, r]))
                        articleViewsData = buckets.map((b) => ({
                            month: b.label,
                            views: artMap.get(`${b.year}-${b.month}`)?.views || 0,
                        }))
                    }
                }
            } catch (err) {
                // Collections don't exist yet — return empty-but-shaped data
                console.warn("[Analytics] Expert model lookup failed:", err.message)
            }

            return res.json({
                success: true,
                role: "expert",
                isDemo: !hasRealData,
                charts: {
                    answersData,
                    articleViewsData,
                    upvotesData,
                },
            })
        }

        // ============ CONSUMER / OTHER ============
        return res.json({
            success: true,
            role: role || "consumer",
            isDemo: true,
            charts: {},
        })
    })
)

module.exports = router
