// Auth API utilities for GreenTrace

import { apiUrl, fetchWithAuth, setAccessToken, setStoredUser, clearAuth } from "./api"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"

export interface User {
  id: string
  email: string
  name: {
    first: string
    last: string
  }
  phone: string
  role: "farmer" | "expert" | "consumer" | "admin"
  avatar?: string
  isEmailVerified: boolean
  permissions?: string[]
}

export interface AuthResponse {
  success: boolean
  message: string
  data?: {
    user: User
    accessToken: string
  }
}

export interface RegisterData {
  email: string
  password: string
  confirmPassword: string
  name: {
    first: string
    last: string
  }
  phone: string
  role: "farmer" | "expert" | "consumer"
  // Role-specific fields
  farmerProfile?: {
    farmName: string
    farmSize: number
    experience: number
    crops: string[]
  }
  expertProfile?: {
    experience: number
    specializations: string[]
    credentials: string
  }
  consumerProfile?: {
    interests: string[]
  }
  location?: {
    state: string
    district: string
    village?: string
  }
}

export interface LoginData {
  email: string
  password: string
  rememberMe?: boolean
}

// API functions
export async function registerUser(data: RegisterData): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  })
  
  const result = await response.json()
  
  if (!response.ok) {
    throw new Error(result.message || "Registration failed")
  }
  
  return result
}

export async function loginUser(data: LoginData): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message || "Login failed")
  }

  // Store JWT so all protected API calls can attach Authorization: Bearer <token>
  if (result.data?.accessToken) {
    setAccessToken(result.data.accessToken, data.rememberMe ?? false)
  }
  if (result.data?.user) {
    setStoredUser(result.data.user)
  }
  return result
}

export async function logoutUser(): Promise<{ success: boolean; message: string }> {
  const response = await fetchWithAuth(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  })

  const result = await response.json()
  clearAuth()
  if (!response.ok) {
    throw new Error(result.message || "Logout failed")
  }
  return result
}

export async function forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  })
  
  const result = await response.json()
  
  if (!response.ok) {
    throw new Error(result.message || "Failed to send reset email")
  }
  
  return result
}

export async function resetPassword(
  token: string,
  email: string,
  password: string,
  confirmPassword: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, email, password, confirmPassword }),
  })
  
  const result = await response.json()
  
  if (!response.ok) {
    throw new Error(result.message || "Password reset failed")
  }
  
  return result
}

export async function verifyEmail(
  token: string,
  email: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, email }),
  })
  
  const result = await response.json()
  
  if (!response.ok) {
    throw new Error(result.message || "Email verification failed")
  }
  
  return result
}

export async function resendVerification(): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
    method: "POST",
    credentials: "include",
  })
  
  const result = await response.json()
  
  if (!response.ok) {
    throw new Error(result.message || "Failed to resend verification email")
  }
  
  return result
}

export async function getCurrentUser(): Promise<{ success: boolean; data: { user: User } }> {
  const response = await fetchWithAuth(apiUrl("/auth/me"), { credentials: "include" })
  const result = await response.json()
  if (!response.ok) {
    throw new Error(result.message || "Failed to get user")
  }
  if (result.data?.user) {
    setStoredUser(result.data.user)
  }
  return result
}

// Password strength checker
export function checkPasswordStrength(password: string): {
  score: number
  feedback: string[]
  strength: "weak" | "fair" | "good" | "strong"
} {
  const feedback: string[] = []
  let score = 0
  
  if (password.length >= 8) {
    score += 1
  } else {
    feedback.push("Password should be at least 8 characters")
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
  
  if (/[@$!%*?&]/.test(password)) {
    score += 1
  } else {
    feedback.push("Add special characters (@$!%*?&)")
  }
  
  let strength: "weak" | "fair" | "good" | "strong" = "weak"
  if (score >= 6) {
    strength = "strong"
  } else if (score >= 4) {
    strength = "good"
  } else if (score >= 2) {
    strength = "fair"
  }
  
  return { score, feedback, strength }
}

// Indian states list
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

// Crop types
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
]

// Expert specializations
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
]

// Consumer interests
export const consumerInterests = [
  "Organic Produce",
  "Fresh Vegetables",
  "Fresh Fruits",
  "Grains & Pulses",
  "Dairy Products",
  "Spices",
  "Local Produce",
  "Seasonal Produce",
  "Farm Fresh",
  "Sustainable Farming",
]
