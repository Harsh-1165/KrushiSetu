"use client"

import Link from "next/link"
import { Leaf, TrendingUp, ShieldCheck, Sparkles, Star } from "lucide-react"
import { motion } from "framer-motion"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex bg-[#020402]">

            {/* ── Left Panel ─────────────────────────────────────────────── */}
            <div className="hidden lg:flex lg:w-[52%] relative h-screen sticky top-0 overflow-hidden">

                {/* Deep atmospheric layer */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#020402] via-[#051205] to-[#020402]" />
                <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-green-500/20 rounded-full blur-[120px]" />
                <div className="absolute top-1/2 -right-20 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[100px]" />
                <div className="absolute -bottom-20 left-1/4 w-[350px] h-[350px] bg-green-600/10 rounded-full blur-[100px]" />
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.04] pointer-events-none" />

                {/* ── Full-height centred content ── */}
                <div className="relative z-10 w-full flex flex-col justify-center px-10 py-10 gap-8">

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5 group w-fit">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/40 to-green-700/20 border border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.3)] group-hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all">
                            <Leaf className="h-5 w-5 text-green-400" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white">GreenTrace</span>
                    </Link>

                    {/* Headline block */}
                    <div>
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.18em] uppercase text-green-400/70 mb-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                            Trusted by 50,000+ Farmers
                        </span>
                        <h2 className="text-[2rem] font-extrabold text-white leading-tight">
                            India&apos;s Smartest<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-300 to-teal-400">
                                Farm-to-Market Platform
                            </span>
                        </h2>
                        <p className="text-zinc-500 text-sm mt-2">AI advisory · Real-time mandi prices · Direct buyer connections</p>
                    </div>

                    {/* Dashboard mockup card + badges */}
                    <div className="relative mx-auto w-full">
                        {/* Ambient glow */}
                        <div className="absolute inset-0 bg-green-500/10 blur-[60px] rounded-2xl scale-95 pointer-events-none" />

                        {/* Floating badge — top right, outside card */}
                        <motion.div
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -top-3 right-4 z-20 flex items-center gap-1.5 bg-zinc-900/95 border border-green-500/40 shadow-[0_0_16px_rgba(34,197,94,0.2)] px-3 py-1.5 rounded-full"
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            <span className="text-[11px] font-semibold text-green-300">Live AI Model</span>
                        </motion.div>

                        {/* Floating badge — bottom right of card */}
                        <motion.div
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                            className="absolute -bottom-3 right-4 z-20 flex items-center gap-2 bg-zinc-900/95 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)] px-2.5 py-2 rounded-xl"
                        >
                            <div className="p-1 bg-amber-500/20 rounded-lg">
                                <TrendingUp className="h-3 w-3 text-amber-400" />
                            </div>
                            <div>
                                <p className="text-[9px] text-zinc-500 leading-none">Yield Increase</p>
                                <p className="text-xs font-bold text-white">+35%</p>
                            </div>
                        </motion.div>

                        {/* Main card */}
                        <div className="relative rounded-2xl border border-white/[0.08] bg-zinc-950/95 shadow-[0_24px_80px_rgba(0,0,0,0.7)] overflow-hidden backdrop-blur-sm">
                            {/* Chrome bar */}
                            <div className="h-8 bg-zinc-900/90 flex items-center px-3 gap-1.5 border-b border-white/5">
                                <div className="w-2 h-2 rounded-full bg-red-400/70" />
                                <div className="w-2 h-2 rounded-full bg-amber-400/70" />
                                <div className="w-2 h-2 rounded-full bg-green-400/70" />
                                <span className="text-[9px] text-zinc-600 ml-2 font-mono tracking-tight">greentrace.ai / dashboard</span>
                            </div>

                            <div className="p-4 space-y-3">
                                {/* Top row */}
                                <div className="flex items-center justify-between">
                                    <div className="h-2.5 w-24 bg-white/10 rounded-full" />
                                    <div className="flex items-center gap-1 text-[9px] font-semibold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                                        <span className="w-1 h-1 rounded-full bg-green-400 inline-block animate-pulse" />
                                        +24% Revenue
                                    </div>
                                </div>

                                {/* 2-col stat cards */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-950 to-green-900/20 border border-green-500/15 p-3">
                                        <div className="absolute -top-4 -right-4 w-14 h-14 bg-green-500/10 rounded-full blur-xl" />
                                        <div className="w-6 h-6 rounded-lg bg-green-500/20 mb-2" />
                                        <div className="h-1.5 w-12 bg-white/15 rounded mb-1" />
                                        <div className="h-1 w-8 bg-white/5 rounded" />
                                    </div>
                                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-950 to-amber-900/20 border border-amber-500/15 p-3">
                                        <div className="absolute -top-4 -right-4 w-14 h-14 bg-amber-500/10 rounded-full blur-xl" />
                                        <div className="w-6 h-6 rounded-lg bg-amber-500/20 mb-2" />
                                        <div className="h-1.5 w-12 bg-white/15 rounded mb-1" />
                                        <div className="h-1 w-8 bg-white/5 rounded" />
                                    </div>
                                </div>

                                {/* Bar chart */}
                                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] h-[60px] flex items-end px-2.5 gap-0.5 pb-2">
                                    {[35, 55, 42, 68, 50, 75, 60, 85, 70, 52, 65, 80].map((h, i) => (
                                        <div key={i} style={{ height: `${h}%` }}
                                            className="flex-1 bg-gradient-to-t from-green-500/80 to-green-400/10 rounded-t-[2px]" />
                                    ))}
                                </div>

                                {/* Status pills */}
                                <div className="flex gap-1.5">
                                    <div className="flex items-center gap-1 text-[9px] text-amber-300 bg-amber-500/8 border border-amber-500/15 px-2 py-0.5 rounded-full">
                                        <span className="w-1 h-1 rounded-full bg-amber-400 inline-block" />Low Stock Alert
                                    </div>
                                    <div className="flex items-center gap-1 text-[9px] text-emerald-300 bg-emerald-500/8 border border-emerald-500/15 px-2 py-0.5 rounded-full">
                                        <Sparkles className="h-2 w-2" />AI Advisory Active
                                    </div>
                                    <div className="flex items-center gap-1 text-[9px] text-blue-300 bg-blue-500/8 border border-blue-500/15 px-2 py-0.5 rounded-full">
                                        <ShieldCheck className="h-2.5 w-2.5" />Secured
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Testimonial — tight below card */}
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-600/50 to-green-900/50 border border-green-500/25 flex items-center justify-center text-sm font-bold text-green-300 shrink-0 shadow-[0_0_12px_rgba(34,197,94,0.2)]">
                            R
                        </div>
                        <div>
                            <p className="text-zinc-400 text-[13px] leading-relaxed italic">
                                &ldquo;GreenTrace completely modernized how we manage our farm.
                                The direct market connection is a game changer.&rdquo;
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-xs font-semibold text-zinc-300">Rajesh Kumar</span>
                                <span className="text-zinc-700 text-xs">·</span>
                                <span className="text-[11px] text-zinc-600">Organic Farmer, Maharashtra</span>
                                <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-2.5 w-2.5 text-amber-400 fill-amber-400" />)}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* ── Right Panel (Form) ─────────────────────────────────────── */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:px-8 min-h-screen">
                <div className="lg:hidden mb-8">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/15 border border-green-500/20">
                            <Leaf className="h-4 w-4 text-green-400" />
                        </div>
                        <span className="text-lg font-bold text-white">GreenTrace</span>
                    </Link>
                </div>
                <div className="w-full max-w-sm">
                    {children}
                </div>
            </div>
        </div>
    )
}
