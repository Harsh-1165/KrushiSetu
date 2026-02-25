"use client"

import React, { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  MessageSquare,
  Eye,
  ThumbsUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  Star,
  HelpCircle,
  AlertTriangle,
} from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { answerApi, formatTimeAgo } from "@/lib/advisory-api"
import { toast } from "sonner"
import type { Answer } from "@/lib/advisory-api"

// ─── Answer Card ────────────────────────────────────────────────────────────

function AnswerCard({ answer }: { answer: Answer }) {
  const [helpful, setHelpful] = useState(false)
  const [helpfulCount, setHelpfulCount] = useState(answer.helpfulCount)
  const [voting, setVoting] = useState(false)

  const handleVote = async () => {
    if (voting) return
    setVoting(true)
    try {
      const voteType = helpful ? "not_helpful" : "helpful"
      const response = await answerApi.vote(answer._id, voteType)
      setHelpful(response.isHelpful ?? !helpful)
      setHelpfulCount(
        typeof response.helpfulCount === "number" ? response.helpfulCount : helpfulCount
      )
    } catch {
      toast.error("Failed to vote")
    } finally {
      setVoting(false)
    }
  }

  const questionTitle = (answer.question as any)?.title || "Untitled Question"
  const questionId = (answer.question as any)?._id
  const questionStatus = (answer.question as any)?.status
  const questionViews = (answer.question as any)?.viewCount ?? 0

  return (
    <Card
      className={
        answer.isAccepted
          ? "border-green-500 bg-green-50/50 dark:bg-green-950/20 hover:shadow-md transition-shadow"
          : answer.needsMoreGuidance
            ? "border-orange-400 hover:shadow-md transition-shadow"
            : "hover:shadow-md transition-shadow"
    }
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-1">In response to:</p>
            {questionId ? (
              <Link
                href={`/dashboard/questions/${questionId}`}
                className="font-semibold text-base hover:text-primary transition-colors line-clamp-2 block"
              >
                {questionTitle}
              </Link>
            ) : (
              <p className="font-semibold text-base line-clamp-2">{questionTitle}</p>
            )}
          </div>
          {/* Status badges */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            {!answer.isAccepted && answer.needsMoreGuidance && (
              <Badge
                variant="outline"
                className="border-orange-400 text-orange-600 bg-orange-50 dark:bg-orange-950/30"
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                Needs Guidance
              </Badge>
            )}
            {answer.isAccepted && (
              <Badge className="bg-green-600 text-white hover:bg-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                Best Answer
              </Badge>
            )}
            {answer.isVerified && (
              <Badge variant="outline" className="border-blue-400 text-blue-600">
                <Star className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
            {questionStatus && (
              <Badge variant="secondary" className="text-xs capitalize">
                {questionStatus}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {/* Answer preview */}
        <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
          {answer.content}
        </p>

        {/* Needs More Guidance context banner */}
        {!answer.isAccepted && answer.needsMoreGuidance && (
          <div className="mt-3 flex items-center gap-2 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
            <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
            <p className="text-sm text-orange-700 dark:text-orange-300">
              The farmer has requested more detailed guidance on this answer.
            </p>
          </div>
        )}

        {/* Attachments preview */}
        {answer.attachments && answer.attachments.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {answer.attachments.map((att, index) =>
              att.type === "image" ? (
                <img
                  key={index}
                  src={att.url}
                  alt={att.filename}
                  className="h-12 w-12 object-cover rounded-lg border"
                />
              ) : (
                <a
                  key={index}
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-1 rounded-lg border text-xs hover:bg-muted transition-colors"
                >
                  {att.filename}
                </a>
              )
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="flex items-center justify-between w-full flex-wrap gap-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {questionViews} views
            </span>
            <span className="flex items-center gap-1">
              <ThumbsUp className="h-4 w-4" />
              {helpfulCount} helpful
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatTimeAgo(answer.createdAt)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* "Respond" CTA when farmer needs more guidance */}
            {answer.needsMoreGuidance && !answer.isAccepted && questionId && (
              <Button
                size="sm"
                asChild
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Link href={`/dashboard/questions/${questionId}`}>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Respond Now
                </Link>
              </Button>
            )}
            <Button
              variant={helpful ? "default" : "outline"}
              size="sm"
              onClick={handleVote}
              disabled={voting}
            >
              <ThumbsUp className="h-3 w-3 mr-1" />
              {voting ? "..." : helpful ? "Helpful ✓" : "Helpful"}
            </Button>
            {questionId && (
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/dashboard/questions/${questionId}`}>
                  View <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function AnswerCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-3 w-32 mb-2" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
      </CardHeader>
      <CardContent className="pb-3">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6 mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
      <CardFooter className="pt-3 border-t">
        <div className="flex items-center justify-between w-full">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-8 w-24" />
        </div>
      </CardFooter>
    </Card>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function MyAnswersPage() {
  const { user } = useAuth()
  const [answers, setAnswers] = useState<Answer[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [totalFromServer, setTotalFromServer] = useState(0)

  const fetchAnswers = useCallback(async (pageNum = 1, append = false) => {
    if (!user?.id && !user?._id) return
    const userId = user.id || (user as any)._id

    try {
      // Try /answers/my first; fall back to /answers/expert/:id if it fails
      let response: any
      try {
        response = await answerApi.getMyAnswers({ page: pageNum, limit: 10 })
      } catch {
        // Fallback: use the expert answers endpoint
        response = await answerApi.getExpertBestAnswers(userId)
      }

      const data: Answer[] = Array.isArray(response)
        ? response
        : response.data || response.answers || []

      if (append) {
        setAnswers((prev) => [...prev, ...data])
      } else {
        setAnswers(data)
      }

      const pagination = response.pagination
      if (pagination) {
        setHasMore(pagination.page < pagination.pages)
        setTotalFromServer(pagination.total || data.length)
      } else {
        setHasMore(data.length === 10)
        setTotalFromServer(data.length)
      }
      setPage(pageNum)
    } catch (error) {
      console.error("Error fetching answers:", error)
      toast.error("Failed to load your answers")
    }
  }, [user])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await fetchAnswers(1, false)
      setLoading(false)
    }
    if (user) load()
    else setLoading(false)
  }, [user, fetchAnswers])

  const loadMore = async () => {
    setLoadingMore(true)
    await fetchAnswers(page + 1, true)
    setLoadingMore(false)
  }

  // Derived stats
  const stats = {
    total: totalFromServer || answers.length,
    accepted: answers.filter((a) => a.isAccepted).length,
    verified: answers.filter((a) => a.isVerified).length,
    helpful: answers.reduce((sum, a) => sum + (a.helpfulCount || 0), 0),
    needsGuidance: answers.filter((a) => a.needsMoreGuidance && !a.isAccepted).length,
  }

  // Tab filtering
  const filteredAnswers =
    activeTab === "accepted"
      ? answers.filter((a) => a.isAccepted)
      : activeTab === "verified"
        ? answers.filter((a) => a.isVerified)
        : activeTab === "guidance"
          ? answers.filter((a) => a.needsMoreGuidance && !a.isAccepted)
          : answers

  const tabLabel = (tab: string) => {
    switch (tab) {
      case "accepted": return "Best Answers"
      case "verified": return "Verified"
      case "guidance": return "Needs Guidance"
      default: return "All"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Answers</h1>
          <p className="text-muted-foreground">
            Answers you've provided to help farmers
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/questions">
            <HelpCircle className="h-4 w-4 mr-2" />
            Browse Questions
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Answers</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Best Answers</p>
                <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Helpful Votes</p>
                <p className="text-2xl font-bold text-purple-600">{stats.helpful}</p>
              </div>
              <ThumbsUp className="h-8 w-8 text-purple-600/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Needs Guidance</p>
                <p className="text-2xl font-bold text-orange-600">{stats.needsGuidance}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Needs Guidance Alert Banner */}
      {!loading && stats.needsGuidance > 0 && (
        <Card className="border-orange-400 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="py-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0" />
              <p className="text-sm text-orange-700 dark:text-orange-300 flex-1">
                <strong>{stats.needsGuidance} farmer{stats.needsGuidance > 1 ? "s" : ""}</strong>{" "}
                {stats.needsGuidance > 1 ? "have" : "has"} requested more detailed guidance on your answers.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="border-orange-400 text-orange-600 hover:bg-orange-100 shrink-0"
                onClick={() => setActiveTab("guidance")}
              >
                View All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs + List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            All {answers.length > 0 && <span className="ml-1 text-xs opacity-70">({answers.length})</span>}
          </TabsTrigger>
          <TabsTrigger value="accepted">Best Answers</TabsTrigger>
          <TabsTrigger value="verified">Verified</TabsTrigger>
          <TabsTrigger value="guidance" className="relative">
            Needs Guidance
            {stats.needsGuidance > 0 && (
              <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-medium text-white">
                {stats.needsGuidance}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <AnswerCardSkeleton key={i} />
              ))
            ) : filteredAnswers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  {activeTab === "guidance" ? (
                    <>
                      <CheckCircle className="h-12 w-12 mx-auto text-green-500/40 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                      <p className="text-muted-foreground mb-4">
                        No farmers have requested more guidance yet.
                      </p>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        {activeTab === "all" ? "No answers yet" : `No ${tabLabel(activeTab)} answers`}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {activeTab === "all"
                          ? "You haven't provided any answers yet. Start helping farmers!"
                          : `You don't have any ${tabLabel(activeTab).toLowerCase()} answers yet.`}
                      </p>
                      <Button asChild>
                        <Link href="/dashboard/questions">Browse Questions</Link>
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                {filteredAnswers.map((answer) => (
                  <AnswerCard key={answer._id} answer={answer} />
                ))}
                {hasMore && activeTab === "all" && (
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
