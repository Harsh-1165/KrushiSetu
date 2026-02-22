"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Plus,
  MessageSquare,
  Eye,
  Clock,
  ChevronRight,
  HelpCircle,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
  Edit,
  RefreshCw,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

import {
  questionApi,
  type Question,
  ADVISORY_CATEGORIES,
  formatTimeAgo,
  getUrgencyColor,
  getStatusColor,
} from "@/lib/advisory-api"
import { useUser } from "@/contexts/auth-context"

// Status icons
const statusIcons: Record<string, typeof HelpCircle> = {
  open: HelpCircle,
  answered: MessageSquare,
  resolved: CheckCircle,
  closed: XCircle,
}

function QuestionCard({ question, onDelete }: { question: Question; onDelete: (id: string) => void }) {
  const StatusIcon = statusIcons[question.status] || HelpCircle
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await questionApi.delete(question._id)
      toast.success("Question deleted successfully")
      onDelete(question._id)
    } catch (error) {
      toast.error("Failed to delete question")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={getUrgencyColor(question.urgency)}>
                {question.urgency}
              </Badge>
              <Badge variant="secondary" className={getStatusColor(question.status)}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {question.status}
              </Badge>
              {question.isEdited && (
                <Badge variant="outline" className="text-xs">edited</Badge>
              )}
            </div>
            <Link href={`/dashboard/questions/${question._id}`}>
              <h3 className="font-semibold text-lg hover:text-primary transition-colors line-clamp-2">
                {question.title}
              </h3>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {question.description}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <Badge variant="outline">
            {ADVISORY_CATEGORIES[question.category as keyof typeof ADVISORY_CATEGORIES]?.name || question.category}
          </Badge>
          {question.cropType && (
            <Badge variant="secondary">{question.cropType}</Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-3 border-t">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              {question.answerCount} answers
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {question.viewCount} views
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatTimeAgo(question.createdAt)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {question.status !== "resolved" && question.status !== "closed" && (
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/dashboard/questions/${question._id}/edit`}>
                  <Edit className="h-4 w-4" />
                </Link>
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Question?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your
                    question and all associated answers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/dashboard/questions/${question._id}`}>
                View <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

function QuestionCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-6 w-full" />
      </CardHeader>
      <CardContent className="pb-3">
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-2 mt-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-16" />
        </div>
      </CardContent>
      <CardFooter className="pt-3 border-t">
        <div className="flex items-center justify-between w-full">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-8 w-16" />
        </div>
      </CardFooter>
    </Card>
  )
}

export default function MyQuestionsPage() {
  const { user } = useUser()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const fetchQuestions = async (status?: string, pageNum = 1, append = false) => {
    try {
      const params: { page: number; limit: number; status?: string } = {
        page: pageNum,
        limit: 10,
      }
      if (status && status !== "all") {
        params.status = status
      }

      const response = await questionApi.getMyQuestions(params)

      if (append) {
        setQuestions((prev) => [...prev, ...response.questions])
      } else {
        setQuestions(response.questions)
      }
      setHasMore(response.pagination.page < response.pagination.pages)
      setPage(pageNum)
    } catch (error) {
      console.log("Error fetching my questions:", error)
      toast.error("Failed to load questions")
    }
  }

  useEffect(() => {
    const loadQuestions = async () => {
      setLoading(true)
      await fetchQuestions(activeTab === "all" ? undefined : activeTab)
      setLoading(false)
    }
    loadQuestions()
  }, [activeTab])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setPage(1)
    setHasMore(true)
  }

  const loadMore = async () => {
    setLoadingMore(true)
    await fetchQuestions(activeTab === "all" ? undefined : activeTab, page + 1, true)
    setLoadingMore(false)
  }

  const handleDelete = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q._id !== id))
  }

  const stats = {
    total: questions.length,
    open: questions.filter((q) => q.status === "open").length,
    answered: questions.filter((q) => q.status === "answered").length,
    resolved: questions.filter((q) => q.status === "resolved").length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Questions</h1>
          <p className="text-muted-foreground">
            Manage and track all your questions
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/questions/ask">
            <Plus className="h-4 w-4 mr-2" />
            Ask New Question
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Questions</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <HelpCircle className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open</p>
                <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-600/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Answered</p>
                <p className="text-2xl font-bold text-purple-600">{stats.answered}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-purple-600/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="answered">Answered</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
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
                    {activeTab === "all"
                      ? "You haven't asked any questions yet"
                      : `No ${activeTab} questions`}
                  </p>
                  <Button asChild>
                    <Link href="/dashboard/questions/ask">
                      <Plus className="h-4 w-4 mr-2" />
                      Ask Your First Question
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {questions.map((question) => (
                  <QuestionCard
                    key={question._id}
                    question={question}
                    onDelete={handleDelete}
                  />
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
