import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "GreenTrace - Agricultural Marketplace",
  description:
    "Connect with farmers, get expert crop advice, track real-time market prices, and access agricultural knowledge. Your trusted agricultural marketplace.",
  keywords: ["agriculture", "farming", "marketplace", "crop advisory", "mandi prices", "organic produce"],
  authors: [{ name: "GreenTrace" }],
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/placeholder-logo.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/placeholder-logo.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/placeholder-logo.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/placeholder-logo.png",
  },
  openGraph: {
    title: "GreenTrace - Agricultural Marketplace",
    description: "Connect with farmers, get expert crop advice, and access real-time market prices.",
    type: "website",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#22c55e" },
    { media: "(prefers-color-scheme: dark)", color: "#16a34a" },
  ],
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
