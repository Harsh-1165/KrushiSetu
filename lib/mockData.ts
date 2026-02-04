/**
 * Mock data for dashboard pages that don't have real API endpoints yet.
 * Used by: favorites, analytics, inventory, orders.
 */

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
    topProducts: [] as Array<{
      _id: string
      name: string
      price: number
      unit?: string
      images?: string[]
      ratings?: { average?: number; count?: number }
      quantity?: number
      status?: string
    }>,
    inventoryAlerts: [] as Array<{ _id: string; name: string; quantity: number; unit: string }>,
    recentOrders: [] as Array<{
      _id: string
      status: string
      total: number
      items?: unknown[]
      buyer?: { profile?: { firstName?: string; lastName?: string } }
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
    profileFields: {} as Record<string, string | boolean>,
    totalAnswers: 0,
    weeklyAnswers: 0,
    answerStats: {
      thisWeek: 0,
      lastWeek: 1,
      avgUpvotesPerAnswer: 0,
      thisMonth: 0,
      acceptanceRate: 0,
    },
    totalUpvotes: 0,
    averageRating: 0,
    acceptedAnswers: 0,
    articlesPublished: 0,
    articles: [] as Array<{ views: number; [key: string]: unknown }>,
    rank: 0,
    totalExperts: 0,
    badges: [] as Array<{ name: string; [key: string]: unknown }>,
    expertiseAreas: [] as string[],
    helpedFarmers: 0,
    pendingQuestions: 0,
    recentQuestions: [] as unknown[],
    recentActivity: [] as unknown[],
    responseRate: 0,
    avgResponseTime: "",
  },
}
