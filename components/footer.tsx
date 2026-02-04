"use client"

import Link from "next/link"
import { Facebook, Twitter, Instagram, Linkedin, Leaf } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-[#020402] border-t border-white/10 pt-20 pb-10 text-zinc-400">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-6 text-white">
              <div className="h-8 w-8 bg-green-500 rounded-lg flex items-center justify-center">
                <Leaf className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl">GreenTrace</span>
            </Link>
            <p className="text-sm leading-relaxed max-w-xs mb-8">
              Empowering farmers with technology. Connecting agriculture to the future. Join the revolution today.
            </p>
            <div className="flex gap-4">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-green-500 hover:text-white transition-all duration-300">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Platform</h4>
            <ul className="space-y-4 text-sm">
              {["Marketplace", "Crop Advisory", "Mandi Prices", "Knowledge Hub"].map(item => (
                <li key={item}><Link href="#" className="hover:text-green-400 transition-colors">{item}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Company</h4>
            <ul className="space-y-4 text-sm">
              {["About Us", "Careers", "Press", "Contact"].map(item => (
                <li key={item}><Link href="#" className="hover:text-green-400 transition-colors">{item}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Legal</h4>
            <ul className="space-y-4 text-sm">
              {["Privacy Policy", "Terms of Service", "Cookie Policy", "Refund Policy"].map(item => (
                <li key={item}><Link href="#" className="hover:text-green-400 transition-colors">{item}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p>© 2026 GreenTrace. All rights reserved.</p>
          <p className="flex items-center gap-1">Made with <span className="text-red-500">♥</span> in India</p>
        </div>
      </div>
    </footer>
  )
}
