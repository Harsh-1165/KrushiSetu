"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeft,
  Calendar,
  Clock,
  Eye,
  Heart,
  Bookmark,
  Leaf,
  ChevronRight,
  UserPlus,
  Check,
  BadgeCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { ReadingProgress } from "@/components/knowledge-hub/reading-progress"
import { TableOfContents } from "@/components/knowledge-hub/table-of-contents"
import { ShareButtons } from "@/components/knowledge-hub/share-buttons"
import { CommentsSection } from "@/components/knowledge-hub/comments-section"
import { ArticleCard } from "@/components/knowledge-hub/article-card"
import { type Article, type ArticleComment, mockArticles } from "@/lib/knowledge-hub-api"

export default function ArticleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const contentRef = useRef<HTMLDivElement>(null)
  const slug = params.slug as string

  const [article, setArticle] = useState<Article | null>(null)
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([])
  const [comments, setComments] = useState<ArticleComment[]>([])
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [likeCount, setLikeCount] = useState(0)

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true)
      try {
        // Simulating API call
        await new Promise((resolve) => setTimeout(resolve, 500))

        const foundArticle = mockArticles.find((a) => a.slug === slug)
        if (foundArticle) {
          setArticle(foundArticle)
          setLikeCount(foundArticle.stats.likes)
          setRelatedArticles(
            mockArticles
              .filter(
                (a) =>
                  a._id !== foundArticle._id &&
                  (a.category.name === foundArticle.category.name ||
                    a.tags.some((t) => foundArticle.tags.includes(t)))
              )
              .slice(0, 4)
          )
        }
      } catch (error) {
        console.error("Error fetching article:", error)
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchArticle()
    }
  }, [slug])

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1))
    toast.success(isLiked ? "Removed from likes" : "Added to likes")
  }

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked)
    toast.success(isBookmarked ? "Removed from bookmarks" : "Added to bookmarks")
  }

  const handleFollow = () => {
    setIsFollowing(!isFollowing)
    toast.success(
      isFollowing
        ? "Unfollowed author"
        : `Now following ${article?.author.name.first} ${article?.author.name.last}`
    )
  }

  const handleAddComment = async (content: string, parentId?: string) => {
    // Simulating API call
    await new Promise((resolve) => setTimeout(resolve, 500))
    toast.success("Comment added successfully")
  }

  const handleLikeComment = (commentId: string) => {
    toast.success("Comment liked")
  }

  if (loading) {
    return <ArticleDetailSkeleton />
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Article not found</h1>
          <p className="text-muted-foreground mb-4">
            The article you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => router.push("/knowledge-hub")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Knowledge Hub
          </Button>
        </div>
      </div>
    )
  }

  const authorName = `${article.author.name.first} ${article.author.name.last}`
  const authorInitials = `${article.author.name.first[0]}${article.author.name.last[0]}`
  const articleUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `https://greentrace.com/knowledge-hub/article/${slug}`

  return (
    <>
      <ReadingProgress />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-1 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Leaf className="h-3.5 w-3.5" />
                </div>
                <span className="font-semibold text-sm">GreenTrace</span>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={cn(isLiked && "text-red-500")}
              >
                <Heart className={cn("h-4 w-4 mr-1", isLiked && "fill-current")} />
                {likeCount}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBookmark}
                className={cn(isBookmarked && "text-primary")}
              >
                <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current")} />
              </Button>
              <ShareButtons url={articleUrl} title={article.title} description={article.excerpt} />
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 justify-center">
            {/* Main Content */}
            <article className="flex-1 max-w-3xl">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <Link href="/knowledge-hub" className="hover:text-foreground">
                  Knowledge Hub
                </Link>
                <ChevronRight className="h-4 w-4" />
                <Link
                  href={`/knowledge-hub/category/${article.category.name.toLowerCase().replace(/\s+/g, "-")}`}
                  className="hover:text-foreground"
                >
                  {article.category.name}
                </Link>
              </nav>

              {/* Article Header */}
              <header className="mb-8">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <Badge variant="secondary">{article.category.name}</Badge>
                  <Badge variant="outline" className="capitalize">
                    {article.difficulty}
                  </Badge>
                  {article.isFeatured && (
                    <Badge className="bg-amber-500 text-white">Featured</Badge>
                  )}
                </div>

                <h1 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
                  {article.title}
                </h1>

                <p className="text-lg text-muted-foreground mb-6">{article.excerpt}</p>

                {/* Author Info */}
                <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y">
                  <div className="flex items-center gap-4">
                    <Link href={`/knowledge-hub/author/${article.author._id}`}>
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={article.author.avatar?.url || "/placeholder.svg"} alt={authorName} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {authorInitials}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div>
                      <Link
                        href={`/knowledge-hub/author/${article.author._id}`}
                        className="font-semibold hover:text-primary transition-colors flex items-center gap-1"
                      >
                        {authorName}
                        {article.author.expertProfile?.verified && (
                          <BadgeCheck className="h-4 w-4 text-primary" />
                        )}
                      </Link>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(article.publishedAt || article.createdAt).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            }
                          )}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {article.readTime} min read
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant={isFollowing ? "secondary" : "outline"}
                    size="sm"
                    onClick={handleFollow}
                  >
                    {isFollowing ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Follow
                      </>
                    )}
                  </Button>
                </div>
              </header>

              {/* Cover Image */}
              {article.coverImage?.url && (
                <div className="relative aspect-[16/9] rounded-lg overflow-hidden mb-8">
                  <Image
                    src={article.coverImage.url || "/placeholder.svg"}
                    alt={article.coverImage.alt || article.title}
                    fill
                    className="object-cover"
                    priority
                  />
                  {article.coverImage.caption && (
                    <p className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-sm p-2 text-center">
                      {article.coverImage.caption}
                    </p>
                  )}
                </div>
              )}

              {/* Article Content */}
              <div
                ref={contentRef}
                className="article-content"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />

              {/* Tags */}
              {article.tags.length > 0 && (
                <div className="mt-8 pt-6 border-t">
                  <h4 className="text-sm font-medium mb-3">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map((tag) => (
                      <Link
                        key={tag}
                        href={`/knowledge-hub?tags=${tag}`}
                        className="text-sm px-3 py-1 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center justify-between py-6 mt-6 border-t">
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {article.views.toLocaleString()} views
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    {likeCount.toLocaleString()} likes
                  </span>
                  <span className="flex items-center gap-1">
                    <Bookmark className="h-4 w-4" />
                    {article.stats.bookmarks.toLocaleString()} saves
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={isLiked ? "default" : "outline"}
                    size="sm"
                    onClick={handleLike}
                    className={cn(isLiked && "bg-red-500 hover:bg-red-600 text-white")}
                  >
                    <Heart className={cn("h-4 w-4 mr-2", isLiked && "fill-current")} />
                    {isLiked ? "Liked" : "Like"}
                  </Button>
                  <Button
                    variant={isBookmarked ? "default" : "outline"}
                    size="sm"
                    onClick={handleBookmark}
                  >
                    <Bookmark className={cn("h-4 w-4 mr-2", isBookmarked && "fill-current")} />
                    {isBookmarked ? "Saved" : "Save"}
                  </Button>
                </div>
              </div>

              {/* Comments */}
              <CommentsSection
                articleId={article._id}
                comments={comments}
                totalComments={article.stats.comments}
                onAddComment={handleAddComment}
                onLikeComment={handleLikeComment}
                isAuthenticated={false}
              />
            </article>

            {/* Sidebar */}
            <aside className="hidden lg:block w-72 space-y-6">
              <div className="sticky top-20">
                {/* Table of Contents */}
                <TableOfContents contentRef={contentRef} />

                {/* Author Card */}
                <div className="mt-6 rounded-lg border bg-card p-5">
                  <div className="text-center mb-4">
                    <Link href={`/knowledge-hub/author/${article.author._id}`}>
                      <Avatar className="h-16 w-16 mx-auto mb-3">
                        <AvatarImage src={article.author.avatar?.url || "/placeholder.svg"} alt={authorName} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                          {authorInitials}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <Link
                      href={`/knowledge-hub/author/${article.author._id}`}
                      className="font-semibold hover:text-primary transition-colors flex items-center justify-center gap-1"
                    >
                      {authorName}
                      {article.author.expertProfile?.verified && (
                        <BadgeCheck className="h-4 w-4 text-primary" />
                      )}
                    </Link>
                    {article.author.expertProfile && (
                      <p className="text-sm text-muted-foreground">
                        {article.author.expertProfile.experience}+ years experience
                      </p>
                    )}
                  </div>
                  {article.author.bio && (
                    <p className="text-sm text-muted-foreground text-center mb-4 line-clamp-3">
                      {article.author.bio}
                    </p>
                  )}
                  {article.author.expertProfile?.specializations && (
                    <div className="flex flex-wrap justify-center gap-1 mb-4">
                      {article.author.expertProfile.specializations.slice(0, 3).map((spec) => (
                        <Badge key={spec} variant="secondary" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <Button
                    variant={isFollowing ? "secondary" : "default"}
                    className="w-full"
                    size="sm"
                    onClick={handleFollow}
                  >
                    {isFollowing ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Follow Author
                      </>
                    )}
                  </Button>
                </div>

                {/* Related Articles */}
                {relatedArticles.length > 0 && (
                  <div className="mt-6 rounded-lg border bg-card p-5">
                    <h3 className="font-semibold mb-4">Related Articles</h3>
                    <div className="space-y-4">
                      {relatedArticles.slice(0, 4).map((related) => (
                        <ArticleCard key={related._id} article={related} variant="compact" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t py-6 bg-muted/30">
          <div className="container text-center text-sm text-muted-foreground">
            <p>GreenTrace Knowledge Hub - Empowering farmers with expert knowledge</p>
          </div>
        </footer>
      </div>
    </>
  )
}

function ArticleDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-32" />
        </div>
      </header>
      <main className="container py-8">
        <div className="max-w-3xl">
          <Skeleton className="h-4 w-48 mb-6" />
          <Skeleton className="h-6 w-24 mb-4" />
          <Skeleton className="h-12 w-full mb-2" />
          <Skeleton className="h-12 w-3/4 mb-6" />
          <Skeleton className="h-5 w-full mb-2" />
          <Skeleton className="h-5 w-2/3 mb-8" />
          <div className="flex items-center gap-4 py-4 border-y mb-8">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <Skeleton className="aspect-[16/9] w-full rounded-lg mb-8" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
