"use client"

import React from "react"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  MessageSquare,
  Eye,
  Clock,
  ThumbsUp,
  ThumbsDown,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  XCircle,
  User,
  MapPin,
  Send,
  MoreVertical,
  Edit,
  Trash2,
  Flag,
  Share2,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Reply,
  Award,
  Loader2,
  ImageIcon,
  Video,
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
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

import {
  questionApi,
  answerApi,
  commentApi,
  type Question,
  type Answer,
  type Comment,
  ADVISORY_CATEGORIES,
  formatTimeAgo,
  getUserDisplayName,
  getUrgencyColor,
  getStatusColor,
} from "@/lib/advisory-api"
import { useUser } from "@/contexts/auth-context"

// Helper to get full file URL
const getFileUrl = (url?: string) => {
  if (!url) return "/placeholder.svg"
  if (url.startsWith("http")) return url
  // Assuming API_URL is like http://localhost:5000/api/v1, we want http://localhost:5000
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1").replace("/api/v1", "")
  return `${baseUrl}${url}`
}

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

// Status icons
const statusIcons: Record<string, typeof HelpCircle> = {
  open: HelpCircle,
  answered: MessageSquare,
  resolved: CheckCircle,
  closed: XCircle,
}

// Comment component
function CommentItem({
  comment,
  questionId,
  answerId,
  onReply,
  currentUserId,
}: {
  comment: Comment
  questionId: string
  answerId: string
  onReply: (parentId: string) => void
  currentUserId?: string
}) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(comment.likeCount)
  const [showReplies, setShowReplies] = useState(false)
  const [replies, setReplies] = useState<Comment[]>([])
  const [loadingReplies, setLoadingReplies] = useState(false)

  const handleLike = async () => {
    try {
      const response = await commentApi.like(comment._id)
      setLiked(response.isLiked)
      setLikeCount(response.likeCount)
    } catch (error) {
      toast.error("Failed to like comment")
    }
  }

  const loadReplies = async () => {
    if (replies.length > 0) {
      setShowReplies(!showReplies)
      return
    }

    setLoadingReplies(true)
    try {
      const response = await commentApi.getReplies(comment._id)
      setReplies(response.replies)
      setShowReplies(true)
    } catch (error) {
      toast.error("Failed to load replies")
    } finally {
      setLoadingReplies(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.author?.avatar?.url || "/placeholder.svg"} />
          <AvatarFallback className="text-xs">
            {comment.author?.name?.first?.[0]}
            {comment.author?.name?.last?.[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">
              {comment.author ? getUserDisplayName(comment.author) : "Anonymous"}
            </span>
            {comment.author?.role === "expert" && (
              <Badge variant="secondary" className="text-xs">Expert</Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {formatTimeAgo(comment.createdAt)}
            </span>
            {comment.isEdited && (
              <span className="text-xs text-muted-foreground">(edited)</span>
            )}
          </div>
          <p className="text-sm mt-1">{comment.content}</p>
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={handleLike}
              className={cn(
                "flex items-center gap-1 text-xs transition-colors",
                liked ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ThumbsUp className="h-3 w-3" />
              {likeCount > 0 && likeCount}
            </button>
            <button
              onClick={() => onReply(comment._id)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Reply className="h-3 w-3" />
              Reply
            </button>
            {comment.replyCount > 0 && (
              <button
                onClick={loadReplies}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                {loadingReplies ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : showReplies ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
                {comment.replyCount} {comment.replyCount === 1 ? "reply" : "replies"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      {showReplies && replies.length > 0 && (
        <div className="ml-11 pl-4 border-l space-y-3">
          {replies.map((reply) => (
            <CommentItem
              key={reply._id}
              comment={reply}
              questionId={questionId}
              answerId={answerId}
              onReply={onReply}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Answer component
function AnswerCard({
  answer,
  question,
  currentUserId,
  isQuestionAuthor,
  onUpdate,
}: {
  answer: Answer
  question: Question
  currentUserId?: string
  isQuestionAuthor: boolean
  onUpdate: () => void
}) {
  const [helpful, setHelpful] = useState(false)
  const [helpfulCount, setHelpfulCount] = useState(answer.helpfulCount)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [submittingComment, setSubmittingComment] = useState(false)
  const [replyTo, setReplyTo] = useState<string | null>(null)

  const handleVote = async (voteType: "helpful" | "not_helpful") => {
    try {
      const response = await answerApi.vote(answer._id, voteType)
      setHelpful(response.isHelpful)
      setHelpfulCount(response.helpfulCount)
    } catch (error) {
      toast.error("Failed to vote")
    }
  }

  const handleAccept = async () => {
    try {
      await answerApi.accept(answer._id)
      toast.success("Answer accepted as best answer!")
      onUpdate()
    } catch (error) {
      toast.error("Failed to accept answer")
    }
  }

  const loadComments = async () => {
    if (comments.length > 0) {
      setShowComments(!showComments)
      return
    }

    setLoadingComments(true)
    try {
      const response = await commentApi.getByAnswer(answer._id)
      setComments(response.comments)
      setShowComments(true)
    } catch (error) {
      toast.error("Failed to load comments")
    } finally {
      setLoadingComments(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setSubmittingComment(true)
    try {
      const response = await commentApi.create(answer._id, newComment, replyTo || undefined)

      if (replyTo) {
        // Reload comments to show the reply
        const commentsRes = await commentApi.getByAnswer(answer._id)
        setComments(commentsRes.comments)
      } else {
        setComments((prev) => [response.comment, ...prev])
      }

      setNewComment("")
      setReplyTo(null)
      toast.success("Comment added")
    } catch (error) {
      toast.error("Failed to add comment")
    } finally {
      setSubmittingComment(false)
    }
  }

  return (
    <Card className={cn(answer.isAccepted && "border-green-500 bg-green-50/50 dark:bg-green-950/20")}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={answer.author?.avatar?.url || "/placeholder.svg"} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {answer.author?.name?.first?.[0]}
                {answer.author?.name?.last?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">
                  {answer.author ? getUserDisplayName(answer.author) : "Anonymous"}
                </p>
                <Badge variant="secondary" className="text-xs">
                  <Award className="h-3 w-3 mr-1" />
                  Expert
                </Badge>
                {answer.isVerified && (
                  <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {answer.author?.expertProfile?.specializations?.join(", ")} |{" "}
                {answer.author?.expertProfile?.experience} years experience
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatTimeAgo(answer.createdAt)}
                {answer.isEdited && " (edited)"}
              </p>
            </div>
          </div>
          {answer.isAccepted && (
            <Badge className="bg-green-600 text-white">
              <CheckCircle className="h-3 w-3 mr-1" />
              Best Answer
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Answer Content */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="whitespace-pre-wrap">{answer.content}</p>
        </div>

        {/* Recommendations */}
        {answer.recommendations && answer.recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Recommendations:</h4>
            <div className="space-y-2">
              {answer.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-3 rounded-lg border",
                    rec.priority === "high"
                      ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
                      : rec.priority === "medium"
                        ? "border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/30"
                        : "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Badge variant="outline" className="text-xs mb-1">
                        {rec.type?.replace(/_/g, " ")}
                      </Badge>
                      <p className="text-sm">{rec.description}</p>
                      {(rec.estimatedCost || rec.timeframe) && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {rec.estimatedCost && `Cost: ${rec.estimatedCost}`}
                          {rec.estimatedCost && rec.timeframe && " | "}
                          {rec.timeframe && `Timeframe: ${rec.timeframe}`}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs shrink-0",
                        rec.priority === "high"
                          ? "text-red-600 border-red-600"
                          : rec.priority === "medium"
                            ? "text-yellow-600 border-yellow-600"
                            : "text-green-600 border-green-600"
                      )}
                    >
                      {rec.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attachments */}
        {answer.attachments && answer.attachments.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Attachments:</h4>
            <div className="flex flex-wrap gap-2">
              {answer.attachments.map((att, index) => (
                <a
                  key={index}
                  href={getFileUrl(att.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded-lg border hover:bg-muted transition-colors"
                >
                  {att.type === "image" ? (
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  ) : att.type === "video" ? (
                    <Video className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Package className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm truncate max-w-[200px]">{att.filename}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-3 border-t flex flex-col items-stretch gap-4">
        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={helpful ? "default" : "outline"}
              size="sm"
              onClick={() => handleVote("helpful")}
              className="gap-1"
            >
              <ThumbsUp className="h-4 w-4" />
              Helpful {helpfulCount > 0 && `(${helpfulCount})`}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote("not_helpful")}
            >
              <ThumbsDown className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="ghost" size="sm" onClick={loadComments}>
              {loadingComments ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageSquare className="h-4 w-4" />
              )}
              <span className="ml-1">Comments</span>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {isQuestionAuthor && !answer.isAccepted && question.status !== "resolved" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAccept}
                className="text-green-600 border-green-600 hover:bg-green-50 bg-transparent"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Accept Answer
              </Button>
            )}
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="space-y-4 pt-4 border-t">
            {/* Add Comment Form */}
            <form onSubmit={handleSubmitComment} className="flex gap-2">
              <Textarea
                placeholder={replyTo ? "Write a reply..." : "Add a comment..."}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={2}
                className="flex-1 resize-none"
              />
              <div className="flex flex-col gap-1">
                <Button type="submit" size="sm" disabled={submittingComment || !newComment.trim()}>
                  {submittingComment ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
                {replyTo && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyTo(null)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                comments.map((comment) => (
                  <CommentItem
                    key={comment._id}
                    comment={comment}
                    questionId={question._id}
                    answerId={answer._id}
                    onReply={(parentId) => setReplyTo(parentId)}
                    currentUserId={currentUserId}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}

// Answer Form for Experts
function AnswerForm({
  questionId,
  onSubmit,
}: {
  questionId: string
  onSubmit: () => void
}) {
  const [content, setContent] = useState("")
  const [recommendations, setRecommendations] = useState<Array<{
    type: string
    description: string
    priority: string
    estimatedCost: string
    timeframe: string
  }>>([])
  const [submitting, setSubmitting] = useState(false)
  const [showRecommendationForm, setShowRecommendationForm] = useState(false)

  const addRecommendation = () => {
    setRecommendations([
      ...recommendations,
      {
        type: "immediate_action",
        description: "",
        priority: "medium",
        estimatedCost: "",
        timeframe: "",
      },
    ])
    setShowRecommendationForm(true)
  }

  const updateRecommendation = (index: number, field: string, value: string) => {
    const updated = [...recommendations]
    updated[index] = { ...updated[index], [field]: value }
    setRecommendations(updated)
  }

  const removeRecommendation = (index: number) => {
    setRecommendations(recommendations.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || content.length < 50) {
      toast.error("Answer must be at least 50 characters")
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("content", content)
      if (recommendations.length > 0) {
        formData.append("recommendations", JSON.stringify(recommendations))
      }

      await answerApi.create(questionId, formData)
      toast.success("Answer posted successfully!")
      setContent("")
      setRecommendations([])
      onSubmit()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to post answer")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Your Answer</CardTitle>
        <CardDescription>
          Share your expertise to help the farmer with their question
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="answer">Answer</Label>
            <Textarea
              id="answer"
              placeholder="Provide a detailed answer with practical advice..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
            />
            <p className="text-xs text-muted-foreground">
              {content.length}/10000 characters (minimum 50)
            </p>
          </div>

          {/* Recommendations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Recommendations (Optional)</Label>
              <Button type="button" variant="outline" size="sm" onClick={addRecommendation}>
                Add Recommendation
              </Button>
            </div>
            {recommendations.map((rec, index) => (
              <Card key={index} className="p-3">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <select
                      value={rec.type}
                      onChange={(e) => updateRecommendation(index, "type", e.target.value)}
                      className="text-sm border rounded px-2 py-1"
                    >
                      <option value="immediate_action">Immediate Action</option>
                      <option value="short_term">Short Term</option>
                      <option value="long_term">Long Term</option>
                      <option value="preventive">Preventive</option>
                      <option value="treatment">Treatment</option>
                      <option value="resource">Resource</option>
                    </select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRecommendation(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Describe the recommendation..."
                    value={rec.description}
                    onChange={(e) => updateRecommendation(index, "description", e.target.value)}
                    rows={2}
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={rec.priority}
                      onChange={(e) => updateRecommendation(index, "priority", e.target.value)}
                      className="text-sm border rounded px-2 py-1"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Est. Cost"
                      value={rec.estimatedCost}
                      onChange={(e) => updateRecommendation(index, "estimatedCost", e.target.value)}
                      className="text-sm border rounded px-2 py-1"
                    />
                    <input
                      type="text"
                      placeholder="Timeframe"
                      value={rec.timeframe}
                      onChange={(e) => updateRecommendation(index, "timeframe", e.target.value)}
                      className="text-sm border rounded px-2 py-1"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={submitting || content.length < 50}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Post Answer
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

export default function QuestionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { user } = useUser()

  const [question, setQuestion] = useState<(Question & { answers?: Answer[] }) | null>(null)
  const [relatedQuestions, setRelatedQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchQuestion = async () => {
    try {
      const response = await questionApi.getById(resolvedParams.id)
      setQuestion(response.question)
      setRelatedQuestions(response.relatedQuestions)
    } catch (error) {
      console.log("[v0] Error fetching question:", error)
      setError("Question not found")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuestion()
  }, [resolvedParams.id])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24 mt-1" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-4 w-3/4 mt-4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !question) {
    return (
      <div className="text-center py-12">
        <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Question Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The question you are looking for does not exist or has been deleted.
        </p>
        <Button asChild>
          <Link href="/dashboard/questions">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Questions
          </Link>
        </Button>
      </div>
    )
  }

  const CategoryIcon = categoryIcons[question.category] || HelpCircle
  const StatusIcon = statusIcons[question.status] || HelpCircle
  const isAuthor = user?.id === question.author?._id
  const isExpert = user?.role === "expert"
  const hasAnswered = question.answers?.some((a) => a.author?._id === user?.id)

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/questions">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Questions
        </Link>
      </Button>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Question Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={question.author?.avatar?.url || "/placeholder.svg"} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {question.author?.name?.first?.[0]}
                      {question.author?.name?.last?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {question.author ? getUserDisplayName(question.author) : "Anonymous"}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {formatTimeAgo(question.createdAt)}
                      {question.isEdited && " (edited)"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Bookmark className="h-4 w-4 mr-2" />
                        Bookmark
                      </DropdownMenuItem>
                      {isAuthor && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/questions/${question._id}/edit`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Flag className="h-4 w-4 mr-2" />
                        Report
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={getUrgencyColor(question.urgency)}>
                  {question.urgency} urgency
                </Badge>
                <Badge variant="secondary" className={getStatusColor(question.status)}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {question.status}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <CategoryIcon className="h-3 w-3" />
                  {ADVISORY_CATEGORIES[question.category as keyof typeof ADVISORY_CATEGORIES]?.name}
                </Badge>
                {question.cropType && <Badge variant="secondary">{question.cropType}</Badge>}
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold">{question.title}</h1>

              {/* Description */}
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{question.description}</p>
              </div>

              {/* Location */}
              {question.location && (question.location.state || question.location.district) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {[question.location.district, question.location.state].filter(Boolean).join(", ")}
                </div>
              )}

              {/* Tags */}
              {question.tags && question.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {question.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Attachments */}
              {question.attachments && question.attachments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Attachments:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {question.attachments.map((att, index) => (
                      <a
                        key={index}
                        href={getFileUrl(att.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative group"
                      >
                        {att.type === "image" ? (
                          <img
                            src={getFileUrl(att.url)}
                            alt={att.filename}
                            className="w-full h-24 object-cover rounded-lg border"
                          />
                        ) : (
                          <div className="w-full h-24 rounded-lg border flex items-center justify-center bg-muted">
                            <Video className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <span className="text-white text-xs">View</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t pt-4">
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {question.viewCount} views
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  {question.answerCount} answers
                </span>
              </div>
            </CardFooter>
          </Card>

          {/* Answers Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {question.answerCount} {question.answerCount === 1 ? "Answer" : "Answers"}
            </h2>

            {question.answers && question.answers.length > 0 ? (
              question.answers.map((answer) => (
                <AnswerCard
                  key={answer._id}
                  answer={answer}
                  question={question}
                  currentUserId={user?.id}
                  isQuestionAuthor={isAuthor}
                  onUpdate={fetchQuestion}
                />
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="font-semibold mb-2">No answers yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Be the first expert to answer this question!
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Answer Form for Experts */}
            {isExpert && !hasAnswered && question.status !== "closed" && (
              <AnswerForm questionId={question._id} onSubmit={fetchQuestion} />
            )}

            {isExpert && hasAnswered && (
              <Card>
                <CardContent className="py-6 text-center text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  You have already answered this question.
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Question Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Question Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge className={getStatusColor(question.status)}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {question.status}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Urgency</span>
                <Badge variant="outline" className={getUrgencyColor(question.urgency)}>
                  {question.urgency}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Category</span>
                <span className="text-sm font-medium">
                  {ADVISORY_CATEGORIES[question.category as keyof typeof ADVISORY_CATEGORIES]?.name}
                </span>
              </div>
              {question.cropType && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Crop Type</span>
                    <span className="text-sm font-medium">{question.cropType}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Assigned Expert */}
          {question.assignedExpert && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Assigned Expert</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={question.assignedExpert.avatar?.url || "/placeholder.svg"} />
                    <AvatarFallback>
                      {question.assignedExpert.name?.first?.[0]}
                      {question.assignedExpert.name?.last?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {getUserDisplayName(question.assignedExpert)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {question.assignedExpert.expertProfile?.experience} years experience
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Related Questions */}
          {relatedQuestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Related Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {relatedQuestions.map((q) => (
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
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
