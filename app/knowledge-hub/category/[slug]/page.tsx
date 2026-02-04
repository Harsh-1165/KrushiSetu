"use client";

import React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArticleCard } from "@/components/knowledge-hub/article-card";
import {
  ArrowLeft,
  BookOpen,
  TrendingUp,
  Clock,
  Filter,
  Leaf,
  Bug,
  Droplets,
  Sun,
  BarChart3,
  Cloud,
  Cpu,
  Landmark,
} from "lucide-react";
import {
  knowledgeHubApi,
  type Article,
  type ArticleCategory,
} from "@/lib/knowledge-hub-api";

const CATEGORY_INFO: Record<
  string,
  { icon: React.ElementType; color: string; description: string }
> = {
  "crop-management": {
    icon: Leaf,
    color: "bg-green-500",
    description:
      "Learn about best practices for managing your crops, from planting to harvest.",
  },
  "pest-control": {
    icon: Bug,
    color: "bg-red-500",
    description:
      "Discover effective methods to protect your crops from pests and diseases.",
  },
  "organic-farming": {
    icon: Leaf,
    color: "bg-emerald-500",
    description:
      "Explore organic farming techniques for sustainable agriculture.",
  },
  "soil-health": {
    icon: Leaf,
    color: "bg-amber-600",
    description:
      "Understand soil composition and how to maintain healthy, productive soil.",
  },
  irrigation: {
    icon: Droplets,
    color: "bg-blue-500",
    description:
      "Master efficient irrigation techniques to optimize water usage.",
  },
  "market-insights": {
    icon: BarChart3,
    color: "bg-purple-500",
    description:
      "Stay updated with market trends, prices, and selling strategies.",
  },
  "weather-climate": {
    icon: Cloud,
    color: "bg-sky-500",
    description:
      "Learn how to adapt your farming practices to weather and climate changes.",
  },
  technology: {
    icon: Cpu,
    color: "bg-indigo-500",
    description:
      "Discover modern agricultural technologies to improve farm productivity.",
  },
  livestock: {
    icon: Leaf,
    color: "bg-orange-500",
    description: "Best practices for raising and managing livestock.",
  },
  "government-schemes": {
    icon: Landmark,
    color: "bg-teal-500",
    description:
      "Information about government programs and subsidies for farmers.",
  },
};

const Loading = () => null;

export default function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const searchParams = useSearchParams();
  const [articles, setArticles] = React.useState<Article[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [sortBy, setSortBy] = React.useState("latest");
  const [totalCount, setTotalCount] = React.useState(0);

  const categoryInfo = CATEGORY_INFO[slug] || {
    icon: BookOpen,
    color: "bg-green-500",
    description: "Articles in this category.",
  };

  const CategoryIcon = categoryInfo.icon;

  const formatCategoryName = (slug: string) => {
    return slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  React.useEffect(() => {
    const fetchArticles = async () => {
      setIsLoading(true);
      try {
        const response = await knowledgeHubApi.getArticles({
          category: slug as ArticleCategory,
          sortBy: sortBy as "latest" | "popular" | "trending",
          limit: 20,
        });
        setArticles(response.articles);
        setTotalCount(response.pagination.total);
      } catch (error) {
        console.error("Failed to fetch articles:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticles();
  }, [slug, sortBy]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className={`${categoryInfo.color} text-white`}>
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 mb-6"
            asChild
          >
            <Link href="/knowledge-hub">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Knowledge Hub
            </Link>
          </Button>

          <div className="flex items-start gap-4">
            <div className="p-4 bg-white/20 rounded-xl">
              <CategoryIcon className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {formatCategoryName(slug)}
              </h1>
              <p className="text-white/80 max-w-2xl">
                {categoryInfo.description}
              </p>
              <div className="mt-4 flex items-center gap-4 text-sm">
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {totalCount} Articles
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            {isLoading ? "Loading..." : `${totalCount} Articles`}
          </h2>
          <div className="flex items-center gap-3">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Latest
                  </div>
                </SelectItem>
                <SelectItem value="popular">
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Most Popular
                  </div>
                </SelectItem>
                <SelectItem value="trending">
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Trending
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Articles Grid */}
        <Suspense fallback={<Loading />}>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardContent className="p-0">
                    <Skeleton className="h-48 w-full rounded-t-lg" />
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Articles Yet</h3>
                <p className="text-muted-foreground mb-6">
                  There are no articles in this category yet. Check back later!
                </p>
                <Button asChild>
                  <Link href="/knowledge-hub">Browse All Articles</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </Suspense>
      </div>
    </div>
  );
}
