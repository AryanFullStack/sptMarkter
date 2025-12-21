"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/supabase/client";
import {
    ShoppingCart,
    Package,
    Users,
    AlertCircle,
    CheckCircle,
    Activity,
    ArrowUpRight,
    Search,
    Filter,
    Clock,
    UserCheck,
    Truck,
    Check,
    Trash,
    BarChart3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { approveUserAction, deleteUserAction } from "@/app/admin/actions";
import { Input } from "@/components/ui/input";
import { PaymentRequestManagement } from "@/components/shared/payment-request-management";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function SubAdminPage() {
    const [stats, setStats] = useState({
        assignedOrders: 0,
        pendingOrders: 0,
        totalPayments: 0,
        stockUpdates: 0,
        pendingApprovals: 0,
    });
    const [pendingPaymentOrders, setPendingPaymentOrders] = useState<any[]>([]);
    const [pendingUsers, setPendingUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        loadDashboardData();
    }, []);

    async function loadDashboardData() {
        setLoading(true);
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch assigned orders with customer info
            const { data: assignedOrdersData } = await supabase
                .from("orders")
                .select("*, users(full_name)")
                .eq("assigned_to", user.id)
                .order("created_at", { ascending: false });

            // Fetch pending users
            const { data: pendingUsersData } = await supabase
                .from("users")
                .select("*")
                .in("role", ["retailer", "beauty_parlor"])
                .is("approved", null)
                .order("created_at", { ascending: false });

            // Calculate stats
            const assignedOrdersCount = assignedOrdersData?.length || 0;
            const pendingPayments = assignedOrdersData?.filter(
                order => (order.pending_amount > 0 || order.payment_status === 'pending_payment' || order.status === 'pending_payment')
            ) || [];
            const pendingOrdersCount = assignedOrdersData?.filter(o => o.status === 'pending').length || 0;

            setStats({
                assignedOrders: assignedOrdersCount,
                pendingOrders: pendingOrdersCount,
                totalPayments: 0,
                stockUpdates: 0,
                pendingApprovals: pendingUsersData?.length || 0,
            });

            setPendingPaymentOrders(pendingPayments);
            setPendingUsers(pendingUsersData || []);
        } catch (error) {
            console.error("Error loading dashboard data:", error);
            notify.error("Sync Error", "Failed to load operational data");
        }
        setLoading(false);
    }

    const handleApproveUser = async (userId: string) => {
        try {
            const { error } = await supabase
                .from("users")
                .update({ approved: new Date().toISOString() })
                .eq("id", userId);

            if (error) throw error;

            notify.success("Authorization Granted", "User credentials verified and active.");
            loadDashboardData();
        } catch (error) {
            notify.error("Verification Failed", "Could not approve user registry entry.");
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm("Are you sure?")) return;
        try {
            await deleteUserAction(userId);
            notify.success("Registry Updated", "Application rejected.");
            loadDashboardData();
        } catch (error: any) {
            notify.error("Action Failed", error.message);
        }
    };

    const handleMarkPaid = async (orderId: string, totalAmount: number) => {
        try {
            const { error } = await supabase
                .from("orders")
                .update({
                    paid_amount: totalAmount,
                    pending_amount: 0,
                    payment_status: 'completed',
                    status: 'confirmed',
                    updated_at: new Date().toISOString()
                })
                .eq("id", orderId);

            if (error) throw error;

            notify.success("Treasury Updated", "Order reconciliation complete.");
            loadDashboardData();
        } catch (error) {
            notify.error("Transaction Error", "Failed to update payment registry.");
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
                <div className="w-16 h-16 border-4 border-[#F7F5F2] rounded-full relative">
                    <div className="w-16 h-16 border-4 border-[#2D5F3F] border-t-transparent rounded-full animate-spin absolute top-[-4px] left-[-4px]" />
                </div>
                <p className="text-[#6B6B6B] font-medium italic animate-pulse">Gathering Operational Intelligence...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[#E8E8E8] pb-8">
                <div>
                    <h1 className="font-serif text-4xl font-bold text-[#1A1A1A] tracking-tight">Operations Desk</h1>
                    <p className="text-[#6B6B6B] mt-1 text-lg flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full" />
                        Real-time logistics and verification active
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="h-11 px-6 border-[#2D5F3F] text-[#2D5F3F] hover:bg-[#2D5F3F] hover:text-white transition-all">
                        Inventory Audit
                    </Button>
                    <Link href="/sub-admin/orders">
                        <Button className="h-11 px-6 bg-[#1A1A1A] hover:bg-[#333333] text-white shadow-lg shadow-black/10">
                            Dispatches
                        </Button>
                    </Link>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-8">
                <TabsList className="bg-transparent h-auto p-0 flex gap-8 border-b border-[#E8E8E8] w-full justify-start rounded-none">
                    {["Overview", "Approvals", "Payments", "Logs"].map(tab => (
                        <TabsTrigger
                            key={tab}
                            value={tab.toLowerCase()}
                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#2D5F3F] rounded-none px-0 pb-4 text-base font-semibold transition-all"
                        >
                            {tab}
                            {tab === "Approvals" && stats.pendingApprovals > 0 && (
                                <Badge className="ml-2 bg-red-500 hover:bg-red-500">{stats.pendingApprovals}</Badge>
                            )}
                            {tab === "Payments" && pendingPaymentOrders.length > 0 && (
                                <Badge className="ml-2 bg-[#2D5F3F] hover:bg-[#2D5F3F]">{pendingPaymentOrders.length}</Badge>
                            )}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="overview" className="space-y-8 animate-in fade-in transition-all duration-500">
                    {/* Operational KPIs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: "Assigned Load", value: stats.assignedOrders, icon: BarChart3, color: "text-[#2D5F3F]", bg: "bg-[#FDFCF9]" },
                            { label: "Execution Pending", value: stats.pendingOrders, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
                            { label: "Market Applications", value: stats.pendingApprovals, icon: UserCheck, color: "text-red-500", bg: "bg-red-50" },
                            { label: "Registry Updates", value: stats.stockUpdates, icon: Package, color: "text-blue-600", bg: "bg-blue-50" }
                        ].map((kpi, i) => (
                            <Card key={i} className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start">
                                        <div className={`p-3 rounded-xl ${kpi.bg} ${kpi.color} group-hover:scale-110 transition-transform`}>
                                            <kpi.icon className="h-6 w-6" />
                                        </div>
                                        <ArrowUpRight className="h-4 w-4 text-[#A0A0A0]" />
                                    </div>
                                    <div className="mt-4">
                                        <p className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-widest">{kpi.label}</p>
                                        <h3 className="text-3xl font-bold text-[#1A1A1A] mt-1">{kpi.value}</h3>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Dispatch Stream (Assigned) */}
                        <Card className="lg:col-span-2 border-none shadow-sm h-full">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-[#F7F5F2] pb-6">
                                <div>
                                    <CardTitle className="font-serif text-2xl">Assigned Queue</CardTitle>
                                    <CardDescription>Pipeline for your region or route</CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" className="text-[#6B6B6B] hover:text-[#2D5F3F]"><Search className="h-5 w-5" /></Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader className="bg-[#F7F5F2]/50">
                                        <TableRow>
                                            <TableHead className="pl-6">Ref</TableHead>
                                            <TableHead>Execution</TableHead>
                                            <TableHead>Customer</TableHead>
                                            <TableHead className="pr-6 text-right">Commitment</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pendingPaymentOrders.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-24">
                                                    <CheckCircle className="h-10 w-10 mx-auto mb-4 opacity-20 text-green-500" />
                                                    <p className="text-lg font-serif">Operations cleared</p>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            pendingPaymentOrders.slice(0, 5).map((order) => (
                                                <TableRow key={order.id} className="hover:bg-[#FDFCF9] group transition-colors">
                                                    <TableCell className="pl-6 py-4">
                                                        <p className="font-mono font-bold text-xs text-[#1A1A1A]">#{order.order_number || order.id.slice(0, 8)}</p>
                                                    </TableCell>
                                                    <TableCell>
                                                        <p className="text-[10px] text-[#6B6B6B] mt-0.5 flex items-center gap-1">
                                                            <Clock className="h-3 w-3" /> {new Date(order.created_at).toLocaleDateString()}
                                                        </p>
                                                    </TableCell>
                                                    <TableCell>
                                                        <p className="text-sm font-semibold text-[#1A1A1A]">{order.users?.full_name || "Nexus Client"}</p>
                                                    </TableCell>
                                                    <TableCell className="pr-6 text-right">
                                                        <p className="font-bold text-sm">Rs. {Number(order.total_amount).toLocaleString()}</p>
                                                        <Badge variant="outline" className="text-[8px] h-4 tracking-tighter uppercase font-bold text-orange-600 border-orange-200">Pending</Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Critical Actions */}
                        <div className="space-y-8">
                            <Card className="border-none shadow-sm bg-[#1A1A1A] text-white">
                                <CardHeader>
                                    <CardTitle className="text-xl">Quick Registry</CardTitle>
                                    <CardDescription className="text-gray-400 italic">Operational direct links</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3 pb-8">
                                    <Button variant="outline" className="w-full justify-start h-12 bg-white/5 border-white/10 hover:bg-white/10 text-white" asChild>
                                        <Link href="/sub-admin/orders"><Truck className="h-4 w-4 mr-3 text-[#2D5F3F]" /> Dispatch Center</Link>
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start h-12 bg-white/5 border-white/10 hover:bg-white/10 text-white" asChild>
                                        <Link href="/sub-admin/stock"><Package className="h-4 w-4 mr-3 text-[#2D5F3F]" /> Product Registry</Link>
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start h-12 bg-white/5 border-white/10 hover:bg-white/10 text-white" asChild>
                                        <Link href="/sub-admin/activity"><Activity className="h-4 w-4 mr-3 text-[#2D5F3F]" /> System Logs</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="approvals" className="animate-in slide-in-from-right-4 duration-300">
                    <Card className="border-none shadow-sm overflow-hidden">
                        <CardHeader className="bg-[#F7F5F2]/50 border-b border-[#E8E8E8]">
                            <CardTitle className="font-serif text-2xl">Identity Registry Processing</CardTitle>
                            <CardDescription>Verify and authorize new market participants</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {pendingUsers.length === 0 ? (
                                <div className="py-24 text-center">
                                    <div className="w-16 h-16 bg-green-50 border border-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Check className="h-8 w-8 text-green-600" />
                                    </div>
                                    <p className="text-lg font-serif text-[#1A1A1A]">Registry updated. No pending applications.</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader className="bg-gray-50/50">
                                        <TableRow>
                                            <TableHead className="pl-6 py-4">Applicant</TableHead>
                                            <TableHead>Communication</TableHead>
                                            <TableHead>Role Requirement</TableHead>
                                            <TableHead className="pr-6 text-right">Decision</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pendingUsers.map((user) => (
                                            <TableRow key={user.id} className="hover:bg-[#FDFCF9] group transition-all">
                                                <TableCell className="pl-6 py-6 border-b border-[#F7F5F2]">
                                                    <p className="font-bold text-[#1A1A1A] text-lg">{user.full_name || "New Registry"}</p>
                                                    <p className="text-[10px] text-[#6B6B6B] mt-0.5 uppercase tracking-tighter">UID: {user.id.slice(0, 15)}</p>
                                                </TableCell>
                                                <TableCell className="border-b border-[#F7F5F2]">
                                                    <p className="text-sm font-medium">{user.email}</p>
                                                    <p className="text-xs text-[#6B6B6B]">{user.phone || 'Lead pending'}</p>
                                                </TableCell>
                                                <TableCell className="border-b border-[#F7F5F2]">
                                                    <Badge variant="outline" className="bg-white border-[#E8E8E8] text-[#1A1A1A] capitalize font-bold">
                                                        {user.role?.replace("_", " ")}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="pr-6 text-right border-b border-[#F7F5F2]">
                                                    <div className="flex gap-2 justify-end">
                                                        <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => handleDeleteUser(user.id)}><Trash className="h-4 w-4 mr-2" /> Reject</Button>
                                                        <Button size="sm" className="bg-[#2D5F3F] hover:bg-[#1E422B] text-white px-6 h-10 shadow-lg shadow-black/10" onClick={() => handleApproveUser(user.id)}>
                                                            <CheckCircle className="h-4 w-4 mr-2" /> Authorize
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

                <TabsContent value="payments" className="animate-in slide-in-from-right-4 duration-300">
                    <Card className="border-none shadow-sm overflow-hidden">
                        <CardHeader className="border-b border-[#F7F5F2] pb-6">
                            <CardTitle className="font-serif text-2xl flex items-center gap-3">
                                <AlertCircle className="h-7 w-7 text-orange-500" />
                                Assigned Collections
                            </CardTitle>
                            <CardDescription>Reconciliation pipeline for your assigned market routes</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {pendingPaymentOrders.length === 0 ? (
                                <div className="text-center py-24 bg-[#FDFCF9]/50">
                                    <CheckCircle className="h-16 w-16 mx-auto mb-4 opacity-50 text-green-500" />
                                    <p className="text-lg font-medium text-[#6B6B6B]">Treasury cleared. No collections pending.</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader className="bg-gray-50/50">
                                        <TableRow>
                                            <TableHead className="pl-6 py-4">Ref</TableHead>
                                            <TableHead>Total</TableHead>
                                            <TableHead>Outstanding</TableHead>
                                            <TableHead className="pr-6 text-right">Authorization</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pendingPaymentOrders.map((order) => (
                                            <TableRow key={order.id} className="hover:bg-[#FDFCF9] group transition-all">
                                                <TableCell className="pl-6 py-6 font-mono font-bold text-xs">#{order.order_number || order.id.slice(0, 8)}</TableCell>
                                                <TableCell>Rs. {Number(order.total_amount).toLocaleString()}</TableCell>
                                                <TableCell className="text-red-600 font-extrabold">Rs. {Number(order.pending_amount).toLocaleString()}</TableCell>
                                                <TableCell className="pr-6 text-right">
                                                    <Button
                                                        size="sm"
                                                        className="bg-[#2D5F3F] hover:bg-[#1E422B] text-white shadow-md shadow-[#2D5F3F]/20 border-none px-6 h-10"
                                                        onClick={() => handleMarkPaid(order.id, order.total_amount)}
                                                    >
                                                        Finalize Collection
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

