"use client";

import { useState, useEffect } from "react";
import MainNav from "@/components/main-nav";
import MainFooter from "@/components/main-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Minus } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/supabase/client";
import Image from "next/image";

export default function CartPage() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const supabase = createClient();

  useEffect(() => {
    loadCart();
  }, []);

  async function loadCart() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    const { data: cart } = await supabase
      .from("cart")
      .select(`
        id,
        quantity,
        product_id,
        products (
          id,
          name,
          slug,
          images,
          price_customer,
          price_retailer,
          price_beauty_parlor,
          stock_quantity
        )
      `)
      .eq("user_id", user.id);

    if (cart) {
      const items = cart.map((item: any) => ({
        ...item,
        price: userData?.role === "retailer" 
          ? item.products.price_retailer 
          : userData?.role === "beauty_parlor"
          ? item.products.price_beauty_parlor
          : item.products.price_customer
      }));
      setCartItems(items);
    }
    setLoading(false);
  }

  async function updateQuantity(cartId: string, newQuantity: number) {
    if (newQuantity < 1) return;
    await supabase
      .from("cart")
      .update({ quantity: newQuantity })
      .eq("id", cartId);
    loadCart();
  }

  async function removeItem(cartId: string) {
    await supabase.from("cart").delete().eq("id", cartId);
    loadCart();
  }

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCF9]">
        <MainNav />
        <div className="container mx-auto px-4 py-16">
          <p className="text-center text-[#6B6B6B]">Loading cart...</p>
        </div>
        <MainFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF9]">
      <MainNav />
      <main className="container mx-auto px-4 py-16">
        <h1 className="font-serif text-4xl font-semibold text-[#1A1A1A] mb-8">Shopping Cart</h1>
        
        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[#6B6B6B] text-lg mb-6">Your cart is empty</p>
            <Link href="/store">
              <Button className="bg-[#D4AF37] hover:bg-[#C19B2E] text-white">
                Continue Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-sm p-6 flex gap-4">
                  <div className="w-24 h-24 relative flex-shrink-0">
                    <Image
                      src={item.products.images[0] || "/placeholder.png"}
                      alt={item.products.name}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#1A1A1A] mb-2">{item.products.name}</h3>
                    <p className="text-[#D4AF37] font-semibold mb-4">₹{item.price.toFixed(2)}</p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border border-[#6B6B6B] rounded">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-2 hover:bg-[#F7F5F2]"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-4 py-2 border-x border-[#6B6B6B]">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-2 hover:bg-[#F7F5F2]"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-[#8B3A3A] hover:text-[#6B2A2A]"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                <h2 className="font-serif text-2xl font-semibold text-[#1A1A1A] mb-6">Order Summary</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-[#6B6B6B]">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#6B6B6B]">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <div className="border-t border-[#F7F5F2] pt-4">
                    <div className="flex justify-between font-semibold text-[#1A1A1A] text-lg">
                      <span>Total</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <Input
                    placeholder="Coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="mb-2"
                  />
                  <Button variant="outline" className="w-full">Apply Coupon</Button>
                </div>
                
                <Link href="/checkout">
                  <Button className="w-full bg-[#D4AF37] hover:bg-[#C19B2E] text-white">
                    Proceed to Checkout
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
      <MainFooter />
    </div>
  );
}
