"use client"

import * as React from "react"
import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { apiUrl, fetchWithAuth } from "@/lib/api"

interface CropUploadProps {
    onUpload: (urls: string[]) => void
    maxFiles?: number
}

export function CropUpload({ onUpload, maxFiles = 3 }: CropUploadProps) {
    const [files, setFiles] = useState<File[]>([])
    const [previews, setPreviews] = useState<string[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const [uploadError, setUploadError] = useState("")

    const onDrop = useCallback((acceptedFiles: File[]) => {
        // Basic validation
        const validFiles = acceptedFiles.filter(file => file.type.startsWith("image/"))

        setFiles(prev => [...prev, ...validFiles].slice(0, maxFiles))

        // Create previews
        const newPreviews = validFiles.map(file => URL.createObjectURL(file))
        setPreviews(prev => [...prev, ...newPreviews].slice(0, maxFiles))
    }, [maxFiles])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.webp']
        },
        maxFiles
    })

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
        setPreviews(prev => {
            // Revoke URL to avoid memory leaks
            URL.revokeObjectURL(prev[index])
            return prev.filter((_, i) => i !== index)
        })
    }

    const handleUpload = async () => {
        if (files.length === 0) return

        setIsUploading(true)
        setUploadError("")

        try {
            const uploadedUrls: string[] = []

            for (const file of files) {
                const formData = new FormData()
                formData.append("image", file)

                // Use the existing upload route (assuming it exists based on other routes)
                // Adjust endpoint if necessary
                const res = await fetchWithAuth(apiUrl("/uploads/advisory"), {
                    method: "POST",
                    body: formData,
                    // Don't set Content-Type header, browser sets it with boundary for FormData
                })

                if (!res.ok) throw new Error("Upload failed")

                const data = await res.json()
                uploadedUrls.push(data.url) // Adjust based on actual response structure
            }

            onUpload(uploadedUrls)
            // Clear files after successful upload
            setFiles([])
            setPreviews([])

        } catch (err) {
            console.error(err)
            setUploadError("Failed to upload images. Please try again.")
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="space-y-4">
            <div
                {...getRootProps()}
                className={cn(
                    "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
                    isDragActive ? "border-green-500 bg-green-500/10" : "border-zinc-700 hover:border-green-500/50 hover:bg-zinc-800/50",
                    files.length >= maxFiles && "opacity-50 pointer-events-none"
                )}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-2">
                    <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center">
                        <Upload className="h-6 w-6 text-zinc-400" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-white">
                            {isDragActive ? "Drop images here" : "Click or drag to upload"}
                        </p>
                        <p className="text-xs text-zinc-500">
                            JPG, PNG, WebP up to 5MB (Max {maxFiles} images)
                        </p>
                    </div>
                </div>
            </div>

            {/* Previews */}
            {previews.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                    {previews.map((preview, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-zinc-700 group">
                            <img src={preview} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Button (Manual Trigger if needed, or parent can trigger) */}
            {files.length > 0 && (
                <Button
                    type="button"
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="w-full bg-green-500 hover:bg-green-600 text-black font-semibold"
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                        </>
                    ) : (
                        `Upload ${files.length} Image${files.length > 1 ? 's' : ''}`
                    )}
                </Button>
            )}

            {uploadError && (
                <p className="text-sm text-red-400 text-center">{uploadError}</p>
            )}
        </div>
    )
}
