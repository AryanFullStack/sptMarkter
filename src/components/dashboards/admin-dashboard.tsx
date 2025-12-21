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
  X,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  UserPlus,
  ShoppingBag,
  Warehouse,
  ShieldCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { notify } from "@/lib/notifications";
import {
  loadAdminDashboardDataAction,
  deleteUserAction,
  updateUserRoleAction,
  approveUserAction,
  markOrderPaidAction
} from "@/app/admin/actions";
import { recordPartialPayment } from "@/app/actions/salesman-actions";
import { Trash, Tag, UserCog } from "lucide-react";
import { UsersTable } from "./users-table";
import { BrandsManager } from "./brands-manager";
import { SalesmanManagement } from "@/components/admin/salesman-management";
import { LedgerReports } from "@/components/admin/ledger-reports";
import { PaymentRequestManagement } from "../shared/payment-request-management";
import { PaymentRecordModal } from "../shared/payment-record-modal";

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
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const data = await loadAdminDashboardDataAction();
      setStats(data.stats);
      setRecentOrders(data.recentOrders || []);
      setLowStockProducts(data.lowStockProducts || []);
      setSalesData(data.salesData || []);
      setPendingUsers(data.pendingUsers || []);
      setAllUsers(data.allUsers || []);
      setPendingPaymentOrders(data.pendingPaymentOrders || []);
    } catch (e) {
      console.error("Dashboard Load Error", e);
      notify.error("Error", "Failed to load dashboard data");
    }
    setLoading(false);
  }

  const handleApproveUser = async (userId: string) => {
    try {
      await approveUserAction(userId);
      notify.success("User Approved", "User account has been activated.");
      loadDashboardData();
    } catch (error: any) {
      notify.error("Error", error.message || "Failed to approve user");
    }
  };

  const handleMarkPaid = async (orderId: string, amount: number) => {
    try {
      await markOrderPaidAction(orderId, amount);
      notify.success("Payment Recorded", "Order marked as fully paid.");
      loadDashboardData();
    } catch (error) {
      notify.error("Error", "Failed to update payment");
    }
  }

  const handleCollectAmount = (order: any) => {
    setSelectedOrderForPayment(order);
    setShowPaymentModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-green-100 text-green-800 border-green-200";
      case "shipped": return "bg-blue-100 text-blue-800 border-blue-200";
      case "processing": return "bg-amber-100 text-amber-800 border-amber-200";
      case "cancelled": return "bg-red-100 text-red-800 border-red-200";
      case "pending_payment": return "bg-orange-100 text-orange-800 border-orange-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-[#F7F5F2] rounded-full" />
          <div className="w-20 h-20 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin absolute top-0" />
        </div>
        <p className="text-[#6B6B6B] font-serif italic animate-pulse">Gathering business intelligence...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[#E8E8E8] pb-8">
        <div>
          <h1 className="font-serif text-4xl font-bold text-[#1A1A1A] tracking-tight">Executive Dashboard</h1>
          <p className="text-[#6B6B6B] mt-1 text-lg">System status is <span className="text-green-600 font-semibold italic">Optimal</span></p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/inventory">
            <Button variant="outline" className="h-11 px-6 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white transition-all">
              Update Stock
            </Button>
          </Link>
          <Link href="/admin/orders">
            <Button className="h-11 px-6 bg-[#1A1A1A] hover:bg-[#333333] text-white shadow-lg shadow-black/10">
              Process Orders
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-8">
        <div className="overflow-x-auto pb-2 scrollbar-hide">
          <TabsList className="bg-transparent h-auto p-0 flex gap-8 border-b border-[#E8E8E8] w-full justify-start rounded-none">
            {["Overview", "Payments", "Approvals", "Users", "Salesmen", "Brands", "Ledgers"].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab.toLowerCase()}
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#D4AF37] rounded-none px-0 pb-4 text-base font-medium transition-all"
              >
                {tab}
                {tab === "Payments" && pendingPaymentOrders.length > 0 && (
                  <Badge className="ml-2 bg-[#D4AF37] hover:bg-[#D4AF37]">{pendingPaymentOrders.length}</Badge>
                )}
                {tab === "Approvals" && stats.pendingApprovals > 0 && (
                  <Badge className="ml-2 bg-red-500 hover:bg-red-500">{stats.pendingApprovals}</Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-8 animate-in fade-in transition-all duration-700">
          {/* KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Gross Revenue", value: `Rs. ${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-green-600", bg: "bg-green-50", trend: "up" },
              { label: "Order Volume", value: stats.totalOrders.toLocaleString(), icon: ShoppingBag, color: "text-[#D4AF37]", bg: "bg-[#FDFCF9]", trend: "up" },
              { label: "Pending Credits", value: `Rs. ${stats.pendingCredits.toLocaleString()}`, icon: CreditCard, color: "text-red-600", bg: "bg-red-50", trend: "down" },
              { label: "Low Stock Items", value: stats.lowStockItems, icon: Warehouse, color: "text-orange-600", bg: "bg-orange-50", trend: "down" }
            ].map((kpi, i) => (
              <Card key={i} className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                <div className={`absolute top-0 left-0 w-1 h-full ${kpi.trend === 'up' ? 'bg-green-500' : 'bg-red-500'}`} />
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className={`p-3 rounded-xl ${kpi.bg} ${kpi.color} group-hover:scale-110 transition-transform`}>
                      <kpi.icon className="h-6 w-6" />
                    </div>
                    {kpi.trend === 'up' ? <ArrowUpRight className="h-4 w-4 text-green-500" /> : <ArrowDownRight className="h-4 w-4 text-red-500" />}
                  </div>
                  <div className="mt-4">
                    <p className="text-sm font-medium text-[#6B6B6B] uppercase tracking-wider">{kpi.label}</p>
                    <h3 className="text-2xl font-bold text-[#1A1A1A] mt-1">{kpi.value}</h3>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Visualizations & Recent */}
            <div className="lg:col-span-2 space-y-8">
              {/* Performance Graph */}
              <Card className="border-none shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="font-serif text-2xl">Sales Performance</CardTitle>
                    <CardDescription>Monthly transaction analysis</CardDescription>
                  </div>
                  <Select defaultValue="7d">
                    <SelectTrigger className="w-[120px] bg-transparent border-[#E8E8E8]">
                      <SelectValue placeholder="Period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">24 Hours</SelectItem>
                      <SelectItem value="7d">7 Days</SelectItem>
                      <SelectItem value="30d">30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </CardHeader>
                <CardContent className="h-[350px] pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesData}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E8E8" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6B6B6B', fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B6B6B', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1A1A1A', borderRadius: '8px', border: 'none', color: '#FFF' }}
                        itemStyle={{ color: '#D4AF37' }}
                      />
                      <Area type="monotone" dataKey="sales" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Active Order Stream */}
              <Card className="border-none shadow-sm h-full">
                <CardHeader className="flex flex-row items-center justify-between bg-[#FDFCF9]/30">
                  <div>
                    <CardTitle className="font-serif text-2xl">Market Activity</CardTitle>
                    <CardDescription>Live order stream across all regions</CardDescription>
                  </div>
                  <Link href="/admin/orders">
                    <Button variant="ghost" className="text-[#D4AF37] hover:bg-[#FDFCF9]">View Ledger</Button>
                  </Link>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-[#F7F5F2]/50">
                        <TableRow>
                          <TableHead className="pl-6">ID / Ref</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Recorded By</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead className="pr-6">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentOrders.map((order) => (
                          <TableRow key={order.id} className="hover:bg-[#FDFCF9] group transition-colors">
                            <TableCell className="pl-6 py-4">
                              <p className="font-mono font-bold text-xs">#{order.order_number || order.id.slice(0, 8)}</p>
                              <p className="text-[10px] text-[#6B6B6B] mt-0.5">{new Date(order.created_at).toLocaleTimeString()}</p>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm font-semibold text-[#1A1A1A]">{order.users?.full_name}</p>
                            </TableCell>
                            <TableCell>
                              <p className="text-xs text-[#6B6B6B]">{order.recorded_by_user?.full_name || "Direct"}</p>
                            </TableCell>
                            <TableCell>
                              <p className="font-bold text-sm">Rs. {Number(order.total_amount).toLocaleString()}</p>
                            </TableCell>
                            <TableCell className="pr-6">
                              <Badge variant="outline" className={cn("px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", getStatusColor(order.status))}>
                                {order.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar - Critical Alerts & Stats */}
            <div className="space-y-8">
              {/* Operational Summary */}
              <Card className="border-none shadow-sm bg-[#1A1A1A] text-white">
                <CardHeader>
                  <CardTitle className="text-xl">System Overview</CardTitle>
                  <CardDescription className="text-gray-400 italic">Core operational health</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg"><Activity className="h-5 w-5 text-blue-400" /></div>
                      <span className="text-sm">Active Agents</span>
                    </div>
                    <span className="font-bold">12</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/20 rounded-lg"><UserPlus className="h-5 w-5 text-green-400" /></div>
                      <span className="text-sm">New Requests</span>
                    </div>
                    <span className="font-bold text-green-400">{stats.pendingApprovals}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-500/20 rounded-lg"><Package className="h-5 w-5 text-orange-400" /></div>
                      <span className="text-sm">Replenishment Needs</span>
                    </div>
                    <span className="font-bold text-orange-400">{stats.lowStockItems}</span>
                  </div>
                </CardContent>
                <div className="p-6 border-t border-white/5">
                  <Button className="w-full bg-[#D4AF37] hover:bg-[#C19B2E] text-white border-none h-11">
                    Generate System Report
                  </Button>
                </div>
              </Card>

              {/* Critical - Low Stock */}
              <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-red-50/50 pb-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-serif">Stock Alerts</CardTitle>
                    <Badge variant="destructive" className="animate-pulse">{lowStockProducts.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-[#F7F5F2]">
                    {lowStockProducts.length === 0 ? (
                      <div className="p-8 text-center text-[#6B6B6B]">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500 opacity-50" />
                        <p className="text-sm">Inventory healthy</p>
                      </div>
                    ) : (
                      lowStockProducts.slice(0, 5).map((p) => (
                        <div key={p.id} className="p-4 flex justify-between items-center hover:bg-red-50/30 transition-colors">
                          <div className="flex-1 pr-4">
                            <p className="text-xs font-bold text-[#1A1A1A] line-clamp-1">{p.name}</p>
                            <p className="text-[10px] text-[#6B6B6B] mt-0.5">Brand: {p.brands?.name || 'N/A'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-red-600">{p.stock_quantity} left</p>
                            <Link href="/admin/inventory" className="text-[9px] text-[#D4AF37] font-bold uppercase hover:underline">Restock</Link>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
                {lowStockProducts.length > 5 && (
                  <div className="p-4 bg-gray-50/50 text-center">
                    <Link href="/admin/inventory" className="text-xs font-semibold text-[#6B6B6B] hover:text-[#1A1A1A]">View Remaining {lowStockProducts.length - 5} items</Link>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="border-b border-[#F7F5F2]">
              <CardTitle className="font-serif text-2xl flex items-center gap-3">
                <AlertCircle className="h-7 w-7 text-orange-500" />
                Financial Verification
              </CardTitle>
              <CardDescription>Review and approve market collection requests</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-12">
                <section>
                  <PaymentRequestManagement />
                </section>

                <section className="border-t pt-10">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-serif text-2xl text-[#1A1A1A]">Unreconciled Direct Orders</h3>
                    <Badge variant="outline" className="border-[#D4AF37] text-[#D4AF37]">Manual Processing Required</Badge>
                  </div>

                  {pendingPaymentOrders.length === 0 ? (
                    <div className="text-center py-20 bg-[#FDFCF9]/50 rounded-2xl border-2 border-dashed border-[#E8E8E8]">
                      <CheckCircle className="h-16 w-16 mx-auto mb-4 opacity-50 text-green-500" />
                      <p className="text-lg font-medium text-[#6B6B6B]">Treasury cleared. No pending manual orders.</p>
                    </div>
                  ) : (
                    <div className="border rounded-xl overflow-hidden shadow-sm bg-white">
                      <Table>
                        <TableHeader className="bg-gray-50/50">
                          <TableRow>
                            <TableHead className="py-4 pl-6">Order Reference</TableHead>
                            <TableHead>Execution Date</TableHead>
                            <TableHead className="text-right">Commitment</TableHead>
                            <TableHead className="text-right">Current Paid</TableHead>
                            <TableHead className="text-right">Outstanding</TableHead>
                            <TableHead className="text-center">Agent</TableHead>
                            <TableHead className="pr-6 text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pendingPaymentOrders.map((order) => (
                            <TableRow key={order.id} className="hover:bg-gray-50 transition-colors">
                              <TableCell className="py-4 pl-6 font-mono font-bold text-xs">#{order.order_number || order.id.slice(0, 8)}</TableCell>
                              <TableCell className="text-xs text-[#6B6B6B]">{new Date(order.created_at).toLocaleDateString()}</TableCell>
                              <TableCell className="text-right font-medium">Rs. {Number(order.total_amount).toLocaleString()}</TableCell>
                              <TableCell className="text-right text-green-600 font-bold">Rs. {Number(order.paid_amount).toLocaleString()}</TableCell>
                              <TableCell className="text-right text-red-600 font-extrabold">Rs. {Number(order.pending_amount).toLocaleString()}</TableCell>
                              <TableCell className="text-center text-[10px] font-semibold text-[#1A1A1A] uppercase tracking-tighter">
                                {order.recorded_by_user?.full_name || "Nexus System"}
                              </TableCell>
                              <TableCell className="pr-6 text-right">
                                <Button
                                  size="sm"
                                  className="bg-[#D4AF37] hover:bg-[#C19B2E] text-white shadow-md shadow-[#D4AF37]/20 border-none px-4"
                                  onClick={() => handleCollectAmount(order)}
                                >
                                  Process Collection
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </section>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-6 mt-8 animate-in fade-in slide-in-from-right-4 duration-300">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-[#1A1A1A] text-white p-8">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="font-serif text-3xl flex items-center gap-3">
                    <Users className="h-8 w-8 text-[#D4AF37]" />
                    Identity Verification
                  </CardTitle>
                  <CardDescription className="text-gray-400 text-lg mt-2">Process new market entry applications for retailers and beauty parlors</CardDescription>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-3xl font-bold text-[#D4AF37]">{pendingUsers.length}</p>
                  <p className="text-xs uppercase tracking-widest text-gray-500 font-bold">Awaiting Review</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {pendingUsers.length === 0 ? (
                <div className="text-center py-24 text-[#6B6B6B]">
                  <ShieldCheck className="h-20 w-20 mx-auto mb-6 opacity-20 text-green-500" />
                  <p className="text-xl font-serif">Registry is complete. No pending verifications.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="pl-6 py-4">Applicant</TableHead>
                        <TableHead>Communication</TableHead>
                        <TableHead>Proposed Role</TableHead>
                        <TableHead>Cycle Start</TableHead>
                        <TableHead className="pr-6 text-right">Decision</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingUsers.map((user) => (
                        <TableRow key={user.id} className="hover:bg-[#FDFCF9] group transition-all">
                          <TableCell className="pl-6 py-6 border-b border-[#F7F5F2]">
                            <p className="font-bold text-[#1A1A1A] text-lg">{user.full_name || "Identity Undefined"}</p>
                            <p className="text-xs text-[#6B6B6B] mt-0.5">UID: {user.id.slice(0, 12)}...</p>
                          </TableCell>
                          <TableCell className="border-b border-[#F7F5F2]">
                            <p className="text-sm font-medium">{user.email}</p>
                            <p className="text-xs text-[#6B6B6B]">{user.phone || 'No direct lead'}</p>
                          </TableCell>
                          <TableCell className="border-b border-[#F7F5F2]">
                            <Badge variant="outline" className="capitalize px-3 py-1 bg-white border-[#E8E8E8] font-bold text-[#1A1A1A]">
                              {user.role?.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="border-b border-[#F7F5F2]">
                            <p className="text-xs font-medium text-[#6B6B6B]">{new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                          </TableCell>
                          <TableCell className="pr-6 py-6 text-right border-b border-[#F7F5F2]">
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                className="bg-[#1A1A1A] hover:bg-[#333333] text-white px-6 h-10 shadow-lg shadow-black/10"
                                onClick={() => handleApproveUser(user.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6 animate-in slide-in-from-bottom-2 duration-400">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-6">
              <div>
                <CardTitle className="font-serif text-3x">Identity Registry</CardTitle>
                <CardDescription>Comprehensive database of all verified system users</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0 border-t border-[#F7F5F2]">
              <UsersTable users={allUsers} onUpdate={loadDashboardData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salesmen" className="space-y-6 animate-in slide-in-from-bottom-2 duration-400">
          <SalesmanManagement />
        </TabsContent>

        <TabsContent value="brands" className="space-y-6 animate-in slide-in-from-bottom-2 duration-400">
          <BrandsManager />
        </TabsContent>

        <TabsContent value="ledgers" className="space-y-6 animate-in slide-in-from-bottom-2 duration-400">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="pb-8">
              <CardTitle className="font-serif text-3xl">Financial Ledgers</CardTitle>
              <CardDescription className="text-base">Global pending limits and credit exposure analysis</CardDescription>
            </CardHeader>
            <CardContent className="p-0 border-t border-[#F7F5F2]">
              <LedgerReports />
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs >

      {selectedOrderForPayment && (
        <PaymentRecordModal
          open={showPaymentModal}
          onOpenChange={setShowPaymentModal}
          orderId={selectedOrderForPayment.id}
          orderNumber={selectedOrderForPayment.order_number || selectedOrderForPayment.id.slice(0, 8)}
          pendingAmount={selectedOrderForPayment.pending_amount}
          onPaymentRecorded={loadDashboardData}
          recordPaymentAction={recordPartialPayment}
          title="Collect Payment"
          description="Record a partial or full payment collection"
          buttonText="Record Collection"
        />
      )}
    </div >
  );
}

