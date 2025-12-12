"use client";

import { useState, useEffect } from "react";
import MainNav from "@/components/main-nav";
import MainFooter from "@/components/main-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createClient } from "@/supabase/client";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadCheckoutData();
  }, []);

  async function loadCheckoutData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/sign-in");
      return;
    }

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    setUserRole(userData?.role || "customer");

    const { data: cart } = await supabase
      .from("cart")
      .select(`
        quantity,
        products (
          name,
          price_customer,
          price_retailer,
          price_beauty_parlor
        )
      `)
      .eq("user_id", user.id);

    const { data: userAddresses } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id);

    if (cart) setCartItems(cart);
    if (userAddresses) {
      setAddresses(userAddresses);
      const defaultAddr = userAddresses.find(a => a.is_default);
      if (defaultAddr) setSelectedAddress(defaultAddr.id);
    }
    setLoading(false);
  }

  async function handlePlaceOrder() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !selectedAddress) return;

    const total = cartItems.reduce((sum, item) => {
      const price = userRole === "retailer" 
        ? item.products.price_retailer 
        : userRole === "beauty_parlor"
        ? item.products.price_beauty_parlor
        : item.products.price_customer;
      return sum + (price * item.quantity);
    }, 0);

    const orderNumber = `ORD-${Date.now()}`;

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        user_id: user.id,
        total_amount: total,
        paid_amount: paymentMethod === "cod" ? 0 : total,
        payment_method: paymentMethod,
        shipping_address_id: selectedAddress,
        status: "pending"
      })
      .select()
      .single();

    if (order) {
      await supabase.from("cart").delete().eq("user_id", user.id);
      router.push(`/orders/${order.id}`);
    }
  }

  const total = cartItems.reduce((sum, item) => {
    const price = userRole === "retailer" 
      ? item.products.price_retailer 
      : userRole === "beauty_parlor"
      ? item.products.price_beauty_parlor
      : item.products.price_customer;
    return sum + (price * item.quantity);
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCF9]">
        <MainNav />
        <div className="container mx-auto px-4 py-16">
          <p className="text-center text-[#6B6B6B]">Loading...</p>
        </div>
        <MainFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF9]">
      <MainNav />
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="font-serif text-4xl font-semibold text-[#1A1A1A] mb-8">Checkout</h1>
        
        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="font-serif text-2xl font-semibold text-[#1A1A1A] mb-4">Shipping Address</h2>
            <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress}>
              {addresses.map((address) => (
                <div key={address.id} className="flex items-start space-x-2 p-4 border border-[#F7F5F2] rounded mb-2">
                  <RadioGroupItem value={address.id} id={address.id} />
                  <Label htmlFor={address.id} className="flex-1 cursor-pointer">
                    <p className="font-semibold text-[#1A1A1A]">{address.full_name}</p>
                    <p className="text-[#6B6B6B] text-sm">{address.address_line1}</p>
                    <p className="text-[#6B6B6B] text-sm">{address.city}, {address.state} {address.postal_code}</p>
                    <p className="text-[#6B6B6B] text-sm">{address.phone}</p>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="font-serif text-2xl font-semibold text-[#1A1A1A] mb-4">Payment Method</h2>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="flex items-center space-x-2 p-4 border border-[#F7F5F2] rounded mb-2">
                <RadioGroupItem value="cod" id="cod" />
                <Label htmlFor="cod" className="cursor-pointer">Cash on Delivery</Label>
              </div>
              <div className="flex items-center space-x-2 p-4 border border-[#F7F5F2] rounded opacity-50">
                <RadioGroupItem value="online" id="online" disabled />
                <Label htmlFor="online" className="cursor-not-allowed">Online Payment (Coming Soon)</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="font-serif text-2xl font-semibold text-[#1A1A1A] mb-4">Order Summary</h2>
            <div className="space-y-2 mb-4">
              {cartItems.map((item, index) => (
                <div key={index} className="flex justify-between text-[#6B6B6B]">
                  <span>{item.products.name} x {item.quantity}</span>
                  <span>₹{(
                    (userRole === "retailer" 
                      ? item.products.price_retailer 
                      : userRole === "beauty_parlor"
                      ? item.products.price_beauty_parlor
                      : item.products.price_customer) * item.quantity
                  ).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-[#F7F5F2] pt-4">
              <div className="flex justify-between font-semibold text-[#1A1A1A] text-lg">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <Button 
            onClick={handlePlaceOrder}
            disabled={!selectedAddress}
            className="w-full bg-[#D4AF37] hover:bg-[#C19B2E] text-white py-6 text-lg"
          >
            Place Order
          </Button>
        </div>
      </main>
      <MainFooter />
    </div>
  );
}
