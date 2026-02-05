"use client"

import React from "react"
import { Suspense } from "react"
import Loading from "./loading" // Import the Loading component

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Search,
  Filter,
  SlidersHorizontal,
  BookOpen,
  TrendingUp,
  Clock,
  ChevronRight,
  Loader2,
  Leaf,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { ArticleCard } from "@/components/knowledge-hub/article-card"
import { CategoryFilter } from "@/components/knowledge-hub/category-filter"
import {
  type Article,
  ARTICLE_CATEGORIES,
  mockArticles,
  type ArticleFilters,
  getArticles,
  getFeaturedArticles,
  getTrendingArticles,
} from "@/lib/knowledge-hub-api"

export default function KnowledgeHubPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [articles, setArticles] = useState<Article[]>([])
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([])
  const [trendingArticles, setTrendingArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get("category")
  )
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "latest")
  const [difficulty, setDifficulty] = useState<string | null>(
    searchParams.get("difficulty")
  )
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [likedArticles, setLikedArticles] = useState<Set<string>>(new Set())
  const [bookmarkedArticles, setBookmarkedArticles] = useState<Set<string>>(new Set())

  const categories = ARTICLE_CATEGORIES.map((cat) => ({
    id: cat.id,
    name: cat.name,
    articleCount: mockArticles.filter(
      (a) => a.category.name.toLowerCase().replace(/\s+/g, "-") === cat.id
    ).length,
  }))

  const fetchArticles = useCallback(async () => {
    setLoading(true)
    try {
      const filters: ArticleFilters = {
        page,
        limit: 12,
        category: selectedCategory || undefined,
        search: searchQuery || undefined,
        sort: sortBy || undefined,
        difficulty: difficulty || undefined,
      }

      const response = await getArticles(filters)
      if (response.success) {
        setArticles(response.data.articles)
        setTotalPages(response.data.pagination.pages)

        // Fetch featured and trending properly (or assume backend handles it if we had specific endpoints)
        // For now, let's just keep the state but ideally we should have separate effect or API calls 
        // if these lists are different from the main search results.
        // However, the original code filtered mockArticles. 
        // Let's rely on the backend for the main list. 
        // For featured/trending on the side/top, we might need separate calls if they aren't part of this response.

      }
    } catch (error) {
      console.error("Error fetching articles:", error)
    } finally {
      setLoading(false)
    }
  }, [selectedCategory, searchQuery, sortBy, difficulty, page])

  // Need to fetch featured and trending separately on mount since they shouldn't change with search filters
  useEffect(() => {
    const fetchSideData = async () => {
      try {
        const [featuredRes, trendingRes] = await Promise.all([
          getFeaturedArticles(),
          getTrendingArticles()
        ])
        if (featuredRes.success) setFeaturedArticles(featuredRes.data.articles)
        if (trendingRes.success) setTrendingArticles(trendingRes.data.articles)
      } catch (err) {
        console.error("Error fetching side data:", err)
      }
    }
    fetchSideData()
  }, [])

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchArticles()
  }

  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategory(categoryId)
    setPage(1)
  }

  const handleLike = (articleId: string) => {
    setLikedArticles((prev) => {
      const next = new Set(prev)
      if (next.has(articleId)) {
        next.delete(articleId)
      } else {
        next.add(articleId)
      }
      return next
    })
  }

  const handleBookmark = (articleId: string) => {
    setBookmarkedArticles((prev) => {
      const next = new Set(prev)
      if (next.has(articleId)) {
        next.delete(articleId)
      } else {
        next.add(articleId)
      }
      return next
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 md:px-6 flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Leaf className="h-4 w-4" />
            </div>
            <span className="font-semibold">GreenTrace</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/knowledge-hub"
              className="text-sm font-medium text-primary"
            >
              Knowledge Hub
            </Link>
            <Link
              href="/marketplace"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Marketplace
            </Link>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-background border-b">
          <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
            <div className="max-w-3xl mx-auto text-center mb-8">
              <Badge variant="secondary" className="mb-4">
                <BookOpen className="h-3 w-3 mr-1" />
                Knowledge Hub
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
                Agricultural Knowledge & Expert Insights
              </h1>
              <p className="text-lg text-muted-foreground text-pretty">
                Discover expert articles, farming guides, and latest agricultural
                practices to improve your yields and grow sustainably.
              </p>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto px-4 w-full">
              <div className="relative shadow-lg rounded-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search articles, topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-28 h-12 md:h-14 text-base rounded-full border-primary/20 bg-background/95 backdrop-blur-sm focus-visible:ring-primary/30"
                />
                <Button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full h-9 md:h-11 px-4 md:px-6"
                  size="sm"
                >
                  Search
                </Button>
              </div>
            </form>
          </div>
        </section>

        {/* Featured Articles */}
        {!searchQuery && !selectedCategory && featuredArticles.length > 0 && (
          <section className="container mx-auto px-4 md:px-6 py-8 md:py-12">
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Featured Articles</h2>
                <p className="text-sm text-muted-foreground mt-1">Handpicked guides for you</p>
              </div>
              <Link
                href="/knowledge-hub?featured=true"
                className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
              >
                View all <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {loading ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="aspect-[16/10] rounded-lg" />
                  ))}
                </>
              ) : (
                featuredArticles.map((article) => (
                  <ArticleCard
                    key={article._id}
                    article={article}
                    variant="featured"
                    onLike={handleLike}
                    onBookmark={handleBookmark}
                    isLiked={likedArticles.has(article._id)}
                    isBookmarked={bookmarkedArticles.has(article._id)}
                  />
                ))
              )}
            </div>
          </section>
        )}

        {/* Main Content */}
        {/* Main Content */}
        <section className="container mx-auto px-4 md:px-6 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Articles Grid */}
            <div className="flex-1 min-w-0">
              {/* Filters */}
              <div className="mb-6">
                <CategoryFilter
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onCategoryChange={handleCategoryChange}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {loading
                      ? "Loading..."
                      : `${articles.length} articles found`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="latest">Latest</SelectItem>
                      <SelectItem value="popular">Most Popular</SelectItem>
                      <SelectItem value="trending">Trending</SelectItem>
                      <SelectItem value="oldest">Oldest</SelectItem>
                    </SelectContent>
                  </Select>

                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="icon">
                        <SlidersHorizontal className="h-4 w-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>Filter Articles</SheetTitle>
                        <SheetDescription>
                          Refine your search with additional filters
                        </SheetDescription>
                      </SheetHeader>
                      <div className="py-6 space-y-6">
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Difficulty Level
                          </label>
                          <Select
                            value={difficulty || "all"} // Updated default value to "all"
                            onValueChange={(val) =>
                              setDifficulty(val || null)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="All levels" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All levels</SelectItem>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">
                                Intermediate
                              </SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Reading Time
                          </label>
                          <div className="flex flex-wrap gap-2">
                            <Badge
                              variant="outline"
                              className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                            >
                              {"< 5 min"}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                            >
                              5-10 min
                            </Badge>
                            <Badge
                              variant="outline"
                              className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                            >
                              {"10+ min"}
                            </Badge>
                          </div>
                        </div>

                        <Button
                          className="w-full"
                          onClick={() => {
                            setDifficulty(null)
                          }}
                          variant="outline"
                        >
                          Clear Filters
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>

              {/* Articles Grid */}
              {loading ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="aspect-[16/10] rounded-lg" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : articles.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No articles found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your filters or search query
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("")
                      setSelectedCategory(null)
                      setDifficulty(null)
                    }}
                  >
                    Clear all filters
                  </Button>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {articles.map((article) => (
                    <ArticleCard
                      key={article._id}
                      article={article}
                      onLike={handleLike}
                      onBookmark={handleBookmark}
                      isLiked={likedArticles.has(article._id)}
                      isBookmarked={bookmarkedArticles.has(article._id)}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4 text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="w-full lg:w-80 space-y-6">
              {/* Trending Articles */}
              <div className="rounded-lg border bg-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Trending Now</h3>
                </div>
                <div className="space-y-4">
                  {loading ? (
                    <>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex gap-3">
                          <Skeleton className="h-16 w-24 rounded" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    trendingArticles.map((article) => (
                      <ArticleCard
                        key={article._id}
                        article={article}
                        variant="compact"
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Categories */}
              <div className="rounded-lg border bg-card p-5">
                <h3 className="font-semibold mb-4">Browse Categories</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/knowledge-hub/category/${category.id}`}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <span className="text-sm">{category.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {category.articleCount}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-5">
                <h3 className="font-semibold mb-2">Share Your Knowledge</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Are you an agricultural expert? Write articles and help farmers
                  across India.
                </p>
                <Link href="/dashboard/articles/new">
                  <Button className="w-full">Write an Article</Button>
                </Link>
              </div>
            </aside>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-primary" />
              <span className="font-semibold">GreenTrace</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Empowering farmers with knowledge and technology
            </p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <Link href="/about" className="hover:text-foreground">
                About
              </Link>
              <Link href="/contact" className="hover:text-foreground">
                Contact
              </Link>
              <Link href="/privacy" className="hover:text-foreground">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Wrap the entire component in a Suspense boundary
export function KnowledgeHubPageWrapper() {
  return (
    <Suspense fallback={<Loading />}>
      <KnowledgeHubPage />
    </Suspense>
  )
}
