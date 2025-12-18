"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/supabase/client";
import { Package, DollarSign, TrendingUp, ShoppingBag, Clock, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ProfileForm } from "@/components/dashboards/profile-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRetailerDashboardData } from "@/app/actions/retailer-actions";
import { recordPartialPayment } from "@/app/actions/salesman-actions";
import { getPendingLimitInfo } from "@/app/actions/pending-limit-actions";
import { useToast } from "@/hooks/use-toast";
import { FinancialSummaryCard } from "@/components/shared/financial-summary-card";
import { PaymentTimeline } from "@/components/shared/payment-timeline";
import { PendingLimitWarning } from "@/components/shared/pending-limit-warning";
import { OrderCardEnhanced } from "@/components/shared/order-card-enhanced";
import { PaymentRecordModal } from "@/components/shared/payment-record-modal";

export default function RetailerDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [pendingInfo, setPendingInfo] = useState<any>(null);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

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
        const [dashboardData, limitInfo] = await Promise.all([
          getRetailerDashboardData(),
          getPendingLimitInfo(user.id)
        ]);

        setData(dashboardData);
        setPendingInfo(limitInfo);
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to load dashboard data", variant: "destructive" });
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
    toast({
      title: "Payment Recorded",
      description: "Payment has been successfully recorded",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="h-32 bg-gray-200 rounded" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-24 bg-gray-200 rounded" />
            <div className="h-24 bg-gray-200 rounded" />
            <div className="h-24 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { stats, brandSummary, recentOrders, payments } = data;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="font-serif text-4xl font-semibold text-[#1A1A1A]">Retailer Dashboard</h1>
          <Badge className="bg-[#D4AF37] text-white">Wholesale Pricing</Badge>
        </div>
        <p className="text-[#6B6B6B]">Manage your orders and track payments</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders & Payments</TabsTrigger>
          <TabsTrigger value="profile">Profile & Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Pending Limit Warning */}
          {pendingInfo && (
            <PendingLimitWarning
              currentPending={pendingInfo.currentPending || 0}
              pendingLimit={pendingInfo.pendingAmountLimit || 0}
              onPayNow={() => {
                // Scroll to orders tab or show payment modal
                toast({
                  title: "Make a Payment",
                  description: "Go to Orders & Payments tab to record a payment",
                });
              }}
            />
          )}

          {/* Financial Summary */}
          {pendingInfo && (
            <FinancialSummaryCard
              totalPending={pendingInfo.currentPending || 0}
              pendingLimit={pendingInfo.pendingAmountLimit || 0}
              totalPaid={stats?.totalPaid || 0}
              totalLifetimeValue={stats?.totalSpent || 0}
            />
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[#6B6B6B]">Total Orders</CardTitle>
                <Package className="h-4 w-4 text-[#D4AF37]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#1A1A1A]">{stats?.totalOrders || 0}</div>
                <p className="text-xs text-[#6B6B6B] mt-1">All time orders</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[#6B6B6B]">Total Paid</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ₹{Number(stats?.totalPaid || 0).toLocaleString()}
                </div>
                <p className="text-xs text-[#6B6B6B] mt-1">Total payments made</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[#6B6B6B]">Total Spent</CardTitle>
                <TrendingUp className="h-4 w-4 text-[#D4AF37]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#1A1A1A]">
                  ₹{Number(stats?.totalSpent || 0).toLocaleString()}
                </div>
                <p className="text-xs text-[#6B6B6B] mt-1">Lifetime value</p>
              </CardContent>
            </Card>
          </div>

          {/* Brand Summary & Recent Orders */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-2xl flex items-center gap-2">
                  <Tag className="h-6 w-6 text-[#D4AF37]" /> Brand Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!brandSummary || brandSummary.length === 0 ? (
                  <p className="text-center text-[#6B6B6B] py-8">No brand data available yet.</p>
                ) : (
                  <div className="space-y-4">
                    {brandSummary.map((b: any) => (
                      <div
                        key={b.name}
                        className="flex justify-between items-center border-b border-[#F7F5F2] pb-2 last:border-0 last:pb-0"
                      >
                        <div>
                          <p className="font-semibold text-[#1A1A1A]">{b.name}</p>
                          <p className="text-xs text-[#6B6B6B]">{b.count} items purchased</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#1A1A1A]">₹{b.total.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-2xl flex items-center gap-2">
                  <Clock className="h-6 w-6 text-[#2D5F3F]" />
                  Recent Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!recentOrders || recentOrders.length === 0 ? (
                  <div className="text-center py-12 text-[#6B6B6B]">
                    <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="mb-4">No orders yet</p>
                    <Link href="/store">
                      <Button className="bg-[#D4AF37] hover:bg-[#C19B2E] text-white">
                        Browse Products
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentOrders.slice(0, 5).map((order: any) => (
                      <div
                        key={order.id}
                        className="flex justify-between items-center p-3 border rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div>
                          <p className="font-mono text-sm font-semibold">
                            #{order.order_number || order.id.slice(0, 8)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₹{Number(order.total_amount).toLocaleString()}</p>
                          <Badge
                            variant={order.payment_status === "paid" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {order.payment_status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <div className="grid gap-6">
            {/* Orders List */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-2xl">All Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {!recentOrders || recentOrders.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p>No orders found</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
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

            {/* Payment History Timeline */}
            {payments && payments.length > 0 && (
              <PaymentTimeline payments={payments} />
            )}
          </div>
        </TabsContent>

        <TabsContent value="profile">
          <div className="max-w-2xl">
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
          recordPaymentAction={recordPartialPayment}
        />
      )}
    </div>
  );
}
