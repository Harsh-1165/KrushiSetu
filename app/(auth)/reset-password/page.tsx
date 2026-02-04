"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Eye, EyeOff, Lock, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { resetPassword, checkPasswordStrength } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { Suspense } from "react"
import Loading from "./loading"

export default function ResetPasswordPage() {
  const router = useRouter()

  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [isSuccess, setIsSuccess] = React.useState(false)
  const [formData, setFormData] = React.useState({
    password: "",
    confirmPassword: "",
  })

  const passwordStrength = checkPasswordStrength(formData.password)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError("")
  }

  const getStrengthColor = () => {
    switch (passwordStrength.strength) {
      case "strong":
        return "bg-primary"
      case "good":
        return "bg-accent"
      case "fair":
        return "bg-yellow-500"
      default:
        return "bg-destructive"
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const searchParams = new URLSearchParams(window.location.search)
    const token = searchParams.get("token")
    const email = searchParams.get("email")

    if (!token || !email) {
      setError("Invalid reset link. Please request a new password reset.")
      return
    }

    if (passwordStrength.strength === "weak") {
      setError("Please choose a stronger password")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      await resetPassword(token, email, formData.password, formData.confirmPassword)
      setIsSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password reset failed")
    } finally {
      setIsLoading(false)
    }
  }

  // Check for missing params
  if (!window.location.search.includes("token") || !window.location.search.includes("email")) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Invalid Reset Link</h1>
        <p className="text-muted-foreground mb-6">
          This password reset link is invalid or has expired. Please request a new one.
        </p>
        <Link href="/forgot-password">
          <Button className="w-full" size="lg">
            Request new reset link
          </Button>
        </Link>
      </motion.div>
    )
  }

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Password Reset Successful</h1>
        <p className="text-muted-foreground mb-6">
          Your password has been reset successfully. You can now sign in with your new password.
        </p>
        <Button className="w-full" size="lg" onClick={() => router.push("/login")}>
          Sign in
        </Button>
      </motion.div>
    )
  }

  return (
    <Suspense fallback={<Loading />}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Set new password</h1>
          <p className="text-muted-foreground mt-2">
            Your new password must be different from previously used passwords.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                className="pl-10 pr-10"
                value={formData.password}
                onChange={handleInputChange}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="space-y-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-1 flex-1 rounded",
                        i <= Math.ceil(passwordStrength.score / 1.5)
                          ? getStrengthColor()
                          : "bg-muted"
                      )}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Strength:{" "}
                  <span
                    className={cn(
                      "font-medium capitalize",
                      passwordStrength.strength === "strong" && "text-primary",
                      passwordStrength.strength === "good" && "text-accent",
                      passwordStrength.strength === "fair" && "text-yellow-500",
                      passwordStrength.strength === "weak" && "text-destructive"
                    )}
                  >
                    {passwordStrength.strength}
                  </span>
                </p>
                {passwordStrength.feedback.length > 0 && (
                  <ul className="text-xs text-muted-foreground list-disc list-inside">
                    {passwordStrength.feedback.map((tip) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                className="pl-10 pr-10"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="text-xs text-destructive">Passwords do not match</p>
            )}
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Resetting...
              </>
            ) : (
              "Reset password"
            )}
          </Button>
        </form>

        <Link href="/login">
          <Button variant="ghost" className="w-full mt-4">
            Back to sign in
          </Button>
        </Link>
      </motion.div>
    </Suspense>
  )
}
