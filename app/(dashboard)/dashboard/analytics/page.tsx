"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { mockData } from "@/lib/mockData"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { StatsCard, StatsGrid } from "@/components/dashboard/stats-card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import {
  DollarSign,
  ShoppingCart,
  Package,
  Star,
  MessageSquare,
  ThumbsUp,
  FileText,
  BarChart3,
  TrendingUp,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

const CHART_COLOR = "var(--chart-1)"
const CHART_COLOR_2 = "var(--chart-2)"
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"

// ─── Types ─────────────────────────────────────────────────────────────────

interface FarmerApiData {
  role: "farmer"
  isDemo: boolean
  stats: {
    totalRevenue: number
    totalOrders: number
    pendingOrders: number
    activeProducts: number
    pendingProducts: number
  }
  charts: {
    revenueData: { month: string; revenue: number; orders: number }[]
  }
}

interface ExpertApiData {
  role: "expert"
  isDemo: boolean
  charts: {
    answersData: { month: string; answers: number }[]
    articleViewsData: { month: string; views: number }[]
    upvotesData: { month: string; upvotes: number }[]
  }
}

type AnalyticsApiData = FarmerApiData | ExpertApiData | null

// ─── Demo Badge ─────────────────────────────────────────────────────────────

function DemoBadge() {
  return (
    <span className="inline-flex items-center gap-1 mt-2 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
      📊 Demo Analytics — will personalize after usage
    </span>
  )
}

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1 mt-2 rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
      ✅ Live Analytics
    </span>
  )
}

// ─── Farmer Analytics ───────────────────────────────────────────────────────

function FarmerAnalytics({ apiData }: { apiData: FarmerApiData | null }) {
  const fallback = mockData.farmerStats
  const isDemo = !apiData || apiData.isDemo

  const stats = apiData?.stats ?? {
    totalRevenue: fallback.totalRevenue,
    totalOrders: fallback.totalOrders,
    pendingOrders: fallback.pendingOrders,
    activeProducts: fallback.activeProducts,
    pendingProducts: fallback.pendingProducts,
  }

  // Use real data if available; otherwise fall back to mock
  const revenueData =
    apiData?.charts?.revenueData?.length
      ? apiData.charts.revenueData
      : fallback.revenueData ?? []

  const chartConfig = { revenue: { label: "Revenue", color: CHART_COLOR } }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Farm Analytics</h1>
        <p className="text-muted-foreground">
          Overview of your farm&apos;s performance over the last 6 months.
        </p>
        {isDemo ? <DemoBadge /> : <LiveBadge />}
      </div>
      <StatsGrid>
        <StatsCard
          title="Total Revenue"
          value={`Rs. ${Number(stats.totalRevenue).toLocaleString()}`}
          description="from all orders"
          icon={DollarSign}
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatsCard
          title="Total Orders"
          value={stats.totalOrders}
          description={`${stats.pendingOrders} pending`}
          icon={ShoppingCart}
          trend={{ value: 8.2, isPositive: true }}
        />
        <StatsCard
          title="Active Products"
          value={stats.activeProducts}
          description={`${stats.pendingProducts} pending approval`}
          icon={Package}
        />
        <StatsCard
          title="Average Rating"
          value={Number(fallback.averageRating).toFixed(1)}
          description={`${fallback.totalReviews} reviews`}
          icon={Star}
        />
      </StatsGrid>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Revenue trend
          </CardTitle>
          <CardDescription>Monthly revenue for the last 6 months.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[320px] w-full">
            <AreaChart
              data={revenueData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="farmerRevenueArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLOR} stopOpacity={0.45} />
                  <stop offset="95%" stopColor={CHART_COLOR} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} className="text-xs" />
              <YAxis
                tickFormatter={(value) => `Rs.${value / 1000}k`}
                tickLine={false}
                axisLine={false}
                className="text-xs"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={CHART_COLOR}
                strokeWidth={2.5}
                fill="url(#farmerRevenueArea)"
                fillOpacity={1}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Expert Analytics ────────────────────────────────────────────────────────

function ExpertAnalytics({ apiData }: { apiData: ExpertApiData | null }) {
  const fallback = mockData.expertStats
  const fallbackAnalytics = mockData.expertAnalytics
  const isDemo = !apiData || apiData.isDemo

  const answersData =
    apiData?.charts?.answersData?.length
      ? apiData.charts.answersData
      : fallbackAnalytics.answersData ?? []

  const articleViewsData =
    apiData?.charts?.articleViewsData?.length
      ? apiData.charts.articleViewsData
      : fallbackAnalytics.articleViewsData ?? []

  const upvotesData =
    apiData?.charts?.upvotesData?.length
      ? apiData.charts.upvotesData
      : fallbackAnalytics.upvotesData ?? []

  const totalViews = (fallback.articles ?? []).reduce((a, b) => a + (b.views ?? 0), 0)

  const answersConfig = { answers: { label: "Answers", color: CHART_COLOR } }
  const viewsConfig = { views: { label: "Views", color: CHART_COLOR_2 } }
  const upvotesConfig = { upvotes: { label: "Upvotes", color: CHART_COLOR } }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Expert Analytics</h1>
        <p className="text-muted-foreground">
          Your contribution and impact over the last 6 months.
        </p>
        {isDemo ? <DemoBadge /> : <LiveBadge />}
      </div>
      <StatsGrid>
        <StatsCard
          title="Questions Answered"
          value={fallback.totalAnswers}
          description={`${fallback.weeklyAnswers} this week`}
          icon={MessageSquare}
          trend={{ value: 50, isPositive: true }}
        />
        <StatsCard
          title="Total Upvotes"
          value={Number(fallback.totalUpvotes).toLocaleString()}
          description={`${fallback.answerStats?.avgUpvotesPerAnswer ?? 0} avg per answer`}
          icon={ThumbsUp}
        />
        <StatsCard
          title="Average Rating"
          value={Number(fallback.averageRating).toFixed(1)}
          description={`${fallback.acceptedAnswers} accepted`}
          icon={Star}
        />
        <StatsCard
          title="Articles Published"
          value={fallback.articlesPublished}
          description={`${totalViews.toLocaleString()} total views`}
          icon={FileText}
        />
      </StatsGrid>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Answers per month
            </CardTitle>
            <CardDescription>Questions you answered each month.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={answersConfig} className="h-[280px] w-full">
              <BarChart
                data={answersData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis tickLine={false} axisLine={false} className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="answers"
                  fill={CHART_COLOR}
                  radius={[4, 4, 0, 0]}
                  stroke={CHART_COLOR}
                  strokeWidth={1}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Article views
            </CardTitle>
            <CardDescription>Monthly views on your articles.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={viewsConfig} className="h-[280px] w-full">
              <AreaChart
                data={articleViewsData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="expertViewsArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLOR_2} stopOpacity={0.45} />
                    <stop offset="95%" stopColor={CHART_COLOR_2} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis tickLine={false} axisLine={false} className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke={CHART_COLOR_2}
                  strokeWidth={2.5}
                  fill="url(#expertViewsArea)"
                  fillOpacity={1}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ThumbsUp className="h-5 w-5" />
            Upvotes trend
          </CardTitle>
          <CardDescription>Monthly upvotes on your answers.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={upvotesConfig} className="h-[300px] w-full">
            <AreaChart
              data={upvotesData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="expertUpvotesArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLOR} stopOpacity={0.45} />
                  <stop offset="95%" stopColor={CHART_COLOR} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} className="text-xs" />
              <YAxis tickLine={false} axisLine={false} className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="upvotes"
                stroke={CHART_COLOR}
                strokeWidth={2.5}
                fill="url(#expertUpvotesArea)"
                fillOpacity={1}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Full-page Skeleton ──────────────────────────────────────────────────────

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-80" />
        <Skeleton className="h-5 w-32 rounded-full" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[320px] w-full rounded-xl" />
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsApiData>(null)
  const [fetching, setFetching] = useState(false)

  useEffect(() => {
    if (!user) return
    const role = user.role

    // Only fetch for roles that have analytics
    if (role !== "farmer" && role !== "expert") return

    setFetching(true)

    fetch(`${API_BASE}/analytics/summary`, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setAnalyticsData(json as AnalyticsApiData)
        }
      })
      .catch((err) => {
        console.warn("[Analytics] Failed to fetch analytics summary:", err)
        // Leave analyticsData null → fall through to mock fallback
      })
      .finally(() => setFetching(false))
  }, [user])

  const isLoading = authLoading || fetching

  if (isLoading) return <AnalyticsSkeleton />

  const role = user?.role ?? "consumer"

  if (role === "farmer") {
    return <FarmerAnalytics apiData={analyticsData as FarmerApiData | null} />
  }

  if (role === "expert") {
    return <ExpertAnalytics apiData={analyticsData as ExpertApiData | null} />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Analytics are available for farmers and experts.
        </p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <BarChart3 className="h-14 w-14 mb-4 opacity-50" />
          <p>No analytics for your account type.</p>
        </CardContent>
      </Card>
    </div>
  )
}
