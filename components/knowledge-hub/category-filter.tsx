"use client"

import React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  Sprout,
  Bug,
  Layers,
  Droplet,
  Leaf,
  TrendingUp,
  Building,
  Cpu,
  Cloud,
  Award,
} from "lucide-react"

const categoryIcons: Record<string, React.ReactNode> = {
  "crop-management": <Sprout className="h-4 w-4" />,
  "pest-control": <Bug className="h-4 w-4" />,
  "soil-health": <Layers className="h-4 w-4" />,
  irrigation: <Droplet className="h-4 w-4" />,
  "organic-farming": <Leaf className="h-4 w-4" />,
  "market-insights": <TrendingUp className="h-4 w-4" />,
  "government-schemes": <Building className="h-4 w-4" />,
  technology: <Cpu className="h-4 w-4" />,
  "weather-advisory": <Cloud className="h-4 w-4" />,
  "success-stories": <Award className="h-4 w-4" />,
}

interface Category {
  id: string
  name: string
  articleCount?: number
}

interface CategoryFilterProps {
  categories: Category[]
  selectedCategory: string | null
  onCategoryChange: (categoryId: string | null) => void
}

export function CategoryFilter({
  categories,
  selectedCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-2 pb-2">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryChange(null)}
          className="flex-shrink-0"
        >
          All Articles
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => onCategoryChange(category.id)}
            className={cn(
              "flex-shrink-0 gap-1.5",
              selectedCategory === category.id && "bg-primary text-primary-foreground"
            )}
          >
            {categoryIcons[category.id]}
            {category.name}
            {category.articleCount !== undefined && (
              <span className="ml-1 text-xs opacity-70">({category.articleCount})</span>
            )}
          </Button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
