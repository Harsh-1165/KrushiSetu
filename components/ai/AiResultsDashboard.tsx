"use client";

import React from "react";
import { motion } from "framer-motion";
import { DiseaseCards } from "./DiseaseCards";
import { RecommendationPanel } from "./RecommendationPanel";
import { GrowthTimeline } from "./GrowthTimeline";
import { TutorialAccordion } from "./TutorialAccordion";
import { WeatherWidget } from "./WeatherWidget";
import { SoilHealthWidget } from "./SoilHealthWidget";

export const AiResultsDashboard = ({ data }: { data: any }) => {
    const scanData = data?.scan;
    const soilData = data?.soil;
    const weatherData = data?.weather;

    // Determine scan state
    const scanStatus = scanData?.status; // "invalid_image" | "model_error" | undefined (ok)
    const isScanError = scanStatus === "model_error";
    const isInvalidImage = scanStatus === "invalid_image";
    const isScanOk = scanData && !isScanError && !isInvalidImage;

    return (
        <div className="w-full max-w-6xl mx-auto">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center mb-8"
            >
                <h2 className="text-2xl font-bold text-white mb-2">
                    {isScanError || isInvalidImage ? "Analysis Result ⚠️" : "Analysis Complete ✅"}
                </h2>
                <p className="text-gray-400">
                    {isScanError || isInvalidImage
                        ? "There was an issue with the crop scan"
                        : "Here is your customized smart farming report"}
                </p>
            </motion.div>

            {/* Top Row: Weather & Soil (if available) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {weatherData && <WeatherWidget data={weatherData} />}
                {soilData && !soilData.status && <SoilHealthWidget data={soilData} />}
            </div>

            {/* Invalid Image Warning */}
            {isInvalidImage && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-6 py-5 mb-8 text-center"
                >
                    <p className="text-2xl mb-2">🌿</p>
                    <p className="text-yellow-300 font-semibold text-lg">Non-Agricultural Image Detected</p>
                    <p className="text-yellow-200/70 text-sm mt-1">
                        {scanData?.message || "Please upload a clear photo of a crop leaf, plant, or soil sample."}
                    </p>
                </motion.div>
            )}

            {/* Model Error */}
            {isScanError && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-red-500/40 bg-red-500/10 px-6 py-5 mb-8 text-center"
                >
                    <p className="text-2xl mb-2">⚙️</p>
                    <p className="text-red-300 font-semibold text-lg">ML Model Error</p>
                    <p className="text-red-200/70 text-sm mt-1">
                        {scanData?.message || scanData?.error || "The local ML model encountered an error. Please ensure TensorFlow and model files are present."}
                    </p>
                </motion.div>
            )}

            {/* Main Crop Diagnosis — only shown for successful scans */}
            {isScanOk && (
                <>
                    <DiseaseCards data={scanData} />
                    <RecommendationPanel data={scanData} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <GrowthTimeline data={scanData} />
                        <TutorialAccordion data={scanData} />
                    </div>
                </>
            )}

            {/* Bottom Actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col md:flex-row justify-center gap-4 mt-12 mb-20"
            >
                <button className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-green-500/20">
                    📥 Save Crop Record
                </button>
                <button className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl border border-white/10 transition-colors">
                    👨‍🌾 Request Expert Review
                </button>
            </motion.div>
        </div>
    );
};

