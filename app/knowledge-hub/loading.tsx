import { Skeleton } from "@/components/ui/skeleton"
import { Leaf, BookOpen } from "lucide-react"

export default function KnowledgeHubLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Leaf className="h-4 w-4" />
            </div>
            <span className="font-semibold">GreenTrace</span>
          </div>
          <Skeleton className="h-8 w-32" />
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-background border-b">
          <div className="container py-12 md:py-16">
            <div className="max-w-3xl mx-auto text-center mb-8">
              <Skeleton className="h-6 w-32 mx-auto mb-4" />
              <Skeleton className="h-10 w-3/4 mx-auto mb-4" />
              <Skeleton className="h-5 w-2/3 mx-auto" />
            </div>
            <div className="max-w-2xl mx-auto">
              <Skeleton className="h-12 w-full rounded-full" />
            </div>
          </div>
        </section>

        {/* Featured Section */}
        <section className="container py-8">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="aspect-[16/10] rounded-lg" />
            ))}
          </div>
        </section>

        {/* Main Content */}
        <section className="container py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              {/* Category Filter */}
              <div className="mb-6">
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-8 w-24 rounded-full" />
                  ))}
                </div>
              </div>

              {/* Articles Grid */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-[16/10] rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="w-full lg:w-80 space-y-6">
              <div className="rounded-lg border bg-card p-5">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="h-16 w-24 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border bg-card p-5">
                <Skeleton className="h-6 w-40 mb-4" />
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-10 w-full rounded-lg" />
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  )
}
