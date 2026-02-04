"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Wallet,
  Building2,
  Truck,
  Package,
  Shield,
  Check,
  ChevronDown,
  Leaf,
  MapPin,
  Phone,
  User,
  Mail,
  Home,
  AlertCircle,
  Loader2,
  Tag,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { useCart } from "@/lib/cart-context"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// Indian states for address
const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir", "Ladakh"
]

// Payment methods
const paymentMethods = [
  { id: "cod", name: "Cash on Delivery", icon: Truck, description: "Pay when you receive" },
  { id: "upi", name: "UPI", icon: Wallet, description: "Google Pay, PhonePe, etc." },
  { id: "card", name: "Credit/Debit Card", icon: CreditCard, description: "Visa, Mastercard, etc." },
  { id: "netbanking", name: "Net Banking", icon: Building2, description: "All major banks" },
]

interface ShippingAddress {
  fullName: string
  phone: string
  alternatePhone: string
  email: string
  street: string
  landmark: string
  city: string
  district: string
  state: string
  pincode: string
  addressType: "home" | "office" | "farm" | "other"
}

export default function CheckoutPage() {
  const router = useRouter()
  const {
    state: cartState,
    getSubtotal,
    getTax,
    getShipping,
    getTotal,
    getTotalItems,
    clearCart,
  } = useCart()

  // Form state
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)

  // Shipping address state
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: "",
    phone: "",
    alternatePhone: "",
    email: "",
    street: "",
    landmark: "",
    city: "",
    district: "",
    state: "",
    pincode: "",
    addressType: "home",
  })

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState("cod")
  const [saveAddress, setSaveAddress] = useState(true)

  // Coupon state
  const [couponCode, setCouponCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; percentage: number } | null>(null)
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)

  // Order note
  const [orderNote, setOrderNote] = useState("")

  // Form validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Calculate totals
  const subtotal = getSubtotal()
  const tax = getTax()
  const shipping = getShipping()
  const couponDiscount = appliedCoupon ? Math.round((subtotal * appliedCoupon.percentage) / 100) : 0
  const total = subtotal + tax + shipping - couponDiscount

  // Redirect if cart is empty
  useEffect(() => {
    if (cartState.items.length === 0 && !orderComplete) {
      router.push("/marketplace/cart")
    }
  }, [cartState.items.length, orderComplete, router])

  // Validate shipping form
  const validateShippingForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!shippingAddress.fullName.trim()) {
      newErrors.fullName = "Full name is required"
    }

    if (!shippingAddress.phone.trim()) {
      newErrors.phone = "Phone number is required"
    } else if (!/^[6-9]\d{9}$/.test(shippingAddress.phone)) {
      newErrors.phone = "Please enter a valid 10-digit mobile number"
    }

    if (shippingAddress.email && !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(shippingAddress.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!shippingAddress.street.trim()) {
      newErrors.street = "Address is required"
    }

    if (!shippingAddress.city.trim()) {
      newErrors.city = "City is required"
    }

    if (!shippingAddress.district.trim()) {
      newErrors.district = "District is required"
    }

    if (!shippingAddress.state) {
      newErrors.state = "State is required"
    }

    if (!shippingAddress.pincode.trim()) {
      newErrors.pincode = "Pincode is required"
    } else if (!/^[1-9][0-9]{5}$/.test(shippingAddress.pincode)) {
      newErrors.pincode = "Please enter a valid 6-digit pincode"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle address input change
  const handleAddressChange = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  // Handle step navigation
  const handleNextStep = () => {
    if (currentStep === 1 && validateShippingForm()) {
      setCurrentStep(2)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  // Handle coupon application
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return

    setIsApplyingCoupon(true)

    // Simulating API call for coupon validation
    setTimeout(() => {
      const validCoupons: Record<string, { discount: number; minOrder: number }> = {
        "FRESH10": { discount: 10, minOrder: 100 },
        "ORGANIC20": { discount: 20, minOrder: 300 },
        "WELCOME15": { discount: 15, minOrder: 0 },
        "FARM25": { discount: 25, minOrder: 500 },
      }

      const coupon = validCoupons[couponCode.toUpperCase()]
      
      if (coupon) {
        if (subtotal >= coupon.minOrder) {
          const discountAmount = Math.round((subtotal * coupon.discount) / 100)
          setAppliedCoupon({ 
            code: couponCode.toUpperCase(), 
            discount: discountAmount,
            percentage: coupon.discount 
          })
          toast.success(`Coupon applied! ${coupon.discount}% discount`)
        } else {
          toast.error(`Minimum order of Rs. ${coupon.minOrder} required for this coupon`)
        }
      } else {
        toast.error("Invalid coupon code")
      }

      setIsApplyingCoupon(false)
    }, 500)
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode("")
    toast.success("Coupon removed")
  }

  // Handle order submission
  const handlePlaceOrder = async () => {
    setIsSubmitting(true)

    try {
      // Prepare order data
      const orderData = {
        items: cartState.items.map((item) => ({
          productId: item._id,
          quantity: item.quantity,
        })),
        shippingAddress: {
          ...shippingAddress,
        },
        paymentMethod,
        couponCode: appliedCoupon?.code || null,
        buyerNote: orderNote,
        deliveryMethod: "standard",
      }

      // In production, this would be an API call
      // const response = await fetch('/api/v1/orders', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(orderData),
      // })

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Generate mock order ID
      const mockOrderId = `GT${Date.now().toString(36).toUpperCase()}`
      
      setOrderId(mockOrderId)
      setOrderComplete(true)
      clearCart()
      
      toast.success("Order placed successfully!")
    } catch (error) {
      toast.error("Failed to place order. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Order confirmation screen
  if (orderComplete && orderId) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-foreground">Order Confirmed!</h1>
          <p className="text-muted-foreground mt-2">
            Thank you for your order. We've sent a confirmation to your email.
          </p>

          <Card className="mt-8">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Order Number</span>
                  <span className="font-bold text-lg">{orderId}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="capitalize">{paymentMethod === "cod" ? "Cash on Delivery" : paymentMethod}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-bold text-primary text-lg">Rs. {total.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Estimated Delivery</span>
                  <span>3-7 business days</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" asChild>
              <Link href="/marketplace">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Continue Shopping
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard">
                View My Orders
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>

          {/* Trust badges */}
          <div className="mt-12 grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-medium">Secure Payment</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-medium">Fast Delivery</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-medium">Quality Assured</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" className="mb-4" asChild>
          <Link href="/marketplace/cart">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cart
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Checkout</h1>
        <p className="text-muted-foreground">{getTotalItems()} items in your order</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center">
          {[
            { step: 1, label: "Shipping" },
            { step: 2, label: "Payment" },
          ].map((item, index) => (
            <React.Fragment key={item.step}>
              <div className="flex items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors",
                    currentStep >= item.step
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {currentStep > item.step ? <Check className="h-5 w-5" /> : item.step}
                </div>
                <span
                  className={cn(
                    "ml-2 font-medium",
                    currentStep >= item.step ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              </div>
              {index < 1 && (
                <div
                  className={cn(
                    "w-20 h-1 mx-4 rounded",
                    currentStep > 1 ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Shipping Address */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
                <CardDescription>
                  Where should we deliver your order?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Name and Phone */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      Full Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      placeholder="Enter your full name"
                      value={shippingAddress.fullName}
                      onChange={(e) => handleAddressChange("fullName", e.target.value)}
                      className={cn(errors.fullName && "border-destructive")}
                    />
                    {errors.fullName && (
                      <p className="text-sm text-destructive">{errors.fullName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      Phone Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={shippingAddress.phone}
                      onChange={(e) => handleAddressChange("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className={cn(errors.phone && "border-destructive")}
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive">{errors.phone}</p>
                    )}
                  </div>
                </div>

                {/* Alternate Phone and Email */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="alternatePhone" className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      Alternate Phone (Optional)
                    </Label>
                    <Input
                      id="alternatePhone"
                      type="tel"
                      placeholder="Alternate contact number"
                      value={shippingAddress.alternatePhone}
                      onChange={(e) => handleAddressChange("alternatePhone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      Email (Optional)
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="For order updates"
                      value={shippingAddress.email}
                      onChange={(e) => handleAddressChange("email", e.target.value)}
                      className={cn(errors.email && "border-destructive")}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="street" className="flex items-center gap-1">
                    <Home className="h-4 w-4" />
                    Address <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="street"
                    placeholder="House/Flat No., Building, Street, Area"
                    value={shippingAddress.street}
                    onChange={(e) => handleAddressChange("street", e.target.value)}
                    className={cn(errors.street && "border-destructive")}
                    rows={2}
                  />
                  {errors.street && (
                    <p className="text-sm text-destructive">{errors.street}</p>
                  )}
                </div>

                {/* Landmark */}
                <div className="space-y-2">
                  <Label htmlFor="landmark">Landmark (Optional)</Label>
                  <Input
                    id="landmark"
                    placeholder="Near temple, school, etc."
                    value={shippingAddress.landmark}
                    onChange={(e) => handleAddressChange("landmark", e.target.value)}
                  />
                </div>

                {/* City and District */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="city">
                      City <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="city"
                      placeholder="City/Town/Village"
                      value={shippingAddress.city}
                      onChange={(e) => handleAddressChange("city", e.target.value)}
                      className={cn(errors.city && "border-destructive")}
                    />
                    {errors.city && (
                      <p className="text-sm text-destructive">{errors.city}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="district">
                      District <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="district"
                      placeholder="District"
                      value={shippingAddress.district}
                      onChange={(e) => handleAddressChange("district", e.target.value)}
                      className={cn(errors.district && "border-destructive")}
                    />
                    {errors.district && (
                      <p className="text-sm text-destructive">{errors.district}</p>
                    )}
                  </div>
                </div>

                {/* State and Pincode */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="state">
                      State <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={shippingAddress.state}
                      onValueChange={(value) => handleAddressChange("state", value)}
                    >
                      <SelectTrigger className={cn(errors.state && "border-destructive")}>
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
                    {errors.state && (
                      <p className="text-sm text-destructive">{errors.state}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode">
                      Pincode <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="pincode"
                      placeholder="6-digit pincode"
                      value={shippingAddress.pincode}
                      onChange={(e) => handleAddressChange("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className={cn(errors.pincode && "border-destructive")}
                    />
                    {errors.pincode && (
                      <p className="text-sm text-destructive">{errors.pincode}</p>
                    )}
                  </div>
                </div>

                {/* Address Type */}
                <div className="space-y-2">
                  <Label>Address Type</Label>
                  <RadioGroup
                    value={shippingAddress.addressType}
                    onValueChange={(value) => handleAddressChange("addressType", value as ShippingAddress["addressType"])}
                    className="flex flex-wrap gap-4"
                  >
                    {[
                      { value: "home", label: "Home" },
                      { value: "office", label: "Office" },
                      { value: "farm", label: "Farm" },
                      { value: "other", label: "Other" },
                    ].map((type) => (
                      <div key={type.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={type.value} id={`address-${type.value}`} />
                        <Label htmlFor={`address-${type.value}`} className="cursor-pointer">
                          {type.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Save Address Checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="saveAddress"
                    checked={saveAddress}
                    onCheckedChange={(checked) => setSaveAddress(checked as boolean)}
                  />
                  <Label htmlFor="saveAddress" className="cursor-pointer text-sm">
                    Save this address for future orders
                  </Label>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleNextStep} className="ml-auto">
                  Continue to Payment
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Step 2: Payment */}
          {currentStep === 2 && (
            <>
              {/* Shipping Address Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Shipping Address
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)}>
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-1">
                    <p className="font-medium">{shippingAddress.fullName}</p>
                    <p className="text-muted-foreground">{shippingAddress.street}</p>
                    {shippingAddress.landmark && (
                      <p className="text-muted-foreground">Near {shippingAddress.landmark}</p>
                    )}
                    <p className="text-muted-foreground">
                      {shippingAddress.city}, {shippingAddress.district}
                    </p>
                    <p className="text-muted-foreground">
                      {shippingAddress.state} - {shippingAddress.pincode}
                    </p>
                    <p className="text-muted-foreground">Phone: {shippingAddress.phone}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Method
                  </CardTitle>
                  <CardDescription>Choose how you'd like to pay</CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                    className="space-y-3"
                  >
                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        className={cn(
                          "flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors",
                          paymentMethod === method.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/50"
                        )}
                        onClick={() => setPaymentMethod(method.id)}
                      >
                        <RadioGroupItem value={method.id} id={method.id} />
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <method.icon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <Label htmlFor={method.id} className="cursor-pointer font-medium">
                              {method.name}
                            </Label>
                            <p className="text-sm text-muted-foreground">{method.description}</p>
                          </div>
                        </div>
                        {method.id === "cod" && (
                          <Badge variant="secondary">Popular</Badge>
                        )}
                      </div>
                    ))}
                  </RadioGroup>

                  {paymentMethod !== "cod" && (
                    <Alert className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        You will be redirected to secure payment page after placing the order.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Order Note */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Order Note (Optional)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Any special instructions for delivery or packing..."
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {orderNote.length}/500 characters
                  </p>
                </CardContent>
              </Card>

              {/* Navigation */}
              <div className="flex gap-4">
                <Button variant="outline" onClick={handlePrevStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    <>
                      Place Order - Rs. {total.toLocaleString()}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Items */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {cartState.items.map((item) => (
                  <div key={item._id} className="flex gap-3">
                    <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted shrink-0">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                      {item.isOrganic && (
                        <Badge
                          variant="secondary"
                          className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-green-100 text-green-800"
                        >
                          <Leaf className="h-3 w-3" />
                        </Badge>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-1">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} x Rs. {item.price}/{item.unit}
                      </p>
                      <p className="text-sm font-medium text-primary">
                        Rs. {(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Coupon Code */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Coupon Code
                </label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                    <div>
                      <p className="font-medium text-green-800">{appliedCoupon.code}</p>
                      <p className="text-sm text-green-600">
                        {appliedCoupon.percentage}% off - Rs. {appliedCoupon.discount} saved
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleRemoveCoupon} className="text-green-800">
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                    />
                    <Button
                      variant="secondary"
                      onClick={handleApplyCoupon}
                      disabled={isApplyingCoupon || !couponCode.trim()}
                    >
                      {isApplyingCoupon ? "..." : "Apply"}
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Try: FRESH10, ORGANIC20, WELCOME15
                </p>
              </div>

              <Separator />

              {/* Price Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal ({getTotalItems()} items)</span>
                  <span>Rs. {subtotal.toLocaleString()}</span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Coupon Discount ({appliedCoupon.percentage}%)</span>
                    <span>- Rs. {couponDiscount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (5%)</span>
                  <span>Rs. {tax.toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className={cn(shipping === 0 && "text-green-600")}>
                    {shipping === 0 ? "FREE" : `Rs. ${shipping}`}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="text-primary">Rs. {total.toLocaleString()}</span>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-2 pt-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>Secure Payment</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Truck className="h-4 w-4 text-primary" />
                  <span>Fast Delivery</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Package className="h-4 w-4 text-primary" />
                  <span>Quality Products</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Leaf className="h-4 w-4 text-primary" />
                  <span>Farm Fresh</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
