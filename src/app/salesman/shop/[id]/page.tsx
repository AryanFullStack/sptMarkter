"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getClientFinancialStatus, getSalesmanShopLedger, getAssignedBrands } from "@/app/actions/salesman-actions";
import { createClient } from "@/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Store, Phone, MapPin, DollarSign, PlusCircle, History, AlertTriangle, Building2, User } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export default function ShopDetailPage() {
    const params = useParams();
    const shopId = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [shopData, setShopData] = useState<any>(null);
    const [ledgerData, setLedgerData] = useState<any>(null);
    const [assignedBrands, setAssignedBrands] = useState<any[]>([]);
    const [salesmanId, setSalesmanId] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [shopId]);

    async function loadData() {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || user.role !== 'salesman') {
            setLoading(false);
            return;
        }
        setSalesmanId(user.id);

        try {
            const [clientStatus, ledgerStatus, brandsRes] = await Promise.all([
                getClientFinancialStatus(shopId),
                getSalesmanShopLedger(user.id, shopId),
                getAssignedBrands(user.id)
            ]);

            setShopData(clientStatus);
            setLedgerData(ledgerStatus);
            setAssignedBrands(brandsRes.brands || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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

    const { user: shop, financialSummary } = shopData;
    const { ledgers, totalInternalPending } = ledgerData || { ledgers: [], totalInternalPending: 0 };

    const isBlocked = financialSummary.remainingLimit <= 0 && financialSummary.pendingLimit > 0;

    return (
        <div className="container mx-auto px-4 py-8 space-y-8 max-w-5xl">
            {/* Breadcrumb */}
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
                                <p className="text-2xl font-bold">₹{financialSummary.remainingLimit.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">Available Credit Limit</p>
                            </div>
                            <div className="text-right">
                                <p className="font-medium text-muted-foreground">Total Limit: ₹{financialSummary.pendingLimit.toLocaleString()}</p>
                            </div>
                        </div>
                        <Progress
                            value={Math.min(100, (financialSummary.currentPending / (financialSummary.pendingLimit || 1)) * 100)}
                            className={`h-2 ${isBlocked ? "bg-red-100" : "bg-gray-100"}`}
                        />
                        <p className="text-xs text-right mt-1 text-muted-foreground">
                            {((financialSummary.currentPending / (financialSummary.pendingLimit || 1)) * 100).toFixed(0)}% Used (₹{financialSummary.currentPending.toLocaleString()} pending)
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
                            <p className="text-4xl font-bold">₹{totalInternalPending.toLocaleString()}</p>
                            <p className="text-sm mt-2 opacity-80">
                                Outstanding balance for orders recorded by you.
                            </p>
                            <Button
                                variant="outline"
                                className="w-full mt-6 bg-white/10 border-white/20 text-white hover:bg-white/20"
                                onClick={() => {/* Navigate to payment recording */ }}
                            >
                                Record Payment
                            </Button>
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
                                                <p className="font-bold text-[#C77D2E]">₹{Number(ledger.pending_amount).toLocaleString()}</p>
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

            {/* Recent Orders - Could reuse shared component */}
            <Separator />

            <div className="text-center text-sm text-muted-foreground pt-4">
                <p>Showing independent ledger data. Global limits are enforced by Admin.</p>
            </div>
        </div>
    );
}
