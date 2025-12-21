"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/supabase/client";
import { Package, DollarSign, TrendingUp, ShoppingBag, Clock, Tag, Sparkles, ArrowUpRight, ChevronRight, LayoutDashboard, CreditCard, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ProfileForm } from "@/components/dashboards/profile-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRetailerDashboardData, requestPayment } from "@/app/actions/retailer-actions";
import { getPendingLimitInfo } from "@/app/actions/pending-limit-actions";
import { notify } from "@/lib/notifications";
import { FinancialSummaryCard } from "@/components/shared/financial-summary-card";
import { PaymentTimeline } from "@/components/shared/payment-timeline";
import { PendingLimitWarning } from "@/components/shared/pending-limit-warning";
import { OrderCardEnhanced } from "@/components/shared/order-card-enhanced";
import { PaymentRecordModal } from "@/components/shared/payment-record-modal";
import { cn } from "@/lib/utils";

export default function ParlorDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [pendingInfo, setPendingInfo] = useState<any>(null);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const supabase = createClient();

  useEffect(() => {
    loadData();

    // Handle hash-based tab switching
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (["overview", "orders", "profile"].includes(hash)) {
        setActiveTab(hash);
      } else {
        setActiveTab("overview");
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const [dashboardData, limitInfo] = await Promise.all([
          getRetailerDashboardData(), // Reusing same action since data structure is same
          getPendingLimitInfo(user.id)
        ]);

        setData(dashboardData);
        setPendingInfo(limitInfo);
      }
    } catch (e) {
      console.error(e);
      notify.error("Error", "Failed to load dashboard data");
    }
    setLoading(false);
  }

  const handleRecordPayment = (orderId: string) => {
    const order = data?.recentOrders?.find((o: any) => o.id === orderId);
    if (order) {
      setSelectedOrderForPayment(order);
      setShowPaymentModal(true);
    }
  };

  const handlePaymentRecorded = () => {
    loadData(); // Reload dashboard data
    notify.success("Payment Requested", "Your payment request has been sent for approval.");
  };

  if (loading) {
    return (
      <div className="p-8 space-y-8">
        <div className="h-10 bg-gray-200 rounded w-1/4 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />)}
        </div>
        <div className="h-96 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  if (!data) return null;

  const { stats, brandSummary, recentOrders, payments } = data;

  return (
    <div className="p-4 lg:p-10 space-y-10">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[#E8E8E8] pb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-serif text-4xl lg:text-5xl font-bold text-[#1A1A1A] tracking-tight">Professional Suite</h1>
            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 text-xs font-bold tracking-wider border-none">BOUTIQUE ACCESS</Badge>
          </div>
          <p className="text-[#6B6B6B] text-lg flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500 animate-pulse" />
            Beauty partner session active for {user?.email}
          </p>
        </div>
        <div className="flex gap-4">
          <Link href="/store">
            <Button className="h-12 px-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-xl shadow-purple-500/20 transition-all active:scale-95 group border-none">
              <Sparkles className="h-4 w-4 mr-2 group-hover:animate-spin" />
              Refresh Inventory
            </Button>
          </Link>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-10">
        <TabsList className="bg-transparent h-auto p-0 flex flex-wrap gap-8 border-b border-[#E8E8E8] w-full justify-start rounded-none">
          {[
            { id: "overview", label: "Suite Overview", icon: LayoutDashboard },
            { id: "orders", label: "Orders & Settlements", icon: CreditCard },
            { id: "profile", label: "Security & Credentials", icon: User }
          ].map(tab => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none px-0 pb-4 text-base font-semibold transition-all flex items-center gap-2"
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-10 focus-visible:outline-none">
          {/* Notifications/Warnings */}
          {pendingInfo && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-700">
              <PendingLimitWarning
                currentPending={pendingInfo.currentPending || 0}
                pendingLimit={pendingInfo.pendingAmountLimit || 0}
                onPayNow={() => setActiveTab("orders")}
              />
            </div>
          )}

          {/* KPI Dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Pending Dues", value: `Rs. ${Number(pendingInfo?.currentPending || 0).toLocaleString()}`, icon: DollarSign, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
              { label: "Portfolio Value", value: `Rs. ${Number(stats?.totalSpent || 0).toLocaleString()}`, icon: TrendingUp, color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-100" },
              { label: "Active Orders", value: stats?.totalOrders || 0, icon: Package, color: "text-[#2D5F3F]", bg: "bg-emerald-50", border: "border-emerald-100" },
              { label: "Settled Payments", value: `Rs. ${Number(stats?.totalPaid || 0).toLocaleString()}`, icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" }
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
                    <h3 className="text-2xl font-bold text-[#1A1A1A] mt-1 whitespace-nowrap">{kpi.value}</h3>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Recent Orders Stream */}
            <Card className="lg:col-span-2 border-none shadow-sm bg-white overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b border-[#F7F5F2] pb-6 px-8 pt-8">
                <div>
                  <CardTitle className="font-serif text-2xl">Requisition Stream</CardTitle>
                  <CardDescription>Visual tracker for your latest beauty supply procurements</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-purple-600" onClick={() => setActiveTab("orders")}>
                  Suite History <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {!recentOrders || recentOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <ShoppingBag className="h-16 w-16 text-[#F7F5F2] mb-4" />
                    <p className="text-xl font-serif text-[#A0A0A0]">No supply history found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#F7F5F2]">
                    {recentOrders.slice(0, 5).map((order: any) => (
                      <div key={order.id} className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 p-6 hover:bg-[#FDFCF9] transition-colors group">
                        <div className="flex gap-5 items-start md:items-center flex-1">
                          <div className="min-w-12 h-12 bg-white rounded-xl flex items-center justify-center font-mono text-xs font-bold text-black shadow-sm">
                            #{order.order_number || order.id.slice(0, 6)}
                          </div>
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-sm text-[#1A1A1A]">
                                {new Date(order.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                            <p className="text-xs text-[#6B6B6B] font-medium">
                              {order.items?.length || 0} Supplies Procured
                            </p>
                          </div>
                        </div>
                        <div className="flex md:flex-col items-start md:items-end justify-between md:justify-start gap-2 md:gap-2 md:text-right ml-16 md:ml-0">
                          <p className="font-bold text-lg text-[#1A1A1A]">Rs. {Number(order.total_amount || 0).toLocaleString()}</p>
                          <Badge className={cn(
                            "text-[10px] h-6 px-3 font-bold uppercase tracking-wide",
                            order.payment_status === 'paid' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-purple-50 text-purple-700 border-purple-200"
                          )}>
                            {order.payment_status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Brand Distribution */}
            <Card className="border-none shadow-sm bg-white overflow-hidden">
              <CardHeader className="border-b border-[#F7F5F2] pb-6 px-8 pt-8">
                <CardTitle className="font-serif text-2xl">Product Allocation</CardTitle>
                <CardDescription>Brand-wise distribution of your salon inventory</CardDescription>
              </CardHeader>
              <CardContent className="px-8 py-6 space-y-6">
                {!brandSummary || brandSummary.length === 0 ? (
                  <p className="text-center text-[#A0A0A0] py-12 italic">Generating analytics...</p>
                ) : (
                  <div className="space-y-5">
                    {brandSummary.map((b: any) => (
                      <div key={b.name} className="space-y-2">
                        <div className="flex justify-between items-end">
                          <p className="text-sm font-bold text-[#1A1A1A]">{b.name}</p>
                          <p className="text-xs font-bold">Rs. {b.total.toLocaleString()}</p>
                        </div>
                        <div className="w-full h-1.5 bg-[#F7F5F2] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000"
                            style={{ width: `${Math.min(100, (b.total / (stats?.totalSpent || 1)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-10 focus-visible:outline-none">
          <div className="grid gap-8">
            <Card className="border-none shadow-sm bg-white overflow-hidden">
              <CardHeader className="px-8 pt-8 pb-4">
                <CardTitle className="font-serif text-3xl">Suite Transactions</CardTitle>
                <CardDescription>Full history of your professional account settlements</CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                {!recentOrders || recentOrders.length === 0 ? (
                  <div className="text-center py-24 text-[#6B6B6B]">
                    <Package className="h-20 w-20 mx-auto mb-6 opacity-10" />
                    <p className="text-xl font-serif italic text-gray-400">Registry remains empty</p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {recentOrders.map((order: any) => (
                      <OrderCardEnhanced
                        key={order.id}
                        order={order}
                        onRecordPayment={handleRecordPayment}
                        showPaymentHistory={true}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {payments && payments.length > 0 && (
              <Card className="border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="px-8 pt-8 pb-0">
                  <CardTitle className="font-serif text-2xl">Settlement Timeline</CardTitle>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  <PaymentTimeline payments={payments} />
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="profile" className="focus-visible:outline-none">
          <div className="max-w-4xl mx-auto">
            {user && <ProfileForm user={user} initialData={data.userProfile} />}
          </div>
        </TabsContent>
      </Tabs>

      {/* Payment Record Modal */}
      {selectedOrderForPayment && (
        <PaymentRecordModal
          open={showPaymentModal}
          onOpenChange={setShowPaymentModal}
          orderId={selectedOrderForPayment.id}
          orderNumber={selectedOrderForPayment.order_number}
          pendingAmount={selectedOrderForPayment.pending_amount}
          onPaymentRecorded={handlePaymentRecorded}
          recordPaymentAction={requestPayment}
          title="Supply Settlement"
          description="Initiate a payment request for your supply consignments"
          buttonText="Transmit Request"
        />
      )}
    </div>
  );
}

