"use client"

import { motion } from "framer-motion"
import { UserPlus, PackagePlus, ShoppingCart, Wallet } from "lucide-react"

const steps = [
  {
    icon: UserPlus,
    title: "Register & Verify",
    description: "Create your free account and verify your identity securely.",
    color: "bg-blue-500",
  },
  {
    icon: PackagePlus,
    title: "List Your Produce",
    description: "Upload photos, set prices, and list your harvest in minutes.",
    color: "bg-green-500",
  },
  {
    icon: ShoppingCart,
    title: "Receive Orders",
    description: "Get instant notifications when buyers place orders.",
    color: "bg-amber-500",
  },
  {
    icon: Wallet,
    title: "Get Paid Instantly",
    description: "Secure payments released to your bank upon delivery.",
    color: "bg-emerald-500",
  },
]

export function HowItWorks() {
  return (
    <section className="py-24 bg-[#020402] relative overflow-hidden">
      {/* Mesh Grid Background */}
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.02]" />

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="text-center mb-20 max-w-2xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-white mb-6"
          >
            From Farm to Fortune
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-zinc-400 text-lg"
          >
            Start your digital farming journey in four simple steps.
          </motion.p>
        </div>

        <div className="relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-[60px] left-0 w-full h-1 bg-white/5">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: "100%" }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="h-full bg-gradient-to-r from-blue-500 via-green-500 to-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative group pt-10 lg:pt-0"
              >
                {/* Step Number Badge */}
                <div className="hidden lg:flex absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#020402] border-2 border-white/10 items-center justify-center text-sm font-bold text-zinc-500 z-10 transition-colors group-hover:border-white/50 group-hover:text-white">
                  {index + 1}
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-8">
                    {/* Glowing effect behind icon */}
                    <div className={`absolute inset-0 ${step.color} blur-[30px] opacity-0 group-hover:opacity-40 transition-opacity duration-500`} />

                    {/* Icon Container */}
                    <div className="relative w-24 h-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:border-white/30 backdrop-blur-md shadow-2xl">
                      <step.icon className="w-10 h-10 text-white" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-green-400 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-zinc-400 leading-relaxed text-sm px-4">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
