"use client";

import { ProductCard } from "@/components/product-card";
import { useCart } from "@/context/cart-context";
import { useWishlist } from "@/context/wishlist-context";
import { notify } from "@/lib/notifications";
import { useRouter } from "next/navigation";
import { createClient } from "@/supabase/client";
import { useEffect, useState } from "react";

interface ProductGridProps {
    products: any[];
}

export function ProductGrid({ products }: ProductGridProps) {
    const { addToCart } = useCart();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
    const router = useRouter();
    const supabase = createClient();
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isLoadingRole, setIsLoadingRole] = useState(true);

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
            setIsLoadingRole(false);
        }

        getUserRole();
    }, []);

    const getProductPrice = (product: any) => {
        // If not logged in or still loading, show customer price as default
        if (!userRole || isLoadingRole) {
            return product.price_customer || 0;
        }

        // Return price based on user role
        switch (userRole) {
            case "beauty_parlor":
                return product.price_beauty_parlor || 0;
            case "retailer":
                return product.price_retailer || 0;
            case "customer":
            case "local_customer":
            default:
                return product.price_customer || 0;
        }
    };

    const handleAddToCart = (product: any) => {
        addToCart(product, 1);
        notify.success("Added to cart!", `${product.name} added to your cart.`);
    };

    const handleToggleWishlist = async (product: any) => {
        // Check if user is logged in
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            notify.error("Login required", "Please login to add items to wishlist.");
            router.push("/sign-in");
            return;
        }

        if (isInWishlist(product.id)) {
            removeFromWishlist(product.id);
            notify.success("Removed from wishlist", `${product.name} removed from your wishlist.`);
        } else {
            addToWishlist(product);
            notify.success("Added to wishlist!", `${product.name} added to your wishlist.`);
        }
    };

    if (!products || products.length === 0) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-600 text-lg">No products found</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product: any) => (
                <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    slug={product.slug}
                    price={getProductPrice(product)}
                    image={
                        product.images?.[0] ||
                        "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80"
                    }
                    brand={product.brand_id}
                    stockStatus={
                        product.stock_quantity === 0
                            ? "out_of_stock"
                            : product.stock_quantity <= (product.low_stock_threshold || 10)
                                ? "low_stock"
                                : "in_stock"
                    }
                    stockCount={product.stock_quantity}
                    isWishlisted={isInWishlist(product.id)}
                    onAddToCart={() => handleAddToCart(product)}
                    onToggleWishlist={() => handleToggleWishlist(product)}
                />
            ))}
        </div>
    );
}
