"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { Send } from "lucide-react"

export function NewsletterSection() {
  return (
    <section className="py-24 bg-[#020402] relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative rounded-[2.5rem] overflow-hidden bg-green-600 p-8 md:p-16 text-center shadow-2xl"
        >
          {/* Mesh Gradients inside the card */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-400/30 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Stay Updated with Market Insights
            </h2>
            <p className="text-green-50 text-lg mb-10 text-balance">
              Get weekly price trends, farming tips, and platform updates delivered straight to your inbox. No spam, we promise.
            </p>

            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
              <Input
                type="email"
                placeholder="Enter your email"
                className="h-14 rounded-full bg-white/10 border-white/20 text-white placeholder:text-white/60 focus-visible:ring-white focus-visible:border-white text-lg px-6 backdrop-blur-md"
              />
              <Button size="lg" className="h-14 rounded-full bg-white text-green-700 hover:bg-green-50 font-bold px-8 text-lg shadow-lg hover:scale-105 transition-all">
                Subscribe <Send className="ml-2 h-5 w-5" />
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
