"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  RefreshCw,
  ArrowLeft,
  Calendar,
  BarChart3,
  LineChart as LineChartIcon,
  Info,
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
} from "recharts"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import {
  priceApi,
  type PriceTrend,
  type PriceStats,
  COMMON_CROPS,
  INDIAN_STATES,
  formatPrice,
  formatDate,
  getPriceChangeColor,
} from "@/lib/market-api"

type Period = "24h" | "7d" | "30d" | "90d" | "1y"

interface TrendData {
  crop: string
  variety: string
  period: string
  startDate: string
  endDate: string
  trends: PriceTrend[]
  statistics: PriceStats & { priceChange: number; trend: "up" | "down" | "stable" }
}

function TrendSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="bg-background border rounded-lg shadow-lg p-3">
      <p className="text-sm font-medium mb-2">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {formatPrice(entry.value)}
        </p>
      ))}
    </div>
  )
}

const Loading = () => null

export default function PriceTrendsPage() {
  const searchParams = useSearchParams()
  const initialCrop = searchParams.get("crop") || "Rice"
  
  const [crop, setCrop] = useState(initialCrop)
  const [state, setState] = useState("")
  const [period, setPeriod] = useState<Period>("7d")
  const [chartType, setChartType] = useState<"line" | "area">("area")
  const [trendData, setTrendData] = useState<TrendData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchTrends = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true)
      else setLoading(true)

      const response = await priceApi.getTrends({
        crop,
        state: state || undefined,
        period,
      })

      setTrendData(response.data)
    } catch (error) {
      console.log("[v0] Error fetching trends:", error)
      // Generate mock data for demonstration
      const mockTrends = generateMockTrendData(crop, period)
      setTrendData(mockTrends)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [crop, state, period])

  useEffect(() => {
    fetchTrends()
  }, [fetchTrends])

  const handleExportCSV = () => {
    if (!trendData?.trends) return

    const headers = ["Date", "Min Price", "Max Price", "Modal Price", "Total Arrival"]
    const rows = trendData.trends.map(t => [
      formatDate(t.date),
      t.avgMinPrice.toFixed(2),
      t.avgMaxPrice.toFixed(2),
      t.avgModalPrice.toFixed(2),
      t.totalArrival.toString()
    ])

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${crop}-price-trends-${period}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const chartData = trendData?.trends.map(t => ({
    date: new Date(t.date).toLocaleDateString("en-IN", { 
      day: "numeric", 
      month: "short",
      ...(period === "1y" || period === "90d" ? { year: "2-digit" } : {})
    }),
    minPrice: t.avgMinPrice,
    maxPrice: t.avgMaxPrice,
    modalPrice: t.avgModalPrice,
    arrival: t.totalArrival,
  })) || []

  const avgPrice = trendData?.statistics?.avgPrice || 
    (chartData.length > 0 ? chartData.reduce((acc, d) => acc + d.modalPrice, 0) / chartData.length : 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/market-prices">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Price Trends</h1>
            <p className="text-muted-foreground">
              Analyze historical price movements and patterns
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchTrends(true)} disabled={refreshing}>
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!trendData}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Select value={crop} onValueChange={setCrop}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Select Crop" />
              </SelectTrigger>
              <SelectContent>
                {COMMON_CROPS.slice(0, 30).map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={state} onValueChange={setState}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All States" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {INDIAN_STATES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)} className="flex-1">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="24h">24H</TabsTrigger>
                <TabsTrigger value="7d">7D</TabsTrigger>
                <TabsTrigger value="30d">30D</TabsTrigger>
                <TabsTrigger value="90d">90D</TabsTrigger>
                <TabsTrigger value="1y">1Y</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-1 border rounded-md p-1">
              <Button
                variant={chartType === "line" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setChartType("line")}
              >
                <LineChartIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={chartType === "area" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setChartType("area")}
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <TrendSkeleton />
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Average Price</p>
                    <p className="text-2xl font-bold">{formatPrice(avgPrice)}</p>
                  </div>
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Average modal price over the selected period
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Price Change</p>
                    <div className={cn("flex items-center gap-1", getPriceChangeColor(trendData?.statistics?.priceChange || 0))}>
                      {(trendData?.statistics?.priceChange || 0) > 0 ? (
                        <TrendingUp className="h-5 w-5" />
                      ) : (trendData?.statistics?.priceChange || 0) < 0 ? (
                        <TrendingDown className="h-5 w-5" />
                      ) : (
                        <Minus className="h-5 w-5" />
                      )}
                      <span className="text-2xl font-bold">
                        {Math.abs(trendData?.statistics?.priceChange || 0).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Price Range</p>
                  <p className="text-lg font-semibold">
                    {formatPrice(trendData?.statistics?.minPrice || Math.min(...chartData.map(d => d.minPrice)))} - {formatPrice(trendData?.statistics?.maxPrice || Math.max(...chartData.map(d => d.maxPrice)))}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Arrival</p>
                  <p className="text-2xl font-bold">
                    {((trendData?.statistics?.totalArrival || chartData.reduce((acc, d) => acc + d.arrival, 0)) / 1000).toFixed(1)}K
                  </p>
                  <p className="text-xs text-muted-foreground">quintals</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Price Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{crop} Price Trends</CardTitle>
                  <CardDescription>
                    {state ? `${state} - ` : "All India - "}
                    {period === "24h" ? "Last 24 Hours" :
                     period === "7d" ? "Last 7 Days" :
                     period === "30d" ? "Last 30 Days" :
                     period === "90d" ? "Last 90 Days" : "Last 1 Year"}
                  </CardDescription>
                </div>
                <Badge variant={
                  (trendData?.statistics?.trend || "stable") === "up" ? "default" :
                  (trendData?.statistics?.trend || "stable") === "down" ? "destructive" : "secondary"
                }>
                  {(trendData?.statistics?.trend || "stable") === "up" ? "Uptrend" :
                   (trendData?.statistics?.trend || "stable") === "down" ? "Downtrend" : "Stable"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "area" ? (
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorModal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorMin" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorMax" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `₹${value}`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <ReferenceLine y={avgPrice} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" label="Avg" />
                      <Area
                        type="monotone"
                        dataKey="minPrice"
                        name="Min Price"
                        stroke="hsl(142, 76%, 36%)"
                        fill="url(#colorMin)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="modalPrice"
                        name="Modal Price"
                        stroke="hsl(var(--primary))"
                        fill="url(#colorModal)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="maxPrice"
                        name="Max Price"
                        stroke="hsl(0, 84%, 60%)"
                        fill="url(#colorMax)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  ) : (
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `₹${value}`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <ReferenceLine y={avgPrice} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" />
                      <Line
                        type="monotone"
                        dataKey="minPrice"
                        name="Min Price"
                        stroke="hsl(142, 76%, 36%)"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="modalPrice"
                        name="Modal Price"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="maxPrice"
                        name="Max Price"
                        stroke="hsl(0, 84%, 60%)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Arrival Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Market Arrivals</CardTitle>
              <CardDescription>Total quantity arriving at mandis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorArrival" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toLocaleString()} quintals`, "Arrival"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="arrival"
                      name="Arrival"
                      stroke="hsl(var(--chart-2))"
                      fill="url(#colorArrival)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

// Generate mock data for demonstration
function generateMockTrendData(crop: string, period: Period): TrendData {
  const days = period === "24h" ? 24 : period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365
  const basePrice = Math.random() * 2000 + 1500
  const trends: PriceTrend[] = []

  for (let i = days; i >= 0; i--) {
    const date = new Date()
    if (period === "24h") {
      date.setHours(date.getHours() - i)
    } else {
      date.setDate(date.getDate() - i)
    }

    const variance = (Math.random() - 0.5) * 200
    const modalPrice = basePrice + variance + (i * (Math.random() - 0.4) * 5)
    
    trends.push({
      date: date.toISOString(),
      avgMinPrice: modalPrice * 0.9,
      avgMaxPrice: modalPrice * 1.1,
      avgModalPrice: modalPrice,
      totalArrival: Math.floor(Math.random() * 5000) + 1000,
      priceCount: Math.floor(Math.random() * 50) + 10,
      highestPrice: modalPrice * 1.15,
      lowestPrice: modalPrice * 0.85,
    })
  }

  const firstPrice = trends[0].avgModalPrice
  const lastPrice = trends[trends.length - 1].avgModalPrice
  const priceChange = ((lastPrice - firstPrice) / firstPrice) * 100

  return {
    crop,
    variety: "All varieties",
    period,
    startDate: trends[0].date,
    endDate: trends[trends.length - 1].date,
    trends,
    statistics: {
      avgMinPrice: trends.reduce((acc, t) => acc + t.avgMinPrice, 0) / trends.length,
      avgMaxPrice: trends.reduce((acc, t) => acc + t.avgMaxPrice, 0) / trends.length,
      avgModalPrice: trends.reduce((acc, t) => acc + t.avgModalPrice, 0) / trends.length,
      minPrice: Math.min(...trends.map(t => t.lowestPrice)),
      maxPrice: Math.max(...trends.map(t => t.highestPrice)),
      totalArrival: trends.reduce((acc, t) => acc + t.totalArrival, 0),
      priceCount: trends.reduce((acc, t) => acc + t.priceCount, 0),
      marketCount: Math.floor(Math.random() * 50) + 20,
      priceChange,
      trend: priceChange > 2 ? "up" : priceChange < -2 ? "down" : "stable",
    },
  }
}
