"use client"

import { Badge } from "@/components/ui/badge"
import { useCart } from "@/contexts/cart-context"

export function NavBadge({ title, badge }: { title: string; badge?: number }) {
    const { count } = useCart()

    // Only override badge for "Cart" item
    if (title === "Cart") {
        if (count === 0) return null
        return (
            <Badge variant="secondary" className="ml-auto text-xs">
                {count}
            </Badge>
        )
    }

    if (badge) {
        return (
            <Badge variant="secondary" className="ml-auto text-xs">
                {badge}
            </Badge>
        )
    }

    return null
}
