// Market Prices API utilities

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"

// Types
export interface Mandi {
  _id: string
  name: string
  code?: string
  type: "APMC" | "Private" | "Cooperative" | "Farmers Market" | "Wholesale"
  state: string
  district: string
  taluka?: string
  address?: {
    street?: string
    city?: string
    pincode?: string
  }
  location: {
    type: "Point"
    coordinates: [number, number] // [longitude, latitude]
  }
  contactInfo?: {
    phone?: string[]
    email?: string
    website?: string
    secretary?: {
      name?: string
      phone?: string
      email?: string
    }
  }
  operatingDays: string[]
  operatingHours: {
    open: string
    close: string
  }
  auctionTimings?: Array<{
    commodity: string
    startTime: string
    endTime: string
  }>
  commodities?: Array<{
    name: string
    varieties: string[]
    isMain: boolean
  }>
  mainCommodities: string[]
  facilities: {
    coldStorage: boolean
    warehouse: boolean
    parking: boolean
    weighbridge: boolean
    restrooms: boolean
    bankingFacility: boolean
    eNAMEnabled: boolean
    grading: boolean
    assaying: boolean
  }
  capacity?: {
    dailyArrival?: number
    storageCapacity?: number
    shopCount?: number
    traderCount?: number
  }
  fees?: {
    marketFee: number
    commissionRate: number
    weighingCharges: number
    loadingCharges: number
  }
  isActive: boolean
  isVerified: boolean
  images?: Array<{
    url: string
    caption?: string
    isPrimary: boolean
  }>
  ratings?: {
    average: number
    count: number
  }
  todayPriceCount?: number
  distance?: number // Added when querying nearby
  createdAt: string
  updatedAt: string
}

export interface MandiPrice {
  _id: string
  crop: string
  variety: string
  grade?: string
  mandi: Mandi | string
  state: string
  district: string
  minPrice: number
  maxPrice: number
  modalPrice: number
  mspPrice?: number
  mspComparison?: {
    difference: number
    percentage: number
    status: "above_msp" | "below_msp" | "at_msp" | "no_msp"
  }
  arrivalQuantity: number
  arrivalUnit: "quintal" | "ton" | "kg"
  priceChange24h: number
  priceChange7d: number
  priceChange30d: number
  previousPrice?: number
  priceDate: string
  source?: string
  isActive: boolean
  trendIndicator?: "up" | "down" | "stable"
  createdAt: string
  updatedAt: string
}

export interface PriceAlert {
  _id: string
  user: string
  crop: string
  variety?: string
  mandi?: Mandi | string
  state?: string
  condition: "above" | "below" | "equals"
  targetPrice: number
  priceType: "modal" | "min" | "max"
  notifyVia: Array<"email" | "sms" | "push">
  frequency: "once" | "daily" | "always"
  isActive: boolean
  expiresAt: string
  triggeredAt?: string
  triggeredPrice?: number
  triggerCount: number
  lastNotifiedAt?: string
  notes?: string
  currentPrice?: MandiPrice
  distanceFromTarget?: number
  createdAt: string
  updatedAt: string
}

export interface PriceTrend {
  date: string
  avgMinPrice: number
  avgMaxPrice: number
  avgModalPrice: number
  totalArrival: number
  priceCount: number
  highestPrice: number
  lowestPrice: number
}

export interface PricePrediction {
  date: string
  predictedPrice: number
  lowerBound: number
  upperBound: number
  confidence: number
}

export interface PriceStats {
  avgMinPrice: number
  avgMaxPrice: number
  avgModalPrice: number
  minPrice: number
  maxPrice: number
  totalArrival: number
  priceCount: number
  marketCount: number
  priceChange?: number
  trend?: "up" | "down" | "stable"
}

export interface StateMandiInfo {
  state: string
  mandiCount: number
  districtCount: number
}

export interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
  hasMore?: boolean
}

// Generic fetch wrapper with auth
async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "Request failed")
  }

  return data
}

// Price API
export const priceApi = {
  // Get current prices with filters
  getAll: async (params?: {
    crop?: string
    variety?: string
    mandi?: string
    state?: string
    district?: string
    minPrice?: number
    maxPrice?: number
    date?: string
    lat?: number
    lng?: number
    radius?: number
    page?: number
    limit?: number
    sortBy?: "price" | "arrival" | "date" | "crop"
    sortOrder?: "asc" | "desc"
  }): Promise<{ data: MandiPrice[]; pagination: Pagination }> => {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          searchParams.append(key, String(value))
        }
      })
    }
    const query = searchParams.toString()
    const response = await fetchWithAuth(`/mandi/prices${query ? `?${query}` : ""}`)
    return response
  },

  // Get single price details with history
  getById: async (
    id: string
  ): Promise<{
    data: MandiPrice & {
      historicalPrices: MandiPrice[]
      statistics: PriceStats
    }
  }> => {
    const response = await fetchWithAuth(`/mandi/prices/${id}`)
    return response
  },

  // Get price trends
  getTrends: async (params: {
    crop: string
    variety?: string
    mandi?: string
    state?: string
    period?: "7d" | "30d" | "90d" | "365d"
  }): Promise<{
    success: boolean
    averagePrice: number
    priceChange: number
    trend: string
    priceRange: { min: number; max: number }
    totalArrival: number
    aiInsight: { summary: string; advice: string; confidence: number }
    data: Array<{
      date: string
      min: number
      max: number
      modal: number
      arrival: number
    }>
  }> => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        searchParams.append(key, String(value))
      }
    })
    const response = await fetchWithAuth(`/mandi/trends?${searchParams.toString()}`)
    return response
  },


  // Get real-time prices from Agmarknet
  getRealTimePrices: async (params: {
    state?: string
    district?: string
    commodity?: string
    limit?: number
  }): Promise<{
    success: boolean
    source: string
    count: number
    data: Array<MandiPrice>
  }> => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        searchParams.append(key, String(value))
      }
    })
    const response = await fetchWithAuth(`/mandi/real-time?${searchParams.toString()}`)
    return response
  },

  // Get price predictions
  getPredictions: async (params: {
    crop: string
    variety?: string
    mandi?: string
    state?: string
    days?: number
  }): Promise<{
    data: {
      crop: string
      variety: string
      location: string
      predictionDays: number
      predictions: PricePrediction[]
      history?: MandiPrice[] // Added history field
      confidence: {
        level: "high" | "medium" | "low"
        score: number
        factors: string[]
      }
      methodology: string
      disclaimer: string
      generatedAt: string
    }
  }> => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        searchParams.append(key, String(value))
      }
    })
    const response = await fetchWithAuth(`/mandi/predictions?${searchParams.toString()}`)
    return response
  },

  // Real-Time Comparison
  compare: async (params: {
    commodity: string
    states?: string
    period?: "today" | "7d" | "30d"
  }): Promise<{
    success: boolean
    message?: string
    data: {
      crop: string
      variety: string
      period: string
      dateRange: {
        startDate: string
        endDate: string
      }
      comparison: Array<{
        mandi: string
        state: string
        district: string
        avgMinPrice: number
        avgMaxPrice: number
        avgModalPrice: number
        totalArrival: number
        priceCount: number
        latestDate: string
      }>
      statistics: any
      recommendation: any
    }
  }> => {
    const searchParams = new URLSearchParams()
    if (params.commodity) searchParams.append("commodity", params.commodity)
    if (params.states) searchParams.append("states", params.states)
    if (params.period) searchParams.append("period", params.period)

    const url = `/mandi/compare?${searchParams.toString()}`
    console.log("[DEBUG] Fetching Compare URL:", url)
    const response = await fetchWithAuth(url)
    return response
  },

  // Export prices as CSV
  exportCSV: async (params: {
    crop?: string
    state?: string
    startDate?: string
    endDate?: string
  }): Promise<Blob> => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        searchParams.append(key, String(value))
      }
    })
    const response = await fetch(`${API_BASE_URL}/mandi/export?${searchParams.toString()}`, {
      credentials: "include",
    })
    return response.blob()
  },
}

// Mandi (Market) API
export const mandiApi = {
  // Get all mandis
  getAll: async (params?: {
    state?: string
    district?: string
    search?: string
    lat?: number
    lng?: number
    radius?: number
    page?: number
    limit?: number
  }): Promise<{ data: Mandi[]; pagination: Pagination }> => {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          searchParams.append(key, String(value))
        }
      })
    }
    const query = searchParams.toString()
    const response = await fetchWithAuth(`/mandi/markets${query ? `?${query}` : ""}`)
    return response
  },

  // Get single mandi details
  getById: async (
    id: string
  ): Promise<{
    data: Mandi & {
      todayPrices: MandiPrice[]
      topCommodities: Array<{
        _id: string
        totalArrival: number
        avgPrice: number
        priceCount: number
      }>
      statistics: {
        todayPriceCount: number
        totalCommodities: number
      }
    }
  }> => {
    const response = await fetchWithAuth(`/mandi/markets/${id}`)
    return response
  },

  // Get states with mandi counts
  getStates: async (): Promise<{ data: StateMandiInfo[] }> => {
    const response = await fetchWithAuth("/mandi/markets/states")
    return response
  },

  // Find nearby mandis
  findNearby: async (
    lat: number,
    lng: number,
    radius?: number
  ): Promise<{ data: Mandi[] }> => {
    const response = await fetchWithAuth(
      `/mandi/markets?lat=${lat}&lng=${lng}&radius=${radius || 100}`
    )
    return response
  },
}

// Price Alert API
export const alertApi = {
  // Create alert
  create: async (data: {
    crop: string
    variety?: string
    mandi?: string
    state?: string
    condition: "above" | "below" | "equals"
    targetPrice: number
    priceType?: "modal" | "min" | "max"
    notifyVia?: Array<"email" | "sms" | "push">
    expiresAt?: string
    notes?: string
  }): Promise<{ data: PriceAlert }> => {
    const response = await fetchWithAuth("/mandi/alerts", {
      method: "POST",
      body: JSON.stringify(data),
    })
    return response
  },

  // Get user alerts
  getAll: async (params?: {
    status?: "all" | "active" | "triggered" | "expired"
  }): Promise<{ data: PriceAlert[]; count: number }> => {
    const searchParams = new URLSearchParams()
    if (params?.status) {
      searchParams.append("status", params.status)
    }
    const query = searchParams.toString()
    const response = await fetchWithAuth(`/mandi/alerts${query ? `?${query}` : ""}`)
    return response
  },

  // Update alert
  update: async (
    id: string,
    data: Partial<{
      targetPrice: number
      condition: "above" | "below" | "equals"
      priceType: "modal" | "min" | "max"
      notifyVia: Array<"email" | "sms" | "push">
      expiresAt: string
      isActive: boolean
      notes: string
    }>
  ): Promise<{ data: PriceAlert }> => {
    const response = await fetchWithAuth(`/mandi/alerts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
    return response
  },

  // Delete alert
  delete: async (id: string): Promise<void> => {
    await fetchWithAuth(`/mandi/alerts/${id}`, { method: "DELETE" })
  },

  // Get alert history
  getHistory: async (
    id: string
  ): Promise<{
    data: {
      alert: PriceAlert
      triggers: Array<{
        triggeredAt: string
        price: number
        mandi: string
      }>
    }
  }> => {
    const response = await fetchWithAuth(`/mandi/alerts/${id}/history`)
    return response
  },
}

// Common crops for selection
export const COMMON_CROPS = [
  "Rice",
  "Wheat",
  "Maize",
  "Bajra",
  "Jowar",
  "Ragi",
  "Barley",
  "Sugarcane",
  "Cotton",
  "Jute",
  "Groundnut",
  "Soybean",
  "Sunflower",
  "Mustard",
  "Sesame",
  "Safflower",
  "Linseed",
  "Castor",
  "Coconut",
  "Gram",
  "Tur/Arhar",
  "Moong",
  "Urad",
  "Masoor",
  "Peas",
  "Potato",
  "Onion",
  "Tomato",
  "Brinjal",
  "Cabbage",
  "Cauliflower",
  "Lady Finger",
  "Cucumber",
  "Carrot",
  "Radish",
  "Bitter Gourd",
  "Bottle Gourd",
  "Pumpkin",
  "Spinach",
  "Coriander",
  "Mango",
  "Banana",
  "Apple",
  "Orange",
  "Grapes",
  "Papaya",
  "Guava",
  "Pomegranate",
  "Watermelon",
  "Chilli",
  "Turmeric",
  "Ginger",
  "Garlic",
  "Cumin",
  "Coriander Seeds",
  "Fenugreek",
  "Black Pepper",
  "Cardamom",
  "Cloves",
  "Tea",
  "Coffee",
  "Rubber",
  "Arecanut",
  "Cashewnut",
] as const

// Indian states
export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const

// Helper functions
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

export function formatPricePerQuintal(price: number): string {
  return `${formatPrice(price)}/q`
}

export function formatQuantity(quantity: number, unit: string = "quintal"): string {
  if (quantity >= 1000) {
    return `${(quantity / 1000).toFixed(1)}K ${unit}s`
  }
  return `${quantity.toFixed(0)} ${unit}s`
}

export function getPriceChangeColor(change: number): string {
  if (change > 0) return "text-green-600 dark:text-green-400"
  if (change < 0) return "text-red-600 dark:text-red-400"
  return "text-muted-foreground"
}

export function getPriceChangeBgColor(change: number): string {
  if (change > 0) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
  if (change < 0) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
  return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
}

export function getTrendIndicator(change: number): "up" | "down" | "stable" {
  if (change > 0.5) return "up"
  if (change < -0.5) return "down"
  return "stable"
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatTimeAgo(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return "Just now"
}

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function getConditionLabel(condition: "above" | "below" | "equals"): string {
  switch (condition) {
    case "above":
      return "goes above"
    case "below":
      return "goes below"
    case "equals":
      return "reaches"
  }
}

export function getPriceTypeLabel(priceType: "modal" | "min" | "max"): string {
  switch (priceType) {
    case "modal":
      return "Modal Price"
    case "min":
      return "Minimum Price"
    case "max":
      return "Maximum Price"
  }
}
