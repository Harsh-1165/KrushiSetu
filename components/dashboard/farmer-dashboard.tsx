"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Package,
  ShoppingCart,
  TrendingUp,
  Star,
  AlertTriangle,
  Plus,
  ChevronRight,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  BarChart3,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts"
import { StatsCard, StatsGrid } from "./stats-card"
import { NoOrders, NoProducts } from "./empty-state"
import { useFarmerDashboardStats } from "@/lib/use-farmer-dashboard"
import { cn } from "@/lib/utils"

interface FarmerDashboardProps {
  user: {
    name: { first: string; last: string }
  }
}

export function FarmerDashboard({ user }: FarmerDashboardProps) {
  const { stats, isLoading: apiLoading, mutate } = useFarmerDashboardStats()
  const [showSkeleton, setShowSkeleton] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setShowSkeleton(false), 600)
    return () => clearTimeout(t)
  }, [])
  const isLoading = showSkeleton || apiLoading

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }

  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "var(--chart-1)",
    },
  }

  // Safe numbers to avoid NaN when stats are missing/undefined
  const totalProducts = Number(stats.totalProducts) || 0
  const activeProducts = Number(stats.activeProducts) || 0
  const pendingProducts = Number(stats.pendingProducts) || 0
  const inactiveCount = Math.max(0, totalProducts - activeProducts - pendingProducts)
  const pct = (n: number, d: number) => (d > 0 ? (n / d) * 100 : 0)

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {greeting()}, {user?.name?.first || "Farmer"}!
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s an overview of your farm&apos;s performance today.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      {/* Quick Stats */}
      <StatsGrid>
        <StatsCard
          title="Total Revenue"
          value={`Rs. ${stats.totalRevenue.toLocaleString()}`}
          description="from last month"
          icon={DollarSign}
          trend={{ value: 12.5, isPositive: true }}
          loading={isLoading}
        />
        <StatsCard
          title="Total Orders"
          value={stats.totalOrders}
          description={`${stats.pendingOrders} pending`}
          icon={ShoppingCart}
          trend={{ value: 8.2, isPositive: true }}
          loading={isLoading}
        />
        <StatsCard
          title="Active Products"
          value={stats.activeProducts}
          description={`${stats.pendingProducts} pending approval`}
          icon={Package}
          loading={isLoading}
        />
        <StatsCard
          title="Average Rating"
          value={stats.averageRating.toFixed(1)}
          description={`${stats.totalReviews} reviews`}
          icon={Star}
          loading={isLoading}
        />
      </StatsGrid>

      {/* Revenue Chart & Product Stats */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Revenue Chart */}
        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>Monthly revenue for the last 6 months</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/analytics">
                <BarChart3 className="mr-2 h-4 w-4" />
                Full Analytics
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : !stats.revenueData?.length ? (
              <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed bg-muted/30">
                <p className="text-sm text-muted-foreground">Revenue data will appear here once you have orders.</p>
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <AreaChart
                  data={stats.revenueData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    className="text-xs"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    className="text-xs"
                    tickFormatter={(value) => `Rs.${value / 1000}k`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    fill="url(#colorRevenue)"
                    fillOpacity={1}
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Product Distribution */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Product Status</CardTitle>
            <CardDescription>Current product distribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Active</span>
                    </div>
                    <span className="font-medium">{activeProducts}</span>
                  </div>
                  <Progress
                    value={pct(activeProducts, totalProducts)}
                    className="h-2 bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span>Pending</span>
                    </div>
                    <span className="font-medium">{pendingProducts}</span>
                  </div>
                  <Progress
                    value={pct(pendingProducts, totalProducts)}
                    className="h-2 bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-gray-400" />
                      <span>Inactive</span>
                    </div>
                    <span className="font-medium">{inactiveCount}</span>
                  </div>
                  <Progress
                    value={pct(inactiveCount, totalProducts)}
                    className="h-2 bg-muted"
                  />
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Products</span>
                    <span className="text-2xl font-bold">{totalProducts}</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Orders & Inventory */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Orders to Fulfill
                {stats.pendingOrders > 0 && (
                  <Badge variant="destructive">{stats.pendingOrders}</Badge>
                )}
              </CardTitle>
              <CardDescription>Orders waiting for your action</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/orders">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg border">
                    <Skeleton className="h-10 w-10 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            ) : stats.recentOrders.length > 0 ? (
              <div className="space-y-3">
                {stats.recentOrders.map((order) => (
                  <div
                    key={order._id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-semibold text-sm">
                          {order.buyer?.name?.first?.[0] || "?"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {order.buyer?.name?.first} {order.buyer?.name?.last}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.orderNumber} - {order.products?.[0]?.product?.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right mr-2">
                        <p className="font-semibold text-sm">
                          Rs. {order.totalAmount?.toLocaleString()}
                        </p>
                        <Badge
                          variant="secondary"
                          className={cn(
                            order.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                          )}
                        >
                          {order.status}
                        </Badge>
                      </div>
                      <Button size="sm" variant="outline" className="bg-transparent">
                        Process
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <NoOrders />
            )}
          </CardContent>
        </Card>

        {/* Inventory Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Inventory Alerts
              </CardTitle>
              <CardDescription>Products running low on stock</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/inventory">
                Manage Inventory
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                    <Skeleton className="h-10 w-10 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                    <Skeleton className="h-8 w-16" />
                  </div>
                ))}
              </div>
            ) : stats.inventoryAlerts.length > 0 ? (
              <div className="space-y-3">
                {stats.inventoryAlerts.map((product) => (
                  <div
                    key={product._id}
                    className="flex items-center justify-between p-3 rounded-lg border border-yellow-200 bg-yellow-50/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded bg-yellow-100 flex items-center justify-center">
                        <Package className="h-5 w-5 text-yellow-700" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-red-600 font-medium">
                          Only {product.quantity} {product.unit} left
                        </p>
                      </div>
                    </div>
                    <Button size="sm">Restock</Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
                <p className="font-medium">All stocked up!</p>
                <p className="text-sm text-muted-foreground">
                  Your inventory levels are healthy
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Products & Reviews */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Selling Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Selling Products
              </CardTitle>
              <CardDescription>Your best performers this month</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/products">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : stats.topProducts.length > 0 ? (
              <div className="space-y-4">
                {stats.topProducts.map((product, index) => (
                  <div
                    key={product._id}
                    className="flex items-center gap-3"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                      #{index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-1">{product.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Rs. {product.price}/{product.unit ?? "unit"}</span>
                        <span>-</span>
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {product.ratings?.average?.toFixed(1) ?? "-"}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant={product.status === "active" ? "default" : "secondary"}
                    >
                      {product.status ?? "active"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <NoProducts
                onAction={() => (window.location.href = "/dashboard/products/new")}
              />
            )}
          </CardContent>
        </Card>

        {/* Recent Reviews */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Farm Reviews
              </CardTitle>
              <CardDescription>What customers are saying</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/reviews">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {[
                  {
                    rating: 5,
                    text: "Excellent quality tomatoes! Fresh and organic. Will order again.",
                    author: "Priya S.",
                    product: "Organic Tomatoes",
                    date: "2 days ago",
                  },
                  {
                    rating: 4,
                    text: "Great rice quality. Delivery was a bit delayed but product is good.",
                    author: "Rahul K.",
                    product: "Basmati Rice",
                    date: "1 week ago",
                  },
                  {
                    rating: 5,
                    text: "Best potatoes I've ever bought online. Very fresh!",
                    author: "Anita M.",
                    product: "Fresh Potatoes",
                    date: "2 weeks ago",
                  },
                ].map((review, i) => (
                  <div key={i} className="p-3 rounded-lg border">
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star
                          key={j}
                          className={cn(
                            "h-3.5 w-3.5",
                            j < review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">&quot;{review.text}&quot;</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs font-medium">{review.author}</p>
                      <p className="text-xs text-muted-foreground">{review.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
