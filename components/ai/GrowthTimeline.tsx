"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sprout, Sun, Thermometer, CloudRain } from "lucide-react";

export const GrowthTimeline = ({ data }: { data: any }) => {
    const growth = data?.growthStage || {};
    const weather = data?.weatherImpact || {};
    const currentStage = growth.stage || "Unknown";
    const daysToHarvest = growth.daysToHarvest || "?";

    // Available stages for visualization
    const stages = ["Seedling", "Vegetative", "Flowering", "Fruiting", "Harvest"];

    // Simple mapping to index
    const getStageIndex = (stageName: string) => {
        const lower = stageName.toLowerCase();
        if (lower.includes("seed")) return 0;
        if (lower.includes("veg")) return 1;
        if (lower.includes("flower")) return 2;
        if (lower.includes("fruit")) return 3;
        if (lower.includes("harvest") || lower.includes("mature")) return 4;
        return 1; // Default
    };

    const currentIndex = getStageIndex(currentStage);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-800/30 border border-white/10 rounded-2xl p-6 mb-6 h-full"
        >
            <h3 className="text-lg font-bold text-white mb-6">Crop Growth Intelligence</h3>

            {/* Growth Stage Tracker */}
            <div className="relative mb-8 px-4 mt-8">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-700 -translate-y-1/2 rounded-full" />
                <div
                    className="absolute top-1/2 left-0 h-1 bg-green-500 -translate-y-1/2 rounded-full transition-all duration-1000"
                    style={{ width: `${(currentIndex / 4) * 100}%` }}
                />

                <div className="relative flex justify-between">
                    {stages.map((stage, i) => (
                        <div key={stage} className="flex flex-col items-center">
                            <div className={`w-4 h-4 rounded-full border-2 z-10 ${i <= currentIndex ? "bg-green-500 border-green-500" : "bg-gray-800 border-gray-600"
                                }`} />
                            <span className={`text-[10px] md:text-xs mt-2 ${i === currentIndex ? "text-green-400 font-bold scale-110" : "text-gray-500"}`}>
                                {stage}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-900/50 rounded-xl border border-white/5">
                    <CloudRain className="mx-auto text-blue-400 mb-2" size={24} />
                    <div className="text-xs text-gray-400">Weather Risk</div>
                    <div className={`font-bold ${weather.riskLevel === "High" ? "text-red-400" : "text-white"}`}>
                        {weather.riskLevel || "Low"}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1 line-clamp-1">{weather.advice}</div>
                </div>

                <div className="text-center p-4 bg-gray-900/50 rounded-xl border border-white/5">
                    <Sprout className="mx-auto text-green-500 mb-2" size={24} />
                    <div className="text-xs text-gray-400">Est. Harvest</div>
                    <div className="font-bold text-white">{daysToHarvest} Days</div>
                    <div className="text-[10px] text-gray-500 mt-1">{currentStage} Phase</div>
                </div>
            </div>
        </motion.div>
    );
};
