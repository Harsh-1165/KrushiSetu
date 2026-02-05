"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArticleCard } from "@/components/knowledge-hub/article-card";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Award,
  BookOpen,
  Users,
  Star,
  MessageSquare,
  ExternalLink,
  Mail,
  Phone,
} from "lucide-react";
import { getAuthorProfile, type Author, type Article } from "@/lib/knowledge-hub-api";

export default function AuthorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [author, setAuthor] = useState<Author | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("articles");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data } = await getAuthorProfile(id);
        setAuthor(data.author);
        setArticles(data.articles);
      } catch (error) {
        console.error("Failed to fetch author data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (isLoading) {
    return <AuthorProfileSkeleton />;
  }

  if (!author) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Author Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The author you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button asChild>
          <Link href="/knowledge-hub">Browse Articles</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-600 to-green-800 text-white">
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

          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <Avatar className="h-32 w-32 border-4 border-white/20">
              <AvatarImage src={author.avatar?.url || "/placeholder.svg"} alt={`${author.name.first} ${author.name.last}`} />
              <AvatarFallback className="text-4xl bg-green-700">
                {`${author.name.first[0]}${author.name.last[0]}`}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{`${author.name.first} ${author.name.last}`}</h1>
                {author.expertProfile?.verified && (
                  <Badge className="bg-blue-500 text-white">
                    <Award className="h-3 w-3 mr-1" />
                    Verified Expert
                  </Badge>
                )}
              </div>

              <p className="text-lg text-green-100 mb-4">{author.role}</p>

              <div className="flex flex-wrap gap-4 text-sm text-green-100">
                {/* Location might not be in author object yet, removed for now or check if exists */}
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Request to fetch joinedDate or removing if not available in Author type
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Contact
              </Button>
              <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/10 bg-transparent">
                <Users className="h-4 w-4 mr-2" />
                Follow
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x">
            <div className="py-6 px-4 text-center">
              <div className="text-2xl font-bold text-green-600">{author.articlesCount || 0}</div>
              <div className="text-sm text-muted-foreground">Articles</div>
            </div>
            <div className="py-6 px-4 text-center">
              <div className="text-2xl font-bold text-green-600">{(author as any).totalViews?.toLocaleString() || "0"}</div>
              <div className="text-sm text-muted-foreground">Total Views</div>
            </div>
            <div className="py-6 px-4 text-center">
              <div className="text-2xl font-bold text-green-600">{author.followersCount?.toLocaleString() || "0"}</div>
              <div className="text-sm text-muted-foreground">Followers</div>
            </div>
            <div className="py-6 px-4 text-center">
              <div className="flex items-center justify-center gap-1">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                <span className="text-2xl font-bold">{author.expertProfile?.rating?.toFixed(1) || "N/A"}</span>
              </div>
              <div className="text-sm text-muted-foreground">Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="articles">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Articles ({articles.length})
                </TabsTrigger>
                <TabsTrigger value="about">About</TabsTrigger>
              </TabsList>

              <TabsContent value="articles">
                {articles.length > 0 ? (
                  <div className="grid gap-6">
                    {articles.map((article) => (
                      <ArticleCard key={article._id} article={article} variant="horizontal" />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold mb-2">No articles yet</h3>
                      <p className="text-muted-foreground">
                        This author hasn&apos;t published any articles yet.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="about">
                <Card>
                  <CardContent className="pt-6">
                    <div className="prose prose-green max-w-none dark:prose-invert">
                      <h3>About {`${author.name.first} ${author.name.last}`}</h3>
                      <p>{author.bio}</p>

                      {author.expertise && author.expertise.length > 0 && (
                        <>
                          <h4>Areas of Expertise</h4>
                          <div className="flex flex-wrap gap-2 not-prose">
                            {author.expertise.map((exp) => (
                              <Badge key={exp} variant="secondary">
                                {exp}
                              </Badge>
                            ))}
                          </div>
                        </>
                      )}

                      {author.expertProfile?.qualifications && author.expertProfile.qualifications.length > 0 && (
                        <>
                          <h4>Qualifications</h4>
                          <ul>
                            {author.expertProfile.qualifications.map((qual, index) => (
                              <li key={index}>{`${qual.degree} - ${qual.institution} (${qual.year})`}</li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Expertise</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(author.expertProfile?.specializations || ["Agriculture", "Crop Management", "Organic Farming"]).map((exp) => (
                    <Badge key={exp} variant="outline">
                      {exp}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                  <a href={`mailto:${author.email || "contact@greentrace.com"}`}>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Ask a Question
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthorProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-green-600 to-green-800">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 bg-white/20 mb-6" />
          <div className="flex gap-6 items-center">
            <Skeleton className="h-32 w-32 rounded-full bg-white/20" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-64 bg-white/20" />
              <Skeleton className="h-5 w-48 bg-white/20" />
              <Skeleton className="h-4 w-72 bg-white/20" />
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-6 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
