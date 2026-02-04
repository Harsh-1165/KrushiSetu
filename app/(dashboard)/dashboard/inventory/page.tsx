"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import useSWR, { mutate } from "swr"
import {
  Package,
  AlertTriangle,
  ShoppingBag,
  TrendingDown,
  Search,
  Plus,
  Filter,
  RefreshCw,
  Edit,
  Eye,
  ArrowUpRight
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { apiUrl, fetchWithAuth } from "@/lib/api"
import { cn } from "@/lib/utils"

// Helper fetcher
const fetcher = (url: string) => fetchWithAuth(url).then((res) => res.json())

export default function InventoryPage() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [restockItem, setRestockItem] = useState<any>(null)
  const [restockQuantity, setRestockQuantity] = useState<number>(0)
  const [isRestocking, setIsRestocking] = useState(false)

  // Fetch Inventory Data
  const { data: inventoryData, isLoading, error } = useSWR(
    apiUrl("/products/farmer"),
    fetcher,
    { refreshInterval: 30000 } // Auto-refresh every 30s
  )

  const products = inventoryData?.success ? inventoryData.data.products : []
  const stats = inventoryData?.success ? inventoryData.data.stats : {
    totalProducts: 0,
    lowStock: 0,
    outOfStock: 0,
    totalQuantity: 0
  }

  // Filtered Products
  const filteredProducts = products.filter((p: any) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Handle Restock
  const handleRestock = async () => {
    if (!restockItem) return

    setIsRestocking(true)
    try {
      const endpoint = apiUrl(`/products/${restockItem._id}`)

      // Calculate new available quantity
      const newAvailable = (restockItem.inventory.available || 0) + Number(restockQuantity)

      const res = await fetchWithAuth(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventory: {
            available: newAvailable
            // We only update available, other fields stay same if not sent? 
            // The backend PUT handles partial updates mostly, but let's be careful.
            // Actually implementation_plan says PUT /products/:id updates checks for ownership.
          }
        })
      })

      const data = await res.json()

      if (data.success) {
        toast({
          title: "Stock Updated",
          description: `Added ${restockQuantity} units to ${restockItem.name}`,
        })
        mutate(apiUrl("/products/farmer")) // Refresh data
        setRestockItem(null)
      } else {
        throw new Error(data.message || "Failed to update stock")
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setIsRestocking(false)
      setRestockQuantity(0)
    }
  }

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemAnim = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Failed to load inventory. Please try again.</div>
  }

  return (
    <div className="space-y-8 p-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Inventory Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time tracking of your products and stock levels.
          </p>
        </div>
        <Button asChild className="bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200">
          <Link href="/dashboard/products/add">
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Products"
          value={stats.totalProducts}
          icon={Package}
          color="text-blue-600"
          bgColor="bg-blue-50"
          loading={isLoading}
        />
        <SummaryCard
          title="Low Stock"
          value={stats.lowStock}
          icon={AlertTriangle}
          color="text-yellow-600"
          bgColor="bg-yellow-50"
          loading={isLoading}
          pulse={stats.lowStock > 0}
        />
        <SummaryCard
          title="Out of Stock"
          value={stats.outOfStock}
          icon={TrendingDown}
          color="text-red-600"
          bgColor="bg-red-50"
          loading={isLoading}
        />
        <SummaryCard
          title="Total Items"
          value={stats.totalQuantity}
          icon={ShoppingBag}
          color="text-emerald-600"
          bgColor="bg-emerald-50"
          loading={isLoading}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 bg-secondary/50 p-2 rounded-lg border border-border/50 backdrop-blur-sm">
        <Search className="h-4 w-4 text-muted-foreground ml-2" />
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-0 bg-transparent focus-visible:ring-0 w-full md:w-[300px] text-foreground placeholder:text-muted-foreground"
        />
        <Button variant="ghost" size="sm" className="ml-auto text-muted-foreground hover:text-foreground">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Inventory Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[300px] w-full rounded-xl" />
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {filteredProducts.map((product: any) => (
            <ProductCard
              key={product._id}
              product={product}
              onRestock={() => {
                setRestockItem(product)
                setRestockQuantity(10) // default increment
              }}
            />
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed border-border/50">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium">No products found</h3>
          <p className="text-muted-foreground">Try adjusting your search or add a new product.</p>
        </div>
      )}

      {/* Restock Modal */}
      <Dialog open={!!restockItem} onOpenChange={(open) => !open && setRestockItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restock Product</DialogTitle>
            <DialogDescription>
              Add inventory for <span className="font-semibold text-foreground">{restockItem?.name}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Current</Label>
              <div className="col-span-3 font-medium">
                {restockItem?.inventory?.available} {restockItem?.price?.unit}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">Add Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={restockQuantity}
                onChange={(e) => setRestockQuantity(Number(e.target.value))}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestockItem(null)}>Cancel</Button>
            <Button onClick={handleRestock} disabled={isRestocking} className="bg-green-600 hover:bg-green-700">
              {isRestocking ? "Updating..." : "Confirm Restock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SummaryCard({ title, value, icon: Icon, color, bgColor, loading, pulse }: any) {
  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-all duration-300 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-6 flex items-center gap-4">
        <div className={cn("h-12 w-12 rounded-full flex items-center justify-center shrink-0", bgColor, pulse && "animate-pulse")}>
          <Icon className={cn("h-6 w-6", color)} />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {loading ? (
            <Skeleton className="h-8 w-16 mt-1" />
          ) : (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold"
            >
              {value}
            </motion.p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ProductCard({ product, onRestock }: { product: any, onRestock: () => void }) {
  const quantity = product.inventory.available
  const max = 100 // Target healthy stock
  const percentage = Math.min((quantity / max) * 100, 100)

  let statusColor = "bg-green-500"
  let statusText = "In Stock"
  let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "default"

  if (quantity === 0) {
    statusColor = "bg-red-500"
    statusText = "Out of Stock"
    badgeVariant = "destructive"
  } else if (quantity <= 10) {
    statusColor = "bg-yellow-500"
    statusText = "Low Stock"
    badgeVariant = "secondary"
  }

  const itemAnim = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  }

  return (
    <motion.div variants={itemAnim} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
      <Card className="h-full overflow-hidden border-border/50 shadow-sm hover:shadow-xl hover:border-green-200 transition-all duration-300 group bg-card">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {product.images?.[0] ? (
            <Image
              src={typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-muted">
              <Package className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
          <div className="absolute top-2 right-2">
            <Badge variant={badgeVariant} className="shadow-sm backdrop-blur-md bg-opacity-90">
              {statusText}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 space-y-4">
          <div>
            <div className="flex justify-between items-start mb-1">
              <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-green-700 transition-colors">
                {product.name}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground capitalize">{product.category}</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Stock Level</span>
              <span className={cn("font-medium", quantity <= 10 && "text-red-500")}>
                {quantity} {product.price.unit}
              </span>
            </div>
            <Progress value={percentage} className="h-2" indicatorClassName={statusColor} />
          </div>

          <div className="pt-2 border-t space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-bold text-lg">₹{product.price.current}</p>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" asChild>
                  <Link href={`/dashboard/products/${product._id}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full border-green-200 hover:bg-green-50 hover:text-green-700 hover:border-green-300 transition-colors"
              onClick={onRestock}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Restock Inventory
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
