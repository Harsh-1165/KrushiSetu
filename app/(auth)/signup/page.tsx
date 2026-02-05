"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Tractor,
  GraduationCap,
  ShoppingBag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
// import {
//   registerUser,
//   checkPasswordStrength,
//   indianStates,
//   cropTypes,
//   expertSpecializations,
//   consumerInterests,
//   type RegisterData,
// } from "@/lib/auth"

// Fallback mocks for UI development if imports fail - keeping imports at top but defining loose types locally to prevent break
const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
]
const cropTypes = [
  "Rice", "Wheat", "Maize", "Pulses", "Sugarcane",
  "Cotton", "Vegetables", "Fruits", "Spices", "Oilseeds",
  "Tea", "Coffee", "Rubber", "Jute", "Tobacco"
]
const expertSpecializations = [
  "Soil Science", "Plant Pathology", "Entomology", "Agronomy",
  "Horticulture", "Agricultural Economics", "Organic Farming",
  "Irrigation Management", "Post-Harvest Technology",
  "Animal Husbandry", "Aquaculture", "Agricultural Engineering"
]
const consumerInterests = [
  "Fresh Vegetables", "Organic Fruits", "Exotic Fruits", "Grains & Pulses",
  "Spices & Condiments", "Dairy Products", "Organic Honey", "Herbs",
  "Homemade Pickles", "Dry Fruits"
]

// Mock Check - replace with actual import if available
const checkPasswordStrength = (pass: string) => {
  const requirements = [
    { regex: /.{8,}/, label: "At least 8 characters" },
    { regex: /[A-Z]/, label: "One uppercase letter" },
    { regex: /[a-z]/, label: "One lowercase letter" },
    { regex: /[0-9]/, label: "One number" },
    { regex: /[^A-Za-z0-9]/, label: "One special character" },
  ]

  const passed = requirements.filter(req => req.regex.test(pass))
  const score = passed.length

  let strength = "weak"
  if (score >= 5) strength = "strong"
  else if (score >= 3) strength = "good"

  return { strength, score, requirements: requirements.map(req => ({ label: req.label, met: req.regex.test(pass) })) }
}

// ... imports ...
import { registerUser } from "@/lib/auth"

type UserRole = "farmer" | "expert" | "consumer"
const roles = [
  {
    id: "farmer" as const,
    title: "Farmer",
    description: "Sell your produce directly to consumers",
    icon: Tractor,
    color: "from-green-500/20 to-emerald-500/20",
    hoverColor: "group-hover:text-green-400"
  },
  {
    id: "expert" as const,
    title: "Agricultural Expert",
    description: "Provide advisory services to farmers",
    icon: GraduationCap,
    color: "from-amber-500/20 to-orange-500/20",
    hoverColor: "group-hover:text-amber-400"
  },
  {
    id: "consumer" as const,
    title: "Consumer",
    description: "Buy fresh produce from farmers",
    icon: ShoppingBag,
    color: "from-blue-500/20 to-cyan-500/20",
    hoverColor: "group-hover:text-blue-400"
  },
]

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = React.useState(1)
  const [selectedRole, setSelectedRole] = React.useState<UserRole | null>(null)
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [agreedToTerms, setAgreedToTerms] = React.useState(false)

  const [formData, setFormData] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    state: "",
    district: "",
    village: "",
    // Farmer specific
    farmName: "",
    farmSize: "",
    farmingExperience: "",
    crops: [] as string[],
    // Expert specific
    expertExperience: "",
    specializations: [] as string[],
    credentials: "",
    // Consumer specific
    interests: [] as string[],
  })

  const passwordValidation = checkPasswordStrength(formData.password)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError("")
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError("")
  }

  const handleMultiSelect = (name: string, value: string) => {
    setFormData((prev) => {
      // @ts-ignore
      const current = prev[name] as string[]
      if (current.includes(value)) {
        return { ...prev, [name]: current.filter((v) => v !== value) }
      }
      return { ...prev, [name]: [...current, value] }
    })
  }

  const validateStep = () => {
    if (step === 1) {
      return selectedRole !== null
    }

    if (step === 2) {
      if (!formData.firstName.trim()) { setError("First name is required"); return false; }
      if (!formData.lastName.trim()) { setError("Last name is required"); return false; }
      if (!formData.email.trim()) { setError("Email is required"); return false; }
      if (!formData.phone.trim()) { setError("Phone is required"); return false; }
      if (!formData.password) { setError("Password is required"); return false; }
      if (passwordValidation.score < 5) { setError("Please meet all password requirements"); return false; }
      if (formData.password !== formData.confirmPassword) { setError("Passwords do not match"); return false; }
      return true
    }

    if (step === 3) {
      if (!formData.state) { setError("State is required"); return false; }
      if (!formData.district) { setError("District is required"); return false; }

      if (selectedRole === "farmer") {
        if (!formData.farmName) { setError("Farm Name is required"); return false; }
        if (formData.crops.length === 0) { setError("Select at least one crop"); return false; }
      }

      if (selectedRole === "expert") {
        if (formData.specializations.length === 0) { setError("Select at least one specialization"); return false; }
      }

      if (selectedRole === "consumer") {
        // Interests optional? Let's make it optional or require 1
      }
      return true
    }

    return true
  }

  const handleNext = () => {
    if (validateStep()) {
      setStep((prev) => prev + 1)
      setError("")
    }
  }

  const handleBack = () => {
    setStep((prev) => prev - 1)
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep()) return

    setIsLoading(true)
    setError("")

    try {
      const registrationData: any = {
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        name: {
          first: formData.firstName,
          last: formData.lastName,
        },
        phone: formData.phone,
        role: selectedRole!,
        location: {
          state: formData.state,
          district: formData.district,
          village: formData.village,
        },
      }

      if (selectedRole === 'farmer') {
        registrationData.farmerProfile = {
          farmName: formData.farmName,
          farmSize: Number(formData.farmSize),
          experience: Number(formData.farmingExperience),
          crops: formData.crops
        }
      } else if (selectedRole === 'expert') {
        registrationData.expertProfile = {
          experience: Number(formData.expertExperience),
          credentials: formData.credentials,
          specializations: formData.specializations
        }
      } else if (selectedRole === 'consumer') {
        registrationData.consumerProfile = { // Note: Backend needs to handle this or ignore
          interests: formData.interests
        }
      }

      const response = await registerUser(registrationData)

      if (response.success) {
        router.push("/verify-email?registered=true")
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Registration failed")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleAgreement = () => {
    setAgreedToTerms(!agreedToTerms)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Create an account</h1>
        <p className="text-zinc-400">
          Step {step} of 3
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300",
                step >= s
                  ? "bg-green-500 text-black shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                  : "bg-white/10 text-zinc-500 border border-white/5"
              )}
            >
              {step > s ? <CheckCircle2 className="h-5 w-5" /> : s}
            </div>
            {s < 3 && (
              <div
                className={cn(
                  "w-12 h-1 rounded-full transition-all duration-300",
                  step > s ? "bg-green-500" : "bg-white/10"
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {error && (
        <Alert variant="destructive" className="bg-red-900/10 border-red-900/20 text-red-400">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {/* Step 1: Role Selection */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="space-y-3">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    className={cn(
                      "w-full p-4 rounded-xl border transition-all duration-300 relative overflow-hidden group text-left",
                      selectedRole === role.id
                        ? "border-green-500/50 bg-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                        : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                    )}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${role.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                    <div className="relative flex items-center gap-4 z-10">
                      <div className={cn("h-12 w-12 rounded-lg flex items-center justify-center transition-colors", selectedRole === role.id ? "bg-green-500 text-black" : "bg-black/40 text-zinc-400 group-hover:text-white")}>
                        <role.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className={cn("font-bold text-lg transition-colors text-white", selectedRole === role.id ? "text-green-400" : "")}>{role.title}</p>
                        <p className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">{role.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <Button type="button" className="w-full bg-green-500 hover:bg-green-400 text-black font-semibold h-11 rounded-xl mt-4" size="lg" onClick={handleNext} disabled={!selectedRole}>
                Continue <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </motion.div>
          )}

          {/* Step 2: Basic Information */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-zinc-400 ml-1">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input id="firstName" name="firstName" placeholder="John" className="pl-10 bg-white/5 border-white/10 text-white focus:border-green-500/50 rounded-xl" value={formData.firstName} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-zinc-400 ml-1">Last Name</Label>
                  <Input id="lastName" name="lastName" placeholder="Doe" className="bg-white/5 border-white/10 text-white focus:border-green-500/50 rounded-xl" value={formData.lastName} onChange={handleInputChange} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-400 ml-1">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input id="email" name="email" type="email" placeholder="name@example.com" className="pl-10 bg-white/5 border-white/10 text-white focus:border-green-500/50 rounded-xl" value={formData.email} onChange={handleInputChange} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-zinc-400 ml-1">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input id="phone" name="phone" type="tel" placeholder="9876543210" className="pl-10 bg-white/5 border-white/10 text-white focus:border-green-500/50 rounded-xl" value={formData.phone} onChange={handleInputChange} maxLength={10} />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-400 ml-1">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    className="pl-10 pr-10 bg-white/5 border-white/10 text-white focus:border-green-500/50 rounded-xl"
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Detailed Password Requirements */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {passwordValidation.requirements.map((req, i) => (
                    <div key={i} className="flex items-center text-xs gap-1.5">
                      <div className={cn("h-4 w-4 rounded-full flex items-center justify-center shrink-0", req.met ? "bg-green-500/20 text-green-500" : "bg-white/5 text-zinc-500")}>
                        {req.met ? <CheckCircle2 className="h-2.5 w-2.5" /> : <div className="h-1.5 w-1.5 rounded-full bg-zinc-600" />}
                      </div>
                      <span className={cn(req.met ? "text-green-400" : "text-zinc-500")}>{req.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-zinc-400 ml-1">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Confirm password" className="pl-10 pr-10 bg-white/5 border-white/10 text-white focus:border-green-500/50 rounded-xl" value={formData.confirmPassword} onChange={handleInputChange} />
                </div>
                {formData.confirmPassword && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs">
                    {formData.password === formData.confirmPassword ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-green-500">Passwords match</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                        <span className="text-red-500">Passwords do not match</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1 bg-transparent border-white/10 text-white hover:bg-white/10 hover:text-white rounded-xl" size="lg" onClick={handleBack}>
                  Back
                </Button>
                <Button type="button" className="flex-1 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-xl" size="lg" onClick={handleNext}>
                  Continue
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Role-Specific Details */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Common Location Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-400 ml-1">State</Label>
                  <Select value={formData.state} onValueChange={(val) => handleSelectChange("state", val)}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl">
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10 text-white">
                      {indianStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400 ml-1">District</Label>
                  <Input name="district" value={formData.district} onChange={handleInputChange} placeholder="District" className="bg-white/5 border-white/10 text-white rounded-xl" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-400 ml-1">Village/Town (Optional)</Label>
                <Input name="village" value={formData.village} onChange={handleInputChange} placeholder="Enter village or town" className="bg-white/5 border-white/10 text-white rounded-xl" />
              </div>

              {/* Farmer Fields */}
              {selectedRole === "farmer" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-400 ml-1">Farm Name</Label>
                    <Input name="farmName" value={formData.farmName} onChange={handleInputChange} placeholder="Enter your farm name" className="bg-white/5 border-white/10 text-white rounded-xl" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-zinc-400 ml-1">Farm Size (acres)</Label>
                      <Input name="farmSize" type="number" value={formData.farmSize} onChange={handleInputChange} placeholder="e.g., 5" className="bg-white/5 border-white/10 text-white rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-400 ml-1">Experience (years)</Label>
                      <Input name="farmingExperience" type="number" value={formData.farmingExperience} onChange={handleInputChange} placeholder="e.g., 10" className="bg-white/5 border-white/10 text-white rounded-xl" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-400 ml-1">Crop Types (select all that apply)</Label>
                    <div className="flex flex-wrap gap-2">
                      {cropTypes.map(crop => (
                        <button
                          key={crop}
                          type="button"
                          onClick={() => handleMultiSelect("crops", crop)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-sm border transition-all",
                            formData.crops.includes(crop) ? "bg-green-500 text-black border-green-500" : "bg-white/5 border-white/10 text-zinc-400 hover:border-green-500/50"
                          )}
                        >
                          {crop}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Expert Fields */}
              {selectedRole === "expert" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-400 ml-1">Professional Experience (years)</Label>
                    <Input name="expertExperience" type="number" value={formData.expertExperience} onChange={handleInputChange} placeholder="e.g., 5" className="bg-white/5 border-white/10 text-white rounded-xl" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-400 ml-1">Specializations (select all that apply)</Label>
                    <div className="flex flex-wrap gap-2">
                      {expertSpecializations.map(spec => (
                        <button
                          key={spec}
                          type="button"
                          onClick={() => handleMultiSelect("specializations", spec)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-sm border transition-all",
                            formData.specializations.includes(spec) ? "bg-amber-500 text-black border-amber-500" : "bg-white/5 border-white/10 text-zinc-400 hover:border-amber-500/50"
                          )}
                        >
                          {spec}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-400 ml-1">Credentials/Certifications</Label>
                    <Input name="credentials" value={formData.credentials} onChange={handleInputChange} placeholder="e.g., PhD in Agriculture, Certified Agronomist" className="bg-white/5 border-white/10 text-white rounded-xl" />
                  </div>
                </div>
              )}

              {/* Consumer Fields */}
              {selectedRole === "consumer" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-400 ml-1">Interests (select all that apply)</Label>
                    <div className="flex flex-wrap gap-2">
                      {consumerInterests.map(interest => (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => handleMultiSelect("interests", interest)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-sm border transition-all",
                            formData.interests.includes(interest) ? "bg-blue-500 text-black border-blue-500" : "bg-white/5 border-white/10 text-zinc-400 hover:border-blue-500/50"
                          )}
                        >
                          {interest}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Terms Agreement */}
              <div className="flex items-center space-x-2 pt-4">
                <button
                  type="button"
                  onClick={toggleAgreement}
                  className={cn("h-5 w-5 rounded border flex items-center justify-center transition-colors", agreedToTerms ? "bg-green-500 border-green-500 text-black" : "border-zinc-500 bg-transparent")}
                >
                  {agreedToTerms && <CheckCircle2 className="h-3.5 w-3.5" />}
                </button>
                <Label onClick={toggleAgreement} className="text-sm text-zinc-400 cursor-pointer">
                  I agree to the <span className="text-green-500 hover:underline">Terms of Service</span> and <span className="text-green-500 hover:underline">Privacy Policy</span>
                </Label>
              </div>

              <div className="flex gap-3 pt-6">
                <Button type="button" variant="outline" className="flex-1 bg-transparent border-white/10 text-white hover:bg-white/10 hover:text-white rounded-xl" size="lg" onClick={handleBack}>
                  Back
                </Button>
                <Button type="submit" className="flex-1 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.4)]" size="lg" disabled={isLoading || !agreedToTerms}>
                  {isLoading ? <Loader2 className="animate-spin" /> : "Create Account"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </motion.div>
  )
}
