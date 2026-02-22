"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import Loading from "./loading" // Import the Loading component

import {
  Search,
  Filter,
  Star,
  MessageSquare,
  Award,
  CheckCircle,
  MapPin,
  Briefcase,
  GraduationCap,
  Mail,
  RefreshCw,
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
  User,
  Clock,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
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
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"

import {
  expertApi,
  type Expert,
  ADVISORY_CATEGORIES,
  getUserDisplayName,
  formatTimeAgo,
} from "@/lib/advisory-api"

// Category icons
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

// Star rating component
function StarRating({ rating, showValue = true }: { rating: number; showValue?: boolean }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "h-4 w-4",
            star <= Math.round(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "fill-muted text-muted"
          )}
        />
      ))}
      {showValue && (
        <span className="text-sm font-medium ml-1">{rating.toFixed(1)}</span>
      )}
    </div>
  )
}

// Expert Card Component
function ExpertCard({ expert }: { expert: Expert }) {
  const profile = expert.expertProfile

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={expert.avatar?.url || "/placeholder.svg"} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              {expert.name?.first?.[0]}
              {expert.name?.last?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-lg">
                {getUserDisplayName(expert)}
              </h3>
              {profile?.isVerified && (
                <Badge variant="secondary" className="text-green-600 border-green-600 gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Verified
                </Badge>
              )}
              {profile?.isAvailable && (
                <Badge variant="outline" className="text-blue-600 border-blue-600 gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  Available
                </Badge>
              )}
            </div>
            <StarRating rating={profile?.rating || 0} />
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                {profile?.experience || 0} years
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                {profile?.totalAnswers || 0} answers
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3 space-y-3">
        {/* Specializations */}
        <div className="flex flex-wrap gap-2">
          {profile?.specializations?.slice(0, 4).map((spec) => {
            const Icon = categoryIcons[spec] || Award
            return (
              <Badge key={spec} variant="outline" className="gap-1">
                <Icon className="h-3 w-3" />
                {ADVISORY_CATEGORIES[spec as keyof typeof ADVISORY_CATEGORIES]?.name || spec}
              </Badge>
            )
          })}
          {profile?.specializations && profile.specializations.length > 4 && (
            <Badge variant="secondary">+{profile.specializations.length - 4} more</Badge>
          )}
        </div>

        {/* Qualifications */}
        {profile?.qualifications && profile.qualifications.length > 0 && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <GraduationCap className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="line-clamp-1">
              {profile.qualifications[0].degree} from {profile.qualifications[0].institution}
              {profile.qualifications.length > 1 && ` +${profile.qualifications.length - 1} more`}
            </span>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-3 border-t">
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Joined {formatTimeAgo(expert.createdAt)}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/experts/${expert._id}`}>
                View Profile
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
            <Button size="sm">
              <Mail className="h-4 w-4 mr-1" />
              Message
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

// Expert Card Skeleton
function ExpertCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24 mt-2" />
            <Skeleton className="h-4 w-32 mt-2" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3 space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-28" />
        </div>
        <Skeleton className="h-4 w-full" />
      </CardContent>
      <CardFooter className="pt-3 border-t">
        <div className="flex items-center justify-between w-full">
          <Skeleton className="h-4 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

// Featured Expert Card
function FeaturedExpertCard({ expert }: { expert: Expert }) {
  const profile = expert.expertProfile

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="pt-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 border-2 border-primary">
            <AvatarImage src={expert.avatar?.url || "/placeholder.svg"} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {expert.name?.first?.[0]}
              {expert.name?.last?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold">{getUserDisplayName(expert)}</p>
              {profile?.isVerified && (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
            </div>
            <StarRating rating={profile?.rating || 0} />
            <p className="text-xs text-muted-foreground mt-1">
              {profile?.totalAnswers || 0} answers · {profile?.experience || 0} years exp
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ExpertsDirectoryPage() {
  const [experts, setExperts] = useState<Expert[]>([])
  const [topExperts, setTopExperts] = useState<Expert[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const searchParams = useSearchParams()

  // Filters
  const [search, setSearch] = useState("")
  const [specialization, setSpecialization] = useState("")
  const [minExperience, setMinExperience] = useState(0)
  const [minRating, setMinRating] = useState(0)
  const [availableOnly, setAvailableOnly] = useState(false)
  const [sort, setSort] = useState("rating")

  // Fetch experts
  const fetchExperts = async (pageNum = 1, append = false) => {
    try {
      const params: Record<string, string | number> = {
        page: pageNum,
        limit: 12,
        sort,
      }
      if (specialization) params.specialization = specialization
      if (minExperience > 0) params.minExperience = minExperience
      if (minRating > 0) params.minRating = minRating
      if (availableOnly) params.available = "true"

      const response = await expertApi.getAll(params)

      if (append) {
        setExperts((prev) => [...prev, ...response.experts])
      } else {
        setExperts(response.experts)
      }
      setHasMore(response.pagination.page < response.pagination.pages)
      setPage(pageNum)
    } catch (error) {
      console.log("Error fetching experts:", error)
    }
  }

  // Fetch top experts
  const fetchTopExperts = async () => {
    try {
      const response = await expertApi.getAll({
        limit: 5,
        sort: "rating",
      })
      setTopExperts(response.experts)
    } catch (error) {
      console.log("Error fetching top experts:", error)
    }
  }

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchExperts(1), fetchTopExperts()])
      setLoading(false)
    }
    loadData()
  }, [])

  // Reload on filter change
  useEffect(() => {
    if (!loading) {
      fetchExperts(1)
    }
  }, [specialization, minExperience, minRating, availableOnly, sort])

  const loadMore = async () => {
    setLoadingMore(true)
    await fetchExperts(page + 1, true)
    setLoadingMore(false)
  }

  const clearFilters = () => {
    setSpecialization("")
    setMinExperience(0)
    setMinRating(0)
    setAvailableOnly(false)
    setSort("rating")
  }

  const hasActiveFilters = specialization || minExperience > 0 || minRating > 0 || availableOnly

  // Filter experts by search
  const filteredExperts = search
    ? experts.filter(
        (e) =>
          getUserDisplayName(e).toLowerCase().includes(search.toLowerCase()) ||
          e.expertProfile?.specializations?.some((s) =>
            ADVISORY_CATEGORIES[s as keyof typeof ADVISORY_CATEGORIES]?.name
              .toLowerCase()
              .includes(search.toLowerCase())
          )
      )
    : experts

  return (
    <Suspense fallback={<Loading />}> {/* Wrap the main content in a Suspense boundary */}
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Expert Directory</h1>
          <p className="text-muted-foreground">
            Find and connect with agricultural experts for personalized advice
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Experts</p>
                  <p className="text-2xl font-bold">{experts.length}+</p>
                </div>
                <User className="h-8 w-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Verified</p>
                  <p className="text-2xl font-bold text-green-600">
                    {experts.filter((e) => e.expertProfile?.isVerified).length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Available Now</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {experts.filter((e) => e.expertProfile?.isAvailable).length}
                  </p>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-600/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Rating</p>
                  <p className="text-2xl font-bold">
                    {(
                      experts.reduce((acc, e) => acc + (e.expertProfile?.rating || 0), 0) /
                        (experts.length || 1)
                    ).toFixed(1)}
                  </p>
                </div>
                <Star className="h-8 w-8 text-yellow-400/40" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search experts by name or specialization..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Select value={specialization} onValueChange={setSpecialization}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Specializations</SelectItem>
                    {Object.entries(ADVISORY_CATEGORIES).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Top Rated</SelectItem>
                    <SelectItem value="experience">Most Experienced</SelectItem>
                    <SelectItem value="answers">Most Answers</SelectItem>
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
                      <SheetTitle>Filter Experts</SheetTitle>
                      <SheetDescription>
                        Refine your search with additional filters
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6 space-y-6">
                      <div className="space-y-4">
                        <Label>Minimum Experience ({minExperience} years)</Label>
                        <Slider
                          value={[minExperience]}
                          onValueChange={([value]) => setMinExperience(value)}
                          max={30}
                          step={1}
                        />
                      </div>
                      <div className="space-y-4">
                        <Label>Minimum Rating ({minRating.toFixed(1)})</Label>
                        <Slider
                          value={[minRating]}
                          onValueChange={([value]) => setMinRating(value)}
                          max={5}
                          step={0.5}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="available">Available Now Only</Label>
                        <Switch
                          id="available"
                          checked={availableOnly}
                          onCheckedChange={setAvailableOnly}
                        />
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
                {specialization && specialization !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {ADVISORY_CATEGORIES[specialization as keyof typeof ADVISORY_CATEGORIES]?.name}
                    <button onClick={() => setSpecialization("")} className="ml-1 hover:text-destructive">
                      ×
                    </button>
                  </Badge>
                )}
                {minExperience > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    {minExperience}+ years
                    <button onClick={() => setMinExperience(0)} className="ml-1 hover:text-destructive">
                      ×
                    </button>
                  </Badge>
                )}
                {minRating > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    {minRating}+ rating
                    <button onClick={() => setMinRating(0)} className="ml-1 hover:text-destructive">
                      ×
                    </button>
                  </Badge>
                )}
                {availableOnly && (
                  <Badge variant="secondary" className="gap-1">
                    Available only
                    <button onClick={() => setAvailableOnly(false)} className="ml-1 hover:text-destructive">
                      ×
                    </button>
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear all
                </Button>
              </div>
            )}

            {/* Experts Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <ExpertCardSkeleton key={i} />)
              ) : filteredExperts.length === 0 ? (
                <Card className="md:col-span-2">
                  <CardContent className="py-12 text-center">
                    <User className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No experts found</h3>
                    <p className="text-muted-foreground mb-4">
                      Try adjusting your filters or search terms
                    </p>
                    <Button variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredExperts.map((expert) => (
                  <ExpertCard key={expert._id} expert={expert} />
                ))
              )}
            </div>

            {/* Load More */}
            {hasMore && !loading && filteredExperts.length > 0 && (
              <div className="flex justify-center pt-4">
                <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More Experts"
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Top Rated Experts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Top Rated Experts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16 mt-1" />
                      </div>
                    </div>
                  ))
                ) : (
                  topExperts.slice(0, 5).map((expert, index) => (
                    <Link
                      key={expert._id}
                      href={`/dashboard/experts/${expert._id}`}
                      className="flex items-center gap-3 group"
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={expert.avatar?.url || "/placeholder.svg"} />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {expert.name?.first?.[0]}
                            {expert.name?.last?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        {index < 3 && (
                          <span
                            className={cn(
                              "absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white",
                              index === 0
                                ? "bg-yellow-500"
                                : index === 1
                                  ? "bg-gray-400"
                                  : "bg-amber-600"
                            )}
                          >
                            {index + 1}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                          {getUserDisplayName(expert)}
                        </p>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-muted-foreground">
                            {expert.expertProfile?.rating?.toFixed(1)} · {expert.expertProfile?.totalAnswers} answers
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Browse by Specialization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(ADVISORY_CATEGORIES).slice(0, 8).map(([key, value]) => {
                  const Icon = categoryIcons[key] || Award
                  const count = experts.filter((e) =>
                    e.expertProfile?.specializations?.includes(key)
                  ).length
                  return (
                    <button
                      key={key}
                      onClick={() => setSpecialization(key)}
                      className={cn(
                        "w-full flex items-center justify-between p-2 rounded-md text-sm transition-colors",
                        specialization === key
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {value.name}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {count}
                      </Badge>
                    </button>
                  )
                })}
              </CardContent>
            </Card>

            {/* Quick Help */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Can&apos;t find the right expert? Post a question and let our experts come to you!
                </p>
                <Button className="w-full" asChild>
                  <Link href="/dashboard/questions/ask">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Ask a Question
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Suspense>
  )
}
