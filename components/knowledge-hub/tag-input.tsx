"use client"

import { useState, KeyboardEvent } from "react"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface TagInputProps {
  value?: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  maxTags?: number
  suggestions?: string[]
  className?: string
}

export function TagInput({
  value = [],
  onChange,
  placeholder = "Add a tag...",
  maxTags = 10,
  suggestions = [],
  className,
}: TagInputProps) {
  const safeValue = value ?? []
  const [inputValue, setInputValue] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase()
    if (
      trimmedTag &&
      !safeValue.includes(trimmedTag) &&
      safeValue.length < maxTags
    ) {
      onChange([...safeValue, trimmedTag])
      setInputValue("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    onChange(safeValue.filter((tag) => tag !== tagToRemove))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === "Backspace" && !inputValue && safeValue.length > 0) {
      removeTag(safeValue[safeValue.length - 1])
    }
  }

  const filteredSuggestions = suggestions.filter(
    (s) =>
      s.toLowerCase().includes(inputValue.toLowerCase()) &&
      !safeValue.includes(s.toLowerCase())
  )

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-2 p-2 border rounded-lg min-h-[42px] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        {safeValue.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="gap-1 pr-1"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setShowSuggestions(true)
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={safeValue.length < maxTags ? placeholder : ""}
          disabled={safeValue.length >= maxTags}
          className="flex-1 min-w-[120px] border-0 h-7 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && inputValue && filteredSuggestions.length > 0 && (
        <div className="border rounded-lg bg-popover shadow-md p-1 max-h-40 overflow-auto">
          {filteredSuggestions.slice(0, 5).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addTag(suggestion)}
              className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-muted transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {value.length}/{maxTags} tags. Press Enter or comma to add.
      </p>
    </div>
  )
}
