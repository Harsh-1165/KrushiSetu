"use client"

import React from "react"
import { Suspense } from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import {
  Search,
  Filter,
  Plus,
  MessageSquare,
  Eye,
  Clock,
  ChevronRight,
  Bug,
  Droplet,
  Layers,
  Sprout,
  Shield,
  Package,
  Leaf,
  Cog,
  Cloud,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  XCircle,
  User,
  ArrowUpDown,
  RefreshCw,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

import {
  questionApi,
  categoryApi,
  statsApi,
  type Question,
  type Category,
  type AdvisoryStats,
  ADVISORY_CATEGORIES,
  CROP_TYPES,
  formatTimeAgo,
  getUserDisplayName,
  getUrgencyColor,
  getStatusColor,
} from "@/lib/advisory-api"
import { useUser } from "@/contexts/auth-context"

// Category icons mapping
const categoryIcons: Record<string, typeof Bug> = {
  crop_diseases: Bug,
  irrigation: Droplet,
  soil_health: Layers,
  crop_selection: Sprout,
  pest_control: Shield,
  harvesting: Package,
  organic_farming: Leaf,
  equipment: Cog,
  weather: Cloud,
  market_advice: TrendingUp,
}

// Status icons mapping
const statusIcons: Record<string, typeof HelpCircle> = {
  open: HelpCircle,
  answered: MessageSquare,
  resolved: CheckCircle,
  closed: XCircle,
}

interface QuestionCardProps {
  question: Question
}

function QuestionCard({ question }: QuestionCardProps) {
  const CategoryIcon = categoryIcons[question.category] || HelpCircle
  const StatusIcon = statusIcons[question.status] || HelpCircle

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={question.author?.avatar?.url || "/placeholder.svg"} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {question.author?.name?.first?.[0]}
                {question.author?.name?.last?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">
                {question.author ? getUserDisplayName(question.author) : "Anonymous"}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTimeAgo(question.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getUrgencyColor(question.urgency)}>
              {question.urgency}
            </Badge>
            <Badge variant="secondary" className={getStatusColor(question.status)}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {question.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <Link href={`/dashboard/questions/${question._id}`}>
          <h3 className="font-semibold text-lg hover:text-primary transition-colors line-clamp-2">
            {question.title}
          </h3>
        </Link>
        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
          {question.description}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <Badge variant="outline" className="gap-1">
            <CategoryIcon className="h-3 w-3" />
            {ADVISORY_CATEGORIES[question.category as keyof typeof ADVISORY_CATEGORIES]?.name || question.category}
          </Badge>
          {question.cropType && (
            <Badge variant="secondary">{question.cropType}</Badge>
          )}
          {question.tags?.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="pt-3 border-t">
        <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              {question.answerCount} {question.answerCount === 1 ? "answer" : "answers"}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {question.viewCount} views
            </span>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/dashboard/questions/${question._id}`}>
              View <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

function QuestionCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16 mt-1" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-4 w-3/4 mt-2" />
        <div className="flex gap-2 mt-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-16" />
        </div>
      </CardContent>
      <CardFooter className="pt-3 border-t">
        <div className="flex items-center justify-between w-full">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-16" />
        </div>
      </CardFooter>
    </Card>
  )
}

function StatsCard({ stats }: { stats: AdvisoryStats | null }) {
  if (!stats) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Questions</p>
              <p className="text-2xl font-bold">{stats.questions.total}</p>
            </div>
            <HelpCircle className="h-8 w-8 text-primary/20" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Open Questions</p>
              <p className="text-2xl font-bold text-blue-600">{stats.questions.open}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-blue-600/20" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Resolved</p>
              <p className="text-2xl font-bold text-green-600">{stats.questions.resolved}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600/20" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Resolution Rate</p>
              <p className="text-2xl font-bold">{stats.questions.resolutionRate}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-primary/20" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CategoryFilter({
  categories,
  selectedCategory,
  onSelect,
}: {
  categories: Category[]
  selectedCategory: string
  onSelect: (category: string) => void
}) {
  return (
    <ScrollArea className="w-full">
      <div className="flex gap-2 pb-2">
        <Button
          variant={selectedCategory === "" ? "default" : "outline"}
          size="sm"
          onClick={() => onSelect("")}
          className="shrink-0"
        >
          All Categories
        </Button>
        {categories.map((category) => {
          const Icon = categoryIcons[category.id] || HelpCircle
          return (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => onSelect(category.id)}
              className="shrink-0 gap-1"
            >
              <Icon className="h-3 w-3" />
              {category.name}
              <Badge variant="secondary" className="ml-1 text-xs">
                {category.questionCount}
              </Badge>
            </Button>
          )
        })}
      </div>
    </ScrollArea>
  )
}

function Loading() {
  return null
}

export default function QuestionsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useUser()

  const [questions, setQuestions] = useState<Question[]>([])
  const [trendingQuestions, setTrendingQuestions] = useState<Question[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [stats, setStats] = useState<AdvisoryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // Filters
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [category, setCategory] = useState(searchParams.get("category") || "")
  const [status, setStatus] = useState(searchParams.get("status") || "")
  const [urgency, setUrgency] = useState(searchParams.get("urgency") || "")
  const [cropType, setCropType] = useState(searchParams.get("cropType") || "")
  const [sort, setSort] = useState(searchParams.get("sort") || "-createdAt")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  // Fetch categories and stats
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [categoriesRes, statsRes, trendingRes] = await Promise.all([
          categoryApi.getAll(),
          statsApi.getStats(),
          questionApi.getTrending(5),
        ])
        setCategories(categoriesRes.categories)
        setStats(statsRes)
        setTrendingQuestions(trendingRes.questions)
      } catch (error) {
        console.log("[v0] Error fetching initial data:", error)
      }
    }
    fetchInitialData()
  }, [])

  // Fetch questions
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true)
      try {
        const params: Record<string, string> = {
          page: "1",
          limit: "10",
          sort,
        }
        if (search) params.search = search
        if (category) params.category = category
        if (status) params.status = status
        if (urgency) params.urgency = urgency
        if (cropType) params.cropType = cropType

        const response = await questionApi.getAll(params)
        setQuestions(response.questions)
        setHasMore(response.pagination.hasNext || false)
        setPage(1)
      } catch (error) {
        console.log("[v0] Error fetching questions:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchQuestions()
  }, [search, category, status, urgency, cropType, sort])

  const loadMore = async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const params: Record<string, string> = {
        page: String(page + 1),
        limit: "10",
        sort,
      }
      if (search) params.search = search
      if (category) params.category = category
      if (status) params.status = status
      if (urgency) params.urgency = urgency
      if (cropType) params.cropType = cropType

      const response = await questionApi.getAll(params)
      setQuestions((prev) => [...prev, ...response.questions])
      setHasMore(response.pagination.hasNext || false)
      setPage((prev) => prev + 1)
    } catch (error) {
      console.log("[v0] Error loading more questions:", error)
    } finally {
      setLoadingMore(false)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Search is already reactive via the useEffect
  }

  const clearFilters = () => {
    setSearch("")
    setCategory("")
    setStatus("")
    setUrgency("")
    setCropType("")
    setSort("-createdAt")
  }

  const hasActiveFilters = search || category || status || urgency || cropType

  return (
    <Suspense fallback={<Loading />}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Crop Advisory Questions</h1>
            <p className="text-muted-foreground">
              Get expert advice on farming, crops, and agriculture
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/questions/ask">
              <Plus className="h-4 w-4 mr-2" />
              Ask Question
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <StatsCard stats={stats} />

        {/* Category Filter */}
        <CategoryFilter
          categories={categories}
          selectedCategory={category}
          onSelect={setCategory}
        />

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <form onSubmit={handleSearchSubmit} className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search questions..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </form>
              <div className="flex gap-2">
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="answered">Answered</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={urgency} onValueChange={setUrgency}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Urgency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Urgency</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Filter Questions</SheetTitle>
                      <SheetDescription>
                        Refine your search with additional filters
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6 space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Crop Type</label>
                        <Select value={cropType} onValueChange={setCropType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select crop type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Crops</SelectItem>
                            {CROP_TYPES.map((crop) => (
                              <SelectItem key={crop} value={crop}>
                                {crop}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Sort By</label>
                        <Select value={sort} onValueChange={setSort}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sort by" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="-createdAt">Newest First</SelectItem>
                            <SelectItem value="createdAt">Oldest First</SelectItem>
                            <SelectItem value="-viewCount">Most Viewed</SelectItem>
                            <SelectItem value="-answerCount">Most Answers</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Separator />
                      <Button variant="outline" className="w-full bg-transparent" onClick={clearFilters}>
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
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {search && (
                  <Badge variant="secondary" className="gap-1">
                    Search: {search}
                    <button onClick={() => setSearch("")} className="ml-1 hover:text-destructive">
                      <XCircle className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {category && (
                  <Badge variant="secondary" className="gap-1">
                    {ADVISORY_CATEGORIES[category as keyof typeof ADVISORY_CATEGORIES]?.name || category}
                    <button onClick={() => setCategory("")} className="ml-1 hover:text-destructive">
                      <XCircle className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {status && status !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Status: {status}
                    <button onClick={() => setStatus("")} className="ml-1 hover:text-destructive">
                      <XCircle className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {urgency && urgency !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Urgency: {urgency}
                    <button onClick={() => setUrgency("")} className="ml-1 hover:text-destructive">
                      <XCircle className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {cropType && cropType !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Crop: {cropType}
                    <button onClick={() => setCropType("")} className="ml-1 hover:text-destructive">
                      <XCircle className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear all
                </Button>
              </div>
            )}

            {/* Questions List */}
            <div className="space-y-4">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <QuestionCardSkeleton key={i} />
                ))
              ) : questions.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No questions found</h3>
                    <p className="text-muted-foreground mb-4">
                      {hasActiveFilters
                        ? "Try adjusting your filters or search terms"
                        : "Be the first to ask a question!"}
                    </p>
                    <Button asChild>
                      <Link href="/dashboard/questions/ask">
                        <Plus className="h-4 w-4 mr-2" />
                        Ask Question
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {questions.map((question) => (
                    <QuestionCard key={question._id} question={question} />
                  ))}
                  {hasMore && (
                    <div className="flex justify-center pt-4">
                      <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                        {loadingMore ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          "Load More"
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trending Questions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Trending Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {trendingQuestions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No trending questions</p>
                ) : (
                  trendingQuestions.map((q) => (
                    <Link
                      key={q._id}
                      href={`/dashboard/questions/${q._id}`}
                      className="block group"
                    >
                      <p className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">
                        {q.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {q.answerCount} answers · {q.viewCount} views
                      </p>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link href="/dashboard/questions?status=open">
                    <AlertCircle className="h-4 w-4 mr-2 text-blue-600" />
                    Open Questions
                  </Link>
                </Button>
                {user?.role === "expert" && (
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <Link href="/dashboard/answers">
                      <MessageSquare className="h-4 w-4 mr-2 text-primary" />
                      My Answers
                    </Link>
                  </Button>
                )}
                {(user?.role === "farmer" || user?.role === "consumer") && (
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <Link href="/dashboard/questions/my">
                      <User className="h-4 w-4 mr-2 text-primary" />
                      My Questions
                    </Link>
                  </Button>
                )}
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link href="/dashboard/experts">
                    <User className="h-4 w-4 mr-2 text-green-600" />
                    Browse Experts
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.slice(0, 6).map((cat) => {
                  const Icon = categoryIcons[cat.id] || HelpCircle
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={cn(
                        "w-full flex items-center justify-between p-2 rounded-md text-sm transition-colors",
                        category === cat.id
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {cat.name}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {cat.questionCount}
                      </Badge>
                    </button>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Suspense>
  )
}
