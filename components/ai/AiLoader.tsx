"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Scan, Brain, CloudSun, Sprout } from "lucide-react";

export const AiLoader = () => {
    const [step, setStep] = useState(0);

    const steps = [
        { text: "Scanning crop image...", icon: Scan },
        { text: "Detecting plant & disease...", icon: Sprout },
        { text: "Analyzing soil & weather data...", icon: CloudSun },
        { text: "Generating smart recommendations...", icon: Brain },
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center py-12">
            {/* Animated Circle */}
            <div className="relative w-32 h-32 mb-8">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-full h-full border-4 border-green-500/30 border-t-green-500 rounded-full"
                />
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    key={step}
                    className="absolute inset-0 flex items-center justify-center text-green-400"
                >
                    {React.createElement(steps[step].icon, { size: 48 })}
                </motion.div>
            </div>

            {/* Steps Text */}
            <div className="space-y-4 w-full max-w-md">
                {steps.map((s, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{
                            opacity: index === step ? 1 : index < step ? 0.5 : 0.2,
                            x: 0,
                            scale: index === step ? 1.05 : 1
                        }}
                        className="flex items-center gap-4 text-lg"
                    >
                        {index < step ? (
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <span className="text-black text-xs font-bold">✓</span>
                            </div>
                        ) : (
                            <div className={`w-6 h-6 rounded-full border-2 ${index === step ? "border-green-500 animate-pulse" : "border-gray-700"}`} />
                        )}
                        <span className={index === step ? "text-green-400 font-medium" : "text-gray-500"}>
                            {s.text}
                        </span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
