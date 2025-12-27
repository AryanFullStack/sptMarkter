"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/supabase/client";
import { Package, Heart, MapPin, Bell, ShoppingBag, ArrowUpRight, ChevronRight, LayoutDashboard, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ProfileForm } from "@/components/dashboards/profile-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export default function CustomerDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    wishlistItems: 0,
    savedAddresses: 0,
    notifications: 0,
  });
  const [userData, setUserData] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const supabase = createClient();

  useEffect(() => {
    loadDashboardData();

    // Handle hash-based tab switching
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (["overview", "profile"].includes(hash)) {
        setActiveTab(hash);
      } else {
        setActiveTab("overview");
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  async function loadDashboardData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUser(user);

    const [ordersRes, wishlistRes, addressesRes, userRes] = await Promise.all([
      supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("wishlist").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("addresses").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("users").select("*").eq("id", user.id).single(),
    ]);

    setStats({
      totalOrders: ordersRes.data?.length || 0,
      wishlistItems: wishlistRes.count || 0,
      savedAddresses: addressesRes.count || 0,
      notifications: 0,
    });

    setUserData(userRes.data);
    setRecentOrders(ordersRes.data?.slice(0, 5) || []);
    setLoading(false);
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "shipped": return "bg-blue-50 text-blue-700 border-blue-100";
      case "processing": return "bg-amber-50 text-amber-700 border-amber-100";
      case "cancelled": return "bg-red-50 text-red-700 border-red-100";
      default: return "bg-gray-50 text-gray-700 border-gray-100";
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-8">
        <div className="h-10 bg-gray-200 rounded w-1/4 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />)}
        </div>
        <div className="h-96 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-10 space-y-10">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[#E8E8E8] pb-10">
        <div>
          <h1 className="font-serif text-4xl lg:text-5xl font-bold text-[#1A1A1A] tracking-tight">Personal Workspace</h1>
          <p className="text-[#6B6B6B] mt-2 text-lg flex items-center gap-2">
            <span className="w-2 h-2 bg-[#2D5F3F] rounded-full animate-pulse" />
            Authenticated session for {user?.email}
          </p>
        </div>
        <div className="flex gap-4">
          <Link href="/store">
            <Button className="h-12 px-8 bg-[#2D5F3F] hover:bg-[#1f422c] text-white shadow-xl shadow-[#2D5F3F]/10 transition-all active:scale-95 group border-none">
              <ShoppingBag className="h-4 w-4 mr-2 group-hover:animate-bounce" />
              Go to Store
            </Button>
          </Link>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-10">
        <TabsList className="bg-transparent h-auto p-0 flex flex-wrap gap-8 border-b border-[#E8E8E8] w-full justify-start rounded-none">
          {[
            { id: "overview", label: "My Overview", icon: LayoutDashboard },
            { id: "profile", label: "Security & Account", icon: User }
          ].map(tab => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#2D5F3F] rounded-none px-0 pb-4 text-base font-semibold transition-all flex items-center gap-2"
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-10 focus-visible:outline-none">
          {/* KPI Dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Total Orders", value: stats.totalOrders, icon: Package, color: "text-[#2D5F3F]", bg: "bg-[#2D5F3F]/5", border: "border-[#2D5F3F]/10" },
              { label: "Wishlist Entries", value: stats.wishlistItems, icon: Heart, color: "text-red-500", bg: "bg-red-50", border: "border-red-100" },
              { label: "Saved Clusters", value: stats.savedAddresses, icon: MapPin, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
              { label: "Alerts", value: stats.notifications, icon: Bell, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100" }
            ].map((kpi, i) => (
              <Card key={i} className={cn("border shadow-sm hover:shadow-md transition-all group overflow-hidden bg-white", kpi.border)}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-110", kpi.bg, kpi.color)}>
                      <kpi.icon className="h-6 w-6" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-[#A0A0A0] group-hover:text-[#1A1A1A] transition-colors" />
                  </div>
                  <div className="mt-4">
                    <p className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-widest">{kpi.label}</p>
                    <h3 className="text-2xl font-bold text-[#1A1A1A] mt-1">{kpi.value}</h3>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 border-none shadow-sm bg-white overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b border-[#F7F5F2] pb-6 px-8 pt-8">
                <div>
                  <CardTitle className="font-serif text-2xl">Recent Shipments</CardTitle>
                  <CardDescription>Visual tracker for your latest orders</CardDescription>
                </div>
                <Link href="/orders">
                  <Button variant="ghost" size="sm" className="text-[#2D5F3F]">
                    Full History <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                {recentOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <ShoppingBag className="h-16 w-16 text-[#F7F5F2] mb-4" />
                    <p className="text-xl font-serif text-[#A0A0A0]">No shipments discovered</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#F7F5F2]">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 p-6 hover:bg-[#FDFCF9] transition-colors group">
                        <div className="flex gap-5 items-start md:items-center flex-1">
                          <div className="min-w-12 h-12 bg-white rounded-xl flex items-center justify-center font-mono text-xs font-bold text-black shadow-sm border border-gray-100 px-2">
                            #{order.order_number || order.id.slice(0, 6)}
                          </div>
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-sm text-[#1A1A1A]">
                                {new Date(order.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                            <p className="text-xs text-[#6B6B6B] font-medium">
                              Standard Delivery
                            </p>
                          </div>
                        </div>
                        <div className="flex md:flex-col items-start md:items-end justify-between md:justify-start gap-2 md:gap-2 md:text-right ml-16 md:ml-0">
                          <p className="font-bold text-lg text-[#1A1A1A]">Rs. {Number(order.total_amount || 0).toLocaleString()}</p>
                          <Badge className={cn(
                            "text-[10px] h-6 px-3 font-bold uppercase tracking-wide border shadow-none",
                            getStatusColor(order.status)
                          )}>
                            {order.status || 'pending'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white overflow-hidden">
              <CardHeader className="border-b border-[#F7F5F2] pb-6 px-8 pt-8">
                <CardTitle className="font-serif text-2xl">Quick Actions</CardTitle>
                <CardDescription>Frequently used account links</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {[
                  { label: "My Wishlist", icon: Heart, href: "/wishlist", color: "text-red-500", bg: "bg-red-50" },
                  { label: "Track Orders", icon: Package, href: "/orders", color: "text-emerald-600", bg: "bg-emerald-50" },
                  { label: "Saved Locations", icon: MapPin, href: "#profile", color: "text-blue-600", bg: "bg-blue-50" },
                  { label: "Account Support", icon: Bell, href: "/contact", color: "text-amber-600", bg: "bg-amber-50" }
                ].map((action, i) => (
                  <Link key={i} href={action.href}>
                    <Button variant="ghost" className="w-full justify-start h-14 hover:bg-[#F7F5F2] rounded-xl gap-4">
                      <div className={cn("p-2 rounded-lg", action.bg, action.color)}>
                        <action.icon className="h-5 w-5" />
                      </div>
                      <span className="font-semibold text-[#1A1A1A]">{action.label}</span>
                      <ChevronRight className="h-4 w-4 ml-auto text-[#A0A0A0]" />
                    </Button>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="profile" className="focus-visible:outline-none">
          <div className="max-w-4xl mx-auto">
            {userData && <ProfileForm user={user} initialData={userData} />}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

