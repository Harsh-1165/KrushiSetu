"use client"

import React, { useState, useEffect, use } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Star,
  Heart,
  ShoppingCart,
  MapPin,
  Leaf,
  Truck,
  Shield,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Share2,
  MessageCircle,
  ThumbsUp,
  Check,
  Package,
  Calendar,
  Award,
  Store,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { useCart, useWishlist } from "@/lib/cart-context"
import {
  type MarketplaceProduct,
} from "@/lib/marketplace-data"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"

/** Normalize a raw MongoDB product into the MarketplaceProduct shape */
function normalizeProduct(p: any): MarketplaceProduct {
  const seller = p.seller || p.farmer || {}
  const sellerName = seller.name || {}
  return {
    _id: p._id,
    slug: p.slug || p._id,
    name: p.name,
    shortDescription: p.shortDescription || p.description?.slice(0, 120) || "",
    description: p.description || "",
    category: p.category || "",
    tags: p.tags || [],
    views: p.views ?? 0,
    status: p.status ?? "active",
    createdAt: p.createdAt ?? new Date().toISOString(),
    images: Array.isArray(p.images)
      ? p.images.map((img: any) =>
        typeof img === "string" ? { url: img, alt: p.name, isPrimary: false } : img
      )
      : [{ url: "/placeholder.svg", alt: p.name, isPrimary: true }],
    price: {
      current: p.price?.current ?? 0,
      mrp: p.price?.mrp ?? undefined,
      unit: p.price?.unit ?? "kg",
      currency: p.price?.currency ?? "INR",
      negotiable: p.price?.negotiable ?? false,
    },
    inventory: {
      available: p.inventory?.available ?? 0,
      sold: p.inventory?.sold ?? 0,
      minOrder: p.inventory?.minOrder ?? 1,
      maxOrder: p.inventory?.maxOrder ?? 100,
    },
    attributes: {
      variety: p.attributes?.variety ?? undefined,
      grade: p.attributes?.grade ?? undefined,
      isOrganic: p.attributes?.isOrganic ?? false,
      harvestDate: p.attributes?.harvestDate ?? undefined,
      expiryDate: p.attributes?.expiryDate ?? undefined,
      storageInstructions: p.attributes?.storageInstructions ?? undefined,
    },
    location: {
      state: p.location?.state ?? "",
      district: p.location?.district ?? "",
    },
    shipping: {
      available: p.shipping?.available ?? true,
      freeShippingAbove: p.shipping?.freeShippingAbove ?? undefined,
      estimatedDays: p.shipping?.estimatedDays ?? { min: 3, max: 7 },
    },
    ratings: {
      average: p.ratings?.average ?? 0,
      count: p.ratings?.count ?? 0,
      distribution: p.ratings?.distribution ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    },
    reviews: p.reviews || [],
    seller: {
      _id: seller._id ?? "",
      name: {
        first: sellerName.first ?? seller.profile?.firstName ?? "Farmer",
        last: sellerName.last ?? seller.profile?.lastName ?? "",
      },
      farmName: seller.farmerProfile?.farmName ?? seller.profile?.farmName ?? "Local Farm",
      avatar: seller.avatar?.url ?? seller.profile?.avatar ?? "/placeholder.svg",
      rating: seller.ratings?.average ?? 0,
      totalProducts: seller.stats?.totalProducts ?? 0,
      totalSales: seller.stats?.totalSales ?? 0,
      memberSince: seller.createdAt ?? new Date().toISOString(),
      location: p.location?.district
        ? `${p.location.district}, ${p.location.state}`
        : p.location?.state ?? "",
      isVerified: seller.isVerified ?? false,
    },
  }
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { addItem, isInCart, getItemQuantity, updateQuantity } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()

  const [product, setProduct] = useState<MarketplaceProduct | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<MarketplaceProduct[]>([])
  const [sellerProducts, setSellerProducts] = useState<MarketplaceProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`${API_BASE}/products/${resolvedParams.id}`)
        if (!res.ok) throw new Error("Product not found")
        const json = await res.json()
        const rawProduct = json.data?.product
        const rawRelated = json.data?.relatedProducts ?? []
        const rawSeller = json.data?.sellerProducts ?? []
        if (rawProduct) {
          setProduct(normalizeProduct(rawProduct))
          setRelatedProducts(rawRelated.map(normalizeProduct))
          setSellerProducts(rawSeller.map(normalizeProduct))
        }
      } catch (err) {
        console.error("[ProductDetail] fetch error:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProduct()
  }, [resolvedParams.id])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <Skeleton className="aspect-square rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Product Not Found</h1>
          <p className="text-muted-foreground mt-2">The product you're looking for doesn't exist.</p>
          <Button className="mt-4" onClick={() => router.push("/marketplace")}>
            Browse Products
          </Button>
        </div>
      </div>
    )
  }

  const inWishlist = isInWishlist(product._id)
  const inCart = isInCart(product._id)
  const cartQuantity = getItemQuantity(product._id)
  const discount = product.price.mrp
    ? Math.round(((product.price.mrp - product.price.current) / product.price.mrp) * 100)
    : 0

  const handleAddToCart = () => {
    addItem({
      _id: product._id,
      name: product.name,
      price: product.price.current,
      unit: product.price.unit,
      quantity: quantity,
      maxQuantity: product.inventory.available,
      image: product.images[0]?.url || "/placeholder.svg",
      farmer: {
        _id: product.seller._id,
        name: `${product.seller.name.first} ${product.seller.name.last}`,
        farmName: product.seller.farmName,
      },
      isOrganic: product.attributes.isOrganic,
    })
    toast.success(`${product.name} added to cart`)
  }

  const handleUpdateCartQuantity = (newQuantity: number) => {
    if (newQuantity <= 0) {
      updateQuantity(product._id, 0)
      toast.success("Item removed from cart")
    } else if (newQuantity <= product.inventory.available) {
      updateQuantity(product._id, newQuantity)
    }
  }

  const handleWishlistToggle = () => {
    if (inWishlist) {
      removeFromWishlist(product._id)
      toast.success("Removed from wishlist")
    } else {
      addToWishlist({
        _id: product._id,
        name: product.name,
        price: product.price.current,
        unit: product.price.unit,
        image: product.images[0]?.url || "/placeholder.svg",
        farmer: {
          name: `${product.seller.name.first} ${product.seller.name.last}`,
          farmName: product.seller.farmName,
        },
      })
      toast.success("Added to wishlist")
    }
  }

  const handleShare = async () => {
    try {
      await navigator.share({
        title: product.name,
        text: product.shortDescription,
        url: window.location.href,
      })
    } catch {
      navigator.clipboard.writeText(window.location.href)
      toast.success("Link copied to clipboard")
    }
  }

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % product.images.length)
  }

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length)
  }

  // Rating distribution percentages
  const totalRatings = product.ratings.count
  const ratingPercentages = {
    5: totalRatings > 0 ? (product.ratings.distribution[5] / totalRatings) * 100 : 0,
    4: totalRatings > 0 ? (product.ratings.distribution[4] / totalRatings) * 100 : 0,
    3: totalRatings > 0 ? (product.ratings.distribution[3] / totalRatings) * 100 : 0,
    2: totalRatings > 0 ? (product.ratings.distribution[2] / totalRatings) * 100 : 0,
    1: totalRatings > 0 ? (product.ratings.distribution[1] / totalRatings) * 100 : 0,
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/marketplace" className="hover:text-primary">
          Marketplace
        </Link>
        <span>/</span>
        <Link href={`/marketplace?category=${product.category}`} className="hover:text-primary capitalize">
          {product.category}
        </Link>
        <span>/</span>
        <span className="text-foreground line-clamp-1">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
            <Image
              src={product.images[selectedImageIndex]?.url || "/placeholder.svg"}
              alt={product.images[selectedImageIndex]?.alt || product.name}
              fill
              className="object-cover"
              priority
            />
            {product.images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}
            {/* Badges */}
            <div className="absolute left-3 top-3 flex flex-col gap-2">
              {discount > 0 && <Badge className="bg-red-500">-{discount}% OFF</Badge>}
              {product.attributes.isOrganic && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Leaf className="h-3 w-3 mr-1" />
                  Organic
                </Badge>
              )}
            </div>
          </div>

          {/* Thumbnail Gallery */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  className={cn(
                    "relative w-20 h-20 rounded-lg overflow-hidden shrink-0 border-2 transition-colors",
                    selectedImageIndex === index ? "border-primary" : "border-transparent hover:border-muted-foreground"
                  )}
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <Image src={image.url || "/placeholder.svg"} alt={image.alt} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl md:text-3xl font-bold">{product.name}</h1>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleWishlistToggle}
                >
                  <Heart className={cn("h-4 w-4", inWishlist && "fill-red-500 text-red-500")} />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{product.ratings.average}</span>
                <span className="text-muted-foreground">({product.ratings.count} reviews)</span>
              </div>
              <Separator orientation="vertical" className="h-5" />
              <div className="flex items-center gap-1 text-muted-foreground">
                <Package className="h-4 w-4" />
                {product.inventory.sold} sold
              </div>
              <Separator orientation="vertical" className="h-5" />
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {product.location.district}, {product.location.state}
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-primary">
                Rs. {product.price.current.toLocaleString()}
              </span>
              <span className="text-lg text-muted-foreground">/{product.price.unit}</span>
            </div>
            {product.price.mrp && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-muted-foreground line-through">
                  Rs. {product.price.mrp.toLocaleString()}
                </span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Save Rs. {(product.price.mrp - product.price.current).toLocaleString()}
                </Badge>
              </div>
            )}
            {product.price.negotiable && (
              <p className="text-sm text-muted-foreground mt-2">Price is negotiable for bulk orders</p>
            )}
          </div>

          {/* Quantity and Add to Cart */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Quantity:</span>
              {inCart ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 bg-transparent"
                    onClick={() => handleUpdateCartQuantity(cartQuantity - 1)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-semibold">{cartQuantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 bg-transparent"
                    onClick={() => handleUpdateCartQuantity(cartQuantity + 1)}
                    disabled={cartQuantity >= product.inventory.available}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 bg-transparent"
                    onClick={() => setQuantity(Math.max(product.inventory.minOrder, quantity - 1))}
                    disabled={quantity <= product.inventory.minOrder}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-semibold">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 bg-transparent"
                    onClick={() => setQuantity(Math.min(product.inventory.maxOrder, quantity + 1))}
                    disabled={quantity >= product.inventory.maxOrder}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <span className="text-sm text-muted-foreground">
                {product.inventory.available} {product.price.unit} available
              </span>
            </div>

            {product.inventory.minOrder > 1 && (
              <p className="text-sm text-muted-foreground">
                Minimum order: {product.inventory.minOrder} {product.price.unit}
              </p>
            )}

            <div className="flex gap-3">
              {inCart ? (
                <Button className="flex-1" size="lg" asChild>
                  <Link href="/marketplace/cart">
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    View Cart ({cartQuantity} items)
                  </Link>
                </Button>
              ) : (
                <Button className="flex-1" size="lg" onClick={handleAddToCart}>
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart
                </Button>
              )}
              <Button variant="secondary" size="lg" className="flex-1" asChild>
                <Link href={`/marketplace/checkout?product=${product._id}&qty=${inCart ? cartQuantity : quantity}`}>
                  Buy Now
                </Link>
              </Button>
            </div>
          </div>

          {/* Delivery Info */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Delivery</p>
                  <p className="text-sm text-muted-foreground">
                    Estimated {product.shipping.estimatedDays.min}-{product.shipping.estimatedDays.max} days
                  </p>
                </div>
              </div>
              {product.shipping.freeShippingAbove && (
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-600">Free Shipping</p>
                    <p className="text-sm text-muted-foreground">
                      On orders above Rs. {product.shipping.freeShippingAbove}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Quality Assured</p>
                  <p className="text-sm text-muted-foreground">100% authentic products</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seller Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={product.seller.avatar || "/placeholder.svg"} />
                  <AvatarFallback>
                    {product.seller.name.first[0]}
                    {product.seller.name.last[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{product.seller.farmName}</h3>
                    {product.seller.isVerified && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        <Check className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {product.seller.name.first} {product.seller.name.last}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{product.seller.rating}</span>
                    </div>
                    <span className="text-muted-foreground">{product.seller.totalProducts} Products</span>
                    <span className="text-muted-foreground">{product.seller.totalSales} Sales</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {product.seller.location}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="flex-1 bg-transparent" asChild>
                  <Link href={`/marketplace?seller=${product.seller._id}`}>
                    <Store className="h-4 w-4 mr-2" />
                    View Store
                  </Link>
                </Button>
                <Button variant="outline" className="flex-1 bg-transparent">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Product Details Tabs */}
      <Tabs defaultValue="description" className="mt-12">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
          <TabsTrigger
            value="description"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            Description
          </TabsTrigger>
          <TabsTrigger
            value="details"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            Details
          </TabsTrigger>
          <TabsTrigger
            value="reviews"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            Reviews ({product.ratings.count})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="description" className="mt-6">
          <div className="prose max-w-none">
            <p className="text-muted-foreground whitespace-pre-line">{product.description}</p>
          </div>
          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {product.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="details" className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Product Attributes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {product.attributes.variety && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Variety</span>
                    <span className="font-medium">{product.attributes.variety}</span>
                  </div>
                )}
                {product.attributes.grade && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Grade</span>
                    <span className="font-medium capitalize">{product.attributes.grade}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Organic</span>
                  <span className="font-medium">{product.attributes.isOrganic ? "Yes" : "No"}</span>
                </div>
                {product.attributes.harvestDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Harvest Date</span>
                    <span className="font-medium">
                      {new Date(product.attributes.harvestDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {product.attributes.expiryDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Best Before</span>
                    <span className="font-medium">
                      {new Date(product.attributes.expiryDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Shipping & Storage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ships From</span>
                  <span className="font-medium">{product.location.district}, {product.location.state}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Time</span>
                  <span className="font-medium">
                    {product.shipping.estimatedDays.min}-{product.shipping.estimatedDays.max} days
                  </span>
                </div>
                {product.attributes.storageInstructions && (
                  <div className="pt-2">
                    <span className="text-muted-foreground block mb-1">Storage Instructions</span>
                    <span className="text-sm">{product.attributes.storageInstructions}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Rating Summary */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-5xl font-bold text-primary">{product.ratings.average}</div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "h-5 w-5",
                          star <= Math.round(product.ratings.average)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted"
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-muted-foreground mt-1">{product.ratings.count} reviews</p>
                </div>

                <div className="mt-6 space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center gap-2">
                      <span className="text-sm w-3">{rating}</span>
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <Progress value={ratingPercentages[rating as keyof typeof ratingPercentages]} className="flex-1 h-2" />
                      <span className="text-sm text-muted-foreground w-8">
                        {product.ratings.distribution[rating as keyof typeof product.ratings.distribution]}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Reviews List */}
            <div className="lg:col-span-2 space-y-4">
              {product.reviews.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h3 className="font-semibold mt-4">No reviews yet</h3>
                    <p className="text-muted-foreground mt-1">Be the first to review this product</p>
                  </CardContent>
                </Card>
              ) : (
                product.reviews.map((review) => (
                  <Card key={review._id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarImage src={review.reviewer.avatar || "/placeholder.svg"} />
                          <AvatarFallback>{review.reviewer.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{review.reviewer.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={cn(
                                        "h-4 w-4",
                                        star <= review.rating
                                          ? "fill-yellow-400 text-yellow-400"
                                          : "text-muted"
                                      )}
                                    />
                                  ))}
                                </div>
                                {review.isVerifiedPurchase && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Check className="h-3 w-3 mr-1" />
                                    Verified Purchase
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {new Date(review.date).toLocaleDateString()}
                            </span>
                          </div>
                          {review.title && <h4 className="font-medium mt-3">{review.title}</h4>}
                          <p className="text-muted-foreground mt-1">{review.content}</p>
                          {review.images && review.images.length > 0 && (
                            <div className="flex gap-2 mt-3">
                              {review.images.map((img, i) => (
                                <div key={i} className="relative w-16 h-16 rounded overflow-hidden">
                                  <Image src={img || "/placeholder.svg"} alt="" fill className="object-cover" />
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-4 mt-3">
                            <Button variant="ghost" size="sm">
                              <ThumbsUp className="h-4 w-4 mr-1" />
                              Helpful ({review.helpfulCount})
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Related Products</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((relatedProduct) => (
              <Card key={relatedProduct._id} className="overflow-hidden group">
                <Link href={`/marketplace/product/${relatedProduct._id}`}>
                  <div className="relative aspect-square">
                    <Image
                      src={relatedProduct.images[0]?.url || "/placeholder.svg"}
                      alt={relatedProduct.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                    {relatedProduct.attributes.isOrganic && (
                      <Badge variant="secondary" className="absolute right-2 top-2 bg-green-100 text-green-800">
                        <Leaf className="h-3 w-3" />
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold line-clamp-1">{relatedProduct.name}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{relatedProduct.ratings.average}</span>
                    </div>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-lg font-bold text-primary">
                        Rs. {relatedProduct.price.current.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground">/{relatedProduct.price.unit}</span>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* More from Seller */}
      {sellerProducts.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-6">More from {product.seller.farmName}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {sellerProducts.map((sellerProduct) => (
              <Card key={sellerProduct._id} className="overflow-hidden group">
                <Link href={`/marketplace/product/${sellerProduct._id}`}>
                  <div className="relative aspect-square">
                    <Image
                      src={sellerProduct.images[0]?.url || "/placeholder.svg"}
                      alt={sellerProduct.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold line-clamp-1">{sellerProduct.name}</h3>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-lg font-bold text-primary">
                        Rs. {sellerProduct.price.current.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground">/{sellerProduct.price.unit}</span>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
