"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Edit, MoreVertical, Package, Calendar, Tag, ShieldCheck, MapPin, Plus, Minus, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { fetchWithAuth, apiUrl } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useCart } from "@/contexts/cart-context"

export default function ProductDetailPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string
    const [product, setProduct] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const { addItem } = useCart()
    const [quantity, setQuantity] = useState(1)

    useEffect(() => {
        async function loadProduct() {
            try {
                const res = await fetchWithAuth(apiUrl(`/products/${id}`))
                if (!res.ok) {
                    throw new Error("Failed to load product")
                }
                const data = await res.json()
                console.log("Product Data Debug:", data.data.product)
                console.log("Seller Address:", data.data.product?.seller?.address)
                setProduct(data.data.product)
            } catch (error) {
                toast.error("Could not load product details")
                router.push("/dashboard/products")
            } finally {
                setLoading(false)
            }
        }
        if (id) {
            loadProduct()
        }
    }, [id, router])

    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        const storedUser = sessionStorage.getItem("user")
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser))
            } catch (e) {
                // Ignore error
            }
        }
    }, [])

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-md" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                    <Skeleton className="aspect-square rounded-lg" />
                    <div className="space-y-4">
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                </div>
            </div>
        )
    }

    if (!product) return null

    const images = product.images?.map((img: any) => typeof img === "string" ? img : img.url) || []
    const primaryImage = images[0] || "/placeholder.svg"

    return (
        <div className="space-y-6 max-w-5xl">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard/products">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
                            <Badge variant={product.status === "active" || product.status === "available" ? "default" : "secondary"}>
                                {product.status}
                            </Badge>
                            {product.attributes?.isOrganic && (
                                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                                    Organic
                                </Badge>
                            )}
                        </div>
                        <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
                            <Tag className="h-3 w-3" /> {product.category}
                            {product.subcategory && ` • ${product.subcategory}`}
                        </p>
                    </div>
                </div>
                {user?.role === "farmer" && (
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => router.push(`/dashboard/products/${id}/edit`)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem className="text-destructive">Delete Product</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-12">
                {/* Left Column: Images */}
                <div className="md:col-span-5 space-y-4">
                    <div className="aspect-square relative rounded-lg border overflow-hidden bg-muted">
                        <Image
                            src={primaryImage}
                            alt={product.name}
                            fill
                            className="object-cover"
                        />
                    </div>
                    {images.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {images.map((img: string, i: number) => (
                                <div key={i} className="relative w-20 h-20 rounded-md border overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80">
                                    <Image src={img} alt={`Product ${i}`} fill className="object-cover" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Column: Details */}
                <div className="md:col-span-7 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pricing & Inventory</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-primary">
                                    ₹{product.price.current?.toLocaleString()}
                                </span>
                                <span className="text-muted-foreground">/ {product.price.unit}</span>
                                {product.price.negotiable && (
                                    <Badge variant="outline" className="ml-2">Negotiable</Badge>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-muted/50 rounded-lg">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                        <Package className="h-4 w-4" />
                                        <span className="text-xs font-medium uppercase">Available Stock</span>
                                    </div>
                                    <p className="text-xl font-semibold">
                                        {product.inventory?.available} {product.price.unit}
                                    </p>
                                </div>
                                <div className="p-3 bg-muted/50 rounded-lg">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                        <Package className="h-4 w-4" />
                                        <span className="text-xs font-medium uppercase">Min Order</span>
                                    </div>
                                    <p className="text-xl font-semibold">
                                        {product.inventory?.minOrder} {product.price.unit}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 pt-4 border-t mt-4">
                                <div className="flex items-center border rounded-md h-10">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-full w-10 rounded-none border-r"
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        disabled={quantity <= 1}
                                    >
                                        <Minus className="h-4 w-4" />
                                    </Button>
                                    <span className="w-12 text-center font-medium">{quantity}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-full w-10 rounded-none border-l"
                                        onClick={() => setQuantity(Math.min(product.inventory?.available || 99, quantity + 1))}
                                        disabled={quantity >= (product.inventory?.available || 99)}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                <Button className="flex-1 h-10" onClick={() => addItem(product._id, quantity)}>
                                    <ShoppingCart className="h-4 w-4 mr-2" />
                                    Add to Cart
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                                {product.description}
                            </p>
                        </CardContent>
                    </Card>

                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    Key Dates
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Harvest Date</span>
                                    <span className="font-medium">
                                        {product.attributes?.harvestDate ? new Date(product.attributes.harvestDate).toLocaleDateString() : "N/A"}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Listed On</span>
                                    <span className="font-medium">
                                        {new Date(product.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-primary" />
                                    Location
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">State</span>
                                    <span className="font-medium">
                                        {product.location?.state || product.seller?.address?.state || "N/A"}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">District</span>
                                    <span className="font-medium">
                                        {product.location?.district || product.seller?.address?.district || "N/A"}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
