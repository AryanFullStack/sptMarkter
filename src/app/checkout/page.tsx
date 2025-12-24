"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/cart-context";
import { createClient } from "@/supabase/client";
import { MainNav } from "@/components/main-nav";
import { MainFooter } from "@/components/main-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AddressForm } from "@/components/checkout/address-form";
import { Check, MapPin, CreditCard, Package } from "lucide-react";
import Image from "next/image";
import { notify } from "@/lib/notifications";
import { placeOrderAction } from "@/app/actions";
import { validateCheckoutPendingLimit } from "@/app/actions/pending-limit-actions";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getCartTotal, clearCart } = useCart();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [pendingLimit, setPendingLimit] = useState(0);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("full");
  const [partialAmount, setPartialAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  const subtotal = getCartTotal();
  const tax = 0;
  const shipping = 0;
  const total = subtotal + tax + shipping;

  // Check if user can make partial payment
  const canMakePartialPayment = userRole === "beauty_parlor" || userRole === "retailer";

  useEffect(() => {
    async function loadUserData() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/sign-in?redirect=/checkout");
        return;
      }

      // Get user role and details
      const { data: userData } = await supabase
        .from("users")
        .select("role, full_name, phone")
        .eq("id", user.id)
        .single();

      setUserRole(userData?.role || null);
      if (userData) {
        setUserData(userData);

        // Get pending limit for retailer/beauty_parlor
        if (userData.role === 'retailer' || userData.role === 'beauty_parlor') {
          const { data: userWithLimit } = await supabase
            .from("users")
            .select("pending_amount_limit")
            .eq("id", user.id)
            .single();

          setPendingLimit(Number(userWithLimit?.pending_amount_limit || 0));
        }
      }

      // Load addresses
      const { data: addressData } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });

      if (addressData) {
        setAddresses(addressData);
        const defaultAddr = addressData.find((addr) => addr.is_default);
        if (defaultAddr) {
          setSelectedAddress(defaultAddr.id);
        }
      }
    }

    loadUserData();
  }, []);

  useEffect(() => {
    if (items.length === 0) {
      router.push("/cart");
    }
  }, [items]);

  const handleAddAddress = async (addressData: any) => {
    setSavingAddress(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const payload = {
        ...addressData,
        state: addressData.state || "N/A", // Default state if missing
        user_id: user.id,
      };

      console.log("Checkout: Saving address:", payload);

      const { data, error } = await supabase
        .from("addresses")
        .insert(payload)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setAddresses((prev) => [...prev, data]);
      setSelectedAddress(data.id);
      setShowAddressForm(false);

      notify.success("Address Saved", "Your new address has been added successfully.");
    } catch (error: any) {
      console.error("Error saving address:", error);
      let errorMessage = "Failed to save address.";
      if (error?.message) errorMessage = error.message;
      if (error?.hint) errorMessage += ` - ${error.hint}`;

      notify.error("Error saving address", errorMessage);
    } finally {
      setSavingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      notify.error("Selection Required", "Please select a shipping address");
      return;
    }

    setLoading(true);
    console.log("=== Starting Order Placement ===");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        notify.error("Login Required", "Please log in to place an order");
        setLoading(false);
        return;
      }

      // Determine payment amounts
      const paidAmount = paymentMethod === "partial" ? partialAmount : total;
      const pendingAmount = paymentMethod === "partial" ? total - partialAmount : 0;

      // Validate pending limit if user is making partial payment
      if (pendingAmount > 0 && (userRole === 'retailer' || userRole === 'beauty_parlor')) {
        const validation = await validateCheckoutPendingLimit(user.id, total, paidAmount);
        if (!validation.valid) {
          notify.error("Limit Exceeded", validation.error || "Pending amount limit exceeded. Please pay the full amount.");
          setLoading(false);
          return;
        }
      }

      console.log("Order details:", {
        user_id: user.id,
        total_amount: total,
        paid_amount: paidAmount,
        pending_amount: pendingAmount,
        payment_method: paymentMethod,
        shipping_address_id: selectedAddress,
        items_count: items.length
      });

      // Create order with all required fields
      const orderPayload = {
        user_id: user.id,
        order_number: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        subtotal: subtotal,
        total_amount: total,
        paid_amount: paidAmount,
        pending_amount: pendingAmount,
        items: items.map(item => ({
          product_id: item.product_id,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        shipping_address: addresses.find(a => a.id === selectedAddress),
        payment_method: paymentMethod,
      };

      console.log("Creating order with payload:", orderPayload);

      // Determine initial payment amount if user chose partial payment
      const initialPayment = paymentMethod === "partial" ? partialAmount : undefined;

      const result = await placeOrderAction(orderPayload, items, initialPayment);

      if (result.error) {
        console.error("=== Order Creation Error ===", result.error);
        notify.error("Order Failed", `Failed to place order: ${result.error}`);
        setLoading(false);
        return;
      }

      const orderId = result.orderId;
      console.log("Order created successfully. Order ID:", orderId);

      // Clear cart
      clearCart();

      // Redirect to success page
      console.log("=== Order Placement Complete ===");
      router.push(`/orders/${orderId}?success=true`);
    } catch (err: any) {
      console.error("=== Unexpected Error in Order Placement ===", err);
      notify.error("Unexpected Error", `An error occurred: ${err.message || 'Please try again'}`);
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#FDFCF9]">
      <MainNav />

      <div className="container mx-auto px-4 py-8">
        <h1 className="font-display text-4xl font-bold text-[#1A1A1A] mb-8">
          Checkout
        </h1>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
          {[
            { num: 1, label: "Address", icon: MapPin },
            { num: 2, label: "Payment", icon: CreditCard },
            { num: 3, label: "Review", icon: Package },
          ].map((s, idx) => (
            <div key={s.num} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${step >= s.num
                    ? "bg-[#D4AF37] text-white"
                    : "bg-gray-200 text-gray-500"
                    }`}
                >
                  {step > s.num ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    <s.icon className="h-6 w-6" />
                  )}
                </div>
                <span className="text-sm mt-2">{s.label}</span>
              </div>
              {idx < 2 && (
                <div
                  className={`w-24 h-1 mx-4 ${step > s.num ? "bg-[#D4AF37]" : "bg-gray-200"
                    }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Step 1: Address */}
            {step === 1 && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-2xl font-bold mb-6">Shipping Address</h2>

                {!showAddressForm && (
                  <>
                    <div className="space-y-4 mb-6">
                      {addresses.map((addr) => (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddress(addr.id)}
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${selectedAddress === addr.id
                            ? "border-[#D4AF37] bg-[#D4AF37]/5"
                            : "border-gray-200 hover:border-gray-300"
                            }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold">{addr.name}</p>
                              <p className="text-sm text-gray-600">{addr.phone}</p>
                              <p className="text-sm mt-2">
                                {addr.address_line1}, {addr.address_line2}
                              </p>
                              <p className="text-sm">
                                {addr.city}, {addr.state} {addr.postal_code}
                              </p>
                              {addr.is_default && (
                                <span className="inline-block mt-2 text-xs bg-[#D4AF37] text-white px-2 py-1 rounded">
                                  Default
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => setShowAddressForm(true)}
                      className="w-full"
                    >
                      + Add New Address
                    </Button>

                    <Button
                      onClick={() => setStep(2)}
                      disabled={!selectedAddress}
                      className="w-full mt-4 bg-[#D4AF37] hover:bg-[#B8941F]"
                    >
                      Continue to Payment
                    </Button>
                  </>
                )}

                {showAddressForm && (
                  <AddressForm
                    onSubmit={handleAddAddress}
                    onCancel={() => setShowAddressForm(false)}
                    defaultName={userData?.full_name}
                    defaultPhone={userData?.phone}
                    isLoading={savingAddress}
                  />
                )}
              </div>
            )}

            {/* Step 2: Payment Method */}
            {step === 2 && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-2xl font-bold mb-6">Payment Method</h2>

                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 border-2 rounded-lg p-4">
                      <RadioGroupItem value="full" id="full" />
                      <Label htmlFor="full" className="flex-1 cursor-pointer">
                        <div>
                          <p className="font-semibold">Pay Full Amount</p>
                          <p className="text-sm text-gray-600">
                            Pay Rs. {total.toLocaleString()} now
                          </p>
                        </div>
                      </Label>
                    </div>

                    {canMakePartialPayment && (
                      <div className="flex items-start space-x-2 border-2 rounded-lg p-4">
                        <RadioGroupItem value="partial" id="partial" className="mt-1" />
                        <Label htmlFor="partial" className="flex-1 cursor-pointer">
                          <div className="space-y-3">
                            <div>
                              <p className="font-semibold">Payment Schedule</p>
                              <p className="text-sm text-gray-600">
                                Choose how much to pay on delivery - from Rs. 0 to full amount
                              </p>
                            </div>
                            {paymentMethod === "partial" && (
                              <div>
                                <Label htmlFor="partialAmount" className="text-sm">
                                  Amount to Pay on Delivery
                                </Label>
                                <Input
                                  id="partialAmount"
                                  type="number"
                                  min={0}
                                  max={total}
                                  value={partialAmount}
                                  onChange={(e) => setPartialAmount(Number(e.target.value))}
                                  className="mt-1"
                                  placeholder="Enter amount (0 to full)"
                                />
                                {partialAmount < 0 || partialAmount > total ? (
                                  <p className="text-xs text-red-500 mt-1">
                                    Amount must be between 0 and {total}
                                  </p>
                                ) : (
                                  <p className="text-sm text-gray-600 mt-2">
                                    Will be collected: Rs. {partialAmount.toLocaleString()}<br />
                                    Will be pending: Rs. {(total - partialAmount).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </Label>
                      </div>
                    )}
                  </div>
                </RadioGroup>



                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    disabled={paymentMethod === "partial" && (partialAmount < 0 || partialAmount > total)}
                    className="flex-1 bg-[#D4AF37] hover:bg-[#B8941F]"
                  >
                    Review Order
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Review & Place Order */}
            {step === 3 && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-2xl font-bold mb-6">Review Your Order</h2>

                {/* Order Items */}
                <div className="space-y-4 mb-6">
                  {items.map((item) => (
                    <div key={item.product_id} className="flex gap-4">
                      <div className="relative w-20 h-20 rounded overflow-hidden flex-shrink-0">
                        <Image
                          src={item.image || "/placeholder.jpg"}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{item.name}</h4>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        <p className="text-[#D4AF37] font-bold">
                          Rs. {(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>Rs. {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>Rs. {tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span>FREE</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span className="text-[#D4AF37]">Rs. {total.toLocaleString()}</span>
                  </div>

                  {paymentMethod === "partial" && (
                    <>
                      <div className="flex justify-between text-green-600">
                        <span>Paying Now:</span>
                        <span>Rs. {partialAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-orange-600">
                        <span>Pending Balance:</span>
                        <span>Rs. {(total - partialAmount).toLocaleString()}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                    Back
                  </Button>
                  <Button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="flex-1 bg-[#D4AF37] hover:bg-[#B8941F]"
                  >
                    {loading ? "Placing Order..." : "Place Order"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 shadow-sm sticky top-4">
              <h3 className="font-bold text-lg mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Items ({items.length}):</span>
                  <span>Rs. {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>Rs. {tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>FREE</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t pt-2">
                  <span>Total:</span>
                  <span className="text-[#D4AF37]">Rs. {total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div >

      <MainFooter />
    </div >
  );
}
