"use client"

import React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  Package,
  Truck,
  Shield,
  Leaf,
  Tag,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useCart } from "@/lib/cart-context"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function CartPage() {
  const router = useRouter()
  const {
    state,
    removeItem,
    updateQuantity,
    clearCart,
    getSubtotal,
    getTax,
    getShipping,
    getTotal,
    getTotalItems,
  } = useCart()

  const [couponCode, setCouponCode] = React.useState("")
  const [appliedCoupon, setAppliedCoupon] = React.useState<{ code: string; discount: number } | null>(null)
  const [isApplyingCoupon, setIsApplyingCoupon] = React.useState(false)

  const handleQuantityChange = (id: string, newQuantity: number, maxQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id)
      toast.success("Item removed from cart")
    } else if (newQuantity <= maxQuantity) {
      updateQuantity(id, newQuantity)
    } else {
      toast.error(`Only ${maxQuantity} items available`)
    }
  }

  const handleRemoveItem = (id: string, name: string) => {
    removeItem(id)
    toast.success(`${name} removed from cart`)
  }

  const handleClearCart = () => {
    clearCart()
    toast.success("Cart cleared")
  }

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return

    setIsApplyingCoupon(true)
    
    // Simulate coupon validation
    setTimeout(() => {
      const validCoupons: Record<string, number> = {
        "FRESH10": 10,
        "ORGANIC20": 20,
        "WELCOME15": 15,
        "FARM25": 25,
      }

      const discount = validCoupons[couponCode.toUpperCase()]
      if (discount) {
        setAppliedCoupon({ code: couponCode.toUpperCase(), discount })
        toast.success(`Coupon applied! ${discount}% discount`)
      } else {
        toast.error("Invalid coupon code")
      }
      setIsApplyingCoupon(false)
    }, 500)
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode("")
    toast.success("Coupon removed")
  }

  const subtotal = getSubtotal()
  const tax = getTax()
  const shipping = getShipping()
  const couponDiscount = appliedCoupon ? Math.round((subtotal * appliedCoupon.discount) / 100) : 0
  const total = subtotal + tax + shipping - couponDiscount

  const freeShippingThreshold = 500
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal)

  // Empty Cart State
  if (state.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Your cart is empty</h1>
          <p className="text-muted-foreground mt-2">
            Looks like you haven't added any items to your cart yet.
          </p>
          <Button className="mt-6" size="lg" asChild>
            <Link href="/marketplace">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continue Shopping
            </Link>
          </Button>
        </div>

        {/* Suggestions */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-center mb-6">Popular Products</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-4xl mx-auto">
            {[
              { name: "Organic Basmati Rice", price: 180, unit: "kg" },
              { name: "Fresh Tomatoes", price: 60, unit: "kg" },
              { name: "Farm Fresh Eggs", price: 90, unit: "dozen" },
              { name: "Organic Turmeric", price: 250, unit: "kg" },
            ].map((product, i) => (
              <Card key={i} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium text-sm">{product.name}</h3>
                  <p className="text-primary font-semibold mt-1">
                    Rs. {product.price}/{product.unit}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Shopping Cart</h1>
          <p className="text-muted-foreground">{getTotalItems()} items in your cart</p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cart
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear shopping cart?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove all {getTotalItems()} items from your cart. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearCart} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Clear Cart
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Free Shipping Progress */}
      {shipping > 0 && (
        <div className="mb-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 text-sm">
            <Truck className="h-4 w-4 text-primary" />
            <span>
              Add <span className="font-semibold text-primary">Rs. {remainingForFreeShipping}</span> more for free shipping!
            </span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {state.items.map((item) => (
            <Card key={item._id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Product Image */}
                  <Link href={`/marketplace/product/${item._id}`} className="shrink-0">
                    <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                      {item.isOrganic && (
                        <Badge variant="secondary" className="absolute left-1 top-1 bg-green-100 text-green-800 text-xs px-1">
                          <Leaf className="h-3 w-3" />
                        </Badge>
                      )}
                    </div>
                  </Link>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link href={`/marketplace/product/${item._id}`}>
                          <h3 className="font-semibold hover:text-primary transition-colors line-clamp-1">
                            {item.name}
                          </h3>
                        </Link>
                        <p className="text-sm text-muted-foreground">{item.farmer.farmName}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveItem(item._id, item.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Qty:</span>
                        <div className="flex items-center border rounded-md">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-r-none"
                            onClick={() => handleQuantityChange(item._id, item.quantity - 1, item.maxQuantity)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-l-none"
                            onClick={() => handleQuantityChange(item._id, item.quantity + 1, item.maxQuantity)}
                            disabled={item.quantity >= item.maxQuantity}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          (Max: {item.maxQuantity})
                        </span>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">
                          Rs. {(item.price * item.quantity).toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Rs. {item.price}/{item.unit}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Continue Shopping */}
          <div className="pt-4">
            <Button variant="outline" asChild>
              <Link href="/marketplace">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Continue Shopping
              </Link>
            </Button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Coupon Code */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Coupon Code
                </label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                    <div>
                      <p className="font-medium text-green-800">{appliedCoupon.code}</p>
                      <p className="text-sm text-green-600">{appliedCoupon.discount}% discount applied</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleRemoveCoupon} className="text-green-800">
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                    />
                    <Button
                      variant="secondary"
                      onClick={handleApplyCoupon}
                      disabled={isApplyingCoupon || !couponCode.trim()}
                    >
                      {isApplyingCoupon ? "..." : "Apply"}
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Try: FRESH10, ORGANIC20, WELCOME15
                </p>
              </div>

              <Separator />

              {/* Price Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal ({getTotalItems()} items)</span>
                  <span>Rs. {subtotal.toLocaleString()}</span>
                </div>
                
                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Coupon Discount ({appliedCoupon.discount}%)</span>
                    <span>- Rs. {couponDiscount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (5%)</span>
                  <span>Rs. {tax.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className={cn(shipping === 0 && "text-green-600")}>
                    {shipping === 0 ? "FREE" : `Rs. ${shipping}`}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="text-primary">Rs. {total.toLocaleString()}</span>
              </div>

              {/* Checkout Button */}
              <Button className="w-full" size="lg" asChild>
                <Link href="/marketplace/checkout">
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-2 pt-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>Secure Payment</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Truck className="h-4 w-4 text-primary" />
                  <span>Fast Delivery</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Package className="h-4 w-4 text-primary" />
                  <span>Quality Products</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Leaf className="h-4 w-4 text-primary" />
                  <span>Farm Fresh</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
