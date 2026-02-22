/**
 * Mock data for dashboard pages.
 * Used when API is unavailable or to show rich demo data.
 * Farmer/Expert dashboards merge API data with this where backend has no endpoint.
 */

const last6Months = () => {
  const revenues = [82000, 95000, 88000, 102000, 115000, 124500]
  const months: Array<{ month: string; revenue: number }> = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    months.push({
      month: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
      revenue: revenues[5 - i] ?? 124500,
    })
  }
  return months
}

export const mockData = {
  farmerStats: {
    totalRevenue: 124500,
    totalOrders: 42,
    pendingOrders: 3,
    totalProducts: 10,
    activeProducts: 8,
    pendingProducts: 1,
    averageRating: 4.6,
    totalReviews: 28,
    revenueData: last6Months(),
    topProducts: [
      {
        _id: "mp1",
        name: "Organic Tomatoes",
        price: 80,
        unit: "kg",
        images: [],
        ratings: { average: 4.8, count: 24 },
        quantity: 120,
        status: "active",
      },
      {
        _id: "mp2",
        name: "Basmati Rice",
        price: 120,
        unit: "kg",
        images: [],
        ratings: { average: 4.5, count: 18 },
        quantity: 200,
        status: "active",
      },
      {
        _id: "mp3",
        name: "Fresh Potatoes",
        price: 35,
        unit: "kg",
        images: [],
        ratings: { average: 4.7, count: 31 },
        quantity: 150,
        status: "active",
      },
      {
        _id: "mp4",
        name: "Green Spinach",
        price: 40,
        unit: "bunch",
        images: [],
        ratings: { average: 4.4, count: 12 },
        quantity: 80,
        status: "active",
      },
    ] as Array<{
      _id: string
      name: string
      price: number
      unit?: string
      images?: string[]
      ratings?: { average?: number; count?: number }
      quantity?: number
      status?: string
    }>,
    inventoryAlerts: [
      { _id: "inv1", name: "Green Spinach", quantity: 8, unit: "bunch" },
      { _id: "inv2", name: "Coriander", quantity: 5, unit: "bunch" },
    ] as Array<{ _id: string; name: string; quantity: number; unit: string }>,
    recentOrders: [
      {
        _id: "mo1",
        status: "pending",
        total: 2400,
        totalAmount: 2400,
        orderNumber: "GT-1001",
        items: [],
        products: [{ product: { name: "Organic Tomatoes" } }],
        buyer: { name: { first: "Priya", last: "S." }, profile: { firstName: "Priya", lastName: "S." } },
        createdAt: new Date(Date.now() - 86400 * 1000).toISOString(),
      },
      {
        _id: "mo2",
        status: "pending",
        total: 1200,
        totalAmount: 1200,
        orderNumber: "GT-1002",
        items: [],
        products: [{ product: { name: "Basmati Rice" } }],
        buyer: { name: { first: "Rahul", last: "K." }, profile: { firstName: "Rahul", lastName: "K." } },
        createdAt: new Date(Date.now() - 172800 * 1000).toISOString(),
      },
      {
        _id: "mo3",
        status: "pending",
        total: 700,
        totalAmount: 700,
        orderNumber: "GT-1003",
        items: [],
        products: [{ product: { name: "Fresh Potatoes" } }],
        buyer: { name: { first: "Anita", last: "M." }, profile: { firstName: "Anita", lastName: "M." } },
        createdAt: new Date(Date.now() - 259200 * 1000).toISOString(),
      },
    ] as Array<{
      _id: string
      status: string
      total: number
      totalAmount?: number
      orderNumber?: string
      items?: unknown[]
      products?: Array<{ product?: { name?: string } }>
      buyer?: {
        name?: { first?: string; last?: string }
        profile?: { firstName?: string; lastName?: string }
      }
      createdAt?: string
    }>,
  },
  consumerStats: {
    recommendedProducts: [] as Array<{
      _id: string
      name: string
      price: number
      unit?: string
      images?: string[]
      ratings?: { average?: number; count?: number }
      farmer?: { farmerProfile?: { farmName?: string } }
    }>,
  },
  expertStats: {
    profileFields: {
      bio: true,
      specializations: true,
      experience: true,
      certifications: false,
      profilePhoto: true,
    } as Record<string, string | boolean>,
    totalAnswers: 48,
    weeklyAnswers: 12,
    answerStats: {
      thisWeek: 12,
      lastWeek: 8,
      avgUpvotesPerAnswer: 4,
      thisMonth: 32,
      acceptanceRate: 85,
      thisMonthAccepted: 28,
    },
    totalUpvotes: 192,
    averageRating: 4.7,
    acceptedAnswers: 41,
    articlesPublished: 5,
    articles: [
      { _id: "ea1", title: "Organic Pest Control for Tomato Crops", views: 1240, likes: 89, comments: 12, date: new Date(Date.now() - 86400 * 7 * 1000).toISOString() },
      { _id: "ea2", title: "Soil Health and Crop Rotation", views: 890, likes: 56, comments: 8, date: new Date(Date.now() - 86400 * 14 * 1000).toISOString() },
      { _id: "ea3", title: "Water-Saving Irrigation Techniques", views: 2100, likes: 134, comments: 19, date: new Date(Date.now() - 86400 * 21 * 1000).toISOString() },
    ] as Array<{
      _id: string
      title: string
      views: number
      likes: number
      comments: number
      date: string
    }>,
    rank: 4,
    totalExperts: 156,
    badges: ["Top Contributor", "Verified Expert", "Fast Responder"] as string[],
    expertiseAreas: [
      { name: "Organic Farming", questionsAnswered: 22, rating: 4.8 },
      { name: "Crop Diseases", questionsAnswered: 15, rating: 4.6 },
      { name: "Soil & Fertilizer", questionsAnswered: 11, rating: 4.7 },
    ] as Array<{
      name: string
      questionsAnswered: number
      rating: number
    }>,
    helpedFarmers: 89,
    pendingQuestions: 12,
    recentQuestions: [
      { _id: "q1", title: "Yellow spots on tomato leaves - what could it be?", urgency: "high", category: "Crop Diseases", views: 42, createdAt: new Date(Date.now() - 3600 * 1000).toISOString(), askedBy: { name: { first: "Raj", last: "Kumar" } } },
      { _id: "q2", title: "Best organic fertilizer for paddy in monsoon?", urgency: "medium", category: "Soil & Fertilizer", views: 28, createdAt: new Date(Date.now() - 7200 * 1000).toISOString(), askedBy: { name: { first: "Sita", last: "Devi" } } },
      { _id: "q3", title: "How to prevent aphids without chemicals?", urgency: "low", category: "Organic Farming", views: 15, createdAt: new Date(Date.now() - 14400 * 1000).toISOString(), askedBy: { name: { first: "Amit", last: "S." } } },
      { _id: "q4", title: "Drip irrigation spacing for vegetable garden", urgency: "medium", category: "Irrigation", views: 33, createdAt: new Date(Date.now() - 28800 * 1000).toISOString(), askedBy: { name: { first: "Lakshmi", last: "P." } } },
    ] as Array<{
      _id: string
      title: string
      urgency: string
      category: string
      views: number
      createdAt: string
      askedBy?: { name?: { first?: string; last?: string } }
    }>,
    recentActivity: [
      { type: "answer", title: "Answered: Yellow spots on tomato leaves", date: new Date(Date.now() - 3600 * 1000).toISOString(), upvotes: 8, views: 42 },
      { type: "accepted", title: "Your answer was accepted - Organic fertilizer for paddy", date: new Date(Date.now() - 7200 * 1000).toISOString(), upvotes: 5 },
      { type: "article", title: "Published: Water-Saving Irrigation Techniques", date: new Date(Date.now() - 86400 * 1000).toISOString(), views: 210 },
      { type: "answer", title: "Answered: Drip irrigation spacing", date: new Date(Date.now() - 14400 * 1000).toISOString(), upvotes: 3, views: 33 },
    ] as Array<{
      type: string
      title: string
      date: string
      upvotes?: number
      views?: number
    }>,
    responseRate: 94,
    avgResponseTime: "2.4 hrs",
  },

  /** Expert analytics: time-series for charts (last 6 months) */
  expertAnalytics: (() => {
    const months: Array<{ month: string }> = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      months.push({
        month: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
      })
    }
    return {
      answersData: months.map((m, i) => ({
        ...m,
        answers: [6, 8, 5, 10, 9, 12][i] ?? 8,
      })),
      articleViewsData: months.map((m, i) => ({
        ...m,
        views: [320, 480, 410, 620, 890, 1240][i] ?? 500,
      })),
      upvotesData: months.map((m, i) => ({
        ...m,
        upvotes: [18, 24, 22, 30, 38, 48][i] ?? 25,
      })),
    }
  })(),
}
