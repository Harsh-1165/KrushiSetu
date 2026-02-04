"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"

const stats = [
  { label: "Registered Farmers", value: "50,000+", color: "text-green-400" },
  { label: "Products Listed", value: "25,000+", color: "text-amber-400" },
  { label: "Mandis Tracked", value: "500+", color: "text-blue-400" },
  { label: "Daily Transactions", value: "₹2.5Cr+", color: "text-white" },
]

export function StatsSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  })

  return (
    <section ref={containerRef} className="py-32 bg-[#050a05] relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-900/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-900/10 rounded-full blur-[100px]" />

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {stats.map((stat, index) => (
            <StatItem key={index} stat={stat} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}

function StatItem({ stat, index }: { stat: { label: string; value: string; color: string }; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.8, ease: "easeOut" }}
      className="text-center group relative"
    >
      <div className="relative inline-block">
        {/* 3D Text Effect using layers */}
        <h3
          className={`text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter ${stat.color} relative z-10 transition-transform duration-300 group-hover:-translate-y-2`}
          style={{ textShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
        >
          {stat.value}
        </h3>

        {/* Reflection/Shadow */}
        <div
          className={`absolute top-full left-0 w-full h-full ${stat.color} opacity-10 blur-md transform scale-y-[-0.5] origin-top pointer-events-none`}
        >
          {stat.value}
        </div>
      </div>

      <p className="mt-4 text-zinc-500 font-medium uppercase tracking-widest text-sm group-hover:text-zinc-300 transition-colors">
        {stat.label}
      </p>
    </motion.div>
  )
}
