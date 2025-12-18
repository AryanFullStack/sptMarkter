"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ProductGalleryProps {
    images: string[];
    productName: string;
}

export function ProductGallery({ images = [], productName }: ProductGalleryProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isZoomed, setIsZoomed] = useState(false);

    const hasMultipleImages = images.length > 1;

    const nextImage = () => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const previousImage = () => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const defaultImage = "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80";
    const currentImage = images[currentIndex] || defaultImage;

    return (
        <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
                <Image
                    src={currentImage}
                    alt={productName}
                    fill
                    className="object-cover"
                    priority
                />

                {/* Zoom Button */}
                <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setIsZoomed(true)}
                >
                    <ZoomIn className="h-4 w-4" />
                </Button>

                {/* Navigation Arrows */}
                {hasMultipleImages && (
                    <>
                        <Button
                            variant="secondary"
                            size="icon"
                            className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={previousImage}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="secondary"
                            size="icon"
                            className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={nextImage}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </>
                )}

                {/* Image Counter */}
                {hasMultipleImages && (
                    <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                        {currentIndex + 1} / {images.length}
                    </div>
                )}
            </div>

            {/* Thumbnails */}
            {hasMultipleImages && (
                <div className="grid grid-cols-4 gap-2">
                    {images.map((image, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${index === currentIndex
                                    ? "border-[#D4AF37] ring-2 ring-[#D4AF37]"
                                    : "border-transparent hover:border-gray-300"
                                }`}
                        >
                            <Image
                                src={image}
                                alt={`${productName} - ${index + 1}`}
                                fill
                                className="object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}

            {/* Zoom Modal */}
            <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
                <DialogContent className="max-w-4xl">
                    <div className="relative aspect-square w-full">
                        <Image
                            src={currentImage}
                            alt={productName}
                            fill
                            className="object-contain"
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
