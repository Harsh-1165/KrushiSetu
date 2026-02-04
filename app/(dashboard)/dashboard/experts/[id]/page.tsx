"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Star,
  MessageSquare,
  Award,
  CheckCircle,
  Briefcase,
  GraduationCap,
  Mail,
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
  ThumbsUp,
  Calendar,
  BarChart3,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import {
  expertApi,
  type Expert,
  type Answer,
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
function StarRating({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? "h-6 w-6" : size === "sm" ? "h-3 w-3" : "h-4 w-4"
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            sizeClass,
            star <= Math.round(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "fill-muted text-muted"
          )}
        />
      ))}
      <span className={cn("font-medium ml-1", size === "lg" ? "text-xl" : "text-sm")}>
        {rating.toFixed(1)}
      </span>
    </div>
  )
}

// Answer preview card
function AnswerPreviewCard({
  answer,
}: {
  answer: Answer & { question: { title: string; category: string; status: string } }
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/dashboard/questions/${answer.question}`}
            className="font-medium text-sm hover:text-primary transition-colors line-clamp-2"
          >
            {answer.question.title}
          </Link>
          {answer.isAccepted && (
            <Badge className="bg-green-600 text-white shrink-0">
              <CheckCircle className="h-3 w-3 mr-1" />
              Accepted
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm text-muted-foreground line-clamp-3">{answer.content}</p>
      </CardContent>
      <CardFooter className="pt-2 border-t text-xs text-muted-foreground">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <ThumbsUp className="h-3 w-3" />
              {answer.helpfulCount} helpful
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTimeAgo(answer.createdAt)}
            </span>
          </div>
          <Badge variant="outline" className="text-xs">
            {ADVISORY_CATEGORIES[answer.question.category as keyof typeof ADVISORY_CATEGORIES]?.name ||
              answer.question.category}
          </Badge>
        </div>
      </CardFooter>
    </Card>
  )
}

export default function ExpertDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [expert, setExpert] = useState<Expert | null>(null)
  const [recentAnswers, setRecentAnswers] = useState<
    Array<Answer & { question: { title: string; category: string; status: string } }>
  >([])
  const [categoryStats, setCategoryStats] = useState<Array<{ _id: string; count: number; accepted: number }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchExpert = async () => {
      try {
        const response = await expertApi.getById(resolvedParams.id)
        setExpert(response.expert)
        setRecentAnswers(response.recentAnswers)
        setCategoryStats(response.categoryStats)
      } catch (error) {
        console.log("[v0] Error fetching expert:", error)
        setError("Expert not found")
      } finally {
        setLoading(false)
      }
    }
    fetchExpert()
  }, [resolvedParams.id])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Skeleton className="h-32 w-32 rounded-full" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !expert) {
    return (
      <div className="text-center py-12">
        <User className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Expert Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The expert profile you are looking for does not exist.
        </p>
        <Button asChild>
          <Link href="/dashboard/experts">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Experts
          </Link>
        </Button>
      </div>
    )
  }

  const profile = expert.expertProfile
  const totalAnswers = profile?.totalAnswers || 0
  const acceptedAnswers = categoryStats.reduce((acc, stat) => acc + stat.accepted, 0)
  const acceptanceRate = totalAnswers > 0 ? ((acceptedAnswers / totalAnswers) * 100).toFixed(1) : "0"

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/experts">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Experts
        </Link>
      </Button>

      {/* Expert Profile Card */}
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar className="h-32 w-32 border-4 border-primary/20">
              <AvatarImage src={expert.avatar?.url || "/placeholder.svg"} />
              <AvatarFallback className="bg-primary/10 text-primary text-4xl">
                {expert.name?.first?.[0]}
                {expert.name?.last?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold">{getUserDisplayName(expert)}</h1>
                {profile?.isVerified && (
                  <Badge variant="secondary" className="text-green-600 border-green-600 gap-1 w-fit mx-auto md:mx-0">
                    <CheckCircle className="h-3 w-3" />
                    Verified Expert
                  </Badge>
                )}
              </div>
              <StarRating rating={profile?.rating || 0} size="lg" />
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  {profile?.experience || 0} years experience
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  {totalAnswers} answers
                </span>
                <span className="flex items-center gap-1">
                  <Award className="h-4 w-4" />
                  {acceptanceRate}% acceptance rate
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined {formatTimeAgo(expert.createdAt)}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                {profile?.specializations?.map((spec) => {
                  const Icon = categoryIcons[spec] || Award
                  return (
                    <Badge key={spec} variant="outline" className="gap-1">
                      <Icon className="h-3 w-3" />
                      {ADVISORY_CATEGORIES[spec as keyof typeof ADVISORY_CATEGORIES]?.name || spec}
                    </Badge>
                  )
                })}
              </div>
              <div className="flex gap-3 mt-6 justify-center md:justify-start">
                <Button>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/dashboard/questions/ask?expert=${expert._id}`}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Ask Question
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="answers">
            <TabsList>
              <TabsTrigger value="answers">Recent Answers</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
            </TabsList>

            <TabsContent value="answers" className="mt-6 space-y-4">
              {recentAnswers.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="font-semibold mb-2">No answers yet</h3>
                    <p className="text-sm text-muted-foreground">
                      This expert hasn&apos;t answered any questions yet.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                recentAnswers.map((answer) => (
                  <AnswerPreviewCard key={answer._id} answer={answer} />
                ))
              )}
            </TabsContent>

            <TabsContent value="about" className="mt-6 space-y-6">
              {/* Qualifications */}
              {profile?.qualifications && profile.qualifications.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      Qualifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {profile.qualifications.map((qual, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                        <div>
                          <p className="font-medium">{qual.degree}</p>
                          <p className="text-sm text-muted-foreground">
                            {qual.institution} ({qual.year})
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Experience */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Experience
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {profile?.experience || 0} years of professional experience in agriculture and farming advisory.
                  </p>
                </CardContent>
              </Card>

              {/* Specializations */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Specializations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {profile?.specializations?.map((spec) => {
                      const Icon = categoryIcons[spec] || Award
                      return (
                        <div key={spec} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                          <Icon className="h-5 w-5 text-primary" />
                          <span className="text-sm font-medium">
                            {ADVISORY_CATEGORIES[spec as keyof typeof ADVISORY_CATEGORIES]?.name || spec}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Answers</span>
                <span className="font-bold">{totalAnswers}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Accepted Answers</span>
                <span className="font-bold text-green-600">{acceptedAnswers}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Acceptance Rate</span>
                <span className="font-bold">{acceptanceRate}%</span>
              </div>
              <Progress value={Number.parseFloat(acceptanceRate)} className="h-2" />
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Rating</span>
                <StarRating rating={profile?.rating || 0} size="sm" />
              </div>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          {categoryStats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Answers by Category</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {categoryStats.map((stat) => {
                  const Icon = categoryIcons[stat._id] || Award
                  const percentage = totalAnswers > 0 ? (stat.count / totalAnswers) * 100 : 0
                  return (
                    <div key={stat._id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          {ADVISORY_CATEGORIES[stat._id as keyof typeof ADVISORY_CATEGORIES]?.name || stat._id}
                        </span>
                        <span className="text-muted-foreground">
                          {stat.count} ({stat.accepted} accepted)
                        </span>
                      </div>
                      <Progress value={percentage} className="h-1.5" />
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          {/* Availability */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Availability</CardTitle>
            </CardHeader>
            <CardContent>
              {profile?.isAvailable ? (
                <div className="flex items-center gap-2 text-green-600">
                  <span className="w-3 h-3 rounded-full bg-green-600 animate-pulse" />
                  <span className="font-medium">Available for questions</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="w-3 h-3 rounded-full bg-muted" />
                  <span>Currently unavailable</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Response time usually within 24 hours
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
