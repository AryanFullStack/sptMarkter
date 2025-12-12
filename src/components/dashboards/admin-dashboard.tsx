"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/supabase/client";
import {
  Package,
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle,
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    pendingCredits: 0,
    lowStockItems: 0,
    activeCustomers: 0,
    pendingApprovals: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    const { data: orders } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    const { data: products } = await supabase
      .from("products")
      .select("*")
      .lte("stock_quantity", 10)
      .limit(5);

    const { count: usersCount } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .neq("role", "admin");

    const { count: pendingCount } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .in("role", ["retailer", "beauty_parlor"])
      .is("approved", null);

    const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
    const pendingCredits = orders?.reduce((sum, order) => sum + (Number(order.total_amount) - Number(order.paid_amount)), 0) || 0;

    // Generate sales data for last 7 days
    const salesByDay = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayOrders = orders?.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate.toDateString() === date.toDateString();
      }) || [];
      salesByDay.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sales: dayOrders.reduce((sum, o) => sum + Number(o.total_amount), 0),
        orders: dayOrders.length
      });
    }

    setStats({
      totalRevenue,
      totalOrders: orders?.length || 0,
      pendingCredits,
      lowStockItems: products?.length || 0,
      activeCustomers: usersCount || 0,
      pendingApprovals: pendingCount || 0,
    });
    setRecentOrders(orders || []);
    setLowStockProducts(products || []);
    setSalesData(salesByDay);
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
        <p className="text-center text-[#6B6B6B]">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="font-serif text-4xl font-semibold text-[#1A1A1A] mb-2">Admin Dashboard</h1>
        <p className="text-[#6B6B6B]">Welcome back! Here's what's happening today.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#6B6B6B]">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-[#D4AF37]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1A1A1A]">₹{stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-[#6B6B6B] mt-1">All time revenue</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#6B6B6B]">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-[#D4AF37]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1A1A1A]">{stats.totalOrders}</div>
            <p className="text-xs text-[#6B6B6B] mt-1">All time orders</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#6B6B6B]">Pending Credits</CardTitle>
            <AlertCircle className="h-4 w-4 text-[#C77D2E]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#C77D2E]">₹{stats.pendingCredits.toFixed(2)}</div>
            <p className="text-xs text-[#6B6B6B] mt-1">Outstanding payments</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#6B6B6B]">Low Stock Items</CardTitle>
            <Package className="h-4 w-4 text-[#8B3A3A]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#8B3A3A]">{stats.lowStockItems}</div>
            <p className="text-xs text-[#6B6B6B] mt-1">Need reordering</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#6B6B6B]">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-[#D4AF37]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1A1A1A]">{stats.activeCustomers}</div>
            <p className="text-xs text-[#6B6B6B] mt-1">Registered users</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#6B6B6B]">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-[#C77D2E]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#C77D2E]">{stats.pendingApprovals}</div>
            <p className="text-xs text-[#6B6B6B] mt-1">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-2xl">Sales Overview (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F7F5F2" />
              <XAxis dataKey="date" stroke="#6B6B6B" />
              <YAxis stroke="#6B6B6B" />
              <Tooltip />
              <Line type="monotone" dataKey="sales" stroke="#D4AF37" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-2xl">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/admin/products">
              <Button variant="outline" className="w-full h-24 flex-col gap-2">
                <Package className="h-6 w-6 text-[#D4AF37]" />
                <span>Manage Products</span>
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button variant="outline" className="w-full h-24 flex-col gap-2">
                <Users className="h-6 w-6 text-[#D4AF37]" />
                <span>Manage Users</span>
              </Button>
            </Link>
            <Link href="/admin/orders">
              <Button variant="outline" className="w-full h-24 flex-col gap-2">
                <ShoppingCart className="h-6 w-6 text-[#D4AF37]" />
                <span>View Orders</span>
              </Button>
            </Link>
            <Link href="/admin/reports">
              <Button variant="outline" className="w-full h-24 flex-col gap-2">
                <TrendingUp className="h-6 w-6 text-[#D4AF37]" />
                <span>View Reports</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-2xl">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="text-center py-12 text-[#6B6B6B]">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent orders</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.slice(0, 5).map((order) => (
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

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-2xl">Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-12 text-[#6B6B6B]">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50 text-[#2D5F3F]" />
                <p>All products are well stocked</p>
              </div>
            ) : (
              <div className="space-y-4">
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="flex justify-between items-center border-b border-[#F7F5F2] pb-4">
                    <div>
                      <p className="font-semibold text-[#1A1A1A]">{product.name}</p>
                      <p className="text-sm text-[#6B6B6B]">SKU: {product.slug}</p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-[#8B3A3A] text-white">
                        {product.stock_quantity} left
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
