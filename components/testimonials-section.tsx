"use client"

import { motion } from "framer-motion"
import { Quote } from "lucide-react"

const testimonials = [
  {
    quote: "GreenTrace helped me double my income by connecting me directly with restaurants in the city. No more middlemen taking my profits.",
    author: "Ramesh Kumar",
    role: "Vegetable Farmer, Maharashtra",
    initials: "RK",
    color: "from-green-500/10 to-transparent",
    borderColor: "border-green-500/20"
  },
  {
    quote: "The crop advisory feature saved my entire tomato harvest. The expert identified the pest issue and suggested organic treatment immediately.",
    author: "Lakshmi Devi",
    role: "Organic Farmer, Karnataka",
    initials: "LD",
    color: "from-amber-500/10 to-transparent",
    borderColor: "border-amber-500/20"
  },
  {
    quote: "Real-time mandi prices help me decide the best time and place to sell my wheat. I've increased my margins by 30% this season.",
    author: "Harpreet Singh",
    role: "Wheat Farmer, Punjab",
    initials: "HS",
    color: "from-blue-500/10 to-transparent",
    borderColor: "border-blue-500/20"
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-24 bg-[#020402] relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/2 left-0 w-full h-[500px] bg-gradient-to-r from-green-900/10 via-transparent to-blue-900/10 blur-[100px] -translate-y-1/2 pointer-events-none" />

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Trusted by the Best
          </h2>
          <p className="text-zinc-400 text-lg">
            Hear from our community of successful farmers transforming their lives.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative p-8 rounded-3xl bg-white/5 border ${t.borderColor} backdrop-blur-sm group hover:bg-white/[0.07] transition-all duration-300 min-h-[300px] flex flex-col justify-between`}
            >
              {/* Subtle Gradient Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${t.color} rounded-3xl opacity-50`} />

              <div className="relative z-10">
                <Quote className="h-10 w-10 text-white/20 mb-6 group-hover:text-white/40 transition-colors" />
                <p className="text-zinc-300 text-lg leading-relaxed mb-6 font-light">
                  &quot;{t.quote}&quot;
                </p>
              </div>

              <div className="relative z-10 flex items-center gap-4 border-t border-white/5 pt-6">
                <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-sm">
                  {t.initials}
                </div>
                <div>
                  <h4 className="text-white font-semibold">{t.author}</h4>
                  <p className="text-zinc-500 text-xs uppercase tracking-wider">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
