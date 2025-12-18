"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, Column } from "@/components/shared/data-table";
import { ExportButton } from "@/components/shared/export-button";
import { PaymentRecordModal } from "@/components/admin/payment-record-modal";
import { DollarSign, CreditCard, AlertCircle } from "lucide-react";
import { formatCurrency, formatDate } from "@/utils/export-utils";

interface Order {
    id: string;
    order_number: string;
    total_amount: number;
    paid_amount: number | null;
    pending_amount: number | null;
    created_at: string;
    user?: {
        full_name: string;
        email: string;
        role: string;
    };
}

export default function PaymentsPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);

        const [ordersData, paymentsData] = await Promise.all([
            supabase
                .from("orders")
                .select(`
          *,
          user:user_id(full_name, email, role)
        `)
                .gt("pending_amount", 0)
                .order("created_at", { ascending: false }),
            supabase
                .from("payments")
                .select(`
          *,
          order:order_id(order_number),
          recorder:recorded_by(full_name)
        `)
                .order("created_at", { ascending: false })
                .limit(50)
        ]);

        setOrders(ordersData.data || []);
        setPayments(paymentsData.data || []);
        setLoading(false);
    }

    const handleRecordPayment = (order: Order) => {
        setSelectedOrder(order);
        setShowPaymentModal(true);
    };

    const handlePaymentSuccess = () => {
        setShowPaymentModal(false);
        setSelectedOrder(null);
        loadData();
    };

    const orderColumns: Column<Order>[] = [
        {
            key: "order_number",
            header: "Order",
            sortable: true,
            render: (order) => (
                <span className="font-mono text-sm">#{order.order_number}</span>
            )
        },
        {
            key: "user",
            header: "Customer",
            render: (order) => (
                <div>
                    <p className="font-medium">{order.user?.full_name}</p>
                    <p className="text-sm text-[#6B6B6B]">{order.user?.email}</p>
                </div>
            )
        },
        {
            key: "total_amount",
            header: "Total",
            sortable: true,
            render: (order) => formatCurrency(order.total_amount)
        },
        {
            key: "paid_amount",
            header: "Paid",
            render: (order) => formatCurrency(order.paid_amount || 0)
        },
        {
            key: "pending_amount",
            header: "Pending",
            sortable: true,
            render: (order) => (
                <span className="text-[#C77D2E] font-semibold">
                    {formatCurrency(order.pending_amount || order.total_amount)}
                </span>
            )
        },
        {
            key: "created_at",
            header: "Date",
            sortable: true,
            render: (order) => formatDate(order.created_at)
        },
        {
            key: "actions",
            header: "Actions",
            render: (order) => (
                <Button size="sm" onClick={() => handleRecordPayment(order)}>
                    Record Payment
                </Button>
            )
        }
    ];

    const paymentColumns: Column<any>[] = [
        {
            key: "created_at",
            header: "Date",
            sortable: true,
            render: (payment) => formatDate(payment.created_at, true)
        },
        {
            key: "order",
            header: "Order",
            render: (payment) => (
                <span className="font-mono text-sm">
                    #{payment.order?.order_number}
                </span>
            )
        },
        {
            key: "amount",
            header: "Amount",
            sortable: true,
            render: (payment) => formatCurrency(payment.amount)
        },
        {
            key: "payment_method",
            header: "Method",
            render: (payment) => (
                <Badge variant="outline" className="capitalize">
                    {payment.payment_method.replace("_", " ")}
                </Badge>
            )
        },
        {
            key: "recorder",
            header: "Recorded By",
            render: (payment) => payment.recorder?.full_name || "N/A"
        },
        {
            key: "notes",
            header: "Notes",
            render: (payment) => payment.notes || "-"
        }
    ];

    const stats = {
        totalPending: orders.reduce((sum, o) => sum + (o.pending_amount || o.total_amount), 0),
        ordersWithPending: orders.length,
        recentPayments: payments.length,
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="font-serif text-4xl font-semibold text-[#1A1A1A]">
                        Payment Reconciliation
                    </h1>
                    <p className="text-[#6B6B6B] mt-2">
                        Record payments and track outstanding balances
                    </p>
                </div>
                <ExportButton data={payments} filename="payments-export" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-[#6B6B6B]">
                            Total Pending
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-[#C77D2E]" />
                            <span className="text-2xl font-bold text-[#C77D2E]">
                                {formatCurrency(stats.totalPending)}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-[#6B6B6B]">
                            Orders with Pending
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-[#D4AF37]" />
                            <span className="text-2xl font-bold text-[#1A1A1A]">
                                {stats.ordersWithPending}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-[#6B6B6B]">
                            Recent Payments
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-[#2D5F3F]" />
                            <span className="text-2xl font-bold text-[#2D5F3F]">
                                {stats.recentPayments}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Outstanding Orders */}
            <Card>
                <CardHeader>
                    <CardTitle className="font-serif text-2xl">Outstanding Balances</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-12 text-[#6B6B6B]">Loading...</div>
                    ) : (
                        <DataTable
                            data={orders}
                            columns={orderColumns}
                            searchable
                            searchPlaceholder="Search orders..."
                        />
                    )}
                </CardContent>
            </Card>

            {/* Payment History */}
            <Card>
                <CardHeader>
                    <CardTitle className="font-serif text-2xl">Payment History</CardTitle>
                </CardHeader>
                <CardContent>
                    <DataTable
                        data={payments}
                        columns={paymentColumns}
                        emptyMessage="No payments recorded yet"
                    />
                </CardContent>
            </Card>

            {/* Payment Modal */}
            {showPaymentModal && selectedOrder && (
                <PaymentRecordModal
                    order={selectedOrder}
                    onClose={() => {
                        setShowPaymentModal(false);
                        setSelectedOrder(null);
                    }}
                    onSuccess={handlePaymentSuccess}
                />
            )}
        </div>
    );
}
