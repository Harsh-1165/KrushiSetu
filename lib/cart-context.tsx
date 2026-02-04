"use client"

import React, { createContext, useContext, useReducer, useEffect, useCallback } from "react"

// Types
export interface CartItem {
  _id: string
  name: string
  price: number
  unit: string
  quantity: number
  maxQuantity: number
  image: string
  farmer: {
    _id: string
    name: string
    farmName: string
  }
  isOrganic?: boolean
}

export interface CartState {
  items: CartItem[]
  isOpen: boolean
}

type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "TOGGLE_CART" }
  | { type: "LOAD_CART"; payload: CartItem[] }

interface CartContextType {
  state: CartState
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  toggleCart: () => void
  getItemQuantity: (id: string) => number
  getTotalItems: () => number
  getSubtotal: () => number
  getTax: () => number
  getShipping: () => number
  getTotal: () => number
  isInCart: (id: string) => boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = "greentrace_cart"
const TAX_RATE = 0.05 // 5% tax
const FREE_SHIPPING_THRESHOLD = 500
const SHIPPING_COST = 50

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existingIndex = state.items.findIndex((item) => item._id === action.payload._id)
      
      if (existingIndex > -1) {
        const updatedItems = [...state.items]
        const currentItem = updatedItems[existingIndex]
        const newQuantity = Math.min(
          currentItem.quantity + (action.payload.quantity || 1),
          action.payload.maxQuantity
        )
        updatedItems[existingIndex] = { ...currentItem, quantity: newQuantity }
        return { ...state, items: updatedItems }
      }
      
      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: action.payload.quantity || 1 }],
      }
    }
    
    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((item) => item._id !== action.payload),
      }
    
    case "UPDATE_QUANTITY": {
      const { id, quantity } = action.payload
      if (quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((item) => item._id !== id),
        }
      }
      return {
        ...state,
        items: state.items.map((item) =>
          item._id === id
            ? { ...item, quantity: Math.min(quantity, item.maxQuantity) }
            : item
        ),
      }
    }
    
    case "CLEAR_CART":
      return { ...state, items: [] }
    
    case "TOGGLE_CART":
      return { ...state, isOpen: !state.isOpen }
    
    case "LOAD_CART":
      return { ...state, items: action.payload }
    
    default:
      return state
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], isOpen: false })

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY)
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart)
        dispatch({ type: "LOAD_CART", payload: parsedCart })
      } catch (error) {
        console.error("Failed to parse cart from localStorage:", error)
      }
    }
  }, [])

  // Save cart to localStorage on changes
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items))
  }, [state.items])

  const addItem = useCallback((item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    dispatch({ type: "ADD_ITEM", payload: { ...item, quantity: item.quantity || 1 } as CartItem })
  }, [])

  const removeItem = useCallback((id: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: id })
  }, [])

  const updateQuantity = useCallback((id: string, quantity: number) => {
    dispatch({ type: "UPDATE_QUANTITY", payload: { id, quantity } })
  }, [])

  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR_CART" })
  }, [])

  const toggleCart = useCallback(() => {
    dispatch({ type: "TOGGLE_CART" })
  }, [])

  const getItemQuantity = useCallback(
    (id: string) => {
      const item = state.items.find((item) => item._id === id)
      return item?.quantity || 0
    },
    [state.items]
  )

  const getTotalItems = useCallback(() => {
    return state.items.reduce((total, item) => total + item.quantity, 0)
  }, [state.items])

  const getSubtotal = useCallback(() => {
    return state.items.reduce((total, item) => total + item.price * item.quantity, 0)
  }, [state.items])

  const getTax = useCallback(() => {
    return Math.round(getSubtotal() * TAX_RATE)
  }, [getSubtotal])

  const getShipping = useCallback(() => {
    const subtotal = getSubtotal()
    if (subtotal === 0) return 0
    return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST
  }, [getSubtotal])

  const getTotal = useCallback(() => {
    return getSubtotal() + getTax() + getShipping()
  }, [getSubtotal, getTax, getShipping])

  const isInCart = useCallback(
    (id: string) => {
      return state.items.some((item) => item._id === id)
    },
    [state.items]
  )

  return (
    <CartContext.Provider
      value={{
        state,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        toggleCart,
        getItemQuantity,
        getTotalItems,
        getSubtotal,
        getTax,
        getShipping,
        getTotal,
        isInCart,
      }}
    >
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

// Wishlist Context
export interface WishlistItem {
  _id: string
  name: string
  price: number
  unit: string
  image: string
  farmer: {
    name: string
    farmName: string
  }
  addedAt: string
}

interface WishlistContextType {
  items: WishlistItem[]
  addToWishlist: (item: Omit<WishlistItem, "addedAt">) => void
  removeFromWishlist: (id: string) => void
  isInWishlist: (id: string) => boolean
  clearWishlist: () => void
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

const WISHLIST_STORAGE_KEY = "greentrace_wishlist"

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<WishlistItem[]>([])

  useEffect(() => {
    const savedWishlist = localStorage.getItem(WISHLIST_STORAGE_KEY)
    if (savedWishlist) {
      try {
        setItems(JSON.parse(savedWishlist))
      } catch (error) {
        console.error("Failed to parse wishlist from localStorage:", error)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addToWishlist = useCallback((item: Omit<WishlistItem, "addedAt">) => {
    setItems((prev) => {
      if (prev.some((i) => i._id === item._id)) return prev
      return [...prev, { ...item, addedAt: new Date().toISOString() }]
    })
  }, [])

  const removeFromWishlist = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item._id !== id))
  }, [])

  const isInWishlist = useCallback(
    (id: string) => {
      return items.some((item) => item._id === id)
    },
    [items]
  )

  const clearWishlist = useCallback(() => {
    setItems([])
  }, [])

  return (
    <WishlistContext.Provider
      value={{ items, addToWishlist, removeFromWishlist, isInWishlist, clearWishlist }}
    >
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
