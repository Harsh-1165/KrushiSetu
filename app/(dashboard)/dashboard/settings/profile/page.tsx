"use client"

import React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Camera,
  Trash2,
  Save,
  Loader2,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Sprout,
  GraduationCap,
  Globe,
  Bell,
  Plus,
  X,
  ChevronRight,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { Skeleton } from "@/components/ui/skeleton"

import {
  getUserProfile,
  updateUserProfile,
  uploadAvatar,
  removeAvatar,
  validatePhone,
  validatePincode,
  indianStates,
  cropTypes,
  expertSpecializations,
  farmSizeUnits,
  farmingTypes,
  languages,
  type UserProfile,
  type ProfileUpdateData,
} from "@/lib/settings-api"

// Mock user data for demonstration
const mockUser: UserProfile = {
  id: "user_123",
  email: "rajesh.kumar@example.com",
  name: {
    first: "Rajesh",
    last: "Kumar",
  },
  phone: "9876543210",
  role: "farmer",
  avatar: {
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
  },
  status: "active",
  verification: {
    email: { verified: true, verifiedAt: "2024-01-15T10:30:00Z" },
    phone: { verified: true, verifiedAt: "2024-01-15T10:35:00Z" },
    kyc: { status: "approved" },
  },
  preferences: {
    language: "en",
    currency: "INR",
    notifications: {
      email: true,
      sms: true,
      push: false,
    },
    newsletter: true,
  },
  address: {
    street: "123 Farm Road",
    village: "Greenville",
    city: "Nashik",
    district: "Nashik",
    state: "Maharashtra",
    pincode: "422001",
    country: "India",
  },
  bio: "Experienced farmer with 15+ years in organic vegetable farming. Specialized in tomatoes, onions, and leafy greens.",
  farmerProfile: {
    farmSize: 5.5,
    farmSizeUnit: "acres",
    crops: ["Tomatoes", "Onions", "Spinach", "Cabbage"],
    farmingType: "organic",
    rating: 4.8,
    totalSales: 250,
  },
  security: {
    lastLogin: "2024-01-20T14:30:00Z",
    lastPasswordChange: "2024-01-01T10:00:00Z",
    twoFactorEnabled: false,
  },
  createdAt: "2023-06-15T08:00:00Z",
}

export default function ProfileSettingsPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [activeTab, setActiveTab] = useState("personal")

  // Form state
  const [formData, setFormData] = useState<ProfileUpdateData>({
    name: { first: "", last: "" },
    phone: "",
    bio: "",
    address: {
      street: "",
      village: "",
      city: "",
      district: "",
      state: "",
      pincode: "",
      country: "India",
    },
    preferences: {
      language: "en",
      notifications: {
        email: true,
        sms: true,
        push: false,
      },
      newsletter: true,
    },
    farmerProfile: {
      farmSize: 0,
      farmSizeUnit: "acres",
      crops: [],
      farmingType: "conventional",
    },
    expertProfile: {
      specializations: [],
      experience: 0,
      consultationFee: 0,
      qualifications: [],
    },
  })

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  // New crop/specialization input
  const [newCrop, setNewCrop] = useState("")
  const [newSpecialization, setNewSpecialization] = useState("")

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true)
      try {
        // Try API first, fallback to mock
        try {
          const response = await getUserProfile()
          setUser(response.data.user)
          initializeFormData(response.data.user)
        } catch {
          // Use mock data for demonstration
          setUser(mockUser)
          initializeFormData(mockUser)
        }
      } catch (error) {
        toast.error("Failed to load profile")
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [])

  const initializeFormData = (userData: UserProfile) => {
    setFormData({
      name: { first: userData.name.first, last: userData.name.last },
      phone: userData.phone,
      bio: userData.bio || "",
      address: {
        street: userData.address?.street || "",
        village: userData.address?.village || "",
        city: userData.address?.city || "",
        district: userData.address?.district || "",
        state: userData.address?.state || "",
        pincode: userData.address?.pincode || "",
        country: userData.address?.country || "India",
      },
      preferences: {
        language: userData.preferences?.language || "en",
        notifications: {
          email: userData.preferences?.notifications?.email ?? true,
          sms: userData.preferences?.notifications?.sms ?? true,
          push: userData.preferences?.notifications?.push ?? false,
        },
        newsletter: userData.preferences?.newsletter ?? true,
      },
      farmerProfile: {
        farmSize: userData.farmerProfile?.farmSize || 0,
        farmSizeUnit: userData.farmerProfile?.farmSizeUnit || "acres",
        crops: userData.farmerProfile?.crops || [],
        farmingType: userData.farmerProfile?.farmingType || "conventional",
      },
      expertProfile: {
        specializations: userData.expertProfile?.specializations || [],
        experience: userData.expertProfile?.experience || 0,
        consultationFee: userData.expertProfile?.consultationFee || 0,
        qualifications: userData.expertProfile?.qualifications || [],
      },
    })
  }

  const handleInputChange = (field: string, value: string | number | boolean | string[]) => {
    setHasChanges(true)
    setErrors({ ...errors, [field]: "" })

    const fields = field.split(".")
    setFormData((prev) => {
      const updated = { ...prev }
      let current: Record<string, unknown> = updated

      for (let i = 0; i < fields.length - 1; i++) {
        if (!current[fields[i]]) {
          current[fields[i]] = {}
        }
        current = current[fields[i]] as Record<string, unknown>
      }

      current[fields[fields.length - 1]] = value
      return updated
    })
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name?.first?.trim()) {
      newErrors["name.first"] = "First name is required"
    }
    if (!formData.name?.last?.trim()) {
      newErrors["name.last"] = "Last name is required"
    }
    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = "Enter a valid 10-digit mobile number"
    }
    if (formData.address?.pincode && !validatePincode(formData.address.pincode)) {
      newErrors["address.pincode"] = "Enter a valid 6-digit pincode"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors before saving")
      return
    }

    if (!user) return

    setIsSaving(true)
    try {
      // Prepare update data based on role
      const updateData: ProfileUpdateData = {
        name: formData.name,
        phone: formData.phone,
        bio: formData.bio,
        address: formData.address,
        preferences: formData.preferences,
      }

      if (user.role === "farmer") {
        updateData.farmerProfile = formData.farmerProfile
      } else if (user.role === "expert") {
        updateData.expertProfile = formData.expertProfile
      }

      await updateUserProfile(user.id, updateData)

      // Re-fetch the latest data from the server to confirm the save
      try {
        const refreshed = await getUserProfile()
        setUser(refreshed.data.user)
        initializeFormData(refreshed.data.user)
      } catch {
        // If the re-fetch fails, keep the current local state — save already succeeded
      }

      setHasChanges(false)
      toast.success("Profile updated successfully")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }


  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    // Reset file input so same file can be re-selected if needed
    if (fileInputRef.current) fileInputRef.current.value = ""

    // Validate file type
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Only JPEG, PNG, and WebP images are allowed")
      return
    }

    // Validate size (2MB limit to match backend config)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB")
      return
    }

    setIsUploadingAvatar(true)
    try {
      // Upload to Cloudinary via the backend
      const response = await uploadAvatar(file)
      const avatarUrl = response.data.avatar.url
      setUser({ ...user, avatar: { url: avatarUrl } })
      toast.success("Profile photo updated successfully")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload photo")
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleRemoveAvatar = async () => {
    if (!user) return

    try {
      await removeAvatar()
      setUser({ ...user, avatar: undefined })
      toast.success("Profile photo removed")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove photo")
    }
  }

  const addCrop = () => {
    if (!newCrop.trim()) return
    const crops = formData.farmerProfile?.crops || []
    if (!crops.includes(newCrop.trim())) {
      handleInputChange("farmerProfile.crops", [...crops, newCrop.trim()])
    }
    setNewCrop("")
  }

  const removeCrop = (crop: string) => {
    const crops = formData.farmerProfile?.crops || []
    handleInputChange("farmerProfile.crops", crops.filter((c) => c !== crop))
  }

  const addSpecialization = () => {
    if (!newSpecialization.trim()) return
    const specs = formData.expertProfile?.specializations || []
    if (!specs.includes(newSpecialization.trim())) {
      handleInputChange("expertProfile.specializations", [...specs, newSpecialization.trim()])
    }
    setNewSpecialization("")
  }

  const removeSpecialization = (spec: string) => {
    const specs = formData.expertProfile?.specializations || []
    handleInputChange("expertProfile.specializations", specs.filter((s) => s !== spec))
  }

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-6 md:grid-cols-3">
            <Skeleton className="h-64" />
            <Skeleton className="col-span-2 h-64" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <XCircle className="mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="mb-2 text-lg font-semibold">Unable to load profile</h2>
            <p className="text-muted-foreground">Please try again later</p>
            <Button className="mt-4" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/settings">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Settings
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your personal information and preferences
          </p>
        </div>
        <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Avatar Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profile Photo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="relative mb-4">
              <Avatar className="h-32 w-32">
                <AvatarImage src={user.avatar?.url || "/placeholder.svg"} alt={user.name.first} />
                <AvatarFallback className="text-2xl">
                  {user.name.first[0]}{user.name.last[0]}
                </AvatarFallback>
              </Avatar>
              {isUploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/80">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarUpload}
            />

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
              >
                <Camera className="mr-2 h-4 w-4" />
                Upload
              </Button>
              {user.avatar?.url && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove Profile Photo?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Your profile photo will be removed and replaced with default initials.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRemoveAvatar}>
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            <p className="mt-3 text-center text-xs text-muted-foreground">
              JPEG, PNG, or WebP. Max 5MB.
            </p>

            {/* Verification Status */}
            <Separator className="my-4" />
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email
                </span>
                {user.verification?.email?.verified ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                    Pending
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  Phone
                </span>
                {user.verification?.phone?.verified ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                    Pending
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  KYC
                </span>
                <Badge
                  variant="secondary"
                  className={
                    user.verification?.kyc?.status === "approved"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : user.verification?.kyc?.status === "rejected"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                  }
                >
                  {user.verification?.kyc?.status === "approved" && <CheckCircle className="mr-1 h-3 w-3" />}
                  {user.verification?.kyc?.status
                    ? user.verification.kyc.status.charAt(0).toUpperCase() + user.verification.kyc.status.slice(1)
                    : "Pending"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Form */}
        <Card className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader className="pb-0">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="personal">
                  <User className="mr-2 h-4 w-4 hidden sm:inline" />
                  Personal
                </TabsTrigger>
                <TabsTrigger value="address">
                  <MapPin className="mr-2 h-4 w-4 hidden sm:inline" />
                  Address
                </TabsTrigger>
                <TabsTrigger value="role">
                  {user.role === "farmer" ? (
                    <Sprout className="mr-2 h-4 w-4 hidden sm:inline" />
                  ) : user.role === "expert" ? (
                    <GraduationCap className="mr-2 h-4 w-4 hidden sm:inline" />
                  ) : (
                    <User className="mr-2 h-4 w-4 hidden sm:inline" />
                  )}
                  {user.role === "farmer" ? "Farm" : user.role === "expert" ? "Expert" : "Profile"}
                </TabsTrigger>
                <TabsTrigger value="preferences">
                  <Bell className="mr-2 h-4 w-4 hidden sm:inline" />
                  Preferences
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="pt-6">
              {/* Personal Information Tab */}
              <TabsContent value="personal" className="mt-0 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.name?.first || ""}
                      onChange={(e) => handleInputChange("name.first", e.target.value)}
                      placeholder="Enter first name"
                      className={errors["name.first"] ? "border-red-500" : ""}
                    />
                    {errors["name.first"] && (
                      <p className="text-xs text-red-500">{errors["name.first"]}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.name?.last || ""}
                      onChange={(e) => handleInputChange("name.last", e.target.value)}
                      placeholder="Enter last name"
                      className={errors["name.last"] ? "border-red-500" : ""}
                    />
                    {errors["name.last"] && (
                      <p className="text-xs text-red-500">{errors["name.last"]}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed. Contact support if needed.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone || ""}
                    onChange={(e) => handleInputChange("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    className={errors.phone ? "border-red-500" : ""}
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-500">{errors.phone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio / About</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio || ""}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground">
                    {(formData.bio?.length || 0)}/500 characters
                  </p>
                </div>
              </TabsContent>

              {/* Address Tab */}
              <TabsContent value="address" className="mt-0 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    value={formData.address?.street || ""}
                    onChange={(e) => handleInputChange("address.street", e.target.value)}
                    placeholder="Enter street address"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="village">Village</Label>
                    <Input
                      id="village"
                      value={formData.address?.village || ""}
                      onChange={(e) => handleInputChange("address.village", e.target.value)}
                      placeholder="Enter village name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.address?.city || ""}
                      onChange={(e) => handleInputChange("address.city", e.target.value)}
                      placeholder="Enter city"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="district">District</Label>
                    <Input
                      id="district"
                      value={formData.address?.district || ""}
                      onChange={(e) => handleInputChange("address.district", e.target.value)}
                      placeholder="Enter district"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Select
                      value={formData.address?.state || ""}
                      onValueChange={(value) => handleInputChange("address.state", value)}
                    >
                      <SelectTrigger id="state">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {indianStates.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input
                      id="pincode"
                      value={formData.address?.pincode || ""}
                      onChange={(e) => handleInputChange("address.pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="6-digit pincode"
                      maxLength={6}
                      className={errors["address.pincode"] ? "border-red-500" : ""}
                    />
                    {errors["address.pincode"] && (
                      <p className="text-xs text-red-500">{errors["address.pincode"]}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.address?.country || "India"}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Role-specific Tab */}
              <TabsContent value="role" className="mt-0 space-y-4">
                {user.role === "farmer" && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="farmSize">Farm Size</Label>
                        <Input
                          id="farmSize"
                          type="number"
                          min={0}
                          step={0.1}
                          value={formData.farmerProfile?.farmSize || 0}
                          onChange={(e) => handleInputChange("farmerProfile.farmSize", Number.parseFloat(e.target.value) || 0)}
                          placeholder="Enter farm size"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="farmSizeUnit">Unit</Label>
                        <Select
                          value={formData.farmerProfile?.farmSizeUnit || "acres"}
                          onValueChange={(value) => handleInputChange("farmerProfile.farmSizeUnit", value)}
                        >
                          <SelectTrigger id="farmSizeUnit">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {farmSizeUnits.map((unit) => (
                              <SelectItem key={unit.value} value={unit.value}>
                                {unit.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="farmingType">Farming Type</Label>
                      <Select
                        value={formData.farmerProfile?.farmingType || "conventional"}
                        onValueChange={(value) => handleInputChange("farmerProfile.farmingType", value)}
                      >
                        <SelectTrigger id="farmingType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {farmingTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Crops</Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {(formData.farmerProfile?.crops || []).map((crop) => (
                          <Badge key={crop} variant="secondary" className="gap-1">
                            {crop}
                            <button
                              type="button"
                              onClick={() => removeCrop(crop)}
                              className="ml-1 rounded-full hover:bg-muted"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Select value={newCrop} onValueChange={setNewCrop}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select a crop" />
                          </SelectTrigger>
                          <SelectContent>
                            {cropTypes
                              .filter((c) => !(formData.farmerProfile?.crops || []).includes(c))
                              .map((crop) => (
                                <SelectItem key={crop} value={crop}>
                                  {crop}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <Button type="button" variant="outline" size="icon" onClick={addCrop}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {user.role === "expert" && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="experience">Years of Experience</Label>
                        <Input
                          id="experience"
                          type="number"
                          min={0}
                          value={formData.expertProfile?.experience || 0}
                          onChange={(e) => handleInputChange("expertProfile.experience", Number.parseInt(e.target.value) || 0)}
                          placeholder="Enter years"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="consultationFee">Consultation Fee (INR)</Label>
                        <Input
                          id="consultationFee"
                          type="number"
                          min={0}
                          value={formData.expertProfile?.consultationFee || 0}
                          onChange={(e) => handleInputChange("expertProfile.consultationFee", Number.parseInt(e.target.value) || 0)}
                          placeholder="Enter fee"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Specializations</Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {(formData.expertProfile?.specializations || []).map((spec) => (
                          <Badge key={spec} variant="secondary" className="gap-1">
                            {spec}
                            <button
                              type="button"
                              onClick={() => removeSpecialization(spec)}
                              className="ml-1 rounded-full hover:bg-muted"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Select value={newSpecialization} onValueChange={setNewSpecialization}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select specialization" />
                          </SelectTrigger>
                          <SelectContent>
                            {expertSpecializations
                              .filter((s) => !(formData.expertProfile?.specializations || []).includes(s))
                              .map((spec) => (
                                <SelectItem key={spec} value={spec}>
                                  {spec}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <Button type="button" variant="outline" size="icon" onClick={addSpecialization}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {user.role === "consumer" && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <User className="mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="text-lg font-medium">Consumer Profile</h3>
                    <p className="text-sm text-muted-foreground">
                      No additional profile settings required for consumers.
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* Preferences Tab */}
              <TabsContent value="preferences" className="mt-0 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="language" className="text-base">Language</Label>
                      <p className="text-sm text-muted-foreground">
                        Select your preferred language
                      </p>
                    </div>
                    <Select
                      value={formData.preferences?.language || "en"}
                      onValueChange={(value) => handleInputChange("preferences.language", value)}
                    >
                      <SelectTrigger id="language" className="w-[180px]">
                        <Globe className="mr-2 h-4 w-4" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Notifications</h4>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="emailNotif">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive updates via email
                        </p>
                      </div>
                      <Switch
                        id="emailNotif"
                        checked={formData.preferences?.notifications?.email ?? true}
                        onCheckedChange={(checked) => handleInputChange("preferences.notifications.email", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="smsNotif">SMS Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive updates via SMS
                        </p>
                      </div>
                      <Switch
                        id="smsNotif"
                        checked={formData.preferences?.notifications?.sms ?? true}
                        onCheckedChange={(checked) => handleInputChange("preferences.notifications.sms", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="pushNotif">Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive browser push notifications
                        </p>
                      </div>
                      <Switch
                        id="pushNotif"
                        checked={formData.preferences?.notifications?.push ?? false}
                        onCheckedChange={(checked) => handleInputChange("preferences.notifications.push", checked)}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="newsletter">Newsletter</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive our weekly newsletter with tips and updates
                      </p>
                    </div>
                    <Switch
                      id="newsletter"
                      checked={formData.preferences?.newsletter ?? true}
                      onCheckedChange={(checked) => handleInputChange("preferences.newsletter", checked)}
                    />
                  </div>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>

      {/* Quick Links */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Related Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          <Link
            href="/dashboard/settings/security"
            className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Building className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Security Settings</p>
                <p className="text-sm text-muted-foreground">Password, sessions, and more</p>
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
                <User className="h-5 w-5 text-primary" />
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
