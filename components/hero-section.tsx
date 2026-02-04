"use client"

import Link from "next/link"
import { motion, useScroll, useTransform } from "framer-motion"
import { ArrowRight, Play, CheckCircle2, TrendingUp, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRef } from "react"

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 500], [0, 200])

  return (
    <section ref={containerRef} className="relative min-h-[110vh] flex items-center pt-20 overflow-hidden bg-[#020402]">
      {/* Deep Atmospheric Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-green-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-500/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none" />
        {/* Subtle fog overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background pointer-events-none" />
      </div>

      <div className="container relative z-10 mx-auto px-4 lg:px-8">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-20">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-green-500/20 bg-green-500/5 text-green-400 text-sm font-medium mb-8 backdrop-blur-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Trusted by 50,000+ Farmers Across India
          </motion.div>

          {/* H1 Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1]"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-200 to-amber-200">
              Agriculture,
            </span>{" "}
            <br />
            Reimagined for the Future.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-10 leading-relaxed"
          >
            Connect directly with buyers, access AI-driven crop advisory, and track real-time mandi prices.
            The all-in-one platform for modern farming.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 items-center"
          >
            <Link href="/signup">
              <Button size="lg" className="h-12 px-8 bg-green-600 hover:bg-green-500 text-white rounded-full text-base shadow-[0_0_20px_rgba(22,163,74,0.4)] transition-all hover:scale-105">
                Start Selling Today
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="h-12 px-8 rounded-full text-base border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white bg-black/50 backdrop-blur-sm">
              <Play className="mr-2 h-4 w-4 fill-current" />
              Watch Demo
            </Button>
          </motion.div>
        </div>

        {/* 3D Dashboard Preview */}
        <motion.div
          style={{ y, rotateX: 5 }}
          initial={{ opacity: 0, scale: 0.9, rotateX: 20 }}
          animate={{ opacity: 1, scale: 1, rotateX: 10 }}
          transition={{ duration: 1, delay: 0.4, type: "spring" }}
          className="relative max-w-6xl mx-auto perspective-1000"
        >
          {/* Glow effect behind the dashboard */}
          <div className="absolute inset-0 bg-gradient-to-t from-green-500/20 to-transparent blur-[100px] -z-10" />

          {/* Glass Card Container */}
          <div className="relative rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden group hover:border-green-500/30 transition-colors duration-500">
            {/* Mock Dashboard UI Header */}
            <div className="h-12 border-b border-white/5 bg-white/5 flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/50" />
              </div>
              <div className="ml-4 h-6 w-64 bg-white/5 rounded-full" />
            </div>

            {/* Mock Dashboard Body Image - Replace with real screenshot if available, using placeholder art for now */}
            <div className="aspect-[16/9] relative bg-zinc-950/50 p-6 flex gap-6">
              {/* Sidebar Mock */}
              <div className="w-48 hidden md:flex flex-col gap-4 border-r border-white/5 pr-6">
                <div className="h-8 w-24 bg-green-900/40 rounded mb-4" />
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-4 w-full bg-white/5 rounded" />
                ))}
              </div>

              {/* Main Content Mock */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stat Cards */}
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-32 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/5 p-4 flex flex-col justify-between">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20" />
                    <div className="w-1/2 h-4 bg-white/10 rounded" />
                  </div>
                ))}
                {/* Chart Area */}
                <div className="col-span-1 md:col-span-3 h-64 rounded-xl bg-white/5 border border-white/5 relative overflow-hidden flex items-end px-4 gap-2 pb-4">
                  {[40, 60, 45, 70, 50, 80, 65, 90, 75, 55, 60, 85].map((h, i) => (
                    <div key={i} style={{ height: `${h}%` }} className="flex-1 bg-gradient-to-t from-green-500/40 to-green-400/10 rounded-t-sm" />
                  ))}
                </div>
              </div>
            </div>

            {/* Overlay Gradient for depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Floating Feature Cards (Parallax) */}
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-12 top-20 bg-black/80 backdrop-blur-md border border-green-500/30 p-4 rounded-xl shadow-2xl hidden lg:block"
          >
            <div className="flex items-center gap-3">
              <div className="bg-green-500/20 p-2 rounded-lg"><TrendingUp className="text-green-400 h-5 w-5" /></div>
              <div>
                <p className="text-xs text-zinc-400">Yield Increase</p>
                <p className="text-sm font-bold text-white">+35% vs Last Year</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -left-12 bottom-40 bg-black/80 backdrop-blur-md border border-amber-500/30 p-4 rounded-xl shadow-2xl hidden lg:block"
          >
            <div className="flex items-center gap-3">
              <div className="bg-amber-500/20 p-2 rounded-lg"><ShieldCheck className="text-amber-400 h-5 w-5" /></div>
              <div>
                <p className="text-xs text-zinc-400">Payment Secured</p>
                <p className="text-sm font-bold text-white">Escrow Protected</p>
              </div>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </section>
  )
}
