"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { createClient } from "@/supabase/client";
import { Package, DollarSign, TrendingUp, ShoppingBag, Clock, Tag, ArrowUpRight, ChevronRight, LayoutDashboard, CreditCard, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ProfileForm } from "@/components/dashboards/profile-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRetailerDashboardData, requestPayment } from "@/app/actions/retailer-actions";
import { getPendingLimitInfo } from "@/app/actions/pending-limit-actions";
import { getUpcomingPayments, getOverduePayments, getPaymentReminders } from "@/app/actions/payment-schedule-actions";
import { notify } from "@/lib/notifications";
import { FinancialSummaryCard } from "@/components/shared/financial-summary-card";
import { PaymentReminderAlert } from "@/components/shared/payment-reminder-alert";
import { PaymentTimeline } from "@/components/shared/payment-timeline";
import { PendingLimitWarning } from "@/components/shared/pending-limit-warning";
import { OrderCardEnhanced } from "@/components/shared/order-card-enhanced";
import { PaymentRecordModal } from "@/components/shared/payment-record-modal";
import { cn } from "@/lib/utils";

export default function RetailerDashboard({ initialData }: { initialData?: any }) {
  const [data, setData] = useState<any>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [user, setUser] = useState<any>(initialData?.user || null);
  const [pendingInfo, setPendingInfo] = useState<any>(initialData?.pendingInfo || null);
  const [upcomingPayments, setUpcomingPayments] = useState<any[]>(initialData?.upcomingPayments || []);
  const [overduePayments, setOverduePayments] = useState<any[]>(initialData?.overduePayments || []);
  const [paymentReminders, setPaymentReminders] = useState<any[]>([]);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const supabase = createClient();

  // 1. Data Fetching with SWR
  const { data: dashboardData, mutate: mutateDashboard } = useSWR(
    user ? ['retailer-dashboard', user.id] : null,
    async () => getRetailerDashboardData()
  );

  const { data: limitInfo, mutate: mutateLimit } = useSWR(
    user ? ['pending-limit', user.id] : null,
    async () => getPendingLimitInfo(user.id)
  );

  const { data: upcomingRes, mutate: mutateUpcoming } = useSWR(
    user ? ['retailer-upcoming', user.id] : null,
    async () => getUpcomingPayments(user.id, "retailer")
  );

  const { data: overdueRes, mutate: mutateOverdue } = useSWR(
    user ? ['retailer-overdue', user.id] : null,
    async () => getOverduePayments(user.id, "retailer")
  );

  const { data: remindersRes, mutate: mutateReminders } = useSWR(
    user ? ['retailer-reminders', user.id] : null,
    async () => getPaymentReminders(user.id, user.role || "retailer")
  );

  useEffect(() => {
    if (dashboardData && limitInfo && upcomingRes && overdueRes && remindersRes) {
      setData(dashboardData);
      setPendingInfo(limitInfo);
      setUpcomingPayments(upcomingRes.payments || []);
      setOverduePayments(overdueRes.payments || []);
      setPaymentReminders(remindersRes.reminders || []);
      setLoading(false);
    }
  }, [dashboardData, limitInfo, upcomingRes, overdueRes, remindersRes]);


  // 2. Realtime Subscriptions
  useEffect(() => {
    if (!user) return;

    // Listen to MY orders changing (status updates, notes, etc)
    const ordersChannel = supabase
      .channel('retailer-orders-changes')
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
          mutateReminders();
          notify.info("Update", "Your order status has been updated.");
        }
      )
      .subscribe();

    // Listen to User record changes (Limit changed by admin)
    const userChannel = supabase
      .channel('retailer-user-changes')
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
  }, []);

  const handleRecordPayment = (orderId: string) => {
    const order = data?.recentOrders?.find((o: any) => o.id === orderId);
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
    <div className="space-y-10 pb-20">
      {/* Payment Reminders Alert */}
      {paymentReminders.length > 0 && (
        <PaymentReminderAlert
          reminders={paymentReminders}
          onDismiss={() => mutateReminders()}
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[#E8E8E8] pb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-serif text-4xl lg:text-5xl font-bold text-[#1A1A1A] tracking-tight">Partner Terminal</h1>
            <Badge className="bg-[#D4AF37] hover:bg-[#D4AF37] text-white px-3 py-1 text-xs font-bold tracking-wider">PREMIUM ACCESS</Badge>
          </div>
          <p className="text-[#6B6B6B] text-lg flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            Wholesale channel active for {user?.email}
          </p>
        </div>
        <div className="flex gap-4">
          <Link href="/store">
            <Button className="h-12 px-8 bg-[#1A1A1A] hover:bg-[#333333] text-white shadow-xl shadow-black/10 transition-all active:scale-95 group">
              <ShoppingBag className="h-4 w-4 mr-2 group-hover:animate-bounce" />
              Procure Inventory
            </Button>
          </Link>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-10">
        <TabsList className="bg-transparent h-auto p-0 flex flex-wrap gap-8 border-b border-[#E8E8E8] w-full justify-start rounded-none">
          {[
            { id: "overview", label: "Overview", icon: LayoutDashboard },
            { id: "orders", label: "Orders & Payments", icon: CreditCard },
            { id: "profile", label: "Settings & Security", icon: User }
          ].map(tab => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#D4AF37] rounded-none px-0 pb-4 text-base font-semibold transition-all flex items-center gap-2"
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-10 focus-visible:outline-none">
          {/* Notifications/Warnings */}
          {(pendingInfo || upcomingPayments.length > 0 || overduePayments.length > 0) && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-700 space-y-6">
              {/* Overdue Payments Alert */}
              {overduePayments.length > 0 && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-red-800 font-bold flex items-center gap-2">
                      <Clock className="h-5 w-5" /> Action Required: Overdue Payments
                    </h3>
                    <p className="text-red-700 text-sm mt-1">
                      You have {overduePayments.length} payment{overduePayments.length !== 1 ? 's' : ''} past due. Please settle immediately to avoid service interruption.
                    </p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => setActiveTab("orders")}>
                    View & Pay <ArrowUpRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Upcoming Payments Alert */}
              {upcomingPayments.length > 0 && (
                <div className="bg-[#FDFCF9] border-l-4 border-[#D4AF37] p-4 rounded-r-lg shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-[#9A7D0A] font-bold flex items-center gap-2">
                      <CreditCard className="h-5 w-5" /> Upcoming Payments
                    </h3>
                    <p className="text-[#8A7009] text-sm mt-1">
                      You have {upcomingPayments.length} payment{upcomingPayments.length !== 1 ? 's' : ''} due in the next 30 days. Plan ahead!
                    </p>
                  </div>
                  <Button variant="outline" className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10" size="sm" onClick={() => setActiveTab("orders")}>
                    View Schedule
                  </Button>
                </div>
              )}

              {pendingInfo && (
                <FinancialSummaryCard
                  totalPending={pendingInfo.currentPending || 0}
                  pendingLimit={pendingInfo.pendingAmountLimit || 0}
                  totalPaid={stats?.totalPaid || 0}
                  totalLifetimeValue={stats?.totalSpent || 0}
                // className="mb-10" // Removed MB since container handles spacing
                />
              )}
              {pendingInfo && (
                <PendingLimitWarning
                  currentPending={pendingInfo.currentPending || 0}
                  pendingLimit={pendingInfo.pendingAmountLimit || 0}
                  onPayNow={() => setActiveTab("orders")}
                />
              )}
            </div>
          )}

          {/* KPI Dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Pending Commitment", value: `Rs. ${Number(pendingInfo?.currentPending || 0).toLocaleString()}`, icon: DollarSign, color: "text-[#D4AF37]", bg: "bg-[#FDFCF9]", border: "border-[#D4AF37]/20" },
              { label: "Total Volume", value: `Rs. ${Number(stats?.totalSpent || 0).toLocaleString()}`, icon: TrendingUp, color: "text-[#2D5F3F]", bg: "bg-emerald-50/50", border: "border-emerald-100" },
              { label: "Executed Units", value: stats?.totalOrders || 0, icon: Package, color: "text-blue-600", bg: "bg-blue-50/50", border: "border-blue-100" },
              { label: "Settled Flow", value: `Rs. ${Number(stats?.totalPaid || 0).toLocaleString()}`, icon: ShoppingBag, color: "text-amber-600", bg: "bg-amber-50/50", border: "border-amber-100" }
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
                  <CardTitle className="font-serif text-2xl">Ledger Stream</CardTitle>
                  <CardDescription>Real-time execution of your latest requisitions</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-[#D4AF37]" onClick={() => setActiveTab("orders")}>
                  View Ledger <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {!recentOrders || recentOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <ShoppingBag className="h-16 w-16 text-[#F7F5F2] mb-4" />
                    <p className="text-xl font-serif text-[#A0A0A0]">No transactions discovered</p>
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
                              {order.items?.length || 0} Manifest Items
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

            {/* Brand Distribution */}
            <Card className="border-none shadow-sm bg-white overflow-hidden">
              <CardHeader className="border-b border-[#F7F5F2] pb-6 px-8 pt-8">
                <CardTitle className="font-serif text-2xl">Brand Footprint</CardTitle>
                <CardDescription>Market distribution per brand</CardDescription>
              </CardHeader>
              <CardContent className="px-8 py-6 space-y-6">
                {!brandSummary || brandSummary.length === 0 ? (
                  <p className="text-center text-[#A0A0A0] py-12 italic">Data processing active...</p>
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
                            className="h-full bg-[#D4AF37] transition-all duration-1000"
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
                <CardTitle className="font-serif text-3xl">Comprehensive Ledger</CardTitle>
                <CardDescription>Secure history of all market requisitions and settlements</CardDescription>
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
                  <CardTitle className="font-serif text-2xl">Payment Settlement Timeline</CardTitle>
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
          title="Consignment Settlement"
          description="Initiate a payment request for final dispatch or credit settlement"
          buttonText="Transmit Request"
        />
      )}
    </div>
  );
}

