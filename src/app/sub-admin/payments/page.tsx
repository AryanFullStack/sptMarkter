"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, CheckCircle } from "lucide-react";
import { PaymentRequestManagement } from "@/components/shared/payment-request-management";
import { notify } from "@/lib/notifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { createClient } from "@/supabase/client";
import { markOrderPaidAction } from "@/app/admin/actions";

export default function SubAdminPaymentsPage() {
    const [pendingPaymentOrders, setPendingPaymentOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch assigned orders with pending payments
            const { data: assignedOrdersData } = await supabase
                .from("orders")
                .select("*, users(full_name)")
                .eq("assigned_to", user.id)
                .order("created_at", { ascending: false });

            const pendingPayments = assignedOrdersData?.filter(
                order => (order.pending_amount > 0 || order.payment_status === 'pending_payment' || order.status === 'pending_payment')
            ) || [];

            setPendingPaymentOrders(pendingPayments);
        } catch (error) {
            console.error("Error loading payment data:", error);
            notify.error("Error", "Failed to load payment data");
        }
        setLoading(false);
    }

    const handleMarkPaid = async (orderId: string) => {
        try {
            await markOrderPaidAction(orderId);
            notify.success("Payment Recorded", "Order marked as fully paid.");
            loadData();
        } catch (error: any) {
            notify.error("Error", error.message || "Failed to update payment");
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
                <div className="w-16 h-16 border-4 border-[#F7F5F2] rounded-full relative">
                    <div className="w-16 h-16 border-4 border-[#2D5F3F] border-t-transparent rounded-full animate-spin absolute top-[-4px] left-[-4px]" />
                </div>
                <p className="text-[#6B6B6B] font-medium italic animate-pulse">Loading payment data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[#E8E8E8] pb-8">
                <div>
                    <h1 className="font-serif text-4xl font-bold text-[#1A1A1A] tracking-tight">Financial Verification</h1>
                    <p className="text-[#6B6B6B] mt-1 text-lg">
                        Central control for payment requests and outstanding balances
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="border-b border-[#F7F5F2] pb-6">
                    <CardTitle className="font-serif text-2xl flex items-center gap-3">
                        <AlertCircle className="h-7 w-7 text-orange-500" />
                        Payment Management
                    </CardTitle>
                    <CardDescription>Review and approve payment requests from your assigned clients</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-12">
                        {/* Payment Requests Section */}
                        <section>
                            <PaymentRequestManagement />
                        </section>

                        {/* Assigned Collections Section */}
                        <section className="border-t pt-10">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-serif text-2xl text-[#1A1A1A]">Assigned Collections</h3>
                                <Badge variant="outline" className="border-[#2D5F3F] text-[#2D5F3F]">Reconciliation Pipeline</Badge>
                            </div>

                            {pendingPaymentOrders.length === 0 ? (
                                <div className="text-center py-20 bg-[#FDFCF9]/50 rounded-2xl border-2 border-dashed border-[#E8E8E8]">
                                    <CheckCircle className="h-16 w-16 mx-auto mb-4 opacity-50 text-green-500" />
                                    <p className="text-lg font-medium text-[#6B6B6B]">Treasury cleared. No collections pending.</p>
                                </div>
                            ) : (
                                <div className="border rounded-xl overflow-hidden shadow-sm bg-white">
                                    <Table>
                                        <TableHeader className="bg-gray-50/50">
                                            <TableRow>
                                                <TableHead className="pl-6 py-4">Ref</TableHead>
                                                <TableHead>Client</TableHead>
                                                <TableHead>Total</TableHead>
                                                <TableHead>Outstanding</TableHead>
                                                <TableHead className="pr-6 text-right">Authorization</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pendingPaymentOrders.map((order) => (
                                                <TableRow key={order.id} className="hover:bg-[#FDFCF9] group transition-all">
                                                    <TableCell className="pl-6 py-6 font-mono font-bold text-xs">#{order.order_number || order.id.slice(0, 8)}</TableCell>
                                                    <TableCell className="font-medium">{order.users?.full_name || "N/A"}</TableCell>
                                                    <TableCell>Rs. {Number(order.total_amount).toLocaleString()}</TableCell>
                                                    <TableCell className="text-red-600 font-extrabold">Rs. {Number(order.pending_amount).toLocaleString()}</TableCell>
                                                    <TableCell className="pr-6 text-right">
                                                        <Button
                                                            size="sm"
                                                            className="bg-[#2D5F3F] hover:bg-[#1E422B] text-white shadow-md shadow-[#2D5F3F]/20 border-none px-6 h-10"
                                                            onClick={() => handleMarkPaid(order.id)}
                                                        >
                                                            Finalize Collection
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
        </div>
    );
}
