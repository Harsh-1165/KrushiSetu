"use client"

import React from "react"

import { useState } from "react"
import { MessageSquare, ThumbsUp, Reply, MoreHorizontal, Send } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { ArticleComment } from "@/lib/knowledge-hub-api"

interface CommentsSectionProps {
  articleId: string
  comments: ArticleComment[]
  totalComments: number
  onAddComment: (content: string, parentId?: string) => Promise<void>
  onLikeComment: (commentId: string) => void
  isAuthenticated: boolean
}

function CommentItem({
  comment,
  onLike,
  onReply,
  depth = 0,
}: {
  comment: ArticleComment
  onLike: (id: string) => void
  onReply: (id: string) => void
  depth?: number
}) {
  const [showReplies, setShowReplies] = useState(false)
  const authorName = `${comment.author.name.first} ${comment.author.name.last}`
  const authorInitials = `${comment.author.name.first[0]}${comment.author.name.last[0]}`

  return (
    <div className={cn("flex gap-3", depth > 0 && "ml-10")}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={comment.author.avatar?.url || "/placeholder.svg"} alt={authorName} />
        <AvatarFallback className="bg-primary/10 text-primary text-xs">
          {authorInitials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{authorName}</span>
              {comment.author.role === "expert" && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                  Expert
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {new Date(comment.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              {comment.isEdited && (
                <span className="text-xs text-muted-foreground">(edited)</span>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Report</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
        </div>

        <div className="flex items-center gap-4 mt-2">
          <button
            onClick={() => onLike(comment._id)}
            className={cn(
              "flex items-center gap-1 text-xs transition-colors",
              comment.isLiked
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ThumbsUp className={cn("h-3.5 w-3.5", comment.isLiked && "fill-current")} />
            {comment.likeCount > 0 && comment.likeCount}
          </button>
          {depth < 2 && (
            <button
              onClick={() => onReply(comment._id)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Reply className="h-3.5 w-3.5" />
              Reply
            </button>
          )}
          {comment.replyCount > 0 && depth < 2 && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="text-xs text-primary hover:underline"
            >
              {showReplies
                ? "Hide replies"
                : `View ${comment.replyCount} ${comment.replyCount === 1 ? "reply" : "replies"}`}
            </button>
          )}
        </div>

        {showReplies && comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-4">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply._id}
                comment={reply}
                onLike={onLike}
                onReply={onReply}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function CommentsSection({
  articleId,
  comments,
  totalComments,
  onAddComment,
  onLikeComment,
  isAuthenticated,
}: CommentsSectionProps) {
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setSubmitting(true)
    try {
      await onAddComment(newComment)
      setNewComment("")
    } catch (error) {
      console.error("Failed to add comment:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReply = async () => {
    if (!replyContent.trim() || !replyingTo) return

    setSubmitting(true)
    try {
      await onAddComment(replyContent, replyingTo)
      setReplyContent("")
      setReplyingTo(null)
    } catch (error) {
      console.error("Failed to add reply:", error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mt-12 pt-8 border-t">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold">
          Comments {totalComments > 0 && `(${totalComments})`}
        </h2>
      </div>

      {/* Add Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <Textarea
            placeholder="Share your thoughts..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px] mb-3"
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={submitting || !newComment.trim()}>
              <Send className="h-4 w-4 mr-2" />
              Post Comment
            </Button>
          </div>
        </form>
      ) : (
        <div className="bg-muted/50 rounded-lg p-6 text-center mb-8">
          <p className="text-muted-foreground mb-3">
            Please sign in to join the discussion
          </p>
          <Button variant="outline" asChild>
            <a href="/login">Sign In</a>
          </Button>
        </div>
      )}

      {/* Reply Form */}
      {replyingTo && (
        <div className="mb-6 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Replying to comment</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setReplyingTo(null)
                setReplyContent("")
              }}
            >
              Cancel
            </Button>
          </div>
          <Textarea
            placeholder="Write your reply..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            className="min-h-[80px] mb-2"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleReply}
              disabled={submitting || !replyContent.trim()}
            >
              <Send className="h-4 w-4 mr-2" />
              Reply
            </Button>
          </div>
        </div>
      )}

      {/* Comments List */}
      {comments.length > 0 ? (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              onLike={onLikeComment}
              onReply={(id) => {
                if (isAuthenticated) {
                  setReplyingTo(id)
                }
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>No comments yet. Be the first to share your thoughts!</p>
        </div>
      )}
    </section>
  )
}
