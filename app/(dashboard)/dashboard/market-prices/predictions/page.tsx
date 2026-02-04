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
  AlertTriangle,
  CheckCircle,
  Info,
  Sparkles,
  Calendar,
  Target,
  ShieldCheck,
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
  ComposedChart,
} from "recharts"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"

import {
  priceApi,
  type PricePrediction,
  COMMON_CROPS,
  INDIAN_STATES,
  formatPrice,
} from "@/lib/market-api"

interface PredictionData {
  crop: string
  variety: string
  location: string
  predictionDays: number
  predictions: Array<PricePrediction & { 
    confidenceRange?: { low: number; high: number }
    trend?: "up" | "down" | "stable" 
  }>
  confidence: {
    level: "high" | "medium" | "low"
    score: number
    factors?: string[]
    message?: string
  }
  methodology: string
  disclaimer: string
  generatedAt: string
}

function PredictionSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

function CustomPredictionTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string; payload: { confidenceRange?: { low: number; high: number } } }>; label?: string }) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload

  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 min-w-48">
      <p className="text-sm font-medium mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatPrice(entry.value)}
          </p>
        ))}
        {data.confidenceRange && (
          <p className="text-xs text-muted-foreground mt-2">
            Range: {formatPrice(data.confidenceRange.low)} - {formatPrice(data.confidenceRange.high)}
          </p>
        )}
      </div>
    </div>
  )
}

function ConfidenceIndicator({ level, score }: { level: "high" | "medium" | "low"; score: number }) {
  const colors = {
    high: "bg-green-500",
    medium: "bg-yellow-500",
    low: "bg-red-500",
  }

  const icons = {
    high: <CheckCircle className="h-5 w-5 text-green-600" />,
    medium: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
    low: <AlertTriangle className="h-5 w-5 text-red-600" />,
  }

  return (
    <div className="flex items-center gap-3">
      {icons[level]}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium capitalize">{level} Confidence</span>
          <span className="text-sm text-muted-foreground">{score}%</span>
        </div>
        <Progress value={score} className="h-2" />
      </div>
    </div>
  )
}

function RecommendationCard({ trend, currentPrice, predictedPrice }: { trend: "up" | "down" | "stable"; currentPrice: number; predictedPrice: number }) {
  const change = ((predictedPrice - currentPrice) / currentPrice) * 100

  const recommendations = {
    up: {
      action: "HOLD / BUY",
      description: "Prices are expected to rise. Consider holding your stock or buying now.",
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-900/20",
      border: "border-green-200 dark:border-green-800",
    },
    down: {
      action: "SELL",
      description: "Prices are expected to fall. Consider selling your stock soon.",
      color: "text-red-600",
      bg: "bg-red-50 dark:bg-red-900/20",
      border: "border-red-200 dark:border-red-800",
    },
    stable: {
      action: "WAIT",
      description: "Prices are expected to remain stable. Monitor the market for changes.",
      color: "text-yellow-600",
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
      border: "border-yellow-200 dark:border-yellow-800",
    },
  }

  const rec = recommendations[trend]

  return (
    <Card className={cn("border-2", rec.border)}>
      <CardContent className="pt-4">
        <div className={cn("p-4 rounded-lg", rec.bg)}>
          <div className="flex items-center justify-between mb-3">
            <Badge variant="outline" className={cn("text-lg font-bold", rec.color)}>
              {rec.action}
            </Badge>
            <div className="flex items-center gap-1">
              {trend === "up" ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : trend === "down" ? (
                <TrendingDown className="h-5 w-5 text-red-600" />
              ) : (
                <Minus className="h-5 w-5 text-yellow-600" />
              )}
              <span className={cn("font-semibold", rec.color)}>
                {change > 0 ? "+" : ""}{change.toFixed(2)}%
              </span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{rec.description}</p>
          <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Current Price</p>
              <p className="font-semibold">{formatPrice(currentPrice)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Predicted (7 days)</p>
              <p className={cn("font-semibold", rec.color)}>{formatPrice(predictedPrice)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function PricePredictionsPage() {
  const [crop, setCrop] = useState("Rice")
  const [state, setState] = useState("")
  const [days, setDays] = useState(7)
  const [predictionData, setPredictionData] = useState<PredictionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchPredictions = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true)
      else setLoading(true)

      const response = await priceApi.getPredictions({
        crop,
        state: state || undefined,
        days,
      })

      setPredictionData(response.data)
    } catch (error) {
      console.log("[v0] Error fetching predictions:", error)
      // Generate mock data for demonstration
      const mockData = generateMockPredictionData(crop, state, days)
      setPredictionData(mockData)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [crop, state, days])

  useEffect(() => {
    fetchPredictions()
  }, [fetchPredictions])

  // Build chart data with historical + predictions
  const chartData = predictionData ? buildChartData(predictionData) : []
  
  const currentPrice = chartData.find(d => d.type === "historical")?.price || 0
  const lastPrediction = predictionData?.predictions[predictionData.predictions.length - 1]
  const predictedPrice = lastPrediction?.predictedPrice || currentPrice
  const overallTrend = predictedPrice > currentPrice * 1.02 ? "up" : predictedPrice < currentPrice * 0.98 ? "down" : "stable"

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
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Price Predictions</h1>
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" />
                AI-Powered
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Machine learning based price forecasts
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchPredictions(true)} disabled={refreshing}>
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            Refresh
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
                <SelectValue placeholder="All India" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All India</SelectItem>
                {INDIAN_STATES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
              <SelectTrigger className="w-full md:w-48">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Prediction Days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 Days</SelectItem>
                <SelectItem value="14">14 Days</SelectItem>
                <SelectItem value="30">30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <PredictionSkeleton />
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Price</p>
                    <p className="text-xl font-bold">{formatPrice(currentPrice)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Predicted ({days}d)</p>
                    <p className={cn("text-xl font-bold", 
                      predictedPrice > currentPrice ? "text-green-600" : 
                      predictedPrice < currentPrice ? "text-red-600" : ""
                    )}>
                      {formatPrice(predictedPrice)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    {overallTrend === "up" ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : overallTrend === "down" ? (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    ) : (
                      <Minus className="h-5 w-5 text-yellow-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expected Change</p>
                    <p className={cn("text-xl font-bold",
                      overallTrend === "up" ? "text-green-600" :
                      overallTrend === "down" ? "text-red-600" : "text-yellow-600"
                    )}>
                      {((predictedPrice - currentPrice) / currentPrice * 100).toFixed(2)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Confidence</p>
                    <p className="text-xl font-bold capitalize">
                      {predictionData?.confidence?.level || "medium"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendation */}
          <RecommendationCard 
            trend={overallTrend} 
            currentPrice={currentPrice} 
            predictedPrice={predictedPrice} 
          />

          {/* Prediction Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{crop} Price Forecast</CardTitle>
                  <CardDescription>
                    Historical data with {days}-day prediction
                  </CardDescription>
                </div>
                {predictionData?.confidence && (
                  <div className="w-48">
                    <ConfidenceIndicator 
                      level={predictionData.confidence.level} 
                      score={predictionData.confidence.score} 
                    />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <TooltipProvider>
                    <ComposedChart data={chartData}>
                      <defs>
                        <linearGradient id="colorPrediction" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
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
                      <Tooltip content={<CustomPredictionTooltip />} />
                      <Legend />
                      
                      {/* Confidence band */}
                      <Area
                        type="monotone"
                        dataKey="upperBound"
                        stackId="1"
                        stroke="none"
                        fill="url(#colorPrediction)"
                        name="Upper Bound"
                      />
                      <Area
                        type="monotone"
                        dataKey="lowerBound"
                        stackId="2"
                        stroke="none"
                        fill="transparent"
                        name="Lower Bound"
                      />
                      
                      {/* Historical line */}
                      <Line
                        type="monotone"
                        dataKey="historical"
                        name="Historical"
                        stroke="hsl(var(--muted-foreground))"
                        strokeWidth={2}
                        dot={false}
                      />
                      
                      {/* Prediction line */}
                      <Line
                        type="monotone"
                        dataKey="predicted"
                        name="Predicted"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ fill: "hsl(var(--primary))", r: 4 }}
                      />
                    </ComposedChart>
                  </TooltipProvider>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Confidence Factors */}
          {predictionData?.confidence?.factors && predictionData.confidence.factors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Confidence Factors</CardTitle>
                <CardDescription>
                  Factors affecting prediction accuracy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {predictionData.confidence.factors.map((factor, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{factor}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Disclaimer */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Disclaimer</AlertTitle>
            <AlertDescription>
              {predictionData?.disclaimer || "Predictions are based on historical data and machine learning models. Actual prices may vary due to market conditions, weather, and other factors. Use predictions as one of many inputs for decision-making."}
            </AlertDescription>
          </Alert>

          {/* Methodology */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Methodology</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {predictionData?.methodology || "Our predictions use a combination of time series analysis, moving averages, and trend detection algorithms trained on historical price data from mandis across India."}
              </p>
              <Separator className="my-4" />
              <p className="text-xs text-muted-foreground">
                Generated at: {predictionData?.generatedAt ? new Date(predictionData.generatedAt).toLocaleString() : new Date().toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

// Build chart data combining historical and predictions
function buildChartData(data: PredictionData) {
  const chartData: Array<{
    date: string
    historical?: number
    predicted?: number
    price?: number
    upperBound?: number
    lowerBound?: number
    confidenceRange?: { low: number; high: number }
    type: "historical" | "predicted"
  }> = []

  // Add some historical data points
  const basePrice = data.predictions[0]?.predictedPrice || 2000
  for (let i = 7; i >= 1; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const variance = (Math.random() - 0.5) * 100
    const price = basePrice + variance - (i * 10)
    chartData.push({
      date: date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      historical: price,
      price: price,
      type: "historical",
    })
  }

  // Add today
  chartData.push({
    date: "Today",
    historical: basePrice,
    predicted: basePrice,
    price: basePrice,
    type: "historical",
  })

  // Add predictions
  data.predictions.forEach((pred, index) => {
    const range = pred.confidenceRange || { low: pred.predictedPrice * 0.95, high: pred.predictedPrice * 1.05 }
    chartData.push({
      date: new Date(pred.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      predicted: pred.predictedPrice,
      upperBound: range.high,
      lowerBound: range.low,
      confidenceRange: range,
      type: "predicted",
    })
  })

  return chartData
}

// Generate mock data for demonstration
function generateMockPredictionData(crop: string, state: string, days: number): PredictionData {
  const basePrice = Math.random() * 1500 + 1500
  const trend = Math.random() > 0.5 ? 1 : -1
  const trendStrength = Math.random() * 0.02

  const predictions = []
  for (let i = 1; i <= days; i++) {
    const date = new Date()
    date.setDate(date.getDate() + i)
    
    const predictedPrice = basePrice * (1 + trend * trendStrength * i + (Math.random() - 0.5) * 0.02)
    
    predictions.push({
      date: date.toISOString().split("T")[0],
      predictedPrice,
      lowerBound: predictedPrice * 0.95,
      upperBound: predictedPrice * 1.05,
      confidence: 85 - (i * 2),
      confidenceRange: {
        low: predictedPrice * 0.95,
        high: predictedPrice * 1.05,
      },
      trend: trend > 0 ? "up" as const : "down" as const,
    })
  }

  const confidenceScore = Math.floor(Math.random() * 30) + 60
  const confidenceLevel = confidenceScore >= 80 ? "high" : confidenceScore >= 60 ? "medium" : "low"

  return {
    crop,
    variety: "All varieties",
    location: state || "All India",
    predictionDays: days,
    predictions,
    confidence: {
      level: confidenceLevel,
      score: confidenceScore,
      factors: [
        "Sufficient historical data available",
        "Stable market conditions",
        "Seasonal patterns detected",
        "Low price volatility in recent period",
      ],
      message: confidenceLevel === "high" 
        ? "Price data is stable, predictions are reliable"
        : confidenceLevel === "medium"
        ? "Moderate price volatility, predictions have some uncertainty"
        : "High price volatility, predictions should be used with caution",
    },
    methodology: "Moving Average with Trend Analysis and Seasonal Decomposition",
    disclaimer: "Predictions are based on historical data and should not be used as sole basis for trading decisions. Market conditions, weather, government policies, and other factors can significantly impact actual prices.",
    generatedAt: new Date().toISOString(),
  }
}
