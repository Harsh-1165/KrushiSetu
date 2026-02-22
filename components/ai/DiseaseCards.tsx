"use client";

import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, Activity, Sprout } from "lucide-react";

export const DiseaseCards = ({ data }: { data: any }) => {
    // Safe Access to API Data
    const cropName = data?.crop || "Crop";
    const plantHealth = data?.plantHealth || "Unknown Status";
    const confidence = data?.confidence ? Math.round(data.confidence * 100) : 0;

    // Primary diagnosis is the first disease found or just the health status
    const primaryDisease = data?.diseases && data.diseases.length > 0
        ? data.diseases[0].name
        : plantHealth;

    const isSoil = cropName === "Soil Sample";
    const isHealthy = plantHealth.toLowerCase().includes("healthy") || primaryDisease.toLowerCase().includes("healthy");

    // Dynamic Color Logic
    const getColors = () => {
        if (isSoil) return { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", bar: "bg-amber-500", iconBg: "bg-amber-500/20" };
        if (isHealthy) return { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400", bar: "bg-green-500", iconBg: "bg-green-500/20" };
        return { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", bar: "bg-red-500", iconBg: "bg-red-500/20" };
    };

    const colors = getColors();

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Main Diagnosis Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-6 rounded-xl border ${colors.bg} ${colors.border}`}
            >
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-lg ${colors.iconBg}`}>
                            {isHealthy ? <CheckCircle className={colors.text} /> : (isSoil ? <Sprout className={colors.text} /> : <AlertTriangle className={colors.text} />)}
                        </div>
                        <div>
                            <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">Diagnosis</h3>
                            <p className={`text-xl font-bold ${colors.text}`}>
                                {primaryDisease}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-bold text-white">{confidence}%</span>
                        <p className="text-xs text-gray-500">Confidence</p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${confidence}%` }}
                        className={`h-full ${colors.bar}`}
                    />
                </div>
            </motion.div>

            {/* Secondary Stats */}
            <div className="grid grid-rows-2 gap-4">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-4 bg-gray-800/50 border border-white/5 rounded-xl flex items-center justify-between"
                >
                    <div className="flex items-center gap-3">
                        <Activity className="text-yellow-400" size={20} />
                        <span className="text-gray-300">Health Status</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${isSoil ? "bg-amber-500/20 text-amber-400" : (isHealthy ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-500")
                        }`}>
                        {plantHealth}
                    </span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-4 bg-gray-800/50 border border-white/5 rounded-xl flex items-center justify-between"
                >
                    <div className="flex items-center gap-3">
                        <Sprout className="text-blue-400" size={20} />
                        <span className="text-gray-300">Detected Crop</span>
                    </div>
                    <span className="text-white font-medium">{cropName}</span>
                </motion.div>
            </div>
        </div>
    );
};
