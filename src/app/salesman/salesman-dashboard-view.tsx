"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/supabase/client";
import { DollarSign, ShoppingBag, Clock, Users, ArrowUpRight, TrendingUp, Search, ShoppingCart, MapPin, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { getOrderDetails, getSalesmanUnifiedDashboard } from "@/app/actions/salesman-actions";
import { notify } from "@/lib/notifications";
import { PaymentReminderAlert } from "@/components/shared/payment-reminder-alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { SalesmanActivityFeed } from "@/components/salesman/salesman-activity-feed";
import { useRouter } from "next/navigation";

interface SalesmanDashboardViewProps {
    initialData: any;
    userData: any;
}

export default function SalesmanDashboardView({ initialData, userData }: SalesmanDashboardViewProps) {
    const router = useRouter();
    const [data, setData] = useState<any>(initialData.dashboardData);
    const [todayRoute, setTodayRoute] = useState<any[]>(initialData.todayRoute);
    const [weeklySchedule, setWeeklySchedule] = useState<any[]>(initialData.weeklySchedule);
    const [upcomingPayments, setUpcomingPayments] = useState<any[]>(initialData.upcomingPayments);
    const [overduePayments, setOverduePayments] = useState<any[]>(initialData.overduePayments);
    const [paymentReminders, setPaymentReminders] = useState<any[]>(initialData.paymentReminders);

    // We can still use state for client-side updates if needed, but initial data comes from server
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [orderModalOpen, setOrderModalOpen] = useState(false);

    const supabase = createClient();

    // Rehydrate state if initialData changes (though in SC architecture, this is less common for full replacement)
    useEffect(() => {
        if (initialData) {
            setData(initialData.dashboardData);
            setTodayRoute(initialData.todayRoute);
            setWeeklySchedule(initialData.weeklySchedule);
            setUpcomingPayments(initialData.upcomingPayments);
            setOverduePayments(initialData.overduePayments);
            setPaymentReminders(initialData.paymentReminders);
        }
    }, [initialData]);

    const refreshData = async () => {
        // Option 1: Re-fetch server action (client-side fetch)
        // Option 2: Router refresh (server re-render)
        // Router refresh is often cleaner for "Server Component" architectures because it keeps data logic on server.
        router.refresh();

        // HOWEVER, since we have the Unified loader available and might want smoother updates without full page reload:
        const unified = await getSalesmanUnifiedDashboard(userData.id);
        if (unified) {
            setData(unified.dashboardData);
            setTodayRoute(unified.todayRoute);
            setWeeklySchedule(unified.weeklySchedule);
            setUpcomingPayments(unified.upcomingPayments);
            setOverduePayments(unified.overduePayments);
            setPaymentReminders(unified.paymentReminders);
        }
    };

    // Realtime Subscriptions
    useEffect(() => {
        if (!userData) return;

        const ordersChannel = supabase
            .channel('salesman-orders-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                    filter: `recorded_by=eq.${userData.id}`
                },
                () => {
                    refreshData();
                }
            )
            .subscribe();

        const paymentsChannel = supabase
            .channel('salesman-payments-realtime')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT', // New payment recorded
                    schema: 'public',
                    table: 'payments'
                },
                () => {
                    refreshData();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(ordersChannel);
            supabase.removeChannel(paymentsChannel);
        };
    }, [userData, supabase]); // removed refreshData dependency to avoid loops if unstable

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

    const { stats, brandPending, recentOrders, shopLedgers } = data;

    return (
        <div className="space-y-10 pb-12">
            {/* Payment Reminders Alert */}
            {paymentReminders.length > 0 && (
                <PaymentReminderAlert
                    reminders={paymentReminders}
                    onDismiss={() => refreshData()}
                />
            )}

            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="font-serif text-3xl font-bold text-[#1A1A1A]">Dashboard Overview</h1>
                    <p className="text-[#6B6B6B]">Welcome back! Here's your performance summary.</p>
                </div>
                <Link href="/salesman/shops">
                    <Button className="bg-[#D4AF37] hover:bg-[#C19B2E] text-white shadow-lg shadow-[#D4AF37]/20 px-6 h-11 transition-all hover:scale-105">
                        Create New Order
                    </Button>
                </Link>
            </div>

            {/* Payment Alerts Section */}
            {(upcomingPayments.length > 0 || overduePayments.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-4">
                    {overduePayments.length > 0 && (
                        <Card className="border-l-4 border-l-red-500 shadow-md bg-red-50/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-red-600 font-bold flex items-center gap-2">
                                    <Clock className="h-5 w-5" /> Overdue Payments
                                </CardTitle>
                                <CardDescription>These payments are past their due date!</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-48">
                                    <div className="space-y-3 pr-4">
                                        {overduePayments.map((p: any) => (
                                            <div key={p.id} className="bg-white p-3 rounded-lg border border-red-100 shadow-sm flex justify-between items-center group cursor-pointer hover:border-red-300 transition-all" onClick={() => handleViewDetails(p.id)}>
                                                <div>
                                                    <p className="font-bold text-[#1A1A1A]">{p.user?.full_name}</p>
                                                    <p className="text-xs text-red-500 font-semibold">
                                                        Due: {new Date(p.pending_payment_due_date || p.initial_payment_due_date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-red-600">Rs. {Number(p.pending_amount || p.initial_payment_required).toLocaleString()}</p>
                                                    <Badge variant="destructive" className="text-[10px]">OVERDUE</Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    )}

                    {upcomingPayments.length > 0 && (
                        <Card className="border-l-4 border-l-[#D4AF37] shadow-md bg-[#D4AF37]/5">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-[#D4AF37] font-bold flex items-center gap-2">
                                    <Calendar className="h-5 w-5" /> Upcoming Payments
                                </CardTitle>
                                <CardDescription>Payments due in the next 30 days</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-48">
                                    <div className="space-y-3 pr-4">
                                        {upcomingPayments.map((p: any) => (
                                            <div key={p.id} className="bg-white p-3 rounded-lg border border-[#D4AF37]/20 shadow-sm flex justify-between items-center group cursor-pointer hover:border-[#D4AF37] transition-all" onClick={() => handleViewDetails(p.id)}>
                                                <div>
                                                    <p className="font-bold text-[#1A1A1A]">{p.user?.full_name}</p>
                                                    <p className="text-xs text-[#6B6B6B]">
                                                        Due: {new Date(p.pending_payment_due_date || p.initial_payment_due_date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-[#1A1A1A]">Rs. {Number(p.pending_amount || p.initial_payment_required).toLocaleString()}</p>
                                                    <Badge variant="outline" className="text-[10px] border-[#D4AF37] text-[#D4AF37]">UPCOMING</Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Today's Route Section */}
            {todayRoute.length > 0 && (
                <Card className="border-none shadow-md bg-gradient-to-r from-[#1A1A1A] to-[#2D2D2D] text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                    <CardHeader>
                        <CardTitle className="font-serif text-xl flex items-center gap-2">
                            <Clock className="h-5 w-5 text-[#D4AF37]" /> Today's Route
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                            You have {todayRoute.length} shop{todayRoute.length !== 1 ? 's' : ''} assigned for today.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {todayRoute.map((shop: any) => {
                                // Find ledger info if available
                                const ledger = data?.shopLedgers?.find((l: any) => l.id === shop.id);
                                return (
                                    <div key={shop.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-bold text-lg">{shop.full_name}</h3>
                                                {shop.address && shop.address[0] && (
                                                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                                        <MapPin className="h-3 w-3" />
                                                        {shop.address[0].address_line1}, {shop.address[0].city}
                                                    </p>
                                                )}
                                            </div>
                                            <Link href={`/salesman/shop/${shop.id}`}>
                                                <Button size="sm" className="bg-[#D4AF37] hover:bg-[#C19B2E] text-white text-xs h-8">
                                                    Visit
                                                </Button>
                                            </Link>
                                        </div>

                                        <div className="mt-3 pt-3 border-t border-white/10 flex justify-between items-center text-sm">
                                            <span className="text-gray-400">Pending Due:</span>
                                            <span className={`font-bold ${Number(ledger?.pending || 0) > 0 ? "text-red-400" : "text-green-400"}`}>
                                                Rs. {Number(ledger?.pending || 0).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Weekly Schedule Section */}
            {weeklySchedule.length > 0 && (
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader>
                        <CardTitle className="font-serif text-xl flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-[#D4AF37]" /> Weekly Schedule
                        </CardTitle>
                        <CardDescription>Your recurring shop visits</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                                const shops = weeklySchedule.filter(s => s.schedule?.recurring.includes(day));
                                if (shops.length === 0) return null;
                                return (
                                    <div key={day} className="border rounded-lg p-3 bg-gray-50/50">
                                        <h4 className="font-bold text-[#D4AF37] mb-2 border-b pb-1">{day}</h4>
                                        <div className="space-y-2">
                                            {shops.map(shop => (
                                                <Link key={shop.id} href={`/salesman/shop/${shop.id}`} className="block">
                                                    <div className="text-sm p-2 bg-white border rounded hover:border-[#D4AF37] transition-all cursor-pointer">
                                                        <p className="font-semibold text-[#1A1A1A]">{shop.full_name}</p>
                                                        <p className="text-xs text-[#6B6B6B] truncate">{shop.address?.[0]?.city}</p>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-none shadow-sm bg-white overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-[#6B6B6B]">Orders Today</CardTitle>
                        <div className="w-8 h-8 rounded-lg bg-[#F7F5F2] flex items-center justify-center group-hover:bg-[#D4AF37]/10 transition-colors">
                            <ShoppingBag className="h-4 w-4 text-[#D4AF37]" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-[#1A1A1A]">{stats?.ordersToday || 0}</div>
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> Freshly recorded
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-[#6B6B6B]">Total Collected</CardTitle>
                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                            <DollarSign className="h-4 w-4 text-green-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-[#1A1A1A]">Rs. {Number(stats?.totalCollection || 0).toLocaleString()}</div>
                        <p className="text-xs text-[#6B6B6B] mt-1">Cash in hand tracking</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white overflow-hidden group border-l-4 border-l-red-500/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-[#6B6B6B]">Total Pending</CardTitle>
                        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                            <Clock className="h-4 w-4 text-red-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-red-600">Rs. {Number(stats?.totalPending || 0).toLocaleString()}</div>
                        <p className="text-xs text-[#6B6B6B] mt-1">Outstanding collection</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-[#6B6B6B]">Clients Served</CardTitle>
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                            <Users className="h-4 w-4 text-blue-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-[#1A1A1A]">{stats?.clientsServed || 0}</div>
                        <p className="text-xs text-[#6B6B6B] mt-1">Unique retail points</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Shop Ledgers & Recent Orders */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Shop Ledgers Summary */}
                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="font-serif text-xl">Top Pending Shops</CardTitle>
                                <CardDescription>Shops with the highest outstanding balance</CardDescription>
                            </div>
                            <Link href="/salesman/ledgers">
                                <Button variant="ghost" size="sm" className="text-[#D4AF37] hover:text-[#C19B2E] gap-1">
                                    All Ledgers <ArrowUpRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead>Shop</TableHead>
                                            <TableHead className="text-right">Pending Amount</TableHead>
                                            <TableHead className="text-right sr-only">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {shopLedgers?.slice(0, 5).map((sl: any) => (
                                            <TableRow key={sl.id} className="group transition-colors hover:bg-[#F7F5F2]/50">
                                                <TableCell className="font-medium py-4">{sl.name}</TableCell>
                                                <TableCell className="text-right text-red-600 font-bold">Rs. {Number(sl.pending).toLocaleString()}</TableCell>
                                                <TableCell className="text-right">
                                                    <Link href={`/salesman/shop/${sl.id}`}>
                                                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 text-[#D4AF37] transition-all">View</Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {(!shopLedgers || shopLedgers.length === 0) && (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-8 text-[#6B6B6B]">No pending shops found.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Orders */}
                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="font-serif text-xl">Recent Orders</CardTitle>
                                <CardDescription>Your latest transactions</CardDescription>
                            </div>
                            <Link href="/salesman/history">
                                <Button variant="ghost" size="sm" className="text-[#D4AF37] hover:text-[#C19B2E] gap-1">
                                    View History <ArrowUpRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentOrders?.slice(0, 5).map((order: any) => (
                                    <div
                                        key={order.id}
                                        onClick={() => handleViewDetails(order.id)}
                                        className="flex items-center justify-between p-4 border border-[#E8E8E8] rounded-xl hover:shadow-md transition-all cursor-pointer bg-white group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-[#F7F5F2] flex items-center justify-center text-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-white transition-colors">
                                                <ShoppingCart className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-[#1A1A1A] group-hover:text-[#D4AF37] transition-colors">#{order.order_number || order.id.slice(0, 8)}</p>
                                                <p className="text-sm text-[#6B6B6B]">{order.user?.full_name}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-[#1A1A1A]">Rs. {Number(order.total_amount).toLocaleString()}</p>
                                            {order.payment_status !== "paid" && Number(order.pending_amount) > 0 && (
                                                <div className="flex flex-col items-end">
                                                    <p className="text-[10px] font-bold text-red-500">Pending: Rs. {Number(order.pending_amount).toLocaleString()}</p>
                                                    {order.pending_payment_due_date && (
                                                        <p className="text-[10px] text-gray-400">Due: {new Date(order.pending_payment_due_date).toLocaleDateString()}</p>
                                                    )}
                                                </div>
                                            )}
                                            <Badge variant={order.payment_status === 'paid' ? 'default' : 'destructive'} className="text-[10px] h-5">
                                                {order.payment_status?.toUpperCase()}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                                {(!recentOrders || recentOrders.length === 0) && (
                                    <div className="text-center py-8 text-[#6B6B6B]">No recent orders found.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Brand Pending & Quick Actions */}
                <div className="space-y-6">
                    {/* Brand Pending Breakdown */}
                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader>
                            <CardTitle className="font-serif text-xl">Pending by Brand</CardTitle>
                            <CardDescription>Breakdown by authorized brands</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {brandPending?.map((bp: any) => (
                                    <div key={bp.id} className="p-4 rounded-xl border border-[#F7F5F2] bg-[#FDFCF9] space-y-2">
                                        <div className="flex justify-between items-center text-xs text-[#6B6B6B] font-bold uppercase tracking-wider">
                                            <span>{bp.name}</span>
                                            <span>{Math.round((bp.amount / (stats.totalPending || 1)) * 100)}%</span>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <p className="text-xl font-bold text-[#1A1A1A]">Rs. {Number(bp.amount).toLocaleString()}</p>
                                        </div>
                                        <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
                                            <div
                                                className="bg-[#D4AF37] h-full transition-all duration-1000"
                                                style={{ width: `${Math.min(100, (bp.amount / (stats.totalPending || 1)) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                                {(!brandPending || brandPending.length === 0) && (
                                    <p className="text-sm text-[#6B6B6B] py-4 text-center italic">No pending brand data.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Search Card */}
                    <Card className="border-none shadow-sm bg-[#1A1A1A] text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/20 rounded-full blur-3xl -mr-16 -mt-16" />
                        <CardHeader>
                            <CardTitle className="font-serif text-xl text-white">Find a Client</CardTitle>
                            <CardDescription className="text-gray-400">Quickly locate a shop and start an order</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 relative z-10">
                            <Link href="/salesman/shops">
                                <Button className="w-full bg-[#D4AF37] hover:bg-[#C19B2E] text-white border-none h-12 gap-2">
                                    <Search className="h-4 w-4" /> Start Searching
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Salesman Activity Feed */}
                    {userData && (
                        <SalesmanActivityFeed userId={userData.id} />
                    )}
                </div>
            </div>

            {/* Order Details Modal (Reuse logic from history) */}
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
