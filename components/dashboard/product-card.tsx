"use client"

import React from "react"

import Image from "next/image"
import Link from "next/link"
import { Heart, Star, ShoppingCart } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useCart } from "@/contexts/cart-context"
import { useWishlist } from "@/contexts/wishlist-context"


interface ProductCardProps {
  product: {
    _id: string
    name: string
    price: number | { current: number }
    unit: string
    images: string[]
    ratings?: { average: number; count: number }
    farmer?: { farmerProfile?: { farmName: string } }
    isOrganic?: boolean
    status?: string
    quantity?: number
  }
  showFavorite?: boolean
  showAddToCart?: boolean
  showStatus?: boolean
  showInventory?: boolean
  onFavoriteClick?: () => void
  onAddToCart?: () => void
  isFavorite?: boolean
  loading?: boolean
  className?: string
  layout?: "grid" | "list"
}

export function ProductCard({
  product,
  showFavorite = false,
  showAddToCart = false,
  showStatus = false,
  showInventory = false,
  onFavoriteClick,
  onAddToCart,
  isFavorite: isFavoriteProp,
  loading = false,
  className,
  layout = "grid",
}: ProductCardProps) {
  const { addItem } = useCart()
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist()

  if (loading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <Skeleton className="aspect-square w-full" />
        <CardContent className="p-4">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-2" />
          <Skeleton className="h-6 w-1/3" />
        </CardContent>
      </Card>
    )
  }

  const productId =
    typeof product._id === "string" ? product._id : (product._id as { toString?: () => string })?.toString?.() ?? ""

  // Use prop if provided, otherwise check context
  const isFavorite = isFavoriteProp !== undefined ? isFavoriteProp : isInWishlist(productId)

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (onFavoriteClick) {
      onFavoriteClick()
      return
    }

    if (isFavorite) {
      await removeFromWishlist(productId)
    } else {
      await addToWishlist(productId)
    }
  }

  // Support both string URLs and { url } objects
  const imageUrl =
    (() => {
      const img = product.images?.[0]
      // Fix for potential error strings in image field
      if (typeof img === "string" && (img.length > 500 || img.includes("Error") || img.includes("Cloudinary"))) return "/placeholder.svg"
      return typeof img === "string" ? img : (img as { url?: string })?.url
    })() || "/placeholder.svg"


  if (layout === "list") {
    return (
      <Card className={cn("overflow-hidden group flex flex-row h-40", className)}>
        <div className="relative w-40 h-full shrink-0 overflow-hidden">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
          {showFavorite && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 bg-background/80 backdrop-blur-sm hover:bg-background h-8 w-8"
              onClick={handleFavoriteClick}
            >
              <Heart className={cn("h-4 w-4", isFavorite && "fill-red-500 text-red-500")} />
            </Button>
          )}
        </div>
        <div className="flex flex-1 flex-col justify-between p-4">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <Badge variant={product.isOrganic ? "secondary" : "outline"} className="mb-2 bg-green-100 text-green-800 border-green-200">
                  {product.isOrganic ? "Organic" : "Standard"}
                </Badge>
                <Link href={`/dashboard/products/${productId}`}>
                  <h3 className="font-semibold text-lg hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                </Link>
                {product.farmer?.farmerProfile?.farmName && (
                  <p className="text-sm text-muted-foreground">
                    {product.farmer.farmerProfile.farmName}
                  </p>
                )}
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-primary">
                  Rs. {(typeof product.price === "object" && product.price !== null ? (product.price as { current?: number }).current : product.price)?.toLocaleString() ?? "0"}
                </span>
                <span className="text-sm text-muted-foreground block">/{product.unit}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-end mt-2">
            {product.ratings && product.ratings.count > 0 ? (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{product.ratings.average.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">({product.ratings.count} reviews)</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">No ratings</span>
            )}

            {showAddToCart && (
              <Button size="sm" onClick={onAddToCart}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
            )}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn("overflow-hidden group", className)}>
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover transition-transform group-hover:scale-105"
        />
        {showFavorite && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 bg-background/80 backdrop-blur-sm hover:bg-background"
            onClick={handleFavoriteClick}
          >
            <Heart
              className={cn("h-4 w-4", isFavorite && "fill-red-500 text-red-500")}
            />
          </Button>
        )}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {product.isOrganic && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Organic
            </Badge>
          )}
          {showStatus && product.status && (
            <Badge
              variant={
                product.status === "active"
                  ? "default"
                  : product.status === "pending"
                    ? "secondary"
                    : "destructive"
              }
            >
              {product.status}
            </Badge>
          )}
        </div>
      </div>
      <CardContent className="p-4">
        <Link href={`/dashboard/products/${productId}`}>
          <h3 className="font-semibold line-clamp-1 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        {product.farmer?.farmerProfile?.farmName && (
          <p className="text-sm text-muted-foreground line-clamp-1">
            {product.farmer.farmerProfile.farmName}
          </p>
        )}
        {product.ratings && product.ratings.count > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{product.ratings.average.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({product.ratings.count})</span>
          </div>
        )}
        {showInventory && product.quantity !== undefined && (
          <p
            className={cn(
              "text-sm mt-1",
              product.quantity < 10 ? "text-red-600" : "text-muted-foreground"
            )}
          >
            Stock: {product.quantity} {product.unit}
          </p>
        )}
        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-lg font-bold text-primary">
            Rs. {(typeof product.price === "object" && product.price !== null ? (product.price as { current?: number }).current : product.price)?.toLocaleString() ?? "0"}
          </span>
          <span className="text-sm text-muted-foreground">/{product.unit}</span>
        </div>
      </CardContent>
      {showAddToCart && (
        <CardFooter className="p-4 pt-0">
          <Button className="w-full" size="sm" onClick={(e) => {
            e.preventDefault()
            onAddToCart ? onAddToCart() : addItem(product._id)
          }}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

// Grid wrapper for product cards
export function ProductGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", className)}>
      {children}
    </div>
  )
}

// Loading skeleton for product grid
export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <ProductGrid>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCard key={i} product={{} as ProductCardProps["product"]} loading />
      ))}
    </ProductGrid>
  )
}
