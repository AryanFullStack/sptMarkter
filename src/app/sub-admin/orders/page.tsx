"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DataTable, Column } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/utils/export-utils";
import { updateOrderStatus } from "@/app/admin/actions";
import { PaymentRecordModal } from "@/components/admin/payment-record-modal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Eye, Truck, Package, Clock, ShoppingCart, User, CreditCard, ChevronRight, Activity, FileText } from "lucide-react";
import { loadSubAdminOrdersAction } from "@/app/admin/actions";
import { cn } from "@/lib/utils";
import { OrderInvoice } from "@/components/shared/order-invoice";

export default function SubAdminOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        loadOrders();
    }, []);

    async function loadOrders() {
        setLoading(true);
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
            header: "Dispatch Ref",
            render: (o) => (
                <div className="flex flex-col">
                    <span className="font-mono font-bold text-[#1A1A1A]">#{o.order_number}</span>
                    <span className="text-[10px] text-[#6B6B6B] flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" /> {formatDate(o.created_at)}
                    </span>
                </div>
            ),
        },
        {
            key: "user",
            header: "Market Participant",
            render: (o) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-[#1A1A1A]">{o.user?.full_name || "Nexus Client"}</span>
                    <div className="flex gap-1.5 mt-1">
                        <Badge variant="outline" className="text-[9px] h-4 border-[#E8E8E8] bg-[#FDFCF9] capitalize px-1.5 font-bold">
                            {o.user?.role?.replace("_", " ") || "Member"}
                        </Badge>
                    </div>
                </div>
            ),
        },
        {
            key: "total_amount",
            header: "Commitment",
            render: (o) => (
                <div className="flex flex-col">
                    <span className="font-bold text-[#1A1A1A]">Rs. {Number(o.total_amount).toLocaleString()}</span>
                    {o.pending_amount > 0 && (
                        <span className="text-[10px] text-red-500 font-bold">Pending: Rs. {Number(o.pending_amount).toLocaleString()}</span>
                    )}
                </div>
            ),
        },
        {
            key: "status",
            header: "Execution Status",
            render: (o) => (
                <Badge className={cn(
                    "px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
                    o.status === 'delivered' ? "bg-green-50 text-green-700 border-green-200" :
                        o.status === 'processing' ? "bg-amber-50 text-amber-700 border-amber-200" :
                            o.status === 'shipped' ? "bg-blue-50 text-blue-700 border-blue-200" :
                                "bg-gray-50 text-gray-700 border-gray-200"
                )}>
                    {o.status}
                </Badge>
            ),
        },
        {
            key: "actions",
            header: "Management",
            render: (o) => (
                <div className="flex gap-2">
                    <Button
                        size="icon"
                        variant="ghost"
                        className="hover:bg-[#FDFCF9] hover:text-[#2D5F3F]"
                        onClick={() => {
                            setSelectedOrder(o);
                            setIsDetailOpen(true);
                        }}
                    >
                        <Eye className="h-5 w-5" />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="hover:bg-[#FDFCF9] hover:text-blue-600"
                        onClick={() => {
                            setSelectedOrder(o);
                            setIsInvoiceOpen(true);
                        }}
                    >
                        <FileText className="h-5 w-5" />
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className="border-[#2D5F3F] text-[#2D5F3F] hover:bg-[#2D5F3F] hover:text-white"
                        onClick={() => handleUpdateStatus(o.id, "processing")}
                        disabled={o.status === 'processing' || o.status === 'delivered'}
                    >
                        Dispatch
                    </Button>
                    <Button
                        size="sm"
                        className="bg-[#1A1A1A] hover:bg-[#333333] text-white"
                        onClick={() => {
                            setSelectedOrder(o);
                            setShowPaymentModal(true);
                        }}
                    >
                        Collect
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-10">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[#E8E8E8] pb-8">
                <div>
                    <h1 className="font-serif text-4xl font-bold text-[#1A1A1A] tracking-tight">Dispatch Center</h1>
                    <p className="text-[#6B6B6B] mt-1 text-lg flex items-center gap-2">
                        <Truck className="h-5 w-5 text-[#2D5F3F]" />
                        Operational logistics and fulfillment tracking
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="flex flex-col items-end">
                        <p className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-widest">Active Queue</p>
                        <p className="text-2xl font-bold text-[#1A1A1A]">{orders?.length || 0}</p>
                    </div>
                </div>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-[#F7F5F2]/50 border-b border-[#E8E8E8] px-8 py-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="font-serif text-2xl">Order Registry</CardTitle>
                            <CardDescription>Comprehensive list of assigned market transactions</CardDescription>
                        </div>
                        <Activity className="h-8 w-8 text-[#2D5F3F] opacity-20" />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="p-4 lg:p-8">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-24 gap-4">
                                <div className="w-12 h-12 border-4 border-[#FDFCF9] border-t-[#2D5F3F] rounded-full animate-spin" />
                                <p className="text-[#6B6B6B] font-medium italic">Syncing Logistics...</p>
                            </div>
                        ) : (
                            <DataTable
                                data={orders}
                                columns={columns}
                                searchable
                                searchPlaceholder="Track order ref or customer..."
                                className="border-none"
                            />
                        )}
                    </div>
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
                <DialogContent className="max-w-3xl overflow-hidden border-none shadow-2xl p-0">
                    <div className="bg-[#1A1A1A] p-8 text-white">
                        <DialogHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <Badge className="bg-[#2D5F3F] mb-4">Official Dispatch Record</Badge>
                                    <DialogTitle className="font-serif text-3xl font-bold">#{selectedOrder?.order_number}</DialogTitle>
                                    <DialogDescription className="text-gray-400 mt-2 font-mono uppercase tracking-widest text-[10px]">
                                        Timestamp: {selectedOrder && formatDate(selectedOrder.created_at, true)}
                                    </DialogDescription>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1 font-bold">Status</p>
                                    <Badge className="capitalize text-lg px-4 py-1 bg-white text-black hover:bg-white">{selectedOrder?.status}</Badge>
                                </div>
                            </div>
                        </DialogHeader>
                    </div>

                    {selectedOrder && (
                        <div className="p-8 space-y-8 bg-white">
                            <div className="grid md:grid-cols-2 gap-12">
                                <div className="space-y-6">
                                    <div>
                                        <Label className="text-[10px] uppercase tracking-widest font-bold text-[#6B6B6B] mb-2 block">Client Details</Label>
                                        <div className="flex items-center gap-3 p-4 bg-[#FDFCF9] rounded-xl border border-[#F7F5F2]">
                                            <div className="w-12 h-12 bg-[#2D5F3F]/10 rounded-full flex items-center justify-center">
                                                <User className="h-6 w-6 text-[#2D5F3F]" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-[#1A1A1A] text-lg">{selectedOrder.user?.full_name}</p>
                                                <p className="text-sm text-[#6B6B6B]">{selectedOrder.user?.email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-[10px] uppercase tracking-widest font-bold text-[#6B6B6B] mb-2 block">Logistics Summary</Label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-[#FDFCF9] rounded-xl border border-[#F7F5F2]">
                                                <p className="text-xs text-[#6B6B6B] mb-1">Items</p>
                                                <p className="text-xl font-bold text-[#1A1A1A]">{selectedOrder.items?.length || 0}</p>
                                            </div>
                                            <div className="p-4 bg-[#FDFCF9] rounded-xl border border-[#F7F5F2]">
                                                <p className="text-xs text-[#6B6B6B] mb-1">Payments</p>
                                                <p className="text-xl font-bold text-[#2D5F3F]">{selectedOrder.payment_status}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <Label className="text-[10px] uppercase tracking-widest font-bold text-[#6B6B6B] mb-3 block">Manifest</Label>
                                        <div className="space-y-3 max-h-64 overflow-y-auto pr-2 scrollbar-hide">
                                            {selectedOrder.items?.map((item: any) => (
                                                <div key={item.id} className="flex justify-between items-center py-2 border-b border-[#F7F5F2] last:border-0">
                                                    <div className="flex gap-4 items-center">
                                                        <span className="font-mono text-xs bg-[#F7F5F2] w-8 h-8 flex items-center justify-center rounded-lg font-bold">{item.quantity}x</span>
                                                        <span className="text-sm font-medium text-[#1A1A1A]">{item.product?.name || "Premium Product"}</span>
                                                    </div>
                                                    <span className="font-bold text-sm">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="pt-6 border-t border-[#E8E8E8]">
                                        <div className="flex justify-between items-end">
                                            <p className="text-lg font-serif">Total Commitment</p>
                                            <p className="text-3xl font-bold text-[#1A1A1A]">Rs. {Number(selectedOrder.total_amount).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <Button variant="outline" className="h-12 px-8 border-[#E8E8E8]" onClick={() => setIsDetailOpen(false)}>Close Registry</Button>
                                <Button className="h-12 px-8 bg-[#1A1A1A] hover:bg-[#333333] text-white" onClick={() => {
                                    setIsDetailOpen(false);
                                    setShowPaymentModal(true);
                                }}>Finalize Collection</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            <Dialog open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none">
                    <OrderInvoice
                        order={selectedOrder}
                        onClose={() => setIsInvoiceOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}

