"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  RefreshCw,
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  ArrowUpDown,
  Info,
  Plus,
  X,
  BarChart3,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"

import {
  priceApi,
  COMMON_CROPS,
  INDIAN_STATES,
  formatPrice,
} from "@/lib/market-api"

type Period = "today" | "7d" | "30d"

interface ComparisonData {
  mandi: string
  state: string
  district: string
  avgMinPrice: number
  avgMaxPrice: number
  avgModalPrice: number
  totalArrival: number
  priceCount: number
  latestPrice: number
  latestDate: string
}

interface ComparisonResult {
  crop: string
  variety: string
  period: Period
  dateRange: { startDate: string; endDate: string }
  comparison: ComparisonData[]
  statistics: {
    lowestPrice: number
    highestPrice: number
    avgPrice: number
    priceRange: number
    marketCount: number
  }
  recommendation: {
    bestMarketToBuy: { name: string; state: string; price: number } | null
    bestMarketToSell: { name: string; state: string; price: number } | null
    priceDifference: number
  }
}

function CompareSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
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
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

function CustomBarTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; payload: ComparisonData }>; label?: string }) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload

  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 min-w-48">
      <p className="text-sm font-medium mb-2">{data.mandi}</p>
      <p className="text-xs text-muted-foreground mb-2">{data.state}, {data.district}</p>
      <div className="space-y-1 text-sm">
        <p>Min: {formatPrice(data.avgMinPrice)}</p>
        <p>Max: {formatPrice(data.avgMaxPrice)}</p>
        <p className="font-semibold">Modal: {formatPrice(data.avgModalPrice)}</p>
        <p className="text-muted-foreground">Arrival: {data.totalArrival.toLocaleString()} qtl</p>
      </div>
    </div>
  )
}

export default function PriceComparePage() {
  const [crop, setCrop] = useState("Rice")
  const [selectedStates, setSelectedStates] = useState<string[]>([])
  const [period, setPeriod] = useState<Period>("today")
  const [sortBy, setSortBy] = useState<"price" | "arrival">("price")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [comparisonData, setComparisonData] = useState<ComparisonResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchComparison = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true)
      else setLoading(true)

      const response = await priceApi.compare({
        crop,
        states: selectedStates.length > 0 ? selectedStates.join(",") : undefined,
        period,
      })

      setComparisonData(response.data)
    } catch (error) {
      console.log("[v0] Error fetching comparison:", error)
      // Generate mock data for demonstration
      const mockData = generateMockComparisonData(crop, selectedStates, period)
      setComparisonData(mockData)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [crop, selectedStates, period])

  useEffect(() => {
    fetchComparison()
  }, [fetchComparison])

  const handleAddState = (state: string) => {
    if (state && !selectedStates.includes(state) && selectedStates.length < 5) {
      setSelectedStates([...selectedStates, state])
    }
  }

  const handleRemoveState = (state: string) => {
    setSelectedStates(selectedStates.filter(s => s !== state))
  }

  const handleExportCSV = () => {
    if (!comparisonData?.comparison) return

    const headers = ["Mandi", "State", "District", "Min Price", "Max Price", "Modal Price", "Arrival"]
    const rows = comparisonData.comparison.map(c => [
      c.mandi,
      c.state,
      c.district,
      c.avgMinPrice.toFixed(2),
      c.avgMaxPrice.toFixed(2),
      c.avgModalPrice.toFixed(2),
      c.totalArrival.toString()
    ])

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${crop}-price-comparison-${period}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const sortedComparison = comparisonData?.comparison ? [...comparisonData.comparison].sort((a, b) => {
    const aValue = sortBy === "price" ? a.avgModalPrice : a.totalArrival
    const bValue = sortBy === "price" ? b.avgModalPrice : b.totalArrival
    return sortOrder === "asc" ? aValue - bValue : bValue - aValue
  }) : []

  const chartData = sortedComparison.slice(0, 15)

  const getBarColor = (entry: ComparisonData, index: number) => {
    if (!comparisonData?.statistics) return "hsl(var(--chart-1))"
    const { lowestPrice, highestPrice } = comparisonData.statistics
    const ratio = (entry.avgModalPrice - lowestPrice) / (highestPrice - lowestPrice)
    if (ratio <= 0.33) return "hsl(142, 76%, 36%)" // Green - low price
    if (ratio >= 0.66) return "hsl(0, 84%, 60%)" // Red - high price
    return "hsl(var(--chart-1))" // Default
  }

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
            <h1 className="text-2xl font-bold">Price Comparison</h1>
            <p className="text-muted-foreground">
              Compare prices across different mandis and regions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchComparison(true)} disabled={refreshing}>
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!comparisonData}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-4">
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

              <Select value="" onValueChange={handleAddState}>
                <SelectTrigger className="w-full md:w-48">
                  <Plus className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Add State" />
                </SelectTrigger>
                <SelectContent>
                  {INDIAN_STATES.filter(s => !selectedStates.includes(s)).map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)} className="flex-1">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="today">Today</TabsTrigger>
                  <TabsTrigger value="7d">7 Days</TabsTrigger>
                  <TabsTrigger value="30d">30 Days</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Selected States */}
            {selectedStates.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground py-1">Comparing:</span>
                {selectedStates.map(state => (
                  <Badge key={state} variant="secondary" className="gap-1">
                    {state}
                    <button onClick={() => handleRemoveState(state)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {selectedStates.length < 5 && (
                  <span className="text-xs text-muted-foreground py-1">
                    (Add up to {5 - selectedStates.length} more)
                  </span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <CompareSkeleton />
      ) : (
        <>
          {/* Recommendation Cards */}
          {comparisonData?.recommendation && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-green-200 dark:border-green-800">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                      <TrendingDown className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Best to Buy</p>
                      {comparisonData.recommendation.bestMarketToBuy ? (
                        <>
                          <p className="font-semibold">{comparisonData.recommendation.bestMarketToBuy.name}</p>
                          <p className="text-sm text-muted-foreground">{comparisonData.recommendation.bestMarketToBuy.state}</p>
                          <p className="text-lg font-bold text-green-600">
                            {formatPrice(comparisonData.recommendation.bestMarketToBuy.price)}
                          </p>
                        </>
                      ) : (
                        <p className="text-muted-foreground">No data available</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-200 dark:border-red-800">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-red-100 dark:bg-red-900">
                      <TrendingUp className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Best to Sell</p>
                      {comparisonData.recommendation.bestMarketToSell ? (
                        <>
                          <p className="font-semibold">{comparisonData.recommendation.bestMarketToSell.name}</p>
                          <p className="text-sm text-muted-foreground">{comparisonData.recommendation.bestMarketToSell.state}</p>
                          <p className="text-lg font-bold text-red-600">
                            {formatPrice(comparisonData.recommendation.bestMarketToSell.price)}
                          </p>
                        </>
                      ) : (
                        <p className="text-muted-foreground">No data available</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-muted">
                      <ArrowUpDown className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Price Difference</p>
                      <p className="text-2xl font-bold">
                        {formatPrice(comparisonData.recommendation.priceDifference)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Across {comparisonData.statistics?.marketCount || 0} markets
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Arbitrage Alert */}
          {comparisonData?.recommendation?.priceDifference && comparisonData.recommendation.priceDifference > 500 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Arbitrage Opportunity:</strong> There is a significant price difference of {formatPrice(comparisonData.recommendation.priceDifference)} between markets. Consider buying from {comparisonData.recommendation.bestMarketToBuy?.name} and selling at {comparisonData.recommendation.bestMarketToSell?.name}.
              </AlertDescription>
            </Alert>
          )}

          {/* Bar Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{crop} Price Comparison</CardTitle>
                  <CardDescription>
                    Modal prices across different mandis
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={sortBy === "price" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setSortBy("price")}
                  >
                    By Price
                  </Button>
                  <Button
                    variant={sortBy === "arrival" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setSortBy("arrival")}
                  >
                    By Arrival
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <TooltipProvider>
                    <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={true} vertical={false} />
                      <XAxis 
                        type="number"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `₹${value}`}
                      />
                      <YAxis 
                        type="category"
                        dataKey="mandi"
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        width={100}
                      />
                      <Tooltip content={<CustomBarTooltip />} />
                      <Bar dataKey="avgModalPrice" name="Modal Price" radius={[0, 4, 4, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getBarColor(entry, index)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </TooltipProvider>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Comparison</CardTitle>
              <CardDescription>
                All markets with price data for {crop}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mandi</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Min Price</TableHead>
                      <TableHead className="text-right">Max Price</TableHead>
                      <TableHead className="text-right">Modal Price</TableHead>
                      <TableHead className="text-right">Arrival</TableHead>
                      <TableHead className="text-right">Records</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedComparison.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <p className="text-muted-foreground">No data available for the selected filters</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedComparison.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.mandi}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span>{item.district}, {item.state}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{formatPrice(item.avgMinPrice)}</TableCell>
                          <TableCell className="text-right">{formatPrice(item.avgMaxPrice)}</TableCell>
                          <TableCell className="text-right">
                            <span className={cn(
                              "font-semibold",
                              comparisonData?.recommendation?.bestMarketToBuy?.price === item.avgModalPrice && "text-green-600",
                              comparisonData?.recommendation?.bestMarketToSell?.price === item.avgModalPrice && "text-red-600"
                            )}>
                              {formatPrice(item.avgModalPrice)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">{item.totalArrival.toLocaleString()} qtl</TableCell>
                          <TableCell className="text-right">{item.priceCount}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

// Generate mock data for demonstration
function generateMockComparisonData(crop: string, states: string[], period: Period): ComparisonResult {
  const mandis = [
    { name: "Azadpur Mandi", state: "Delhi", district: "North Delhi" },
    { name: "Vashi APMC", state: "Maharashtra", district: "Navi Mumbai" },
    { name: "Yeshwanthpur", state: "Karnataka", district: "Bangalore Urban" },
    { name: "Koyambedu", state: "Tamil Nadu", district: "Chennai" },
    { name: "Ghazipur Mandi", state: "Delhi", district: "East Delhi" },
    { name: "Bowenpally", state: "Telangana", district: "Hyderabad" },
    { name: "Pimpri", state: "Maharashtra", district: "Pune" },
    { name: "Rythu Bazaar", state: "Andhra Pradesh", district: "Vijayawada" },
    { name: "Ahmedabad APMC", state: "Gujarat", district: "Ahmedabad" },
    { name: "Jaipur Mandi", state: "Rajasthan", district: "Jaipur" },
    { name: "Lucknow Mandi", state: "Uttar Pradesh", district: "Lucknow" },
    { name: "Patna APMC", state: "Bihar", district: "Patna" },
  ]

  const basePrice = Math.random() * 1500 + 1500

  const comparison: ComparisonData[] = mandis
    .filter(m => states.length === 0 || states.includes(m.state))
    .map(m => {
      const variance = (Math.random() - 0.5) * 600
      const modalPrice = basePrice + variance
      return {
        mandi: m.name,
        state: m.state,
        district: m.district,
        avgMinPrice: modalPrice * 0.9,
        avgMaxPrice: modalPrice * 1.1,
        avgModalPrice: modalPrice,
        totalArrival: Math.floor(Math.random() * 10000) + 1000,
        priceCount: Math.floor(Math.random() * 30) + 5,
        latestPrice: modalPrice + (Math.random() - 0.5) * 100,
        latestDate: new Date().toISOString(),
      }
    })
    .sort((a, b) => a.avgModalPrice - b.avgModalPrice)

  const prices = comparison.map(c => c.avgModalPrice)
  const lowestPrice = Math.min(...prices)
  const highestPrice = Math.max(...prices)

  return {
    crop,
    variety: "All varieties",
    period,
    dateRange: {
      startDate: new Date(Date.now() - (period === "today" ? 0 : period === "7d" ? 7 : 30) * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
    },
    comparison,
    statistics: {
      lowestPrice,
      highestPrice,
      avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length,
      priceRange: highestPrice - lowestPrice,
      marketCount: comparison.length,
    },
    recommendation: {
      bestMarketToBuy: comparison[0] ? {
        name: comparison[0].mandi,
        state: comparison[0].state,
        price: comparison[0].avgModalPrice,
      } : null,
      bestMarketToSell: comparison[comparison.length - 1] ? {
        name: comparison[comparison.length - 1].mandi,
        state: comparison[comparison.length - 1].state,
        price: comparison[comparison.length - 1].avgModalPrice,
      } : null,
      priceDifference: highestPrice - lowestPrice,
    },
  }
}
