"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Package, DollarSign, Activity, Users, AlertCircle, Check } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { approveUserAction, deleteUserAction, markOrderPaidAction } from "@/app/admin/actions";
import { Trash } from "lucide-react";

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
    const { toast } = useToast();

    useEffect(() => {
        loadDashboardData();
    }, []);

    async function loadDashboardData() {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch assigned orders
        const { data: assignedOrdersData } = await supabase
            .from("orders")
            .select("*")
            .eq("assigned_to", user.id)
            .order("created_at", { ascending: false });

        // Fetch logs/payments (mock count if table missing, or use count)
        // Assuming we count orders marked paid by this user? 
        // For now using total orders count as proxy or keeping simpler stats

        // Fetch pending users (ALL, since they aren't assigned yet)
        const { data: pendingUsersData } = await supabase
            .from("users")
            .select("*")
            .in("role", ["retailer", "beauty_parlor"])
            .is("approved", null)
            .order("created_at", { ascending: false });

        // Calculate stats
        const assignedOrdersCount = assignedOrdersData?.length || 0;

        // Filter pending payments from ASSIGNED orders
        const pendingPayments = assignedOrdersData?.filter(
            order => (order.pending_amount > 0 || order.payment_status === 'pending_payment' || order.status === 'pending_payment')
        ) || [];

        const pendingOrdersCount = assignedOrdersData?.filter(o => o.status === 'pending').length || 0;

        setStats({
            assignedOrders: assignedOrdersCount,
            pendingOrders: pendingOrdersCount,
            totalPayments: 0, // Placeholder
            stockUpdates: 0, // Placeholder
            pendingApprovals: pendingUsersData?.length || 0,
        });

        setPendingPaymentOrders(pendingPayments);
        setPendingUsers(pendingUsersData || []);
        setLoading(false);
    }

    const handleApproveUser = async (userId: string) => {
        try {
            const { error } = await supabase
                .from("users")
                .update({ approved: new Date().toISOString() })
                .eq("id", userId);

            if (error) throw error;

            toast({
                title: "User Approved",
                description: "The user has been approved successfully.",
            });
            loadDashboardData();
        } catch (error) {
            console.error("Error approving user:", error);
            toast({
                title: "Error",
                description: "Failed to approve user.",
                variant: "destructive",
            });
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm("Are you sure you want to reject this user? The account will be deleted.")) return;
        try {
            await deleteUserAction(userId);
            toast({ title: "User Rejected", description: "Application rejected and user removed." });
            loadDashboardData();
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to delete user", variant: "destructive" });
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

            toast({
                title: "Payment Recorded",
                description: "Order marked as fully paid.",
            });
            loadDashboardData();
        } catch (error) {
            console.error("Error updating payment:", error);
            toast({
                title: "Error",
                description: "Failed to update payment status.",
                variant: "destructive",
            });
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
        <div className="space-y-6">
            <div>
                <h1 className="font-serif text-4xl font-semibold text-[#1A1A1A]">
                    Sub-Admin Dashboard
                </h1>
                <p className="text-[#6B6B6B] mt-2">
                    Welcome back! Manage your assigned tasks
                </p>
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
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-[#6B6B6B]">
                                    Assigned Orders
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <ShoppingCart className="h-5 w-5 text-[#D4AF37]" />
                                    <span className="text-2xl font-bold text-[#1A1A1A]">
                                        {stats.assignedOrders}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-[#6B6B6B]">
                                    Pending Orders
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <Package className="h-5 w-5 text-[#C77D2E]" />
                                    <span className="text-2xl font-bold text-[#C77D2E]">
                                        {stats.pendingOrders}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-[#6B6B6B]">
                                    Pending Approvals
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-[#D4AF37]" />
                                    <span className="text-2xl font-bold text-[#1A1A1A]">
                                        {stats.pendingApprovals}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-[#6B6B6B]">
                                    Stock Updates
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-[#D4AF37]" />
                                    <span className="text-2xl font-bold text-[#1A1A1A]">
                                        {stats.stockUpdates}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="font-serif text-2xl">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-[#6B6B6B]">
                                Use the navigation menu to manage orders, update stock, and view your activity logs
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="payments" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-serif text-2xl flex items-center gap-2">
                                <AlertCircle className="h-6 w-6 text-[#C77D2E]" />
                                Pending Payments (Assigned Orders)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {pendingPaymentOrders.length === 0 ? (
                                <div className="text-center py-12 text-[#6B6B6B]">
                                    <Check className="h-12 w-12 mx-auto mb-4 opacity-50 text-[#2D5F3F]" />
                                    <p>No pending payments in your assigned orders.</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Order ID</TableHead>
                                            <TableHead>Total</TableHead>
                                            <TableHead>Pending</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pendingPaymentOrders.map((order) => (
                                            <TableRow key={order.id}>
                                                <TableCell className="font-mono text-sm">{order.order_number || order.id.slice(0, 8)}</TableCell>
                                                <TableCell>₹{Number(order.total_amount).toLocaleString()}</TableCell>
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
                                    <Check className="h-12 w-12 mx-auto mb-4 opacity-50 text-[#2D5F3F]" />
                                    <p>No pending user approvals.</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Role</TableHead>
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
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => handleDeleteUser(user.id)}
                                                        >
                                                            <Trash className="h-4 w-4 mr-1" />
                                                            Reject
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
            </Tabs>
        </div >
    );
}
