"use client";

import React from "react";
import { motion } from "framer-motion";
import { Bot, Sprout, CloudSun, BookOpen, Sparkles } from "lucide-react";

export const AiHeroSection = ({ onQuickAction }: { onQuickAction: (action: string) => void }) => {
    const chips = [
        { icon: Sprout, label: "Disease Detection", action: "Check my crop for diseases" },
        { icon: Sparkles, label: "Soil Analysis", action: "Analyze soil health condition" },
        { icon: CloudSun, label: "Weather Advisory", action: "Get weather-based farming advice" },
        { icon: BookOpen, label: "Crop Guide", action: "Best practices for crop growth" },
    ];

    return (
        <div className="text-center mb-8 relative">
            {/* Animated Avatar */}
            <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="mx-auto w-20 h-20 bg-gradient-to-tr from-green-500 to-emerald-700 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 mb-4 border-2 border-white/20 relative overflow-hidden"
            >
                <Bot className="w-10 h-10 text-white" />
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-t-2 border-white/30 rounded-full"
                />
            </motion.div>

            {/* Title & Subtitle */}
            <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl md:text-4xl font-bold text-white mb-2"
            >
                <span className="text-green-400">GreenTrace</span> AI Crop Advisory
            </motion.h1>
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-gray-400 max-w-lg mx-auto mb-8"
            >
                Upload crop image, ask AI, and get real-time smart farming solutions.
            </motion.p>

            {/* Quick Action Chips */}
            <div className="flex flex-wrap justify-center gap-3">
                {chips.map((chip, index) => (
                    <motion.button
                        key={chip.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        whileHover={{ scale: 1.05, backgroundColor: "rgba(34, 197, 94, 0.2)" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onQuickAction(chip.action)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm font-medium text-green-100 hover:border-green-500/50 transition-colors backdrop-blur-sm"
                    >
                        <chip.icon className="w-4 h-4 text-green-400" />
                        {chip.label}
                    </motion.button>
                ))}
            </div>
        </div>
    );
};
