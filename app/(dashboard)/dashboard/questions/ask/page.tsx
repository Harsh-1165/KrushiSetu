"use client"

import React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  HelpCircle,
  Upload,
  X,
  ImageIcon,
  Video,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Info,
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

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

import { questionApi, ADVISORY_CATEGORIES, CROP_TYPES, INDIAN_STATES, type CategoryKey } from "@/lib/advisory-api"
import { useUser } from "@/contexts/auth-context"

// Category icons mapping
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

interface AttachmentPreview {
  file: File
  preview: string
  type: "image" | "video"
}

export default function AskQuestionPage() {
  const router = useRouter()
  const { user } = useUser()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<CategoryKey | "">("")
  const [subcategory, setSubcategory] = useState("")
  const [cropType, setCropType] = useState("")
  const [urgency, setUrgency] = useState<"low" | "medium" | "high" | "critical">("medium")
  const [state, setState] = useState("")
  const [district, setDistrict] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [attachments, setAttachments] = useState<AttachmentPreview[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Pre-fill location from user profile
  useState(() => {
    if (user?.farmerProfile?.farmLocation) {
      // Parse farm location if available
    }
  })

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!title.trim()) {
      newErrors.title = "Question title is required"
    } else if (title.length < 10) {
      newErrors.title = "Title must be at least 10 characters"
    } else if (title.length > 200) {
      newErrors.title = "Title cannot exceed 200 characters"
    }

    if (!description.trim()) {
      newErrors.description = "Description is required"
    } else if (description.length < 20) {
      newErrors.description = "Description must be at least 20 characters"
    } else if (description.length > 5000) {
      newErrors.description = "Description cannot exceed 5000 characters"
    }

    if (!category) {
      newErrors.category = "Please select a category"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag])
      setTagInput("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newAttachments: AttachmentPreview[] = []

    Array.from(files).forEach((file) => {
      if (attachments.length + newAttachments.length >= 5) {
        toast.error("Maximum 5 attachments allowed")
        return
      }

      const isImage = file.type.startsWith("image/")
      const isVideo = file.type.startsWith("video/")

      if (!isImage && !isVideo) {
        toast.error("Only images and videos are allowed")
        return
      }

      if (file.size > 50 * 1024 * 1024) {
        toast.error("File size must be less than 50MB")
        return
      }

      const preview = URL.createObjectURL(file)
      newAttachments.push({
        file,
        preview,
        type: isImage ? "image" : "video",
      })
    })

    setAttachments([...attachments, ...newAttachments])
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleRemoveAttachment = (index: number) => {
    const attachment = attachments[index]
    URL.revokeObjectURL(attachment.preview)
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("title", title)
      formData.append("description", description)
      formData.append("category", category)
      if (subcategory) formData.append("subcategory", subcategory)
      if (cropType) formData.append("cropType", cropType)
      formData.append("urgency", urgency)
      if (tags.length > 0) formData.append("tags", JSON.stringify(tags))
      if (state || district) {
        formData.append(
          "location",
          JSON.stringify({
            state,
            district,
          })
        )
      }

      attachments.forEach((att) => {
        formData.append("attachments", att.file)
      })

      const response = await questionApi.create(formData)

      setSuccess(true)
      toast.success("Question posted successfully!")

      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/dashboard/questions/${response.question._id}`)
      }, 2000)
    } catch (error) {
      console.log("[v0] Error submitting question:", error)
      toast.error(error instanceof Error ? error.message : "Failed to post question")
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-16 w-16 mx-auto text-green-600 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Question Posted Successfully!</h2>
            <p className="text-muted-foreground mb-4">
              Your question has been submitted. Our experts will review and respond soon.
            </p>
            <p className="text-sm text-muted-foreground">Redirecting to your question...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/dashboard/questions">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Questions
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Ask a Question</h1>
        <p className="text-muted-foreground">
          Get expert advice from our agricultural specialists
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Question Title */}
          <Card>
            <CardHeader>
              <CardTitle>Question Details</CardTitle>
              <CardDescription>
                Provide a clear and specific question to get the best answers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Question Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., How to treat yellowing leaves on tomato plants?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={errors.title ? "border-destructive" : ""}
                />
                <div className="flex justify-between text-xs">
                  {errors.title ? (
                    <span className="text-destructive">{errors.title}</span>
                  ) : (
                    <span className="text-muted-foreground">
                      Write a clear, specific title for your question
                    </span>
                  )}
                  <span className={title.length > 200 ? "text-destructive" : "text-muted-foreground"}>
                    {title.length}/200
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe your problem in detail. Include information about your crops, soil conditions, weather, symptoms observed, and any treatments you've already tried..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={8}
                  className={errors.description ? "border-destructive" : ""}
                />
                <div className="flex justify-between text-xs">
                  {errors.description ? (
                    <span className="text-destructive">{errors.description}</span>
                  ) : (
                    <span className="text-muted-foreground">
                      The more details you provide, the better advice you&apos;ll receive
                    </span>
                  )}
                  <span className={description.length > 5000 ? "text-destructive" : "text-muted-foreground"}>
                    {description.length}/5000
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Category</CardTitle>
              <CardDescription>Select the category that best fits your question</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {Object.entries(ADVISORY_CATEGORIES).map(([key, value]) => {
                  const Icon = categoryIcons[key] || HelpCircle
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setCategory(key as CategoryKey)
                        setSubcategory("")
                      }}
                      className={`p-3 rounded-lg border text-center transition-all ${category === key
                          ? "border-primary bg-primary/5 ring-2 ring-primary"
                          : "border-border hover:border-primary/50"
                        }`}
                    >
                      <Icon className={`h-6 w-6 mx-auto mb-2 ${category === key ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-xs font-medium line-clamp-2">{value.name}</span>
                    </button>
                  )
                })}
              </div>
              {errors.category && (
                <p className="text-sm text-destructive">{errors.category}</p>
              )}

              {category && ADVISORY_CATEGORIES[category]?.subcategories && (
                <div className="space-y-2">
                  <Label>Subcategory (Optional)</Label>
                  <Select value={subcategory} onValueChange={setSubcategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {ADVISORY_CATEGORIES[category].subcategories.map((sub) => (
                        <SelectItem key={sub} value={sub}>
                          {sub.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
              <CardDescription>Help experts understand your situation better</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cropType">Crop Type</Label>
                  <Select value={cropType} onValueChange={setCropType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select crop type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CROP_TYPES.map((crop) => (
                        <SelectItem key={crop} value={crop}>
                          {crop}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Urgency Level</Label>
                  <RadioGroup
                    value={urgency}
                    onValueChange={(value) => setUrgency(value as typeof urgency)}
                    className="flex flex-wrap gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="low" id="low" />
                      <Label htmlFor="low" className="cursor-pointer text-green-600">Low</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="medium" id="medium" />
                      <Label htmlFor="medium" className="cursor-pointer text-yellow-600">Medium</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="high" id="high" />
                      <Label htmlFor="high" className="cursor-pointer text-orange-600">High</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="critical" id="critical" />
                      <Label htmlFor="critical" className="cursor-pointer text-red-600">Critical</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <Separator />

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Select value={state} onValueChange={setState}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="district">District</Label>
                  <Input
                    id="district"
                    placeholder="Enter your district"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tags (e.g., organic, monsoon)"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={handleAddTag} disabled={tags.length >= 5}>
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Add up to 5 tags to help categorize your question
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
              <CardDescription>
                Add images or videos to help illustrate your problem (optional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Images (JPEG, PNG, WebP) or Videos (MP4, MOV) up to 50MB each
                  </p>
                </label>
              </div>

              {attachments.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {attachments.map((att, index) => (
                    <div key={index} className="relative group">
                      {att.type === "image" ? (
                        <img
                          src={att.preview || "/placeholder.svg"}
                          alt={`Attachment ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-24 bg-muted rounded-lg flex items-center justify-center">
                          <Video className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(index)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <Badge
                        variant="secondary"
                        className="absolute bottom-1 left-1 text-xs"
                      >
                        {att.type === "image" ? <ImageIcon className="h-3 w-3" /> : <Video className="h-3 w-3" />}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                {attachments.length}/5 attachments added
              </p>
            </CardContent>
          </Card>

          {/* Tips */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Tips for getting good answers</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Be specific about your problem and include relevant details</li>
                <li>Mention any treatments or solutions you have already tried</li>
                <li>Include information about soil type, weather, and growing conditions</li>
                <li>Add photos showing the symptoms or issues clearly</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard/questions">Cancel</Link>
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Post Question
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
