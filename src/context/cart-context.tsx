"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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
    addToCart: (product: any, quantity?: number) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    getCartTotal: () => number;
    getCartCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem("cart");
        if (savedCart) {
            setItems(JSON.parse(savedCart));
        }
        setIsLoaded(true);
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem("cart", JSON.stringify(items));
        }
    }, [items, isLoaded]);

    const addToCart = (product: any, quantity = 1) => {
        setItems((prevItems) => {
            const existingItem = prevItems.find((item) => item.product_id === product.id);

            if (existingItem) {
                return prevItems.map((item) =>
                    item.product_id === product.id
                        ? { ...item, quantity: item.quantity + quantity }
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
                    price: product.price_customer, // Will be updated based on user role
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
