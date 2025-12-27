"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createClient } from "@/supabase/client";
import { useAuth } from "@/context/auth-context";

interface CartItem {
    id: string;
    product_id: string;
    name: string;
    slug: string;
    price: number;
    image: string;
    quantity: number;
    stock_quantity: number;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (product: any, quantity?: number, price?: number) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    getCartTotal: () => number;
    getCartCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Helper to determine price based on role
const getProductPriceForRole = (product: any, role: string | null) => {
    if (!product) return 0;
    if (role === "beauty_parlor") {
        return product.price_beauty_parlor || 0;
    } else if (role === "retailer") {
        return product.price_retailer || 0;
    }
    return product.price_customer || 0;
};

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const { userRole, loading: authLoading } = useAuth(); // Use global auth context
    const [isLoaded, setIsLoaded] = useState(false);
    const supabase = createClient();

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem("cart");
        if (savedCart) {
            setItems(JSON.parse(savedCart));
        }
        setIsLoaded(true);
    }, []);

    // Effect to refresh cart prices when user role changes
    useEffect(() => {
        if (isLoaded && items.length > 0 && !authLoading) {
            refreshCartPrices(userRole);
        }
    }, [userRole, isLoaded, authLoading]);

    const refreshCartPrices = async (role: string | null) => {
        try {
            const productIds = items.map(item => item.product_id);
            if (productIds.length === 0) return;

            const { data: products } = await supabase
                .from("products")
                .select("id, price_customer, price_retailer, price_beauty_parlor")
                .in("id", productIds);

            if (products) {
                setItems(prevItems => prevItems.map(item => {
                    const product = products.find(p => p.id === item.product_id);
                    if (product) {
                        const newPrice = getProductPriceForRole(product, role);
                        return { ...item, price: newPrice };
                    }
                    return item;
                }));
            }
        } catch (error) {
            console.error("Error refreshing cart prices:", error);
        }
    };

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem("cart", JSON.stringify(items));
        }
    }, [items, isLoaded]);

    const addToCart = (product: any, quantity = 1, price?: number) => {
        setItems((prevItems) => {
            const existingItem = prevItems.find((item) => item.product_id === product.id);

            // Determine price: use provided price, or calculate based on role
            // Careful: if price is 0 provided (unlikely but possible), should we use it?
            // Assuming strict check for undefined
            let activePrice = price !== undefined ? price : getProductPriceForRole(product, userRole);

            if (existingItem) {
                return prevItems.map((item) =>
                    item.product_id === product.id
                        ? { ...item, quantity: item.quantity + quantity, price: activePrice }
                        : item
                );
            }

            return [
                ...prevItems,
                {
                    id: product.id,
                    product_id: product.id,
                    name: product.name,
                    slug: product.slug,
                    price: activePrice,
                    image: product.images?.[0] || "",
                    quantity,
                    stock_quantity: product.stock_quantity || 0,
                },
            ];
        });
    };

    const removeFromCart = (productId: string) => {
        setItems((prevItems) => prevItems.filter((item) => item.product_id !== productId));
    };

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }

        setItems((prevItems) =>
            prevItems.map((item) =>
                item.product_id === productId ? { ...item, quantity } : item
            )
        );
    };

    const clearCart = () => {
        setItems([]);
    };

    const getCartTotal = () => {
        return items.reduce((total, item) => total + item.price * item.quantity, 0);
    };

    const getCartCount = () => {
        return items.reduce((count, item) => count + item.quantity, 0);
    };

    return (
        <CartContext.Provider
            value={{
                items,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                getCartTotal,
                getCartCount,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within CartProvider");
    }
    return context;
}
