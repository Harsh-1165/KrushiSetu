"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { motion } from "framer-motion"

const faqs = [
  {
    question: "How do I register as a farmer on GreenTrace?",
    answer: "You can sign up by clicking 'Get Started' and selecting 'Farmer' as your role. You'll need to provide basic details and complete a quick KYC verification using your Aadhar card.",
  },
  {
    question: "What are the fees for selling on GreenTrace?",
    answer: "Registration is completely free. We charge a small commission (1-2%) only when you successfully sell your produce. There are no hidden monthly fees.",
  },
  {
    question: "How does the crop advisory service work?",
    answer: "Simply upload a photo of your crop issue in the app. Our AI system provides instant analysis, and verified agricultural experts verify the diagnosis and suggest treatments within hours.",
  },
  {
    question: "Are the mandi prices updated in real-time?",
    answer: "Yes, we aggregate data from over 500 regulated mandis (APMCs) across India every hour to ensure you always have the latest market rates.",
  },
  {
    question: "How is payment security ensured?",
    answer: "We use an escrow system. The buyer's payment is held securely by GreenTrace until the produce is delivered and verified. Once confirmed, funds are instantly transferred to your bank account.",
  },
  {
    question: "Can I get organic certification for my products?",
    answer: "Yes, GreenTrace partners with certification bodies to help you apply for organic certification directly through the platform, adding value to your produce.",
  },
]

export function FaqSection() {
  return (
    <section className="py-24 bg-[#020402]">
      <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Frequently Asked Questions
          </h2>
          <p className="text-zinc-400 text-lg">
            Got questions? We've got answers to help you grow.
          </p>
        </motion.div>

        <div className="space-y-4">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-white/10 bg-white/5 rounded-2xl px-6 mb-4 data-[state=open]:bg-white/10 data-[state=open]:border-green-500/30 transition-all duration-300"
              >
                <AccordionTrigger className="text-white hover:no-underline py-6 text-left hover:text-green-400 transition-colors text-lg">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-zinc-400 pb-6 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
