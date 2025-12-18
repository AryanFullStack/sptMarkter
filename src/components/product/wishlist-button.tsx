"use client";

import { useWishlist } from "@/context/wishlist-context";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WishlistButtonProps {
    product: any;
    className?: string;
    iconOnly?: boolean;
}

export function WishlistButton({ product, className = "", iconOnly = false }: WishlistButtonProps) {
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
    const { toast } = useToast();
    const inWishlist = isInWishlist(product.id);

    const toggleWishlist = async () => {
        // Check for user login (optional but requested)
        // Note: The context itself handles storage, but we want to enforce login UI
        // We can do a quick check via supabase client here if needed, or rely on page level.
        // But requested feature is "make show add wishlist to login must".

        // Let's use specific logic similar to ProductGrid
        const { createClient } = require("@/supabase/client");
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            toast({
                title: "Login Required",
                description: "Please login to manage your wishlist.",
                variant: "destructive",
            });
            window.location.href = "/sign-in";
            return;
        }

        if (inWishlist) {
            removeFromWishlist(product.id);
            toast({
                title: "Removed from wishlist",
                description: `${product.name} removed from your wishlist.`,
            });
        } else {
            addToWishlist(product);
            toast({
                title: "Added to wishlist!",
                description: `${product.name} added to your wishlist.`,
            });
        }
    };

    if (iconOnly) {
        return (
            <Button
                variant="ghost"
                size="icon"
                onClick={toggleWishlist}
                className={`${className} ${inWishlist ? "text-red-500" : ""}`}
            >
                <Heart
                    className={`h-5 w-5 ${inWishlist ? "fill-current" : ""}`}
                />
            </Button>
        );
    }

    return (
        <Button
            variant="outline"
            onClick={toggleWishlist}
            className={`${className} ${inWishlist ? "border-red-500 text-red-500" : ""}`}
        >
            <Heart
                className={`mr-2 h-5 w-5 ${inWishlist ? "fill-current" : ""}`}
            />
            {inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
        </Button>
    );
}
