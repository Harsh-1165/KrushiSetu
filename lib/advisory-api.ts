import { apiUrl, fetchWithAuth } from "./api"

export interface AdvisoryAnalysisResult {
  disease: string
  confidence: number
  severity: string
  detectedCrop: string
  cropConfidence?: number
  description?: string
  detailedAnalysis?: {
    visualObservations?: string
    symptomAnalysis?: string
    rootCause?: string
    stageAssessment?: string
  }
  treatment: string[]
  prevention: string[]
  growthRecommendations?: string[]
  otherIssues?: { name: string; confidence: number; severity?: string }[]
  aiRiskAssessment?: {
    riskLevel: string
    fungalRisk?: boolean
    droughtRisk?: boolean
    pestRisk?: boolean
    nutrientDeficiencyRisk?: boolean
    weatherAlert?: string
    next7DaysForecast?: string
    economicImpact?: string
  }
  expertiseLevel?: string
  followUpActions?: string[]
}

export const advisoryApi = {
  // 1. Analyze Image (Stateless)
  analyze: async (data: {
    imageUrl: string
    cropType: string
    growthStage: string
    description: string
    location?: string
    soilType?: string
    irrigationType?: string
    symptoms?: string[]
    temperature?: number
    recentRain?: string
  }): Promise<{ success: boolean; data: AdvisoryAnalysisResult; message?: string }> => {
    try {
      const res = await fetchWithAuth(apiUrl("/advisory/analyze"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      return await res.json()
    } catch (error) {
      console.error("Advisory Analysis Error:", error)
      return { success: false, data: {} as any, message: "Analysis failed" }
    }
  },

  // 2. Submit Final Report
  submit: async (data: any) => {
    try {
      const res = await fetchWithAuth(apiUrl("/advisory"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      return await res.json()
    } catch (error) {
      console.error("Advisory Submit Error:", error)
      return { success: false, message: "Submission failed" }
    }
  }
}
