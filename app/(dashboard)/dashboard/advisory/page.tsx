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
    AlertTriangle,
    MapPin,
    Calendar,
    ChevronRight,
    Bot,
    Droplets,
    ThermometerSun,
    CloudRain,
    User,
    X
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
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
        className="absolute text-green-400/5 pointer-events-none"
        style={{ left: `${Math.random() * 100}vw` }}
    >
        <Leaf size={24 + Math.random() * 24} />
    </motion.div>
)

export default function AdvisoryPage() {
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState<"new" | "history">("new")
    const [currentStep, setCurrentStep] = useState(1) // 1: Upload, 2: Vision, 3: Context, 4: Advice
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [analyzingStep, setAnalyzingStep] = useState(0)
    const [newAdvisoryId, setNewAdvisoryId] = useState<string | null>(null)
    const [history, setHistory] = useState<any[]>([])
    const [analysisResult, setAnalysisResult] = useState<any>(null)

    // Form State
    const [formData, setFormData] = useState({
        cropType: "",
        growthStage: "",
        description: "",
        location: (user as any)?.location?.village || "Nagpur, India",
        soilType: "Black",
        irrigationType: "Drip",
        images: [] as string[],
        // Step 3 Data
        cropAge: "30-60",
        recentRain: "No Rain",
        temperature: 28,
        symptoms: [] as string[]
    })

    // Fetch History
    useEffect(() => {
        const loadHistory = async () => {
            try {
                const res = await fetchWithAuth(apiUrl("/advisory"))
                const data = await res.json()
                if (data.success) setHistory(data.data)
            } catch (err) {
                console.error("Failed to load history", err)
            }
        }
        loadHistory()
    }, [])

    const handleAnalyze = async () => {
        if (formData.images.length === 0 || !formData.cropType) {
            alert("Please upload an image and select crop type first.")
            return
        }

        setIsAnalyzing(true)
        setAnalyzingStep(0)

        // Simulate steps visual only
        const steps = ["Uploading context...", "Analyzing crop health...", "Detecting pathogens...", "Generating insights..."]
        const stepTimer = setInterval(() => {
            setAnalyzingStep(prev => (prev < steps.length - 1 ? prev + 1 : prev))
        }, 800)

        try {
            // Import dynamically to avoid build errors if file not indexed yet
            const { advisoryApi } = await import("@/lib/advisory-api")

            // Use custom crop name if "Other" is selected
            const finalCropType = formData.cropType === "Other" && (formData as any).customCrop
                ? (formData as any).customCrop
                : formData.cropType;

            const response = await advisoryApi.analyze({
                imageUrl: formData.images[0],
                cropType: finalCropType,
                growthStage: formData.growthStage || "Vegetative Growth",
                description: formData.description || "Uploaded via dashboard",
                location: formData.location,
                soilType: formData.soilType,
                irrigationType: formData.irrigationType,
                symptoms: formData.symptoms || [],
                temperature: formData.temperature,
                recentRain: formData.recentRain
            })

            clearInterval(stepTimer)
            setIsAnalyzing(false)

            if (response.success && response.data) {
                setAnalysisResult(response.data)
                setCurrentStep(2)
            } else {
                alert(response.message || "Analysis failed. Please try again.")
            }
        } catch (error) {
            console.error("Analysis failed", error)
            clearInterval(stepTimer)
            setIsAnalyzing(false)
            alert("An error occurred during analysis.")
        }
    }

    const handleFinalSubmit = async () => {
        setIsSubmitting(true)



        try {
            const { advisoryApi } = await import("@/lib/advisory-api")

            const res = await advisoryApi.submit({
                ...formData,
                images: formData.images,
                weatherContext: {
                    temperature: formData.temperature,
                    humidity: formData.recentRain === "Heavy Rain" ? 85 : 45,
                    rainfall: formData.recentRain === "Heavy Rain" ? 50 : 0
                },
                aiAnalysis: {
                    disease: analysisResult.disease,
                    confidence: analysisResult.confidence,
                    severity: analysisResult.severity,
                    description: analysisResult.description || `Detected ${analysisResult.disease}`,
                    treatment: analysisResult.treatment || [],
                    prevention: analysisResult.prevention || []
                },
                aiRiskAssessment: analysisResult.aiRiskAssessment
            })

            if (res.success) {
                setNewAdvisoryId(res.data._id)
                setHistory([res.data, ...history])
                alert("Report Saved Successfully!")
            }
        } catch (err) {
            console.error(err)
            alert("Failed to save report")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 relative overflow-hidden">
            {/* Background Animations */}
            {[0, 2, 4, 6, 8].map((delay) => (
                <FloatingLeaf key={delay} delay={delay} />
            ))}

            <div className="container mx-auto px-4 py-8 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-green-400 flex items-center gap-2">
                            <Sprout className="h-8 w-8 text-green-500" />
                            Crop Doctor AI
                        </h1>
                        <p className="text-green-400/60 mt-1">Smart Diagnosis & Predictive Analytics</p>
                    </div>

                    <div className="flex bg-slate-900/50 p-1 rounded-lg backdrop-blur-sm border border-slate-800">
                        <Button
                            variant={activeTab === "new" ? "secondary" : "ghost"}
                            onClick={() => { setActiveTab("new"); setCurrentStep(1); }}
                            className={`${activeTab === "new" ? "bg-green-500/10 text-green-400" : "text-slate-400 hover:text-green-400"} gap-2`}
                        >
                            <Upload className="h-4 w-4" /> New Diagnosis
                        </Button>
                        <Button
                            variant={activeTab === "history" ? "secondary" : "ghost"}
                            onClick={() => setActiveTab("history")}
                            className={`${activeTab === "history" ? "bg-green-500/10 text-green-400" : "text-slate-400 hover:text-green-400"} gap-2`}
                        >
                            <Calendar className="h-4 w-4" /> History
                        </Button>
                    </div>
                </div>

                {activeTab === "history" ? (
                    <div className="grid lg:grid-cols-3 gap-6">
                        {history.map((item) => (
                            <div key={item._id} className="p-4 bg-slate-900 rounded-xl border border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-2">
                                    <Badge variant="outline" className="border-slate-700 text-slate-300">{item.cropType}</Badge>
                                    <span className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</span>
                                </div>
                                <h3 className="font-bold text-green-100">{item.aiAnalysis?.disease || "Pending Analysis"}</h3>
                                <p className="text-sm text-slate-400 mt-1 line-clamp-2">{item.aiAnalysis?.description}</p>
                                {item.status === 'answered' && (
                                    <div className="mt-3 text-xs bg-blue-950/30 text-blue-300 p-2 rounded flex items-center gap-2">
                                        <CheckCircle2 className="h-3 w-3" /> Expert Response Available
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto">
                        {/* Progress Stepper */}
                        <div className="mb-8 flex justify-center items-center gap-4">
                            {[1, 2, 3, 4].map((step) => (
                                <div key={step} className={`flex items-center gap-2 ${currentStep >= step ? "text-green-400" : "text-slate-600"}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 
                                        ${currentStep >= step ? "bg-green-900 border-green-500" : "bg-transparent border-slate-700"}`}>
                                        {step}
                                    </div>
                                    {step < 4 && <div className={`w-8 h-0.5 ${currentStep > step ? "bg-green-500" : "bg-slate-800"}`} />}
                                </div>
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            {/* STEP 1: UPLOAD */}
                            {currentStep === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="bg-slate-900/50 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-slate-800"
                                >
                                    <h2 className="text-xl font-bold text-green-400 mb-6 flex items-center gap-2">
                                        <Upload className="h-5 w-5" /> Step 1: Upload & Identify
                                    </h2>

                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <Label className="text-slate-300">Upload Crop Photo</Label>
                                            {formData.images.length > 0 ? (
                                                <div className="relative rounded-xl overflow-hidden border border-slate-700 group">
                                                    <img
                                                        src={formData.images[0]}
                                                        alt="Uploaded crop"
                                                        className="w-full h-64 object-cover"
                                                    />
                                                    <button
                                                        onClick={() => setFormData(prev => ({ ...prev, images: [] }))}
                                                        className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-full transition-colors shadow-lg"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <CropUpload
                                                    onUpload={(urls) => setFormData(prev => ({ ...prev, images: urls }))}
                                                    maxFiles={1}
                                                />
                                            )}
                                        </div>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-slate-300">Crop Type</Label>
                                                <Select onValueChange={(val) => setFormData(prev => ({ ...prev, cropType: val }))}>
                                                    <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100">
                                                        <SelectValue placeholder="Select Crop" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-100 max-h-60">
                                                        <SelectItem value="Capsicum (Bell Pepper)">Capsicum (Bell Pepper)</SelectItem>
                                                        <SelectItem value="Tomato">Tomato</SelectItem>
                                                        <SelectItem value="Potato">Potato</SelectItem>
                                                        <SelectItem value="Chilli">Chilli</SelectItem>
                                                        <SelectItem value="Cotton">Cotton</SelectItem>
                                                        <SelectItem value="Sugarcane">Sugarcane</SelectItem>
                                                        <SelectItem value="Wheat">Wheat</SelectItem>
                                                        <SelectItem value="Rice (Paddy)">Rice (Paddy)</SelectItem>
                                                        <SelectItem value="Maize (Corn)">Maize (Corn)</SelectItem>
                                                        <SelectItem value="Soybean">Soybean</SelectItem>
                                                        <SelectItem value="Brinjal (Eggplant)">Brinjal (Eggplant)</SelectItem>
                                                        <SelectItem value="Onion">Onion</SelectItem>
                                                        <SelectItem value="Garlic">Garlic</SelectItem>
                                                        <SelectItem value="Turmeric">Turmeric</SelectItem>
                                                        <SelectItem value="Ginger">Ginger</SelectItem>
                                                        <SelectItem value="Banana">Banana</SelectItem>
                                                        <SelectItem value="Mango">Mango</SelectItem>
                                                        <SelectItem value="Papaya">Papaya</SelectItem>
                                                        <SelectItem value="Pomegranate">Pomegranate</SelectItem>
                                                        <SelectItem value="Lemon">Lemon</SelectItem>
                                                        <SelectItem value="Other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>

                                                {formData.cropType === "Other" && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: "auto" }}
                                                        className="pt-2"
                                                    >
                                                        <Label className="text-slate-400 text-xs mb-1 block">Specify Crop Name</Label>
                                                        <Input
                                                            placeholder="e.g. Cucumber, Bitter Gourd..."
                                                            className="bg-slate-950 border-slate-800 text-slate-100"
                                                            onChange={(e) => setFormData(prev => ({ ...prev, customCrop: e.target.value }))}
                                                        />
                                                    </motion.div>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-slate-300">Growth Stage</Label>
                                                <Select onValueChange={(val) => setFormData(prev => ({ ...prev, growthStage: val }))}>
                                                    <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100">
                                                        <SelectValue placeholder="Select Stage" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                                                        <SelectItem value="Seedling / Nursery">Seedling / Nursery</SelectItem>
                                                        <SelectItem value="Vegetative Growth">Vegetative Growth</SelectItem>
                                                        <SelectItem value="Flowering">Flowering</SelectItem>
                                                        <SelectItem value="Fruiting">Fruiting</SelectItem>
                                                        <SelectItem value="Maturation">Maturation</SelectItem>
                                                        <SelectItem value="Harvesting">Harvesting</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        className="w-full mt-8 bg-green-600 hover:bg-green-700 text-white h-12 text-lg"
                                        disabled={isAnalyzing || !formData.cropType || formData.images.length === 0}
                                        onClick={handleAnalyze}
                                    >
                                        {isAnalyzing ? (
                                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> {["Analyzing...", "Detecting...", "Thinking..."][analyzingStep % 3]}</>
                                        ) : (
                                            <><Bot className="mr-2 h-5 w-5" /> Analyze with AI Vision</>
                                        )}
                                    </Button>
                                </motion.div>
                            )}

                            {/* STEP 2: AI VISION RESULT */}
                            {currentStep === 2 && analysisResult && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-slate-800"
                                >
                                    <h2 className="text-2xl font-bold text-green-400 mb-6 flex items-center gap-2">
                                        <Bot className="h-6 w-6 text-green-500" /> AI Vision Analysis
                                    </h2>

                                    <div className="grid md:grid-cols-2 gap-8 items-center">
                                        <div className="rounded-xl overflow-hidden shadow-lg border-2 border-slate-800">
                                            <img src={formData.images[0]} alt="Analyzed Crop" className="w-full h-full object-cover" />
                                        </div>

                                        <div className="space-y-6">
                                            <div className="bg-green-950/20 p-4 rounded-xl border border-green-900/30">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-green-200 font-medium">Detected Crop</span>
                                                    <Badge className="bg-green-600 text-white">{analysisResult.cropConfidence || 95}% Confidence</Badge>
                                                </div>
                                                <div className="text-xl font-bold text-green-100 flex items-center gap-2">
                                                    <Sprout className="h-5 w-5" /> {analysisResult.detectedCrop || formData.cropType}
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                {/* Detailed Analysis Section */}
                                                {analysisResult.detailedAnalysis && (
                                                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 space-y-3">
                                                        <h4 className="text-green-300 font-semibold text-sm uppercase tracking-wider">Detailed Analysis</h4>
                                                        {analysisResult.detailedAnalysis.visualObservations && (
                                                            <div>
                                                                <span className="text-slate-400 text-xs">Visual Observations:</span>
                                                                <p className="text-slate-300 text-sm mt-1">{analysisResult.detailedAnalysis.visualObservations}</p>
                                                            </div>
                                                        )}
                                                        {analysisResult.detailedAnalysis.symptomAnalysis && (
                                                            <div>
                                                                <span className="text-slate-400 text-xs">Symptom Analysis:</span>
                                                                <p className="text-slate-300 text-sm mt-1">{analysisResult.detailedAnalysis.symptomAnalysis}</p>
                                                            </div>
                                                        )}
                                                        {analysisResult.detailedAnalysis.rootCause && (
                                                            <div>
                                                                <span className="text-slate-400 text-xs">Root Cause:</span>
                                                                <p className="text-slate-300 text-sm mt-1">{analysisResult.detailedAnalysis.rootCause}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                
                                                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-slate-400 text-sm uppercase tracking-wider font-bold">Summary</span>
                                                        <Badge variant={analysisResult.severity === 'High' || analysisResult.severity === 'Critical' ? 'destructive' : analysisResult.severity === 'Moderate' ? 'secondary' : 'default'} className="uppercase text-[10px]">
                                                            Severity: {analysisResult.severity || 'Unknown'}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-slate-300 text-sm leading-relaxed">
                                                        {analysisResult.description || 'Analysis completed'}
                                                    </p>
                                                </div>

                                                <h3 className="font-semibold text-slate-300">Diagnosis Confidence</h3>

                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="font-medium text-red-400 flex items-center gap-2"><AlertCircle className="h-3 w-3" /> {analysisResult.disease}</span>
                                                        <span className="font-bold text-slate-200">{analysisResult.confidence}%</span>
                                                    </div>
                                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                                        <motion.div initial={{ width: 0 }} animate={{ width: `${analysisResult.confidence}%` }} transition={{ duration: 1 }} className="h-full bg-red-500 rounded-full" />
                                                    </div>
                                                </div>

                                                {analysisResult.otherIssues && analysisResult.otherIssues.length > 0 && analysisResult.otherIssues.map((issue: any, i: number) => (
                                                    <div key={i} className="space-y-2">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-slate-400">{issue.name}</span>
                                                            <span className="font-medium text-slate-500">{issue.confidence}%</span>
                                                        </div>
                                                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                                            <motion.div initial={{ width: 0 }} animate={{ width: `${issue.confidence}%` }} transition={{ duration: 1, delay: 0.2 * (i + 1) }} className="h-full bg-yellow-500 rounded-full" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <Button
                                                className="w-full bg-green-600 text-white h-12"
                                                onClick={() => setCurrentStep(3)}
                                            >
                                                Next: Help AI Understand Better <ChevronRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 3: CONTEXT GATHERING */}
                            {currentStep === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-slate-800"
                                >
                                    <h2 className="text-2xl font-bold text-green-400 mb-2 flex items-center gap-2">
                                        🧠 Help AI Understand Better
                                    </h2>
                                    <p className="text-slate-400 mb-8">Provide environmental context for higher accuracy.</p>

                                    <div className="space-y-8">
                                        <div>
                                            <Label className="text-lg text-green-300 mb-3 block">1. Soil & Irrigation</Label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-slate-400 text-sm">Soil Type</Label>
                                                    <Select onValueChange={(val) => setFormData(prev => ({ ...prev, soilType: val }))} defaultValue={formData.soilType}>
                                                        <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100">
                                                            <SelectValue placeholder="Select Soil" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                                                            <SelectItem value="Black">Black Soil</SelectItem>
                                                            <SelectItem value="Red">Red Soil</SelectItem>
                                                            <SelectItem value="Alluvial">Alluvial Soil</SelectItem>
                                                            <SelectItem value="Clay">Clay Soil</SelectItem>
                                                            <SelectItem value="Sandy">Sandy Soil</SelectItem>
                                                            <SelectItem value="Loamy">Loamy Soil</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-slate-400 text-sm">Irrigation Method</Label>
                                                    <Select onValueChange={(val) => setFormData(prev => ({ ...prev, irrigationType: val }))} defaultValue={formData.irrigationType}>
                                                        <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100">
                                                            <SelectValue placeholder="Select Method" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                                                            <SelectItem value="Drip">Drip Irrigation</SelectItem>
                                                            <SelectItem value="Sprinkler">Sprinkler</SelectItem>
                                                            <SelectItem value="Flood">Flood Irrigation</SelectItem>
                                                            <SelectItem value="Rainfed">Rainfed</SelectItem>
                                                            <SelectItem value="Manual">Manual Watering</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <Label className="text-lg text-green-300 mb-3 block">2. Recent Rainfall</Label>
                                            <div className="flex gap-3">
                                                {["No Rain", "Light Rain", "Heavy Rain"].map(opt => (
                                                    <button
                                                        key={opt}
                                                        onClick={() => setFormData({ ...formData, recentRain: opt })}
                                                        className={`px-6 py-3 rounded-full border transition-all ${formData.recentRain === opt ? "bg-green-600 text-white border-green-600 shadow-lg scale-105" : "bg-slate-900 text-slate-400 border-slate-700 hover:border-green-400 hover:text-green-300"}`}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <Label className="text-lg text-green-300 mb-3 block">3. Average Temperature ({formData.temperature}°C)</Label>
                                            <Slider
                                                min={10} max={45} step={1}
                                                value={[formData.temperature]}
                                                onValueChange={(val) => setFormData({ ...formData, temperature: val[0] })}
                                                className="py-4"
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-lg text-green-300 mb-3 block">4. Visible Symptoms</Label>
                                            <div className="flex flex-wrap gap-2">
                                                {["Yellow Leaves", "Curling", "Spots", "Wilting", "Stunted Growth"].map(symptom => (
                                                    <button
                                                        key={symptom}
                                                        onClick={() => {
                                                            const newSymptoms = formData.symptoms.includes(symptom)
                                                                ? formData.symptoms.filter(s => s !== symptom)
                                                                : [...formData.symptoms, symptom]
                                                            setFormData({ ...formData, symptoms: newSymptoms })
                                                        }}
                                                        className={`px-4 py-2 rounded-lg text-sm transition-all border ${formData.symptoms.includes(symptom) ? "bg-green-900/60 text-green-300 border-green-600 font-medium" : "bg-slate-900 text-slate-400 border-slate-700 hover:border-green-400 hover:text-green-300"}`}
                                                    >
                                                        {symptom}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <Button
                                            className="w-full bg-green-600 text-white h-12 mt-4"
                                            onClick={() => setCurrentStep(4)}
                                        >
                                            Get Final Recommendation <Bot className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 4: RECOMMENDATION PANEL */}
                            {currentStep === 4 && (
                                <motion.div
                                    key="step4"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="grid md:grid-cols-3 gap-8"
                                >
                                    {/* Left: Summary */}
                                    <div className="md:col-span-1 space-y-6">
                                        <div className="bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-800">
                                            <img src={formData.images[0]} className="w-full h-48 object-cover" />
                                            <div className="p-4">
                                                <h3 className="font-bold text-green-100 text-lg">{analysisResult?.disease}</h3>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Badge variant="secondary" className="bg-green-900/40 text-green-300">AI Confidence: {analysisResult?.confidence}%</Badge>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-blue-950/20 p-4 rounded-xl border border-blue-900/30">
                                            <div className="flex items-center gap-2 text-blue-300 font-semibold mb-2">
                                                <User className="h-5 w-5" /> Expert Review
                                            </div>
                                            <p className="text-sm text-blue-400 mb-4">
                                                Get your diagnosis verified by a certified agronomist for 100% certainty.
                                            </p>
                                            <Button
                                                variant="outline"
                                                className="w-full border-blue-800 text-blue-300 hover:bg-blue-900/50 hover:text-blue-200"
                                                onClick={handleFinalSubmit}
                                            >
                                                Request Expert Review
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Right: Recommendations */}
                                    <div className="md:col-span-2 space-y-6">
                                        <div className="bg-slate-900 rounded-2xl p-8 shadow-xl border border-slate-800">
                                            <h2 className="text-2xl font-bold text-green-400 mb-6 flex items-center gap-2">
                                                🤖 AI Recommendation
                                            </h2>

                                            <div className="grid md:grid-cols-2 gap-6">
                                                <Card className="border-green-900/30 bg-green-950/20">
                                                    <CardHeader>
                                                        <CardTitle className="text-lg text-green-300 flex items-center gap-2">
                                                            <Leaf className="h-5 w-5 text-green-500" /> Recommended Treatment
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <ul className="list-disc list-inside space-y-2 text-green-200 text-sm">
                                                            {analysisResult.treatment && analysisResult.treatment.length > 0 ? (
                                                                analysisResult.treatment.map((step: string, i: number) => (
                                                                    <li key={i}>{step}</li>
                                                                ))
                                                            ) : (
                                                                <li>No specific treatment recommended.</li>
                                                            )}
                                                        </ul>
                                                    </CardContent>
                                                </Card>

                                                <Card className="border-blue-900/30 bg-blue-950/20">
                                                    <CardHeader>
                                                        <CardTitle className="text-lg text-blue-300 flex items-center gap-2">
                                                            <Droplets className="h-5 w-5 text-blue-500" /> Prevention & Care
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <ul className="list-disc list-inside space-y-2 text-blue-200 text-sm">
                                                            {analysisResult.prevention && analysisResult.prevention.length > 0 ? (
                                                                analysisResult.prevention.map((step: string, i: number) => (
                                                                    <li key={i}>{step}</li>
                                                                ))
                                                            ) : (
                                                                <li>No specific prevention tips available.</li>
                                                            )}
                                                        </ul>
                                                    </CardContent>
                                                </Card>
                                            </div>

                                            {/* Growth Recommendations */}
                                            {analysisResult.growthRecommendations && analysisResult.growthRecommendations.length > 0 && (
                                                <Card className="border-yellow-900/30 bg-yellow-950/20 mt-6">
                                                    <CardHeader>
                                                        <CardTitle className="text-lg text-yellow-300 flex items-center gap-2">
                                                            <Sprout className="h-5 w-5 text-yellow-500" /> Growth Optimization
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <ul className="list-disc list-inside space-y-2 text-yellow-200 text-sm">
                                                            {analysisResult.growthRecommendations.map((rec: string, i: number) => (
                                                                <li key={i}>{rec}</li>
                                                            ))}
                                                        </ul>
                                                    </CardContent>
                                                </Card>
                                            )}

                                            {/* Risk Assessment */}
                                            {analysisResult.aiRiskAssessment && (
                                                <Card className="border-orange-900/30 bg-orange-950/20 mt-6">
                                                    <CardHeader>
                                                        <CardTitle className="text-lg text-orange-300 flex items-center gap-2">
                                                            <AlertTriangle className="h-5 w-5 text-orange-500" /> Risk Assessment
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-orange-200 text-sm">Overall Risk Level:</span>
                                                            <Badge variant={analysisResult.aiRiskAssessment.riskLevel === 'High' ? 'destructive' : analysisResult.aiRiskAssessment.riskLevel === 'Medium' ? 'secondary' : 'default'} className="uppercase">
                                                                {analysisResult.aiRiskAssessment.riskLevel}
                                                            </Badge>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                                            {analysisResult.aiRiskAssessment.fungalRisk && (
                                                                <div className="flex items-center gap-2 text-orange-300">
                                                                    <AlertCircle className="h-3 w-3" /> Fungal Risk
                                                                </div>
                                                            )}
                                                            {analysisResult.aiRiskAssessment.droughtRisk && (
                                                                <div className="flex items-center gap-2 text-orange-300">
                                                                    <AlertCircle className="h-3 w-3" /> Drought Risk
                                                                </div>
                                                            )}
                                                            {analysisResult.aiRiskAssessment.pestRisk && (
                                                                <div className="flex items-center gap-2 text-orange-300">
                                                                    <AlertCircle className="h-3 w-3" /> Pest Risk
                                                                </div>
                                                            )}
                                                            {analysisResult.aiRiskAssessment.nutrientDeficiencyRisk && (
                                                                <div className="flex items-center gap-2 text-orange-300">
                                                                    <AlertCircle className="h-3 w-3" /> Nutrient Deficiency
                                                                </div>
                                                            )}
                                                        </div>
                                                        {analysisResult.aiRiskAssessment.next7DaysForecast && (
                                                            <div className="mt-3 pt-3 border-t border-orange-900/30">
                                                                <p className="text-orange-200 text-sm font-medium mb-1">7-Day Forecast:</p>
                                                                <p className="text-orange-300 text-xs">{analysisResult.aiRiskAssessment.next7DaysForecast}</p>
                                                            </div>
                                                        )}
                                                        {analysisResult.aiRiskAssessment.weatherAlert && analysisResult.aiRiskAssessment.weatherAlert !== 'No active alerts' && (
                                                            <div className="mt-2 p-2 bg-orange-900/30 rounded text-orange-200 text-xs">
                                                                ⚠️ {analysisResult.aiRiskAssessment.weatherAlert}
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            )}

                                            {/* Follow-up Actions */}
                                            {analysisResult.followUpActions && analysisResult.followUpActions.length > 0 && (
                                                <Card className="border-purple-900/30 bg-purple-950/20 mt-6">
                                                    <CardHeader>
                                                        <CardTitle className="text-lg text-purple-300 flex items-center gap-2">
                                                            <CheckCircle2 className="h-5 w-5 text-purple-500" /> Follow-up Actions
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <ul className="list-disc list-inside space-y-2 text-purple-200 text-sm">
                                                            {analysisResult.followUpActions.map((action: string, i: number) => (
                                                                <li key={i}>{action}</li>
                                                            ))}
                                                        </ul>
                                                    </CardContent>
                                                </Card>
                                            )}

                                            <div className="mt-8 pt-8 border-t border-slate-800 flex justify-end gap-4">
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => setCurrentStep(1)}
                                                    className="text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                                                >
                                                    Start Over
                                                </Button>
                                                <Button
                                                    className="bg-green-600 hover:bg-green-700 text-white h-12 px-8 shadow-lg shadow-green-900/20"
                                                    onClick={handleFinalSubmit}
                                                    disabled={isSubmitting}
                                                >
                                                    {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                                                    Save & Complete Record
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    )
}
