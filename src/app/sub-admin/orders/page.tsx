"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Eye, DollarSign, FileText, Truck } from "lucide-react";
import { loadSubAdminOrdersAction, updateOrderStatus as updateOrderStatusAction } from "@/app/admin/actions";
import { useToast } from "@/hooks/use-toast";
import { OrderInvoice } from "@/components/shared/order-invoice";
import { PaymentRecordModal } from "@/components/admin/payment-record-modal";

export default function SubAdminOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [statusToUpdate, setStatusToUpdate] = useState("");
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

    const supabase = createClient();
    const { toast } = useToast();

    useEffect(() => {
        loadOrders();
    }, []);

    useEffect(() => {
        filterOrders();
    }, [searchTerm, statusFilter, orders]);

    async function loadOrders() {
        try {
            const data = await loadSubAdminOrdersAction();
            setOrders(data || []);
            setFilteredOrders(data || []);
        } catch (error) {
            console.error("Failed to load orders:", error);
        }
        setLoading(false);
    }

    function filterOrders() {
        let filtered = orders;

        if (searchTerm) {
            filtered = filtered.filter(order => {
                const user = Array.isArray(order.users) ? order.users[0] : order.users;
                return (
                    order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
                );
            });
        }

        if (statusFilter !== "all") {
            filtered = filtered.filter(order => order.status === statusFilter);
        }

        setFilteredOrders(filtered);
    }

    async function updateOrderStatus(orderId: string, newStatus: string) {
        if (!newStatus) return;
        try {
            await updateOrderStatusAction(orderId, newStatus);

            const updated = orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
            setOrders(updated);
            setFilteredOrders((prev: any[]) => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

            if (selectedOrder?.id === orderId) {
                setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }));
            }
            toast({ title: "Status Updated", description: `Order status changed to ${newStatus}` });
        } catch (error) {
            console.error("Update failed", error);
            toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "delivered": return "bg-[#2D5F3F] text-white";
            case "shipped": return "bg-[#C77D2E] text-white";
            case "processing": return "bg-[#D4AF37] text-white";
            case "cancelled": return "bg-[#8B3A3A] text-white";
            default: return "bg-[#6B6B6B] text-white";
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-12 h-12 border-4 border-[#FDFCF9] border-t-[#2D5F3F] rounded-full animate-spin" />
                <p className="text-[#6B6B6B] font-medium italic">Syncing Logistics...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
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
                        <p className="text-2xl font-bold text-[#1A1A1A]">{filteredOrders?.length || 0}</p>
                    </div>
                </div>
            </div>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="font-serif text-2xl">Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-[#6B6B6B]" />
                            <Input
                                placeholder="Search by order number or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="processing">Processing</SelectItem>
                                <SelectItem value="shipped">Shipped</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-serif text-2xl">All Orders ({filteredOrders.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order #</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Paid</TableHead>
                                    <TableHead>Pending</TableHead>
                                    <TableHead>Created By</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOrders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-mono">#{order.order_number}</TableCell>
                                        <TableCell>
                                            {(() => {
                                                const user = Array.isArray(order.users) ? order.users[0] : order.users;
                                                return (
                                                    <div>
                                                        <p className="font-medium text-[#1A1A1A]">{user?.full_name || "N/A"}</p>
                                                        <p className="text-sm text-[#6B6B6B]">{user?.email}</p>
                                                    </div>
                                                );
                                            })()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize text-[10px] font-bold">
                                                {(Array.isArray(order.users) ? order.users[0] : order.users)?.role?.replace("_", " ") || "N/A"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm">{new Date(order.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="font-bold">Rs. {Number(order.total_amount).toLocaleString()}</TableCell>
                                        <TableCell className="text-[#2D5F3F] font-medium">Rs. {Number(order.paid_amount || 0).toLocaleString()}</TableCell>
                                        <TableCell className="text-[#C77D2E] font-bold">
                                            Rs. {(Number(order.pending_amount) || 0).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            {order.recorded_by_user ? (
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{order.recorded_by_user.full_name}</span>
                                                    <Badge variant="outline" className="text-[10px] w-fit capitalize bg-blue-50 text-blue-700 border-blue-100">
                                                        {order.recorded_by_user.role?.replace("_", " ")}
                                                    </Badge>
                                                </div>
                                            ) : (
                                                <Badge variant="outline" className="text-[10px] capitalize bg-gray-50 text-gray-600 border-gray-100">
                                                    Customer
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => {
                                                        setSelectedOrder(order);
                                                        setStatusToUpdate(order.status);
                                                        setIsDetailOpen(true);
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 w-8 p-0 text-blue-600 border-blue-200 hover:bg-blue-50"
                                                    onClick={() => {
                                                        setSelectedOrder(order);
                                                        setIsInvoiceOpen(true);
                                                    }}
                                                >
                                                    <FileText className="h-4 w-4" />
                                                </Button>
                                                {order.pending_amount > 0 && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 px-2 text-[#1A1A1A] border-[#E8E8E8] hover:bg-[#dbb12c]"
                                                        onClick={() => {
                                                            setSelectedOrder(order);
                                                            setIsPaymentOpen(true);
                                                        }}
                                                    >
                                                        Collect
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-2xl">Order Details</DialogTitle>
                    </DialogHeader>
                    {selectedOrder && (
                        <div className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-[10px] uppercase tracking-widest font-bold text-[#6B6B6B] mb-1 block">Order Number</Label>
                                    <p className="font-mono text-lg font-bold">#{selectedOrder.order_number}</p>
                                </div>

                                <div>
                                    <Label className="text-[10px] uppercase tracking-widest font-bold text-[#6B6B6B] mb-2 block">Status Update</Label>
                                    <div className="flex gap-2">
                                        <Select
                                            value={statusToUpdate}
                                            onValueChange={setStatusToUpdate}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="processing">Processing</SelectItem>
                                                <SelectItem value="shipped">Shipped</SelectItem>
                                                <SelectItem value="delivered">Delivered</SelectItem>
                                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button onClick={() => updateOrderStatus(selectedOrder.id, statusToUpdate)}>
                                            Update
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-[10px] uppercase tracking-widest font-bold text-[#6B6B6B] mb-1 block">Customer</Label>
                                    {(() => {
                                        const user = Array.isArray(selectedOrder.users) ? selectedOrder.users[0] : selectedOrder.users;
                                        return (
                                            <>
                                                <p className="font-bold">{user?.full_name || "N/A"}</p>
                                                <p className="text-sm text-[#6B6B6B]">{user?.email}</p>
                                                <Badge variant="outline" className="mt-1 capitalize text-[10px]">{user?.role?.replace("_", " ")}</Badge>
                                            </>
                                        );
                                    })()}
                                </div>
                                <div>
                                    <Label className="text-[10px] uppercase tracking-widest font-bold text-[#6B6B6B] mb-1 block">Order Recorded By</Label>
                                    {selectedOrder.recorded_by_user ? (
                                        <div className="flex flex-col">
                                            <p className="font-medium text-[#1A1A1A]">{selectedOrder.recorded_by_user.full_name}</p>
                                            <Badge variant="secondary" className="w-fit capitalize bg-blue-50 text-blue-700 border-blue-100 text-[10px]">
                                                {selectedOrder.recorded_by_user.role?.replace("_", " ")}
                                            </Badge>
                                        </div>
                                    ) : (
                                        <Badge variant="outline" className="w-fit capitalize bg-green-50 text-green-700 border-green-100 text-[10px]">
                                            Direct Customer Order
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <div>
                                <Label className="text-[10px] uppercase tracking-widest font-bold text-[#6B6B6B] mb-1 block">Shipping Address</Label>
                                {selectedOrder.shipping_address && Object.keys(selectedOrder.shipping_address).length > 0 ? (
                                    <div className="text-sm p-3 bg-gray-50 rounded-lg border">
                                        {selectedOrder.shipping_address.address_line1 ? (
                                            <>
                                                <p className="font-medium">{selectedOrder.shipping_address.full_name}</p>
                                                <p>{selectedOrder.shipping_address.address_line1}</p>
                                                <p>{selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state}</p>
                                                <p className="text-[#6B6B6B] mt-1">{selectedOrder.shipping_address.phone}</p>
                                            </>
                                        ) : (
                                            <p className="text-gray-500 italic">Address data incomplete</p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 italic">No shipping address recorded</p>
                                )}
                            </div>

                            <div>
                                <Label className="text-[10px] uppercase tracking-widest font-bold text-[#6B6B6B] mb-2 block">Order Items</Label>
                                <div className="space-y-3 border rounded-lg p-3 bg-gray-50 max-h-48 overflow-y-auto">
                                    {(() => {
                                        const displayItems = (selectedOrder.order_items_data && selectedOrder.order_items_data.length > 0)
                                            ? selectedOrder.order_items_data
                                            : (selectedOrder.items || []);

                                        if (displayItems.length === 0) {
                                            return <p className="text-gray-500 italic">No items found.</p>;
                                        }
                                        return displayItems.map((item: any, idx: number) => {
                                            const name = item.product?.name || item.name || "Unknown Product";
                                            const price = item.price || 0;
                                            const qty = item.quantity || 1;
                                            return (
                                                <div key={item.id || idx} className="flex justify-between items-start text-sm pb-2 border-b last:border-0 border-gray-200">
                                                    <div className="flex gap-2">
                                                        <span className="font-bold w-8 bg-gray-200 rounded text-center">{qty}x</span>
                                                        <span className="text-gray-700">{name}</span>
                                                    </div>
                                                    <span className="font-bold">Rs. {(price * qty).toLocaleString()}</span>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-4 pt-4 border-t">
                                <div>
                                    <Label className="text-[10px] uppercase tracking-widest font-bold text-[#6B6B6B] mb-1 block">Total Amount</Label>
                                    <p className="text-lg font-bold">Rs. {Number(selectedOrder.total_amount).toLocaleString()}</p>
                                </div>
                                <div>
                                    <Label className="text-[10px] uppercase tracking-widest font-bold text-[#6B6B6B] mb-1 block">Paid Amount</Label>
                                    <p className="text-lg font-bold text-[#2D5F3F]">Rs. {Number(selectedOrder.paid_amount || 0).toLocaleString()}</p>
                                </div>
                                <div>
                                    <Label className="text-[10px] uppercase tracking-widest font-bold text-[#6B6B6B] mb-1 block">Pending Amount</Label>
                                    <p className="text-lg font-bold text-[#C77D2E]">
                                        Rs. {(Number(selectedOrder.total_amount) - Number(selectedOrder.paid_amount || 0)).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Close</Button>
                        {selectedOrder?.pending_amount > 0 && (
                            <Button className="bg-[#1A1A1A] hover:bg-[#333333] text-white" onClick={() => {
                                setIsDetailOpen(false);
                                setIsPaymentOpen(true);
                            }}>Record Payment</Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {isPaymentOpen && selectedOrder && (
                <PaymentRecordModal
                    order={selectedOrder}
                    onClose={() => {
                        setIsPaymentOpen(false);
                        setSelectedOrder(null);
                    }}
                    onSuccess={() => {
                        setIsPaymentOpen(false);
                        setSelectedOrder(null);
                        loadOrders();
                    }}
                />
            )}

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
