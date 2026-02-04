"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { User as AuthUser } from "@/lib/auth"
import { fetchWithAuth, apiUrl, clearAuth } from "@/lib/api"

interface AuthContextType {
    user: AuthUser | null
    loading: boolean
    refetchUser: () => Promise<void>
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    refetchUser: async () => { },
    logout: async () => { },
})

export const useAuth = () => useContext(AuthContext)
// Alias for consistency with existing code
export const useUser = useAuth

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    const fetchUser = async () => {
        try {
            const response = await fetchWithAuth(apiUrl("/auth/me"), { credentials: "include" })
            if (response.ok) {
                const data = await response.json()
                const userData = data.data.user
                setUser(userData)
                sessionStorage.setItem("user", JSON.stringify(userData))
            } else {
                const storedUser = sessionStorage.getItem("user")
                if (storedUser) {
                    try {
                        setUser(JSON.parse(storedUser))
                    } catch {
                        clearAuth()
                        router.push("/login")
                    }
                } else {
                    router.push("/login")
                }
            }
        } catch {
            const storedUser = sessionStorage.getItem("user")
            if (storedUser) {
                try {
                    setUser(JSON.parse(storedUser))
                } catch {
                    clearAuth()
                    router.push("/login")
                }
            } else {
                router.push("/login")
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUser()
    }, [])

    const logout = async () => {
        try {
            await fetchWithAuth(apiUrl("/auth/logout"), { method: "POST", credentials: "include" })
        } catch {
            // Ignore errors
        }
        clearAuth()
        setUser(null)
        router.push("/login")
    }

    return (
        <AuthContext.Provider value={{ user, loading, refetchUser: fetchUser, logout }}>
            {children}
        </AuthContext.Provider>
    )
}
