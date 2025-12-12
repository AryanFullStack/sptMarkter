"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/supabase/client";
import DashboardNavbar from "@/components/dashboard-navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download, TrendingUp, Users, Package, DollarSign } from "lucide-react";

export default function ReportsPage() {
  const [reportType, setReportType] = useState("sales");
  const [salesData, setSalesData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [creditReport, setCreditReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    checkAdmin();
    loadReports();
  }, []);

  async function checkAdmin() {
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

    if (userData?.role !== "admin") {
      router.push("/dashboard");
    }
  }

  async function loadReports() {
    const { data: orders } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: users } = await supabase
      .from("users")
      .select("*")
      .in("role", ["retailer", "beauty_parlor"]);

    // Sales by month
    const salesByMonth: any = {};
    orders?.forEach(order => {
      const month = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!salesByMonth[month]) {
        salesByMonth[month] = { month, sales: 0, orders: 0 };
      }
      salesByMonth[month].sales += Number(order.total_amount);
      salesByMonth[month].orders += 1;
    });
    setSalesData(Object.values(salesByMonth).slice(-6));

    // Top products (mock data - would need order_items join)
    setTopProducts([
      { name: "Hydrating Face Serum", sales: 45, revenue: 134955 },
      { name: "Vitamin C Cream", sales: 38, revenue: 113962 },
      { name: "Keratin Shampoo", sales: 52, revenue: 67548 },
      { name: "HD Foundation", sales: 28, revenue: 89572 },
      { name: "Makeup Brush Set", sales: 35, revenue: 90965 },
    ]);

    // Credit report
    const creditData = users?.map(user => ({
      name: user.full_name || user.email,
      email: user.email,
      role: user.role,
      credit_limit: user.credit_limit || 0,
      credit_used: user.credit_used || 0,
      credit_available: (user.credit_limit || 0) - (user.credit_used || 0),
    })) || [];
    setCreditReport(creditData);

    setLoading(false);
  }

  const COLORS = ['#D4AF37', '#C77D2E', '#2D5F3F', '#8B3A3A', '#6B6B6B'];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCF9]">
        <DashboardNavbar />
        <div className="container mx-auto px-4 py-16">
          <p className="text-center text-[#6B6B6B]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF9]">
      <DashboardNavbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="font-serif text-4xl font-semibold text-[#1A1A1A] mb-2">Reports & Analytics</h1>
            <p className="text-[#6B6B6B]">View detailed reports and insights</p>
          </div>
          <Button className="bg-[#D4AF37] hover:bg-[#C19B2E] text-white">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="font-serif text-2xl">Report Type</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sales">Sales Report</SelectItem>
                <SelectItem value="products">Product Performance</SelectItem>
                <SelectItem value="credit">Credit Report</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {reportType === "sales" && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="font-serif text-2xl">Sales Overview (Last 6 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F7F5F2" />
                    <XAxis dataKey="month" stroke="#6B6B6B" />
                    <YAxis stroke="#6B6B6B" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sales" fill="#D4AF37" name="Revenue (₹)" />
                    <Bar dataKey="orders" fill="#C77D2E" name="Orders" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-[#6B6B6B]">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-[#D4AF37]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#1A1A1A]">
                    ₹{salesData.reduce((sum, d) => sum + d.sales, 0).toFixed(2)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-[#6B6B6B]">Total Orders</CardTitle>
                  <TrendingUp className="h-4 w-4 text-[#D4AF37]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#1A1A1A]">
                    {salesData.reduce((sum, d) => sum + d.orders, 0)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-[#6B6B6B]">Avg Order Value</CardTitle>
                  <DollarSign className="h-4 w-4 text-[#D4AF37]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#1A1A1A]">
                    ₹{(salesData.reduce((sum, d) => sum + d.sales, 0) / salesData.reduce((sum, d) => sum + d.orders, 0) || 0).toFixed(2)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-[#6B6B6B]">Growth Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-[#2D5F3F]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#2D5F3F]">+12.5%</div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {reportType === "products" && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="font-serif text-2xl">Top Selling Products</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#F7F5F2" />
                    <XAxis type="number" stroke="#6B6B6B" />
                    <YAxis dataKey="name" type="category" stroke="#6B6B6B" width={150} />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#D4AF37" name="Revenue (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-2xl">Product Performance Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Units Sold</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Avg Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topProducts.map((product, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.sales}</TableCell>
                        <TableCell>₹{product.revenue.toFixed(2)}</TableCell>
                        <TableCell>₹{(product.revenue / product.sales).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}

        {reportType === "credit" && (
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-2xl">Credit Report - Retailers & Beauty Parlors</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Credit Limit</TableHead>
                    <TableHead>Credit Used</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Utilization</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creditReport.map((user, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="capitalize">{user.role.replace("_", " ")}</TableCell>
                      <TableCell>₹{user.credit_limit.toFixed(2)}</TableCell>
                      <TableCell>₹{user.credit_used.toFixed(2)}</TableCell>
                      <TableCell className="text-[#2D5F3F]">₹{user.credit_available.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-[#F7F5F2] rounded-full h-2">
                            <div
                              className="bg-[#D4AF37] h-2 rounded-full"
                              style={{ width: `${user.credit_limit > 0 ? (user.credit_used / user.credit_limit) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-sm text-[#6B6B6B]">
                            {user.credit_limit > 0 ? ((user.credit_used / user.credit_limit) * 100).toFixed(0) : 0}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
