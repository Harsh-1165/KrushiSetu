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
  Bell,
  Cpu,
  ArrowRight,
  Share2
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
  BarChart,
  Bar
} from "recharts"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"

import {
  priceApi,
  alertApi,
  COMMON_CROPS,
  INDIAN_STATES,
  formatPrice,
  formatDate,
  getPriceChangeColor,
} from "@/lib/market-api"

type Period = "7d" | "30d" | "90d" | "1y"

export default function PriceTrendsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const initialCrop = searchParams.get("crop") || "Rice"

  const [crop, setCrop] = useState(initialCrop)
  const [state, setState] = useState("all")
  const [period, setPeriod] = useState<Period>("7d")
  const [chartType, setChartType] = useState<"line" | "area">("area")
  const [trendData, setTrendData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Alert State
  const [isAlertOpen, setIsAlertOpen] = useState(false)
  const [alertTargetPrice, setAlertTargetPrice] = useState("")
  const [alertCondition, setAlertCondition] = useState("above")
  const [alertSaving, setAlertSaving] = useState(false)

  const fetchTrends = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true)
      else setLoading(true)

      const response = await priceApi.getTrends({
        crop,
        state: state === "all" ? undefined : state,
        period: period as any,
      })

      if (response) {
        // Guard: strip rows with NaN/0 modal price so Recharts never gets bad data
        const cleanData = (response.data ?? []).map((d: any) => ({
          ...d,
          min: Number(d.min) || 0,
          modal: Number(d.modal) || Number(d.avgModalPrice) || 0,
          max: Number(d.max) || 0,
          arrival: Number(d.arrival) || Number(d.totalArrival) || 0,
        })).filter((d: any) => d.modal > 0)
        setTrendData({ ...response, data: cleanData })
      } else {
        setTrendData(null)
      }
    } catch (error) {
      console.error("Error fetching trends:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load market trends"
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [crop, state, period, toast])

  useEffect(() => {
    fetchTrends()
  }, [fetchTrends])

  const handleCreateAlert = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please login to set price alerts"
      })
      return
    }
    if (!alertTargetPrice) {
      toast({
        variant: "destructive",
        title: "Invalid input",
        description: "Please enter a target price"
      })
      return
    }

    setAlertSaving(true)
    try {
      await alertApi.create({
        crop,
        state: state === "all" ? undefined : state,
        targetPrice: Number(alertTargetPrice),
        condition: alertCondition as "above" | "below",
        priceType: "modal"
      })
      toast({
        title: "Success",
        description: "Price alert set successfully!"
      })
      setIsAlertOpen(false)
      setAlertTargetPrice("")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to set alert"
      })
    } finally {
      setAlertSaving(false)
    }
  }

  const handleExportCSV = () => {
    if (!trendData?.data) return

    const headers = ["Date", "Min Price", "Max Price", "Modal Price", "Arrival"]
    const rows = trendData.data.map((t: any) => [
      t.date,
      t.min,
      t.max,
      t.modal,
      t.arrival
    ])

    const csvContent = [headers.join(","), ...rows.map((r: any[]) => r.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${crop}-trends-${period}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-8 pb-10 bg-slate-950 min-h-screen p-6">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Link href="/dashboard/market-prices" className="hover:text-green-400 transition-colors flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" /> Back to Market
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
            Market Intelligence
          </h1>
          <p className="text-slate-400">
            Real-time price trends, AI insights, and predictive analysis for {crop}
          </p>
          {trendData && (
            <span className={`inline-flex items-center gap-1 mt-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${trendData.source === 'live'
              ? 'bg-green-900/40 text-green-400'
              : trendData.source === 'cache'
                ? 'bg-blue-900/40 text-blue-400'
                : 'bg-amber-900/40 text-amber-400'
              }`}>
              {trendData.source === 'live' ? '📡 Live Mandi Data' : trendData.source === 'cache' ? '⚡ Cached' : '🔮 Simulated Trend'}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Dialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-slate-700 bg-slate-800 text-green-400 hover:bg-slate-700 hover:text-green-300">
                <Bell className="h-4 w-4 mr-2" />
                Set Alert
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-white">
              <DialogHeader>
                <DialogTitle>Set Price Alert for {crop}</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Get notified when market prices reach your target.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Condition</Label>
                  <Select value={alertCondition} onValueChange={setAlertCondition}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="above">Price goes above</SelectItem>
                      <SelectItem value="below">Price drops below</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-slate-300">Target (₹)</Label>
                  <Input
                    type="number"
                    value={alertTargetPrice}
                    onChange={(e) => setAlertTargetPrice(e.target.value)}
                    className="col-span-3 bg-slate-800 border-slate-700 text-white"
                    placeholder="e.g. 2500"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAlertOpen(false)} className="border-slate-700 text-slate-300 hover:bg-slate-800">Cancel</Button>
                <Button onClick={handleCreateAlert} disabled={alertSaving} className="bg-green-600 hover:bg-green-700">
                  {alertSaving ? "Saving..." : "Create Alert"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={handleExportCSV} disabled={!trendData} className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <Button onClick={() => fetchTrends(true)} disabled={refreshing} className="bg-green-600 hover:bg-green-700 text-white">
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm shadow-md">
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-3">
            <Label className="text-xs text-slate-400 mb-1.5 block">Select Crop</Label>
            <Select value={crop} onValueChange={setCrop}>
              <SelectTrigger className="w-full bg-slate-900 border-slate-700 text-white">
                <SelectValue placeholder="Select Crop" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-white">
                {COMMON_CROPS.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-3">
            <Label className="text-xs text-slate-400 mb-1.5 block">Market State</Label>
            <Select value={state} onValueChange={setState}>
              <SelectTrigger className="w-full bg-slate-900 border-slate-700 text-white">
                <SelectValue placeholder="All India" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-white">
                <SelectItem value="all">All India</SelectItem>
                {INDIAN_STATES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-4">
            <Label className="text-xs text-slate-400 mb-1.5 block">Time Range</Label>
            <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700">
              {(["7d", "30d", "90d", "1y"] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "flex-1 text-sm font-medium py-1.5 rounded-md transition-all",
                    period === p
                      ? "bg-slate-700 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 flex justify-end">
            <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700">
              <Button
                variant="ghost"
                size="sm"
                className={cn("h-8 px-2 text-slate-400 hover:text-white hover:bg-slate-700", chartType === "area" && "bg-slate-700 text-white shadow-sm")}
                onClick={() => setChartType("area")}
              >
                <LineChartIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn("h-8 px-2 text-slate-400 hover:text-white hover:bg-slate-700", chartType === "line" && "bg-slate-700 text-white shadow-sm")}
                onClick={() => setChartType("line")}
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      {loading ? (
        <TrendSkeleton />
      ) : !trendData ? (
        <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed text-muted-foreground">
          No data available. Try adjusting filters.
        </div>
      ) : (
        <div className="space-y-6">

          {/* AI Insight Panel */}
          <Card className="relative overflow-hidden border-indigo-100 bg-gradient-to-r from-indigo-50 to-white">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Cpu className="h-24 w-24 text-indigo-600" />
            </div>
            <CardContent className="p-6 relative z-10">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-indigo-100 text-indigo-700 border-indigo-200 gap-1 px-3 py-1">
                      <Cpu className="h-3 w-3" /> AI Market Insight
                    </Badge>
                    <span className="text-xs text-muted-foreground">Confidence: {trendData.aiInsight?.confidence}%</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">
                    {trendData.aiInsight?.summary}
                  </h3>
                  <p className="text-sm text-slate-600">
                    Based on analyzing {trendData.data.length} data points from {state === "all" ? "pan-India" : state} mandis.
                  </p>
                </div>

                <div className={cn(
                  "px-6 py-4 rounded-xl border-l-4 flex flex-col items-center min-w-[8.75rem]",
                  trendData.aiInsight?.advice === "sell" ? "bg-green-100 border-green-500" :
                    trendData.aiInsight?.advice === "wait" ? "bg-amber-100 border-amber-500" :
                      "bg-slate-100 border-slate-400"
                )}>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Recommendation</span>
                  <span className={cn(
                    "text-2xl font-black",
                    trendData.aiInsight?.advice === "sell" ? "text-green-700" :
                      trendData.aiInsight?.advice === "wait" ? "text-amber-700" :
                        "text-slate-700"
                  )}>
                    {trendData.aiInsight?.advice.toUpperCase()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900 shadow-sm space-y-1">
              <p className="text-sm font-medium text-slate-400">Average Price</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold text-white">{formatPrice(trendData.averagePrice || 0)}</h3>
                <span className="text-xs text-slate-500">/ quintal</span>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900 shadow-sm space-y-1">
              <p className="text-sm font-medium text-slate-400">Price Change</p>
              <div className={cn("flex items-center gap-2", getPriceChangeColor(trendData.priceChange || 0))}>
                {(trendData.priceChange || 0) > 0 ? <TrendingUp className="h-5 w-5" /> :
                  (trendData.priceChange || 0) < 0 ? <TrendingDown className="h-5 w-5" /> :
                    <Minus className="h-5 w-5" />}
                <h3 className="text-2xl font-bold">{Math.abs(trendData.priceChange || 0)}%</h3>
              </div>
              <p className="text-xs text-slate-500">vs start of period</p>
            </div>

            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900 shadow-sm space-y-1">
              <p className="text-sm font-medium text-slate-400">Price Range</p>
              <div className="flex flex-col">
                <h3 className="text-xl font-bold text-white">
                  {formatPrice(trendData.priceRange?.min || 0)} - {formatPrice(trendData.priceRange?.max || 0)}
                </h3>
                <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-slate-600 rounded-full" style={{ width: '60%' }} />
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900 shadow-sm space-y-1">
              <p className="text-sm font-medium text-slate-400">Total Arrival</p>
              <h3 className="text-2xl font-bold text-white">{((trendData.totalArrival || 0) / 1000).toFixed(1)}K</h3>
              <p className="text-xs text-slate-500">Quintals recorded</p>
            </div>
          </div>

          {/* Main Chart Section */}
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-slate-800 bg-slate-900 shadow-sm">
              <CardHeader>
                <CardTitle className="text-white">Price Movement</CardTitle>
                <CardDescription className="text-slate-400">Daily Min, Max, and Modal prices</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[21.875rem] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorModal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12, fill: '#94a3b8' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => formatDate(val).split(',')[0]}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#94a3b8' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `₹${val}`}
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: '1px solid #1e293b', backgroundColor: '#0f172a', color: '#fff', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)' }}
                      />
                      <Legend iconType="circle" />

                      <Area
                        type="monotone"
                        dataKey="modal"
                        name="Modal Price"
                        stroke="#22c55e"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorModal)"
                      />
                      <Area
                        type="monotone"
                        dataKey="max"
                        name="Max Price"
                        stroke="#ef4444"
                        strokeWidth={1}
                        strokeDasharray="4 4"
                        fill="none"
                      />
                      <Area
                        type="monotone"
                        dataKey="min"
                        name="Min Price"
                        stroke="#3b82f6"
                        strokeWidth={1}
                        strokeDasharray="4 4"
                        fill="none"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-1 border-slate-800 bg-slate-900 shadow-sm">
              <CardHeader>
                <CardTitle className="text-white">Market Arrivals</CardTitle>
                <CardDescription className="text-slate-400">Daily volume in Quintals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[21.875rem] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12, fill: '#94a3b8' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => formatDate(val).split(',')[0].substring(0, 3)}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#94a3b8' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        cursor={{ fill: '#1e293b' }}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #1e293b', backgroundColor: '#0f172a', color: '#fff', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)' }}
                      />
                      <Bar dataKey="arrival" name="Arrival (Q)" fill="#475569" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

function TrendSkeleton() {
  return (
    <div className="space-y-6 animate-pulse p-6 bg-slate-950 min-h-screen">
      <Skeleton className="h-48 w-full rounded-xl bg-slate-800" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl bg-slate-800" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-6">
        <Skeleton className="col-span-2 h-[25rem] rounded-xl bg-slate-800" />
        <Skeleton className="col-span-1 h-[25rem] rounded-xl bg-slate-800" />
      </div>
    </div>
  )
}
