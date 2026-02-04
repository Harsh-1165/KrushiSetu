import Link from "next/link"
import { ArrowLeft, Leaf, Sprout } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AdvisoryPage() {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
            <div className="absolute top-[-20%] right-[-20%] w-[800px] h-[800px] bg-green-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 text-center space-y-8 p-6 max-w-2xl">
                <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-green-900/20">
                    <Sprout className="w-10 h-10 text-green-500" />
                </div>

                <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                    Crop Advisory
                </h1>

                <p className="text-xl text-zinc-400">
                    Our AI-powered crop advisory system is currently under development. Soon you'll be able to get personalized farming insights.
                </p>

                <div className="flex items-center justify-center gap-4 pt-4">
                    <Link href="/">
                        <Button variant="outline" className="h-12 border-white/10 bg-white/5 hover:bg-white/10 hover:text-white">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back / Home
                        </Button>
                    </Link>
                    <Link href="/knowledge-hub">
                        <Button className="h-12 bg-green-600 hover:bg-green-500 text-white border-none">
                            <Leaf className="mr-2 h-4 w-4" />
                            Visit Knowledge Hub
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
