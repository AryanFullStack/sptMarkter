"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, Column } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/utils/export-utils";
import { updateOrderStatus } from "@/app/admin/actions";
import { PaymentRecordModal } from "@/components/admin/payment-record-modal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Eye } from "lucide-react";
import { loadSubAdminOrdersAction } from "@/app/admin/actions";

export default function SubAdminOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        loadOrders();
    }, []);

    async function loadOrders() {
        try {
            const data = await loadSubAdminOrdersAction();
            setOrders(data || []);
        } catch (error) {
            console.error("Error loading orders:", error);
        }
        setLoading(false);
    }

    const handleUpdateStatus = async (orderId: string, status: string) => {
        try {
            await updateOrderStatus(orderId, status);
            loadOrders();
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const columns: Column<any>[] = [
        {
            key: "order_number",
            header: "Order",
            render: (o) => <span className="font-mono">#{o.order_number}</span>,
        },
        {
            key: "user",
            header: "Customer",
            render: (o) => o.user?.full_name || "N/A",
        },
        {
            key: "role",
            header: "Role",
            render: (o) => (
                <Badge variant="outline" className="capitalize">
                    {o.user?.role?.replace("_", " ") || "N/A"}
                </Badge>
            ),
        },
        {
            key: "total_amount",
            header: "Amount",
            render: (o) => formatCurrency(o.total_amount),
        },
        {
            key: "status",
            header: "Status",
            render: (o) => <Badge>{o.status}</Badge>,
        },
        {
            key: "created_at",
            header: "Date",
            render: (o) => formatDate(o.created_at),
        },
        {
            key: "actions",
            header: "Actions",
            render: (o) => (
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                            setSelectedOrder(o);
                            setIsDetailOpen(true);
                        }}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(o.id, "processing")}
                    >
                        Process
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => {
                            setSelectedOrder(o);
                            setShowPaymentModal(true);
                        }}
                    >
                        Record Payment
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <h1 className="font-serif text-4xl font-semibold text-[#1A1A1A]">
                My Orders
            </h1>

            <Card>
                <CardContent className="pt-6">
                    {loading ? (
                        <div className="text-center py-12 text-[#6B6B6B]">Loading...</div>
                    ) : (
                        <DataTable
                            data={orders}
                            columns={columns}
                            searchable
                            searchPlaceholder="Search orders..."
                        />
                    )}
                </CardContent>
            </Card>

            {showPaymentModal && selectedOrder && (
                <PaymentRecordModal
                    order={selectedOrder}
                    onClose={() => {
                        setShowPaymentModal(false);
                        setSelectedOrder(null);
                    }}
                    onSuccess={() => {
                        setShowPaymentModal(false);
                        setSelectedOrder(null);
                        loadOrders();
                    }}
                />
            )}

            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-2xl">Order Details</DialogTitle>
                    </DialogHeader>
                    {selectedOrder && (
                        <div className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Order Number</Label>
                                    <p className="font-mono text-lg">{selectedOrder.order_number}</p>
                                </div>
                                <div>
                                    <Label>Status</Label>
                                    <Badge>{selectedOrder.status}</Badge>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div>
                                <Label className="mb-2 block">Order Items</Label>
                                <div className="space-y-3 border rounded-lg p-3 bg-gray-50 max-h-48 overflow-y-auto">
                                    {selectedOrder.items?.map((item: any) => (
                                        <div key={item.id} className="flex justify-between items-start text-sm">
                                            <div className="flex gap-2">
                                                <span className="font-semibold w-6 text-center">{item.quantity}x</span>
                                                <span className="text-gray-700">{item.product?.name || "Unknown Product"}</span>
                                            </div>
                                            <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
