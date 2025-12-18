"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExportButton } from "@/components/shared/export-button";
import { formatCurrency } from "@/utils/export-utils";
import { TrendingUp, DollarSign, Users, Package, Calendar } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  const [salesData, setSalesData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [creditData, setCreditData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    outstandingCredit: 0,
    totalCustomers: 0,
  });

  const supabase = createClient();

  useEffect(() => {
    loadReports();
  }, [dateRange]);

  async function loadReports() {
    setLoading(true);

    const [ordersData, usersData, productsData] = await Promise.all([
      supabase
        .from("orders")
        .select("*")
        .gte("created_at", dateRange.start)
        .lte("created_at", dateRange.end)
        .order("created_at", { ascending: true }),
      supabase
        .from("users")
        .select("role, credit_limit, credit_used")
        .in("role", ["retailer", "beauty_parlor"]),
      supabase
        .from("order_items")
        .select("product_id, quantity, products(name)")
        .gte("created_at", dateRange.start)
        .lte("created_at", dateRange.end),
    ]);

    const orders = ordersData.data || [];
    const users = usersData.data || [];

    // Calculate stats
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const outstandingCredit = orders.reduce((sum, o) => sum + (Number(o.pending_amount) || 0), 0);

    setStats({
      totalRevenue,
      totalOrders,
      avgOrderValue,
      outstandingCredit,
      totalCustomers: users.length,
    });

    // Sales by day
    const salesByDay: any = {};
    orders.forEach(order => {
      const date = new Date(order.created_at).toLocaleDateString();
      if (!salesByDay[date]) {
        salesByDay[date] = { date, revenue: 0, orders: 0 };
      }
      salesByDay[date].revenue += Number(order.total_amount);
      salesByDay[date].orders += 1;
    });
    setSalesData(Object.values(salesByDay));

    // Top products
    const productSales: any = {};
    (productsData.data || []).forEach((item: any) => {
      const productName = item.products?.name || "Unknown";
      if (!productSales[productName]) {
        productSales[productName] = { name: productName, quantity: 0 };
      }
      productSales[productName].quantity += item.quantity;
    });
    const topProductsList = Object.values(productSales)
      .sort((a: any, b: any) => b.quantity - a.quantity)
      .slice(0, 10);
    setTopProducts(topProductsList as any);

    // Credit utilization by user
    const creditByRole = users.reduce((acc: any, user) => {
      const role = user.role === "retailer" ? "Retailers" : "Beauty Parlors";
      if (!acc[role]) {
        acc[role] = { name: role, total: 0, used: 0 };
      }
      acc[role].total += Number(user.credit_limit || 0);
      acc[role].used += Number(user.credit_used || 0);
      return acc;
    }, {});
    setCreditData(Object.values(creditByRole));

    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="font-serif text-4xl font-semibold text-[#1A1A1A]">
            Reports & Analytics
          </h1>
          <p className="text-[#6B6B6B] mt-2">
            Sales insights and performance metrics
          </p>
        </div>
        <ExportButton
          data={[...salesData, ...topProducts]}
          filename={`report-${dateRange.start}-to-${dateRange.end}`}
        />
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Date Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>
            <div className="flex-1">
              <Label>End Date</Label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
            <Button onClick={loadReports}>Update Report</Button>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#6B6B6B]">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#2D5F3F]" />
              <span className="text-2xl font-bold text-[#2D5F3F]">
                {formatCurrency(stats.totalRevenue)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#6B6B6B]">
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-[#D4AF37]" />
              <span className="text-2xl font-bold text-[#1A1A1A]">
                {stats.totalOrders}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#6B6B6B]">
              Avg Order Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#D4AF37]" />
              <span className="text-2xl font-bold text-[#1A1A1A]">
                {formatCurrency(stats.avgOrderValue)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#6B6B6B]">
              Outstanding Credit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#C77D2E]" />
              <span className="text-2xl font-bold text-[#C77D2E]">
                {formatCurrency(stats.outstandingCredit)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#6B6B6B]">
              Credit Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#D4AF37]" />
              <span className="text-2xl font-bold text-[#1A1A1A]">
                {stats.totalCustomers}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-2xl">Sales Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-80 flex items-center justify-center text-[#6B6B6B]">
              Loading chart...
            </div>
          ) : salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F7F5F2" />
                <XAxis dataKey="date" stroke="#6B6B6B" />
                <YAxis stroke="#6B6B6B" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2} name="Revenue (₹)" />
                <Line type="monotone" dataKey="orders" stroke="#2D5F3F" strokeWidth={2} name="Orders" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-[#6B6B6B]">
              No data for selected period
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Products and Credit Usage */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-2xl">Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F7F5F2" />
                  <XAxis dataKey="name" stroke="#6B6B6B" />
                  <YAxis stroke="#6B6B6B" />
                  <Tooltip />
                  <Bar dataKey="quantity" fill="#D4AF37" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-[#6B6B6B]">
                No product data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Credit Utilization */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-2xl">Credit Utilization by Role</CardTitle>
          </CardHeader>
          <CardContent>
            {creditData.length > 0 ? (
              <div className="space-y-4">
                {creditData.map((item: any, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">{item.name}</span>
                      <span>
                        {formatCurrency(item.used)} / {formatCurrency(item.total)}
                      </span>
                    </div>
                    <div className="h-2 bg-[#E8E8E8] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#D4AF37]"
                        style={{ width: `${(item.used / item.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-[#6B6B6B]">
                No credit data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
