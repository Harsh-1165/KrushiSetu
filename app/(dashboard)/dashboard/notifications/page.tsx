"use client"

import { NoNotifications } from "@/components/dashboard/empty-state"

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">
          You&apos;re all caught up. Any new notifications will appear here.
        </p>
      </div>
      <NoNotifications />
    </div>
  )
}

