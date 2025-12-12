"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/supabase/client";
import { Package, Heart, MapPin, Bell, ShoppingBag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function CustomerDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    wishlistItems: 0,
    savedAddresses: 0,
    notifications: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [ordersRes, wishlistRes, addressesRes] = await Promise.all([
      supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("wishlist").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("addresses").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    ]);

    setStats({
      totalOrders: ordersRes.data?.length || 0,
      wishlistItems: wishlistRes.count || 0,
      savedAddresses: addressesRes.count || 0,
      notifications: 0,
    });

    setRecentOrders(ordersRes.data?.slice(0, 5) || []);
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
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-[#6B6B6B]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="font-serif text-4xl font-semibold text-[#1A1A1A] mb-2">My Dashboard</h1>
        <p className="text-[#6B6B6B]">Manage your orders and account</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#6B6B6B]">My Orders</CardTitle>
            <Package className="h-4 w-4 text-[#D4AF37]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1A1A1A]">{stats.totalOrders}</div>
            <p className="text-xs text-[#6B6B6B] mt-1">Total orders</p>
            <Link href="/orders">
              <Button variant="link" className="px-0 text-[#D4AF37] mt-2">View all orders</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#6B6B6B]">Wishlist</CardTitle>
            <Heart className="h-4 w-4 text-[#D4AF37]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1A1A1A]">{stats.wishlistItems}</div>
            <p className="text-xs text-[#6B6B6B] mt-1">Saved items</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#6B6B6B]">Addresses</CardTitle>
            <MapPin className="h-4 w-4 text-[#D4AF37]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1A1A1A]">{stats.savedAddresses}</div>
            <p className="text-xs text-[#6B6B6B] mt-1">Saved addresses</p>
            <Link href="/profile">
              <Button variant="link" className="px-0 text-[#D4AF37] mt-2">Manage addresses</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#6B6B6B]">Notifications</CardTitle>
            <Bell className="h-4 w-4 text-[#D4AF37]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1A1A1A]">{stats.notifications}</div>
            <p className="text-xs text-[#6B6B6B] mt-1">Unread messages</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-2xl">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="text-center py-12 text-[#6B6B6B]">
              <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="mb-4">No orders yet</p>
              <Link href="/store">
                <Button className="bg-[#D4AF37] hover:bg-[#C19B2E] text-white">
                  Start Shopping
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex justify-between items-center border-b border-[#F7F5F2] pb-4">
                  <div>
                    <p className="font-mono text-sm text-[#6B6B6B]">#{order.order_number}</p>
                    <p className="text-sm text-[#6B6B6B]">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#1A1A1A]">₹{order.total_amount.toFixed(2)}</p>
                    <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
