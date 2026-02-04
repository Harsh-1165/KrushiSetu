/**
 * Central API client for GreenTrace
 * - Stores JWT after login
 * - Attaches Authorization: Bearer <token> to all protected calls
 * - Handles 401 → redirect to /login
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"

const TOKEN_KEY = "greentrace_access_token"
const USER_KEY = "greentrace_user"

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY)
}

export function setAccessToken(token: string, rememberMe = false): void {
  if (typeof window === "undefined") return
  if (rememberMe) {
    localStorage.setItem(TOKEN_KEY, token)
    sessionStorage.removeItem(TOKEN_KEY)
  } else {
    sessionStorage.setItem(TOKEN_KEY, token)
    localStorage.removeItem(TOKEN_KEY)
  }
}

export function clearAuth(): void {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
  sessionStorage.removeItem("user")
}

export function setStoredUser(user: unknown): void {
  if (typeof window === "undefined") return
  const data = JSON.stringify(user)
  sessionStorage.setItem(USER_KEY, data)
  sessionStorage.setItem("user", data)
}

/**
 * Fetch with Authorization header and 401 handling
 */
export async function fetchWithAuth(
  url: string | URL,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAccessToken()
  const headers = new Headers(options.headers)
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }
  const res = await fetch(url, { ...options, headers, credentials: "include" })
  if (res.status === 401) {
    clearAuth()
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.href = "/login?redirect=" + encodeURIComponent(window.location.pathname)
    }
  }
  return res
}

/**
 * Build full API URL for a path (e.g. "/auth/me" -> base + path)
 */
export function apiUrl(path: string): string {
  const base = API_BASE_URL.replace(/\/$/, "")
  const p = path.startsWith("/") ? path : `/${path}`
  return `${base}${p}`
}
