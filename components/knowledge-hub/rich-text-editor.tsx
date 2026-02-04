"use client"

import React from "react"

import { useState, useCallback } from "react"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Link2,
  ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Minus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  minHeight?: string
}

interface ToolbarButtonProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  active?: boolean
}

function ToolbarButton({ icon, label, onClick, active }: ToolbarButtonProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8",
              active && "bg-muted text-foreground"
            )}
            onClick={onClick}
            type="button"
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start writing your article...",
  className,
  minHeight = "400px",
}: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [imageAlt, setImageAlt] = useState("")

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value)
  }, [])

  const handleFormat = (tag: string) => {
    execCommand("formatBlock", tag)
  }

  const insertLink = () => {
    if (linkUrl) {
      execCommand("createLink", linkUrl)
      setLinkUrl("")
    }
  }

  const insertImage = () => {
    if (imageUrl) {
      execCommand("insertImage", imageUrl)
      setImageUrl("")
      setImageAlt("")
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData("text/plain")
    document.execCommand("insertText", false, text)
  }

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const content = e.currentTarget.innerHTML
    onChange(content)
  }

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="border-b bg-muted/30 p-2 flex flex-wrap items-center gap-0.5">
        {/* History */}
        <ToolbarButton
          icon={<Undo className="h-4 w-4" />}
          label="Undo"
          onClick={() => execCommand("undo")}
        />
        <ToolbarButton
          icon={<Redo className="h-4 w-4" />}
          label="Redo"
          onClick={() => execCommand("redo")}
        />

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Headings */}
        <ToolbarButton
          icon={<Heading1 className="h-4 w-4" />}
          label="Heading 1"
          onClick={() => handleFormat("h2")}
        />
        <ToolbarButton
          icon={<Heading2 className="h-4 w-4" />}
          label="Heading 2"
          onClick={() => handleFormat("h3")}
        />
        <ToolbarButton
          icon={<Heading3 className="h-4 w-4" />}
          label="Heading 3"
          onClick={() => handleFormat("h4")}
        />

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Text Formatting */}
        <ToolbarButton
          icon={<Bold className="h-4 w-4" />}
          label="Bold (Ctrl+B)"
          onClick={() => execCommand("bold")}
        />
        <ToolbarButton
          icon={<Italic className="h-4 w-4" />}
          label="Italic (Ctrl+I)"
          onClick={() => execCommand("italic")}
        />
        <ToolbarButton
          icon={<Underline className="h-4 w-4" />}
          label="Underline (Ctrl+U)"
          onClick={() => execCommand("underline")}
        />
        <ToolbarButton
          icon={<Strikethrough className="h-4 w-4" />}
          label="Strikethrough"
          onClick={() => execCommand("strikeThrough")}
        />

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Lists */}
        <ToolbarButton
          icon={<List className="h-4 w-4" />}
          label="Bullet List"
          onClick={() => execCommand("insertUnorderedList")}
        />
        <ToolbarButton
          icon={<ListOrdered className="h-4 w-4" />}
          label="Numbered List"
          onClick={() => execCommand("insertOrderedList")}
        />

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Block Elements */}
        <ToolbarButton
          icon={<Quote className="h-4 w-4" />}
          label="Quote"
          onClick={() => handleFormat("blockquote")}
        />
        <ToolbarButton
          icon={<Code className="h-4 w-4" />}
          label="Code Block"
          onClick={() => handleFormat("pre")}
        />
        <ToolbarButton
          icon={<Minus className="h-4 w-4" />}
          label="Horizontal Rule"
          onClick={() => execCommand("insertHorizontalRule")}
        />

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Alignment */}
        <ToolbarButton
          icon={<AlignLeft className="h-4 w-4" />}
          label="Align Left"
          onClick={() => execCommand("justifyLeft")}
        />
        <ToolbarButton
          icon={<AlignCenter className="h-4 w-4" />}
          label="Align Center"
          onClick={() => execCommand("justifyCenter")}
        />
        <ToolbarButton
          icon={<AlignRight className="h-4 w-4" />}
          label="Align Right"
          onClick={() => execCommand("justifyRight")}
        />

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Link */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" type="button">
              <Link2 className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="link-url">Link URL</Label>
                <Input
                  id="link-url"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                />
              </div>
              <Button onClick={insertLink} className="w-full" size="sm">
                Insert Link
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Image */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" type="button">
              <ImageIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image-url">Image URL</Label>
                <Input
                  id="image-url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image-alt">Alt Text</Label>
                <Input
                  id="image-alt"
                  placeholder="Image description"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                />
              </div>
              <Button onClick={insertImage} className="w-full" size="sm">
                Insert Image
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Editor Content */}
      <div
        contentEditable
        suppressContentEditableWarning
        className={cn(
          "p-4 outline-none overflow-auto",
          "prose prose-sm dark:prose-invert max-w-none",
          "prose-headings:font-bold",
          "prose-h2:text-2xl prose-h2:mt-6 prose-h2:mb-3",
          "prose-h3:text-xl prose-h3:mt-5 prose-h3:mb-2",
          "prose-h4:text-lg prose-h4:mt-4 prose-h4:mb-2",
          "prose-p:my-2",
          "prose-blockquote:border-l-primary prose-blockquote:bg-muted/30 prose-blockquote:py-1 prose-blockquote:px-4",
          "prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded",
          "prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-lg",
          "[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted-foreground"
        )}
        style={{ minHeight }}
        onInput={handleInput}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </div>
  )
}
