"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface WishlistItem {
    id: string;
    product_id: string;
    name: string;
    slug: string;
    price: number;
    image: string;
}

interface WishlistContextType {
    items: WishlistItem[];
    addToWishlist: (product: any) => void;
    removeFromWishlist: (productId: string) => void;
    isInWishlist: (productId: string) => boolean;
    clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<WishlistItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load wishlist from localStorage on mount
    useEffect(() => {
        const savedWishlist = localStorage.getItem("wishlist");
        if (savedWishlist) {
            setItems(JSON.parse(savedWishlist));
        }
        setIsLoaded(true);
    }, []);

    // Save wishlist to localStorage whenever it changes
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem("wishlist", JSON.stringify(items));
        }
    }, [items, isLoaded]);

    const addToWishlist = (product: any) => {
        setItems((prevItems) => {
            const exists = prevItems.find((item) => item.product_id === product.id);
            if (exists) return prevItems;

            return [
                ...prevItems,
                {
                    id: product.id,
                    product_id: product.id,
                    name: product.name,
                    slug: product.slug,
                    price: product.price_customer,
                    image: product.images?.[0] || "",
                },
            ];
        });
    };

    const removeFromWishlist = (productId: string) => {
        setItems((prevItems) => prevItems.filter((item) => item.product_id !== productId));
    };

    const isInWishlist = (productId: string) => {
        return items.some((item) => item.product_id === productId);
    };

    const clearWishlist = () => {
        setItems([]);
    };

    return (
        <WishlistContext.Provider
            value={{
                items,
                addToWishlist,
                removeFromWishlist,
                isInWishlist,
                clearWishlist,
            }}
        >
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist() {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error("useWishlist must be used within WishlistProvider");
    }
    return context;
}
