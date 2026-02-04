"use client"

import { type LucideIcon, Package, ShoppingCart, Heart, HelpCircle, FileText, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon: Icon = Package,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-4">{description}</p>
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  )
}

// Preset empty states
export function NoProducts({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={Package}
      title="No products yet"
      description="Start by adding your first product to your inventory."
      action={onAction ? { label: "Add Product", onClick: onAction } : undefined}
    />
  )
}

export function NoOrders() {
  return (
    <EmptyState
      icon={ShoppingCart}
      title="No orders yet"
      description="Your orders will appear here once customers start purchasing."
    />
  )
}

export function NoFavorites({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={Heart}
      title="No favorites yet"
      description="Browse products and add your favorites to see them here."
      action={onAction ? { label: "Browse Products", onClick: onAction } : undefined}
    />
  )
}

export function NoQuestions() {
  return (
    <EmptyState
      icon={HelpCircle}
      title="No questions to answer"
      description="Check back later for new questions from farmers and consumers."
    />
  )
}

export function NoArticles({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={FileText}
      title="No articles yet"
      description="Share your expertise by writing your first article."
      action={onAction ? { label: "Write Article", onClick: onAction } : undefined}
    />
  )
}

export function NoNotifications() {
  return (
    <EmptyState
      icon={Bell}
      title="No notifications"
      description="You're all caught up! Notifications will appear here."
    />
  )
}
