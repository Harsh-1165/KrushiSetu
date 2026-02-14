"use client"

import { useState, useEffect } from "react"
import { apiUrl, fetchWithAuth } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Download, AlertTriangle, CheckCircle2, TrendingUp, BrainCircuit } from "lucide-react"

export default function AiLearningPage() {
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetchWithAuth(apiUrl("/ai-feedback/stats"))
                const data = await res.json()
                if (data.success) {
                    setStats(data)
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    const handleExport = async () => {
        try {
            const res = await fetchWithAuth(apiUrl("/ai-feedback/export"))
            if (res.ok) {
                const blob = await res.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `ai_training_data_${new Date().toISOString().split('T')[0]}.json`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
            }
        } catch (err) {
            console.error("Export failed", err)
        }
    }

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-green-600" /></div>

    if (!stats) return <div className="p-8 text-center text-muted-foreground">Failed to load statistics.</div>

    // Calculate overall accuracy
    const accurateCount = stats.accuracyStats.find((s: any) => s._id === 'accurate')?.count || 0
    const overallAccuracy = stats.totalCases > 0 ? Math.round((accurateCount / stats.totalCases) * 100) : 0

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <BrainCircuit className="text-purple-600" />
                        AI Learning Center
                    </h1>
                    <p className="text-muted-foreground">Monitor AI performance and export training data from expert feedback.</p>
                </div>
                <Button variant="outline" onClick={handleExport} className="gap-2 border-purple-200 text-purple-700 hover:bg-purple-50">
                    <Download className="h-4 w-4" />
                    Export Labeled Dataset
                </Button>
            </div>

            {/* Key Metrics */}
            <div className="grid md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Reviewed Cases</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.totalCases}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Overall AI Accuracy</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <div className="text-3xl font-bold text-green-600">{overallAccuracy}%</div>
                            {overallAccuracy > 80 ? <TrendingUp className="text-green-500 h-5 w-5" /> : <AlertTriangle className="text-yellow-500 h-5 w-5" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Based on expert validation</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Correction Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-orange-600">{100 - overallAccuracy}%</div>
                        <p className="text-xs text-muted-foreground mt-1">Cases requiring expert intervention</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Accuracy by Crop */}
                <Card>
                    <CardHeader>
                        <CardTitle>Accuracy by Crop Type</CardTitle>
                        <CardDescription>Performance breakdown across different crops</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {stats.cropStats.map((crop: any) => (
                            <div key={crop._id} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium capitalize">{crop._id}</span>
                                    <span className="text-muted-foreground">{Math.round(crop.accuracyPercentage)}% ({crop.correct}/{crop.total})</span>
                                </div>
                                <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${crop.accuracyPercentage > 80 ? 'bg-green-500' : crop.accuracyPercentage > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                        style={{ width: `${crop.accuracyPercentage}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                        {stats.cropStats.length === 0 && <p className="text-sm text-muted-foreground italic">No data available yet.</p>}
                    </CardContent>
                </Card>

                {/* Common Misdiagnoses */}
                <Card>
                    <CardHeader>
                        <CardTitle>Common Misdiagnoses</CardTitle>
                        <CardDescription>Where AI predictions differed from expert diagnosis</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.misdiagnoses.map((item: any, idx: number) => (
                                <div key={idx} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                                    <AlertTriangle className="h-5 w-5 text-red-500 bg-red-100 rounded-full p-0.5 mt-0.5" />
                                    <div>
                                        <div className="text-sm font-medium text-red-900">
                                            AI said "{item._id.ai}" but Expert said "{item._id.expert}"
                                        </div>
                                        <div className="text-xs text-red-600 mt-1">
                                            Occurred {item.count} times
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {stats.misdiagnoses.length === 0 && <p className="text-sm text-muted-foreground italic">No misdiagnoses recorded yet.</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
