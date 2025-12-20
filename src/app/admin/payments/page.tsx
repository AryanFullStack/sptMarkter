"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, Column } from "@/components/shared/data-table";
import { ExportButton } from "@/components/shared/export-button";
import { PaymentRecordModal } from "@/components/admin/payment-record-modal";
import { DollarSign, CreditCard, AlertCircle, Clock, User, Store } from "lucide-react";
import { formatCurrency, formatDate } from "@/utils/export-utils";
import { getConsolidatedPendingPaymentsAction } from "@/app/admin/actions";
import { PaymentRequestManagement } from "@/components/shared/payment-request-management";
import { useToast } from "@/hooks/use-toast";

interface Order {
    id: string;
    order_number: string;
    total_amount: number;
    paid_amount: number | null;
    pending_amount: number | null;
    created_at: string;
    status: string;
    payment_status: string;
    user?: {
        id: string;
        full_name: string;
        email: string;
        role: string;
    };
    recorded_by_user?: {
        id: string;
        full_name: string;
        role: string;
    };
}

export default function PaymentsPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const data = await getConsolidatedPendingPaymentsAction();
            setOrders(data as Order[]);
        } catch (error: any) {
            toast({
                title: "Error",
                description: "Failed to load pending payments",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
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
            header: "Order / Date",
            sortable: true,
            render: (order) => (
                <div className="flex flex-col">
                    <span className="font-mono text-sm font-semibold">#{order.order_number}</span>
                    <span className="text-xs text-[#6B6B6B]">{formatDate(order.created_at)}</span>
                </div>
            )
        },
        {
            key: "user",
            header: "Shop / Client",
            render: (order) => (
                <div className="flex flex-col">
                    <p className="font-medium flex items-center gap-1">
                        <Store className="h-3 w-3 text-[#D4AF37]" />
                        {order.user?.full_name || "N/A"}
                    </p>
                    <p className="text-[10px] text-[#6B6B6B] capitalize">{order.user?.role?.replace("_", " ")}</p>
                </div>
            )
        },
        {
            key: "recorded_by_user",
            header: "Recorded By",
            render: (order) => (
                <div className="flex flex-col">
                    <p className="text-sm font-medium flex items-center gap-1">
                        <User className="h-3 w-3 text-[#6B6B6B]" />
                        {order.recorded_by_user?.full_name || "Self (Direct)"}
                    </p>
                    <p className="text-[10px] text-[#6B6B6B] font-mono italic">
                        {order.recorded_by_user?.role || "online"}
                    </p>
                </div>
            )
        },
        {
            key: "total_amount",
            header: "Financials",
            render: (order) => (
                <div className="flex flex-col text-right">
                    <span className="text-xs text-[#6B6B6B]">Total: {formatCurrency(order.total_amount)}</span>
                    <span className="text-xs text-[#2D5F3F]">Paid: {formatCurrency(order.paid_amount || 0)}</span>
                </div>
            )
        },
        {
            key: "pending_amount",
            header: "Pending Balance",
            sortable: true,
            render: (order) => (
                <div className="text-right">
                    <span className="text-[#C77D2E] font-bold text-lg">
                        {formatCurrency(order.pending_amount || 0)}
                    </span>
                </div>
            )
        },
        {
            key: "status",
            header: "Status",
            render: (order) => (
                <div className="flex flex-col gap-1">
                    <Badge variant="outline" className="capitalize text-[10px] w-fit">
                        {order.status.replace("_", " ")}
                    </Badge>
                    <Badge className="capitalize text-[10px] w-fit bg-[#C77D2E]">
                        {order.payment_status.replace("_", " ")}
                    </Badge>
                </div>
            )
        },
        {
            key: "actions",
            header: "Actions",
            render: (order) => (
                <Button size="sm" onClick={() => handleRecordPayment(order)} className="bg-[#D4AF37] hover:bg-[#C19B2E]">
                    Collect Payment
                </Button>
            )
        }
    ];

    const stats = {
        totalPending: orders.reduce((sum, o) => sum + (o.pending_amount || 0), 0),
        ordersWithPending: orders.length,
    };

    return (
        <div className="space-y-8 pb-12">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="font-serif text-4xl font-semibold text-[#1A1A1A]">
                        Pending Payments
                    </h1>
                    <p className="text-[#6B6B6B] mt-2">
                        Central control for all outstanding balances and payment requests
                    </p>
                </div>
                <ExportButton data={orders} filename="pending-payments-export" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="border-l-4 border-l-[#C77D2E]">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-[#6B6B6B] uppercase tracking-wider">
                            Total Outstanding Balance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-orange-50 rounded-full">
                                <DollarSign className="h-6 w-6 text-[#C77D2E]" />
                            </div>
                            <span className="text-3xl font-bold text-[#C77D2E]">
                                {formatCurrency(stats.totalPending)}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-[#D4AF37]">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-[#6B6B6B] uppercase tracking-wider">
                            Pending Orders Count
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-yellow-50 rounded-full">
                                <CreditCard className="h-6 w-6 text-[#D4AF37]" />
                            </div>
                            <span className="text-3xl font-bold text-[#1A1A1A]">
                                {stats.ordersWithPending}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2 lg:col-span-1 border-l-4 border-l-[#2D5F3F]">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-[#6B6B6B] uppercase tracking-wider">
                            System Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-50 rounded-full">
                                <AlertCircle className="h-6 w-6 text-[#2D5F3F]" />
                            </div>
                            <span className="text-lg font-medium text-[#2D5F3F]">
                                All Systems Operable
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Payment Requests Section */}
            <div className="space-y-4">
                <h2 className="font-serif text-2xl font-semibold flex items-center gap-2">
                    <Clock className="h-6 w-6 text-[#C77D2E]" />
                    Payment Requests (Action Required)
                </h2>
                <PaymentRequestManagement />
            </div>

            {/* Outstanding Orders */}
            <Card>
                <CardHeader className="border-b bg-[#FDFCF9]">
                    <CardTitle className="font-serif text-2xl">Ledger - All Pending Orders</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="text-center py-20 text-[#6B6B6B] flex flex-col items-center gap-2">
                            <div className="h-8 w-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
                            Loading Consolidated Ledger...
                        </div>
                    ) : (
                        <DataTable
                            data={orders}
                            columns={orderColumns}
                            searchable
                            searchPlaceholder="Search by order #, shop name..."
                        />
                    )}
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
