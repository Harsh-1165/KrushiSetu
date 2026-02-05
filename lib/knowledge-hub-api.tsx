import { fetchWithAuth } from "@/lib/api"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"

// ============================================
// TYPES
// ============================================

export interface Author {
  _id: string
  name: { first: string; last: string }
  avatar?: { url: string }
  role: string
  bio?: string
  expertProfile?: {
    specializations: string[]
    qualifications: Array<{ degree: string; institution: string; year: number }>
    experience: number
    rating: number
    totalAnswers: number
    verified: boolean
  }
  articlesCount?: number
  followersCount?: number
}

export interface Article {
  _id: string
  title: string
  slug: string
  excerpt: string
  content: string
  coverImage?: {
    url: string
    alt?: string
    caption?: string
  }
  category: {
    name: string
    subcategory?: string
  }
  tags: string[]
  author: Author
  status: "draft" | "review" | "published" | "archived"
  publishedAt?: string
  readTime: number
  difficulty: "beginner" | "intermediate" | "advanced"
  views: number
  stats: {
    likes: number
    bookmarks: number
    shares: number
    comments: number
  }
  seo?: {
    metaTitle?: string
    metaDescription?: string
    keywords?: string[]
  }
  relatedArticles?: Article[]
  isFeatured: boolean
  isPinned: boolean
  language: string
  createdAt: string
  updatedAt?: string
}

export interface ArticleComment {
  _id: string
  article: string
  author: {
    _id: string
    name: { first: string; last: string }
    avatar?: { url: string }
    role: string
  }
  content: string
  parentComment?: string
  likeCount: number
  replyCount: number
  isEdited: boolean
  createdAt: string
  replies?: ArticleComment[]
  isLiked?: boolean
}

export interface ArticleCreateData {
  title: string
  excerpt: string
  content: string
  category: string
  subcategory?: string
  tags?: string[]
  coverImage?: string
  difficulty?: "beginner" | "intermediate" | "advanced"
  seo?: {
    metaTitle?: string
    metaDescription?: string
    keywords?: string[]
  }
  status?: "draft" | "review" | "published"
}

export interface ArticleCategory {
  id: string
  name: string
  description: string
  icon: string
  articleCount: number
  featuredArticles?: Article[]
}

export interface ArticleFilters {
  page?: number
  limit?: number
  category?: string
  search?: string
  sort?: string
  author?: string
  tags?: string[]
  difficulty?: string
  featured?: boolean
}

// ============================================
// ARTICLE CATEGORIES
// ============================================

export const ARTICLE_CATEGORIES = [
  { id: "crop-management", name: "Crop Management", icon: "sprout", description: "Learn about planting, growing, and harvesting various crops" },
  { id: "pest-control", name: "Pest Control", icon: "bug", description: "Organic and chemical pest management techniques" },
  { id: "soil-health", name: "Soil Health", icon: "layers", description: "Soil testing, fertilization, and health management" },
  { id: "irrigation", name: "Irrigation", icon: "droplet", description: "Water management and irrigation systems" },
  { id: "organic-farming", name: "Organic Farming", icon: "leaf", description: "Certification, techniques, and organic practices" },
  { id: "market-insights", name: "Market Insights", icon: "trending-up", description: "Pricing trends and market analysis" },
  { id: "government-schemes", name: "Government Schemes", icon: "building", description: "Subsidies, loans, and government programs" },
  { id: "technology", name: "Technology", icon: "cpu", description: "Modern farming technology and innovations" },
  { id: "weather-advisory", name: "Weather Advisory", icon: "cloud", description: "Weather patterns and seasonal planning" },
  { id: "success-stories", name: "Success Stories", icon: "award", description: "Inspiring farmer success stories" },
]

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Get all articles with filters and pagination
 */
export async function getArticles(filters: ArticleFilters = {}): Promise<{
  success: boolean
  data: {
    articles: Article[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
      hasNext: boolean
      hasPrev: boolean
    }
  }
}> {
  const params = new URLSearchParams()
  if (filters.page) params.set("page", filters.page.toString())
  if (filters.limit) params.set("limit", filters.limit.toString())
  if (filters.category) params.set("category", filters.category)
  if (filters.search) params.set("search", filters.search)
  if (filters.sort) params.set("sort", filters.sort)
  if (filters.author) params.set("author", filters.author)
  if (filters.difficulty) params.set("difficulty", filters.difficulty)
  if (filters.featured) params.set("featured", "true")
  if (filters.tags?.length) params.set("tags", filters.tags.join(","))

  const response = await fetchWithAuth(`${API_BASE_URL}/articles?${params.toString()}`)
  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message || "Failed to fetch articles")
  }

  return result
}

/**
 * Get a single article by slug
 */
export async function getArticleBySlug(slug: string): Promise<{
  success: boolean
  data: {
    article: Article
    relatedArticles: Article[]
  }
}> {
  const response = await fetchWithAuth(`${API_BASE_URL}/articles/${slug}`)
  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message || "Failed to fetch article")
  }

  return result
}

/**
 * Get featured articles
 */
export async function getFeaturedArticles(limit = 5): Promise<{
  success: boolean
  data: { articles: Article[] }
}> {
  const response = await fetchWithAuth(`${API_BASE_URL}/articles/featured?limit=${limit}`)
  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message || "Failed to fetch featured articles")
  }

  return result
}

/**
 * Get trending articles
 */
export async function getTrendingArticles(limit = 10): Promise<{
  success: boolean
  data: { articles: Article[] }
}> {
  const response = await fetchWithAuth(`${API_BASE_URL}/articles/trending?limit=${limit}`)
  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message || "Failed to fetch trending articles")
  }

  return result
}

/**
 * Get articles by category
 */
export async function getArticlesByCategory(
  category: string,
  page = 1,
  limit = 10
): Promise<{
  success: boolean
  data: {
    articles: Article[]
    category: ArticleCategory
    pagination: { page: number; limit: number; total: number; pages: number }
  }
}> {
  const response = await fetchWithAuth(`${API_BASE_URL}/articles/category/${category}?page=${page}&limit=${limit}`)
  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message || "Failed to fetch articles by category")
  }

  return result
}

/**
 * Get category statistics
 */
export async function getCategoryStats(): Promise<{
  success: boolean
  data: { categories: ArticleCategory[] }
}> {
  const response = await fetchWithAuth(`${API_BASE_URL}/articles/categories/stats`)
  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message || "Failed to fetch category stats")
  }

  return result
}

/**
 * Create a new article (Expert only)
 */
export async function createArticle(data: ArticleCreateData): Promise<{
  success: boolean
  message: string
  data: { article: Article }
}> {
  const response = await fetchWithAuth(`${API_BASE_URL}/articles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message || "Failed to create article")
  }

  return result
}

/**
 * Update an article
 */
export async function updateArticle(
  id: string,
  data: Partial<ArticleCreateData>
): Promise<{
  success: boolean
  message: string
  data: { article: Article }
}> {
  const response = await fetchWithAuth(`${API_BASE_URL}/articles/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message || "Failed to update article")
  }

  return result
}

/**
 * Delete an article
 */
export async function deleteArticle(id: string): Promise<{
  success: boolean
  message: string
}> {
  const response = await fetchWithAuth(`${API_BASE_URL}/articles/${id}`, {
    method: "DELETE",
  })
  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message || "Failed to delete article")
  }

  return result
}

/**
 * Like/unlike an article
 */
export async function toggleArticleLike(id: string): Promise<{
  success: boolean
  message: string
  data: { likes: number; isLiked: boolean }
}> {
  const response = await fetchWithAuth(`${API_BASE_URL}/articles/${id}/like`, {
    method: "POST",
  })
  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message || "Failed to toggle like")
  }

  return result
}

/**
 * Bookmark/unbookmark an article
 */
export async function toggleArticleBookmark(id: string): Promise<{
  success: boolean
  message: string
  data: { bookmarks: number; isBookmarked: boolean }
}> {
  const response = await fetchWithAuth(`${API_BASE_URL}/articles/${id}/bookmark`, {
    method: "POST",
  })
  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message || "Failed to toggle bookmark")
  }

  return result
}

/**
 * Get user's bookmarked articles
 */
export async function getBookmarkedArticles(): Promise<{
  success: boolean
  data: { articles: Article[] }
}> {
  const response = await fetchWithAuth(`${API_BASE_URL}/articles/bookmarks`)
  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message || "Failed to fetch bookmarked articles")
  }

  return result
}

/**
 * Get my articles (for experts)
 */
export async function getMyArticles(filters: { status?: string; page?: number; limit?: number } = {}): Promise<{
  success: boolean
  data: {
    articles: Article[]
    pagination: { page: number; limit: number; total: number; pages: number }
  }
}> {
  const params = new URLSearchParams()
  if (filters.status) params.set("status", filters.status)
  if (filters.page) params.set("page", filters.page.toString())
  if (filters.limit) params.set("limit", filters.limit.toString())

  const response = await fetchWithAuth(`${API_BASE_URL}/articles/my?${params.toString()}`)
  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message || "Failed to fetch my articles")
  }

  return result
}

/**
 * Get article comments
 */
export async function getArticleComments(
  articleId: string,
  page = 1,
  limit = 20
): Promise<{
  success: boolean
  data: {
    comments: ArticleComment[]
    pagination: { page: number; limit: number; total: number; pages: number }
  }
}> {
  const response = await fetchWithAuth(`${API_BASE_URL}/articles/${articleId}/comments?page=${page}&limit=${limit}`)
  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message || "Failed to fetch comments")
  }

  return result
}

/**
 * Add a comment to an article
 */
export async function addArticleComment(
  articleId: string,
  content: string,
  parentCommentId?: string
): Promise<{
  success: boolean
  message: string
  data: { comment: ArticleComment }
}> {
  const response = await fetchWithAuth(`${API_BASE_URL}/articles/${articleId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, parentCommentId }),
  })
  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message || "Failed to add comment")
  }

  return result
}

/**
 * Like a comment
 */
export async function toggleCommentLike(commentId: string): Promise<{
  success: boolean
  message: string
  data: { likeCount: number; isLiked: boolean }
}> {
  const response = await fetchWithAuth(`${API_BASE_URL}/articles/comments/${commentId}/like`, {
    method: "POST",
  })
  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message || "Failed to toggle comment like")
  }

  return result
}

/**
 * Get author profile
 */
export async function getAuthorProfile(authorId: string): Promise<{
  success: boolean
  data: {
    author: Author
    articles: Article[]
    stats: {
      totalArticles: number
      totalViews: number
      totalLikes: number
      followers: number
    }
  }
}> {
  const response = await fetchWithAuth(`${API_BASE_URL}/articles/author/${authorId}`)
  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message || "Failed to fetch author profile")
  }

  return result
}

/**
 * Follow/unfollow an author
 */
export async function toggleFollowAuthor(authorId: string): Promise<{
  success: boolean
  message: string
  data: { isFollowing: boolean; followersCount: number }
}> {
  const response = await fetchWithAuth(`${API_BASE_URL}/users/${authorId}/follow`, {
    method: "POST",
  })
  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message || "Failed to toggle follow")
  }

  return result
}

/**
 * Upload article cover image
 */
export async function uploadArticleImage(file: File): Promise<{
  success: boolean
  data: { url: string; publicId?: string }
}> {
  const formData = new FormData()
  formData.append("image", file)

  const response = await fetchWithAuth(`${API_BASE_URL}/uploads/article-image`, {
    method: "POST",
    body: formData,
  })
  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message || "Failed to upload image")
  }

  return result
}

// ============================================
// MOCK DATA FOR DEVELOPMENT
// ============================================

export const mockArticles: Article[] = [
  {
    _id: "1",
    title: "Complete Guide to Organic Tomato Farming",
    slug: "complete-guide-organic-tomato-farming",
    excerpt: "Learn everything about growing organic tomatoes, from seed selection to harvest. This comprehensive guide covers soil preparation, pest management, and maximizing yields.",
    content: `<h2>Introduction to Organic Tomato Farming</h2>
<p>Organic tomato farming has gained significant popularity among farmers due to increasing consumer demand for chemical-free produce. This guide will walk you through the complete process of growing organic tomatoes successfully.</p>

<h2>Soil Preparation</h2>
<p>The foundation of successful organic tomato farming lies in proper soil preparation. Tomatoes thrive in well-drained, loamy soil with a pH between 6.0 and 6.8.</p>

<h3>Steps for Soil Preparation:</h3>
<ul>
<li>Test your soil pH and nutrient levels</li>
<li>Add organic compost to improve soil structure</li>
<li>Incorporate well-rotted manure for nitrogen</li>
<li>Ensure proper drainage to prevent root rot</li>
</ul>

<h2>Seed Selection</h2>
<p>Choosing the right variety is crucial for organic farming success. Look for disease-resistant varieties that are well-suited to your local climate.</p>

<h2>Pest Management</h2>
<p>Organic pest control relies on prevention and natural methods rather than chemical pesticides.</p>

<h3>Natural Pest Control Methods:</h3>
<ul>
<li>Companion planting with basil and marigolds</li>
<li>Neem oil spray for common pests</li>
<li>Introducing beneficial insects</li>
<li>Crop rotation to break pest cycles</li>
</ul>

<h2>Harvesting Tips</h2>
<p>Harvest tomatoes when they reach full color but are still firm. Early morning harvesting helps preserve freshness.</p>`,
    coverImage: {
      url: "https://images.unsplash.com/photo-1592838064575-70ed626d3a0e?w=1200&h=600&fit=crop",
      alt: "Fresh organic tomatoes on the vine"
    },
    category: { name: "Organic Farming", subcategory: "Vegetables" },
    tags: ["tomatoes", "organic", "vegetables", "farming guide"],
    author: {
      _id: "expert1",
      name: { first: "Dr. Rajesh", last: "Kumar" },
      avatar: { url: "https://randomuser.me/api/portraits/men/32.jpg" },
      role: "expert",
      bio: "Agricultural scientist with 15+ years of experience in organic farming",
      expertProfile: {
        specializations: ["Organic Farming", "Soil Science"],
        qualifications: [{ degree: "Ph.D. Agriculture", institution: "IARI Delhi", year: 2008 }],
        experience: 15,
        rating: 4.9,
        totalAnswers: 234,
        verified: true
      }
    },
    status: "published",
    publishedAt: "2024-01-15T10:00:00Z",
    readTime: 8,
    difficulty: "beginner",
    views: 12450,
    stats: { likes: 856, bookmarks: 423, shares: 189, comments: 67 },
    isFeatured: true,
    isPinned: false,
    language: "en",
    createdAt: "2024-01-15T10:00:00Z"
  },
  {
    _id: "2",
    title: "Integrated Pest Management for Rice Crops",
    slug: "integrated-pest-management-rice-crops",
    excerpt: "Discover effective IPM strategies for rice cultivation. Learn to identify common pests, their life cycles, and sustainable control methods.",
    content: "<h2>Understanding IPM in Rice Cultivation</h2><p>Integrated Pest Management combines biological, cultural, and chemical methods to control pests effectively while minimizing environmental impact...</p>",
    coverImage: {
      url: "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=1200&h=600&fit=crop",
      alt: "Rice paddy field"
    },
    category: { name: "Pest Control" },
    tags: ["rice", "pest control", "IPM", "sustainable"],
    author: {
      _id: "expert2",
      name: { first: "Dr. Priya", last: "Sharma" },
      avatar: { url: "https://randomuser.me/api/portraits/women/44.jpg" },
      role: "expert",
      expertProfile: {
        specializations: ["Entomology", "Pest Control"],
        qualifications: [{ degree: "Ph.D. Entomology", institution: "PAU Ludhiana", year: 2012 }],
        experience: 12,
        rating: 4.8,
        totalAnswers: 189,
        verified: true
      }
    },
    status: "published",
    publishedAt: "2024-01-20T14:00:00Z",
    readTime: 12,
    difficulty: "intermediate",
    views: 8920,
    stats: { likes: 612, bookmarks: 298, shares: 145, comments: 43 },
    isFeatured: true,
    isPinned: false,
    language: "en",
    createdAt: "2024-01-20T14:00:00Z"
  },
  {
    _id: "3",
    title: "Water Conservation Techniques for Drought-Prone Areas",
    slug: "water-conservation-techniques-drought-prone",
    excerpt: "Essential water-saving strategies for farmers in water-scarce regions. From rainwater harvesting to drip irrigation optimization.",
    content: "<h2>Importance of Water Conservation</h2><p>With climate change intensifying droughts, water conservation has become critical for agricultural sustainability...</p>",
    coverImage: {
      url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1200&h=600&fit=crop",
      alt: "Drip irrigation system"
    },
    category: { name: "Irrigation" },
    tags: ["water conservation", "drought", "irrigation", "sustainability"],
    author: {
      _id: "expert3",
      name: { first: "Amit", last: "Patel" },
      avatar: { url: "https://randomuser.me/api/portraits/men/67.jpg" },
      role: "expert",
      expertProfile: {
        specializations: ["Irrigation Management", "Water Resources"],
        qualifications: [{ degree: "M.Tech Water Resources", institution: "IIT Roorkee", year: 2010 }],
        experience: 14,
        rating: 4.7,
        totalAnswers: 156,
        verified: true
      }
    },
    status: "published",
    publishedAt: "2024-02-01T09:00:00Z",
    readTime: 10,
    difficulty: "intermediate",
    views: 6780,
    stats: { likes: 489, bookmarks: 267, shares: 112, comments: 38 },
    isFeatured: false,
    isPinned: false,
    language: "en",
    createdAt: "2024-02-01T09:00:00Z"
  },
  {
    _id: "4",
    title: "Soil Health Management: A Comprehensive Guide",
    slug: "soil-health-management-comprehensive-guide",
    excerpt: "Master the fundamentals of soil health. Learn about soil testing, nutrient management, and building long-term soil fertility.",
    content: "<h2>Why Soil Health Matters</h2><p>Healthy soil is the foundation of productive agriculture. Understanding your soil is the first step to improving crop yields...</p>",
    coverImage: {
      url: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1200&h=600&fit=crop",
      alt: "Rich agricultural soil"
    },
    category: { name: "Soil Health" },
    tags: ["soil", "nutrients", "fertilizers", "organic matter"],
    author: {
      _id: "expert1",
      name: { first: "Dr. Rajesh", last: "Kumar" },
      avatar: { url: "https://randomuser.me/api/portraits/men/32.jpg" },
      role: "expert",
      expertProfile: {
        specializations: ["Organic Farming", "Soil Science"],
        qualifications: [{ degree: "Ph.D. Agriculture", institution: "IARI Delhi", year: 2008 }],
        experience: 15,
        rating: 4.9,
        totalAnswers: 234,
        verified: true
      }
    },
    status: "published",
    publishedAt: "2024-02-10T11:00:00Z",
    readTime: 15,
    difficulty: "advanced",
    views: 5430,
    stats: { likes: 378, bookmarks: 234, shares: 89, comments: 29 },
    isFeatured: false,
    isPinned: false,
    language: "en",
    createdAt: "2024-02-10T11:00:00Z"
  },
  {
    _id: "5",
    title: "Government Schemes for Small Farmers in 2024",
    slug: "government-schemes-small-farmers-2024",
    excerpt: "Complete guide to central and state government schemes available for small and marginal farmers. Learn about eligibility and application process.",
    content: "<h2>PM-KISAN Scheme</h2><p>The Pradhan Mantri Kisan Samman Nidhi provides income support of Rs. 6000 per year to eligible farmer families...</p>",
    coverImage: {
      url: "https://images.unsplash.com/photo-1589923188900-85dae523342b?w=1200&h=600&fit=crop",
      alt: "Indian farmer in field"
    },
    category: { name: "Government Schemes" },
    tags: ["government", "subsidies", "schemes", "small farmers"],
    author: {
      _id: "expert4",
      name: { first: "Sunita", last: "Verma" },
      avatar: { url: "https://randomuser.me/api/portraits/women/65.jpg" },
      role: "expert",
      expertProfile: {
        specializations: ["Agricultural Economics", "Policy"],
        qualifications: [{ degree: "M.A. Economics", institution: "JNU Delhi", year: 2015 }],
        experience: 9,
        rating: 4.6,
        totalAnswers: 98,
        verified: true
      }
    },
    status: "published",
    publishedAt: "2024-02-15T08:00:00Z",
    readTime: 7,
    difficulty: "beginner",
    views: 18760,
    stats: { likes: 1234, bookmarks: 876, shares: 456, comments: 123 },
    isFeatured: true,
    isPinned: true,
    language: "en",
    createdAt: "2024-02-15T08:00:00Z"
  },
  {
    _id: "6",
    title: "Modern Drone Technology in Agriculture",
    slug: "modern-drone-technology-agriculture",
    excerpt: "Explore how drones are revolutionizing farming. From crop monitoring to precision spraying, learn about agricultural drone applications.",
    content: "<h2>The Rise of Agricultural Drones</h2><p>Drone technology is transforming how farmers monitor and manage their crops...</p>",
    coverImage: {
      url: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=1200&h=600&fit=crop",
      alt: "Agricultural drone spraying crops"
    },
    category: { name: "Technology" },
    tags: ["drones", "technology", "precision agriculture", "innovation"],
    author: {
      _id: "expert5",
      name: { first: "Vikram", last: "Singh" },
      avatar: { url: "https://randomuser.me/api/portraits/men/45.jpg" },
      role: "expert",
      expertProfile: {
        specializations: ["Agricultural Engineering", "Technology"],
        qualifications: [{ degree: "B.Tech Agricultural Engineering", institution: "IIT Kharagpur", year: 2016 }],
        experience: 8,
        rating: 4.5,
        totalAnswers: 76,
        verified: true
      }
    },
    status: "published",
    publishedAt: "2024-02-20T13:00:00Z",
    readTime: 9,
    difficulty: "intermediate",
    views: 9870,
    stats: { likes: 567, bookmarks: 345, shares: 234, comments: 56 },
    isFeatured: false,
    isPinned: false,
    language: "en",
    createdAt: "2024-02-20T13:00:00Z"
  }
]

export const mockCategoryStats: ArticleCategory[] = ARTICLE_CATEGORIES.map((cat, index) => ({
  ...cat,
  articleCount: Math.floor(Math.random() * 50) + 10,
  featuredArticles: mockArticles.filter(a => a.category.name === cat.name).slice(0, 2)
}))
