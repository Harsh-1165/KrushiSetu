"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Camera, Mic, Send, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface AiInputPanelProps {
    onAnalyze: (data: { image: File | null; prompt: string; soilData?: any; location?: any; analysisMode?: string }) => void;
    isAnalyzing: boolean;
    prompt: string;
    setPrompt: (text: string) => void;
}

export const AiInputPanel = ({ onAnalyze, isAnalyzing, prompt, setPrompt }: AiInputPanelProps) => {
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [analysisMode, setAnalysisMode] = useState<"crop" | "soil">("crop");

    // Soil & Location State
    const [soilData, setSoilData] = useState({ N: "", P: "", K: "", pH: "" });
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locError, setLocError] = useState("");

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const clearImage = () => {
        setImage(null);
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const getLocation = () => {
        if (!navigator.geolocation) {
            setLocError("Geolocation not supported");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setLocError("");
            },
            (err) => setLocError("Failed to get location")
        );
    };

    const handleSubmit = () => {
        // Validation:
        // Crop Mode: Needs Image OR Prompt
        // Soil Mode: Needs Soil Data OR Image (for visual soil check)
        const hasSoilData = Object.values(soilData).some(v => v);

        if (analysisMode === "crop" && !image && !prompt.trim()) return;
        if (analysisMode === "soil" && !image && !hasSoilData) return;

        // Prepare payload
        const payload: any = { image, prompt, analysisMode };

        if (showAdvanced || analysisMode === "soil") {
            if (hasSoilData) payload.soilData = soilData;
            if (location) payload.location = location;
        }

        onAnalyze(payload);
    };

    const quickPrompts = [
        "🦠 Detect Disease",
        "🧪 Fertilizer Suggestion",
        "💧 Irrigation Advice",
        "🌤 Weather Impact",
        "🌱 Soil Health",
        "📅 Crop Growth Stage"
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl max-w-3xl mx-auto"
        >
            {/* Mode Selector */}
            <div className="flex gap-4 mb-6 bg-black/20 p-1.5 rounded-xl w-fit mx-auto">
                <button
                    onClick={() => { setAnalysisMode("crop"); setShowAdvanced(false); }}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${analysisMode === "crop" ? "bg-green-600 text-white shadow-lg" : "text-gray-400 hover:text-white"}`}
                >
                    🌿 Crop Disease
                </button>
                <button
                    onClick={() => { setAnalysisMode("soil"); setShowAdvanced(true); }}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${analysisMode === "soil" ? "bg-amber-600 text-white shadow-lg" : "text-gray-400 hover:text-white"}`}
                >
                    🪨 Soil Health
                </button>
            </div>

            {/* Image Upload Area */}
            <div
                className={`relative border-2 border-dashed rounded-xl p-8 mb-6 transition-all duration-300 ${isDragOver ? "border-green-500 bg-green-500/10" : "border-gray-700 hover:border-green-500/50 hover:bg-white/5"
                    }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                />

                <AnimatePresence mode="wait">
                    {preview ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="relative w-full h-64 mx-auto rounded-lg overflow-hidden group"
                        >
                            <Image
                                src={preview}
                                alt="Crop preview"
                                layout="fill"
                                objectFit="contain"
                                className="rounded-lg"
                            />
                            <button
                                onClick={(e) => { e.stopPropagation(); clearImage(); }}
                                className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-red-500/80 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center text-center cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                                <Camera className="w-8 h-8 text-green-400" />
                            </div>
                            <h3 className="text-lg font-medium text-white mb-1">
                                Upload crop image
                            </h3>
                            <p className="text-sm text-gray-400">
                                Drag & drop or click to browse (JPG, PNG)
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Input Area */}
            <div className="relative mb-6">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your crop problem (e.g., leaves turning yellow, slow growth...)"
                    className="w-full bg-black/30 border border-gray-700 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 min-h-[100px] resize-none"
                />
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <button className="p-2 text-gray-400 hover:text-white transition-colors">
                        <Mic size={18} />
                    </button>
                    <span className="text-xs text-gray-600 font-mono">{prompt.length} chars</span>
                </div>
            </div>

            {/* Advanced Toggle */}
            <div className="mb-6">
                {analysisMode === "crop" && (
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="text-green-400 text-sm font-medium hover:text-green-300 flex items-center gap-2"
                    >
                        {showAdvanced ? "▲ Hide Advanced Options" : "▼ Add Soil & Weather Data"}
                    </button>
                )}

                <AnimatePresence>
                    {(showAdvanced || analysisMode === "soil") && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mt-4 bg-white/5 rounded-xl border border-white/10 p-4"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-white text-sm font-bold mb-3">📍 Location (For Weather)</h4>
                                    <button
                                        onClick={getLocation}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${location ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                                    >
                                        {location ? "Location Set ✅" : "Detect My Location"}
                                    </button>
                                    {location && <p className="text-xs text-gray-400 mt-2">Lat: {location.lat.toFixed(2)}, Lng: {location.lng.toFixed(2)}</p>}
                                    {locError && <p className="text-xs text-red-400 mt-2">{locError}</p>}
                                </div>

                                <div>
                                    <h4 className="text-white text-sm font-bold mb-3">🧪 Soil Data (Optional)</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="number" placeholder="N (Nitrogen)"
                                            value={soilData.N}
                                            onChange={e => {
                                                setSoilData({ ...soilData, N: e.target.value });
                                                if (e.target.value && analysisMode !== "soil") setAnalysisMode("soil");
                                            }}
                                            className="bg-black/40 border border-gray-600 rounded p-2 text-white text-sm"
                                        />
                                        <input
                                            type="number" placeholder="P (Phosphorus)"
                                            value={soilData.P}
                                            onChange={e => {
                                                setSoilData({ ...soilData, P: e.target.value });
                                                if (e.target.value && analysisMode !== "soil") setAnalysisMode("soil");
                                            }}
                                            className="bg-black/40 border border-gray-600 rounded p-2 text-white text-sm"
                                        />
                                        <input
                                            type="number" placeholder="K (Potassium)"
                                            value={soilData.K}
                                            onChange={e => {
                                                setSoilData({ ...soilData, K: e.target.value });
                                                if (e.target.value && analysisMode !== "soil") setAnalysisMode("soil");
                                            }}
                                            className="bg-black/40 border border-gray-600 rounded p-2 text-white text-sm"
                                        />
                                        <input
                                            type="number" placeholder="pH Level"
                                            value={soilData.pH}
                                            onChange={e => {
                                                setSoilData({ ...soilData, pH: e.target.value });
                                                if (e.target.value && analysisMode !== "soil") setAnalysisMode("soil");
                                            }}
                                            className="bg-black/40 border border-gray-600 rounded p-2 text-white text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                {/* Smart Chips */}
                <div className="flex flex-wrap gap-2 flex-1">
                    {quickPrompts.map((p) => (
                        <button
                            key={p}
                            onClick={() => setPrompt(p)}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-xs text-gray-300 transition-colors"
                        >
                            {p}
                        </button>
                    ))}
                </div>

                {/* Send Button */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSubmit}
                    disabled={isAnalyzing || (!prompt && !image)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all ${isAnalyzing || (!prompt && !image)
                        ? "bg-gray-700 cursor-not-allowed text-gray-400"
                        : "bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-green-500/25"
                        }`}
                >
                    {isAnalyzing ? (
                        <>
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Analyzing...
                        </>
                    ) : (
                        <>
                            <Send size={18} />
                            Ask AI
                        </>
                    )}
                </motion.button>
            </div>
        </motion.div>
    );
};
