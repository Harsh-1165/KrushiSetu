"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, Filter, SlidersHorizontal, X, LayoutGrid, List as ListIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { ProductCard, ProductGrid, ProductGridSkeleton } from "@/components/dashboard/product-card"
import { NoProducts } from "@/components/dashboard/empty-state"
import { apiUrl } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value)
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)
        return () => {
            clearTimeout(handler)
        }
    }, [value, delay])
    return debouncedValue
}

function BrowseProductsContent() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // View Mode
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

    // Data State
    const [products, setProducts] = useState<any[]>([])
    const [categories, setCategories] = useState<{ name: string, count: number }[]>([])
    const [loading, setLoading] = useState(true)
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        pages: 1,
        hasNext: false,
        hasPrev: false
    })

    // Filter States
    const [search, setSearch] = useState("")
    const debouncedSearch = useDebounce(search, 500)

    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

    // Price Range (Local state for slider, applied to fetch on debounce/release could be better, but simple debounce for now)
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000])
    const [debouncedPriceRange] = useState(priceRange) // We will trigger fetch on manual "Apply" or debounce if needed. 
    // Actually, for price sliders, it's better to update on change end or apply button.
    // Let's use simple inputs or debounce. Using debounce for plan simplicity.
    const debouncedMinPrice = useDebounce(priceRange[0], 500)
    const debouncedMaxPrice = useDebounce(priceRange[1], 500)

    const [locationState, setLocationState] = useState("")
    const debouncedLocationState = useDebounce(locationState, 500)

    const [minRating, setMinRating] = useState<number>(0)

    const [sort, setSort] = useState("createdAt_desc")

    // Fetch Categories
    useEffect(() => {
        fetch(apiUrl("/products/categories"))
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setCategories(data.data.categories)
                }
            })
            .catch(err => console.error("Failed to load categories", err))
    }, [])

    // Fetch Products
    const fetchProducts = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            params.append("page", pagination.page.toString())
            params.append("limit", pagination.limit.toString())

            if (debouncedSearch) params.append("search", debouncedSearch)
            if (selectedCategory) params.append("category", selectedCategory)

            if (debouncedMinPrice > 0) params.append("minPrice", debouncedMinPrice.toString())
            if (debouncedMaxPrice < 10000) params.append("maxPrice", debouncedMaxPrice.toString())

            if (debouncedLocationState) params.append("state", debouncedLocationState)

            if (minRating > 0) params.append("minRating", minRating.toString())

            const [sortBy, sortOrder] = sort.split("_")
            params.append("sortBy", sortBy)
            params.append("sortOrder", sortOrder)

            const res = await fetch(apiUrl(`/products/public?${params.toString()}`))
            const data = await res.json()

            if (data.success && Array.isArray(data.data.products)) {
                setProducts(data.data.products)
                setPagination(prev => ({
                    ...prev,
                    ...data.data.pagination
                }))
            } else {
                setProducts([])
                setPagination(prev => ({ ...prev, total: 0, pages: 1 }))
            }
        } catch (error) {
            console.error("Failed to fetch products", error)
            setProducts([])
        } finally {
            setLoading(false)
        }
    }, [
        pagination.page,
        pagination.limit,
        debouncedSearch,
        selectedCategory,
        debouncedMinPrice,
        debouncedMaxPrice,
        debouncedLocationState,
        minRating,
        sort
    ])

    useEffect(() => {
        fetchProducts()
    }, [fetchProducts])

    // Reset page when filters change
    useEffect(() => {
        setPagination(prev => ({ ...prev, page: 1 }))
    }, [debouncedSearch, selectedCategory, debouncedMinPrice, debouncedMaxPrice, debouncedLocationState, minRating, sort])


    const clearFilters = () => {
        setSearch("")
        setSelectedCategory(null)
        setPriceRange([0, 10000])
        setLocationState("")
        setMinRating(0)
        setSort("createdAt_desc")
    }

    const FilterSidebar = () => (
        <div className="space-y-6">
            {/* Categories */}
            <div>
                <h3 className="font-semibold mb-4">Categories</h3>
                <ScrollArea className="h-[200px] w-full rounded-md border p-1">
                    <div className="space-y-1">
                        <Button
                            variant={selectedCategory === null ? "secondary" : "ghost"}
                            className="w-full justify-start font-normal h-8"
                            onClick={() => setSelectedCategory(null)}
                        >
                            All Categories
                        </Button>
                        {categories.map((cat) => (
                            <Button
                                key={cat.name}
                                variant={selectedCategory === cat.name ? "secondary" : "ghost"}
                                className="w-full justify-start font-normal justify-between h-8"
                                onClick={() => setSelectedCategory(cat.name)}
                            >
                                <span className="capitalize truncate">{cat.name}</span>
                                <span className="text-xs text-muted-foreground ml-2">{cat.count}</span>
                            </Button>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Price Range */}
            <div>
                <h3 className="font-semibold mb-4">Price Range</h3>
                <div className="space-y-4">
                    <Slider
                        defaultValue={[0, 10000]}
                        value={priceRange}
                        max={10000}
                        step={100}
                        onValueChange={(val) => setPriceRange(val as [number, number])}
                        className="my-4"
                    />
                    <div className="flex items-center gap-2">
                        <div className="grid gap-1.5 flex-1">
                            <Label className="text-xs">Min (₹)</Label>
                            <Input
                                type="number"
                                value={priceRange[0]}
                                onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                                className="h-8"
                            />
                        </div>
                        <div className="grid gap-1.5 flex-1">
                            <Label className="text-xs">Max (₹)</Label>
                            <Input
                                type="number"
                                value={priceRange[1]}
                                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                                className="h-8"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Location */}
            <div>
                <h3 className="font-semibold mb-4">Location</h3>
                <div className="grid gap-1.5">
                    <Label className="text-xs">State</Label>
                    <Input
                        placeholder="e.g. Punjab"
                        value={locationState}
                        onChange={(e) => setLocationState(e.target.value)}
                        className="h-8"
                    />
                </div>
            </div>

            {/* Rating */}
            <div>
                <h3 className="font-semibold mb-4">Rating</h3>
                <div className="space-y-2">
                    {[4, 3, 2, 1].map((r) => (
                        <div key={r} className="flex items-center space-x-2">
                            <Checkbox
                                id={`rating-${r}`}
                                checked={minRating === r}
                                onCheckedChange={(checked) => setMinRating(checked ? r : 0)}
                            />
                            <label
                                htmlFor={`rating-${r}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
                            >
                                {r}+ Stars
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            <Button variant="outline" className="w-full" onClick={clearFilters}>
                Clear All Filters
            </Button>
        </div>
    )

    return (
        <div className="container py-6 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
                    <p className="text-muted-foreground">Fresh produce directly from farmers.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto items-center">
                    <div className="relative w-full sm:w-[300px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search products..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" className="md:hidden">
                                <Filter className="mr-2 h-4 w-4" />
                                Filters
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                            <SheetHeader>
                                <SheetTitle>Filters</SheetTitle>
                            </SheetHeader>
                            <div className="mt-4">
                                <FilterSidebar />
                            </div>
                        </SheetContent>
                    </Sheet>

                    <div className="flex items-center border rounded-md bg-background">
                        <Button
                            variant={viewMode === "grid" ? "secondary" : "ghost"}
                            size="icon"
                            className="h-9 w-9 rounded-none rounded-l-md"
                            onClick={() => setViewMode("grid")}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === "list" ? "secondary" : "ghost"}
                            size="icon"
                            className="h-9 w-9 rounded-none rounded-r-md"
                            onClick={() => setViewMode("list")}
                        >
                            <ListIcon className="h-4 w-4" />
                        </Button>
                    </div>

                    <Select value={sort} onValueChange={setSort}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="createdAt_desc">Newest First</SelectItem>
                            <SelectItem value="price_current_asc">Price: Low to High</SelectItem>
                            <SelectItem value="price_current_desc">Price: High to Low</SelectItem>
                            <SelectItem value="ratings_average_desc">Top Rated</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Sidebar (Desktop) */}
                <div className="hidden md:block">
                    <FilterSidebar />
                </div>

                {/* Product Grid */}
                <div className="md:col-span-3 space-y-6">
                    {/* Active Filters Display can go here */}
                    {(selectedCategory || locationState || minRating > 0 || priceRange[0] > 0 || priceRange[1] < 10000) && (
                        <div className="flex flex-wrap items-center gap-2">
                            {selectedCategory && (
                                <Badge variant="secondary" className="gap-1 pl-2">
                                    {selectedCategory}
                                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedCategory(null)} />
                                </Badge>
                            )}
                            {/* Add other active filter badges here if desired */}
                        </div>
                    )}

                    {loading ? (
                        <ProductGridSkeleton count={9} />
                    ) : products.length > 0 ? (
                        <div className={viewMode === "grid" ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-4"}>
                            {products.map((product) => (
                                <ProductCard
                                    key={product._id}
                                    product={{
                                        ...product,
                                        price: typeof product.price === 'object' ? product.price.current : product.price
                                    }}
                                    showStatus={false}
                                    showInventory={true}
                                    showAddToCart={true}
                                    showFavorite={true}
                                    layout={viewMode}
                                />
                            ))}
                        </div>
                    ) : (
                        <NoProducts
                            title="No products found"
                            message="Try adjusting your search or filters to find what you're looking for."
                            onAction={clearFilters}
                            actionLabel="Clear Filters"
                        />
                    )}

                    {/* Pagination */}
                    {products.length > 0 && pagination.pages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-8">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                disabled={!pagination.hasPrev || loading}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="text-sm font-medium">
                                Page {pagination.page} of {pagination.pages}
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                disabled={!pagination.hasNext || loading}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function BrowseProductsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <BrowseProductsContent />
        </Suspense>
    )
}
