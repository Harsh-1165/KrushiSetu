// Settings & Profile API utilities for GreenTrace

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"

// ============================================
// TYPES
// ============================================

export interface UserProfile {
  id: string
  email: string
  name: {
    first: string
    last: string
  }
  phone: string
  role: "farmer" | "expert" | "consumer" | "admin"
  avatar?: {
    url: string
    publicId?: string
  }
  status: "active" | "inactive" | "suspended" | "deleted"
  verification: {
    email: {
      verified: boolean
      verifiedAt?: string
    }
    phone: {
      verified: boolean
      verifiedAt?: string
    }
    kyc: {
      status: "pending" | "submitted" | "approved" | "rejected"
    }
  }
  preferences: {
    language: string
    currency: string
    notifications: {
      email: boolean
      sms: boolean
      push: boolean
    }
    newsletter: boolean
  }
  address?: {
    street?: string
    village?: string
    city?: string
    district?: string
    state?: string
    pincode?: string
    country: string
    coordinates?: {
      type: string
      coordinates: [number, number]
    }
  }
  bio?: string
  farmerProfile?: {
    farmSize?: number
    farmSizeUnit?: "acres" | "hectares" | "bigha"
    crops?: string[]
    farmingType?: "organic" | "conventional" | "mixed"
    rating?: number
    totalSales?: number
    bankDetails?: {
      accountName?: string
      accountNumber?: string
      ifscCode?: string
      bankName?: string
      branch?: string
    }
  }
  expertProfile?: {
    specializations?: string[]
    qualifications?: Array<{
      degree: string
      institution: string
      year: number
    }>
    experience?: number
    rating?: number
    totalAnswers?: number
    verified?: boolean
    consultationFee?: number
  }
  security?: {
    lastLogin?: string
    lastPasswordChange?: string
    twoFactorEnabled?: boolean
  }
  createdAt: string
  updatedAt?: string
}

export interface ProfileUpdateData {
  name?: {
    first?: string
    last?: string
  }
  phone?: string
  bio?: string
  address?: {
    street?: string
    village?: string
    city?: string
    district?: string
    state?: string
    pincode?: string
    country?: string
  }
  preferences?: {
    language?: string
    currency?: string
    notifications?: {
      email?: boolean
      sms?: boolean
      push?: boolean
    }
    newsletter?: boolean
  }
  farmerProfile?: {
    farmSize?: number
    farmSizeUnit?: "acres" | "hectares" | "bigha"
    crops?: string[]
    farmingType?: "organic" | "conventional" | "mixed"
  }
  expertProfile?: {
    specializations?: string[]
    experience?: number
    consultationFee?: number
    qualifications?: Array<{
      degree: string
      institution: string
      year: number
    }>
  }
}

export interface ChangePasswordData {
  currentPassword: string
  password: string
  confirmPassword: string
  logoutOtherDevices?: boolean
}

export interface Session {
  id: string
  device: string
  ipAddress: string
  createdAt: string
  isCurrent: boolean
}

export interface LoginActivity {
  type: string
  timestamp: string
  ipAddress: string
  userAgent: string
  details?: Record<string, unknown>
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Get current user profile
 */
export async function getUserProfile(): Promise<{ success: boolean; data: { user: UserProfile } }> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    credentials: "include",
  })
  
  const result = await response.json()
  
  if (!response.ok) {
    throw new Error(result.message || "Failed to get user profile")
  }
  
  return result
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  data: ProfileUpdateData
): Promise<{ success: boolean; message: string; data: { user: UserProfile } }> {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  })
  
  const result = await response.json()
  
  if (!response.ok) {
    throw new Error(result.message || "Failed to update profile")
  }
  
  return result
}

/**
 * Upload avatar
 */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<{ success: boolean; message: string; data: { avatarUrl: string } }> {
  const formData = new FormData()
  formData.append("avatar", file)
  
  const response = await fetch(`${API_BASE_URL}/users/${userId}/avatar`, {
    method: "PUT",
    credentials: "include",
    body: formData,
  })
  
  const result = await response.json()
  
  if (!response.ok) {
    throw new Error(result.message || "Failed to upload avatar")
  }
  
  return result
}

/**
 * Remove avatar
 */
export async function removeAvatar(
  userId: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/avatar`, {
    method: "DELETE",
    credentials: "include",
  })
  
  const result = await response.json()
  
  if (!response.ok) {
    throw new Error(result.message || "Failed to remove avatar")
  }
  
  return result
}

/**
 * Change password
 */
export async function changePassword(
  data: ChangePasswordData
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  })
  
  const result = await response.json()
  
  if (!response.ok) {
    throw new Error(result.message || "Failed to change password")
  }
  
  return result
}

/**
 * Get active sessions
 */
export async function getSessions(): Promise<{ success: boolean; data: { sessions: Session[] } }> {
  const response = await fetch(`${API_BASE_URL}/auth/sessions`, {
    credentials: "include",
  })
  
  const result = await response.json()
  
  if (!response.ok) {
    throw new Error(result.message || "Failed to get sessions")
  }
  
  return result
}

/**
 * Revoke a session
 */
export async function revokeSession(
  sessionId: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/sessions/${sessionId}`, {
    method: "DELETE",
    credentials: "include",
  })
  
  const result = await response.json()
  
  if (!response.ok) {
    throw new Error(result.message || "Failed to revoke session")
  }
  
  return result
}

/**
 * Logout from all devices
 */
export async function logoutAllDevices(): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ logoutAll: true }),
  })
  
  const result = await response.json()
  
  if (!response.ok) {
    throw new Error(result.message || "Failed to logout from all devices")
  }
  
  return result
}

/**
 * Get login activity
 */
export async function getLoginActivity(): Promise<{ success: boolean; data: { activity: LoginActivity[] } }> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    credentials: "include",
  })
  
  const result = await response.json()
  
  if (!response.ok) {
    throw new Error(result.message || "Failed to get login activity")
  }
  
  // Extract activity from user data
  return {
    success: true,
    data: {
      activity: result.data?.user?.activity || []
    }
  }
}

// ============================================
// VALIDATION HELPERS
// ============================================

export function validatePhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone)
}

export function validatePincode(pincode: string): boolean {
  return /^\d{6}$/.test(pincode)
}

export function validateIFSC(ifsc: string): boolean {
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)
}

// Password strength checker
export function checkPasswordStrength(password: string): {
  score: number
  feedback: string[]
  strength: "weak" | "fair" | "good" | "strong"
  color: string
} {
  const feedback: string[] = []
  let score = 0
  
  if (password.length >= 8) {
    score += 1
  } else {
    feedback.push("At least 8 characters")
  }
  
  if (password.length >= 12) {
    score += 1
  }
  
  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    feedback.push("Add lowercase letters")
  }
  
  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push("Add uppercase letters")
  }
  
  if (/\d/.test(password)) {
    score += 1
  } else {
    feedback.push("Add numbers")
  }
  
  if (/[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    score += 1
  } else {
    feedback.push("Add special characters")
  }
  
  let strength: "weak" | "fair" | "good" | "strong" = "weak"
  let color = "bg-red-500"
  
  if (score >= 6) {
    strength = "strong"
    color = "bg-green-500"
  } else if (score >= 4) {
    strength = "good"
    color = "bg-emerald-500"
  } else if (score >= 2) {
    strength = "fair"
    color = "bg-yellow-500"
  }
  
  return { score, feedback, strength, color }
}

// ============================================
// CONSTANTS
// ============================================

export const indianStates = [
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
]

export const cropTypes = [
  "Rice",
  "Wheat",
  "Maize",
  "Pulses",
  "Sugarcane",
  "Cotton",
  "Vegetables",
  "Fruits",
  "Spices",
  "Oilseeds",
  "Tea",
  "Coffee",
  "Rubber",
  "Jute",
  "Tobacco",
  "Millets",
  "Sorghum",
  "Groundnut",
  "Soybean",
  "Sunflower",
]

export const expertSpecializations = [
  "Soil Science",
  "Plant Pathology",
  "Entomology",
  "Agronomy",
  "Horticulture",
  "Agricultural Economics",
  "Organic Farming",
  "Irrigation Management",
  "Post-Harvest Technology",
  "Animal Husbandry",
  "Aquaculture",
  "Agricultural Engineering",
  "Crop Protection",
  "Seed Technology",
  "Farm Management",
]

export const farmSizeUnits = [
  { value: "acres", label: "Acres" },
  { value: "hectares", label: "Hectares" },
  { value: "bigha", label: "Bigha" },
]

export const farmingTypes = [
  { value: "organic", label: "Organic Farming" },
  { value: "conventional", label: "Conventional Farming" },
  { value: "mixed", label: "Mixed Farming" },
]

export const languages = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "mr", label: "Marathi" },
  { value: "gu", label: "Gujarati" },
  { value: "ta", label: "Tamil" },
  { value: "te", label: "Telugu" },
  { value: "kn", label: "Kannada" },
  { value: "ml", label: "Malayalam" },
  { value: "bn", label: "Bengali" },
  { value: "pa", label: "Punjabi" },
]

// Parse user agent to get device info
export function parseUserAgent(userAgent: string): {
  browser: string
  os: string
  device: string
} {
  let browser = "Unknown Browser"
  let os = "Unknown OS"
  let device = "Desktop"
  
  // Browser detection
  if (userAgent.includes("Chrome")) {
    browser = "Chrome"
  } else if (userAgent.includes("Firefox")) {
    browser = "Firefox"
  } else if (userAgent.includes("Safari")) {
    browser = "Safari"
  } else if (userAgent.includes("Edge")) {
    browser = "Edge"
  } else if (userAgent.includes("Opera")) {
    browser = "Opera"
  }
  
  // OS detection
  if (userAgent.includes("Windows")) {
    os = "Windows"
  } else if (userAgent.includes("Mac OS")) {
    os = "macOS"
  } else if (userAgent.includes("Linux")) {
    os = "Linux"
  } else if (userAgent.includes("Android")) {
    os = "Android"
    device = "Mobile"
  } else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) {
    os = "iOS"
    device = userAgent.includes("iPad") ? "Tablet" : "Mobile"
  }
  
  return { browser, os, device }
}
