"use client";

import { useState, useCallback } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploadProps {
    onFileSelect: (files: File[]) => void;
    accept?: string;
    multiple?: boolean;
    maxSize?: number; // in MB
    preview?: boolean;
    className?: string;
}

export function FileUpload({
    onFileSelect,
    accept = "image/*",
    multiple = false,
    maxSize = 5,
    preview = true,
    className,
}: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [previews, setPreviews] = useState<string[]>([]);
    const [error, setError] = useState<string>("");

    const handleFiles = useCallback((files: FileList | null) => {
        if (!files || files.length === 0) return;

        setError("");
        const fileArray = Array.from(files);

        // Validate file size
        const maxSizeBytes = maxSize * 1024 * 1024;
        const invalidFiles = fileArray.filter(file => file.size > maxSizeBytes);

        if (invalidFiles.length > 0) {
            setError(`Some files exceed the ${maxSize}MB limit`);
            return;
        }

        // Create previews for images
        if (preview && accept.includes("image")) {
            const newPreviews: string[] = [];
            fileArray.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    newPreviews.push(reader.result as string);
                    if (newPreviews.length === fileArray.length) {
                        setPreviews(prev => [...prev, ...newPreviews]);
                    }
                };
                reader.readAsDataURL(file);
            });
        }

        onFileSelect(fileArray);
    }, [onFileSelect, accept, maxSize, preview]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    }, [handleFiles]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files);
    }, [handleFiles]);

    const removePreview = (index: number) => {
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className={cn("space-y-4", className)}>
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                    isDragging ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-[#E8E8E8] hover:border-[#D4AF37]/50",
                    "cursor-pointer"
                )}
            >
                <input
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={handleInputChange}
                    className="hidden"
                    id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-[#6B6B6B]" />
                    <p className="text-[#1A1A1A] font-medium mb-1">
                        Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-[#6B6B6B]">
                        {accept === "image/*" ? "PNG, JPG, GIF up to" : "Files up to"} {maxSize}MB
                    </p>
                </label>
            </div>

            {error && (
                <p className="text-sm text-[#8B3A3A]">{error}</p>
            )}

            {previews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {previews.map((preview, index) => (
                        <div key={index} className="relative group">
                            <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border border-[#E8E8E8]"
                            />
                            <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removePreview(index)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
