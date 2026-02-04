"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ProductCard, ProductGrid, ProductGridSkeleton } from "@/components/dashboard/product-card"
import { NoFavorites } from "@/components/dashboard/empty-state"
import { Button } from "@/components/ui/button"
import { useWishlist } from "@/contexts/wishlist-context"

export default function FavoritesPage() {
  const { items, isLoading } = useWishlist()
  // Ensure we mount first to avoid hydration mismatch
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Favorites</h1>
          <p className="text-muted-foreground">
            Products you&apos;ve saved for later.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/products">Browse Products</Link>
        </Button>
      </div>

      {isLoading ? (
        <ProductGridSkeleton count={6} />
      ) : items.length === 0 ? (
        <NoFavorites onAction={() => window.location.assign("/dashboard/products")} />
      ) : (
        <ProductGrid>
          {items.map((product) => {
            // Adapt data structure if needed
            const adaptedProduct = {
              ...product,
              // Ensure unit exists at top level if it's nested in price
              unit: product.unit || (product.price as any)?.unit || "unit",
              quantity: (product as any).inventory?.available ?? 0
            }

            return (
              <ProductCard
                key={product._id}
                product={adaptedProduct}
                showFavorite
                showAddToCart
                isFavorite={true}
              />
            )
          })}
        </ProductGrid>
      )}
    </div>
  )
}
