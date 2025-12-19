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
  Check,
  X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  loadAdminDashboardDataAction,
  deleteUserAction,
  updateUserRoleAction,
  approveUserAction,
  markOrderPaidAction
} from "@/app/admin/actions";
import { Trash, Tag, UserCog } from "lucide-react";
import { UsersTable } from "./users-table";
import { BrandsManager } from "./brands-manager";
import { SalesmanManagement } from "@/components/admin/salesman-management";
import { LedgerReports } from "@/components/admin/ledger-reports";
import { PaymentRequestManagement } from "../shared/payment-request-management";

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
  const [pendingPaymentOrders, setPendingPaymentOrders] = useState<any[]>([]);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const data = await loadAdminDashboardDataAction();
      setStats(data.stats);
      setRecentOrders(data.recentOrders);
      setLowStockProducts(data.lowStockProducts);
      setSalesData(data.salesData);
      setPendingUsers(data.pendingUsers);
      setAllUsers(data.allUsers);
      setPendingPaymentOrders(data.pendingPaymentOrders);
    } catch (e) {
      console.error("Dashboard Load Error", e);
      toast({ title: "Error", description: "Failed to load dashboard data" });
    }
    setLoading(false);
  }




  const handleApproveUser = async (userId: string) => {
    try {
      await approveUserAction(userId);
      toast({ title: "User Approved", description: "User account has been activated." });
      loadDashboardData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to approve user", variant: "destructive" });
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      await updateUserRoleAction(userId, newRole);
      toast({ title: "Role Updated", description: "User role has been updated." });
      loadDashboardData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update role", variant: "destructive" });
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    try {
      await deleteUserAction(userId);
      toast({ title: "User Deleted", description: "User has been removed." });
      loadDashboardData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete user", variant: "destructive" });
    }
  }

  const handleMarkPaid = async (orderId: string, amount: number) => {
    try {
      await markOrderPaidAction(orderId, amount);
      toast({ title: "Payment Recorded", description: "Order marked as fully paid." });
      loadDashboardData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update payment", variant: "destructive" });
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-[#2D5F3F] text-white";
      case "shipped": return "bg-[#C77D2E] text-white";
      case "processing": return "bg-[#D4AF37] text-white";
      case "cancelled": return "bg-[#8B3A3A] text-white";
      case "pending_payment": return "bg-[#C77D2E] text-white";
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

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments" className="relative">
            Pending Payments
            {pendingPaymentOrders.length > 0 && (
              <span className="ml-2 bg-[#C77D2E] text-white text-[10px] px-1.5 rounded-full">
                {pendingPaymentOrders.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approvals" className="relative">
            User Approvals
            {stats.pendingApprovals > 0 && (
              <span className="ml-2 bg-[#C77D2E] text-white text-[10px] px-1.5 rounded-full">
                {stats.pendingApprovals}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="salesmen">Salesmen</TabsTrigger>
          <TabsTrigger value="brands" className="relative">
            Brands
          </TabsTrigger>
          <TabsTrigger value="ledgers">Ledgers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[#6B6B6B]">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-[#D4AF37]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#1A1A1A]">₹{stats.totalRevenue.toLocaleString()}</div>
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
                <CardTitle className="text-sm font-medium text-[#6B6B6B]">Pending Payments</CardTitle>
                <AlertCircle className="h-4 w-4 text-[#C77D2E]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#C77D2E]">₹{stats.pendingCredits.toLocaleString()}</div>
                <p className="text-xs text-[#6B6B6B] mt-1">Outstanding payments</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[#6B6B6B]">Pending Approvals</CardTitle>
                <Users className="h-4 w-4 text-[#D4AF37]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#1A1A1A]">{stats.pendingApprovals}</div>
                <p className="text-xs text-[#6B6B6B] mt-1">Awaiting verification</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Sales Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-2xl">Sales Overview</CardTitle>
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
                      {recentOrders.map((order) => (
                        <div key={order.id} className="flex justify-between items-center border-b border-[#F7F5F2] last:border-0 pb-4 last:pb-0">
                          <div>
                            <p className="font-mono text-sm text-[#6B6B6B]">#{order.order_number || order.id.slice(0, 8)}</p>
                            <p className="text-sm text-[#6B6B6B]">{new Date(order.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-[#1A1A1A]">₹{Number(order.total_amount).toLocaleString()}</p>
                            <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-xl">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/admin/products" className="block">
                    <Button variant="outline" className="w-full justify-start h-12">
                      <Package className="h-5 w-5 mr-3 text-[#D4AF37]" />
                      Manage Products
                    </Button>
                  </Link>
                  <Link href="/admin/users" className="block">
                    <Button variant="outline" className="w-full justify-start h-12">
                      <Users className="h-5 w-5 mr-3 text-[#D4AF37]" />
                      Manage Users
                    </Button>
                  </Link>
                  <Link href="/admin/orders" className="block">
                    <Button variant="outline" className="w-full justify-start h-12">
                      <ShoppingCart className="h-5 w-5 mr-3 text-[#D4AF37]" />
                      View All Orders
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Low Stock Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-xl">Low Stock Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  {lowStockProducts.length === 0 ? (
                    <div className="text-center py-8 text-[#6B6B6B]">
                      <CheckCircle className="h-10 w-10 mx-auto mb-2 opacity-50 text-[#2D5F3F]" />
                      <p>All products stocked</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {lowStockProducts.map((product) => (
                        <div key={product.id} className="flex justify-between items-center text-sm border-b border-[#F7F5F2] pb-2 last:border-0">
                          <div>
                            <p className="font-semibold text-[#1A1A1A]">{product.name}</p>
                          </div>
                          <Badge className="bg-[#8B3A3A] text-white">
                            {product.stock_quantity}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-2xl flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-[#C77D2E]" />
                Pending Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <PaymentRequestManagement />

                <div className="border-t pt-8">
                  <h3 className="font-serif text-xl mb-4">Old Pending Orders (Direct)</h3>
                  {pendingPaymentOrders.length === 0 ? (
                    <div className="text-center py-12 text-[#6B6B6B]">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50 text-[#2D5F3F]" />
                      <p>No other pending payments found.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Total Amount</TableHead>
                          <TableHead>Paid</TableHead>
                          <TableHead>Pending</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingPaymentOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-mono text-sm">{order.order_number || order.id.slice(0, 8)}</TableCell>
                            <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>₹{Number(order.total_amount).toLocaleString()}</TableCell>
                            <TableCell className="text-[#2D5F3F]">₹{Number(order.paid_amount).toLocaleString()}</TableCell>
                            <TableCell className="text-[#C77D2E] font-bold">₹{Number(order.pending_amount).toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">{order.status.replace("_", " ")}</Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                className="bg-[#2D5F3F] hover:bg-[#1E422B] text-white"
                                onClick={() => handleMarkPaid(order.id, order.total_amount)}
                              >
                                Mark Paid
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-2xl flex items-center gap-2">
                <Users className="h-6 w-6 text-[#D4AF37]" />
                User Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingUsers.length === 0 ? (
                <div className="text-center py-12 text-[#6B6B6B]">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50 text-[#2D5F3F]" />
                  <p>No pending user approvals.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-semibold">{user.full_name || "N/A"}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{user.role?.replace("_", " ")}</Badge>
                        </TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-[#2D5F3F] hover:bg-[#1E422B] text-white"
                              onClick={() => handleApproveUser(user.id)}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-2xl flex items-center gap-2">
                <Users className="h-6 w-6 text-[#D4AF37]" />
                User Management
              </CardTitle>
              <p className="text-sm text-[#6B6B6B] mt-2">
                Manage user accounts and update their roles
              </p>
            </CardHeader>
            <CardContent>
              {allUsers.length === 0 ? (
                <div className="text-center py-12 text-[#6B6B6B]">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No users found.</p>
                </div>
              ) : (
                <UsersTable users={allUsers} onUpdate={loadDashboardData} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salesmen" className="space-y-6">
          <SalesmanManagement />
        </TabsContent>

        <TabsContent value="brands" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-2xl flex items-center gap-2">
                <Tag className="h-6 w-6 text-[#D4AF37]" />
                Brand Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BrandsManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ledgers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-2xl flex items-center gap-2">
                <DollarSign className="h-6 w-6 text-[#2D5F3F]" />
                Ledger Reports
              </CardTitle>
              <p className="text-sm text-[#6B6B6B] mt-1">Consolidated view of shop pending limits and usage across all salesmen.</p>
            </CardHeader>
            <CardContent>
              <LedgerReports />
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs >
    </div >
  );
}
