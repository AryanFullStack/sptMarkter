"use client";

import { useState } from "react";
import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { notify } from "@/lib/notifications";

interface AddToCartButtonProps {
    product: any;
    className?: string;
}

export function AddToCartButton({ product, className = "" }: AddToCartButtonProps) {
    const [quantity, setQuantity] = useState(1);
    const { addToCart } = useCart();

    const handleAddToCart = () => {
        addToCart(product, quantity);
        notify.success("Added to cart!", `${product.name} (${quantity}x) added to your cart.`);
        setQuantity(1);
    };

    const incrementQuantity = () => {
        if (quantity < product.stock_quantity) {
            setQuantity(quantity + 1);
        }
    };

    const decrementQuantity = () => {
        if (quantity > 1) {
            setQuantity(quantity - 1);
        }
    };

    const isOutOfStock = product.stock_quantity === 0;

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Quantity:</span>
                <div className="flex items-center border rounded-lg">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={decrementQuantity}
                        disabled={quantity <= 1 || isOutOfStock}
                        className="h-10 w-10"
                    >
                        <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={incrementQuantity}
                        disabled={quantity >= product.stock_quantity || isOutOfStock}
                        className="h-10 w-10"
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                <span className="text-sm text-gray-500">
                    {product.stock_quantity} available
                </span>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                <Button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className="flex-1 bg-[#D4AF37] hover:bg-[#B8941F] text-white"
                    size="lg"
                >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                </Button>
                <Button
                    onClick={() => {
                        handleAddToCart();
                        window.location.href = "/checkout";
                    }}
                    disabled={isOutOfStock}
                    variant="outline"
                    className="flex-1 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white"
                    size="lg"
                >
                    Buy Now
                </Button>
            </div>
        </div>
    );
}
