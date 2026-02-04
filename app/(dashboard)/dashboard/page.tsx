"use client"

import { useUser } from "@/contexts/auth-context"
import { ConsumerDashboard } from "@/components/dashboard/consumer-dashboard"
import { FarmerDashboard } from "@/components/dashboard/farmer-dashboard"
import { ExpertDashboard } from "@/components/dashboard/expert-dashboard"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardPage() {
  const { user, loading } = useUser()

  if (loading || !user) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-96 w-full rounded-lg" />
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  switch (user.role) {
    case "consumer":
      return <ConsumerDashboard user={user} />
    case "farmer":
      return <FarmerDashboard user={user} />
    case "expert":
      return <ExpertDashboard user={user} />
    default:
      return <ConsumerDashboard user={user} />
  }
}
