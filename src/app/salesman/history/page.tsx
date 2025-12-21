"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/supabase/client";
import { getSalesmanOrderHistory, getOrderDetails } from "@/app/actions/salesman-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Eye, Loader2 } from "lucide-react";
import { notify } from "@/lib/notifications";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function OrderHistoryPage() {
    const [orderHistory, setOrderHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [orderModalOpen, setOrderModalOpen] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const res = await getSalesmanOrderHistory(user.id);
            if (res.orders) setOrderHistory(res.orders);
        }
        setLoading(false);
    }

    async function handleViewDetails(orderId: string) {
        try {
            const res = await getOrderDetails(orderId);
            if (res.order) {
                setSelectedOrder(res.order);
                setOrderModalOpen(true);
            }
        } catch (e) {
            notify.error("Error", "Failed to load order details");
        }
    }

    if (loading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-serif text-3xl font-bold text-[#1A1A1A]">Order History</h1>
                <p className="text-[#6B6B6B]">All orders you have created in the system</p>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <div className="space-y-4">
                        {orderHistory.map((order: any) => (
                            <div
                                key={order.id}
                                onClick={() => handleViewDetails(order.id)}
                                className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
                            >
                                <div>
                                    <p className="font-mono font-bold group-hover:text-[#D4AF37]">#{order.order_number}</p>
                                    <p className="text-sm text-[#6B6B6B]">{order.user?.full_name}</p>
                                    <p className="text-xs text-[#8C8C8C]">{new Date(order.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="font-bold">Rs. {Number(order.total_amount).toLocaleString()}</p>
                                        {Number(order.pending_amount) > 0 && (
                                            <p className="text-xs text-red-500 font-semibold">Pending: Rs. {Number(order.pending_amount).toLocaleString()}</p>
                                        )}
                                        <Badge variant={order.payment_status === "paid" ? "default" : "destructive"} className="text-[10px]">
                                            {order.payment_status?.toUpperCase()}
                                        </Badge>
                                    </div>
                                    <Eye className="h-4 w-4 text-gray-300 group-hover:text-[#D4AF37]" />
                                </div>
                            </div>
                        ))}
                        {orderHistory.length === 0 && (
                            <div className="text-center py-12 text-[#6B6B6B]">
                                <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p>No orders found.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Order Details Modal */}
            <Dialog open={orderModalOpen} onOpenChange={setOrderModalOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-2xl">Order Details</DialogTitle>
                        <DialogDescription>
                            Order #{selectedOrder?.order_number} • {new Date(selectedOrder?.created_at).toLocaleDateString()}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedOrder && (
                        <ScrollArea className="pr-4">
                            <div className="space-y-6">
                                <section className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                                    <div>
                                        <p className="text-xs uppercase text-[#6B6B6B] font-semibold">Client Details</p>
                                        <p className="font-bold">{selectedOrder.user?.full_name}</p>
                                        <p className="text-sm text-[#6B6B6B]">{selectedOrder.user?.phone || 'No Phone'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs uppercase text-[#6B6B6B] font-semibold">Status</p>
                                        <div className="flex justify-end gap-2 mt-1">
                                            <Badge variant="default">{selectedOrder.status?.toUpperCase()}</Badge>
                                            <Badge variant={selectedOrder.payment_status === 'paid' ? 'default' : 'destructive'}>
                                                {selectedOrder.payment_status?.toUpperCase()}
                                            </Badge>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="font-semibold mb-2">Order Items</h3>
                                    <div className="border rounded-lg overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Product</TableHead>
                                                    <TableHead className="text-center">Qty</TableHead>
                                                    <TableHead className="text-right">Price</TableHead>
                                                    <TableHead className="text-right">Total</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedOrder.items?.map((item: any, i: number) => (
                                                    <TableRow key={i}>
                                                        <TableCell className="font-medium">{item.name}</TableCell>
                                                        <TableCell className="text-center">{item.quantity}</TableCell>
                                                        <TableCell className="text-right">Rs. {item.price}</TableCell>
                                                        <TableCell className="text-right font-bold">Rs. {item.total}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </section>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <section>
                                        <h3 className="font-semibold mb-2">Financial Summary</h3>
                                        <div className="space-y-1 text-sm border p-4 rounded-lg bg-gray-50/50">
                                            <div className="flex justify-between">
                                                <span>Total Bill:</span>
                                                <span className="font-bold">Rs. {Number(selectedOrder.total_amount).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-green-600">
                                                <span>Total Paid:</span>
                                                <span className="font-bold">Rs. {Number(selectedOrder.paid_amount).toLocaleString()}</span>
                                            </div>
                                            <Separator className="my-2" />
                                            <div className="flex justify-between text-lg text-red-600 font-bold">
                                                <span>Remaining:</span>
                                                <span>Rs. {Number(selectedOrder.pending_amount).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </section>

                                    <section>
                                        <h3 className="font-semibold mb-2">Payment History</h3>
                                        <div className="space-y-2 max-h-40 overflow-y-auto border p-4 rounded-lg bg-gray-50/50">
                                            {selectedOrder.payments?.map((p: any) => (
                                                <div key={p.id} className="text-xs flex justify-between border-b pb-1 last:border-0">
                                                    <span>{new Date(p.created_at).toLocaleDateString()}</span>
                                                    <span className="font-bold text-green-600">Rs. {p.amount}</span>
                                                    <span className="text-[#6B6B6B] italic">{p.payment_method}</span>
                                                </div>
                                            ))}
                                            {(!selectedOrder.payments || selectedOrder.payments.length === 0) && (
                                                <p className="text-xs text-center py-4 text-[#6B6B6B]">No payment records found.</p>
                                            )}
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </ScrollArea>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
