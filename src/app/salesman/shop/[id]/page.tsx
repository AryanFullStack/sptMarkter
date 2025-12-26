"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getClientFinancialStatus, getSalesmanShopLedger, getAssignedBrands, recordPartialPayment } from "@/app/actions/salesman-actions";
import { createClient } from "@/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Store, Phone, MapPin, DollarSign, PlusCircle, History, AlertTriangle, Building2, User } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { notify } from "@/lib/notifications";
import { Skeleton } from "@/components/ui/skeleton";

export default function ShopDetailPage() {
    const params = useParams();
    const router = useRouter();
    const shopId = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [shopData, setShopData] = useState<any>(null);
    const [ledgerData, setLedgerData] = useState<any>(null);
    const [assignedBrands, setAssignedBrands] = useState<any[]>([]);
    const [salesmanId, setSalesmanId] = useState<string | null>(null);
    const [addresses, setAddresses] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);

    // Payment State
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState<string>("");
    const [paymentNotes, setPaymentNotes] = useState("");
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);
    const [maxPayment, setMaxPayment] = useState<number>(0);

    useEffect(() => {
        loadData();
    }, [shopId]);

    async function loadData() {
        setLoading(true);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            setLoading(false);
            return;
        }

        // Verify salesman role from users table
        const { data: userData } = await supabase
            .from('users')
            .select('role, id')
            .eq('id', user.id)
            .single();

        if (!userData || userData.role !== 'salesman') {
            setLoading(false);
            return;
        }

        setSalesmanId(userData.id);

        try {
            const [clientStatus, ledgerStatus, brandsRes, addrRes] = await Promise.all([
                getClientFinancialStatus(shopId, user.id),
                getSalesmanShopLedger(user.id, shopId),
                getAssignedBrands(user.id),
                supabase.from("addresses").select("*").eq("user_id", shopId).order("is_default", { ascending: false })
            ]);

            setShopData(clientStatus);
            setLedgerData(ledgerStatus);
            setAssignedBrands(brandsRes.brands || []);
            setAddresses(addrRes.data || []);

            // Payments are now included in clientStatus.orders
            if (clientStatus.orders && clientStatus.orders.length > 0) {
                const allPayments = clientStatus.orders.flatMap((o: any) => o.payments || []);
                setPayments(allPayments);
            } else {
                setPayments([]);
            }
        } catch (e) {
            console.error("Error loading shop data:", e);
        } finally {
            setLoading(false);
        }
    }

    const handlePaymentSubmit = async () => {
        if (!paymentAmount || Number(paymentAmount) <= 0) {
            notify.error("Invalid Amount", "Please enter a valid amount");
            return;
        }

        setPaymentProcessing(true);
        try {
            // Check against total pending (globally or just my ledger? Implementing per order is complex without order selection, 
            // but the requirement is "update pending amounts". 
            // The action `recordPartialPayment` takes an `orderId`. 
            // Wait, the action `recordPartialPayment` requires an `orderId`.
            // But here on the shop page, we are collecting general payment?
            // If the user wants to pay "some amount", it usually goes to the oldest order or is general credit.
            // However, the current backend action `recordPartialPayment` IS TIED TO A SPECIFIC ORDER.
            // I need to either: 
            // 1. Ask user to select an order (Complex UI)
            // 2. Automatically apply to oldest unpaid order (Backend logic, but I can't change backend easily right now without verify)
            // 3. Update the action or create a new one for "Account Payment".

            // Let's look at `salesman-actions.ts` again. 
            // It has `recordPartialPayment(orderId...)`.
            // It does NOT have a general "Pay to Account" function.

            // Since I am in EXECUTION and constrained, and the user said "like next time user give again some amount", 
            // it implies account-level or order-level.
            // Given the task was "Select Products... payment user amount, pending amounts",
            // I should probably show a list of Pending Orders and let them pay off specific ones?
            // OR, for now, to make it simple and robust:
            // I will FETCH the recent unpaid orders for this shop in the modal, let them select one.
            // Actually, `getSalesmanShopLedger` gives pending amount but not list of orders.
            // `getClientFinancialStatus` returns `orders`.

            // I will iterate through unpaid orders and apply the payment? NO, that's dangerous.
            // I will change the UI to "Pay against specific Order" or just show pending orders list and "Pay" button next to them?
            // The user request was "update pending amounts".

            // Let's look at `getClientFinancialStatus` usage. It returns `orders`.
            // I can show a list of unpaid orders in the "My Ledger" section or a new tab, and allow paying them?

            // Let's stick to the plan: "Implement 'Collect Payment' Feature (Shop Details)".
            // I will implement a "General Payment" that automatically pays off the oldest orders? 
            // No, the action requires `orderId`.

            // I'll add a "Pay for specific order" flow.
            // I need to list pending orders. `shopData.orders` has them.

            // RE-PLANNING MICRO-STEP:
            // 1. Display Pending Orders in a new Card or Section.
            // 2. Add "Pay" button next to each pending order.
            // 3. The Dialog opens for THAT order.
        } catch (e) {
            console.error(e);
        }
    };

    // STARTING OVER WITH THE FILE REPLACEMENT TO INCLUDE ORDERS LIST AND PAY BUTTONS

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 space-y-8 max-w-5xl">
                {/* Header Skeleton */}
                <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="space-y-4 w-full md:w-1/2">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div>
                                <Skeleton className="h-8 w-64 mb-2" />
                                <Skeleton className="h-5 w-24 rounded-full" />
                            </div>
                        </div>
                        <div className="space-y-2 pl-14">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-4 w-60" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </div>
                    {/* Status Card Skeleton */}
                    <div className="w-full md:w-1/2">
                        <Skeleton className="h-32 w-full rounded-xl" />
                    </div>
                </div>

                {/* Ledger Skeleton */}
                <div>
                    <Skeleton className="h-8 w-40 mb-4" />
                    <div className="grid md:grid-cols-3 gap-6">
                        <Skeleton className="h-40 w-full rounded-xl md:col-span-1" />
                        <Skeleton className="h-40 w-full rounded-xl md:col-span-2" />
                    </div>
                </div>

                {/* Orders Skeleton */}
                <div>
                    <Skeleton className="h-8 w-48 mb-4" />
                    <div className="space-y-3">
                        <Skeleton className="h-24 w-full rounded-lg" />
                        <Skeleton className="h-24 w-full rounded-lg" />
                    </div>
                </div>

                {/* Actions Skeleton */}
                <div>
                    <Skeleton className="h-8 w-32 mb-4" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
                    </div>
                </div>
            </div>
        );
    }

    if (!shopData || shopData.error) {
        return (
            <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
                <p>Shop not found or access denied.</p>
                <Link href="/salesman/shops">
                    <Button variant="outline" className="mt-4">Back to Search</Button>
                </Link>
            </div>
        );
    }

    const { user: shop, financialSummary, orders } = shopData; // Destructure orders
    const ledgers = ledgerData?.ledgers || [];
    const totalInternalPending = ledgerData?.totalInternalPending || 0;
    const isBlocked = financialSummary.remainingLimit <= 0 && financialSummary.pendingLimit > 0;

    // Filter pending orders
    const pendingOrders = orders?.filter((o: any) => o.payment_status !== 'paid' && o.status !== 'cancelled') || [];

    const openPaymentModal = (orderId: string, currentPending: number) => {
        setPaymentOrderId(orderId);
        setMaxPayment(currentPending);
        setPaymentAmount("");
        setPaymentModalOpen(true);
    };

    const submitPayment = async () => {
        if (!paymentOrderId || !paymentAmount || Number(paymentAmount) <= 0) return;

        setPaymentProcessing(true);
        const res = await recordPartialPayment(paymentOrderId, Number(paymentAmount), "cash", paymentNotes);

        if (res.error) {
            notify.error("Payment Failed", res.error);
        } else {
            notify.success("Payment Recorded", "Payment has been successfully recorded.");
            setPaymentModalOpen(false);
            loadData(); // Refresh
        }
        setPaymentProcessing(false);
    };

    return (
        <div className="container mx-auto px-4 py-8 space-y-8 max-w-5xl">
            {/* ... Breadcrumb & Header (unchanged) ... */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link href="/salesman" className="hover:text-primary">Dashboard</Link>
                <span>/</span>
                <Link href="/salesman/shops" className="hover:text-primary">Find Shop</Link>
                <span>/</span>
                <span className="font-medium text-foreground">Shop Details</span>
            </div>

            {/* Header & Main Info */}
            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                    <div>
                        <h1 className="font-serif text-3xl font-bold text-[#1A1A1A] flex items-center gap-2">
                            <Store className="h-8 w-8 text-[#2D5F3F]" />
                            {shop.full_name}
                        </h1>
                        <Badge className="mt-2 bg-[#F7F5F2] text-[#6B6B6B] hover:bg-[#EBE9E4]">
                            {shop.role?.replace('_', ' ')}
                        </Badge>
                    </div>

                    <div className="space-y-2 text-sm text-[#6B6B6B]">
                        <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" /> {shop.phone || "No phone"}
                        </div>
                        {addresses.length > 0 && (
                            <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 mt-0.5" />
                                <div>
                                    <p className="font-medium">{addresses[0].address_line1}</p>
                                    <p>{addresses[0].city}, {addresses[0].state} {addresses[0].postal_code}</p>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {shop.assigned_salesman_id === salesmanId ? (
                                <span className="text-green-600 font-medium">Assigned to You</span>
                            ) : (
                                <span>No primary assignment</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Global Status Card */}
                <Card className={`border-l-4 ${isBlocked ? 'border-l-red-500' : 'border-l-[#D4AF37]'}`}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex justify-between">
                            Global Shop Status (All Salesmen)
                            {isBlocked && <Badge variant="destructive">Limit Exceeded</Badge>}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <p className="text-2xl font-bold">Rs. {financialSummary.remainingLimit.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">Available Credit Limit</p>
                            </div>
                            <div className="text-right">
                                <p className="font-medium text-muted-foreground">Total Limit: Rs. {financialSummary.pendingLimit.toLocaleString()}</p>
                            </div>
                        </div>
                        <Progress
                            value={Math.min(100, (financialSummary.currentPending / (financialSummary.pendingLimit || 1)) * 100)}
                            className={`h-2 ${isBlocked ? "bg-red-100" : "bg-gray-100"}`}
                        />
                        <p className="text-xs text-right mt-1 text-muted-foreground">
                            {((financialSummary.currentPending / (financialSummary.pendingLimit || 1)) * 100).toFixed(0)}% Used (Rs. {financialSummary.currentPending.toLocaleString()} pending)
                        </p>
                    </CardContent>
                </Card>
            </div>


            {/* Salesman's Ledger Section */}
            <div>
                <h2 className="font-serif text-2xl font-semibold mb-4 text-[#1A1A1A]">My Ledger</h2>
                <div className="grid md:grid-cols-3 gap-6">
                    {/* Summary Card */}
                    <Card className="md:col-span-1 bg-[#2D5F3F] text-white">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2 mb-4 opacity-90">
                                <DollarSign className="h-5 w-5" />
                                <span className="font-medium">My Total Pending</span>
                            </div>
                            <p className="text-4xl font-bold">Rs. {(totalInternalPending || 0).toLocaleString()}</p>
                            <p className="text-sm mt-2 opacity-80">
                                Outstanding balance for orders recorded by you.
                            </p>
                            {/* Removed generic Record Payment button as we are now doing per-order */}
                        </CardContent>
                    </Card>

                    {/* Brand Breakdown */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-lg">Pending by Brand</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {ledgers.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg">
                                    <p>No pending balances by brand.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {ledgers.map((ledger: any) => (
                                        <div key={ledger.brand_id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                                    {ledger.brands?.logo_url ? (
                                                        <img src={ledger.brands.logo_url} className="h-6 w-6 object-contain" />
                                                    ) : (
                                                        <Building2 className="h-5 w-5 text-gray-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{ledger.brands?.name || 'Unknown Brand'}</p>
                                                    <p className="text-xs text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-[#C77D2E]">Rs. {Number(ledger.pending_amount).toLocaleString()}</p>
                                                <p className="text-xs text-muted-foreground">Pending</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Pending Orders List */}
            {pendingOrders.length > 0 && (
                <div>
                    <h2 className="font-serif text-2xl font-semibold mb-4 text-[#1A1A1A]">Pending Orders</h2>
                    <div className="space-y-3">
                        {pendingOrders.map((order: any) => (
                            <Card key={order.id} className="overflow-hidden">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold">{order.order_number}</span>
                                            <Badge variant="outline">{new Date(order.created_at).toLocaleDateString()}</Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground mt-1">
                                            Total: Rs. {order.total_amount} | Paid: Rs. {order.paid_amount}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 justify-between sm:justify-end">
                                        <div className="text-right">
                                            <p className="font-bold text-red-600">Rs. {order.pending_amount}</p>
                                            <p className="text-xs text-muted-foreground">Pending</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            className="bg-[#2D5F3F] hover:bg-[#1e402a] text-white"
                                            onClick={() => openPaymentModal(order.id, order.pending_amount)}
                                        >
                                            Collect
                                        </Button>
                                    </div>
                                </div>
                                {payments.filter(p => p.order_id === order.id).length > 0 && (
                                    <div className="bg-gray-50 border-t p-3 text-xs">
                                        <p className="font-semibold mb-2 flex items-center gap-1 uppercase tracking-wider text-gray-500">
                                            <History className="h-3 w-3" /> Payment History
                                        </p>
                                        <div className="space-y-1">
                                            {payments.filter(p => p.order_id === order.id).map((p: any) => (
                                                <div key={p.id} className="flex justify-between items-center text-gray-600">
                                                    <span>Collected Rs. {Number(p.amount).toLocaleString()} on {new Date(p.created_at).toLocaleDateString()}</span>
                                                    <span className="italic text-[10px]">{p.notes || 'No notes'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                </div>
            )}


            {/* Actions */}
            <div>
                <h2 className="font-serif text-2xl font-semibold mb-4 text-[#1A1A1A]">Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {assignedBrands.map(item => (
                        <Link key={item.brand_id} href={`/salesman/create-order?shopId=${shopId}&brandId=${item.brand_id}`}>
                            <Card className="hover:shadow-lg transition-all cursor-pointer border hover:border-[#D4AF37] group">
                                <CardContent className="p-6 text-center">
                                    <PlusCircle className="h-8 w-8 mx-auto mb-3 text-[#D4AF37] group-hover:scale-110 transition-transform" />
                                    <h3 className="font-bold mb-1">New Order</h3>
                                    <p className="text-sm text-muted-foreground">{item.brands.name}</p>
                                    {isBlocked && (
                                        <Badge variant="destructive" className="mt-2">Limit Blocked</Badge>
                                    )}
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
                {assignedBrands.length === 0 && (
                    <p className="text-muted-foreground">You have no assigned brands to create orders with.</p>
                )}
            </div>

            <Separator />

            <div className="text-center text-sm text-muted-foreground pt-4">
                <p>Showing independent ledger data. Global limits are enforced by Admin.</p>
            </div>

            <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Collect Payment</DialogTitle>
                        <DialogDescription>
                            Record a payment for order. Max collectable: Rs. {maxPayment}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount (Rs.)</Label>
                            <Input
                                id="amount"
                                type="number"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                max={maxPayment}
                                placeholder="Enter amount"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                value={paymentNotes}
                                onChange={(e) => setPaymentNotes(e.target.value)}
                                placeholder="Payment details (e.g. cash)"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPaymentModalOpen(false)}>Cancel</Button>
                        <Button
                            onClick={submitPayment}
                            disabled={paymentProcessing}
                            className="bg-[#2D5F3F] text-white"
                        >
                            {paymentProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Payment
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
