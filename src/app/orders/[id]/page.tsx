"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import MainNav from "@/components/main-nav";
import MainFooter from "@/components/main-footer";
import { createClient } from "@/supabase/client";
import { Badge } from "@/components/ui/badge";

export default function OrderDetailPage() {
  const params = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadOrder();
  }, [params.id]);

  async function loadOrder() {
    const { data } = await supabase
      .from("orders")
      .select(`
        *,
        addresses (
          full_name,
          phone,
          address_line1,
          address_line2,
          city,
          state,
          postal_code
        )
      `)
      .eq("id", params.id)
      .single();

    if (data) setOrder(data);
    setLoading(false);
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-[#2D5F3F] text-white";
      case "shipped": return "bg-[#C77D2E] text-white";
      case "processing": return "bg-[#D4AF37] text-white";
      case "cancelled": return "bg-[#8B3A3A] text-white";
      default: return "bg-[#6B6B6B] text-white";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCF9]">
        <MainNav />
        <div className="container mx-auto px-4 py-16">
          <p className="text-center text-[#6B6B6B]">Loading order...</p>
        </div>
        <MainFooter />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#FDFCF9]">
        <MainNav />
        <div className="container mx-auto px-4 py-16">
          <p className="text-center text-[#6B6B6B]">Order not found</p>
        </div>
        <MainFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF9]">
      <MainNav />
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="mb-8">
          <h1 className="font-serif text-4xl font-semibold text-[#1A1A1A] mb-2">Order Details</h1>
          <p className="font-mono text-[#6B6B6B]">Order #{order.order_number}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">Order Status</h2>
            <Badge className={getStatusColor(order.status)}>
              {order.status}
            </Badge>
            <p className="text-[#6B6B6B] text-sm mt-4">
              Placed on {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">Payment</h2>
            <p className="text-[#6B6B6B] mb-2">Method: {order.payment_method.toUpperCase()}</p>
            <p className="text-[#1A1A1A] font-semibold text-lg">₹{order.total_amount.toFixed(2)}</p>
            {order.paid_amount < order.total_amount && (
              <p className="text-[#C77D2E] text-sm mt-2">
                Pending: ₹{(order.total_amount - order.paid_amount).toFixed(2)}
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">Shipping Address</h2>
          {order.addresses && (
            <div className="text-[#6B6B6B]">
              <p className="font-semibold text-[#1A1A1A]">{order.addresses.full_name}</p>
              <p>{order.addresses.address_line1}</p>
              {order.addresses.address_line2 && <p>{order.addresses.address_line2}</p>}
              <p>{order.addresses.city}, {order.addresses.state} {order.addresses.postal_code}</p>
              <p>{order.addresses.phone}</p>
            </div>
          )}
        </div>
      </main>
      <MainFooter />
    </div>
  );
}
