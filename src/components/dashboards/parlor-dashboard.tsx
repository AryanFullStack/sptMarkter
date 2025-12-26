"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
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
import { getUpcomingPayments, getOverduePayments } from "@/app/actions/payment-schedule-actions";
import { notify } from "@/lib/notifications";
import { FinancialSummaryCard } from "@/components/shared/financial-summary-card";
import { PaymentTimeline } from "@/components/shared/payment-timeline";
import { PendingLimitWarning } from "@/components/shared/pending-limit-warning";
import { OrderCardEnhanced } from "@/components/shared/order-card-enhanced";
import { PaymentRecordModal } from "@/components/shared/payment-record-modal";
import { PaymentScheduleList } from "@/components/shared/payment-schedule-list";
import { cn } from "@/lib/utils";

export default function ParlorDashboard({ initialData }: { initialData?: any }) {
  const [data, setData] = useState<any>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [user, setUser] = useState<any>(initialData?.user || null);
  const [pendingInfo, setPendingInfo] = useState<any>(initialData?.pendingInfo || null);
  const [upcomingPayments, setUpcomingPayments] = useState<any[]>(initialData?.upcomingPayments || []);
  const [overduePayments, setOverduePayments] = useState<any[]>(initialData?.overduePayments || []);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const supabase = createClient();

  // 1. Data Fetching with SWR
  const { data: dashboardData, mutate: mutateDashboard } = useSWR(
    user ? ['parlor-dashboard', user.id] : null,
    async () => getRetailerDashboardData()
  );

  const { data: limitInfo, mutate: mutateLimit } = useSWR(
    user ? ['pending-limit', user.id] : null,
    async () => getPendingLimitInfo(user.id)
  );

  const { data: upcomingRes, mutate: mutateUpcoming } = useSWR(
    user ? ['parlor-upcoming', user.id] : null,
    async () => getUpcomingPayments(user.id, "beauty_parlor")
  );

  const { data: overdueRes, mutate: mutateOverdue } = useSWR(
    user ? ['parlor-overdue', user.id] : null,
    async () => getOverduePayments(user.id, "beauty_parlor")
  );

  useEffect(() => {
    if (dashboardData && limitInfo && upcomingRes && overdueRes) {
      setData(dashboardData);
      setPendingInfo(limitInfo);
      setUpcomingPayments(upcomingRes.payments || []);
      setOverduePayments(overdueRes.payments || []);
      setLoading(false);
    }
  }, [dashboardData, limitInfo, upcomingRes, overdueRes]);


  // 2. Realtime Subscriptions
  useEffect(() => {
    if (!user) return;

    // Listen to MY orders changing (status updates, notes, etc)
    const ordersChannel = supabase
      .channel('parlor-orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          mutateDashboard();
          mutateLimit(); // Order change might affect pending limit
          mutateUpcoming();
          mutateOverdue();
          notify.info("Update", "Your order status has been updated.");
        }
      )
      .subscribe();

    // Listen to User record changes (Limit changed by admin)
    const userChannel = supabase
      .channel('parlor-user-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`
        },
        () => {
          mutateLimit();
          notify.info("Account Update", "Your account settings/limits have been updated.");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(userChannel);
    };
  }, [user, supabase, mutateDashboard, mutateLimit, mutateUpcoming, mutateOverdue]);

  useEffect(() => {
    // Initial user load if not passed
    if (!user) {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) setUser(data.user);
      });
    }

    // Hash sync logic
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (['overview', 'orders', 'profile'].includes(hash)) {
        setActiveTab(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Run on mount

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleRecordPayment = (orderId: string) => {
    // Search in all potential collections
    const order =
      data?.recentOrders?.find((o: any) => o.id === orderId) ||
      upcomingPayments.find((o: any) => o.id === orderId) ||
      overduePayments.find((o: any) => o.id === orderId);

    if (order) {
      setSelectedOrderForPayment(order);
      setShowPaymentModal(true);
    }
  };

  const handlePaymentRecorded = () => {
    // Optimistic update or wait for realtime
    notify.success("Payment Received", "The payment has been recorded and will be verified by our team.");
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered": return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "shipped": return "bg-blue-50 text-blue-700 border-blue-100";
      case "processing": return "bg-amber-50 text-amber-700 border-amber-100";
      case "confirmed": return "bg-indigo-50 text-indigo-700 border-indigo-100";
      case "cancelled": return "bg-red-50 text-red-700 border-red-100";
      default: return "bg-gray-50 text-gray-700 border-gray-100";
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-8 px-4 lg:px-8">
        <div className="h-20 bg-gray-200/50 rounded-3xl w-1/4 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-gray-200/50 rounded-[2rem] animate-pulse" />)}
        </div>
        <div className="h-96 bg-gray-200/50 rounded-[2rem] animate-pulse" />
      </div>
    );
  }

  if (!data) return null;

  const { stats, brandSummary, recentOrders, payments } = data;

  return (
    <div className="space-y-10 pb-20 px-4 lg:px-8">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-[-1]">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-purple-500/5 blur-[120px] rounded-full -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-pink-500/5 blur-[120px] rounded-full -ml-20 -mb-20" />
      </div>

      {/* Boutique Header Section - Simplified */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2D1B4E] to-[#1A0B2E] p-6 lg:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full -mr-24 -mt-24 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-purple-600/20 text-purple-200 border border-purple-500/30 font-bold px-3 py-1 rounded-full text-[9px] tracking-widest uppercase">
                Premier Beauty Partner
              </Badge>
              <Sparkles className="h-3 w-3 text-purple-400 animate-pulse" />
            </div>
            <h1 className="font-serif text-3xl lg:text-4xl font-black text-white tracking-tight">
              Boutique <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">Suite</span>
            </h1>
          </div>
          <Link href="/store">
            <Button size="lg" className="h-14 px-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 group">
              <ShoppingBag className="h-4 w-4 mr-2 transition-transform group-hover:rotate-12" />
              Restock
            </Button>
          </Link>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <div className="sticky top-20 z-20 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="bg-white/70 backdrop-blur-md h-auto p-1 flex gap-2 border border-purple-100 w-max sm:w-full justify-start rounded-xl shadow-sm">
            {[
              { id: "overview", label: "Overview", icon: LayoutDashboard },
              { id: "orders", label: "Transactions", icon: CreditCard },
              { id: "profile", label: "Security", icon: User }
            ].map(tab => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg px-5 py-2.5 text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap"
              >
                <tab.icon className="h-3.5 w-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-10 focus-visible:outline-none">
          {/* Notifications/Warnings */}
          {(pendingInfo || upcomingPayments.length > 0 || overduePayments.length > 0) && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-700 space-y-6">
              {/* Overdue Payments Alert */}
              {overduePayments.length > 0 && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-red-800 font-bold flex items-center gap-2">
                      <Clock className="h-5 w-5" /> Urgent: Payment Overdue
                    </h3>
                    <p className="text-red-700 text-sm mt-1">
                      You have {overduePayments.length} outstanding invoice{overduePayments.length !== 1 ? 's' : ''}. Please resolve to maintain premium status.
                    </p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => setActiveTab("orders")}>
                    Settle Account <ArrowUpRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Upcoming Payments Alert */}
              {upcomingPayments.length > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500 p-4 rounded-r-lg shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-purple-800 font-bold flex items-center gap-2">
                      <CreditCard className="h-5 w-5" /> Scheduled Payments
                    </h3>
                    <p className="text-purple-700 text-sm mt-1">
                      You have {upcomingPayments.length} upcoming settlement{upcomingPayments.length !== 1 ? 's' : ''} due within 30 days.
                    </p>
                  </div>
                  <Button variant="outline" className="border-purple-500 text-purple-700 hover:bg-purple-50" size="sm" onClick={() => setActiveTab("orders")}>
                    View Calendar
                  </Button>
                </div>
              )}

              {pendingInfo && (
                <FinancialSummaryCard
                  totalPending={pendingInfo.currentPending || 0}
                  pendingLimit={pendingInfo.pendingAmountLimit || 0}
                  totalPaid={stats?.totalPaid || 0}
                  totalLifetimeValue={stats?.totalSpent || 0}
                // className="mb-10"
                />
              )}
              {pendingInfo && (
                <PendingLimitWarning
                  currentPending={pendingInfo.currentPending || 0}
                  pendingLimit={pendingInfo.pendingAmountLimit || 0}
                  onPayNow={() => setActiveTab("orders")}
                />
              )}

              {/* NEW: Payment Schedule Roadmap */}
              {(upcomingPayments.length > 0 || overduePayments.length > 0) && (
                <PaymentScheduleList
                  upcomingPayments={upcomingPayments}
                  overduePayments={overduePayments}
                  onPayNow={handleRecordPayment}
                  theme="parlor"
                />
              )}
            </div>
          )}

          {/* Section Header: Boutique Financials */}
          <div className="space-y-2 border-l-4 border-purple-600 pl-4 py-1 animate-in fade-in slide-in-from-left-4 duration-1000">
            <h2 className="text-xl font-serif font-bold text-[#1A1A1A]">Boutique Financials</h2>
            <p className="text-xs text-[#6B6B6B] font-medium uppercase tracking-widest">Real-time settlements & credit monitoring</p>
          </div>

          {/* KPI Dashboard - Simplified */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { label: "Pending Dues", value: `Rs. ${Number(pendingInfo?.currentPending || 0).toLocaleString()}`, icon: DollarSign, color: "text-purple-600", bg: "bg-purple-500/5", border: "border-purple-500/10" },
              { label: "Active Orders", value: stats?.totalOrders || 0, icon: Package, color: "text-emerald-600", bg: "bg-emerald-500/5", border: "border-emerald-500/10" },
              { label: "Settled Payments", value: `Rs. ${Number(stats?.totalPaid || 0).toLocaleString()}`, icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-500/5", border: "border-blue-500/10" }
            ].map((kpi, i) => (
              <Card
                key={i}
                className={cn(
                  "border shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden bg-white/80 backdrop-blur-sm hover:scale-[1.02] rounded-2xl",
                  kpi.border
                )}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className={cn("p-3 rounded-xl transition-all group-hover:bg-white shadow-sm", kpi.bg, kpi.color)}>
                      <kpi.icon className="h-5 w-5" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-gray-300 group-hover:text-purple-600 transition-colors" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{kpi.label}</p>
                    <h3 className="text-xl font-bold text-[#1A1A1A] tracking-tight">{kpi.value}</h3>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Section: Supply Logistics */}
          <div className="space-y-2 border-l-4 border-pink-500 pl-6 py-1 animate-in fade-in slide-in-from-left-4 duration-1000 delay-300">
            <h2 className="text-2xl font-serif font-black text-[#1A1A1A] tracking-tight">Supply Logistics</h2>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Requisition stream & brand footprint</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-10">
            {/* Recent Orders - Boutique Glass Card */}
            <Card className="lg:col-span-2 border-none shadow-3xl shadow-purple-500/5 bg-white/70 backdrop-blur-xl overflow-hidden rounded-[2.5rem]">
              <CardHeader className="p-8 border-b border-purple-100/30 bg-purple-50/20">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="font-serif text-2xl font-black text-[#1A1A1A]">Recent Requisitions</CardTitle>
                    <CardDescription className="text-sm font-medium text-gray-400 mt-1">Real-time supply chain updates</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="rounded-xl text-purple-600 font-bold hover:bg-purple-100" onClick={() => setActiveTab("orders")}>
                    Suite History <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-purple-100/30">
                  {recentOrders?.length > 0 ? (
                    recentOrders.slice(0, 5).map((order: any) => (
                      <div key={order.id} className="p-8 hover:bg-purple-50/30 transition-all group">
                        <div className="flex justify-between items-start">
                          <div className="flex gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-white border border-purple-100 flex items-center justify-center font-mono text-xs font-black text-purple-600 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-sm">
                              #{order.order_number.slice(-4)}
                            </div>
                            <div className="space-y-1">
                              <p className="font-black text-[#1A1A1A]">Ref: {order.order_number}</p>
                              <div className="flex items-center gap-3">
                                <p className="text-xs text-gray-400 font-medium">PKR {Number(order.total_amount).toLocaleString()}</p>
                                <div className="h-1 w-1 bg-gray-300 rounded-full" />
                                <p className="text-xs text-gray-400 font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </div>
                          <Badge className={cn("px-4 py-1.5 rounded-full text-[10px] font-black tracking-wider uppercase border-none shadow-sm", getStatusColor(order.status))}>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center text-gray-400">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-10" />
                      <p className="text-xs font-bold uppercase tracking-widest">No active requisitions</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Brand Influence - Simplified with data fix */}
            <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden rounded-2xl">
              <CardHeader className="p-6 border-b border-purple-100 bg-purple-50/20">
                <CardTitle className="font-serif text-xl font-bold text-[#1A1A1A]">Brand Influence</CardTitle>
                <CardDescription className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Aesthetic distribution</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {brandSummary?.length > 0 ? (
                    brandSummary.map((brand: any, i: number) => (
                      <div key={i} className="group cursor-pointer">
                        <div className="flex justify-between items-end mb-3">
                          <div className="space-y-0.5">
                            <h4 className="font-bold text-[#1A1A1A] text-xs group-hover:text-purple-600 transition-colors uppercase">{brand.name}</h4>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{brand.count} orders</p>
                          </div>
                          <p className="font-bold text-xs text-[#1A1A1A]">Rs. {Number(brand.total).toLocaleString()}</p>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-full transition-all duration-700"
                            style={{ width: `${Math.min((brand.total / (stats?.totalSpent || 1)) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 opacity-20">
                      <Tag className="h-10 w-10 mx-auto mb-2" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">No brand data</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-8 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="grid gap-8">
            <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden rounded-2xl">
              <CardHeader className="p-6 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-900 rounded-xl text-white shadow-md">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-900">Suite Ledger</CardTitle>
                    <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Verified history of boutique requisitions</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {!recentOrders || recentOrders.length === 0 ? (
                  <div className="text-center py-20 text-gray-300">
                    <Package className="h-16 w-16 mx-auto mb-4 opacity-5" />
                    <p className="text-sm font-serif italic">Registry remains empty</p>
                  </div>
                ) : (
                  <div className="grid gap-0 divide-y divide-purple-100/10">
                    {recentOrders.map((order: any) => (
                      <div key={order.id} className="p-0">
                        <OrderCardEnhanced
                          order={order}
                          onRecordPayment={handleRecordPayment}
                          showPaymentHistory={true}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {payments && payments.length > 0 && (
              <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden rounded-2xl">
                <CardHeader className="p-6 border-b border-purple-100 bg-purple-50/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-pink-600 rounded-xl text-white shadow-md">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-900">Settlement Timeline</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
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

