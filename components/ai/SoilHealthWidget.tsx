"use client";

import React from "react";
import { Sprout, AlertTriangle, CheckCircle } from "lucide-react";

export const SoilHealthWidget = ({ data }: { data: any }) => {
    if (!data) return null;

    const isHealthy = data.status === "Balanced Soil";

    return (
        <div className={`rounded-2xl p-6 border ${isHealthy ? "bg-green-900/20 border-green-500/20" : "bg-orange-900/20 border-orange-500/20"} text-white`}>
            <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-full ${isHealthy ? "bg-green-500/20 text-green-400" : "bg-orange-500/20 text-orange-400"}`}>
                    <Sprout size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-lg">Soil Analysis</h3>
                    <div className={`text-sm ${isHealthy ? "text-green-300" : "text-orange-300"}`}>{data.status}</div>
                </div>
            </div>

            <div className="bg-black/20 rounded-xl p-4 mb-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Recommendation</h4>
                <p className="text-sm leading-relaxed">{data.recommendation}</p>
            </div>

            <div className="flex gap-2">
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-white/5 rounded border border-white/10">
                    Type: {data.soilType}
                </span>
            </div>
        </div>
    );
};
