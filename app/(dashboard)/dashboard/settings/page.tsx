"use client"

import Link from "next/link"
import {
  User,
  Lock,
  Bell,
  CreditCard,
  Globe,
  Shield,
  ChevronRight,
  Settings,
  Palette,
  Smartphone,
  Download,
  Trash2,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const settingsLinks = [
  {
    title: "Profile",
    description: "Manage your personal information, avatar, and bio",
    href: "/dashboard/settings/profile",
    icon: User,
    badge: null,
  },
  {
    title: "Security",
    description: "Password, login sessions, and account security",
    href: "/dashboard/settings/security",
    icon: Lock,
    badge: null,
  },
  {
    title: "Notifications",
    description: "Configure how you receive alerts and updates",
    href: "/dashboard/settings/notifications",
    icon: Bell,
    badge: "3 new",
  },
  {
    title: "Privacy",
    description: "Control your data and privacy settings",
    href: "/dashboard/settings/privacy",
    icon: Shield,
    badge: null,
  },
  {
    title: "Appearance",
    description: "Customize theme, language, and display preferences",
    href: "/dashboard/settings/appearance",
    icon: Palette,
    badge: null,
  },
  {
    title: "Connected Devices",
    description: "Manage devices and active sessions",
    href: "/dashboard/settings/devices",
    icon: Smartphone,
    badge: null,
  },
  {
    title: "Data Export",
    description: "Download a copy of your data",
    href: "/dashboard/settings/export",
    icon: Download,
    badge: null,
  },
  {
    title: "Delete Account",
    description: "Permanently delete your account and data",
    href: "/dashboard/settings/delete-account",
    icon: Trash2,
    badge: null,
  },
]

export default function SettingsPage() {
  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2">
        {settingsLinks.map((link) => {
          const isDestructive = link.title === "Delete Account"
          return (
            <Link key={link.href} href={link.href} className="group">
              <Card
                className={`h-full transition-colors hover:bg-muted/50 ${
                  isDestructive ? "border-destructive/30 hover:border-destructive/50" : ""
                }`}
              >
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
                        isDestructive
                          ? "bg-destructive/10 group-hover:bg-destructive/20"
                          : "bg-primary/10 group-hover:bg-primary/20"
                      }`}
                    >
                      <link.icon
                        className={`h-6 w-6 ${isDestructive ? "text-destructive" : "text-primary"}`}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3
                          className={`font-semibold ${isDestructive ? "text-destructive" : ""}`}
                        >
                          {link.title}
                        </h3>
                        {link.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {link.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{link.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
