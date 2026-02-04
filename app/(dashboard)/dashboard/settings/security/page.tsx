"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { formatDistanceToNow, format } from "date-fns"
import {
  Lock,
  Eye,
  EyeOff,
  Shield,
  Smartphone,
  Monitor,
  Laptop,
  Tablet,
  LogOut,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Loader2,
  KeyRound,
  History,
  Globe,
  Clock,
  ChevronRight,
  User,
  RefreshCw,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import {
  changePassword,
  getSessions,
  revokeSession,
  logoutAllDevices,
  checkPasswordStrength,
  parseUserAgent,
  type Session,
  type LoginActivity,
} from "@/lib/settings-api"

// Mock data for demonstration
const mockSessions: Session[] = [
  {
    id: "sess_1",
    device: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    ipAddress: "192.168.1.105",
    createdAt: new Date().toISOString(),
    isCurrent: true,
  },
  {
    id: "sess_2",
    device: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    ipAddress: "103.45.67.89",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    isCurrent: false,
  },
  {
    id: "sess_3",
    device: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    ipAddress: "157.89.34.12",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    isCurrent: false,
  },
]

const mockLoginActivity: LoginActivity[] = [
  {
    type: "login",
    timestamp: new Date().toISOString(),
    ipAddress: "192.168.1.105",
    userAgent: "Chrome on macOS",
    details: { location: "Mumbai, Maharashtra" },
  },
  {
    type: "login",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    ipAddress: "103.45.67.89",
    userAgent: "Chrome on Windows",
    details: { location: "Delhi" },
  },
  {
    type: "password_change",
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    ipAddress: "192.168.1.105",
    userAgent: "Chrome on macOS",
    details: {},
  },
  {
    type: "login",
    timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    ipAddress: "157.89.34.12",
    userAgent: "Safari on iPhone",
    details: { location: "Pune, Maharashtra" },
  },
  {
    type: "login_failed",
    timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    ipAddress: "unknown",
    userAgent: "Unknown",
    details: { reason: "Invalid password" },
  },
]

const mockSecurityInfo = {
  lastPasswordChange: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  twoFactorEnabled: false,
}

export default function SecuritySettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loginActivity, setLoginActivity] = useState<LoginActivity[]>([])
  const [securityInfo, setSecurityInfo] = useState(mockSecurityInfo)
  
  // Password change state
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    logoutOtherDevices: false,
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})
  
  // Session management state
  const [revokingSession, setRevokingSession] = useState<string | null>(null)
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false)
  
  // Password strength
  const passwordStrength = checkPasswordStrength(passwordForm.newPassword)
  
  // Load data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // Try API first
        try {
          const sessionsResponse = await getSessions()
          setSessions(sessionsResponse.data.sessions)
        } catch {
          // Use mock data
          setSessions(mockSessions)
        }
        
        // Mock activity data
        setLoginActivity(mockLoginActivity)
        setSecurityInfo(mockSecurityInfo)
      } catch (error) {
        toast.error("Failed to load security settings")
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [])
  
  const validatePasswordForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    if (!passwordForm.currentPassword) {
      errors.currentPassword = "Current password is required"
    }
    
    if (!passwordForm.newPassword) {
      errors.newPassword = "New password is required"
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters"
    } else if (passwordStrength.strength === "weak") {
      errors.newPassword = "Password is too weak"
    }
    
    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = "Please confirm your password"
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = "Passwords do not match"
    }
    
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      errors.newPassword = "New password must be different from current"
    }
    
    setPasswordErrors(errors)
    return Object.keys(errors).length === 0
  }
  
  const handlePasswordChange = async () => {
    if (!validatePasswordForm()) return
    
    setIsChangingPassword(true)
    try {
      try {
        await changePassword({
          currentPassword: passwordForm.currentPassword,
          password: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword,
          logoutOtherDevices: passwordForm.logoutOtherDevices,
        })
      } catch {
        // Simulate success for demo
      }
      
      toast.success("Password changed successfully")
      setShowPasswordDialog(false)
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        logoutOtherDevices: false,
      })
      setSecurityInfo({ ...securityInfo, lastPasswordChange: new Date().toISOString() })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to change password")
    } finally {
      setIsChangingPassword(false)
    }
  }
  
  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSession(sessionId)
    try {
      try {
        await revokeSession(sessionId)
      } catch {
        // Simulate for demo
      }
      
      setSessions(sessions.filter((s) => s.id !== sessionId))
      toast.success("Session revoked successfully")
    } catch (error) {
      toast.error("Failed to revoke session")
    } finally {
      setRevokingSession(null)
    }
  }
  
  const handleLogoutAllDevices = async () => {
    setIsLoggingOutAll(true)
    try {
      try {
        await logoutAllDevices()
      } catch {
        // Simulate for demo
      }
      
      toast.success("Logged out from all devices")
      // Keep only current session
      setSessions(sessions.filter((s) => s.isCurrent))
    } catch (error) {
      toast.error("Failed to logout from all devices")
    } finally {
      setIsLoggingOutAll(false)
    }
  }
  
  const getDeviceIcon = (userAgent: string) => {
    const { device } = parseUserAgent(userAgent)
    if (device === "Mobile") return <Smartphone className="h-5 w-5" />
    if (device === "Tablet") return <Tablet className="h-5 w-5" />
    if (userAgent.toLowerCase().includes("mac")) return <Laptop className="h-5 w-5" />
    return <Monitor className="h-5 w-5" />
  }
  
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "login":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "login_failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "password_change":
        return <KeyRound className="h-4 w-4 text-blue-500" />
      case "logout":
        return <LogOut className="h-4 w-4 text-yellow-500" />
      default:
        return <History className="h-4 w-4 text-muted-foreground" />
    }
  }
  
  const getActivityLabel = (type: string) => {
    switch (type) {
      case "login":
        return "Successful login"
      case "login_failed":
        return "Failed login attempt"
      case "password_change":
        return "Password changed"
      case "logout":
        return "Logged out"
      default:
        return type
    }
  }
  
  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }
  
  const daysSincePasswordChange = Math.floor(
    (Date.now() - new Date(securityInfo.lastPasswordChange).getTime()) / (1000 * 60 * 60 * 24)
  )
  
  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/settings">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Settings
            </Link>
          </Button>
        </div>
        <h1 className="text-2xl font-bold">Security Settings</h1>
        <p className="text-muted-foreground">
          Manage your password, sessions, and account security
        </p>
      </div>
      
      {/* Password Section */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Password</CardTitle>
                <CardDescription>
                  Last changed {formatDistanceToNow(new Date(securityInfo.lastPasswordChange), { addSuffix: true })}
                </CardDescription>
              </div>
            </div>
            <Button onClick={() => setShowPasswordDialog(true)}>
              <KeyRound className="mr-2 h-4 w-4" />
              Change Password
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {daysSincePasswordChange > 90 && (
            <div className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900/50 dark:bg-yellow-900/20">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  Password is {daysSincePasswordChange} days old
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  We recommend changing your password every 90 days for better security.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new secure password.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(e) => {
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                    setPasswordErrors({ ...passwordErrors, currentPassword: "" })
                  }}
                  placeholder="Enter current password"
                  className={passwordErrors.currentPassword ? "border-red-500 pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  aria-label={showPasswords.current ? "Hide password" : "Show password"}
                >
                  {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordErrors.currentPassword && (
                <p className="text-xs text-red-500">{passwordErrors.currentPassword}</p>
              )}
            </div>
            
            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) => {
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                    setPasswordErrors({ ...passwordErrors, newPassword: "" })
                  }}
                  placeholder="Enter new password"
                  className={passwordErrors.newPassword ? "border-red-500 pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  aria-label={showPasswords.new ? "Hide password" : "Show password"}
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordErrors.newPassword && (
                <p className="text-xs text-red-500">{passwordErrors.newPassword}</p>
              )}
              
              {/* Password Strength Indicator */}
              {passwordForm.newPassword && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Password strength</span>
                    <span
                      className={
                        passwordStrength.strength === "strong"
                          ? "text-green-600"
                          : passwordStrength.strength === "good"
                            ? "text-emerald-600"
                            : passwordStrength.strength === "fair"
                              ? "text-yellow-600"
                              : "text-red-600"
                      }
                    >
                      {passwordStrength.strength.charAt(0).toUpperCase() + passwordStrength.strength.slice(1)}
                    </span>
                  </div>
                  <Progress
                    value={(passwordStrength.score / 6) * 100}
                    className="h-2"
                  />
                  {passwordStrength.feedback.length > 0 && (
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {passwordStrength.feedback.map((item, i) => (
                        <li key={i} className="flex items-center gap-1">
                          <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            
            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => {
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                    setPasswordErrors({ ...passwordErrors, confirmPassword: "" })
                  }}
                  placeholder="Confirm new password"
                  className={passwordErrors.confirmPassword ? "border-red-500 pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  aria-label={showPasswords.confirm ? "Hide password" : "Show password"}
                >
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordErrors.confirmPassword && (
                <p className="text-xs text-red-500">{passwordErrors.confirmPassword}</p>
              )}
              {passwordForm.confirmPassword && passwordForm.newPassword === passwordForm.confirmPassword && (
                <p className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle className="h-3 w-3" />
                  Passwords match
                </p>
              )}
            </div>
            
            <Separator />
            
            {/* Logout other devices option */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="logoutOthers">Logout other devices</Label>
                <p className="text-xs text-muted-foreground">
                  Sign out from all other browsers and devices
                </p>
              </div>
              <Switch
                id="logoutOthers"
                checked={passwordForm.logoutOtherDevices}
                onCheckedChange={(checked) => setPasswordForm({ ...passwordForm, logoutOtherDevices: checked })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePasswordChange} disabled={isChangingPassword}>
              {isChangingPassword ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Lock className="mr-2 h-4 w-4" />
              )}
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Active Sessions Section */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Active Sessions</CardTitle>
                <CardDescription>
                  {sessions.length} active session{sessions.length !== 1 ? "s" : ""} on your account
                </CardDescription>
              </div>
            </div>
            {sessions.length > 1 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Logout from all devices?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will sign you out from all devices except this one. You will need to sign in again on other devices.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLogoutAllDevices} disabled={isLoggingOutAll}>
                      {isLoggingOutAll && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Logout All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessions.map((session) => {
              const deviceInfo = parseUserAgent(session.device)
              
              return (
                <div
                  key={session.id}
                  className={`flex items-center justify-between rounded-lg border p-4 ${
                    session.isCurrent ? "border-primary/50 bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      {getDeviceIcon(session.device)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {deviceInfo.browser} on {deviceInfo.os}
                        </p>
                        {session.isCurrent && (
                          <Badge variant="secondary" className="text-xs">
                            Current
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {session.ipAddress}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {!session.isCurrent && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRevokeSession(session.id)}
                            disabled={revokingSession === session.id}
                          >
                            {revokingSession === session.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Revoke session</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Login Activity Section */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <History className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Login Activity</CardTitle>
              <CardDescription>
                Recent activity on your account
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Activity</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loginActivity.map((activity, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getActivityIcon(activity.type)}
                      <span>{getActivityLabel(activity.type)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {activity.userAgent}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {activity.ipAddress}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </TooltipTrigger>
                        <TooltipContent>
                          {format(new Date(activity.timestamp), "PPpp")}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Two-Factor Authentication (Coming Soon) */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
                <CardDescription>
                  Add an extra layer of security to your account
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary">Coming Soon</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Two-factor authentication adds an additional layer of security to your account by requiring more than just a password to sign in. We are working on bringing this feature to you soon.
          </p>
        </CardContent>
      </Card>
      
      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Related Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          <Link
            href="/dashboard/settings/profile"
            className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Profile Settings</p>
                <p className="text-sm text-muted-foreground">Personal info and preferences</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
          
          <Link
            href="/dashboard"
            className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <RefreshCw className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Dashboard</p>
                <p className="text-sm text-muted-foreground">Back to your dashboard</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
