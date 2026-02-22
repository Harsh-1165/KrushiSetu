"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  HelpCircle,
  MessageSquare,
  FileText,
  ThumbsUp,
  Star,
  Clock,
  CheckCircle2,
  ChevronRight,
  Plus,
  TrendingUp,
  User,
  Award,
  ArrowRight,
  BookOpen,
  Eye,
  AlertCircle,
  Zap,
  Target,
  Users,
  Calendar,
  PenTool,
  Trophy,
  BarChart3,
  MessageCircle,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatsCard, StatsGrid } from "./stats-card"
import { NoQuestions, NoArticles } from "./empty-state"
import { useExpertDashboardStats } from "@/lib/use-expert-dashboard"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface ExpertDashboardProps {
  user: {
    name: { first: string; last: string }
  }
}

export function ExpertDashboard({ user }: ExpertDashboardProps) {
  const { stats } = useExpertDashboardStats()
  const [showSkeleton, setShowSkeleton] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setShowSkeleton(false), 600)
    return () => clearTimeout(t)
  }, [])
  const isLoading = showSkeleton

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-green-100 text-green-800 border-green-200"
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "answer":
        return <MessageSquare className="h-4 w-4" />
      case "article":
        return <FileText className="h-4 w-4" />
      case "accepted":
        return <CheckCircle2 className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "answer":
        return "bg-blue-100 text-blue-600"
      case "article":
        return "bg-green-100 text-green-600"
      case "accepted":
        return "bg-yellow-100 text-yellow-600"
      default:
        return "bg-gray-100 text-gray-600"
    }
  }

  // Calculate profile completeness from fields (guard against empty profileFields → NaN)
  const completedFields = Object.values(stats.profileFields || {}).filter(Boolean).length
  const totalFields = Object.keys(stats.profileFields || {}).length
  const profilePercentage =
    totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {greeting()}, {user?.name?.first || "Expert"}!
          </h1>
          <p className="text-muted-foreground">
            Help farmers with their questions and share your expertise.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild className="bg-transparent">
            <Link href="/dashboard/questions">
              <HelpCircle className="mr-2 h-4 w-4" />
              Answer Questions
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/articles/new">
              <Plus className="mr-2 h-4 w-4" />
              Write Article
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <StatsGrid>
        <StatsCard
          title="Questions Answered"
          value={stats.totalAnswers}
          description={`${stats.weeklyAnswers} this week`}
          icon={MessageSquare}
          trend={
            stats.answerStats.lastWeek > 0
              ? {
                  value: Math.round(
                    ((stats.answerStats.thisWeek - stats.answerStats.lastWeek) /
                      stats.answerStats.lastWeek) *
                      100
                  ),
                  isPositive: stats.answerStats.thisWeek >= stats.answerStats.lastWeek,
                }
              : stats.answerStats.thisWeek > 0
                ? { value: 100, isPositive: true }
                : undefined
          }
          loading={isLoading}
        />
        <StatsCard
          title="Total Upvotes"
          value={Number(stats.totalUpvotes).toLocaleString()}
          description={`${stats.answerStats.avgUpvotesPerAnswer ?? 0} avg per answer`}
          icon={ThumbsUp}
          trend={
            stats.totalAnswers > 0
              ? { value: 8.7, isPositive: true }
              : undefined
          }
          loading={isLoading}
        />
        <StatsCard
          title="Average Rating"
          value={Number(stats.averageRating).toFixed(1)}
          description={`${stats.acceptedAnswers} accepted answers`}
          icon={Star}
          loading={isLoading}
        />
        <StatsCard
          title="Articles Published"
          value={stats.articlesPublished}
          description={`${(stats.articles ?? []).reduce((acc, a) => acc + (a.views ?? 0), 0).toLocaleString()} total views`}
          icon={FileText}
          loading={isLoading}
        />
      </StatsGrid>

      {/* Ranking & Reputation Banner */}
      {isLoading ? (
        <Skeleton className="h-24 w-full rounded-lg" />
      ) : (
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Trophy className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">Expert Rank #{stats.rank}</h3>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      Top 2%
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {stats.totalExperts > 0
                      ? `Out of ${stats.totalExperts} verified experts on the platform`
                      : "Verified expert on the platform"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {stats.badges.map((badge, i) => (
                  <Badge key={i} variant="outline" className="bg-background">
                    <Award className="h-3 w-3 mr-1" />
                    {badge}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile & Questions */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Profile Completeness & Expertise */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Overview
            </CardTitle>
            <CardDescription>Complete your profile to build trust</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-20 w-20 rounded-full mx-auto" />
                <Skeleton className="h-4 w-3/4 mx-auto" />
              </div>
            ) : (
              <>
                {/* Profile Completeness */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Profile Completeness</span>
                    <span className="font-bold text-primary">
                      {Number.isNaN(profilePercentage) ? 0 : profilePercentage}%
                    </span>
                  </div>
                  <Progress
                    value={Number.isNaN(profilePercentage) ? 0 : Math.min(100, Math.max(0, profilePercentage))}
                    className="h-2"
                  />

                  {/* Missing fields */}
                  {profilePercentage < 100 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {Object.entries(stats.profileFields)
                        .filter(([, completed]) => !completed)
                        .map(([field]) => (
                          <Badge key={field} variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                            + Add {field.replace(/([A-Z])/g, ' $1').toLowerCase()}
                          </Badge>
                        ))}
                    </div>
                  )}
                </div>

                {/* Expertise Areas with Stats */}
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Expertise Areas
                  </h4>
                  <div className="space-y-2">
                    {stats.expertiseAreas.map((area, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-normal">
                            {area.name}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {area.questionsAnswered}
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {area.rating}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rating Display */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Star className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium">Expert Rating</p>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "h-4 w-4",
                              i < Math.floor(stats.averageRating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            )}
                          />
                        ))}
                        <span className="text-sm ml-1 font-semibold">{stats.averageRating}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{stats.helpedFarmers}</p>
                    <p className="text-xs text-muted-foreground">Farmers helped</p>
                  </div>
                </div>

                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/dashboard/profile">
                    Edit Profile
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Questions Awaiting Answers */}
        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Questions Awaiting Answers
                {stats.pendingQuestions > 0 && (
                  <Badge variant="destructive">{stats.pendingQuestions}</Badge>
                )}
              </CardTitle>
              <CardDescription>Help farmers with their queries</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/questions">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-lg border space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : stats.recentQuestions.length > 0 ? (
              <div className="space-y-3">
                {stats.recentQuestions.slice(0, 4).map((question) => (
                  <div
                    key={question._id}
                    className="p-4 rounded-lg border hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/dashboard/questions/${question._id}`} className="flex-1">
                        <h4 className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors group-hover:text-primary">
                          {question.title}
                        </h4>
                      </Link>
                      <Badge
                        variant="outline"
                        className={cn("text-xs shrink-0", getUrgencyColor(question.urgency))}
                      >
                        {question.urgency === "high" && <Zap className="h-3 w-3 mr-1" />}
                        {question.urgency}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="secondary">{question.category}</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {question.askedBy?.name?.first} {question.askedBy?.name?.last}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {question.views} views
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}
                      </span>
                      <Button size="sm" asChild>
                        <Link href={`/dashboard/questions/${question._id}`}>
                          Answer Now
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Quick action to see more */}
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/dashboard/questions?filter=unanswered">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    View All {stats.pendingQuestions} Pending Questions
                  </Link>
                </Button>
              </div>
            ) : (
              <NoQuestions />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Answer Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Answer Statistics
          </CardTitle>
          <CardDescription>Your contribution metrics and performance</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4 rounded-lg border space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
              <div className="p-4 rounded-lg border text-center hover:bg-muted/50 transition-colors">
                <div className="text-3xl font-bold text-primary">{stats.totalAnswers}</div>
                <p className="text-sm text-muted-foreground">Total Answers</p>
                <p className="text-xs text-green-600 mt-1">+{stats.answerStats.thisMonth} this month</p>
              </div>
              <div className="p-4 rounded-lg border text-center hover:bg-muted/50 transition-colors">
                <div className="text-3xl font-bold text-green-600">{stats.responseRate}%</div>
                <p className="text-sm text-muted-foreground">Response Rate</p>
                <p className="text-xs text-muted-foreground mt-1">Avg: {stats.avgResponseTime}</p>
              </div>
              <div className="p-4 rounded-lg border text-center hover:bg-muted/50 transition-colors">
                <div className="text-3xl font-bold text-blue-600">{stats.answerStats.acceptanceRate}%</div>
                <p className="text-sm text-muted-foreground">Acceptance Rate</p>
                <p className="text-xs text-muted-foreground mt-1">{stats.acceptedAnswers} accepted</p>
              </div>
              <div className="p-4 rounded-lg border text-center hover:bg-muted/50 transition-colors">
                <div className="text-3xl font-bold text-yellow-600">{stats.totalUpvotes}</div>
                <p className="text-sm text-muted-foreground">Total Upvotes</p>
                <p className="text-xs text-muted-foreground mt-1">{stats.answerStats.avgUpvotesPerAnswer} avg/answer</p>
              </div>
              <div className="p-4 rounded-lg border text-center hover:bg-muted/50 transition-colors">
                <div className="text-3xl font-bold text-purple-600">{stats.helpedFarmers}</div>
                <p className="text-sm text-muted-foreground">Farmers Helped</p>
                <p className="text-xs text-green-600 mt-1">+12 this week</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity & Articles */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your contributions this week</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (stats.recentActivity?.length ?? 0) > 0 ? (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

                <div className="space-y-4">
                  {stats.recentActivity.map((activity, i) => (
                    <div key={i} className="flex gap-4 relative group">
                      <div
                        className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center z-10 transition-transform group-hover:scale-110",
                          getActivityColor(activity.type)
                        )}
                      >
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
                          </span>
                          {activity.upvotes && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <ThumbsUp className="h-3 w-3" />
                              {activity.upvotes}
                            </span>
                          )}
                          {activity.views && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {activity.views}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <TrendingUp className="h-12 w-12 mb-3 opacity-50" />
                <p className="font-medium text-foreground">No activity yet</p>
                <p className="text-sm">Answer questions or publish articles to see your contributions here.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Published Articles */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Your Articles
              </CardTitle>
              <CardDescription>Knowledge you&apos;ve shared</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/articles">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-3 rounded-lg border space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : stats.articlesPublished > 0 ? (
              <div className="space-y-3">
                {stats.articles.slice(0, 4).map((article) => (
                  <Link
                    key={article._id}
                    href={`/dashboard/articles/${article._id}`}
                    className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <h4 className="font-medium text-sm line-clamp-1">{article.title}</h4>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {article.views.toLocaleString()} views
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        {article.likes} likes
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {article.comments}
                      </span>
                      <span>{formatDistanceToNow(new Date(article.date), { addSuffix: true })}</span>
                    </div>
                  </Link>
                ))}
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/dashboard/articles/new">
                    <PenTool className="mr-2 h-4 w-4" />
                    Write New Article
                  </Link>
                </Button>
              </div>
            ) : (
              <NoArticles
                onAction={() => {
                  window.location.href = "/dashboard/articles/new"
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>Shortcuts to common tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2 bg-transparent hover:bg-primary/5" asChild>
              <Link href="/dashboard/questions?filter=unanswered">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <HelpCircle className="h-5 w-5 text-blue-600" />
                </div>
                <span className="font-medium">Answer Questions</span>
                <span className="text-xs text-muted-foreground">{stats.pendingQuestions} pending</span>
              </Link>
            </Button>

            <Button variant="outline" className="h-auto py-4 flex-col gap-2 bg-transparent hover:bg-primary/5" asChild>
              <Link href="/dashboard/articles/new">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <PenTool className="h-5 w-5 text-green-600" />
                </div>
                <span className="font-medium">Write Article</span>
                <span className="text-xs text-muted-foreground">Share knowledge</span>
              </Link>
            </Button>

            <Button variant="outline" className="h-auto py-4 flex-col gap-2 bg-transparent hover:bg-primary/5" asChild>
              <Link href="/dashboard/my-answers">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                </div>
                <span className="font-medium">My Answers</span>
                <span className="text-xs text-muted-foreground">{stats.totalAnswers} total</span>
              </Link>
            </Button>

            <Button variant="outline" className="h-auto py-4 flex-col gap-2 bg-transparent hover:bg-primary/5" asChild>
              <Link href="/dashboard/profile">
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-orange-600" />
                </div>
                <span className="font-medium">Edit Profile</span>
                <span className="text-xs text-muted-foreground">
                  {Number.isNaN(profilePercentage) ? 0 : profilePercentage}% complete
                </span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
