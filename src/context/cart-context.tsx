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
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Function to fetch current user's role
    const fetchUserRole = async () => {
        const { createClient } = await import("@/supabase/client");
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const { data: userData } = await supabase
                .from("users")
                .select("role")
                .eq("id", user.id)
                .single();

            return userData?.role || null;
        }
        return null;
    };

    // Load cart from localStorage and fetch user role on mount
    useEffect(() => {
        const savedCart = localStorage.getItem("cart");
        if (savedCart) {
            setItems(JSON.parse(savedCart));
        }

        const initAuth = async () => {
            const { createClient } = await import("@/supabase/client");
            const supabase = createClient();

            // Initial role fetch
            const role = await fetchUserRole();
            setUserRole(role);

            // Set up auth state listener
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
                    const newRole = await fetchUserRole();
                    setUserRole(newRole);
                }
            });

            setIsLoaded(true);

            return () => {
                subscription.unsubscribe();
            };
        };

        const cleanup = initAuth();
        return () => {
            cleanup.then(unsub => unsub?.());
        };
    }, []);

    // Effect to refresh cart prices when user role changes
    useEffect(() => {
        if (isLoaded && items.length > 0) {
            refreshCartPrices(userRole);
        }
    }, [userRole, isLoaded]);

    const refreshCartPrices = async (role: string | null) => {
        try {
            const { createClient } = await import("@/supabase/client");
            const supabase = createClient();

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
                        let newPrice = product.price_customer || 0;
                        if (role === "beauty_parlor") {
                            newPrice = product.price_beauty_parlor || 0;
                        } else if (role === "retailer") {
                            newPrice = product.price_retailer || 0;
                        }
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

    const addToCart = (product: any, quantity = 1) => {
        setItems((prevItems) => {
            const existingItem = prevItems.find((item) => item.product_id === product.id);

            // Determine price based on user role
            let activePrice = product.price_customer || 0;
            if (userRole === "beauty_parlor") {
                activePrice = product.price_beauty_parlor || 0;
            } else if (userRole === "retailer") {
                activePrice = product.price_retailer || 0;
            }

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
