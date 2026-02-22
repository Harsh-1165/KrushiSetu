/**
 * Hook to load expert dashboard data from API and merge with mock data.
 * Refetch on focus so cards stay in sync after publishing articles or answering questions.
 */

import useSWR from "swr"
import { useMemo } from "react"
import { apiUrl, fetchWithAuth } from "@/lib/api"
import { mockData } from "@/lib/mockData"

type ExpertStats = typeof mockData.expertStats

function mapArticleToStats(a: {
  _id: string
  title?: string
  views?: number
  likes?: number
  commentsCount?: number
  updatedAt?: string
  createdAt?: string
}) {
  const date = a.updatedAt ?? a.createdAt ?? new Date().toISOString()
  return {
    _id: a._id,
    title: a.title ?? "Untitled",
    views: a.views ?? 0,
    likes: a.likes ?? 0,
    comments: a.commentsCount ?? 0,
    date,
  }
}

export function useExpertDashboardStats() {
  const fetcher = (url: string) => fetchWithAuth(url).then((r) => r.json())

  const { data: articlesData } = useSWR(apiUrl("/articles/my?limit=10"), fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 60000,
  })

  const stats: ExpertStats = useMemo(() => {
    const mock = mockData.expertStats
    const articlesOk = articlesData?.success && Array.isArray(articlesData?.data?.articles)
    const apiArticles = articlesOk ? articlesData.data.articles : []

    const articles =
      apiArticles.length > 0
        ? apiArticles.map((a: Record<string, unknown>) => mapArticleToStats(a as Parameters<typeof mapArticleToStats>[0]))
        : mock.articles

    return {
      ...mock,
      articles,
      articlesPublished: articles.length,
    }
  }, [articlesData])

  return { stats }
}
