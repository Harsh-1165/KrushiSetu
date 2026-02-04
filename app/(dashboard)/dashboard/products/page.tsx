"use client"

import { fetchWithAuth, apiUrl } from "@/lib/api"
import { ProductCard, ProductGrid, ProductGridSkeleton } from "@/components/dashboard/product-card"
import { NoProducts } from "@/components/dashboard/empty-state"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect, useState } from "react"

type Product = {
  _id: string
  name: string
  price: number | { current: number; unit?: string }
  unit?: string
  images?: string[]
  ratings?: { average?: number; count?: number }
  quantity?: number
  inventory?: { available?: number }
  status?: string
  isOrganic?: boolean
}

export default function FarmerProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const meRes = await fetchWithAuth(apiUrl("/auth/me"))
        if (!meRes.ok || cancelled) return
        const meData = await meRes.json()
        const userId = meData?.data?.user?._id ?? meData?.user?._id
        if (!userId || cancelled) {
          setProducts([])
          return
        }
        const res = await fetchWithAuth(apiUrl(`/products?seller=${userId}&limit=100`))
        if (!res.ok || cancelled) {
          setProducts([])
          return
        }
        const json = await res.json()
        const list = json?.data?.products ?? []
        setProducts(
          list.map((p: Record<string, unknown>) => ({
            _id: String(p._id),
            name: String(p.name ?? ""),
            price: (p.price as { current?: number })?.current ?? p.price,
            unit: (p.price as { unit?: string })?.unit ?? "kg",
            images: Array.isArray(p.images) ? p.images : p.primaryImage ? [p.primaryImage] : ["/placeholder.svg"],
            ratings: (p.ratings as Product["ratings"]) ?? {},
            quantity: (p.inventory as { available?: number })?.available ?? (p as { quantity?: number }).quantity,
            status: String(p.status ?? "available"),
            isOrganic: (p.attributes as { isOrganic?: boolean })?.isOrganic ?? false,
          }))
        )
      } catch {
        if (!cancelled) setProducts([])
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Products</h1>
          <p className="text-muted-foreground">
            Manage all the products you&apos;re selling on GreenTrace.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/products/new">Add Product</Link>
        </Button>
      </div>

      {isLoading ? (
        <ProductGridSkeleton count={6} />
      ) : products.length === 0 ? (
        <NoProducts onAction={() => {}} />
      ) : (
        <ProductGrid>
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              showStatus
              showInventory
            />
          ))}
        </ProductGrid>
      )}
    </div>
  )
}

