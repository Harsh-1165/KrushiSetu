"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { Calendar as CalendarIcon, MapPin, Truck, CreditCard, Wallet, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { useCart } from "@/contexts/cart-context"
import { apiUrl, fetchWithAuth } from "@/lib/api"

const checkoutSchema = z.object({
    fullName: z.string().min(2, "Name is required"),
    phone: z.string().min(10, "Valid phone number is required"),
    street: z.string().min(5, "Address is required"),
    city: z.string().min(2, "City is required"),
    state: z.string().min(2, "State is required"),
    pincode: z.string().min(6, "Valid Pincode is required"),
    district: z.string().min(2, "District is required"),
    deliveryDate: z.date({ required_error: "Delivery date is required" }),
    paymentMethod: z.enum(["cod", "online"], { required_error: "Payment method is required" })
})

type CheckoutFormValues = z.infer<typeof checkoutSchema>

export default function CheckoutPage() {
    const router = useRouter()
    const { items, subtotal, clearCart, count } = useCart()
    const [submitting, setSubmitting] = useState(false)

    // Redirect if cart is empty — but wait 3s to avoid false redirect after order error
    useEffect(() => {
        if (items.length === 0) {
            const timer = setTimeout(() => {
                if (items.length === 0) router.push("/dashboard/cart")
            }, 3000)
            return () => clearTimeout(timer)
        }
    }, [items, router])

    const form = useForm<CheckoutFormValues>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: {
            paymentMethod: "cod"
        }
    })

    const shipping = subtotal >= 500 ? 0 : 50
    const total = subtotal + shipping

    const onSubmit = async (values: CheckoutFormValues) => {
        setSubmitting(true)
        try {
            const payload = {
                items: items.map(item => ({ productId: item.product._id, quantity: item.quantity })),
                shippingAddress: {
                    fullName: values.fullName,
                    phone: values.phone,
                    street: values.street,
                    city: values.city,
                    state: values.state,
                    district: values.district,
                    pincode: values.pincode,
                    country: "India"
                },
                billingAddress: {
                    fullName: values.fullName,
                    phone: values.phone,
                    street: values.street,
                    city: values.city,
                    state: values.state,
                    district: values.district,
                    pincode: values.pincode,
                    country: "India"
                },
                paymentMethod: values.paymentMethod === "online" ? "card" : "cod",
                deliveryMethod: "standard",
                buyerNote: `Delivery Date: ${format(values.deliveryDate, "yyyy-MM-dd")}`
            }

            const res = await fetchWithAuth(apiUrl("/orders"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.message || "Failed to place order")
            }

            toast.success("Order placed successfully!")
            clearCart()
            router.push("/dashboard/orders")
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Something went wrong")
        } finally {
            setSubmitting(false)
        }
    }

    if (items.length === 0) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">Loading cart...</p>
            </div>
        )
    }

    return (
        <div className="container max-w-5xl py-8">
            <h1 className="text-3xl font-bold mb-8">Checkout</h1>

            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-8 md:grid-cols-3">

                {/* Left Column: Address & Payment */}
                <div className="md:col-span-2 space-y-8">

                    {/* Delivery Address */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5" /> Delivery Address
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Full Name</Label>
                                    <Input id="fullName" {...form.register("fullName")} placeholder="John Doe" />
                                    {form.formState.errors.fullName && <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input id="phone" {...form.register("phone")} placeholder="+91 9876543210" />
                                    {form.formState.errors.phone && <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="street">Address (House No, Street, Area)</Label>
                                <Input id="street" {...form.register("street")} placeholder="123 Green Street" />
                                {form.formState.errors.street && <p className="text-sm text-destructive">{form.formState.errors.street.message}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input id="city" {...form.register("city")} placeholder="City" />
                                    {form.formState.errors.city && <p className="text-sm text-destructive">{form.formState.errors.city.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="district">District</Label>
                                    <Input id="district" {...form.register("district")} placeholder="District" />
                                    {form.formState.errors.district && <p className="text-sm text-destructive">{form.formState.errors.district.message}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="state">State</Label>
                                    <Input id="state" {...form.register("state")} placeholder="State" />
                                    {form.formState.errors.state && <p className="text-sm text-destructive">{form.formState.errors.state.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pincode">Pincode</Label>
                                    <Input id="pincode" {...form.register("pincode")} placeholder="123456" />
                                    {form.formState.errors.pincode && <p className="text-sm text-destructive">{form.formState.errors.pincode.message}</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Delivery Date */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Truck className="h-5 w-5" /> Delivery Date
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col space-y-2">
                                <Label>Preferred Delivery Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-[240px] pl-3 text-left font-normal",
                                                !form.getValues("deliveryDate") && "text-muted-foreground"
                                            )}
                                        >
                                            {form.watch("deliveryDate") ? (
                                                format(form.watch("deliveryDate"), "PPP")
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={form.watch("deliveryDate")}
                                            onSelect={(date) => date && form.setValue("deliveryDate", date)}
                                            disabled={(date) =>
                                                date < new Date() || date < new Date("1900-01-01")
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                {form.formState.errors.deliveryDate && <p className="text-sm text-destructive">{form.formState.errors.deliveryDate.message}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Method */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Wallet className="h-5 w-5" /> Payment Method
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <RadioGroup
                                defaultValue="cod"
                                onValueChange={(val) => form.setValue("paymentMethod", val as "cod" | "online")}
                                className="grid grid-cols-2 gap-4"
                            >
                                <div>
                                    <RadioGroupItem value="cod" id="cod" className="peer sr-only" />
                                    <Label
                                        htmlFor="cod"
                                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                    >
                                        <Truck className="mb-3 h-6 w-6" />
                                        Cash on Delivery
                                    </Label>
                                </div>
                                <div>
                                    <RadioGroupItem value="online" id="online" className="peer sr-only" />
                                    <Label
                                        htmlFor="online"
                                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                    >
                                        <CreditCard className="mb-3 h-6 w-6" />
                                        Online Payment
                                    </Label>
                                </div>
                            </RadioGroup>
                            {form.formState.errors.paymentMethod && <p className="text-sm text-destructive mt-2">{form.formState.errors.paymentMethod.message}</p>}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Summary */}
                <div className="md:col-span-1">
                    <Card className="sticky top-6">
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                {items.map((item) => (
                                    <div key={item.product._id} className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            {item.quantity} x {item.product.name}
                                        </span>
                                        <span className="font-medium">
                                            ₹{(item.product.price.current * item.quantity).toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <Separator />

                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>₹{subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Shipping</span>
                                <span>{shipping === 0 ? "Free" : `₹${shipping}`}</span>
                            </div>

                            <Separator />

                            <div className="flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>₹{total.toLocaleString()}</span>
                            </div>

                            {shipping === 0 && (
                                <p className="text-xs text-green-600">
                                    You aren't paying for shipping on this order!
                                </p>
                            )}

                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full"
                                size="lg"
                                onClick={form.handleSubmit(onSubmit)}
                                disabled={submitting}
                            >
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {submitting ? "Placing Order..." : "Place Order"}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </form>
        </div>
    )
}
