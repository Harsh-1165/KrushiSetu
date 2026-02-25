"use client"

import React from "react"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { List } from "lucide-react"

interface TocItem {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  contentRef: React.RefObject<HTMLDivElement | null>
}

export function TableOfContents({ contentRef }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>("")

  useEffect(() => {
    if (!contentRef.current) return

    const elements = contentRef.current.querySelectorAll("h2, h3")
    const items: TocItem[] = []

    elements.forEach((element, index) => {
      const id = element.id || `heading-${index}`
      if (!element.id) {
        element.id = id
      }
      items.push({
        id,
        text: element.textContent || "",
        level: element.tagName === "H2" ? 2 : 3,
      })
    })

    setHeadings(items)
  }, [contentRef])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      {
        rootMargin: "-80px 0% -80% 0%",
        threshold: 0,
      }
    )

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id)
      if (element) {
        observer.observe(element)
      }
    })

    return () => observer.disconnect()
  }, [headings])

  const handleClick = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 100
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.scrollY - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      })
    }
  }

  if (headings.length < 2) return null

  return (
    <nav className="rounded-lg border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <List className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Table of Contents</h3>
      </div>
      <ul className="space-y-2">
        {headings.map((heading) => (
          <li
            key={heading.id}
            className={cn(
              heading.level === 3 && "ml-4"
            )}
          >
            <button
              onClick={() => handleClick(heading.id)}
              className={cn(
                "text-sm text-left w-full py-1 px-2 rounded transition-colors hover:bg-muted",
                activeId === heading.id
                  ? "text-primary font-medium bg-primary/5"
                  : "text-muted-foreground"
              )}
            >
              {heading.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
