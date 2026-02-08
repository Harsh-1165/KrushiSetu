"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Sprout,
    Leaf,
    Upload,
    Loader2,
    CheckCircle2,
    AlertCircle,
    MapPin,
    Calendar,
    ChevronRight,
    Bot
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CropUpload } from "@/components/advisory/crop-upload"
import { apiUrl, fetchWithAuth } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

// Background Animation Components
const FloatingLeaf = ({ delay }: { delay: number }) => (
    <motion.div
        initial={{ y: "110vh", opacity: 0, rotate: 0 }}
        animate={{
            y: "-10vh",
            opacity: [0, 1, 1, 0],
            rotate: 360,
            x: ["0vw", "5vw", "-5vw", "0vw"]
        }}
        transition={{
            duration: 15,
            delay,
            repeat: Infinity,
            ease: "linear"
        }}
        className="absolute text-green-500/10 pointer-events-none"
        style={{ left: `${Math.random() * 100}vw` }}
    >
        <Leaf size={24 + Math.random() * 24} />
    </motion.div>
)

export default function AdvisoryPage() {
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState<"new" | "history">("new")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showAiAnalysis, setShowAiAnalysis] = useState(false)
    const [analyzingStep, setAnalyzingStep] = useState(0)
    const [newAdvisoryId, setNewAdvisoryId] = useState<string | null>(null)
    const [history, setHistory] = useState<any[]>([])
    const [loadingHistory, setLoadingHistory] = useState(true)

    // Form State
    const [formData, setFormData] = useState({
        cropType: "",
        growthStage: "",
        description: "",
        location: user?.location?.village || "",
        images: [] as string[]
    })

    // Fetch History
    useEffect(() => {
        const loadHistory = async () => {
            try {
                const res = await fetchWithAuth(apiUrl("/advisory"))
                const data = await res.json()
                if (data.success) {
                    setHistory(data.data)
                }
            } catch (err) {
                console.error("Failed to load history", err)
            } finally {
                setLoadingHistory(false)
            }
        }
        loadHistory()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setShowAiAnalysis(true)
        setAnalyzingStep(0)

        // Simulate AI Analysis Steps
        const steps = ["Uploading images...", "Scanning crop health...", "Identifying potential issues...", "Generating report..."]

        for (let i = 0; i < steps.length; i++) {
            setAnalyzingStep(i)
            await new Promise(r => setTimeout(r, 800)) // Fake delay
        }

        try {
            const res = await fetchWithAuth(apiUrl("/advisory"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            })

            const data = await res.json()

            if (data.success) {
                setNewAdvisoryId(data.data._id)
                setHistory([data.data, ...history])
                // Reset form
                setFormData({
                    cropType: "",
                    growthStage: "",
                    description: "",
                    location: user?.location?.village || "",
                    images: []
                })
            }
        } catch (err) {
            console.error(err)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-green-900/20 via-black to-amber-900/20">
            {/* Animated Background */}
            {[...Array(8)].map((_, i) => <FloatingLeaf key={i} delay={i * 2} />)}

            <div className="relative z-10 container mx-auto p-6 max-w-5xl space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                            <Sprout className="text-green-500" />
                            Crop Advisory
                        </h1>
                        <p className="text-zinc-400">Get expert advice and instant AI analysis for your crops.</p>
                    </div>
                    <div className="flex bg-white/5 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab("new")}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "new" ? "bg-green-500 text-black shadow-lg" : "text-zinc-400 hover:text-white"}`}
                        >
                            New Request
                        </button>
                        <button
                            onClick={() => setActiveTab("history")}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "history" ? "bg-green-500 text-black shadow-lg" : "text-zinc-400 hover:text-white"}`}
                        >
                            My History
                        </button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === "new" ? (
                        <motion.div
                            key="new"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="grid lg:grid-cols-2 gap-8"
                        >
                            {/* Form Section */}
                            <Card className="bg-black/40 border-green-500/20 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="text-green-400">Submit Crop Details</CardTitle>
                                    <CardDescription>Upload photos and describe the issue.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        {/* Image Upload */}
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-zinc-300">Crop Images</Label>
                                                <CropUpload
                                                    onUpload={(urls) => setFormData({ ...formData, images: urls })}
                                                    maxFiles={3}
                                                />
                                            </div>

                                            {/* Preview Uploaded Images */}
                                            {formData.images.length > 0 && (
                                                <div className="grid grid-cols-3 gap-4">
                                                    {formData.images.map((url, i) => {
                                                        const src = url.startsWith("http")
                                                            ? url
                                                            : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${url}`

                                                        return (
                                                            <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-green-500/50 group">
                                                                <img
                                                                    src={src}
                                                                    alt={`Uploaded crop ${i + 1}`}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                    <CheckCircle2 className="text-green-500 w-8 h-8" />
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-zinc-300">Crop Type</Label>
                                                <Select
                                                    value={formData.cropType}
                                                    onValueChange={(val) => setFormData({ ...formData, cropType: val })}
                                                >
                                                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                                        <SelectValue placeholder="Select crop" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                                                        {["Rice", "Wheat", "Maize", "Cotton", "Sugarcane", "Tomato", "Potato"].map(c => (
                                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-zinc-300">Growth Stage</Label>
                                                <Select
                                                    value={formData.growthStage}
                                                    onValueChange={(val) => setFormData({ ...formData, growthStage: val })}
                                                >
                                                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                                        <SelectValue placeholder="Select stage" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                                                        {["Seedling", "Vegetative", "Flowering", "Fruiting", "Harvest"].map(s => (
                                                            <SelectItem key={s} value={s}>{s}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-zinc-300">Description</Label>
                                            <Textarea
                                                placeholder="Describe the symptoms (e.g., yellow spots, wilting leaves)..."
                                                className="bg-white/5 border-white/10 text-white min-h-[100px]"
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-full bg-green-500 hover:bg-green-400 text-black font-bold h-12 text-lg"
                                            disabled={isSubmitting || formData.images.length === 0}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                    Processing...
                                                </>
                                            ) : (
                                                "Get Expert Advice"
                                            )}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>

                            {/* AI Analysis View */}
                            <div className="space-y-6">
                                {showAiAnalysis && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="relative"
                                    >
                                        {!newAdvisoryId ? (
                                            // Processing State
                                            <Card className="bg-black/60 border-green-500/30 overflow-hidden">
                                                <div className="absolute inset-0 bg-green-500/5 animate-pulse" />
                                                <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-6 min-h-[400px]">
                                                    <div className="relative">
                                                        <div className="h-24 w-24 rounded-full border-4 border-green-500/30 flex items-center justify-center animate-[spin_3s_linear_infinite]">
                                                            <div className="h-20 w-20 rounded-full border-t-4 border-green-400 animate-[spin_1s_linear_infinite]" />
                                                        </div>
                                                        <Bot className="absolute inset-0 m-auto h-10 w-10 text-green-400" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <h3 className="text-2xl font-bold text-white">AI Analysis in Progress</h3>
                                                        <p className="text-green-400 animate-pulse">
                                                            {["Uploading images...", "Scanning crop health...", "Identifying potential issues...", "Generating report..."][analyzingStep]}
                                                        </p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ) : (
                                            // Result State (Mock AI)
                                            <Card className="bg-gradient-to-br from-green-900/50 to-black border-green-500/50 overflow-hidden">
                                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50" />
                                                <CardHeader>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="p-2 bg-green-500/20 rounded-lg">
                                                            <Bot className="h-6 w-6 text-green-400" />
                                                        </div>
                                                        <div>
                                                            <CardTitle className="text-white">Preliminary AI Diagnosis</CardTitle>
                                                            <CardDescription className="text-green-300/70">Based on visual analysis</CardDescription>
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="space-y-6">
                                                    {history[0]?.aiPrediction && (
                                                        <>
                                                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                                                                <span className="text-zinc-400">Detected Issue</span>
                                                                <span className="text-xl font-bold text-white">{history[0].aiPrediction.disease}</span>
                                                            </div>

                                                            <div className="space-y-2">
                                                                <div className="flex justify-between text-sm">
                                                                    <span className="text-zinc-400">Confidence Score</span>
                                                                    <span className="text-green-400 font-bold">{history[0].aiPrediction.confidence}%</span>
                                                                </div>
                                                                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                                                    <motion.div
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${history[0].aiPrediction.confidence}%` }}
                                                                        transition={{ duration: 1, delay: 0.5 }}
                                                                        className="h-full bg-green-500"
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                                                                <p className="text-green-200 text-sm leading-relaxed">
                                                                    {history[0].aiPrediction.description}
                                                                </p>
                                                            </div>
                                                        </>
                                                    )}

                                                    <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                                                        <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                                                        <p className="text-xs text-yellow-500/80">
                                                            Your request has been sent to an expert for verification (Est. 24h)
                                                        </p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </motion.div>
                                )}

                                {/* Intro Card when no analysis showing */}
                                {!showAiAnalysis && (
                                    <Card className="bg-white/5 border-white/10">
                                        <CardContent className="p-6 text-center space-y-4">
                                            <div className="mx-auto h-16 w-16 bg-green-500/20 rounded-full flex items-center justify-center">
                                                <Leaf className="h-8 w-8 text-green-500" />
                                            </div>
                                            <h3 className="text-xl font-semibold text-white">How it Works</h3>
                                            <ul className="text-left space-y-3 text-zinc-400 text-sm">
                                                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> Upload clear photos of affected areas</li>
                                                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> Contextual AI scans for immediate insights</li>
                                                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> Verified experts provide detailed treatment plans</li>
                                            </ul>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="history"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            {loadingHistory ? (
                                <div className="text-center py-12 text-zinc-500">Loading history...</div>
                            ) : history.length === 0 ? (
                                <div className="text-center py-12 text-zinc-500">No requests found. Start a new one!</div>
                            ) : (
                                <div className="grid gap-4">
                                    {history.map((item) => (
                                        <Card key={item._id} className="bg-black/40 border-white/10 hover:border-green-500/30 transition-colors">
                                            <CardContent className="p-4 flex gap-4">
                                                <div className="h-24 w-24 rounded-lg bg-zinc-800 shrink-0 overflow-hidden">
                                                    {item.images[0] ? (
                                                        <img src={item.images[0]} alt="Crop" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <Sprout className="h-full w-full p-6 text-zinc-600" />
                                                    )}
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex justify-between items-start">
                                                        <h3 className="font-semibold text-white">{item.cropType} <span className="text-zinc-500 text-sm font-normal">• {item.growthStage}</span></h3>
                                                        <Badge variant={item.status === "answered" ? "default" : "secondary"} className={item.status === "answered" ? "bg-green-500 text-black" : "bg-yellow-500/10 text-yellow-500"}>
                                                            {item.status === "answered" ? "Answered" : "Pending Expert"}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-zinc-400 line-clamp-2">{item.description}</p>

                                                    {item.status === "answered" && (
                                                        <div className="mt-2 text-sm bg-green-500/10 p-2 rounded border border-green-500/20 text-green-300">
                                                            <span className="font-bold">Expert Advice:</span> {item.expertDiagnosis} - {item.treatment}
                                                        </div>
                                                    )}

                                                    <div className="flex gap-4 mt-2 text-xs text-zinc-500">
                                                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(item.createdAt).toLocaleDateString()}</span>
                                                        {item.aiPrediction && (
                                                            <span className="flex items-center gap-1 text-green-500/70"><Bot className="h-3 w-3" /> AI detected: {item.aiPrediction.disease}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
