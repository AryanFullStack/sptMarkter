"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ShoppingCart, Heart, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductInfoProps {
  product: any;
  price: number;
  userRole: string;
  brand?: string;
  category?: string;
}

export function ProductInfo({
  product,
  price,
  userRole,
  brand,
  category,
}: ProductInfoProps) {
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const stockStatus =
    product.stock_quantity === 0
      ? "out_of_stock"
      : product.stock_quantity <= product.low_stock_threshold
      ? "low_stock"
      : "in_stock";

  return (
    <div className="space-y-6">
      {/* Brand & Category */}
      <div className="flex items-center gap-2">
        {brand && (
          <Badge variant="outline" className="text-charcoal-light">
            {brand}
          </Badge>
        )}
        {category && (
          <Badge variant="outline" className="text-charcoal-light">
            {category}
          </Badge>
        )}
      </div>

      {/* Product Name */}
      <div>
        <h1 className="font-display text-4xl font-bold text-charcoal mb-2">
          {product.name}
        </h1>
        {product.sku && (
          <p className="text-sm text-charcoal-light font-mono">SKU: {product.sku}</p>
        )}
      </div>

      {/* Stock Status */}
      <div>
        {stockStatus === "in_stock" && (
          <Badge className="bg-success text-white">In Stock</Badge>
        )}
        {stockStatus === "low_stock" && (
          <Badge className="bg-warning text-white">
            Only {product.stock_quantity} left
          </Badge>
        )}
        {stockStatus === "out_of_stock" && (
          <Badge className="bg-error text-white">Out of Stock</Badge>
        )}
      </div>

      {/* Price */}
      <div className="bg-cream-light rounded-lg p-6">
        <div className="flex items-baseline gap-3 mb-4">
          <span className="font-display text-4xl font-bold text-gold">
            Rs. {price.toLocaleString()}
          </span>
          <span className="text-charcoal-light">per unit</span>
        </div>

        {/* Role-based Pricing Table */}
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-charcoal mb-2">Pricing by Account Type:</p>
          <div className="grid grid-cols-3 gap-2">
            <div
              className={cn(
                "p-3 rounded border",
                userRole === "beauty_parlor"
                  ? "bg-gold/10 border-gold"
                  : "bg-white border-charcoal/10"
              )}
            >
              <p className="text-xs text-charcoal-light mb-1">Beauty Parlor</p>
              <p className="font-semibold text-charcoal">
                Rs. {product.beauty_price.toLocaleString()}
              </p>
            </div>
            <div
              className={cn(
                "p-3 rounded border",
                userRole === "retailer"
                  ? "bg-gold/10 border-gold"
                  : "bg-white border-charcoal/10"
              )}
            >
              <p className="text-xs text-charcoal-light mb-1">Retailer</p>
              <p className="font-semibold text-charcoal">
                Rs. {product.retailer_price.toLocaleString()}
              </p>
            </div>
            <div
              className={cn(
                "p-3 rounded border",
                userRole === "local_customer"
                  ? "bg-gold/10 border-gold"
                  : "bg-white border-charcoal/10"
              )}
            >
              <p className="text-xs text-charcoal-light mb-1">Customer</p>
              <p className="font-semibold text-charcoal">
                Rs. {product.customer_price.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <div>
          <h3 className="font-display text-lg font-semibold text-charcoal mb-2">
            Description
          </h3>
          <p className="text-charcoal-light leading-relaxed">
            {product.description}
          </p>
        </div>
      )}

      {/* Quantity Selector */}
      <div>
        <label className="block text-sm font-medium text-charcoal mb-2">
          Quantity
        </label>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={stockStatus === "out_of_stock"}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="font-semibold text-xl text-charcoal w-12 text-center">
            {quantity}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              setQuantity(Math.min(product.stock_quantity, quantity + 1))
            }
            disabled={stockStatus === "out_of_stock"}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          className="flex-1 bg-gold hover:bg-gold-dark text-white"
          size="lg"
          disabled={stockStatus === "out_of_stock"}
        >
          <ShoppingCart className="h-5 w-5 mr-2" />
          Add to Cart
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => setIsWishlisted(!isWishlisted)}
          className={cn(
            isWishlisted && "bg-gold/10 border-gold text-gold"
          )}
        >
          <Heart
            className={cn(
              "h-5 w-5",
              isWishlisted && "fill-current"
            )}
          />
        </Button>
      </div>

      {/* Additional Info */}
      <div className="border-t border-charcoal/10 pt-6 space-y-3 text-sm text-charcoal-light">
        <div className="flex justify-between">
          <span>Free delivery</span>
          <span className="text-charcoal">On orders above Rs. 5,000</span>
        </div>
        <div className="flex justify-between">
          <span>Return policy</span>
          <span className="text-charcoal">7 days return</span>
        </div>
        <div className="flex justify-between">
          <span>Authenticity</span>
          <span className="text-charcoal">100% Guaranteed</span>
        </div>
      </div>
    </div>
  );
}
