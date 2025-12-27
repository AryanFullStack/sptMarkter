"use client";

import { useProductPrice } from "@/hooks/use-product-price";

interface PriceLabelProps {
    product: {
        price_customer: number;
        price_retailer: number;
        price_beauty_parlor: number;
    };
    className?: string;
    showLabel?: boolean;
}

export function PriceLabel({ product, className = "", showLabel = false }: PriceLabelProps) {
    const { price, label, loading } = useProductPrice(product);

    return (
        <div className={className}>
            {showLabel && (
                <p className="text-xs text-gray-500 mb-1">{label}</p>
            )}
            <span className="font-display text-2xl font-bold text-[#D4AF37]">
                Rs. {price.toLocaleString()}
            </span>
            {/* We could use userRole from context if we wanted to show login prompt, but hook covers most needs */
            /* For now, keeping it simple */}
        </div>
    );
}
