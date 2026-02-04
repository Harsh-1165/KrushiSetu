// Advisory System API utilities

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"

// Types
export interface User {
  _id: string
  name: { first: string; last: string }
  avatar?: { url: string }
  role: "farmer" | "expert" | "consumer" | "admin"
  farmerProfile?: {
    farmLocation?: string
    crops?: string[]
  }
  expertProfile?: {
    specializations: string[]
    experience: number
    qualifications: Array<{ degree: string; institution: string; year: number }>
    rating: number
    totalAnswers: number
    isAvailable?: boolean
    isVerified?: boolean
  }
}

export interface Attachment {
  type: "image" | "video" | "document"
  url: string
  filename: string
  size: number
}

export interface Question {
  _id: string
  title: string
  description: string
  category: string
  subcategory?: string
  cropType?: string
  tags: string[]
  urgency: "low" | "medium" | "high" | "critical"
  status: "open" | "answered" | "resolved" | "closed"
  author: User
  assignedExpert?: User
  attachments: Attachment[]
  location?: {
    state: string
    district: string
    coordinates?: {
      type: string
      coordinates: number[]
    }
  }
  viewCount: number
  answerCount: number
  isEdited: boolean
  editedAt?: string
  resolvedAt?: string
  createdAt: string
  updatedAt: string
  timeSincePosted?: string
}

export interface Recommendation {
  type: "immediate_action" | "short_term" | "long_term" | "preventive" | "treatment" | "resource"
  description: string
  priority: "low" | "medium" | "high"
  estimatedCost?: string
  timeframe?: string
}

export interface Answer {
  _id: string
  question: string
  author: User
  content: string
  recommendations: Recommendation[]
  attachments: Attachment[]
  isAccepted: boolean
  acceptedAt?: string
  helpfulCount: number
  helpfulBy: string[]
  isVerified: boolean
  isEdited: boolean
  editedAt?: string
  createdAt: string
  updatedAt: string
}

export interface Comment {
  _id: string
  answer: string
  question: string
  author: User
  content: string
  parentComment?: string
  likeCount: number
  likedBy: string[]
  replyCount: number
  replies?: Comment[]
  isEdited: boolean
  editedAt?: string
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  subcategories: string[]
  icon: string
  questionCount: number
  openQuestionCount: number
}

export interface Expert {
  _id: string
  name: { first: string; last: string }
  avatar?: { url: string }
  expertProfile: {
    specializations: string[]
    qualifications: Array<{ degree: string; institution: string; year: number }>
    experience: number
    rating: number
    totalAnswers: number
    isAvailable?: boolean
    isVerified?: boolean
  }
  createdAt: string
}

export interface AdvisoryStats {
  questions: {
    total: number
    open: number
    answered: number
    resolved: number
    totalViews: number
    resolutionRate: number
  }
  answers: {
    total: number
    accepted: number
    totalHelpful: number
    acceptanceRate: number
  }
  experts: {
    total: number
  }
}

export interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
  hasNext?: boolean
  hasPrev?: boolean
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

export interface PaginatedResponse<T> {
  success: boolean
  data: {
    [key: string]: T[]
    pagination: Pagination
  }
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

// Fetch wrapper for multipart form data
async function fetchFormData(endpoint: string, formData: FormData) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    credentials: "include",
    body: formData,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "Request failed")
  }

  return data
}

// Question API
export const questionApi = {
  // Get all questions with filters
  getAll: async (params?: {
    page?: number
    limit?: number
    category?: string
    subcategory?: string
    status?: string
    urgency?: string
    cropType?: string
    search?: string
    hasAnswers?: string
    trending?: string
    sort?: string
  }): Promise<{ questions: Question[]; pagination: Pagination }> => {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          searchParams.append(key, String(value))
        }
      })
    }
    const query = searchParams.toString()
    const response = await fetchWithAuth(`/advisory/questions${query ? `?${query}` : ""}`)
    return response.data
  },

  // Get trending questions
  getTrending: async (limit = 10): Promise<{ questions: Question[] }> => {
    const response = await fetchWithAuth(`/advisory/questions/trending?limit=${limit}`)
    return response.data
  },

  // Get user's questions
  getMyQuestions: async (params?: {
    page?: number
    limit?: number
    status?: string
  }): Promise<{ questions: Question[]; pagination: Pagination }> => {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value))
        }
      })
    }
    const query = searchParams.toString()
    const response = await fetchWithAuth(`/advisory/questions/my${query ? `?${query}` : ""}`)
    return response.data
  },

  // Get single question
  getById: async (
    id: string
  ): Promise<{ question: Question & { answers?: Answer[] }; relatedQuestions: Question[] }> => {
    const response = await fetchWithAuth(`/advisory/questions/${id}`)
    return response.data
  },

  // Create question
  create: async (formData: FormData): Promise<{ question: Question }> => {
    const response = await fetchFormData("/advisory/questions", formData)
    return response.data
  },

  // Update question
  update: async (id: string, formData: FormData): Promise<{ question: Question }> => {
    const response = await fetch(`${API_BASE_URL}/advisory/questions/${id}`, {
      method: "PUT",
      credentials: "include",
      body: formData,
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || "Request failed")
    return data.data
  },

  // Delete question
  delete: async (id: string): Promise<void> => {
    await fetchWithAuth(`/advisory/questions/${id}`, { method: "DELETE" })
  },
}

// Answer API
export const answerApi = {
  // Get answers for a question
  getByQuestion: async (
    questionId: string,
    params?: { page?: number; limit?: number }
  ): Promise<{ answers: Answer[]; pagination: Pagination }> => {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value))
        }
      })
    }
    const query = searchParams.toString()
    const response = await fetchWithAuth(
      `/advisory/questions/${questionId}/answers${query ? `?${query}` : ""}`
    )
    return response.data
  },

  // Create answer
  create: async (questionId: string, formData: FormData): Promise<{ answer: Answer }> => {
    const response = await fetch(`${API_BASE_URL}/advisory/questions/${questionId}/answers`, {
      method: "POST",
      credentials: "include",
      body: formData,
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || "Request failed")
    return data.data
  },

  // Update answer
  update: async (id: string, formData: FormData): Promise<{ answer: Answer }> => {
    const response = await fetch(`${API_BASE_URL}/advisory/answers/${id}`, {
      method: "PUT",
      credentials: "include",
      body: formData,
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || "Request failed")
    return data.data
  },

  // Delete answer
  delete: async (id: string): Promise<void> => {
    await fetchWithAuth(`/advisory/answers/${id}`, { method: "DELETE" })
  },

  // Mark as helpful
  markHelpful: async (id: string): Promise<{ helpfulCount: number; isHelpful: boolean }> => {
    const response = await fetchWithAuth(`/advisory/answers/${id}/helpful`, { method: "POST" })
    return response.data
  },

  // Vote on answer
  vote: async (
    id: string,
    voteType: "helpful" | "not_helpful"
  ): Promise<{ helpfulCount: number; isHelpful: boolean }> => {
    const response = await fetchWithAuth(`/advisory/answers/${id}/vote`, {
      method: "POST",
      body: JSON.stringify({ voteType }),
    })
    return response.data
  },

  // Accept answer
  accept: async (id: string): Promise<{ answer: Answer }> => {
    const response = await fetchWithAuth(`/advisory/answers/${id}/accept`, { method: "POST" })
    return response.data
  },
}

// Comment API
export const commentApi = {
  // Get comments for an answer
  getByAnswer: async (
    answerId: string,
    params?: { page?: number; limit?: number }
  ): Promise<{ comments: Comment[]; pagination: Pagination }> => {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value))
        }
      })
    }
    const query = searchParams.toString()
    const response = await fetchWithAuth(
      `/advisory/answers/${answerId}/comments${query ? `?${query}` : ""}`
    )
    return response.data
  },

  // Get replies for a comment
  getReplies: async (
    commentId: string,
    params?: { page?: number; limit?: number }
  ): Promise<{ replies: Comment[]; pagination: Pagination }> => {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value))
        }
      })
    }
    const query = searchParams.toString()
    const response = await fetchWithAuth(
      `/advisory/comments/${commentId}/replies${query ? `?${query}` : ""}`
    )
    return response.data
  },

  // Create comment
  create: async (
    answerId: string,
    content: string,
    parentCommentId?: string
  ): Promise<{ comment: Comment }> => {
    const response = await fetchWithAuth(`/advisory/answers/${answerId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content, parentCommentId }),
    })
    return response.data
  },

  // Update comment
  update: async (id: string, content: string): Promise<{ comment: Comment }> => {
    const response = await fetchWithAuth(`/advisory/comments/${id}`, {
      method: "PUT",
      body: JSON.stringify({ content }),
    })
    return response.data
  },

  // Delete comment
  delete: async (id: string): Promise<void> => {
    await fetchWithAuth(`/advisory/comments/${id}`, { method: "DELETE" })
  },

  // Like comment
  like: async (id: string): Promise<{ likeCount: number; isLiked: boolean }> => {
    const response = await fetchWithAuth(`/advisory/comments/${id}/like`, { method: "POST" })
    return response.data
  },
}

// Expert API
export const expertApi = {
  // Get all experts
  getAll: async (params?: {
    page?: number
    limit?: number
    specialization?: string
    minExperience?: number
    available?: string
    minRating?: number
    sort?: string
  }): Promise<{ experts: Expert[]; pagination: Pagination }> => {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          searchParams.append(key, String(value))
        }
      })
    }
    const query = searchParams.toString()
    const response = await fetchWithAuth(`/advisory/experts${query ? `?${query}` : ""}`)
    return response.data
  },

  // Get single expert
  getById: async (
    id: string
  ): Promise<{
    expert: Expert
    recentAnswers: Array<Answer & { question: { title: string; category: string; status: string } }>
    categoryStats: Array<{ _id: string; count: number; accepted: number }>
  }> => {
    const response = await fetchWithAuth(`/advisory/experts/${id}`)
    return response.data
  },
}

// Category API
export const categoryApi = {
  // Get all categories
  getAll: async (): Promise<{ categories: Category[] }> => {
    const response = await fetchWithAuth("/advisory/categories")
    return response.data
  },
}

// Stats API
export const statsApi = {
  // Get advisory system stats
  getStats: async (): Promise<AdvisoryStats> => {
    const response = await fetchWithAuth("/advisory/stats")
    return response.data
  },
}

// Categories constant for client-side use
export const ADVISORY_CATEGORIES = {
  crop_diseases: {
    name: "Crop Diseases",
    subcategories: ["fungal", "bacterial", "viral", "pest_damage", "nutrient_deficiency"],
    icon: "Bug",
  },
  irrigation: {
    name: "Irrigation & Water Management",
    subcategories: [
      "drip_irrigation",
      "sprinkler",
      "flood_irrigation",
      "water_scheduling",
      "drought_management",
    ],
    icon: "Droplet",
  },
  soil_health: {
    name: "Soil Health",
    subcategories: ["soil_testing", "fertilization", "organic_matter", "ph_management", "erosion_control"],
    icon: "Layers",
  },
  crop_selection: {
    name: "Crop Selection",
    subcategories: [
      "seasonal_crops",
      "intercropping",
      "crop_rotation",
      "variety_selection",
      "climate_adaptation",
    ],
    icon: "Sprout",
  },
  pest_control: {
    name: "Pest Control",
    subcategories: ["insects", "rodents", "birds", "organic_methods", "integrated_pest_management"],
    icon: "Shield",
  },
  harvesting: {
    name: "Harvesting & Post-Harvest",
    subcategories: ["harvest_timing", "storage", "processing", "quality_control", "packaging"],
    icon: "Package",
  },
  organic_farming: {
    name: "Organic Farming",
    subcategories: ["certification", "composting", "natural_pesticides", "biofertilizers", "organic_seeds"],
    icon: "Leaf",
  },
  equipment: {
    name: "Farm Equipment",
    subcategories: ["tractors", "harvesters", "sprayers", "maintenance", "modern_tech"],
    icon: "Cog",
  },
  weather: {
    name: "Weather & Climate",
    subcategories: ["monsoon", "frost_protection", "heat_stress", "seasonal_planning", "climate_change"],
    icon: "Cloud",
  },
  market_advice: {
    name: "Market & Selling",
    subcategories: ["pricing", "mandi_selection", "contract_farming", "export", "value_addition"],
    icon: "TrendingUp",
  },
} as const

export type CategoryKey = keyof typeof ADVISORY_CATEGORIES

// Crop types for selection
export const CROP_TYPES = [
  "Rice",
  "Wheat",
  "Maize",
  "Sugarcane",
  "Cotton",
  "Soybean",
  "Groundnut",
  "Pulses",
  "Vegetables",
  "Fruits",
  "Spices",
  "Oilseeds",
  "Millets",
  "Tea",
  "Coffee",
  "Rubber",
  "Coconut",
  "Banana",
  "Mango",
  "Citrus",
  "Potato",
  "Onion",
  "Tomato",
  "Chilli",
  "Other",
] as const

// Indian states for location
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

// Helper function to format time ago
export function formatTimeAgo(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)

  if (months > 0) return `${months} month${months > 1 ? "s" : ""} ago`
  if (weeks > 0) return `${weeks} week${weeks > 1 ? "s" : ""} ago`
  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
  return "Just now"
}

// Helper to get user display name
export function getUserDisplayName(user: User): string {
  return `${user.name.first} ${user.name.last}`
}

// Helper to get urgency color
export function getUrgencyColor(urgency: string): string {
  switch (urgency) {
    case "critical":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
    case "high":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
    case "medium":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
    case "low":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
  }
}

// Helper to get status color
export function getStatusColor(status: string): string {
  switch (status) {
    case "open":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
    case "answered":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
    case "resolved":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
    case "closed":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
  }
}
