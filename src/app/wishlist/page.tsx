"use client";

import { useWishlist } from "@/context/wishlist-context";
import { useCart } from "@/context/cart-context";
import { MainNav } from "@/components/main-nav";
import { MainFooter } from "@/components/main-footer";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function WishlistPage() {
    const { items, removeFromWishlist } = useWishlist();
    const { addToCart } = useCart();

    const handleMoveToCart = (item: any) => {
        addToCart(item, 1);
        removeFromWishlist(item.product_id);
    };

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-[#FDFCF9]">
                <MainNav />
                <div className="container mx-auto px-4 py-16">
                    <div className="max-w-2xl mx-auto text-center">
                        <Heart className="h-24 w-24 text-gray-300 mx-auto mb-6" />
                        <h1 className="font-display text-3xl font-bold text-[#1A1A1A] mb-4">
                            Your Wishlist is Empty
                        </h1>
                        <p className="text-gray-600 mb-8">
                            Save your favorite products and revisit them anytime!
                        </p>
                        <Button asChild className="bg-[#D4AF37] hover:bg-[#B8941F]">
                            <Link href="/store">Browse Products</Link>
                        </Button>
                    </div>
                </div>
                <MainFooter />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFCF9]">
            <MainNav />

            <div className="container mx-auto px-4 py-8">
                <h1 className="font-display text-4xl font-bold text-[#1A1A1A] mb-8">
                    My Wishlist ({items.length})
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {items.map((item) => (
                        <div
                            key={item.product_id}
                            className="bg-white rounded-lg shadow-sm overflow-hidden group hover:shadow-lg transition-shadow"
                        >
                            {/* Product Image */}
                            <Link href={`/products/${item.slug}`} className="block relative aspect-square">
                                <Image
                                    src={item.image || "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80"}
                                    alt={item.name}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            </Link>

                            {/* Product Info */}
                            <div className="p-4 space-y-3">
                                <Link href={`/products/${item.slug}`}>
                                    <h3 className="font-semibold text-lg hover:text-[#D4AF37] transition-colors line-clamp-2">
                                        {item.name}
                                    </h3>
                                </Link>

                                <p className="text-[#D4AF37] font-bold text-xl">
                                    Rs. {item.price.toLocaleString()}
                                </p>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => handleMoveToCart(item)}
                                        className="flex-1 bg-[#D4AF37] hover:bg-[#B8941F] text-white"
                                    >
                                        <ShoppingCart className="mr-2 h-4 w-4" />
                                        Add to Cart
                                    </Button>
                                    <Button
                                        onClick={() => removeFromWishlist(item.product_id)}
                                        variant="outline"
                                        size="icon"
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <MainFooter />
        </div>
    );
}
