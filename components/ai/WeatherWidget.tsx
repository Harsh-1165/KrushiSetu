"use client";

import React from "react";
import { CloudSun, Droplets, Wind, MapPin } from "lucide-react";

export const WeatherWidget = ({ data }: { data: any }) => {
    if (!data) return null;

    return (
        <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 border border-blue-500/20 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="flex justify-between items-start z-10 relative">
                <div>
                    <div className="flex items-center gap-2 text-blue-200 mb-1">
                        <MapPin size={16} />
                        <span className="text-sm font-medium">{data.location || "Unknown Location"}</span>
                    </div>
                    <div className="text-4xl font-bold mb-1">{Math.round(data.temp)}°C</div>
                    <div className="text-blue-100 capitalize">{data.description}</div>
                </div>

                <div className="bg-white/10 p-3 rounded-full">
                    <CloudSun size={32} className="text-yellow-400" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 z-10 relative">
                <div className="bg-black/20 rounded-lg p-3 flex items-center gap-3">
                    <Droplets size={20} className="text-blue-400" />
                    <div>
                        <div className="text-xs text-blue-200">Humidity</div>
                        <div className="font-bold">{data.humidity}%</div>
                    </div>
                </div>
                <div className="bg-black/20 rounded-lg p-3 flex items-center gap-3">
                    <Wind size={20} className="text-gray-400" />
                    <div>
                        <div className="text-xs text-blue-200">Wind</div>
                        <div className="font-bold">{data.windSpeed} m/s</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
