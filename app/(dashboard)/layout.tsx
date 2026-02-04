"use client"

import React from "react"

import { useState, useEffect, createContext, useContext } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Home,
  Package,
  ShoppingCart,
  Heart,
  Bell,
  UserIcon,
  Settings,
  LogOut,
  Menu,
  ChevronDown,
  Leaf,
  HelpCircle,
  FileText,
  BarChart3,
  MessageSquare,
  Users,
  TrendingUp,
  AlertCircle,
  Star,
  Plus,
  BookOpen,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { fetchWithAuth, apiUrl, clearAuth } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { User as AuthUser } from "@/lib/auth"
import { CartProvider } from "@/contexts/cart-context"
import { WishlistProvider } from "@/contexts/wishlist-context"
import { NavBadge } from "@/components/dashboard/nav-badge"

// Navigation items by role
const getNavItems = (role: string) => {
  const common = [
    { title: "Dashboard", href: "/dashboard", icon: Home },
    { title: "Knowledge Hub", href: "/knowledge-hub", icon: BookOpen },
    { title: "Notifications", href: "/dashboard/notifications", icon: Bell, badge: 3 },
    { title: "Profile", href: "/dashboard/settings/profile", icon: UserIcon },
    { title: "Settings", href: "/dashboard/settings", icon: Settings },
  ]

  // Sidebar links must match existing routes under app/(dashboard)/dashboard/ and app/knowledge-hub/
  const roleSpecific: Record<string, Array<{ title: string; href: string; icon: typeof Home; badge?: number }>> = {
    consumer: [
      { title: "Browse Products", href: "/dashboard/browse-products", icon: Package },
      { title: "Cart", href: "/dashboard/cart", icon: ShoppingCart },
      { title: "My Orders", href: "/dashboard/orders", icon: ShoppingCart },
      { title: "Favorites", href: "/dashboard/favorites", icon: Heart },
      { title: "Price Alerts", href: "/dashboard/market-prices/alerts", icon: AlertCircle },
      { title: "Saved Farms", href: "/dashboard/saved-farms", icon: Users },
    ],
    farmer: [
      { title: "My Products", href: "/dashboard/products", icon: Package },
      { title: "Add Product", href: "/dashboard/products/new", icon: Plus },
      { title: "Orders", href: "/dashboard/orders", icon: ShoppingCart, badge: 5 },
      { title: "Inventory", href: "/dashboard/inventory", icon: BarChart3 },
      { title: "Analytics", href: "/dashboard/analytics", icon: TrendingUp },
      { title: "Reviews", href: "/dashboard/reviews", icon: Star },
    ],
    expert: [
      { title: "Questions", href: "/dashboard/questions", icon: HelpCircle, badge: 12 },
      { title: "My Answers", href: "/dashboard/questions/my", icon: MessageSquare },
      { title: "Articles", href: "/knowledge-hub", icon: FileText },
      { title: "Write Article", href: "/knowledge-hub/write", icon: Plus },
      { title: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    ],
  }

  return {
    main: roleSpecific[role] || [],
    common,
  }
}

import { AuthProvider, useAuth } from "@/contexts/auth-context"

// ... imports ...

// Define a separate component for the inner content to use the hook
function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth()
  const pathname = usePathname()

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <Leaf className="h-8 w-8 text-primary animate-pulse" />
            <span className="text-2xl font-bold text-primary">GreenTrace</span>
          </div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const navItems = getNavItems(user?.role || "consumer")

  return (
    <WishlistProvider>
      <CartProvider>
        <SidebarProvider>
          <Sidebar variant="inset">
            <SidebarHeader>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton size="lg" asChild>
                    <Link href="/">
                      <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Leaf className="size-4" />
                      </div>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">GreenTrace</span>
                        <span className="truncate text-xs capitalize">{user?.role} Dashboard</span>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>
                  {user?.role === "consumer" ? "Shopping" : user?.role === "farmer" ? "Farm Management" : "Advisory"}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navItems.main.map((item) => (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild isActive={pathname === item.href}>
                          <Link href={item.href}>
                            <item.icon className="size-4" />
                            <span>{item.title}</span>
                            <NavBadge title={item.title} badge={item.badge} />
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              <SidebarSeparator />

              <SidebarGroup>
                <SidebarGroupLabel>Account</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navItems.common.map((item) => (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild isActive={pathname === item.href}>
                          <Link href={item.href}>
                            <item.icon className="size-4" />
                            <span>{item.title}</span>
                            {item.badge && (
                              <Badge variant="secondary" className="ml-auto text-xs">
                                {item.badge}
                              </Badge>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
              <SidebarMenu>
                <SidebarMenuItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton
                        size="lg"
                        className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                      >
                        <Avatar className="h-8 w-8 rounded-lg">
                          <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name.first} />
                          <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                            {user?.name.first?.[0]}
                            {user?.name.last?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate font-semibold">
                            {user?.name.first} {user?.name.last}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                        </div>
                        <ChevronDown className="ml-auto size-4" />
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                      side="bottom"
                      align="end"
                      sideOffset={4}
                    >
                      <DropdownMenuLabel className="p-0 font-normal">
                        <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                          <Avatar className="h-8 w-8 rounded-lg">
                            <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name.first} />
                            <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                              {user?.name.first?.[0]}
                              {user?.name.last?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-semibold">
                              {user?.name.first} {user?.name.last}
                            </span>
                            <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                          </div>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/settings/profile">
                          <UserIcon className="mr-2 h-4 w-4" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/settings">
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={logout} className="text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
          </Sidebar>

          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
              <div className="flex flex-1 items-center justify-end gap-2">
                <Button variant="ghost" size="icon" className="relative" asChild>
                  <Link href="/dashboard/notifications">
                    <Bell className="h-5 w-5" />
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
                      3
                    </span>
                  </Link>
                </Button>
              </div>
            </header>
            <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
          </SidebarInset>
        </SidebarProvider>
      </CartProvider>
    </WishlistProvider>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </AuthProvider>
  )
}
