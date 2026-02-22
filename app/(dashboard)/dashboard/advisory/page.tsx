"use client";

import React, { useState } from "react";
import { AiHeroSection } from "@/components/ai/AiHeroSection";
import { AiInputPanel } from "@/components/ai/AiInputPanel";
import { AiLoader } from "@/components/ai/AiLoader";
import { AiResultsDashboard } from "@/components/ai/AiResultsDashboard";
import { AnimatePresence, motion } from "framer-motion";
import { getAccessToken } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export default function AdvisoryPage() {
    const [view, setView] = useState<"input" | "loading" | "results">("input");
    const [prompt, setPrompt] = useState("");
    const [resultData, setResultData] = useState<any>(null);

    // Real AI Analysis
    const handleAnalyze = async (data: { image: File | null; prompt: string; soilData?: any; location?: any; analysisMode?: string }) => {
        setView("loading");

        try {
            const formData = new FormData();
            if (data.image) formData.append("image", data.image);
            formData.append("prompt", data.prompt || "Analyze this crop");
            formData.append("analysisMode", data.analysisMode || "crop");

            if (data.soilData) formData.append("soilData", JSON.stringify(data.soilData));
            if (data.location) {
                formData.append("lat", data.location.lat.toString());
                formData.append("lng", data.location.lng.toString());
            }

            const token = getAccessToken();
            const response = await fetch(`${API_BASE}/advisory/analyze`, {
                method: 'POST',
                body: formData,
                headers: token ? { "Authorization": `Bearer ${token}` } : {}
            });

            const text = await response.text();
            console.log("Raw Server Response:", text); // Debug log

            let json;
            try {
                json = JSON.parse(text);
            } catch (e) {
                console.error("Failed to parse JSON:", text);
                throw new Error(`Server response was not JSON (${response.status} ${response.statusText}): ${text.substring(0, 50)}...`);
            }

            if (!response.ok) {
                throw new Error(json.message || "Analysis failed");
            }

            setResultData(json.data);
            setView("results");

        } catch (error) {
            console.error("Analysis Error:", error);
            // Reset to input on error or show error state (simplified for now)
            alert("AI Analysis failed. Please try again. " + (error as Error).message);
            setView("input");
        }
    };

    const handleQuickAction = (action: string) => {
        setPrompt(action);
    };

    return (
        <div className="min-h-screen bg-green-950/20 p-6 md:p-12 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto">
                <AnimatePresence mode="wait">
                    {view === "input" && (
                        <motion.div
                            key="input"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <AiHeroSection onQuickAction={handleQuickAction} />
                            <AiInputPanel
                                onAnalyze={handleAnalyze}
                                isAnalyzing={false}
                                prompt={prompt}
                                setPrompt={setPrompt}
                            />
                        </motion.div>
                    )}

                    {view === "loading" && (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-white">AI is thinking...</h2>
                                <p className="text-gray-400">Analyzing your crop data</p>
                            </div>
                            <AiLoader />
                        </motion.div>
                    )}

                    {view === "results" && (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1 }}
                        >
                            <button
                                onClick={() => setView("input")}
                                className="mb-8 text-green-400 hover:text-green-300 flex items-center gap-2 text-sm font-medium"
                            >
                                ← Back to Search
                            </button>
                            <AiResultsDashboard data={resultData} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
