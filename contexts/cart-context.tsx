"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { apiUrl, fetchWithAuth } from "@/lib/api"
import { toast } from "sonner"

export type CartItem = {
    _id?: string // Cart item ID (from backend)
    product: {
        _id: string
        name: string
        price: {
            current: number
            unit: string
        }
        images: Array<string | { url: string }>
        inventory?: {
            available: number
        }
    }
    quantity: number
}

type CartContextType = {
    items: CartItem[]
    loading: boolean
    addItem: (productId: string, quantity?: number) => Promise<void>
    removeItem: (productId: string) => Promise<void>
    updateQuantity: (productId: string, quantity: number) => Promise<void>
    clearCart: () => Promise<void>
    subtotal: number
    count: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([])
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)

    // Load user from storage to check auth status
    useEffect(() => {
        const storedUser = sessionStorage.getItem("user")
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser))
            } catch (e) {
                console.error("Failed to parse user", e)
            }
        }
        setLoading(false)
    }, [])

    // Fetch cart from backend if user is logged in
    useEffect(() => {
        if (user) {
            fetchCart()
        } else {
            // Load from local storage for guests
            const localCart = localStorage.getItem("cart")
            if (localCart) {
                try {
                    setItems(JSON.parse(localCart))
                } catch (e) {
                    console.error("Failed to parse local cart", e)
                }
            }
        }
    }, [user])

    const fetchCart = async () => {
        try {
            const res = await fetchWithAuth(apiUrl("/cart"))
            if (res.ok) {
                const data = await res.json()
                if (data.success && data.data) {
                    setItems(data.data.items)
                }
            }
        } catch (error) {
            console.error("Failed to fetch cart", error)
        }
    }

    const addItem = async (productId: string, quantity = 1) => {
        if (user) {
            try {
                const res = await fetchWithAuth(apiUrl("/cart/add"), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ productId, quantity })
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data.message || "Failed to add item")

                setItems(data.data.items)
                toast.success("Added to cart")
            } catch (error: any) {
                toast.error(error.message)
            }
        } else {
            toast.error("Please login to add items to cart")
            // Optional: Implement generic local storage add here if guest cart is desired
        }
    }

    const updateQuantity = async (productId: string, quantity: number) => {
        if (user) {
            try {
                const res = await fetchWithAuth(apiUrl("/cart/update"), {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ productId, quantity })
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data.message || "Failed to update cart")

                setItems(data.data.items)
            } catch (error: any) {
                toast.error(error.message)
            }
        }
    }

    const removeItem = async (productId: string) => {
        if (user) {
            try {
                const res = await fetchWithAuth(apiUrl(`/cart/remove/${productId}`), {
                    method: "DELETE"
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data.message || "Failed to remove item")

                setItems(data.data.items)
                toast.success("Item removed")
            } catch (error: any) {
                toast.error(error.message)
            }
        }
    }

    const clearCart = async () => {
        if (user) {
            try {
                await fetchWithAuth(apiUrl("/cart/clear"), { method: "DELETE" })
                setItems([])
            } catch (error) {
                console.error(error)
            }
        } else {
            setItems([])
            localStorage.removeItem("cart")
        }
    }

    const subtotal = items.reduce((total, item) => {
        const price = item.product?.price?.current || 0
        return total + (price * item.quantity)
    }, 0)

    const count = items.reduce((acc, item) => acc + item.quantity, 0)

    return (
        <CartContext.Provider value={{
            items,
            loading,
            addItem,
            removeItem,
            updateQuantity,
            clearCart,
            subtotal,
            count
        }}>
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider")
    }
    return context
}
