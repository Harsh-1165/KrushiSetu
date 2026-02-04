"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { MapPin, Store, ArrowRight, Users } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/dashboard/empty-state"

const MOCK_SAVED_FARMS = [
  { _id: "1", farmName: "Green Valley Farm", farmerName: "Ramesh Kumar", location: "Punjab" },
  { _id: "2", farmName: "Sunrise Organics", farmerName: "Priya Sharma", location: "Haryana" },
  { _id: "3", farmName: "Happy Hens Farm", farmerName: "Vikram Singh", location: "Rajasthan" },
]

export default function SavedFarmsPage() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  const farms = MOCK_SAVED_FARMS

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Saved Farms</h1>
          <p className="text-muted-foreground">
            Farms and sellers you follow. See their products and new listings.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/products">Browse All Products</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : farms.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No saved farms yet"
          description="Browse products and save your favorite farms to see their listings here."
          action={{
            label: "Browse Products",
            onClick: () => window.location.assign("/dashboard/products"),
          }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {farms.map((farm) => (
            <Card key={farm._id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Store className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{farm.farmName}</h3>
                    <p className="text-sm text-muted-foreground">{farm.farmerName}</p>
                    <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span>{farm.location}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button asChild variant="secondary" size="sm" className="w-full">
                  <Link href={`/dashboard/products?farm=${farm._id}`}>
                    View products
                    <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
