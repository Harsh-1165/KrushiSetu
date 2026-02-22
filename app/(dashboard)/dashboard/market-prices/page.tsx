"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

import {
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  MapPin,
  Calendar,
  BarChart3,
  Bell,
  ChevronRight,
  ArrowUpDown,
  X,
  Wheat,
  Building,
  IndianRupee,
  Package,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  priceApi,
  type MandiPrice,
  type Pagination,
  COMMON_CROPS,
  INDIAN_STATES,
  formatPrice,
  formatPricePerQuintal,
  formatQuantity,
  getPriceChangeColor,
  getPriceChangeBgColor,
  getTrendIndicator,
  formatDate,
  formatTimeAgo,
} from "@/lib/market-api"

// Price Row Component
function PriceRow({ price }: { price: MandiPrice }) {
  const trend = getTrendIndicator(price.priceChange24h)
  const mandi = typeof price.mandi === "object" ? price.mandi : null

  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell>
        <div className="font-medium">{price.crop}</div>
        {price.variety && (
          <div className="text-xs text-muted-foreground">{price.variety}</div>
        )}
        {price.source && price.source.includes("Agmarknet") && (
          <Badge variant="outline" className="mt-1 text-[10px] h-5 border-blue-200 text-blue-700 bg-blue-50">
            GOVT DATA
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <span>{mandi?.name || "N/A"}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {price.district}, {price.state}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="text-muted-foreground">{formatPrice(price.minPrice)}</div>
      </TableCell>
      <TableCell className="text-right">
        <div className="text-muted-foreground">{formatPrice(price.maxPrice)}</div>
      </TableCell>
      <TableCell className="text-right">
        <div className={cn("font-semibold", getPriceChangeColor(price.priceChange24h))}>
          {formatPricePerQuintal(price.modalPrice)}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className={cn("flex items-center justify-end gap-1", getPriceChangeColor(price.priceChange24h))}>
          {trend === "up" ? (
            <TrendingUp className="h-4 w-4" />
          ) : trend === "down" ? (
            <TrendingDown className="h-4 w-4" />
          ) : (
            <Minus className="h-4 w-4" />
          )}
          <span>{Math.abs(price.priceChange24h).toFixed(2)}%</span>
        </div>
      </TableCell>
      <TableCell className="text-right">
        {price.arrivalQuantity > 0 ? (
          formatQuantity(price.arrivalQuantity, price.arrivalUnit)
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs text-muted-foreground cursor-help">
                {formatTimeAgo(price.priceDate)}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {formatDate(price.priceDate)}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/market-prices/${price._id}`}>
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/market-prices/trends?crop=${price.crop}`}>
                View Trends
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/market-prices/alerts/new?crop=${price.crop}&price=${price.modalPrice}`}>
                Set Alert
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

// Price Card (Mobile)
function PriceCard({ price }: { price: MandiPrice }) {
  const trend = getTrendIndicator(price.priceChange24h)
  const mandi = typeof price.mandi === "object" ? price.mandi : null

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold">{price.crop}</h3>
            {price.variety && (
              <p className="text-sm text-muted-foreground">{price.variety}</p>
            )}
            {price.source && price.source.includes("Agmarknet") && (
              <Badge variant="outline" className="mt-1 text-[10px] h-5 border-blue-200 text-blue-700 bg-blue-50">
                GOVT DATA
              </Badge>
            )}
          </div>
          <Badge className={cn(getPriceChangeBgColor(price.priceChange24h), "gap-1")}>
            {trend === "up" ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : trend === "down" ? (
              <ArrowDownRight className="h-3 w-3" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
            {Math.abs(price.priceChange24h).toFixed(2)}%
          </Badge>
        </div>

        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
          <MapPin className="h-3 w-3" />
          <span>{mandi?.name || "N/A"}, {price.district}</span>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-3">
          <div>
            <p className="text-xs text-muted-foreground">Min</p>
            <p className="font-medium">{formatPrice(price.minPrice)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Max</p>
            <p className="font-medium">{formatPrice(price.maxPrice)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Modal</p>
            <p className="font-semibold text-primary">{formatPrice(price.modalPrice)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
          <span className="text-xs text-muted-foreground">
            {formatTimeAgo(price.priceDate)}
          </span>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/dashboard/market-prices/${price._id}`}>
              Details <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Loading Skeleton
function TableSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  )
}

function CardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-16 mt-1" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="h-4 w-40 mb-3" />
        <div className="grid grid-cols-3 gap-4 mb-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        <Skeleton className="h-8 w-full" />
      </CardContent>
    </Card>
  )
}

// Main Component
function MarketPricesContent() {
  const searchParams = useSearchParams()

  const [prices, setPrices] = useState<MandiPrice[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Real-Time Mode
  const [isRealTime, setIsRealTime] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)

  // Filters
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [crop, setCrop] = useState(searchParams.get("crop") || "")
  const [state, setState] = useState(searchParams.get("state") || "")
  const [sortBy, setSortBy] = useState<"price" | "arrival" | "date" | "crop">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(10000)
  const [page, setPage] = useState(1)

  // Stats
  const [stats, setStats] = useState({
    totalPrices: 0,
    avgPrice: 0,
    pricesUp: 0,
    pricesDown: 0,
  })

  // Detect Location for Real-Time
  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser")
      return
    }

    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          // Simple reverse geocoding via free API (BigDataCloud)
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          )
          const data = await res.json()
          if (data.principalSubdivision) {
            setState(data.principalSubdivision)
            setIsRealTime(true)
          }
        } catch (error) {
          console.error("Location error:", error)
        } finally {
          setLocationLoading(false)
        }
      },
      (error) => {
        console.error("Geolocation error:", error)
        setLocationLoading(false)
      }
    )
  }

  const fetchPrices = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true)
      else setLoading(true)

      let data: MandiPrice[] = []
      let total = 0

      if (isRealTime) {
        // Fetch Real-Time Govt Data
        const response = await priceApi.getRealTimePrices({
          state,
          commodity: crop,
          limit: 100
        })
        data = response.data
        total = response.count
        setPagination({
          page: 1, limit: 100, total, pages: 1, hasMore: false
        })
      } else {
        // Fetch Internal GreenTrace Data
        const params: Record<string, string | number> = {
          page,
          limit: 20,
          sortBy,
          sortOrder,
        }

        if (crop) params.crop = crop
        if (state) params.state = state
        if (minPrice > 0) params.minPrice = minPrice
        if (maxPrice < 10000) params.maxPrice = maxPrice

        const response = await priceApi.getAll(params)
        data = response.data
        setPagination(response.pagination)

        // Smart auto-switch: if MongoDB has no data, fall back to live Agmarknet
        if (data.length === 0) {
          console.info("[GreenTrace] No prices in local DB — switching to Live Govt. Market Prices (Agmarknet)")
          const realTimeResponse = await priceApi.getRealTimePrices({
            state: state || undefined,
            commodity: crop || undefined,
            limit: 100
          })
          data = realTimeResponse.data
          total = realTimeResponse.count
          setPagination({ page: 1, limit: 100, total, pages: 1, hasMore: false })
          setIsRealTime(true) // Reflect state in UI toggle
        }
      }

      setPrices(data)

      // Calculate stats
      if (data.length > 0) {
        const totalUp = data.filter(p => (p.priceChange24h || 0) > 0).length
        const totalDown = data.filter(p => (p.priceChange24h || 0) < 0).length
        const avgPrice = data.reduce((acc, p) => acc + p.modalPrice, 0) / data.length

        setStats({
          totalPrices: total,
          avgPrice,
          pricesUp: totalUp,
          pricesDown: totalDown,
        })
      } else {
        setStats({ totalPrices: 0, avgPrice: 0, pricesUp: 0, pricesDown: 0 })
      }

    } catch (error) {
      console.log("Error fetching prices:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [page, crop, state, sortBy, sortOrder, minPrice, maxPrice, isRealTime])


  useEffect(() => {
    fetchPrices()
  }, [fetchPrices])

  const handleRefresh = () => {
    fetchPrices(true)
  }

  const clearFilters = () => {
    setCrop("")
    setState("")
    setMinPrice(0)
    setMaxPrice(10000)
    setSortBy("date")
    setSortOrder("desc")
  }

  const hasActiveFilters = crop || state || minPrice > 0 || maxPrice < 10000

  // Filter by search locally
  const filteredPrices = search
    ? prices.filter(
      (p) =>
        p.crop.toLowerCase().includes(search.toLowerCase()) ||
        p.variety?.toLowerCase().includes(search.toLowerCase()) ||
        p.state.toLowerCase().includes(search.toLowerCase()) ||
        p.district.toLowerCase().includes(search.toLowerCase())
    )
    : prices

  const handleExport = async () => {
    try {
      const blob = await priceApi.exportCSV({ crop, state })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `market-prices-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.log("Error exporting CSV:", error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Market Prices
            {isRealTime && <Badge className="bg-blue-600 hover:bg-blue-700">Live Govt Data</Badge>}
          </h1>
          <p className="text-muted-foreground">
            {isRealTime
              ? "Real-time mandi prices sourced directly from Agmarknet (Govt of India)"
              : "Real-time agricultural commodity prices from mandis across India"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isRealTime ? "default" : "outline"}
            size="sm"
            onClick={() => setIsRealTime(!isRealTime)}
            className={cn(isRealTime && "bg-blue-600 hover:bg-blue-700")}
          >
            <Building className="h-4 w-4 mr-2" />
            {isRealTime ? "Show GreenTrace Data" : "Show Govt. Real-Time"}
          </Button>

          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm" asChild>
            <Link href="/dashboard/market-prices/alerts">
              <Bell className="h-4 w-4 mr-2" />
              Alerts
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Prices</p>
                <p className="text-2xl font-bold">{stats.totalPrices.toLocaleString()}</p>
              </div>
              <Package className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Price</p>
                <p className="text-2xl font-bold">{formatPrice(stats.avgPrice)}</p>
              </div>
              <IndianRupee className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Prices Up</p>
                <p className="text-2xl font-bold text-green-600">{stats.pricesUp}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Prices Down</p>
                <p className="text-2xl font-bold text-red-600">{stats.pricesDown}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild className="bg-transparent">
          <Link href="/dashboard/market-prices/trends">
            <BarChart3 className="h-4 w-4 mr-2" />
            Price Trends
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild className="bg-transparent">
          <Link href="/dashboard/market-prices/mandis">
            <Building className="h-4 w-4 mr-2" />
            Mandi Finder
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild className="bg-transparent">
          <Link href="/dashboard/market-prices/compare">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            Compare Prices
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild className="bg-transparent">
          <Link href="/dashboard/market-prices/predictions">
            <TrendingUp className="h-4 w-4 mr-2" />
            Price Predictions
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search & Location */}
            <div className="relative flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by crop, variety, location..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleUseLocation}
                disabled={locationLoading}
                title="Use My Location"
              >
                <MapPin className={cn("h-4 w-4", locationLoading && "animate-pulse text-blue-600")} />
              </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Select value={crop} onValueChange={setCrop}>
                <SelectTrigger className="w-40">
                  <Wheat className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Crop" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Crops</SelectItem>
                  {COMMON_CROPS.slice(0, 30).map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={state} onValueChange={setState}>
                <SelectTrigger className="w-44">
                  <MapPin className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {INDIAN_STATES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={`${sortBy}-${sortOrder}`}
                onValueChange={(v) => {
                  const [by, order] = v.split("-")
                  setSortBy(by as typeof sortBy)
                  setSortOrder(order as typeof sortOrder)
                }}
              >
                <SelectTrigger className="w-40">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Latest First</SelectItem>
                  <SelectItem value="date-asc">Oldest First</SelectItem>
                  <SelectItem value="price-desc">Price High-Low</SelectItem>
                  <SelectItem value="price-asc">Price Low-High</SelectItem>
                  <SelectItem value="arrival-desc">Arrival High-Low</SelectItem>
                  <SelectItem value="crop-asc">Crop A-Z</SelectItem>
                </SelectContent>
              </Select>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="bg-transparent">
                    <Filter className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Advanced Filters</SheetTitle>
                    <SheetDescription>
                      Refine your price search
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 space-y-6">
                    <div className="space-y-4">
                      <Label>
                        Price Range: {formatPrice(minPrice)} - {formatPrice(maxPrice)}
                      </Label>
                      <div className="pt-2">
                        <Slider
                          value={[minPrice, maxPrice]}
                          onValueChange={([min, max]) => {
                            setMinPrice(min)
                            setMaxPrice(max)
                          }}
                          min={0}
                          max={10000}
                          step={100}
                        />
                      </div>
                    </div>
                    <Separator />
                    <Button
                      variant="outline"
                      className="w-full bg-transparent"
                      onClick={clearFilters}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Clear All Filters
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {crop && crop !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {crop}
                  <button onClick={() => setCrop("")} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {state && state !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {state}
                  <button onClick={() => setState("")} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {(minPrice > 0 || maxPrice < 10000) && (
                <Badge variant="secondary" className="gap-1">
                  {formatPrice(minPrice)} - {formatPrice(maxPrice)}
                  <button
                    onClick={() => {
                      setMinPrice(0)
                      setMaxPrice(10000)
                    }}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground"
              >
                Clear all
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Price Table (Desktop) */}
      <div className="hidden lg:block">
        <Card>
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Price Table</CardTitle>
                <CardDescription>
                  Showing {filteredPrices.length} of {pagination?.total || 0} prices
                </CardDescription>
              </div>
              <div className="text-sm text-muted-foreground">
                Last updated: {formatTimeAgo(new Date().toISOString())}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <TableSkeleton />
            ) : filteredPrices.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">No prices found</p>
                <Button variant="outline" className="mt-4 bg-transparent" onClick={clearFilters}>
                  Clear filters
                </Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Crop</TableHead>
                      <TableHead>Mandi</TableHead>
                      <TableHead className="text-right">Min (per q)</TableHead>
                      <TableHead className="text-right">Max (per q)</TableHead>
                      <TableHead className="text-right">Modal Price</TableHead>
                      <TableHead className="text-right">Change</TableHead>
                      <TableHead className="text-right">Arrival</TableHead>
                      <TableHead className="text-right">Updated</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPrices.map((price) => (
                      <PriceRow key={price._id} price={price} />
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Page {pagination.page} of {pagination.pages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                        className="bg-transparent"
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!pagination.hasMore}
                        onClick={() => setPage(page + 1)}
                        className="bg-transparent"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Price Cards (Mobile) */}
      <div className="lg:hidden space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredPrices.length} prices
          </p>
        </div>

        {loading ? (
          <div className="grid gap-4">
            {[...Array(6)].map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : filteredPrices.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">No prices found</p>
              <Button variant="outline" className="mt-4 bg-transparent" onClick={clearFilters}>
                Clear filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4">
              {filteredPrices.map((price) => (
                <PriceCard key={price._id} price={price} />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.pages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="bg-transparent"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasMore}
                    onClick={() => setPage(page + 1)}
                    className="bg-transparent"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Loading component for Suspense
function Loading() {
  return null
}

export default function MarketPricesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <MarketPricesContent />
    </Suspense>
  )
}
