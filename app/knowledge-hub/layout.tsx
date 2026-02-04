import React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Knowledge Hub | GreenTrace",
  description: "Explore agricultural knowledge, farming guides, and expert articles to improve your farming practices.",
}

export default function KnowledgeHubLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
