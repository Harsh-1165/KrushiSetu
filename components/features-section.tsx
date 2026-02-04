"use client"

import { motion } from "framer-motion"
import { Store, MessageCircleQuestion, TrendingUp, BookOpen, Shield, Truck, ArrowUpRight, Leaf } from "lucide-react"
import { cn } from "@/lib/utils"

const features = [
  {
    icon: Store,
    title: "Digital Marketplace",
    description: "Connect directly with buyers anywhere in India. Eliminate middlemen and maximize your profit margins with our secure trading platform.",
    className: "md:col-span-2",
    color: "from-orange-500/20 to-orange-500/0",
    iconColor: "text-orange-400",
    borderColor: "group-hover:border-orange-500/50"
  },
  {
    icon: TrendingUp,
    title: "Live Mandi Prices",
    description: "Real-time access to price data from 500+ mandis. Make data-driven decisions on when and where to sell.",
    className: "md:col-span-1",
    color: "from-green-500/20 to-green-500/0",
    iconColor: "text-green-400",
    borderColor: "group-hover:border-green-500/50"
  },
  {
    icon: MessageCircleQuestion,
    title: "Expert Crop Advisory",
    description: "24/7 access to certified agronomists. Upload photos of pest issues and get instant, actionable remedies.",
    className: "md:col-span-1",
    color: "from-blue-500/20 to-blue-500/0",
    iconColor: "text-blue-400",
    borderColor: "group-hover:border-blue-500/50"
  },
  {
    icon: Shield,
    title: "Secure Payments",
    description: "Escrow-protected transactions ensure you never lose money. Automated payouts directly to your verified bank account.",
    className: "md:col-span-2",
    color: "from-amber-500/20 to-amber-500/0",
    iconColor: "text-amber-400",
    borderColor: "group-hover:border-amber-500/50"
  }
]

export function FeaturesSection() {
  return (
    <section className="py-24 bg-[#020402] text-white">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
              Everything you need to <span className="text-green-400">grow.</span>
            </h2>
            <p className="text-zinc-400 text-lg">
              A complete ecosystem designed to modernize every aspect of your farming business, from sowing to selling.
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-24 h-24 rounded-full border border-white/10 flex items-center justify-center animate-spin-slow">
              <Leaf className="text-green-500 h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 transition-all duration-500 hover:bg-white/[0.08]",
                feature.className,
                feature.borderColor
              )}
            >
              {/* Unique Gradient Background */}
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100", feature.color)} />

              <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                <div className="flex justify-between items-start">
                  <div className={cn("p-4 rounded-2xl bg-white/5 border border-white/5 transition-transform duration-500 group-hover:scale-110", feature.iconColor)}>
                    <feature.icon className="h-8 w-8" />
                  </div>
                  <ArrowUpRight className="h-6 w-6 text-white/20 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                </div>

                <div>
                  <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-zinc-400 leading-relaxed font-light">{feature.description}</p>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Quick Stat Card 1 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="md:col-span-1 min-h-[200px] rounded-3xl bg-green-600 p-8 flex flex-col justify-center items-center text-center relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-[url('/grain.png')] opacity-20" />
            <div className="relative z-10">
              <Truck className="h-10 w-10 mb-4 mx-auto text-white" />
              <h3 className="text-4xl font-bold mb-2">12k+</h3>
              <p className="text-green-100">Deliveries Completed</p>
            </div>
          </motion.div>

          {/* Quick Stat Card 2 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="md:col-span-2 min-h-[200px] rounded-3xl bg-zinc-900 border border-white/10 p-8 flex flex-col justify-center relative overflow-hidden group hover:border-white/20 transition-colors"
          >
            <div className="flex items-center gap-6">
              <div className="flex -space-x-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-12 h-12 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-xs text-zinc-500">
                    Avatar
                  </div>
                ))}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Join 15,000+ Experts</h3>
                <p className="text-zinc-500">Share knowledge and grow together.</p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
