import type React from "react"
import Link from "next/link"
import { Leaf } from "lucide-react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex bg-black text-white selection:bg-green-500/30">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[#020402]" />
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-green-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-900/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      </div>

      {/* Left Side - Branding & 3D Visuals */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12 z-10">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 relative z-20 w-fit">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/20 border border-green-500/30 backdrop-blur-sm">
            <Leaf className="h-6 w-6 text-green-400" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">GreenTrace</span>
        </Link>

        {/* 3D Tilted Card Preview */}
        <div className="absolute inset-0 flex items-center justify-center z-0 perspective-[2000px]">
          {/* Abstract Glowing Orbs */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-500/20 rounded-full blur-[100px] animate-pulse" />

          {/* Tilted Card */}
          <div
            className="relative w-[500px] h-[350px] bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl transform rotate-y-[-12deg] rotate-x-[5deg] translate-x-[50px] overflow-hidden"
            style={{
              transformStyle: 'preserve-3d',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Mock UI Header */}
            <div className="h-10 border-b border-white/10 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-green-500/50" />
            </div>
            {/* Mock UI Content */}
            <div className="p-6 grid gap-4">
              <div className="h-8 w-1/3 bg-white/10 rounded animate-pulse" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-24 bg-green-500/10 rounded-lg border border-green-500/20 p-4">
                  <div className="w-8 h-8 bg-green-500/20 rounded mb-2" />
                  <div className="w-16 h-2 bg-white/20 rounded" />
                </div>
                <div className="h-24 bg-amber-500/10 rounded-lg border border-amber-500/20 p-4">
                  <div className="w-8 h-8 bg-amber-500/20 rounded mb-2" />
                  <div className="w-16 h-2 bg-white/20 rounded" />
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -right-8 top-12 p-3 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 shadow-xl transform translate-z-[50px]">
              <div className="text-xs font-medium text-green-400">+24% Revenue</div>
            </div>
            <div className="absolute -left-4 bottom-8 p-3 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 shadow-xl transform translate-z-[30px]">
              <div className="text-xs font-medium text-amber-400">Low Stock Alert</div>
            </div>
          </div>
        </div>

        {/* Bottom Text */}
        <div className="relative z-20 max-w-lg">
          <blockquote className="space-y-2">
            <p className="text-lg text-zinc-300">
              &ldquo;GreenTrace has completely modernized how we manage our farm. The direct connection to the market is a game changer.&rdquo;
            </p>
            <footer className="text-sm font-medium text-zinc-500">
              — Rajesh Kumar, Organic Farmer
            </footer>
          </blockquote>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 z-10 relative">
        <div className="w-full max-w-[400px]">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-12 flex justify-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/20 border border-green-500/30">
                <Leaf className="h-6 w-6 text-green-400" />
              </div>
              <span className="text-2xl font-bold text-white">GreenTrace</span>
            </Link>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
