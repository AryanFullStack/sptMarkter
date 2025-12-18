"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/supabase/client";
import { MainNav } from "@/components/main-nav";
import { MainFooter } from "@/components/main-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Clock, CheckCircle, Truck, XCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchOrders() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          items:order_items(*, product:products(name, images))
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        setOrders(data);
      }
      setLoading(false);
    }

    fetchOrders();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "pending_payment":
        return "bg-orange-500";
      case "cancelled":
        return "bg-red-500";
      case "delivered":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCF9]">
        <MainNav />
        <div className="container mx-auto px-4 py-16 text-center">
          <p>Loading your orders...</p>
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
          My Orders
        </h1>

        {orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <Package className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Orders Yet</h2>
            <p className="text-gray-600 mb-6">Looks like you haven't placed any orders yet.</p>
            <Button asChild className="bg-[#D4AF37] hover:bg-[#B8941F]">
              <Link href="/store">Start Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
                {/* Order Header */}
                <div className="bg-gray-50 p-6 border-b border-gray-100 flex flex-wrap gap-4 justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Order Placed</p>
                    <p className="font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="font-medium">Rs. {order.total_amount.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Status</p>
                    <Badge className={`${getStatusColor(order.status)} text-white hover:${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Order #</p>
                    <p className="font-medium font-mono text-sm">{order.id.slice(0, 8)}</p>
                  </div>
                  <div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/orders/${order.id}`}>View Details</Link>
                    </Button>
                  </div>
                </div>

                {/* Order Items Preview */}
                <div className="p-6">
                  {order.pending_amount > 0 && (
                    <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-3 text-orange-800">
                      <Clock className="h-5 w-5" />
                      <div>
                        <p className="font-semibold">Pending Balance: Rs. {order.pending_amount.toLocaleString()}</p>
                        <p className="text-sm">Please clear the remaining amount to complete this order.</p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {order.items?.map((item: any) => (
                      <div key={item.id} className="flex-shrink-0 w-20 h-20 relative rounded-md overflow-hidden border">
                        <Image
                          src={item.product?.images?.[0] || "/placeholder.jpg"}
                          alt={item.product?.name || "Product"}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <MainFooter />
    </div>
  );
}
