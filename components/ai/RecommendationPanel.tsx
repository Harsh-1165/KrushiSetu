"use client";

import React from "react";
import { motion } from "framer-motion";
import { Pill, Droplets, SprayCan, Leaf } from "lucide-react";

export const RecommendationPanel = ({ data }: { data: any }) => {
    const recommendations = data?.recommendations || {};

    const organicTreatments = recommendations.organicTreatment || [];
    const chemicalTreatments = recommendations.chemicalTreatment || [];
    const irrigationAdvice = recommendations.irrigationAdvice || "Monitor soil moisture regularly.";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800/30 border border-white/10 rounded-2xl p-6 mb-6"
        >
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Leaf className="text-green-400" /> AI Recommendations
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Treatment Column */}
                <div className="bg-gray-900/50 p-5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 mb-4 text-green-400">
                        <SprayCan size={20} />
                        <h4 className="font-bold">Organic Treatment</h4>
                    </div>
                    {organicTreatments.length > 0 ? (
                        <ul className="space-y-3">
                            {organicTreatments.slice(0, 3).map((t: string, i: number) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                    <span className="mt-1 w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0" />
                                    <span>{t}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500">No specific organic advice.</p>
                    )}
                </div>

                {/* Chemical Column */}
                <div className="bg-gray-900/50 p-5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 mb-4 text-orange-400">
                        <Pill size={20} />
                        <h4 className="font-bold">Chemical Control</h4>
                    </div>
                    {chemicalTreatments.length > 0 ? (
                        <ul className="space-y-3">
                            {chemicalTreatments.slice(0, 3).map((t: string, i: number) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                    <span className="mt-1 w-1.5 h-1.5 bg-orange-500 rounded-full flex-shrink-0" />
                                    <span>{t}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500">No chemical necessary.</p>
                    )}
                </div>

                {/* Irrigation Column */}
                <div className="bg-gray-900/50 p-5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 mb-4 text-blue-400">
                        <Droplets size={20} />
                        <h4 className="font-bold">Irrigation Advice</h4>
                    </div>
                    <p className="text-sm text-gray-300 mb-3 leading-relaxed">
                        {irrigationAdvice}
                    </p>
                </div>
            </div>
        </motion.div>
    );
};
