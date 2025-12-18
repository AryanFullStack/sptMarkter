"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/supabase/client";

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
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function getUserRole() {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data: userData } = await supabase
                    .from("users")
                    .select("role")
                    .eq("id", user.id)
                    .single();

                setUserRole(userData?.role || null);
            }
            setIsLoading(false);
        }

        getUserRole();
    }, []);

    const getPrice = () => {
        // Default: Show Beauty Parlor price
        if (!userRole || isLoading) {
            return product.price_beauty_parlor;
        }

        switch (userRole) {
            case "beauty_parlor":
                return product.price_beauty_parlor;
            case "retailer":
                return product.price_retailer;
            case "customer":
            case "local_customer":
            default:
                return product.price_customer;
        }
    };

    const getRoleLabel = () => {
        if (!userRole) return "Beauty Parlor Sale Price";

        switch (userRole) {
            case "beauty_parlor":
                return "Your Beauty Parlor Price";
            case "retailer":
                return "Your Retailer Price";
            default:
                return "Customer Price";
        }
    };

    const price = getPrice();

    return (
        <div className={className}>
            {showLabel && (
                <p className="text-xs text-gray-500 mb-1">{getRoleLabel()}</p>
            )}
            <span className="font-display text-2xl font-bold text-[#D4AF37]">
                Rs. {price.toLocaleString()}
            </span>
            {!userRole && !isLoading && (
                <p className="text-xs text-gray-500 mt-1">Login for your custom pricing</p>
            )}
        </div>
    );
}
