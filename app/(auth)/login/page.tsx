"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Eye, EyeOff, Mail, Lock, Loader2, AlertCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { loginUser } from "@/lib/auth"
import { cn } from "@/lib/utils"

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
    rememberMe: false,
  })

  // Autofill demo for testing convenience - optional
  // React.useEffect(() => {
  //   setFormData(prev => ({...prev, email: "demo@example.com", password: "password123"}))
  // }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await loginUser({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
      })

      if (response.success) {
        if (response.data?.user) {
          sessionStorage.setItem("user", JSON.stringify(response.data.user))
        }
        router.push("/dashboard")
      }
    } catch (err) {
      // Fallback for demo if backend fails
      console.error(err)
      setError("Invalid credentials. For demo try creating a new account.")
      // Optional: Verify if this is just a dummy login
      //   setTimeout(() => router.push("/dashboard"), 1000)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-6"
    >
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">Welcome back</h1>
        <p className="text-zinc-400">
          Enter your credentials to access your account
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-red-900/10 border-red-900/20 text-red-400">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-400 ml-1">Email</Label>
            <div className="relative group">
              <div className="absolute inset-0 bg-green-500/20 rounded-lg blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-green-400 transition-colors" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus:border-green-500/50 focus:ring-green-500/20 rounded-xl h-11 transition-all"
                value={formData.email}
                onChange={handleInputChange}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1">
              <Label htmlFor="password" className="text-zinc-400">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-green-400 hover:text-green-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-green-500/20 rounded-lg blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-green-400 transition-colors" />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus:border-green-500/50 focus:ring-green-500/20 rounded-xl h-11 transition-all"
                value={formData.password}
                onChange={handleInputChange}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors p-1"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-1">
          <Checkbox
            id="rememberMe"
            className="border-white/20 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 data-[state=checked]:text-black"
            checked={formData.rememberMe}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({ ...prev, rememberMe: checked === true }))
            }
          />
          <Label htmlFor="rememberMe" className="text-sm font-normal text-zinc-400 cursor-pointer select-none">
            Remember me for 30 days
          </Label>
        </div>

        <Button
          type="submit"
          className="w-full bg-green-500 hover:bg-green-400 text-black font-semibold h-11 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all duration-300 group"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <span className="flex items-center gap-2">
              Sign In <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          )}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#020402] px-2 text-zinc-600">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" className="bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white h-11 rounded-lg">
          Google
        </Button>
        <Button variant="outline" className="bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white h-11 rounded-lg">
          GitHub
        </Button>
      </div>

      <p className="text-center text-sm text-zinc-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-green-400 hover:text-green-300 hover:underline font-medium transition-colors">
          Sign up
        </Link>
      </p>
    </motion.div>
  )
}
