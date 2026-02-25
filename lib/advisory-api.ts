import { fetchWithAuth } from "@/lib/api"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"

// ============================================
// TYPES
// ============================================

export interface User {
  _id: string
  name: {
    first: string
    last: string
  }
  avatar?: {
    url: string
  }
  role: string
  expertProfile?: {
    specializations?: string[]
    experience?: number
  }
}

export interface Question {
  _id: string
  title: string
  description: string
  category: string
  subcategory?: string
  cropType?: string
  images?: string[]
  tags: string[]
  urgency: "low" | "medium" | "high" | "critical"
  status: "open" | "answered" | "resolved" | "closed"
  author: User
  assignedExpert?: User
  answers?: Answer[]
  answerCount: number
  viewCount: number
  upvotes: number
  isResolved: boolean
  isDeleted?: boolean
  isEdited?: boolean
  location?: {
    state?: string
    district?: string
  }
  attachments?: Array<{
    url: string
    filename: string
    type: "image" | "video" | "document"
  }>
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  description: string
  questionCount: number
}

export interface AdvisoryStats {
  questions: {
    total: number
    open: number
    resolved: number
    resolutionRate: number
  }
}

// ============================================
// CONSTANTS
// ============================================

export const ADVISORY_CATEGORIES: Record<string, { name: string; description: string; subcategories?: string[] }> = {
  crop_diseases: { name: "Crop Diseases", description: "Identify and treat crop diseases", subcategories: ["fungal", "bacterial", "viral", "nutrient_deficiency"] },
  pest_control: { name: "Pest Control", description: "Pest management strategies", subcategories: ["insects", "rodents", "birds", "nematodes"] },
  soil_health: { name: "Soil Health", description: "Soil fertility and management", subcategories: ["ph_management", "composting", "soil_testing", "micronutrients"] },
  irrigation: { name: "Irrigation", description: "Water management techniques", subcategories: ["drip_irrigation", "sprinkler", "flood", "water_conservation"] },
  crop_selection: { name: "Crop Selection", description: "Choosing the right crops", subcategories: ["seasonal", "climate_based", "soil_based", "market_demand"] },
  organic_farming: { name: "Organic Farming", description: "Organic cultivation methods", subcategories: ["biofertilizers", "biopesticides", "composting", "certification"] },
  harvesting: { name: "Harvesting", description: "Harvesting and post-harvest handling", subcategories: ["timing", "storage", "processing", "transport"] },
  market_advice: { name: "Market Advice", description: "Pricing and selling strategies", subcategories: ["pricing", "mandi", "export", "contract_farming"] },
  weather: { name: "Weather", description: "Weather-related concerns", subcategories: ["drought", "flood", "frost", "heat_stress"] },
  equipment: { name: "Farm Equipment", description: "Machinery and tools", subcategories: ["tractors", "harvesters", "tillers", "pumps"] },
}

export const CROP_TYPES = [
  "Wheat",
  "Rice",
  "Corn",
  "Cotton",
  "Sugarcane",
  "Soybean",
  "Tomato",
  "Potato",
  "Onion",
  "Pulses",
  "Fruits",
  "Vegetables",
  "Other",
]

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
] as const

export type CategoryKey = keyof typeof ADVISORY_CATEGORIES

// ============================================
// HELPER FUNCTIONS
// ============================================

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

export function getUserDisplayName(user: User): string {
  if (!user || !user.name) return "Anonymous"
  return `${user.name.first} ${user.name.last}`
}

export function getUrgencyColor(urgency: string): string {
  switch (urgency) {
    case "critical":
      return "text-red-600 bg-red-100 border-red-200"
    case "high":
      return "text-orange-600 bg-orange-100 border-orange-200"
    case "medium":
      return "text-yellow-600 bg-yellow-100 border-yellow-200"
    case "low":
    default:
      return "text-green-600 bg-green-100 border-green-200"
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "resolved":
      return "bg-green-100 text-green-700 border-green-200"
    case "closed":
      return "bg-gray-100 text-gray-700 border-gray-200"
    case "answered":
      return "bg-blue-100 text-blue-700 border-blue-200"
    case "open":
    default:
      return "bg-yellow-100 text-yellow-700 border-yellow-200"
  }
}

// ============================================
// API CLIENTS
// ============================================

export const questionApi = {
  getAll: async (params: Record<string, string> = {}) => {
    const searchParams = new URLSearchParams(params)
    const response = await fetchWithAuth(`${API_BASE_URL}/advisory/questions?${searchParams.toString()}`)
    if (!response.ok) throw new Error("Failed to fetch questions")
    return response.json()
  },

  getById: async (id: string) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/advisory/questions/${id}`)
    if (!response.ok) throw new Error("Failed to fetch question")
    return response.json()
  },

  create: async (data: any) => {
    // Check if data is FormData (for file uploads) or regular object (for JSON)
    const isFormData = data instanceof FormData;

    const response = await fetchWithAuth(`${API_BASE_URL}/advisory/questions`, {
      method: "POST",
      headers: isFormData ? {} : {
        "Content-Type": "application/json",
      },
      body: isFormData ? data : JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || "Failed to create question")
    }

    return response.json()
  },

  getTrending: async (limit: number = 5) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/advisory/questions/trending?limit=${limit}`)
    if (!response.ok) throw new Error("Failed to fetch trending questions")
    return response.json()
  },

  getMyQuestions: async (params: { page?: number; limit?: number; status?: string } = {}) => {
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.set("page", String(params.page))
    if (params.limit) searchParams.set("limit", String(params.limit))
    if (params.status) searchParams.set("status", params.status)
    const response = await fetchWithAuth(`${API_BASE_URL}/advisory/questions/my?${searchParams.toString()}`)
    if (!response.ok) throw new Error("Failed to fetch my questions")
    return response.json()
  },

  delete: async (id: string) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/advisory/questions/${id}`, {
      method: "DELETE",
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || "Failed to delete question")
    }
    return response.json()
  },
}

export const categoryApi = {
  getAll: async () => {
    // This might be a static list or an endpoint
    // using mock data structure for now based on page.tsx expectation
    // If backend doesn't have this, we return static list wrapped in structure
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/advisory/categories`)
      if (response.ok) return response.json()
    } catch (e) {
      // Fallback if endpoint doesn't exist
    }

    return {
      categories: Object.entries(ADVISORY_CATEGORIES).map(([id, data]) => ({
        id,
        name: data.name,
        description: data.description,
        questionCount: 0 // Mock count
      }))
    }
  }
}

export const statsApi = {
  getStats: async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/advisory/stats`)
      if (response.ok) return response.json()
    } catch (e) {
      // Fallback
    }

    return {
      questions: {
        total: 0,
        open: 0,
        resolved: 0,
        resolutionRate: 0
      }
    }
  }
}

// Kept from original file
export async function analyzeAdvisory(data: FormData) {
  const token = localStorage.getItem("greentrace_access_token")
  const headers: HeadersInit = {}
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}/advisory/analyze`, {
    method: 'POST',
    body: data,
    headers: headers
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to analyze crop.")
  }

  return response.json()
}

// ============================================
// MISSING TYPES (used by question detail page)
// ============================================

export interface Answer {
  _id: string
  content: string
  author: User & {
    expertProfile?: {
      specializations?: string[]
      experience?: number
    }
  }
  isAccepted: boolean
  isVerified: boolean
  isEdited: boolean
  helpfulCount: number
  needsMoreGuidance: boolean
  question?: Question & {
    _id: string
    title: string
    viewCount: number
  }
  attachments?: Array<{
    url: string
    filename: string
    type: "image" | "video" | "document"
    size: number
  }>
  recommendations?: Array<{
    type: string
    description: string
    priority: "low" | "medium" | "high"
    estimatedCost?: string
    timeframe?: string
  }>
  createdAt: string
  updatedAt: string
}

export interface Comment {
  _id: string
  content: string
  author: User
  likeCount: number
  replyCount: number
  isEdited?: boolean
  replies?: Comment[]
  createdAt: string
  updatedAt: string
}

// ============================================
// ANSWER API CLIENT
// ============================================

export const answerApi = {
  /** Create a new answer for a question */
  create: async (questionId: string, data: FormData) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/advisory/questions/${questionId}/answers`, {
      method: "POST",
      body: data,
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || "Failed to post answer")
    }
    return response.json()
  },

  /** Vote an answer as helpful or not_helpful */
  vote: async (answerId: string, voteType: "helpful" | "not_helpful") => {
    const response = await fetchWithAuth(`${API_BASE_URL}/advisory/answers/${answerId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voteType }),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || "Failed to vote")
    }
    return response.json()
  },

  /** Accept an answer as the best answer */
  accept: async (answerId: string) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/advisory/answers/${answerId}/accept`, {
      method: "POST",
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || "Failed to accept answer")
    }
    return response.json()
  },

  /** Request more guidance for an answer */
  needMoreGuidance: async (answerId: string) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/advisory/answers/${answerId}/need-more-guidance`, {
      method: "POST",
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || "Failed to request more guidance")
    }
    return response.json()
  },

  /** Get expert's best answers */
  getExpertBestAnswers: async (expertId: string) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/advisory/answers/expert/${expertId}`)
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || "Failed to fetch expert answers")
    }
    return response.json()
  },

  /** Get answers posted by the currently authenticated expert */
  getMyAnswers: async (params: { page?: number; limit?: number } = {}) => {
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.set("page", String(params.page))
    if (params.limit) searchParams.set("limit", String(params.limit))
    const response = await fetchWithAuth(`${API_BASE_URL}/advisory/answers/my?${searchParams.toString()}`)
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || "Failed to fetch my answers")
    }
    return response.json()
  },
}

// ============================================
// COMMENT API CLIENT
// ============================================

export const commentApi = {
  /** Get all comments for an answer */
  getByAnswer: async (answerId: string) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/advisory/answers/${answerId}/comments`)
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || "Failed to fetch comments")
    }
    return response.json()
  },

  /** Get replies for a comment */
  getReplies: async (commentId: string) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/advisory/comments/${commentId}/replies`)
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || "Failed to fetch replies")
    }
    return response.json()
  },

  /** Post a comment (or reply) on an answer */
  create: async (answerId: string, content: string, parentId?: string) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/advisory/answers/${answerId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, parentId }),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || "Failed to add comment")
    }
    return response.json()
  },

  /** Like a comment */
  like: async (commentId: string) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/advisory/comments/${commentId}/like`, {
      method: "POST",
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || "Failed to like comment")
    }
    return response.json()
  },
}
