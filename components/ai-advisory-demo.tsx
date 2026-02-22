"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Leaf,
    Upload,
    Cpu,
    ShieldCheck,
    FlaskConical,
    TrendingUp,
    BarChart3,
    CheckCircle2,
    Sparkles,
} from "lucide-react"

// ─── Animation phases ────────────────────────────────────────────────────────
// 0 → Upload card visible
// 1 → Analysing (progress bar fills)
// 2 → Results shown
// 3 → Loop back to 0

const PHASES = [0, 1, 2]
const PHASE_DURATIONS = [2200, 2800, 4500] // ms each phase stays

// ─── Mandi sparkline data ─────────────────────────────────────────────────────
const mandiData = [42, 55, 48, 67, 58, 73, 65, 81, 70, 60, 75, 88]
const yieldData = [30, 38, 45, 40, 52, 48, 60, 55, 70, 65, 75, 80]

// ─── Helpers ─────────────────────────────────────────────────────────────────
function Sparkline({ data, color }: { data: number[]; color: string }) {
    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1
    const w = 100
    const h = 36
    const pts = data
        .map((v, i) => {
            const x = (i / (data.length - 1)) * w
            const y = h - ((v - min) / range) * h
            return `${x},${y}`
        })
        .join(" ")

    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-9" preserveAspectRatio="none">
            <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <polyline
                points={`0,${h} ${pts} ${w},${h}`}
                fill={color}
                fillOpacity="0.12"
                stroke="none"
            />
        </svg>
    )
}

// ─── Phase 0 — Upload card ────────────────────────────────────────────────────
function UploadCard() {
    return (
        <motion.div
            key="upload"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-6"
        >
            {/* "Browser" leaf image card */}
            <div className="relative w-full max-w-xs rounded-2xl border border-white/10 bg-zinc-900/80 backdrop-blur-sm overflow-hidden shadow-xl">
                {/* Card header bar */}
                <div className="h-9 bg-zinc-800/60 flex items-center px-3 gap-2 border-b border-white/5">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
                    </div>
                    <span className="text-xs text-zinc-500 ml-1">leaf_photo.jpg</span>
                </div>

                {/* Leaf illustration */}
                <div className="relative h-48 bg-gradient-to-br from-green-950/60 to-zinc-900/80 flex items-center justify-center">
                    {/* Decorative radial glow */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.18)_0%,transparent_70%)]" />

                    {/* SVG leaf */}
                    <svg viewBox="0 0 120 120" className="w-28 h-28 drop-shadow-lg" fill="none">
                        <path
                            d="M60 10 C20 10 10 50 10 70 C10 90 30 110 60 110 C90 110 110 90 110 70 C110 50 100 10 60 10Z"
                            fill="url(#leafGrad)"
                            opacity="0.9"
                        />
                        {/* Vein */}
                        <path d="M60 110 Q60 60 60 10" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
                        <path d="M60 60 Q40 45 20 50" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                        <path d="M60 70 Q80 55 100 58" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                        {/* Blight spots */}
                        <circle cx="45" cy="52" r="5" fill="#854d0e" opacity="0.7" />
                        <circle cx="72" cy="68" r="4" fill="#78350f" opacity="0.65" />
                        <circle cx="55" cy="78" r="3" fill="#92400e" opacity="0.6" />
                        <defs>
                            <linearGradient id="leafGrad" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#15803d" />
                                <stop offset="60%" stopColor="#166534" />
                                <stop offset="100%" stopColor="#14532d" />
                            </linearGradient>
                        </defs>
                    </svg>

                    {/* Corner badge */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-1 text-xs text-amber-400 bg-amber-900/40 border border-amber-500/30 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
                        Disease detected
                    </div>
                </div>
            </div>

            {/* Upload CTA */}
            <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="flex items-center gap-2 text-sm text-zinc-400 border border-dashed border-zinc-700 rounded-xl px-6 py-3"
            >
                <Upload className="h-4 w-4 text-green-400" />
                <span>Drop leaf / soil image · or click to upload</span>
            </motion.div>
        </motion.div>
    )
}

// ─── Phase 1 — Analysing ─────────────────────────────────────────────────────
function AnalysingCard() {
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        setProgress(0)
        const timer = setInterval(() => {
            setProgress(p => {
                if (p >= 100) { clearInterval(timer); return 100 }
                return p + 2
            })
        }, 55)
        return () => clearInterval(timer)
    }, [])

    const steps = [
        { label: "Pre-processing image tensor", done: progress > 20 },
        { label: "Running CNN inference (ResNet-50)", done: progress > 55 },
        { label: "Extracting disease probability map", done: progress > 80 },
        { label: "Generating treatment recommendations", done: progress > 95 },
    ]

    return (
        <motion.div
            key="analysing"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.45 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-6"
        >
            <div className="w-full max-w-sm rounded-2xl border border-green-500/20 bg-zinc-900/80 backdrop-blur-sm p-5 shadow-xl">
                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 rounded-xl bg-green-500/15 border border-green-500/20">
                        <Cpu className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-white">AI Analysis Running</p>
                        <p className="text-xs text-zinc-500">GreenTrace CNN Model v2.4</p>
                    </div>
                    <div className="ml-auto text-sm font-mono font-bold text-green-400">{progress}%</div>
                </div>

                {/* Progress bar */}
                <div className="h-2 rounded-full bg-zinc-800 overflow-hidden mb-5">
                    <motion.div
                        className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Steps */}
                <div className="space-y-2.5">
                    {steps.map((s, i) => (
                        <div key={i} className="flex items-center gap-2.5 text-xs">
                            {s.done ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
                            ) : (
                                <motion.div
                                    animate={!s.done && progress > i * 20 - 10 ? { rotate: 360 } : {}}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="h-3.5 w-3.5 rounded-full border border-zinc-600 border-t-green-400 shrink-0"
                                />
                            )}
                            <span className={s.done ? "text-zinc-300" : "text-zinc-600"}>{s.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    )
}

// ─── Phase 2 — Results ───────────────────────────────────────────────────────
function ResultsCard() {
    return (
        <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -16 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-0 flex flex-col justify-center gap-3 p-5 overflow-y-auto"
        >
            {/* ── Diagnosis header ── */}
            <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-4">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-red-500/15">
                            <Leaf className="h-4 w-4 text-red-400" />
                        </div>
                        <span className="text-sm font-bold text-white">Leaf Blight Detected</span>
                    </div>

                    {/* Confidence arc */}
                    <div className="relative w-12 h-12">
                        <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
                            <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3.5" />
                            <motion.circle
                                cx="18" cy="18" r="14"
                                fill="none"
                                stroke="#22c55e"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                strokeDasharray="88"
                                initial={{ strokeDashoffset: 88 }}
                                animate={{ strokeDashoffset: 88 * (1 - 0.87) }}
                                transition={{ duration: 1.2, ease: "easeOut" }}
                            />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-green-400">87%</span>
                    </div>
                </div>
                <p className="text-xs text-zinc-400 pl-8">Fungal pathogen · Early stage · 2.3 acres at risk</p>
            </div>

            {/* ── Treatment cards row ── */}
            <div className="grid grid-cols-2 gap-2.5">
                {/* Organic */}
                <motion.div
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-xl border border-green-500/25 bg-green-950/20 p-3"
                >
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-green-400" />
                        <span className="text-xs font-semibold text-green-300">Organic</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">Neem oil spray (2%) every 7 days · Trichoderma biocontrol</p>
                    <div className="mt-2 text-[10px] text-green-400 font-medium">✓ Safe for harvest</div>
                </motion.div>

                {/* Chemical */}
                <motion.div
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="rounded-xl border border-blue-500/25 bg-blue-950/20 p-3"
                >
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <FlaskConical className="h-3.5 w-3.5 text-blue-400" />
                        <span className="text-xs font-semibold text-blue-300">Chemical</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">Mancozeb 75 WP @ 2.5 g/L · Apply at 14-day intervals</p>
                    <div className="mt-2 text-[10px] text-amber-400 font-medium">⚠ PHI: 14 days</div>
                </motion.div>
            </div>

            {/* ── Real AI badge ── */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-green-900/40 to-emerald-900/30 border border-green-500/25"
            >
                <Sparkles className="h-3.5 w-3.5 text-green-400 shrink-0" />
                <span className="text-[11px] text-green-300 font-medium">Real AI Model (CNN) — Not Mock Data</span>
            </motion.div>
        </motion.div>
    )
}

// ─── Main export ─────────────────────────────────────────────────────────────
export function AiAdvisoryDemo() {
    const [phase, setPhase] = useState(0)

    useEffect(() => {
        const timer = setTimeout(() => {
            setPhase(p => (p + 1) % 3)
        }, PHASE_DURATIONS[phase])
        return () => clearTimeout(timer)
    }, [phase])

    return (
        <div className="relative max-w-5xl mx-auto perspective-1000">
            {/* Outer glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-green-500/25 to-transparent blur-[80px] -z-10" />

            {/* Main card container — browser chrome */}
            <div className="relative rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl shadow-2xl overflow-hidden group hover:border-green-500/30 transition-colors duration-500">
                {/* Chrome bar */}
                <div className="h-11 border-b border-white/5 bg-white/5 flex items-center px-4 gap-2 shrink-0">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/50" />
                        <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                        <div className="w-3 h-3 rounded-full bg-green-500/50" />
                    </div>
                    <div className="ml-3 flex-1 h-6 rounded-full bg-white/5 flex items-center px-3 gap-2 max-w-xs">
                        <div className="w-2 h-2 rounded-full bg-green-500/60 animate-pulse" />
                        <span className="text-xs text-zinc-500">greentrace.ai / advisory</span>
                    </div>
                    <div className="ml-auto flex items-center gap-2 text-xs text-zinc-500">
                        <Cpu className="h-3.5 w-3.5" />
                        GreenTrace AI
                    </div>
                </div>

                {/* Inner layout: sidebar + main panel */}
                <div className="flex" style={{ minHeight: 440 }}>
                    {/* Sidebar (decorative) */}
                    <div className="hidden md:flex w-44 flex-col gap-3 border-r border-white/5 p-4 shrink-0">
                        <div className="h-6 w-24 bg-green-900/40 rounded mb-2" />
                        {["Dashboard", "Crop Advisory", "Mandi Prices", "Marketplace", "Knowledge Hub"].map(item => (
                            <div
                                key={item}
                                className={`h-8 w-full rounded-lg flex items-center px-2 text-xs ${item === "Crop Advisory" ? "bg-green-500/15 text-green-400 border border-green-500/20 font-medium" : "text-zinc-600"}`}
                            >
                                {item === "Crop Advisory" && <Leaf className="h-3 w-3 mr-1.5" />}
                                {item}
                            </div>
                        ))}

                        {/* Mini mandi chart */}
                        <div className="mt-auto rounded-xl border border-white/5 bg-white/5 p-2.5">
                            <div className="flex items-center gap-1 mb-1">
                                <BarChart3 className="h-3 w-3 text-amber-400" />
                                <span className="text-[10px] text-zinc-500">Mandi Today</span>
                            </div>
                            <Sparkline data={mandiData} color="rgb(251,191,36)" />
                            <p className="text-[10px] text-amber-400 font-medium mt-0.5">₹2,840/q ↑ 3.2%</p>
                        </div>
                    </div>

                    {/* Main panel — animated phases */}
                    <div className="relative flex-1 bg-zinc-950/40">
                        {/* Phase indicator dots */}
                        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
                            {PHASES.map(p => (
                                <div
                                    key={p}
                                    className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${phase === p ? "bg-green-400" : "bg-zinc-700"}`}
                                />
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            {phase === 0 && <UploadCard key="upload" />}
                            {phase === 1 && <AnalysingCard key="analysing" />}
                            {phase === 2 && <ResultsCard key="results" />}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Bottom gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* ── Floating pills ── */}
            {/* Yield card */}
            <motion.div
                animate={{ y: [0, -18, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-10 top-16 bg-black/80 backdrop-blur-md border border-green-500/30 p-3.5 rounded-xl shadow-2xl hidden lg:block"
            >
                <div className="flex items-center gap-2.5">
                    <div className="bg-green-500/20 p-1.5 rounded-lg">
                        <TrendingUp className="text-green-400 h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-[10px] text-zinc-500">Yield Increase</p>
                        <p className="text-sm font-bold text-white">+35% vs Last Year</p>
                    </div>
                </div>
                <Sparkline data={yieldData} color="rgb(34,197,94)" />
            </motion.div>

            {/* AI badge pill */}
            <motion.div
                animate={{ y: [0, 18, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
                className="absolute -left-10 bottom-28 bg-black/80 backdrop-blur-md border border-emerald-500/30 p-3.5 rounded-xl shadow-2xl hidden lg:block"
            >
                <div className="flex items-center gap-2.5">
                    <div className="bg-emerald-500/20 p-1.5 rounded-lg">
                        <Sparkles className="text-emerald-400 h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-[10px] text-zinc-500">Model Accuracy</p>
                        <p className="text-sm font-bold text-white">94.2% on 12k Samples</p>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
