"use client"

import React from "react"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  RefreshCw,
  Plus,
  Bell,
  BellOff,
  Trash2,
  Edit2,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  AlertCircle,
  Clock,
  Mail,
  MessageSquare,
  Smartphone,
  Filter,
  MoreVertical,
  Target,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Suspense } from "react"

import {
  alertApi,
  type PriceAlert,
  COMMON_CROPS,
  INDIAN_STATES,
  formatPrice,
  formatDate,
  getConditionLabel,
  getPriceTypeLabel,
} from "@/lib/market-api"

interface AlertFormData {
  crop: string
  variety?: string
  state?: string
  condition: "above" | "below" | "equals"
  targetPrice: number
  priceType: "modal" | "min" | "max"
  notifyVia: Array<"email" | "sms" | "push">
  expiresAt?: string
  notes?: string
}

function AlertSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-4">
            <div className="flex items-start gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function AlertCard({
  alert,
  onEdit,
  onDelete,
  onToggle,
}: {
  alert: PriceAlert & { currentPrice?: { modalPrice: number; minPrice: number; maxPrice: number }; distanceFromTarget?: { percentage: number; status: string } }
  onEdit: () => void
  onDelete: () => void
  onToggle: () => void
}) {
  const isExpired = new Date(alert.expiresAt) < new Date()
  const isTriggered = !!alert.triggeredAt
  const status = isExpired ? "expired" : isTriggered ? "triggered" : alert.isActive ? "active" : "inactive"

  const statusConfig = {
    active: {
      icon: Bell,
      color: "text-green-600",
      bg: "bg-green-100 dark:bg-green-900/30",
      badge: "default" as const,
      label: "Active",
    },
    triggered: {
      icon: CheckCircle,
      color: "text-blue-600",
      bg: "bg-blue-100 dark:bg-blue-900/30",
      badge: "secondary" as const,
      label: "Triggered",
    },
    expired: {
      icon: Clock,
      color: "text-gray-500",
      bg: "bg-gray-100 dark:bg-gray-900/30",
      badge: "outline" as const,
      label: "Expired",
    },
    inactive: {
      icon: BellOff,
      color: "text-gray-400",
      bg: "bg-gray-100 dark:bg-gray-900/30",
      badge: "outline" as const,
      label: "Inactive",
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  const currentPrice = alert.currentPrice
    ? alert.priceType === "min"
      ? alert.currentPrice.minPrice
      : alert.priceType === "max"
      ? alert.currentPrice.maxPrice
      : alert.currentPrice.modalPrice
    : null

  const progressToTarget = currentPrice
    ? Math.min(100, Math.max(0, (currentPrice / alert.targetPrice) * 100))
    : 0

  return (
    <Card className={cn("transition-opacity", !alert.isActive && "opacity-60")}>
      <CardContent className="pt-4">
        <div className="flex items-start gap-4">
          <div className={cn("p-2.5 rounded-full", config.bg)}>
            <Icon className={cn("h-5 w-5", config.color)} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{alert.crop}</h3>
                  {alert.variety && (
                    <span className="text-sm text-muted-foreground">({alert.variety})</span>
                  )}
                  <Badge variant={config.badge}>{config.label}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Alert when {getPriceTypeLabel(alert.priceType).toLowerCase()}{" "}
                  <span className="font-medium">{getConditionLabel(alert.condition)}</span>{" "}
                  <span className="font-semibold text-foreground">{formatPrice(alert.targetPrice)}</span>
                  {alert.state && <span> in {alert.state}</span>}
                </p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Alert
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onToggle}>
                    {alert.isActive ? (
                      <>
                        <BellOff className="h-4 w-4 mr-2" />
                        Disable Alert
                      </>
                    ) : (
                      <>
                        <Bell className="h-4 w-4 mr-2" />
                        Enable Alert
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Alert
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Current Price Progress */}
            {currentPrice !== null && status === "active" && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Current: {formatPrice(currentPrice)}</span>
                  <span className={cn(
                    "font-medium",
                    alert.distanceFromTarget?.status === "triggered" ? "text-green-600" : "text-muted-foreground"
                  )}>
                    {alert.distanceFromTarget?.percentage !== undefined
                      ? `${alert.distanceFromTarget.percentage > 0 ? "+" : ""}${alert.distanceFromTarget.percentage.toFixed(1)}%`
                      : ""}
                  </span>
                </div>
                <Progress value={progressToTarget} className="h-2" />
              </div>
            )}

            {/* Triggered Info */}
            {isTriggered && alert.triggeredPrice && (
              <div className="mt-3 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Triggered at {formatPrice(alert.triggeredPrice)} on {formatDate(alert.triggeredAt!)}
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {alert.notifyVia.includes("email") && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Mail className="h-3 w-3" />
                    Email
                  </Badge>
                )}
                {alert.notifyVia.includes("sms") && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <MessageSquare className="h-3 w-3" />
                    SMS
                  </Badge>
                )}
                {alert.notifyVia.includes("push") && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Smartphone className="h-3 w-3" />
                    Push
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                Expires: {formatDate(alert.expiresAt)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function CreateAlertDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isEditing,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: AlertFormData) => Promise<void>
  initialData?: Partial<AlertFormData>
  isEditing?: boolean
}) {
  const [formData, setFormData] = useState<AlertFormData>({
    crop: initialData?.crop || "",
    variety: initialData?.variety || "",
    state: initialData?.state || "",
    condition: initialData?.condition || "below",
    targetPrice: initialData?.targetPrice || 0,
    priceType: initialData?.priceType || "modal",
    notifyVia: initialData?.notifyVia || ["email", "push"],
    expiresAt: initialData?.expiresAt || "",
    notes: initialData?.notes || "",
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (initialData) {
      setFormData({
        crop: initialData.crop || "",
        variety: initialData.variety || "",
        state: initialData.state || "",
        condition: initialData.condition || "below",
        targetPrice: initialData.targetPrice || 0,
        priceType: initialData.priceType || "modal",
        notifyVia: initialData.notifyVia || ["email", "push"],
        expiresAt: initialData.expiresAt || "",
        notes: initialData.notes || "",
      })
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.crop || !formData.targetPrice) {
      toast.error("Please fill in required fields")
      return
    }

    setSubmitting(true)
    try {
      await onSubmit(formData)
      onOpenChange(false)
    } catch {
      toast.error("Failed to save alert")
    } finally {
      setSubmitting(false)
    }
  }

  const toggleNotifyVia = (method: "email" | "sms" | "push") => {
    setFormData((prev) => ({
      ...prev,
      notifyVia: prev.notifyVia.includes(method)
        ? prev.notifyVia.filter((m) => m !== method)
        : [...prev.notifyVia, method],
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Alert" : "Create Price Alert"}</DialogTitle>
          <DialogDescription>
            Get notified when prices reach your target
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="crop">Crop *</Label>
              <Select
                value={formData.crop}
                onValueChange={(v) => setFormData({ ...formData, crop: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select crop" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_CROPS.slice(0, 30).map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="variety">Variety (optional)</Label>
              <Input
                id="variety"
                value={formData.variety}
                onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                placeholder="e.g., Basmati"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">State (optional)</Label>
            <Select
              value={formData.state}
              onValueChange={(v) => setFormData({ ...formData, state: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All India" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All India</SelectItem>
                {INDIAN_STATES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <Select
                value={formData.condition}
                onValueChange={(v) => setFormData({ ...formData, condition: v as AlertFormData["condition"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="above">Goes Above</SelectItem>
                  <SelectItem value="below">Goes Below</SelectItem>
                  <SelectItem value="equals">Reaches</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetPrice">Target Price *</Label>
              <Input
                id="targetPrice"
                type="number"
                value={formData.targetPrice || ""}
                onChange={(e) => setFormData({ ...formData, targetPrice: Number(e.target.value) })}
                placeholder="e.g., 2500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priceType">Price Type</Label>
              <Select
                value={formData.priceType}
                onValueChange={(v) => setFormData({ ...formData, priceType: v as AlertFormData["priceType"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="modal">Modal</SelectItem>
                  <SelectItem value="min">Minimum</SelectItem>
                  <SelectItem value="max">Maximum</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notify Via</Label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="email"
                  checked={formData.notifyVia.includes("email")}
                  onCheckedChange={() => toggleNotifyVia("email")}
                />
                <Label htmlFor="email" className="text-sm cursor-pointer">Email</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="sms"
                  checked={formData.notifyVia.includes("sms")}
                  onCheckedChange={() => toggleNotifyVia("sms")}
                />
                <Label htmlFor="sms" className="text-sm cursor-pointer">SMS</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="push"
                  checked={formData.notifyVia.includes("push")}
                  onCheckedChange={() => toggleNotifyVia("push")}
                />
                <Label htmlFor="push" className="text-sm cursor-pointer">Push</Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiresAt">Expires On</Label>
            <Input
              id="expiresAt"
              type="date"
              value={formData.expiresAt?.split("T")[0] || ""}
              onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any notes for this alert..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : isEditing ? "Save Changes" : "Create Alert"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Loading() {
  return null
}

export default function PriceAlertsPage() {
  const router = useRouter()

  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<"all" | "active" | "triggered" | "expired">("all")
  const [createOpen, setCreateOpen] = useState(false)
  const [editingAlert, setEditingAlert] = useState<PriceAlert | null>(null)
  const [deleteAlert, setDeleteAlert] = useState<PriceAlert | null>(null)

  const fetchAlerts = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true)
      else setLoading(true)

      const response = await alertApi.getAll({ status: filter === "all" ? undefined : filter })
      setAlerts(response.data)
    } catch (error) {
      console.log("[v0] Error fetching alerts:", error)
      // Generate mock data
      const mockAlerts = generateMockAlerts()
      setAlerts(mockAlerts)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [filter])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  const handleCreateAlert = async (data: AlertFormData) => {
    try {
      await alertApi.create({
        ...data,
        expiresAt: data.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      toast.success("Alert created successfully")
      fetchAlerts()
    } catch {
      // For demo, just add to local state
      const newAlert: PriceAlert = {
        _id: `alert-${Date.now()}`,
        user: "user-1",
        crop: data.crop,
        variety: data.variety,
        state: data.state,
        condition: data.condition,
        targetPrice: data.targetPrice,
        priceType: data.priceType,
        notifyVia: data.notifyVia,
        frequency: "once",
        isActive: true,
        expiresAt: data.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        triggerCount: 0,
        notes: data.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setAlerts([newAlert, ...alerts])
      toast.success("Alert created successfully")
    }
  }

  const handleUpdateAlert = async (data: AlertFormData) => {
    if (!editingAlert) return

    try {
      await alertApi.update(editingAlert._id, {
        targetPrice: data.targetPrice,
        condition: data.condition,
        priceType: data.priceType,
        notifyVia: data.notifyVia,
        expiresAt: data.expiresAt,
        notes: data.notes,
      })
      toast.success("Alert updated successfully")
      fetchAlerts()
    } catch {
      // For demo, update in local state
      setAlerts(alerts.map(a => 
        a._id === editingAlert._id 
          ? { ...a, ...data, updatedAt: new Date().toISOString() }
          : a
      ))
      toast.success("Alert updated successfully")
    }
    setEditingAlert(null)
  }

  const handleToggleAlert = async (alert: PriceAlert) => {
    try {
      await alertApi.update(alert._id, { isActive: !alert.isActive })
      toast.success(alert.isActive ? "Alert disabled" : "Alert enabled")
      fetchAlerts()
    } catch {
      // For demo, toggle in local state
      setAlerts(alerts.map(a => 
        a._id === alert._id 
          ? { ...a, isActive: !a.isActive }
          : a
      ))
      toast.success(alert.isActive ? "Alert disabled" : "Alert enabled")
    }
  }

  const handleDeleteAlert = async () => {
    if (!deleteAlert) return

    try {
      await alertApi.delete(deleteAlert._id)
      toast.success("Alert deleted successfully")
      fetchAlerts()
    } catch {
      // For demo, remove from local state
      setAlerts(alerts.filter(a => a._id !== deleteAlert._id))
      toast.success("Alert deleted successfully")
    }
    setDeleteAlert(null)
  }

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === "all") return true
    const isExpired = new Date(alert.expiresAt) < new Date()
    const isTriggered = !!alert.triggeredAt
    
    if (filter === "active") return alert.isActive && !isExpired && !isTriggered
    if (filter === "triggered") return isTriggered
    if (filter === "expired") return isExpired || !alert.isActive
    return true
  })

  const stats = {
    total: alerts.length,
    active: alerts.filter(a => a.isActive && new Date(a.expiresAt) > new Date() && !a.triggeredAt).length,
    triggered: alerts.filter(a => a.triggeredAt).length,
    expired: alerts.filter(a => new Date(a.expiresAt) < new Date() || !a.isActive).length,
  }

  return (
    <Suspense fallback={<Loading />}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard/market-prices">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Price Alerts</h1>
              <p className="text-muted-foreground">
                Manage your price notifications
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchAlerts(true)} disabled={refreshing}>
              <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Alert
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Bell className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                  <Bell className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-xl font-bold text-green-600">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Triggered</p>
                  <p className="text-xl font-bold text-blue-600">{stats.triggered}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-900/30">
                  <Clock className="h-4 w-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expired</p>
                  <p className="text-xl font-bold text-gray-500">{stats.expired}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="active">Active ({stats.active})</TabsTrigger>
            <TabsTrigger value="triggered">Triggered ({stats.triggered})</TabsTrigger>
            <TabsTrigger value="expired">Expired ({stats.expired})</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Alerts List */}
        {loading ? (
          <AlertSkeleton />
        ) : filteredAlerts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No alerts found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {filter === "all"
                  ? "Create your first price alert to get notified when prices change"
                  : `No ${filter} alerts at the moment`}
              </p>
              {filter === "all" && (
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Alert
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <AlertCard
                key={alert._id}
                alert={alert as PriceAlert & { currentPrice?: { modalPrice: number; minPrice: number; maxPrice: number }; distanceFromTarget?: { percentage: number; status: string } }}
                onEdit={() => setEditingAlert(alert)}
                onDelete={() => setDeleteAlert(alert)}
                onToggle={() => handleToggleAlert(alert)}
              />
            ))}
          </div>
        )}

        {/* Create Alert Dialog */}
        <CreateAlertDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onSubmit={handleCreateAlert}
        />

        {/* Edit Alert Dialog */}
        <CreateAlertDialog
          open={!!editingAlert}
          onOpenChange={(open) => !open && setEditingAlert(null)}
          onSubmit={handleUpdateAlert}
          initialData={editingAlert || undefined}
          isEditing
        />

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteAlert} onOpenChange={(open) => !open && setDeleteAlert(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Alert</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this alert for {deleteAlert?.crop}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAlert} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Suspense>
  )
}

// Generate mock alerts
function generateMockAlerts(): PriceAlert[] {
  const crops = ["Rice", "Wheat", "Onion", "Tomato", "Potato"]
  const alerts: PriceAlert[] = []

  for (let i = 0; i < 5; i++) {
    const isTriggered = Math.random() > 0.7
    const isExpired = Math.random() > 0.8
    const targetPrice = Math.floor(Math.random() * 3000) + 1000
    const currentPrice = targetPrice + (Math.random() - 0.5) * 500

    alerts.push({
      _id: `alert-${i}`,
      user: "user-1",
      crop: crops[i % crops.length],
      variety: i % 2 === 0 ? "Basmati" : undefined,
      state: i % 3 === 0 ? INDIAN_STATES[i % INDIAN_STATES.length] : undefined,
      condition: ["above", "below", "equals"][i % 3] as PriceAlert["condition"],
      targetPrice,
      priceType: ["modal", "min", "max"][i % 3] as PriceAlert["priceType"],
      notifyVia: ["email", "push"] as Array<"email" | "sms" | "push">,
      frequency: "once",
      isActive: !isExpired,
      expiresAt: isExpired
        ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      triggeredAt: isTriggered ? new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      triggeredPrice: isTriggered ? targetPrice + (Math.random() - 0.5) * 100 : undefined,
      triggerCount: isTriggered ? 1 : 0,
      currentPrice: {
        modalPrice: currentPrice,
        minPrice: currentPrice * 0.9,
        maxPrice: currentPrice * 1.1,
        priceDate: new Date().toISOString(),
      } as never,
      distanceFromTarget: {
        currentPrice,
        targetPrice,
        difference: currentPrice - targetPrice,
        percentage: ((currentPrice - targetPrice) / targetPrice) * 100,
        status: Math.abs(currentPrice - targetPrice) < 100 ? "triggered" : "pending",
      } as never,
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  return alerts
}
