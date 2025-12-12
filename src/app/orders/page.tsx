"use client";

import { useState, useEffect } from "react";
import MainNav from "@/components/main-nav";
import MainFooter from "@/components/main-footer";
import { createClient } from "@/supabase/client";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) setOrders(data);
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
          <p className="text-center text-[#6B6B6B]">Loading orders...</p>
        </div>
        <MainFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF9]">
      <MainNav />
      <main className="container mx-auto px-4 py-16">
        <h1 className="font-serif text-4xl font-semibold text-[#1A1A1A] mb-8">My Orders</h1>
        
        {orders.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[#6B6B6B] text-lg mb-6">No orders yet</p>
            <Link href="/store" className="text-[#D4AF37] hover:underline">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-mono text-sm text-[#6B6B6B]">Order #{order.order_number}</p>
                      <p className="text-sm text-[#6B6B6B]">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[#1A1A1A] font-semibold">₹{order.total_amount.toFixed(2)}</p>
                    <span className="text-[#D4AF37] text-sm hover:underline">View Details →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <MainFooter />
    </div>
  );
}
