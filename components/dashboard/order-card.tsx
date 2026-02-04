"use client"

import React from "react"

import Image from "next/image"
import Link from "next/link"
import { format } from "date-fns"
import { Package, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface OrderCardProps {
  order: {
    _id: string
    orderNumber: string
    products: Array<{
      product: { name: string; images?: string[] }
      quantity: number
      priceAtTime: number
    }>
    buyer?: { name: { first: string; last: string } }
    totalAmount: number
    status: string
    createdAt: string
  }
  showBuyer?: boolean
  onStatusChange?: (status: string) => void
  loading?: boolean
  className?: string
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  processing: "bg-purple-100 text-purple-800 border-purple-200",
  shipped: "bg-indigo-100 text-indigo-800 border-indigo-200",
  delivered: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
}

export function OrderCard({
  order,
  showBuyer = false,
  onStatusChange,
  loading = false,
  className,
}: OrderCardProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-20" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Skeleton className="h-16 w-16 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("group flex flex-col h-full overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:border-primary/20", className)}>
      <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
        <div className="flex items-center justify-between gap-2 flex-nowrap">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{order.orderNumber}</p>
              <p className="text-xs text-muted-foreground truncate">
                {format(new Date(order.createdAt), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </div>
          <Badge className={cn("capitalize shadow-sm flex-shrink-0", statusColors[order.status] || "")}>
            {order.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4 flex-1 flex flex-col">
        <div className="space-y-3 mb-4">
          {order.products.slice(0, 3).map((item, index) => (
            <div key={index} className="flex gap-3 items-center">
              <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border/50">
                {item.product.images?.[0] ? (
                  <Image
                    src={
                      (() => {
                        const img = item.product.images[0]
                        return typeof img === "string" ? img : (img as { url?: string })?.url
                      })() || "/placeholder.svg"
                    }
                    alt={item.product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Package className="h-5 w-5 text-muted-foreground/40" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm line-clamp-1">{item.product.name}</p>
                <p className="text-xs text-muted-foreground">
                  Qty: {item.quantity} × <span className="font-medium text-foreground">Rs. {item.priceAtTime}</span>
                </p>
              </div>
            </div>
          ))}
          {order.products.length > 3 && (
            <p className="text-xs text-muted-foreground pl-1">
              +{order.products.length - 3} more items
            </p>
          )}
        </div>

        {showBuyer && order.buyer && (
          <div className="py-3 border-t border-dashed mt-auto">
            <p className="text-sm flex justify-between">
              <span className="text-muted-foreground">Buyer:</span>
              <span className="font-medium">
                {order.buyer.name.first} {order.buyer.name.last}
              </span>
            </p>
          </div>
        )}

        <div className={`flex items-end justify-between pt-3 border-t border-border/50 ${!showBuyer ? 'mt-auto' : ''}`}>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total Amount</p>
            <p className="font-bold text-xl text-primary">Rs. {order.totalAmount.toLocaleString()}</p>
          </div>
          <Button variant="ghost" size="sm" className="group/btn hover:bg-primary/10 hover:text-primary" asChild>
            <Link href={`/dashboard/orders/${order._id}`}>
              View Details
              <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover/btn:translate-x-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Order list wrapper
export function OrderList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-3", className)}>
      {children}
    </div>
  )
}

// Loading skeleton
export function OrderListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <OrderList>
      {Array.from({ length: count }).map((_, i) => (
        <OrderCard key={i} order={{} as OrderCardProps["order"]} loading />
      ))}
    </OrderList>
  )
}
