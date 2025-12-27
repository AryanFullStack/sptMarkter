"use client";

import { ProductCard } from "@/components/product-card";
import { useCart } from "@/context/cart-context";
import { useWishlist } from "@/context/wishlist-context";
import { notify } from "@/lib/notifications";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

interface ProductGridProps {
    products: any[];
    initialUserRole?: string | null;
}

export function ProductGrid({ products, initialUserRole }: ProductGridProps) {
    const { addToCart } = useCart();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
    const router = useRouter();

    // Use client-side auth, but fallback to server-provided role if auth is loading or not yet ready
    const { userRole: clientUserRole, loading: isAuthLoading } = useAuth();

    // Prioritize client role if loaded, otherwise use server role
    const effectiveRole = isAuthLoading ? initialUserRole : clientUserRole;

    const getProductPrice = (product: any) => {
        // If no role found (not logged in), use customer price
        const role = effectiveRole || 'customer';

        switch (role) {
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
        const price = getProductPrice(product);
        addToCart(product, 1, price);
        notify.success("Added to cart!", `${product.name} added to your cart.`);
    };

    const handleToggleWishlist = async (product: any) => {
        if (!effectiveRole) {
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
