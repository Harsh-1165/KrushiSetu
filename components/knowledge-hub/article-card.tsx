"use client"

import Link from "next/link"
import Image from "next/image"
import { Clock, Eye, Heart, Bookmark, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import type { Article } from "@/lib/knowledge-hub-api"

interface ArticleCardProps {
  article: Article
  variant?: "default" | "featured" | "compact"
  onLike?: (id: string) => void
  onBookmark?: (id: string) => void
  isLiked?: boolean
  isBookmarked?: boolean
}

export function ArticleCard({
  article,
  variant = "default",
  onLike,
  onBookmark,
  isLiked = false,
  isBookmarked = false,
}: ArticleCardProps) {
  const authorName = article.author && typeof article.author === 'object' && 'name' in article.author ? `${article.author.name.first} ${article.author.name.last}` : "Unknown Author"
  const authorInitials = article.author && typeof article.author === 'object' && 'name' in article.author ? `${article.author.name.first?.[0] || ""}${article.author.name.last?.[0] || ""}` : "?"

  if (variant === "compact") {
    return (
      <Link href={`/knowledge-hub/article/${article.slug}`} className="group block">
        <div className="flex gap-4">
          {article.coverImage?.url && (
            <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg">
              <Image
                src={article.coverImage.url || "/placeholder.svg"}
                alt={article.coverImage.alt || article.title}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
              {article.title}
            </h4>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{article.readTime} min read</span>
              <span>·</span>
              <Eye className="h-3 w-3" />
              <span>{(article.views || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  if (variant === "featured") {
    return (
      <Card className="group overflow-hidden border-0 shadow-lg h-full relative">
        <div className="relative h-full w-full min-h-75 md:min-h-96">
          {article.coverImage?.url ? (
            <Image
              src={article.coverImage.url || "/placeholder.svg"}
              alt={article.coverImage.alt || article.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-linear-to-br from-primary/20 to-primary/5" />
          )}
          {/* Enhanced Gradient for better text readability */}
          <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/60 to-transparent opacity-90" />

          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white z-10">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary" className="bg-primary hover:bg-primary/90 text-primary-foreground border-none">
                {article.category.name}
              </Badge>
              {article.isFeatured && (
                <Badge variant="secondary" className="bg-amber-500/90 text-white backdrop-blur-sm">
                  Featured
                </Badge>
              )}
            </div>
            <Link href={`/knowledge-hub/article/${article.slug}`}>
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-3 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                {article.title}
              </h2>
            </Link>
            <p className="text-white/90 text-sm md:text-base line-clamp-2 mb-4 md:mb-6">{article.excerpt}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8 md:h-10 md:w-10 border-2 border-white/20">
                  <AvatarImage src={article.author.avatar?.url || "/placeholder.svg"} alt={authorName} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs md:text-sm">
                    {authorInitials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-white">{authorName}</p>
                  <p className="text-xs text-white/70">
                    {new Date(article.publishedAt || article.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs md:text-sm text-white/90">
                <span className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded-full backdrop-blur-sm">
                  <Clock className="h-3.5 w-3.5" />
                  {article.readTime} min
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="group h-full overflow-hidden transition-shadow hover:shadow-lg">
      <div className="relative aspect-video overflow-hidden">
        {article.coverImage?.url ? (
          <Image
            src={article.coverImage.url || "/placeholder.svg"}
            alt={article.coverImage.alt || article.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <span className="text-4xl text-primary/30">📚</span>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
            {article.category.name}
          </Badge>
        </div>
        <div className="absolute top-3 right-3 flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-full bg-background/90 backdrop-blur-sm hover:bg-background",
              isLiked && "text-red-500"
            )}
            onClick={(e) => {
              e.preventDefault()
              onLike?.(article._id)
            }}
          >
            <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-full bg-background/90 backdrop-blur-sm hover:bg-background",
              isBookmarked && "text-primary"
            )}
            onClick={(e) => {
              e.preventDefault()
              onBookmark?.(article._id)
            }}
          >
            <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current")} />
          </Button>
        </div>
      </div>
      <CardContent className="p-4">
        <Link href={`/knowledge-hub/article/${article.slug}`}>
          <h3 className="font-semibold text-lg line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {article.title}
          </h3>
        </Link>
        <p className="text-muted-foreground text-sm line-clamp-2 mb-4">{article.excerpt}</p>

        <div className="flex items-center justify-between pt-3 border-t">
          <Link href={`/knowledge-hub/author/${article.author._id}`} className="flex items-center gap-2 group/author">
            <Avatar className="h-7 w-7">
              <AvatarImage src={article.author.avatar?.url || "/placeholder.svg"} alt={authorName} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {authorInitials}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium group-hover/author:text-primary transition-colors">
              {authorName}
            </span>
          </Link>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {article.readTime} min
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              {article.stats.likes}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
