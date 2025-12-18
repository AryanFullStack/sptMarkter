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

export default function SalesmanDashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

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

    const { stats, brands, recentOrders } = data;

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

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="brands">My Brands</TabsTrigger>
                    <TabsTrigger value="history">Order History</TabsTrigger>
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
                                <CardTitle className="text-sm font-medium text-[#6B6B6B]">Sales Value</CardTitle>
                                <DollarSign className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">
                                    ₹{Number(stats?.totalOrdersValue || 0).toLocaleString()}
                                </div>
                                <p className="text-xs text-[#6B6B6B] mt-1">Total value of recent orders</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-[#6B6B6B]">Clients Served</CardTitle>
                                <Users className="h-4 w-4 text-[#D4AF37]" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-[#1A1A1A]">{stats?.clientsServed || 0}</div>
                                <p className="text-xs text-[#6B6B6B] mt-1">Unique clients in recent orders</p>
                            </CardContent>
                        </Card>
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
                                            className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="mb-2 sm:mb-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-semibold text-[#1A1A1A]">
                                                        #{order.order_number || order.id.slice(0, 8)}
                                                    </span>
                                                    <Badge variant={order.payment_status === "paid" ? "default" : "outline"} className="text-xs">
                                                        {order.payment_status}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-[#6B6B6B]">
                                                    For: <span className="font-medium text-[#1A1A1A]">{order.user?.full_name || "Unknown Client"}</span>
                                                </p>
                                                <p className="text-xs text-[#8C8C8C]">
                                                    {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-lg">₹{Number(order.total_amount).toLocaleString()}</p>
                                                <p className="text-xs text-[#6B6B6B]">Pending: ₹{Number(order.pending_amount).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
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
                    {/* Reuse the recent orders list from overview or create a more detailed table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Order History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground mb-4">Detailed order history coming soon.</p>
                            {/* Placeholder for now, duplicates overview list essentially */}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="profile">
                    <div className="max-w-2xl">
                        {user && (
                            <ProfileForm
                                user={user}
                                initialData={{
                                    full_name: user.full_name || "",
                                    phone: user.phone || "",
                                    email: user.email || "",
                                    role: user.role || ""
                                }}
                            />
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
