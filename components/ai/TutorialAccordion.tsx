"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, ChevronDown } from "lucide-react";

export const TutorialAccordion = ({ data }: { data: any }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const rawTutorial = data?.tutorial || [];

    // Parse strings "Step 1: Title - Content" or just plain strings
    // We'll standardise them into objects
    const steps = rawTutorial.map((item: string) => {
        const parts = item.split(":");
        if (parts.length > 1) {
            return { title: parts[0].trim(), content: parts.slice(1).join(":").trim() };
        }
        return { title: "Advice", content: item };
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-800/30 border border-white/10 rounded-2xl p-6 h-full"
        >
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <BookOpen className="text-green-400" /> AI Farming Guide
            </h3>

            {steps.length > 0 ? (
                <div className="space-y-3">
                    {steps.map((step: any, index: number) => (
                        <div key={index} className="overflow-hidden rounded-xl bg-gray-900/40 border border-white/5">
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
                            >
                                <span className="font-medium text-gray-200">{step.title}</span>
                                <ChevronDown
                                    className={`text-gray-500 transition-transform ${openIndex === index ? "rotate-180" : ""}`}
                                    size={18}
                                />
                            </button>
                            <AnimatePresence>
                                {openIndex === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="px-4 pb-4 text-sm text-gray-400 leading-relaxed"
                                    >
                                        {step.content}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-500">No specific tutorial steps provided.</p>
            )}
        </motion.div>
    );
};
