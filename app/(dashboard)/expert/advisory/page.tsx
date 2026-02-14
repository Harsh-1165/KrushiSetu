"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    ClipboardList,
    MapPin,
    Calendar,
    Bot,
    User,
    CheckCircle2,
    AlertTriangle,
    Send,
    Loader2,
    AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { apiUrl, fetchWithAuth } from "@/lib/api"

export default function ExpertAdvisoryPage() {
    const [requests, setRequests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedRequest, setSelectedRequest] = useState<any | null>(null)

    // Response Form State
    const [responseForm, setResponseForm] = useState({
        diagnosis: "",
        treatment: "",
        confidence: 85
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    // AI Feedback State
    const [aiFeedback, setAiFeedback] = useState<'accurate' | 'partially_correct' | 'incorrect'>('accurate')
    const [correctionReason, setCorrectionReason] = useState("")

    const fetchRequests = async () => {
        try {
            const res = await fetchWithAuth(apiUrl("/advisory"))
            const data = await res.json()
            if (data.success) {
                setRequests(data.data)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRequests()
    }, [])

    const handleSubmitResponse = async () => {
        if (!selectedRequest) return
        setIsSubmitting(true)

        try {
            const res = await fetchWithAuth(apiUrl(`/advisory/${selectedRequest._id}`), {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    expertDiagnosis: responseForm.diagnosis,
                    treatment: responseForm.treatment,
                    confidence: responseForm.confidence,
                    // AI Feedback
                    accuracyStatus: selectedRequest.aiAnalysis ? aiFeedback : null,
                    correctionReason: aiFeedback !== 'accurate' ? correctionReason : null
                })
            })

            const data = await res.json()

            if (data.success) {
                // Update list locally
                setRequests(prev => prev.map(r => r._id === selectedRequest._id ? data.data : r))
                setSelectedRequest(null) // Close dialog
            }
        } catch (err) {
            console.error(err)
        } finally {
            setIsSubmitting(false)
        }
    }

    const [activeTab, setActiveTab] = useState<"pending" | "answered">("pending")

    // Filter for pending vs answered
    const pendingRequests = requests.filter(r => r.status === "pending")
    const answeredRequests = requests.filter(r => r.status === "answered")
    const displayedRequests = activeTab === "pending" ? pendingRequests : answeredRequests

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <ClipboardList className="text-green-600" />
                        Advisory Requests
                    </h1>
                    <p className="text-muted-foreground">Review farmer inquiries and provide expert guidance.</p>
                </div>
                <div className="flex gap-2 bg-muted/20 p-1 rounded-lg">
                    <Button
                        variant={activeTab === "pending" ? "secondary" : "ghost"}
                        onClick={() => setActiveTab("pending")}
                        className={`gap-2 ${activeTab === "pending" ? "bg-green-100 text-green-700 hover:bg-green-200" : "text-muted-foreground"}`}
                    >
                        Pending
                        <Badge variant="secondary" className="bg-white/50 ml-1 text-inherit border-0">
                            {pendingRequests.length}
                        </Badge>
                    </Button>
                    <Button
                        variant={activeTab === "answered" ? "secondary" : "ghost"}
                        onClick={() => setActiveTab("answered")}
                        className={`gap-2 ${activeTab === "answered" ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : "text-muted-foreground"}`}
                    >
                        Answered
                        <Badge variant="secondary" className="bg-white/50 ml-1 text-inherit border-0">
                            {answeredRequests.length}
                        </Badge>
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-green-600" /></div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayedRequests.length === 0 && (
                        <div className="col-span-full text-center py-12 bg-muted/10 rounded-xl border border-dashed">
                            <p className="text-muted-foreground">No {activeTab} requests found.</p>
                        </div>
                    )}

                    {displayedRequests.map((req) => (
                        <Card key={req._id} className={`hover:shadow-lg transition-shadow cursor-pointer border-l-4 ${activeTab === "pending" ? "border-l-green-500" : "border-l-blue-500"}`} onClick={() => setSelectedRequest(req)}>
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <Badge variant={activeTab === "pending" ? "default" : "outline"}>{req.cropType}</Badge>
                                    <span className="text-xs text-muted-foreground">{new Date(req.createdAt).toLocaleDateString()}</span>
                                </div>
                                <CardTitle className="text-lg mt-2">{req.description.substring(0, 50)}...</CardTitle>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <User className="h-3 w-3" /> {req.farmer?.name?.first || "Farmer"}
                                    <span className="mx-1">•</span>
                                    <MapPin className="h-3 w-3" /> {req.location || "Unknown"}
                                </div>
                            </CardHeader>
                            <CardContent className="pb-3">
                                <div className="aspect-video bg-zinc-100 rounded-lg overflow-hidden relative mb-3">
                                    {req.images[0] && (
                                        <img
                                            src={req.images[0].startsWith("http") ? req.images[0] : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${req.images[0]}`}
                                            className="w-full h-full object-cover"
                                            alt="Crop"
                                        />
                                    )}
                                    {req.aiAnalysis && (
                                        <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-sm p-2 rounded flex items-center gap-2">
                                            <Bot className="h-3 w-3 text-green-400" />
                                            <div className="text-xs text-white truncate">
                                                <span className="text-green-400 font-bold">{req.aiAnalysis.confidence}%</span> {req.aiAnalysis.disease}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {activeTab === "answered" && req.expertDiagnosis ? (
                                    <div className="bg-blue-50 p-3 rounded text-sm mb-2 border border-blue-100">
                                        <p className="font-semibold text-blue-900 flex items-center gap-1">
                                            <CheckCircle2 className="h-3 w-3" /> Expert Diagnosis
                                        </p>
                                        <p className="text-blue-800 line-clamp-2">{req.expertDiagnosis}</p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-zinc-600 line-clamp-2">{req.description}</p>
                                )}
                            </CardContent>
                            <CardFooter className="pt-0">
                                <Button className={`w-full text-white ${activeTab === "pending" ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}`} onClick={() => setSelectedRequest(req)}>
                                    {activeTab === "pending" ? "Review & Answer" : "View Details"}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {/* Detail Dialog */}
            <Dialog open={!!selectedRequest} onOpenChange={(open) => {
                if (!open) {
                    setSelectedRequest(null)
                    // Reset form
                    setResponseForm({ diagnosis: "", treatment: "", confidence: 85 })
                    setAiFeedback('accurate')
                    setCorrectionReason("")
                }
            }}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Case #{selectedRequest?._id?.substring(0, 8)}</DialogTitle>
                    </DialogHeader>
                    {selectedRequest && (
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Left: Case Details */}
                            <div className="space-y-6">
                                <div className="aspect-video bg-zinc-100 rounded-xl overflow-hidden shadow-inner border border-zinc-200">
                                    <img
                                        src={selectedRequest.images[0]?.startsWith("http") ? selectedRequest.images[0] : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${selectedRequest.images[0]}`}
                                        className="w-full h-full object-contain"
                                        alt="Crop"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h2 className="text-xl font-bold">{selectedRequest.cropType}</h2>
                                        <Badge variant="outline">{selectedRequest.growthStage}</Badge>
                                    </div>
                                    <p className="text-zinc-600">{selectedRequest.description}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm bg-zinc-50 p-4 rounded-lg border border-zinc-100">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-zinc-400" />
                                        <div>
                                            <span className="text-zinc-500 text-xs block">Location</span>
                                            <span className="font-medium">{selectedRequest.location}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-zinc-400" />
                                        <div>
                                            <span className="text-zinc-500 text-xs block">Farmer</span>
                                            <span className="font-medium">{selectedRequest.farmer?.name?.first || 'Unknown'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 rounded-full bg-amber-900/20 border border-amber-900/50" />
                                        <div>
                                            <span className="text-zinc-500 text-xs block">Soil Type</span>
                                            <span className="font-medium">{selectedRequest.soilType || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 rounded-full bg-blue-500/20 border border-blue-500/50" />
                                        <div>
                                            <span className="text-zinc-500 text-xs block">Irrigation</span>
                                            <span className="font-medium">{selectedRequest.irrigationType || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Weather Context Widget */}
                                {selectedRequest.weatherContext && (
                                    <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 text-sm">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                                                Recorded Weather
                                            </h4>
                                            <span className="text-xs text-blue-600">{selectedRequest.weatherContext.forecast}</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                            <div className="bg-white p-2 rounded shadow-sm">
                                                <div className="text-xs text-blue-500">Temp</div>
                                                <div className="font-bold text-blue-900">{Math.round(selectedRequest.weatherContext.temperature)}°C</div>
                                            </div>
                                            <div className="bg-white p-2 rounded shadow-sm">
                                                <div className="text-xs text-blue-500">Humidity</div>
                                                <div className="font-bold text-blue-900">{selectedRequest.weatherContext.humidity}%</div>
                                            </div>
                                            <div className="bg-white p-2 rounded shadow-sm">
                                                <div className="text-xs text-blue-500">Rain</div>
                                                <div className="font-bold text-blue-900">{selectedRequest.weatherContext.rainfall}mm</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selectedRequest.aiAnalysis && (
                                    <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-semibold flex items-center gap-2">
                                                <Bot className="h-4 w-4 text-green-600" />
                                                AI Diagnosis
                                            </h3>
                                            <Badge variant={
                                                selectedRequest.aiAnalysis.severity === 'Critical' ? 'destructive' :
                                                    selectedRequest.aiAnalysis.severity === 'High' ? 'default' : 'secondary'
                                            }>
                                                {selectedRequest.aiAnalysis.severity} Severity
                                            </Badge>
                                        </div>

                                        <div className="mb-4">
                                            <p className="font-medium text-green-700 text-lg">{selectedRequest.aiAnalysis.disease}</p>
                                            <p className="text-sm text-zinc-600 mt-1">{selectedRequest.aiAnalysis.description}</p>
                                        </div>

                                        {/* Risk Prediction Display */}
                                        {selectedRequest.aiRiskAssessment?.riskLevel && (
                                            <div className="pt-3 border-t border-zinc-200">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Future Risk Prediction</span>
                                                    <Badge className={
                                                        selectedRequest.aiRiskAssessment.riskLevel === 'High' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                                                            selectedRequest.aiRiskAssessment.riskLevel === 'Medium' ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' :
                                                                'bg-green-100 text-green-700 hover:bg-green-200'
                                                    }>
                                                        {selectedRequest.aiRiskAssessment.riskLevel} Risk
                                                    </Badge>
                                                </div>

                                                {selectedRequest.aiRiskAssessment.weatherAlert && (
                                                    <div className="flex items-center gap-2 text-xs text-red-600 font-medium mb-1">
                                                        <AlertTriangle className="h-3 w-3" />
                                                        {selectedRequest.aiRiskAssessment.weatherAlert}
                                                    </div>
                                                )}

                                                <p className="text-xs text-zinc-500 italic border-l-2 border-zinc-300 pl-2">
                                                    "{selectedRequest.aiRiskAssessment.next7DaysForecast}"
                                                </p>
                                            </div>
                                        )}

                                        {activeTab === "pending" && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mt-4 w-full border-green-200 text-green-700 hover:bg-green-100"
                                                onClick={() => setResponseForm({
                                                    diagnosis: selectedRequest.aiAnalysis.disease,
                                                    treatment: selectedRequest.aiAnalysis.treatment?.join('\n\n') || "",
                                                    confidence: selectedRequest.aiAnalysis.confidence
                                                })}
                                            >
                                                <Bot className="mr-2 h-3 w-3" />
                                                Use AI Suggestion
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Right: Expert Response */}
                            <div className="space-y-6 flex flex-col h-full">
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">
                                        {activeTab === "answered" ? "Provided Response" : "Your Diagnosis"}
                                    </h3>

                                    {activeTab === "answered" ? (
                                        <div className="space-y-4">
                                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                                <Label className="text-blue-900 mb-1 block">Diagnosis</Label>
                                                <p className="text-blue-800">{selectedRequest.expertDiagnosis}</p>
                                            </div>
                                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                                <Label className="text-blue-900 mb-1 block">Treatment</Label>
                                                <p className="text-blue-800 whitespace-pre-wrap">{selectedRequest.treatment}</p>
                                            </div>
                                            <div>
                                                <Label className="mb-2 block">Confidence Level</Label>
                                                <div className="flex items-center gap-4">
                                                    <Slider
                                                        value={[selectedRequest.confidence]}
                                                        max={100}
                                                        step={1}
                                                        disabled
                                                        className="flex-1"
                                                    />
                                                    <span className="font-medium w-12 text-right">{selectedRequest.confidence}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {/* AI Feedback Section */}
                                            {selectedRequest.aiAnalysis && (
                                                <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200">
                                                    <Label className="mb-2 block">AI Assessment Accuracy</Label>
                                                    <div className="flex gap-2 mb-3">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className={`flex-1 ${aiFeedback === 'accurate' ? 'bg-green-100 border-green-500 text-green-700' : ''}`}
                                                            onClick={() => setAiFeedback('accurate')}
                                                        >
                                                            <CheckCircle2 className="mr-2 h-4 w-4" /> Accurate
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className={`flex-1 ${aiFeedback === 'partially_correct' ? 'bg-yellow-100 border-yellow-500 text-yellow-700' : ''}`}
                                                            onClick={() => setAiFeedback('partially_correct')}
                                                        >
                                                            <AlertTriangle className="mr-2 h-4 w-4" /> Partial
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className={`flex-1 ${aiFeedback === 'incorrect' ? 'bg-red-100 border-red-500 text-red-700' : ''}`}
                                                            onClick={() => setAiFeedback('incorrect')}
                                                        >
                                                            <AlertCircle className="mr-2 h-4 w-4" /> Incorrect
                                                        </Button>
                                                    </div>

                                                    {aiFeedback !== 'accurate' && (
                                                        <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                                                            <Label className="mb-1.5 block text-xs">Correction Reason</Label>
                                                            <Input
                                                                placeholder="e.g. Missed early symptoms, lighting issue..."
                                                                value={correctionReason}
                                                                onChange={(e) => setCorrectionReason(e.target.value)}
                                                                className="bg-white"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <Label>Expert Diagnosis</Label>
                                                <Input
                                                    placeholder="Enter your diagnosis..."
                                                    value={responseForm.diagnosis}
                                                    onChange={(e) => setResponseForm({ ...responseForm, diagnosis: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Recommended Treatment</Label>
                                                <Textarea
                                                    placeholder="Enter detailed treatment steps..."
                                                    className="min-h-[150px]"
                                                    value={responseForm.treatment}
                                                    onChange={(e) => setResponseForm({ ...responseForm, treatment: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Confidence Level: {responseForm.confidence}%</Label>
                                                <Slider
                                                    value={[responseForm.confidence]}
                                                    onValueChange={(vals) => setResponseForm({ ...responseForm, confidence: vals[0] })}
                                                    max={100}
                                                    step={1}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {activeTab === "pending" && (
                                    <div className="mt-auto pt-4">
                                        <Button
                                            className="w-full bg-green-600 hover:bg-green-700 text-white h-12"
                                            onClick={handleSubmitResponse}
                                            disabled={isSubmitting || !responseForm.diagnosis || !responseForm.treatment}
                                        >
                                            {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                                            Submit Advice
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog >
        </div >
    )
}
