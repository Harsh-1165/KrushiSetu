"use client"

import React, { useState, useEffect, useMemo, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
  Grid3X3,
  List,
  Filter,
  ChevronDown,
  Star,
  Heart,
  ShoppingCart,
  MapPin,
  Leaf,
  SlidersHorizontal,
  X,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
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
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useCart, useWishlist } from "@/lib/cart-context"
import {
  mockProducts,
  categories,
  locations,
  sortOptions,
  filterProducts,
  sortProducts,
  type MarketplaceProduct,
} from "@/lib/marketplace-data"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import Loading from "./loading"

function ProductListingContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { addItem, isInCart } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()

  // View state
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isLoading, setIsLoading] = useState(true)

  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1500])
  const [selectedLocation, setSelectedLocation] = useState("")
  const [organicOnly, setOrganicOnly] = useState(false)
  const [minRating, setMinRating] = useState(0)
  const [inStockOnly, setInStockOnly] = useState(true)
  const [sortBy, setSortBy] = useState("relevance")

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  // Simulate loading
  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [searchParams])

  // Update URL params
  const updateUrlParams = (params: Record<string, string | null>) => {
    const url = new URL(window.location.href)
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value)
      } else {
        url.searchParams.delete(key)
      }
    })
    router.push(url.pathname + url.search, { scroll: false })
  }

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = filterProducts(mockProducts, {
      search: searchQuery,
      category: selectedCategory,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      location: selectedLocation,
      organic: organicOnly,
      minRating: minRating,
      inStock: inStockOnly,
    })
    return sortProducts(result, sortBy)
  }, [searchQuery, selectedCategory, priceRange, selectedLocation, organicOnly, minRating, inStockOnly, sortBy])

  // Paginated products
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategory, priceRange, selectedLocation, organicOnly, minRating, inStockOnly, sortBy])

  // Sync with URL params
  useEffect(() => {
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    if (category) setSelectedCategory(category)
    if (search) setSearchQuery(search)
  }, [searchParams])

  const handleAddToCart = (product: MarketplaceProduct) => {
    addItem({
      _id: product._id,
      name: product.name,
      price: product.price.current,
      unit: product.price.unit,
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

  const handleWishlistToggle = (product: MarketplaceProduct) => {
    if (isInWishlist(product._id)) {
      removeFromWishlist(product._id)
      toast.success(`${product.name} removed from wishlist`)
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
      toast.success(`${product.name} added to wishlist`)
    }
  }

  const clearAllFilters = () => {
    setSearchQuery("")
    setSelectedCategory("")
    setPriceRange([0, 1500])
    setSelectedLocation("")
    setOrganicOnly(false)
    setMinRating(0)
    setInStockOnly(true)
    setSortBy("relevance")
    router.push("/marketplace", { scroll: false })
  }

  const hasActiveFilters = searchQuery || selectedCategory || selectedLocation || organicOnly || minRating > 0 || priceRange[0] > 0 || priceRange[1] < 1500

  // Filter Sidebar Component
  const FilterSidebar = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={cn("space-y-6", isMobile && "pb-20")}>
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearAllFilters} className="w-full justify-start text-destructive">
          <X className="h-4 w-4 mr-2" />
          Clear all filters
        </Button>
      )}

      <Accordion type="multiple" defaultValue={["category", "price", "location", "filters"]} className="w-full">
        {/* Categories */}
        <AccordionItem value="category">
          <AccordionTrigger className="text-sm font-medium">Categories</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <div
                className={cn(
                  "flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors",
                  !selectedCategory ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                )}
                onClick={() => {
                  setSelectedCategory("")
                  updateUrlParams({ category: null })
                }}
              >
                <span className="text-sm">All Categories</span>
                {!selectedCategory && <Check className="h-4 w-4" />}
              </div>
              {categories.map((cat) => (
                <div
                  key={cat.name}
                  className={cn(
                    "flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors",
                    selectedCategory === cat.name ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  )}
                  onClick={() => {
                    setSelectedCategory(cat.name)
                    updateUrlParams({ category: cat.name })
                  }}
                >
                  <span className="text-sm">{cat.label}</span>
                  <span className={cn("text-xs", selectedCategory === cat.name ? "text-primary-foreground/70" : "text-muted-foreground")}>
                    {cat.count}
                  </span>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Price Range */}
        <AccordionItem value="price">
          <AccordionTrigger className="text-sm font-medium">Price Range</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 px-1">
              <Slider
                value={priceRange}
                onValueChange={(value) => setPriceRange(value as [number, number])}
                max={1500}
                min={0}
                step={10}
                className="w-full"
              />
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Min</Label>
                  <Input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                    className="h-8"
                  />
                </div>
                <span className="text-muted-foreground mt-5">-</span>
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Max</Label>
                  <Input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="h-8"
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Location */}
        <AccordionItem value="location">
          <AccordionTrigger className="text-sm font-medium">Location</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <div
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
                  !selectedLocation ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                )}
                onClick={() => setSelectedLocation("")}
              >
                <MapPin className="h-4 w-4" />
                <span className="text-sm">All Locations</span>
              </div>
              {locations.map((loc) => (
                <div
                  key={loc.state}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
                    selectedLocation === loc.state ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  )}
                  onClick={() => setSelectedLocation(loc.state)}
                >
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{loc.state}</span>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Additional Filters */}
        <AccordionItem value="filters">
          <AccordionTrigger className="text-sm font-medium">More Filters</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              {/* Organic */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="organic"
                  checked={organicOnly}
                  onCheckedChange={(checked) => setOrganicOnly(checked === true)}
                />
                <Label htmlFor="organic" className="text-sm cursor-pointer flex items-center gap-1">
                  <Leaf className="h-4 w-4 text-green-600" />
                  Organic Only
                </Label>
              </div>

              {/* In Stock */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="inStock"
                  checked={inStockOnly}
                  onCheckedChange={(checked) => setInStockOnly(checked === true)}
                />
                <Label htmlFor="inStock" className="text-sm cursor-pointer">
                  In Stock Only
                </Label>
              </div>

              {/* Rating */}
              <div className="space-y-2">
                <Label className="text-sm">Minimum Rating</Label>
                <div className="flex gap-1">
                  {[0, 3, 3.5, 4, 4.5].map((rating) => (
                    <Button
                      key={rating}
                      variant={minRating === rating ? "default" : "outline"}
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => setMinRating(rating)}
                    >
                      {rating === 0 ? "All" : (
                        <span className="flex items-center gap-0.5">
                          {rating}
                          <Star className="h-3 w-3 fill-current" />
                        </span>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )

  // Product Card Component
  const ProductCard = ({ product, isListView = false }: { product: MarketplaceProduct; isListView?: boolean }) => {
    const inWishlist = isInWishlist(product._id)
    const inCart = isInCart(product._id)
    const discount = product.price.mrp
      ? Math.round(((product.price.mrp - product.price.current) / product.price.mrp) * 100)
      : 0

    if (isListView) {
      return (
        <Card className="overflow-hidden">
          <div className="flex flex-col sm:flex-row">
            <div className="relative w-full sm:w-48 h-48 sm:h-auto shrink-0">
              <Link href={`/marketplace/product/${product._id}`}>
                <Image
                  src={product.images[0]?.url || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </Link>
              {discount > 0 && (
                <Badge className="absolute left-2 top-2 bg-red-500">-{discount}%</Badge>
              )}
              {product.attributes.isOrganic && (
                <Badge variant="secondary" className="absolute left-2 bottom-2 bg-green-100 text-green-800">
                  <Leaf className="h-3 w-3 mr-1" />
                  Organic
                </Badge>
              )}
            </div>
            <CardContent className="flex-1 p-4">
              <div className="flex flex-col h-full">
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link href={`/marketplace/product/${product._id}`}>
                        <h3 className="font-semibold hover:text-primary transition-colors line-clamp-1">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="text-sm text-muted-foreground">{product.seller.farmName}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => handleWishlistToggle(product)}
                    >
                      <Heart className={cn("h-5 w-5", inWishlist && "fill-red-500 text-red-500")} />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{product.shortDescription}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{product.ratings.average}</span>
                      <span className="text-muted-foreground">({product.ratings.count})</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {product.location.district}, {product.location.state}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-primary">
                        Rs. {product.price.current.toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground">/{product.price.unit}</span>
                    </div>
                    {product.price.mrp && (
                      <span className="text-sm text-muted-foreground line-through">
                        Rs. {product.price.mrp.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <Button onClick={() => handleAddToCart(product)} disabled={inCart}>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {inCart ? "In Cart" : "Add to Cart"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
      )
    }

    return (
      <Card className="overflow-hidden group">
        <div className="relative aspect-square">
          <Link href={`/marketplace/product/${product._id}`}>
            <Image
              src={product.images[0]?.url || "/placeholder.svg"}
              alt={product.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          </Link>
          {discount > 0 && (
            <Badge className="absolute left-2 top-2 bg-red-500">-{discount}%</Badge>
          )}
          {product.attributes.isOrganic && (
            <Badge variant="secondary" className="absolute right-2 top-2 bg-green-100 text-green-800">
              <Leaf className="h-3 w-3" />
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 bottom-2 bg-background/80 backdrop-blur-sm hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => handleWishlistToggle(product)}
          >
            <Heart className={cn("h-4 w-4", inWishlist && "fill-red-500 text-red-500")} />
          </Button>
        </div>
        <CardContent className="p-4">
          <Link href={`/marketplace/product/${product._id}`}>
            <h3 className="font-semibold line-clamp-1 hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>
          <p className="text-sm text-muted-foreground line-clamp-1">{product.seller.farmName}</p>
          <div className="flex items-center gap-1 mt-1">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{product.ratings.average}</span>
            <span className="text-xs text-muted-foreground">({product.ratings.count})</span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {product.location.state}
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-lg font-bold text-primary">
              Rs. {product.price.current.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground">/{product.price.unit}</span>
          </div>
          {product.price.mrp && (
            <span className="text-xs text-muted-foreground line-through">
              Rs. {product.price.mrp.toLocaleString()}
            </span>
          )}
          <Button
            className="w-full mt-3"
            size="sm"
            onClick={() => handleAddToCart(product)}
            disabled={inCart}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {inCart ? "In Cart" : "Add to Cart"}
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Loading Skeleton
  const ProductSkeleton = ({ isListView = false }: { isListView?: boolean }) => {
    if (isListView) {
      return (
        <Card className="overflow-hidden">
          <div className="flex flex-col sm:flex-row">
            <Skeleton className="w-full sm:w-48 h-48" />
            <div className="flex-1 p-4 space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </div>
        </Card>
      )
    }
    return (
      <Card className="overflow-hidden">
        <Skeleton className="aspect-square w-full" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-9 w-full" />
        </div>
      </Card>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex gap-6">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </h2>
            <FilterSidebar />
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold">
                {selectedCategory
                  ? categories.find((c) => c.name === selectedCategory)?.label || "Products"
                  : searchQuery
                    ? `Search: "${searchQuery}"`
                    : "All Products"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {filteredProducts.length} products found
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Mobile Filter Button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden bg-transparent">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="ml-2">
                        Active
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Filters
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterSidebar isMobile />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* View Toggle */}
              <div className="hidden sm:flex items-center border rounded-md">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-9 w-9 rounded-r-none"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-9 w-9 rounded-l-none"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mb-4">
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchQuery}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery("")} />
                </Badge>
              )}
              {selectedCategory && (
                <Badge variant="secondary" className="gap-1">
                  {categories.find((c) => c.name === selectedCategory)?.label}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => { setSelectedCategory(""); updateUrlParams({ category: null }) }} />
                </Badge>
              )}
              {selectedLocation && (
                <Badge variant="secondary" className="gap-1">
                  {selectedLocation}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedLocation("")} />
                </Badge>
              )}
              {organicOnly && (
                <Badge variant="secondary" className="gap-1">
                  Organic
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setOrganicOnly(false)} />
                </Badge>
              )}
              {minRating > 0 && (
                <Badge variant="secondary" className="gap-1">
                  {minRating}+ Stars
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setMinRating(0)} />
                </Badge>
              )}
            </div>
          )}

          {/* Products Grid/List */}
          {isLoading ? (
            <div className={cn(
              viewMode === "grid"
                ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                : "space-y-4"
            )}>
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductSkeleton key={i} isListView={viewMode === "list"} />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Filter className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No products found</h3>
              <p className="text-muted-foreground mt-1">Try adjusting your filters or search query</p>
              <Button variant="outline" className="mt-4 bg-transparent" onClick={clearAllFilters}>
                Clear all filters
              </Button>
            </div>
          ) : (
            <>
              <div className={cn(
                viewMode === "grid"
                  ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                  : "space-y-4"
              )}>
                {paginatedProducts.map((product) => (
                  <ProductCard key={product._id} product={product} isListView={viewMode === "list"} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        if (totalPages <= 5) return true
                        if (page === 1 || page === totalPages) return true
                        if (Math.abs(page - currentPage) <= 1) return true
                        return false
                      })
                      .map((page, index, arr) => (
                        <React.Fragment key={page}>
                          {index > 0 && arr[index - 1] !== page - 1 && (
                            <span className="px-2 text-muted-foreground">...</span>
                          )}
                          <Button
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            className="w-9"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        </React.Fragment>
                      ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ProductListingPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ProductListingContent />
    </Suspense>
  )
}
