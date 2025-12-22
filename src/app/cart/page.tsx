"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/context/cart-context";
import { createClient } from "@/supabase/client";
import { MainNav } from "@/components/main-nav";
import { MainFooter } from "@/components/main-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

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
    }

    getUserRole();
  }, []);

  const handleApplyCoupon = () => {
    // Placeholder for coupon logic
    if (couponCode.toUpperCase() === "SAVE10") {
      setDiscount(getCartTotal() * 0.1);
    } else {
      alert("Invalid coupon code");
    }
  };

  const subtotal = getCartTotal();
  const tax = 0; // Removed tax
  const shipping = 0; // Free shipping
  const total = subtotal - discount + tax + shipping;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#FDFCF9]">
        <MainNav />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <ShoppingCart className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h1 className="font-display text-3xl font-bold text-[#1A1A1A] mb-4">
              Your Cart is Empty
            </h1>
            <p className="text-gray-600 mb-8">
              Start adding some amazing beauty products to your cart!
            </p>
            <Button asChild className="bg-[#D4AF37] hover:bg-[#B8941F]">
              <Link href="/store">Start Shopping</Link>
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
          Shopping Cart ({items.length} items)
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.product_id}
                className="bg-white rounded-lg p-6 flex gap-6 shadow-sm"
              >
                {/* Product Image */}
                <Link href={`/products/${item.slug}`} className="flex-shrink-0">
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                    <Image
                      src={item.image || "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80"}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                </Link>

                {/* Product Details */}
                <div className="flex-1">
                  <Link href={`/products/${item.slug}`}>
                    <h3 className="font-semibold text-lg hover:text-[#D4AF37] transition-colors">
                      {item.name}
                    </h3>
                  </Link>
                  <p className="text-[#D4AF37] font-bold text-xl mt-2">
                    Rs. {item.price ? item.price.toLocaleString() : '0'}
                  </p>

                  <div className="flex items-center gap-4 mt-4">
                    {/* Quantity Controls */}
                    <div className="flex items-center border rounded-lg">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="h-10 w-10"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock_quantity}
                        className="h-10 w-10"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(item.product_id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>

                {/* Subtotal */}
                <div className="text-right">
                  <p className="text-sm text-gray-600">Subtotal</p>
                  <p className="font-bold text-xl">
                    Rs. {((item.price || 0) * item.quantity).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 shadow-sm sticky top-4">
              <h2 className="font-display text-2xl font-bold mb-6">Order Summary</h2>

              {/* Coupon Code */}
              <div className="mb-6">
                <label className="text-sm font-medium mb-2 block">Apply Coupon</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                  <Button onClick={handleApplyCoupon} variant="outline">
                    Apply
                  </Button>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">Rs. {subtotal.toLocaleString()}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-Rs. {discount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">Rs. {tax.toLocaleString()}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">FREE</span>
                </div>

                <div className="border-t pt-3 flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-[#D4AF37]">Rs. {total.toLocaleString()}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                className="w-full mt-6 bg-[#D4AF37] hover:bg-[#B8941F] text-white"
                size="lg"
                onClick={() => router.push("/checkout")}
              >
                Proceed to Checkout
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <Button
                variant="outline"
                className="w-full mt-3"
                asChild
              >
                <Link href="/store">Continue Shopping</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <MainFooter />
    </div>
  );
}
