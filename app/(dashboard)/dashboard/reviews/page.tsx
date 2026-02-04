"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

const sampleReviews = [
  {
    rating: 5,
    text: "Excellent quality tomatoes! Fresh and organic. Will order again.",
    author: "Priya S.",
    product: "Organic Tomatoes",
    date: "2 days ago",
  },
  {
    rating: 4,
    text: "Great rice quality. Delivery was a bit delayed but product is good.",
    author: "Rahul K.",
    product: "Basmati Rice",
    date: "1 week ago",
  },
  {
    rating: 5,
    text: "Best potatoes I've ever bought online. Very fresh!",
    author: "Anita M.",
    product: "Fresh Potatoes",
    date: "2 weeks ago",
  },
]

export default function ReviewsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Farm Reviews</h1>
        <p className="text-muted-foreground">
          See what customers are saying about your products.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent reviews</CardTitle>
          <CardDescription>Feedback from your latest customers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sampleReviews.map((review, i) => (
            <div key={i} className="p-3 rounded-lg border">
              <div className="flex items-center gap-1 mb-2">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star
                    key={j}
                    className={cn(
                      "h-3.5 w-3.5",
                      j < review.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    )}
                  />
                ))}
              </div>
              <p className="text-sm font-medium mb-1">{review.product}</p>
              <p className="text-sm text-muted-foreground mb-2">
                &quot;{review.text}&quot;
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{review.author}</span>
                <span>{review.date}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

