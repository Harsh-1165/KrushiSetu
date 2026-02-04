"use client"

import { useEffect, useState } from "react"
import { OrderCard, OrderList, OrderListSkeleton } from "@/components/dashboard/order-card"
import { apiUrl, fetchWithAuth } from "@/lib/api"
import { toast } from "sonner"
import { ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await fetchWithAuth(apiUrl("/orders"))
      const data = await res.json()

      if (data.success) {
        // Adapt backend data to OrderCard structure
        const adaptedOrders = data.data.orders.map((order: any) => ({
          _id: order._id,
          orderNumber: order.orderNumber,
          // Map backend 'items' key to 'products' which OrderCard expects
          products: order.items.map((item: any) => ({
            product: {
              name: item.product.name,
              images: item.product.images
            },
            quantity: item.quantity,
            priceAtTime: item.pricePerUnit || 0
          })),
          totalAmount: order.pricing.total,
          status: order.status,
          createdAt: order.createdAt,
          buyer: order.buyer ? {
            name: {
              first: order.buyer.profile?.firstName || "Unknown",
              last: order.buyer.profile?.lastName || ""
            }
          } : undefined
        }))
        setOrders(adaptedOrders)
      }
    } catch (error) {
      console.error("Failed to fetch orders", error)
      toast.error("Failed to load orders")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">View and manage your orders.</p>
        </div>
        <OrderListSkeleton count={4} />
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">View and manage your orders.</p>
        </div>
        <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-muted/20 h-[400px]">
          <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No orders yet</h3>
          <p className="text-muted-foreground mb-4">You haven't placed any orders yet.</p>
          <Button asChild>
            <Link href="/dashboard/browse-products">Start Shopping</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">
          View and manage your orders.
        </p>
      </div>

      <OrderList>
        {orders.map((order) => (
          <OrderCard key={order._id} order={order} />
        ))}
      </OrderList>
    </div>
  )
}
