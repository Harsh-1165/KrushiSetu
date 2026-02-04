"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import useSWR from "swr"
import {
  ShoppingCart,
  Heart,
  Wallet,
  Bell,
  ChevronRight,
  Star,
  Package,
  AlertCircle,
  Users,
  ArrowRight,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { StatsCard, StatsGrid } from "./stats-card"
import { ProductCard } from "./product-card"
import { NoOrders } from "./empty-state"
import { apiUrl, fetchWithAuth } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useWishlist } from "@/contexts/wishlist-context"

interface ConsumerDashboardProps {
  user: {
    name: { first: string; last: string }
  }
}

export function ConsumerDashboard({ user }: ConsumerDashboardProps) {
  const { items: wishlistItems } = useWishlist()

  // Helper fetcher
  const fetcher = (url: string) => fetchWithAuth(url).then(res => res.json())

  // 1. Fetch Orders List
  const { data: ordersData, isLoading: isLoadingOrders } = useSWR(
    apiUrl("/orders?limit=5"),
    fetcher,
    { refreshInterval: 60000 }
  )

  // 1b. Fetch Order Stats
  const { data: statsData, isLoading: isLoadingStats } = useSWR(
    apiUrl("/orders/stats"),
    fetcher,
    { refreshInterval: 60000 }
  )

  // 2. Fetch Active Alerts
  const { data: alertsData, isLoading: isLoadingAlerts } = useSWR(
    apiUrl("/mandi/alerts"),
    fetcher
  )

  // 3. Fetch Featured/Public Products
  const { data: productsData, isLoading: isLoadingProducts } = useSWR(
    apiUrl("/products/public?limit=8"),
    (url) => fetch(url).then(res => res.json())
  )

  const isLoading = isLoadingOrders || isLoadingAlerts || isLoadingProducts || isLoadingStats

  // Derived Values
  const orders = ordersData?.success && Array.isArray(ordersData.data.orders) ? ordersData.data.orders : []

  // Stats from backend
  const totalOrders = statsData?.success ? statsData.data.stats.totalOrders : (ordersData?.data?.pagination?.total ?? orders.length)
  const totalSpent = statsData?.success ? statsData.data.stats.totalAmount : orders.reduce((acc: number, order: any) => acc + (order.pricing?.total || 0), 0)

  const activeAlertsCount = alertsData?.success ? alertsData.data.count : 0
  const recentAlerts = alertsData?.success && Array.isArray(alertsData.data.data) ? alertsData.data.data : []
  const publicProducts = productsData?.success && Array.isArray(productsData.data.products) ? productsData.data.products : []

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {greeting()}, {user.name.first}!
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with your orders and favorites.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/products">
            Browse Products
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Quick Stats */}
      <StatsGrid>
        <StatsCard
          title="Total Orders"
          value={totalOrders}
          description="All time orders"
          icon={ShoppingCart}
          loading={isLoading}
        />
        <StatsCard
          title="Total Spent"
          value={`Rs. ${totalSpent.toLocaleString()}`}
          description="Recent spending"
          icon={Wallet}
          loading={isLoading}
        />
        <StatsCard
          title="Favorites"
          value={wishlistItems.length}
          description="Saved products"
          icon={Heart}
          loading={false} // Context is immediate
        />
        <StatsCard
          title="Active Alerts"
          value={activeAlertsCount}
          description="Price alerts set"
          icon={AlertCircle}
          loading={isLoadingAlerts}
        />
      </StatsGrid>

      {/* Featured Products Carousel */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Featured Products</CardTitle>
            <CardDescription>Fresh from our partner farms</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/products">
              View All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingProducts ? (
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[250px]">
                  <Skeleton className="aspect-square w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4 mt-3" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </div>
              ))}
            </div>
          ) : (
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {publicProducts.map((product: any) => (
                  <CarouselItem key={product._id} className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                    <ProductCard
                      product={product}
                      showFavorite
                      showAddToCart
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden sm:flex -left-4" />
              <CarouselNext className="hidden sm:flex -right-4" />
            </Carousel>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Your latest purchases</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/orders">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingOrders ? (
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-16 w-16 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order: any) => (
                  <div
                    key={order._id}
                    className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="relative h-14 w-14 rounded overflow-hidden bg-muted flex-shrink-0">
                      {order.items && order.items[0]?.product?.images?.[0] ? (
                        <Image
                          src={
                            (() => {
                              const img = order.items[0].product.images[0]
                              return typeof img === "string" ? img : (img as { url?: string })?.url
                            })() || "/placeholder.svg"
                          }
                          alt={order.items[0].product.name || "Product"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-1">
                        {order.items[0]?.product?.name || "Product"}
                        {order.items.length > 1 && ` +${order.items.length - 1} more`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.orderNumber}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant="secondary"
                        className={cn(
                          order.status === "delivered"
                            ? "bg-green-100 text-green-800"
                            : order.status === "shipped"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                        )}
                      >
                        {order.status}
                      </Badge>
                      <p className="text-sm font-semibold mt-1">
                        Rs. {(order?.pricing?.total ?? 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <NoOrders />
            )}
          </CardContent>
        </Card>

        {/* Recommended Products -> Now just showing more public products or reuse wishlist logic if needed */}
        {/* We can reuse publicProducts here but slice differently */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recommended For You</CardTitle>
              <CardDescription>Based on popular demand</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/products">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingProducts ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-16 w-16 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Show different slice of products or random ones */}
                {publicProducts.slice().reverse().slice(0, 4).map((product: any) => (
                  <Link
                    key={product._id}
                    href={`/dashboard/products/${product._id}`}
                    className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="relative h-14 w-14 rounded overflow-hidden bg-muted flex-shrink-0">
                      <Image
                        src={
                          (() => {
                            const img = product.images?.[0]
                            return typeof img === "string" ? img : (img as { url?: string })?.url
                          })() || "/placeholder.svg"
                        }
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-1">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.farmer?.farmerProfile?.farmName}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs">{product.ratings?.average || 0}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">Rs. {typeof product.price === 'object' ? product.price.current : product.price}</p>
                      <p className="text-xs text-muted-foreground">/{product.unit || (product.price as any)?.unit}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Saved Farms & Price Alerts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Saved Farms (Still Mocked) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Saved Farms
              </CardTitle>
              <CardDescription>Your favorite sellers</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/saved-farms">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-center py-6 text-muted-foreground">
              Feature coming soon
            </div>
          </CardContent>
        </Card>

        {/* Price Alerts (Real Data) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Price Alerts
              </CardTitle>
              <CardDescription>Get notified when prices drop</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/price-alerts">
                Manage
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingAlerts ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : recentAlerts.length > 0 ? (
              <div className="space-y-3">
                {recentAlerts.slice(0, 3).map((alert: any) => (
                  <div
                    key={alert._id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium text-sm">{alert.crop} {alert.variety ? `- ${alert.variety}` : ''}</p>
                      <p className="text-xs text-muted-foreground">
                        Alert when {alert.condition} Rs. {alert.targetPrice}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant="secondary"
                        className={cn(
                          alert.status === 'triggered'
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        )}
                      >
                        {alert.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground">
                No active price alerts
              </div>
            )}

            <Button variant="outline" className="w-full mt-4 bg-transparent" asChild>
              <Link href="/dashboard/price-alerts">
                <AlertCircle className="mr-2 h-4 w-4" />
                Manage Alerts
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
