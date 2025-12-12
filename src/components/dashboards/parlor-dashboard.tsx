"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/supabase/client";
import { Package, CreditCard, TrendingUp, AlertCircle, ShoppingBag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

export default function ParlorDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    creditLimit: 0,
    creditUsed: 0,
    totalSpent: 0,
    pendingPayments: 0,
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

    const { data: userData } = await supabase
      .from("users")
      .select("credit_limit, credit_used")
      .eq("id", user.id)
      .single();

    const { data: orders } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const totalSpent = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
    const pendingPayments = orders?.reduce((sum, order) => sum + (Number(order.total_amount) - Number(order.paid_amount)), 0) || 0;

    setStats({
      totalOrders: orders?.length || 0,
      creditLimit: userData?.credit_limit || 0,
      creditUsed: userData?.credit_used || 0,
      totalSpent,
      pendingPayments,
    });

    setRecentOrders(orders?.slice(0, 5) || []);
    setLoading(false);
  }

  const creditAvailable = stats.creditLimit - stats.creditUsed;
  const creditUtilization = stats.creditLimit > 0 ? (stats.creditUsed / stats.creditLimit) * 100 : 0;

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
        <div className="flex items-center gap-3 mb-2">
          <h1 className="font-serif text-4xl font-semibold text-[#1A1A1A]">Beauty Parlor Dashboard</h1>
          <Badge className="bg-[#D4AF37] text-white">Premium Pricing</Badge>
        </div>
        <p className="text-[#6B6B6B]">Manage your orders and credit</p>
      </div>

      {/* Credit Summary */}
      <Card className="border-[#D4AF37]/30 bg-gradient-to-br from-[#D4AF37]/5 to-transparent">
        <CardHeader>
          <CardTitle className="font-serif text-2xl flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-[#D4AF37]" />
            Credit Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-[#6B6B6B] mb-1">Credit Limit</p>
              <p className="text-3xl font-bold text-[#1A1A1A]">₹{stats.creditLimit.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-[#6B6B6B] mb-1">Used</p>
              <p className="text-3xl font-bold text-[#C77D2E]">₹{stats.creditUsed.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-[#6B6B6B] mb-1">Available</p>
              <p className="text-3xl font-bold text-[#2D5F3F]">₹{creditAvailable.toLocaleString()}</p>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[#6B6B6B]">Credit Utilization</span>
              <span className="font-semibold text-[#1A1A1A]">{creditUtilization.toFixed(1)}%</span>
            </div>
            <Progress value={creditUtilization} className="h-3" />
          </div>

          {creditUtilization > 80 && (
            <div className="flex items-start gap-2 p-4 bg-[#C77D2E]/10 border border-[#C77D2E]/30 rounded-lg">
              <AlertCircle className="h-5 w-5 text-[#C77D2E] flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-[#1A1A1A] mb-1">High Credit Utilization</p>
                <p className="text-[#6B6B6B]">
                  You're using {creditUtilization.toFixed(0)}% of your credit limit. Consider making a payment soon.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#6B6B6B]">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-[#D4AF37]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1A1A1A]">{stats.totalOrders}</div>
            <p className="text-xs text-[#6B6B6B] mt-1">All time orders</p>
            <Link href="/orders">
              <Button variant="link" className="px-0 text-[#D4AF37] mt-2">View orders</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#6B6B6B]">Pending Payments</CardTitle>
            <AlertCircle className="h-4 w-4 text-[#C77D2E]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#C77D2E]">₹{stats.pendingPayments.toFixed(2)}</div>
            <p className="text-xs text-[#6B6B6B] mt-1">Outstanding balance</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#6B6B6B]">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-[#D4AF37]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1A1A1A]">₹{stats.totalSpent.toFixed(2)}</div>
            <p className="text-xs text-[#6B6B6B] mt-1">Lifetime value</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#6B6B6B]">Credit Available</CardTitle>
            <CreditCard className="h-4 w-4 text-[#2D5F3F]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#2D5F3F]">₹{creditAvailable.toFixed(2)}</div>
            <p className="text-xs text-[#6B6B6B] mt-1">Available credit</p>
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
                  Browse Products
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

}
