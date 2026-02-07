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
    Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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

    const fetchRequests = async () => {
        try {
            const res = await fetchWithAuth(apiUrl("/advisory"))
            if (res.success) {
                setRequests(res.data)
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
                body: JSON.stringify({
                    expertDiagnosis: responseForm.diagnosis,
                    treatment: responseForm.treatment,
                    confidence: responseForm.confidence
                })
            })

            if (res.success) {
                // Update list locally
                setRequests(prev => prev.map(r => r._id === selectedRequest._id ? res.data : r))
                setSelectedRequest(null) // Close dialog
            }
        } catch (err) {
            console.error(err)
        } finally {
            setIsSubmitting(false)
        }
    }

    // Filter for pending vs answered
    const pendingRequests = requests.filter(r => r.status === "pending")
    const answeredRequests = requests.filter(r => r.status === "answered")

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
                <div className="flex gap-2">
                    <Badge variant="outline" className="px-3 py-1 border-green-500 text-green-600 bg-green-50">
                        {pendingRequests.length} Pending
                    </Badge>
                    <Badge variant="outline" className="px-3 py-1 border-zinc-200 text-zinc-600">
                        {answeredRequests.length} Answered
                    </Badge>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-green-600" /></div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingRequests.length === 0 && <p className="col-span-full text-center text-muted-foreground py-12">No pending requests.</p>}

                    {pendingRequests.map((req) => (
                        <Card key={req._id} className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-green-500" onClick={() => setSelectedRequest(req)}>
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <Badge>{req.cropType}</Badge>
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
                                    {req.images[0] && <img src={req.images[0]} className="w-full h-full object-cover" alt="Crop" />}
                                    {req.aiPrediction && (
                                        <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-sm p-2 rounded flex items-center gap-2">
                                            <Bot className="h-3 w-3 text-green-400" />
                                            <div className="text-xs text-white">
                                                <span className="text-green-400 font-bold">{req.aiPrediction.confidence}%</span> {req.aiPrediction.disease}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm text-zinc-600 line-clamp-2">{req.description}</p>
                            </CardContent>
                            <CardFooter className="pt-0">
                                <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={() => setSelectedRequest(req)}>Review & Answer</Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {/* Detail Dialog */}
            <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Case #{selectedRequest?._id?.substring(0, 8)}</DialogTitle>
                    </DialogHeader>
                    {selectedRequest && (
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Left: Case Details */}
                            <div className="space-y-6">
                                <div className="aspect-video bg-zinc-100 rounded-xl overflow-hidden shadow-inner">
                                    <img src={selectedRequest.images[0]} className="w-full h-full object-contain" alt="Crop" />
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <Label className="text-muted-foreground">Crop</Label>
                                            <p className="font-semibold">{selectedRequest.cropType}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Growth Stage</Label>
                                            <p className="font-semibold">{selectedRequest.growthStage}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Location</Label>
                                            <p className="font-semibold">{selectedRequest.location}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Farmer</Label>
                                            <p className="font-semibold">{selectedRequest.farmer?.name?.first} {selectedRequest.farmer?.name?.last}</p>
                                        </div>
                                    </div>

                                    <div className="bg-zinc-50 p-4 rounded-lg border">
                                        <Label className="text-muted-foreground mb-1 block">Description</Label>
                                        <p className="text-sm">{selectedRequest.description}</p>
                                    </div>

                                    {selectedRequest.aiPrediction && (
                                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Bot className="h-4 w-4 text-green-600" />
                                                <span className="font-bold text-green-800">AI Analysis</span>
                                            </div>
                                            <p className="text-sm text-green-700">Flagged as <strong>{selectedRequest.aiPrediction.disease}</strong> with {selectedRequest.aiPrediction.confidence}% confidence.</p>
                                            <p className="text-xs text-green-600 mt-1 italic">"{selectedRequest.aiPrediction.description}"</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right: Expert Response */}
                            <div className="space-y-6 flex flex-col h-full">
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">Your Diagnosis</h3>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Identified Disease / Issue</Label>
                                            <Select onValueChange={(val) => setResponseForm({ ...responseForm, diagnosis: val })}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select diagnosis" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Leaf Rust">Leaf Rust</SelectItem>
                                                    <SelectItem value="Blight">Blight</SelectItem>
                                                    <SelectItem value="Nutrient Deficiency">Nutrient Deficiency</SelectItem>
                                                    <SelectItem value="Pest Infestation">Pest Infestation</SelectItem>
                                                    <SelectItem value="Healthy">Healthy / Normal</SelectItem>
                                                    <SelectItem value="Water Stress">Water Stress</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Recommended Treatment</Label>
                                            <Textarea
                                                placeholder="Enter detailed steps for the farmer..."
                                                className="min-h-[150px]"
                                                value={responseForm.treatment}
                                                onChange={(e) => setResponseForm({ ...responseForm, treatment: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <Label>Confidence Level</Label>
                                                <span className="text-sm text-muted-foreground">{responseForm.confidence}%</span>
                                            </div>
                                            <Slider
                                                defaultValue={[85]}
                                                max={100}
                                                step={5}
                                                onValueChange={(vals) => setResponseForm({ ...responseForm, confidence: vals[0] })}
                                            />
                                        </div>
                                    </div>
                                </div>

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
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
