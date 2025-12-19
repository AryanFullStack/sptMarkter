"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/supabase/client";
import { DollarSign, ShoppingBag, Clock, Tag, Users, PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ProfileForm } from "@/components/dashboards/profile-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSalesmanDashboardData } from "@/app/actions/salesman-actions";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSalesmanOrderHistory, getOrderDetails } from "@/app/actions/salesman-actions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Eye } from "lucide-react";
import { PaymentRequestManagement } from "../shared/payment-request-management";

export default function SalesmanDashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [orderModalOpen, setOrderModalOpen] = useState(false);
    const [orderHistory, setOrderHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const supabase = createClient();
    const { toast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                const { data: profile } = await supabase
                    .from("users")
                    .select("*")
                    .eq("id", user.id)
                    .single();

                if (profile) {
                    setUser({ ...user, ...profile });
                }

                const dashboardData = await getSalesmanDashboardData(user.id);
                setData(dashboardData);
            }
        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "Failed to load dashboard data", variant: "destructive" });
        }
        setLoading(false);
    }

    async function loadHistory() {
        if (!user) return;
        setHistoryLoading(true);
        try {
            const res = await getSalesmanOrderHistory(user.id);
            if (res.orders) setOrderHistory(res.orders);
        } catch (e) {
            console.error(e);
        }
        setHistoryLoading(false);
    }

    async function handleViewDetails(orderId: string) {
        try {
            const res = await getOrderDetails(orderId);
            if (res.order) {
                setSelectedOrder(res.order);
                setOrderModalOpen(true);
            }
        } catch (e) {
            toast({ title: "Error", description: "Failed to load order details" });
        }
    }

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="space-y-4 animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4" />
                    <div className="grid grid-cols-3 gap-4">
                        <div className="h-24 bg-gray-200 rounded" />
                        <div className="h-24 bg-gray-200 rounded" />
                        <div className="h-24 bg-gray-200 rounded" />
                    </div>
                    <div className="h-64 bg-gray-200 rounded" />
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { stats, brands, recentOrders, brandPending, shopLedgers } = data;

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="font-serif text-3xl font-semibold text-[#1A1A1A]">Salesman Dashboard</h1>
                    <p className="text-[#6B6B6B]">Manage your clients and orders</p>
                </div>
                <Link href="/salesman/shops">
                    <Button className="bg-[#D4AF37] hover:bg-[#C19B2E] text-white gap-2">
                        <PlusCircle className="h-4 w-4" /> Find Shop & Create Order
                    </Button>
                </Link>
            </div>

            <Tabs defaultValue="overview" className="space-y-6" onValueChange={(val) => {
                if (val === 'history') loadHistory();
            }}>
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="ledgers">My Ledgers</TabsTrigger>
                    <TabsTrigger value="brands">My Brands</TabsTrigger>
                    <TabsTrigger value="history">Order History</TabsTrigger>
                    <TabsTrigger value="requests">Payment Requests</TabsTrigger>
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-[#6B6B6B]">Orders Today</CardTitle>
                                <ShoppingBag className="h-4 w-4 text-[#D4AF37]" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-[#1A1A1A]">{stats?.ordersToday || 0}</div>
                                <p className="text-xs text-[#6B6B6B] mt-1">Orders created today</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-[#6B6B6B]">Total Collection</CardTitle>
                                <DollarSign className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">
                                    ₹{Number(stats?.totalCollection || 0).toLocaleString()}
                                </div>
                                <p className="text-xs text-[#6B6B6B] mt-1">Cash collected from orders</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-[#6B6B6B]">Total Pending</CardTitle>
                                <Clock className="h-4 w-4 text-[#8B3A3A]" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-[#8B3A3A]">
                                    ₹{Number(stats?.totalPending || 0).toLocaleString()}
                                </div>
                                <p className="text-xs text-[#6B6B6B] mt-1">Outstanding collections</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-[#6B6B6B]">Clients Served</CardTitle>
                                <Users className="h-4 w-4 text-[#D4AF37]" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-[#1A1A1A]">{stats?.clientsServed || 0}</div>
                                <p className="text-xs text-[#6B6B6B] mt-1">Unique shops served</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Pending by Brand Section */}
                    <div>
                        <h2 className="font-serif text-xl font-semibold mb-4 text-[#1A1A1A]">Pending by Brand</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {brandPending?.map((bp: any) => (
                                <Card key={bp.id} className="bg-white border-l-4 border-l-[#D4AF37]">
                                    <CardContent className="p-4">
                                        <p className="text-xs font-medium text-[#6B6B6B] uppercase">{bp.name}</p>
                                        <p className="text-xl font-bold text-[#1A1A1A] mt-1">₹{Number(bp.amount).toLocaleString()}</p>
                                    </CardContent>
                                </Card>
                            ))}
                            {(!brandPending || brandPending.length === 0) && (
                                <p className="text-sm text-[#6B6B6B]">No pending amounts recorded by brand.</p>
                            )}
                        </div>
                    </div>

                    {/* Recent Orders List */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-serif text-xl flex items-center gap-2">
                                <Clock className="h-5 w-5 text-[#2D5F3F]" />
                                Recent Orders
                            </CardTitle>
                            <CardDescription>Latest orders you created for clients</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!recentOrders || recentOrders.length === 0 ? (
                                <div className="text-center py-12 text-[#6B6B6B]">
                                    <p>No orders created yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {recentOrders.map((order: any) => (
                                        <div
                                            key={order.id}
                                            onClick={() => handleViewDetails(order.id)}
                                            className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
                                        >
                                            <div className="mb-2 sm:mb-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-semibold text-[#1A1A1A] group-hover:text-[#D4AF37]">
                                                        #{order.order_number || order.id.slice(0, 8)}
                                                    </span>
                                                    <Badge variant={order.status === "delivered" || order.status === "completed" ? "default" : "secondary"} className="text-[10px]">
                                                        {order.status?.toUpperCase()}
                                                    </Badge>
                                                    <Badge variant={order.payment_status === "paid" ? "outline" : "destructive"} className="text-[10px]">
                                                        {order.payment_status?.toUpperCase()}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-[#6B6B6B] mt-1">
                                                    For: <span className="font-medium text-[#1A1A1A]">{order.user?.full_name || "Unknown Client"}</span>
                                                </p>
                                                <p className="text-xs text-[#8C8C8C]">
                                                    {new Date(order.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="text-right flex items-center gap-4">
                                                <div>
                                                    <p className="font-bold text-lg">₹{Number(order.total_amount).toLocaleString()}</p>
                                                    <p className="text-xs text-red-600 font-medium">Pending: ₹{Number(order.pending_amount).toLocaleString()}</p>
                                                </div>
                                                <Eye className="h-4 w-4 text-gray-300 group-hover:text-[#D4AF37]" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="ledgers" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-serif text-xl flex items-center gap-2">
                                <Users className="h-5 w-5 text-[#2D5F3F]" /> Shop Ledgers
                            </CardTitle>
                            <CardDescription>Overview of pending amounts for each shop under your brands</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Shop Name</TableHead>
                                            <TableHead className="text-right">Total Pending</TableHead>
                                            <TableHead className="text-right">Last Order</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {shopLedgers?.map((sl: any) => (
                                            <TableRow key={sl.id}>
                                                <TableCell className="font-medium">{sl.name}</TableCell>
                                                <TableCell className="text-right text-red-600 font-bold">₹{Number(sl.pending).toLocaleString()}</TableCell>
                                                <TableCell className="text-right text-xs text-[#6B6B6B]">{new Date(sl.last_updated).toLocaleDateString()}</TableCell>
                                                <TableCell className="text-right">
                                                    <Link href={`/salesman/shop/${sl.id}`}>
                                                        <Button variant="ghost" size="sm" className="text-[#D4AF37]">View Ledger</Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {(!shopLedgers || shopLedgers.length === 0) && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-8 text-[#6B6B6B]">No shop ledgers found.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="brands">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-serif text-xl flex items-center gap-2">
                                <Tag className="h-5 w-5 text-[#D4AF37]" /> Assigned Brands
                            </CardTitle>
                            <CardDescription>Brands you are authorized to sell</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!brands || brands.length === 0 ? (
                                <p className="text-center py-8 text-[#6B6B6B]">No brands assigned to you yet.</p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {brands.map((b: any) => (
                                        <div key={b.id} className="flex items-center gap-4 p-4 border rounded-lg">
                                            {b.brands?.logo_url ? (
                                                <img src={b.brands.logo_url} alt={b.brands.name} className="w-12 h-12 object-contain" />
                                            ) : (
                                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                                    <Tag className="h-6 w-6 text-gray-400" />
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="font-semibold text-[#1A1A1A]">{b.brands?.name}</h3>
                                                <Badge variant="secondary" className="text-xs mt-1">Active</Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-serif text-xl">Full Order History</CardTitle>
                            <CardDescription>All orders you have created in the system</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {historyLoading ? (
                                <div className="text-center py-12"><Clock className="animate-spin mx-auto mb-2" /> Loading History...</div>
                            ) : (
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
                                            <div className="text-right">
                                                <p className="font-bold">₹{Number(order.total_amount).toLocaleString()}</p>
                                                <Badge variant={order.payment_status === "paid" ? "default" : "destructive"} className="text-[10px]">
                                                    {order.payment_status?.toUpperCase()}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                    {orderHistory.length === 0 && <p className="text-center py-8 text-muted-foreground">No history found.</p>}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="requests">
                    <PaymentRequestManagement salesmanId={user?.id} />
                </TabsContent>

                <TabsContent value="profile">
                    <div className="max-w-2xl">
                        {user && (
                            <ProfileForm
                                user={user}
                                initialData={{
                                    full_name: user?.full_name || "",
                                    email: user?.email || "",
                                    phone: user?.phone || "",
                                    role: user?.role || "salesman",
                                }}
                            />
                        )}
                    </div>
                </TabsContent>
            </Tabs>

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
                                                        <TableCell className="text-right">₹{item.price}</TableCell>
                                                        <TableCell className="text-right font-bold">₹{item.total}</TableCell>
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
                                                <span className="font-bold">₹{Number(selectedOrder.total_amount).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-green-600">
                                                <span>Total Paid:</span>
                                                <span className="font-bold">₹{Number(selectedOrder.paid_amount).toLocaleString()}</span>
                                            </div>
                                            <Separator className="my-2" />
                                            <div className="flex justify-between text-lg text-red-600 font-bold">
                                                <span>Remaining:</span>
                                                <span>₹{Number(selectedOrder.pending_amount).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </section>

                                    <section>
                                        <h3 className="font-semibold mb-2">Payment History</h3>
                                        <div className="space-y-2 max-h-40 overflow-y-auto border p-4 rounded-lg bg-gray-50/50">
                                            {selectedOrder.payments?.map((p: any) => (
                                                <div key={p.id} className="text-xs flex justify-between border-b pb-1 last:border-0">
                                                    <span>{new Date(p.created_at).toLocaleDateString()}</span>
                                                    <span className="font-bold text-green-600">₹{p.amount}</span>
                                                    <span className="text-[#6B6B6B] italic">{p.payment_method}</span>
                                                </div>
                                            ))}
                                            {(!selectedOrder.payments || selectedOrder.payments.length === 0) && (
                                                <p className="text-xs text-center py-4 text-[#6B6B6B]">No payment records found.</p>
                                            )}
                                        </div>
                                    </section>
                                </div>
                                {selectedOrder.notes && (
                                    <section>
                                        <p className="text-xs font-semibold text-[#6B6B6B] uppercase mb-1">Notes</p>
                                        <p className="text-sm border p-3 rounded bg-yellow-50/30">{selectedOrder.notes}</p>
                                    </section>
                                )}
                            </div>
                        </ScrollArea>
                    )}
                </DialogContent>
            </Dialog>
        </div >
    );
}
