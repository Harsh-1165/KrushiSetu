"use client"

import { useCart } from "@/contexts/cart-context"
import { Button } from "@/components/ui/button"
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function CartPage() {
    const { items, updateQuantity, removeItem, subtotal, loading, count } = useCart()

    if (loading) {
        return (
            <div className="container py-10 space-y-4">
                <Skeleton className="h-10 w-48" />
                <div className="grid gap-8 md:grid-cols-3">
                    <div className="md:col-span-2 space-y-4">
                        {[1, 2].map(i => (
                            <Skeleton key={i} className="h-32 w-full rounded-lg" />
                        ))}
                    </div>
                    <Skeleton className="h-64 w-full rounded-lg" />
                </div>
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <div className="container py-20 flex flex-col items-center justify-center text-center space-y-6">
                <div className="bg-muted p-6 rounded-full">
                    <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold">Your cart is empty</h1>
                    <p className="text-muted-foreground">
                        Looks like you haven't added anything to your cart yet.
                    </p>
                </div>
                <Button asChild size="lg">
                    <Link href="/dashboard/browse-products">
                        Browse Products
                    </Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="container py-8 space-y-8">
            <h1 className="text-3xl font-bold">Shopping Cart ({count} items)</h1>

            <div className="grid gap-8 md:grid-cols-3">
                {/* Cart Items List */}
                <div className="md:col-span-2 space-y-4">
                    {items.map((item) => (
                        <Card key={item._id || item.product._id} className="overflow-hidden">
                            <CardContent className="p-4 flex gap-4">
                                <div className="relative h-24 w-24 flex-shrink-0 bg-muted rounded-md overflow-hidden">
                                    <Image
                                        src={
                                            (() => {
                                                const img = item.product.images?.[0]
                                                if (typeof img === "string" && (img.length > 500 || img.includes("Error"))) return "/placeholder.svg"
                                                return typeof img === "string" ? img : (img as { url?: string })?.url || "/placeholder.svg"
                                            })()
                                        }
                                        alt={item.product.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>

                                <div className="flex-1 flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold text-lg">
                                                <Link href={`/dashboard/products/${item.product._id}`} className="hover:underline">
                                                    {item.product.name}
                                                </Link>
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                ₹{item.product.price.current} / {item.product.price.unit}
                                            </p>
                                        </div>
                                        <p className="font-bold text-lg">
                                            ₹{(item.product.price.current * item.quantity).toLocaleString()}
                                        </p>
                                    </div>

                                    <div className="flex justify-between items-center mt-4">
                                        <div className="flex items-center gap-2 border rounded-md p-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                                                disabled={item.quantity <= 1}
                                            >
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                                                disabled={item.quantity >= (item.product.inventory?.available || 999)}
                                            >
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => removeItem(item.product._id)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Remove
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Order Summary */}
                <div className="md:col-span-1">
                    <Card className="sticky top-20">
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>₹{subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Shipping</span>
                                <span className="text-green-600 font-medium">Free</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>₹{subtotal.toLocaleString()}</span>
                            </div>

                            <Button className="w-full mt-4" size="lg" asChild>
                                <Link href="/dashboard/checkout">
                                    Proceed to Checkout
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>

                            <div className="text-xs text-center text-muted-foreground mt-4">
                                Secure Checkout - 100% Money Back Guarantee
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
