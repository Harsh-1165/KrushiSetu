"use client";

import React from "react"

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { RichTextEditor } from "@/components/knowledge-hub/rich-text-editor";
import { TagInput } from "@/components/knowledge-hub/tag-input";
import {
  ArrowLeft,
  Save,
  Eye,
  Send,
  ImageIcon,
  X,
  FileText,
  Clock,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { createArticle, type ArticleCreateData } from "@/lib/knowledge-hub-api";

const CATEGORIES = [
  { value: "Crop Management", label: "Crop Management" },
  { value: "Pest Control", label: "Pest Control" },
  { value: "Organic Farming", label: "Organic Farming" },
  { value: "Soil Health", label: "Soil Health" },
  { value: "Irrigation", label: "Irrigation" },
  { value: "Market Insights", label: "Market Insights" },
  { value: "Weather Advisory", label: "Weather Advisory" },
  { value: "Technology", label: "Technology" },
  { value: "Success Stories", label: "Success Stories" },
  { value: "Government Schemes", label: "Government Schemes" },
];

export default function WriteArticlePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState<ArticleCreateData & { isFeatured?: boolean }>({
    title: "",
    excerpt: "",
    content: "",
    category: "",
    tags: [],
    coverImage: "",
    isFeatured: false,
    status: "draft",
  });

  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [readTime, setReadTime] = useState(0);

  const handleContentChange = useCallback((content: string) => {
    setFormData((prev) => ({ ...prev, content }));
    const words = content.replace(/<[^>]*>/g, "").split(/\s+/).filter(Boolean).length;
    setWordCount(words);
    setReadTime(Math.ceil(words / 200));
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setCoverImagePreview(result);
      setFormData((prev) => ({ ...prev, coverImage: result }));
    };
    reader.readAsDataURL(file);
  };

  const removeCoverImage = () => {
    setCoverImagePreview(null);
    setFormData((prev) => ({ ...prev, coverImage: "" }));
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      toast.error("Please enter a title");
      return false;
    }
    if (!formData.excerpt.trim()) {
      toast.error("Please enter an excerpt");
      return false;
    }
    if (!formData.content.trim()) {
      toast.error("Please add some content");
      return false;
    }
    if (!formData.category) {
      toast.error("Please select a category");
      return false;
    }
    return true;
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      await createArticle({ ...formData, status: "draft" });
      toast.success("Draft saved successfully");
    } catch (_error) {
      toast.error("Failed to save draft");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handlePublish = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await createArticle({ ...formData, status: "published" });
      toast.success("Article published successfully!");
      router.push("/knowledge-hub");
    } catch (_error) {
      toast.error("Failed to publish article");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/knowledge-hub">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Link>
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>{wordCount} words</span>
                <span className="mx-1">|</span>
                <Clock className="h-4 w-4" />
                <span>{readTime} min read</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="mr-2 h-4 w-4" />
                {showPreview ? "Edit" : "Preview"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                disabled={isSavingDraft}
              >
                <Save className="mr-2 h-4 w-4" />
                {isSavingDraft ? "Saving..." : "Save Draft"}
              </Button>
              <Button
                size="sm"
                onClick={handlePublish}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Send className="mr-2 h-4 w-4" />
                {isSubmitting ? "Publishing..." : "Publish"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-200px)]">
          <div className="lg:col-span-2 space-y-6 flex flex-col">
            {showPreview ? (
              <Card className="shadow-lg flex-1 overflow-auto">
                <CardContent className="pt-8 pb-8">
                  <article className="prose prose-green max-w-none dark:prose-invert">
                    {coverImagePreview && (
                      <img
                        src={coverImagePreview || "/placeholder.svg"}
                        alt="Cover"
                        className="w-full h-80 object-cover rounded-lg mb-8"
                      />
                    )}
                    <h1 className="text-4xl font-bold">{formData.title || "Untitled Article"}</h1>
                    <p className="lead text-muted-foreground text-lg mt-4">{formData.excerpt}</p>
                    <hr className="my-6" />
                    <div
                      className="prose-base"
                      dangerouslySetInnerHTML={{
                        __html: formData.content || "<p className='text-muted-foreground'>No content yet...</p>",
                      }}
                    />
                  </article>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Title and Excerpt - Fixed at top */}
                <div className="space-y-4 shrink-0">
                  {/* Title Input */}
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Article Title</label>
                    <Input
                      placeholder="Enter an engaging title for your article..."
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, title: e.target.value }))
                      }
                      className="text-3xl font-bold border bg-background px-4 py-3 focus-visible:ring-2 focus-visible:ring-primary placeholder:text-muted-foreground/50"
                    />
                  </div>

                  {/* Excerpt Input */}
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Article Excerpt</label>
                    <Textarea
                      placeholder="Write a brief 1-2 sentence excerpt that summarizes your article..."
                      value={formData.excerpt}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, excerpt: e.target.value }))
                      }
                      className="resize-none border bg-background px-4 py-3 focus-visible:ring-2 focus-visible:ring-primary text-base text-muted-foreground placeholder:text-muted-foreground/50"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Rich Text Editor - Takes remaining space */}
                <Card className="shadow-md h-full flex flex-col flex-1">
                  <CardHeader className="pb-3 shrink-0">
                    <CardTitle className="text-sm text-muted-foreground">Article Content</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 flex-1 flex flex-col min-h-0">
                    <RichTextEditor
                      value={formData.content}
                      onChange={handleContentChange}
                      placeholder="Start writing your article... Use the toolbar above for formatting (H1, H2, H3, Bold, Italic, Underline, Lists, Links, Images, etc.)"
                      minHeight="500px"
                    />
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <div className="space-y-6 overflow-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cover Image</CardTitle>
              </CardHeader>
              <CardContent>
                {coverImagePreview ? (
                  <div className="relative">
                    <img
                      src={coverImagePreview || "/placeholder.svg"}
                      alt="Cover preview"
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={removeCoverImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">
                      Click to upload cover image
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      PNG, JPG up to 5MB
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </label>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Article Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <TagInput
                    value={formData.tags}
                    onChange={(tags) =>
                      setFormData((prev) => ({ ...prev, tags }))
                    }
                    placeholder="Add tags..."
                    maxTags={5}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Featured Article</Label>
                    <p className="text-xs text-muted-foreground">
                      Show on homepage
                    </p>
                  </div>
                  <Switch
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, isFeatured: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
              <CardContent className="pt-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      Writing Tips
                    </p>
                    <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1 list-disc list-inside">
                      <li>Use clear, simple language</li>
                      <li>Add images to illustrate points</li>
                      <li>Break content into sections</li>
                      <li>Include practical tips</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
