"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingCart, Zap } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  image: string;
  brand?: string;
  stockStatus: "in_stock" | "low_stock" | "out_of_stock";
  stockCount?: number;
  isWishlisted?: boolean;
  onAddToCart?: () => void;
  onToggleWishlist?: () => void;
  onBuyNow?: () => void;
}

export function ProductCard({
  id,
  name,
  slug,
  price,
  originalPrice,
  image,
  brand,
  stockStatus,
  stockCount,
  isWishlisted = false,
  onAddToCart,
  onToggleWishlist,
  onBuyNow,
}: ProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  // We rely on parent to pass the correct role-based price
  const displayPrice = price;

  return (
    <div className="group relative bg-white rounded-lg border border-charcoal/10 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      {/* Wishlist Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          onToggleWishlist?.();
        }}
        className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center transition-all hover:bg-gold hover:text-white"
      >
        <Heart
          className={cn(
            "h-5 w-5 transition-all",
            isWishlisted && "fill-current text-gold"
          )}
        />
      </button>

      {/* Product Image */}
      <Link href={`/products/${slug}`} className="block relative aspect-square overflow-hidden bg-cream-light">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-cream-light via-white to-cream-light animate-shimmer" />
        )}
        <Image
          src={image}
          alt={name}
          fill
          className={cn(
            "object-cover transition-all duration-500 group-hover:scale-105",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setImageLoaded(true)}
        />

        {/* Stock Badge */}
        {stockStatus === "low_stock" && (
          <Badge className="absolute top-3 left-3 bg-warning text-white">
            Only {stockCount} left
          </Badge>
        )}
        {stockStatus === "out_of_stock" && (
          <Badge className="absolute top-3 left-3 bg-error text-white">
            Out of Stock
          </Badge>
        )}
      </Link>

      {/* Product Info */}
      <div className="p-4 space-y-3">
        {brand && (
          <p className="text-xs font-medium text-charcoal-light uppercase tracking-wider">
            {brand}
          </p>
        )}

        <Link href={`/products/${slug}`}>
          <h3 className="font-display text-base font-semibold text-charcoal line-clamp-2 group-hover:text-gold transition-colors">
            {name}
          </h3>
        </Link>

        <div className="flex items-center gap-2">
          <span className="font-display text-xl font-bold text-gold">
            Rs. {displayPrice.toLocaleString()}
          </span>
          {originalPrice && originalPrice > displayPrice && (
            <span className="text-sm text-charcoal-light line-through">
              Rs. {originalPrice.toLocaleString()}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={(e) => {
              e.preventDefault();
              onAddToCart?.();
            }}
            disabled={stockStatus === "out_of_stock"}
            className="flex-1 bg-charcoal hover:bg-gold text-white transition-colors"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add
          </Button>
          <Button
            onClick={(e) => {
              e.preventDefault();
              onBuyNow?.();
            }}
            disabled={stockStatus === "out_of_stock"}
            variant="outline"
            className="flex-1 border-gold text-gold hover:bg-gold hover:text-white"
          >
            <Zap className="h-4 w-4 mr-2" />
            Buy
          </Button>
        </div>
      </div>
    </div>
  );
}
