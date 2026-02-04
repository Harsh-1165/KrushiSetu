"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ImageIcon, X, MapPin } from "lucide-react"
import { toast } from "sonner"
import { fetchWithAuth, apiUrl } from "@/lib/api"

const CATEGORIES = [
  { value: "grains", label: "Grains" },
  { value: "vegetables", label: "Vegetables" },
  { value: "fruits", label: "Fruits" },
  { value: "pulses", label: "Pulses" },
  { value: "spices", label: "Spices" },
  { value: "oilseeds", label: "Oilseeds" },
  { value: "dairy", label: "Dairy" },
  { value: "poultry", label: "Poultry" },
  { value: "livestock", label: "Livestock" },
  { value: "seeds", label: "Seeds" },
  { value: "organic", label: "Organic" },
  { value: "processed", label: "Processed" },
  { value: "other", label: "Other" },
]

const UNITS = [
  { value: "kg", label: "kg" },
  { value: "gram", label: "gram" },
  { value: "quintal", label: "quintal" },
  { value: "ton", label: "ton" },
  { value: "piece", label: "piece" },
  { value: "dozen", label: "dozen" },
  { value: "bundle", label: "bundle" },
  { value: "liter", label: "liter" },
  { value: "ml", label: "ml" },
]

const STATUS_OPTIONS = [
  { value: "available", label: "Available" },
  { value: "out-of-stock", label: "Out of stock" },
  { value: "upcoming", label: "Upcoming" },
]

export default function NewProductPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [farmLocation, setFarmLocation] = useState<string | null>(null)
  const [certifications, setCertifications] = useState<string[]>([])
  const [certInput, setCertInput] = useState("")
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    cropType: "",
    harvestDate: "",
    price: "",
    unit: "kg",
    quantity: "",
    minOrderQty: "1",
    priceType: "fixed",
    status: "available",
    isOrganic: false,
    needsExpertReview: false,
  })

  // Fetch farmer profile for farmLocation (read-only, auto from profile)
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetchWithAuth(apiUrl("/auth/me"), { credentials: "include" })
        if (res.ok) {
          const data = await res.json()
          const addr = data?.data?.user?.address
          if (addr) {
            const parts = [addr.village, addr.city, addr.district, addr.state, addr.pincode].filter(Boolean)
            setFarmLocation(parts.length ? parts.join(", ") : "Not set in profile")
          } else {
            setFarmLocation("Not set in profile")
          }
        }
      } catch {
        setFarmLocation("Not set in profile")
      }
    }
    fetchProfile()
  }, [])

  const addCertification = () => {
    const v = certInput.trim()
    if (v && !certifications.includes(v)) {
      setCertifications((prev) => [...prev, v])
      setCertInput("")
    }
  }

  const removeCertification = (c: string) => {
    setCertifications((prev) => prev.filter((x) => x !== c))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    const valid = files.filter((f) => f.type.startsWith("image/"))
    setImageFiles((prev) => {
      const next = [...prev, ...valid].slice(0, 10)
      setImagePreviews((p) => {
        const newPreviews = valid.map((f) => URL.createObjectURL(f))
        return [...p, ...newPreviews].slice(0, 10)
      })
      return next
    })
  }

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.name.trim()) {
      toast.error("Product name is required")
      return
    }
    if (!form.category) {
      toast.error("Category is required")
      return
    }
    if (!form.price || Number(form.price) <= 0) {
      toast.error("Valid price is required")
      return
    }
    if (!form.quantity || Number(form.quantity) <= 0) {
      toast.error("Valid quantity is required")
      return
    }
    if (imageFiles.length < 1) {
      toast.error("At least one image is required")
      return
    }

    setIsSubmitting(true)
    try {
      const fd = new FormData()
      fd.append("name", form.name.trim())
      fd.append("description", form.description.trim())
      fd.append("category", form.category)
      fd.append("price", JSON.stringify({ current: form.price, unit: form.unit, currency: "INR" }))
      fd.append("unit", form.unit)
      fd.append("quantity", String(form.quantity))
      fd.append(
        "inventory",
        JSON.stringify({
          available: Number(form.quantity),
          minOrder: Number(form.minOrderQty) || 1,
        }),
      )
      fd.append("cropType", form.cropType.trim())
      if (form.harvestDate) fd.append("harvestDate", form.harvestDate)
      fd.append("minOrderQty", form.minOrderQty || "1")
      fd.append("priceType", form.priceType)
      fd.append("status", form.status)
      fd.append("isOrganic", String(form.isOrganic))
      fd.append("needsExpertReview", String(form.needsExpertReview))
      fd.append("certifications", JSON.stringify(certifications))
      imageFiles.forEach((file) => fd.append("images", file))

      const res = await fetchWithAuth(apiUrl("/products"), {
        method: "POST",
        credentials: "include",
        body: fd,
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = data.message || data.error?.message || "Failed to create product"
        toast.error(msg)
        if (res.status === 503 && msg.includes("Cloudinary")) {
          console.warn("Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to backend .env — get them from https://console.cloudinary.com")
        }
        return
      }
      toast.success("Product created successfully")
      router.push("/dashboard/products")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create product"
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/products">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add Product</h1>
          <p className="text-muted-foreground">
            Create a new listing. Category, images (min 1), and basic details are required.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic details</CardTitle>
            <CardDescription>Name, category, and description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Product name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Organic Tomatoes"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                  required
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cropType">Crop type</Label>
              <Input
                id="cropType"
                value={form.cropType}
                onChange={(e) => setForm((f) => ({ ...f, cropType: e.target.value }))}
                placeholder="e.g. Tomato, Hybrid"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={4}
                placeholder="Quality, variety, storage tips."
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing & quantity</CardTitle>
            <CardDescription>Price, unit, and stock</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="80"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit *</Label>
                <Select
                  value={form.unit}
                  onValueChange={(v) => setForm((f) => ({ ...f, unit: v }))}
                >
                  <SelectTrigger id="unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u.value} value={u.value}>
                        {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Available quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={0}
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                  placeholder="100"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minOrderQty">Minimum order quantity</Label>
                <Input
                  id="minOrderQty"
                  type="number"
                  min={1}
                  value={form.minOrderQty}
                  onChange={(e) => setForm((f) => ({ ...f, minOrderQty: e.target.value }))}
                  placeholder="1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Price type</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="priceType"
                    value="fixed"
                    checked={form.priceType === "fixed"}
                    onChange={(e) => setForm((f) => ({ ...f, priceType: e.target.value }))}
                    className="rounded-full"
                  />
                  Fixed
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="priceType"
                    value="negotiable"
                    checked={form.priceType === "negotiable"}
                    onChange={(e) => setForm((f) => ({ ...f, priceType: e.target.value }))}
                    className="rounded-full"
                  />
                  Negotiable
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dates & certifications</CardTitle>
            <CardDescription>Harvest date, organic, and certifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="harvestDate">Harvest date</Label>
              <Input
                id="harvestDate"
                type="date"
                value={form.harvestDate}
                onChange={(e) => setForm((f) => ({ ...f, harvestDate: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isOrganic"
                checked={form.isOrganic}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, isOrganic: !!checked }))}
              />
              <Label htmlFor="isOrganic" className="cursor-pointer">
                Organic product
              </Label>
            </div>
            <div className="space-y-2">
              <Label>Certifications</Label>
              <div className="flex gap-2 flex-wrap">
                <Input
                  value={certInput}
                  onChange={(e) => setCertInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCertification())}
                  placeholder="Add certification (e.g. FSSAI)"
                  className="max-w-xs"
                />
                <Button type="button" variant="secondary" onClick={addCertification}>
                  Add
                </Button>
              </div>
              {certifications.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {certifications.map((c) => (
                    <Badge key={c} variant="secondary" className="gap-1 pr-1">
                      {c}
                      <button type="button" onClick={() => removeCertification(c)} className="rounded-full hover:bg-muted p-0.5">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location & status</CardTitle>
            <CardDescription>Farm location is from your profile. Set listing status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Farm location (from profile)
              </Label>
              <p className="text-sm text-muted-foreground rounded-md border bg-muted/50 px-3 py-2">
                {farmLocation ?? "Loading…"}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="needsExpertReview"
                checked={form.needsExpertReview}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, needsExpertReview: !!checked }))}
              />
              <Label htmlFor="needsExpertReview" className="cursor-pointer">
                Needs expert review
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Images *</CardTitle>
            <CardDescription>Upload at least one image. Max 10, JPEG/PNG/WebP.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              {imagePreviews.map((url, i) => (
                <div key={i} className="relative w-24 h-24 rounded-lg border overflow-hidden bg-muted">
                  <img src={url} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 rounded-full bg-destructive text-destructive-foreground p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <label className="w-24 h-24 rounded-lg border border-dashed flex items-center justify-center cursor-pointer hover:bg-muted/50">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={handleImageChange}
                />
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </label>
            </div>
            {imageFiles.length < 1 && (
              <p className="text-sm text-amber-600">At least one image is required.</p>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={isSubmitting || imageFiles.length < 1}>
            {isSubmitting ? "Saving…" : "Save product"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/dashboard/products")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
