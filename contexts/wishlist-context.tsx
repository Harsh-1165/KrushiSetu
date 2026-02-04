"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { apiUrl, fetchWithAuth } from "@/lib/api"

interface Product {
    _id: string
    name: string
    price: {
        current: number
        unit: string
    }
    images: string[]
    ratings?: {
        average: number
    }
    seller?: {
        _id: string
        profile: {
            firstName: string
            lastName: string
        }
    }
    status: string
}

interface WishlistContextType {
    items: Product[]
    isLoading: boolean
    addToWishlist: (productId: string) => Promise<void>
    removeFromWishlist: (productId: string) => Promise<void>
    isInWishlist: (productId: string) => boolean
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<Product[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const { user } = useAuth()

    useEffect(() => {
        if (user) {
            fetchWishlist()
        } else {
            setItems([])
        }
    }, [user])

    const fetchWishlist = async () => {
        setIsLoading(true)
        try {
            const res = await fetchWithAuth(apiUrl("/users/profile/wishlist"))
            const data = await res.json()
            if (data.success) {
                setItems(data.data.wishlist)
            }
        } catch (error) {
            console.error("Failed to fetch wishlist", error)
        } finally {
            setIsLoading(false)
        }
    }

    const addToWishlist = async (productId: string) => {
        if (!user) {
            toast.error("Please login to add to favorites")
            return
        }

        // Optimistic update
        const isAlreadyIn = items.some(i => i._id === productId)
        if (isAlreadyIn) return

        try {
            const res = await fetchWithAuth(apiUrl(`/users/wishlist/${productId}`), {
                method: "POST"
            })
            const data = await res.json()

            if (data.success) {
                toast.success(data.message)
                // We'll re-fetch to get the full product details if needed, 
                // or just rely on re-fetch. For now, let's re-fetch to be safe/simple
                fetchWishlist()
            } else {
                toast.error(data.message || "Failed to add to favorites")
            }
        } catch (error) {
            toast.error("Something went wrong")
        }
    }

    const removeFromWishlist = async (productId: string) => {
        if (!user) return

        try {
            const res = await fetchWithAuth(apiUrl(`/users/wishlist/${productId}`), {
                method: "DELETE"
            })
            const data = await res.json()

            if (data.success) {
                setItems(prev => prev.filter(item => item._id !== productId))
                toast.success(data.message)
            } else {
                toast.error(data.message || "Failed to remove from favorites")
            }
        } catch (error) {
            toast.error("Something went wrong")
        }
    }

    const isInWishlist = (productId: string) => {
        return items.some(item => item._id === productId)
    }

    return (
        <WishlistContext.Provider value={{ items, isLoading, addToWishlist, removeFromWishlist, isInWishlist }}>
            {children}
        </WishlistContext.Provider>
    )
}

export function useWishlist() {
    const context = useContext(WishlistContext)
    if (context === undefined) {
        throw new Error("useWishlist must be used within a WishlistProvider")
    }
    return context
}
