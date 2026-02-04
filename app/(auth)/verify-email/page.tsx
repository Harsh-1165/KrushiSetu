"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Loader2, AlertCircle, CheckCircle2, Mail, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { verifyEmail, resendVerification } from "@/lib/auth"

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""
  const email = searchParams.get("email") || ""
  const registered = searchParams.get("registered") === "true"

  const [isVerifying, setIsVerifying] = React.useState(false)
  const [isResending, setIsResending] = React.useState(false)
  const [error, setError] = React.useState("")
  const [isVerified, setIsVerified] = React.useState(false)
  const [resendSuccess, setResendSuccess] = React.useState(false)

  // Auto-verify if token and email are present
  React.useEffect(() => {
    if (token && email && !isVerified && !error) {
      handleVerify()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, email])

  const handleVerify = async () => {
    if (!token || !email) return

    setIsVerifying(true)
    setError("")

    try {
      await verifyEmail(token, email)
      setIsVerified(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Email verification failed")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResend = async () => {
    setIsResending(true)
    setError("")
    setResendSuccess(false)

    try {
      await resendVerification()
      setResendSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend verification email")
    } finally {
      setIsResending(false)
    }
  }

  // Verifying state
  if (isVerifying) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Verifying your email</h1>
        <p className="text-muted-foreground">
          Please wait while we verify your email address...
        </p>
      </motion.div>
    )
  }

  // Verified state
  if (isVerified) {
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
        <h1 className="text-2xl font-bold text-foreground mb-2">Email verified!</h1>
        <p className="text-muted-foreground mb-6">
          Your email has been successfully verified. You can now access all features of GreenTrace.
        </p>
        <Button className="w-full" size="lg" onClick={() => router.push("/login")}>
          Continue to sign in
        </Button>
      </motion.div>
    )
  }

  // Just registered - waiting for verification
  if (registered) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Verify your email</h1>
        <p className="text-muted-foreground mb-6">
          We&apos;ve sent a verification link to your email address. Please check your inbox 
          and click the link to verify your account.
        </p>

        {error && (
          <Alert variant="destructive" className="mb-6 text-left">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {resendSuccess && (
          <Alert className="mb-6 text-left border-primary/50 bg-primary/5">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <AlertDescription className="text-primary">
              Verification email sent successfully!
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full bg-transparent"
            onClick={handleResend}
            disabled={isResending}
          >
            {isResending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Resend verification email
              </>
            )}
          </Button>
          <Link href="/login">
            <Button variant="ghost" className="w-full">
              Back to sign in
            </Button>
          </Link>
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          Didn&apos;t receive the email? Check your spam folder or try resending.
        </p>
      </motion.div>
    )
  }

  // Error state or no token
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
      <h1 className="text-2xl font-bold text-foreground mb-2">
        {error ? "Verification Failed" : "Invalid Verification Link"}
      </h1>
      <p className="text-muted-foreground mb-6">
        {error || "This verification link is invalid or has expired. Please request a new one."}
      </p>

      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full bg-transparent"
          onClick={handleResend}
          disabled={isResending}
        >
          {isResending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Resend verification email
            </>
          )}
        </Button>
        <Link href="/login">
          <Button variant="ghost" className="w-full">
            Back to sign in
          </Button>
        </Link>
      </div>
    </motion.div>
  )
}
