"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getProductsForBrand, createOrderForClient, canCreateOrder, getClientFinancialStatus } from "@/app/actions/salesman-actions";
import { createClient } from "@/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
    Loader2,
    ShoppingCart,
    Plus,
    Minus,
    Trash,
    AlertTriangle,
    CheckCircle,
    ArrowLeft,
    Search,
    DollarSign,
    History
} from "lucide-react";
import Link from "next/link";
import { notify } from "@/lib/notifications";

interface CartItem {
    id: string;
    name: string;
    price: number;
    beauty_price: number;
    retailer_price: number;
    quantity: number;
    images?: string[];
}

export default function CreateOrderPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const { shopId, brandId } = {
        shopId: searchParams.get("shopId"),
        brandId: searchParams.get("brandId")
    };

    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<any[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [shopRole, setShopRole] = useState<string>("local_customer");
    const [shopName, setShopName] = useState("");
    const [financialStatus, setFinancialStatus] = useState<any>(null);
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [collectedAmount, setCollectedAmount] = useState<number>(0);
    const [searchQuery, setSearchQuery] = useState("");

    // Check limit state
    const [limitCheck, setLimitCheck] = useState<{ valid: boolean; message?: string }>({ valid: true });

    // Payment due date state
    const [paymentDue, setPaymentDue] = useState<string>("");

    useEffect(() => {
        if (shopId && brandId) {
            loadData();
        }
    }, [shopId, brandId]);

    useEffect(() => {
        checkLimit();
    }, [cart, financialStatus, collectedAmount]);

    async function loadData() {
        try {
            const [productsRes, shopRes] = await Promise.all([
                getProductsForBrand(brandId!),
                getClientFinancialStatus(shopId!)
            ]);

            setProducts(productsRes.products || []);

            if (shopRes.user) {
                setShopRole(shopRes.user.role);
                setShopName(shopRes.user.full_name);
                setFinancialStatus(shopRes.financialSummary);
            }
        } catch (e) {
            console.error(e);
            notify.error("Error", "Failed to load data");
        } finally {
            setLoading(false);
        }
    }

    const getPrice = (product: any) => {
        return shopRole === "beauty_parlor" ? (product.price_beauty_parlor || 0) : (product.price_retailer || 0);
    };

    const addToCart = (product: any) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            const price = getPrice(product);
            return [...prev, {
                id: product.id,
                name: product.name,
                price,
                beauty_price: product.price_beauty_parlor || 0,
                retailer_price: product.price_retailer || 0,
                quantity: 1
            }];
        });
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => {
            return prev.map(item => {
                if (item.id === productId) {
                    const newQty = Math.max(1, item.quantity + delta);
                    return { ...item, quantity: newQty };
                }
                return item;
            });
        });
    };

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const newPendingAmount = Math.max(0, totalAmount - collectedAmount);

    const checkLimit = () => {
        if (!financialStatus) return;

        const additionalPending = Math.max(0, totalAmount - collectedAmount);

        // Feature: Block new orders if overdue exists
        if (financialStatus.hasOverduePayments && additionalPending > 0) {
            setLimitCheck({
                valid: false,
                message: `LOCKED: This client has OVERDUE payments. Please collect outstanding dues first or pay in full.`
            });
            return;
        }

        const pendingLimit = financialStatus.pendingLimit;
        const currentPending = financialStatus.currentPending;
        const newTotalPending = currentPending + additionalPending;

        if (pendingLimit > 0 && newTotalPending > pendingLimit) {
            setLimitCheck({
                valid: false,
                message: `Pending Limit Exceeded! Available: Rs. ${Math.max(0, pendingLimit - currentPending).toLocaleString()}, Order Balance: Rs. ${additionalPending.toLocaleString()}`
            });
        } else {
            setLimitCheck({ valid: true });
        }
    };

    const handleSubmit = async () => {
        if (!shopId || !brandId) return;
        if (cart.length === 0) {
            notify.error("Cart is empty", "Please add products to the order");
            return;
        }
        if (!limitCheck.valid) {
            notify.error("Limit Exceeded", limitCheck.message || "Pending amount limit exceeded");
            return;
        }

        const newPending = totalAmount - collectedAmount;
        if (newPending > 0 && !paymentDue) {
            notify.error("Payment Due Date Required", "Please set a due date for the pending payment.");
            return;
        }

        setIsSubmitting(true);
        try {
            // Transform cart for backend
            const items = cart.map(item => ({
                product_id: item.id,
                quantity: item.quantity,
                retailer_price: item.retailer_price,
                beauty_price: item.beauty_price,
                name: item.name
            }));

            // Pass collected amount (paidAmount)
            const result = await createOrderForClient(shopId, items, collectedAmount, brandId, notes, undefined, paymentDue ? new Date(paymentDue).toISOString() : null);

            if (result.error) {
                notify.error("Failed to create order", result.error);
            } else {
                notify.success("Success", "Order created successfully");
                router.push(`/salesman/shop/${shopId}`);
            }
        } catch (e) {
            console.error(e);
            notify.error("Error", "Something went wrong while creating the order");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

    if (!shopId || !brandId) return <div className="p-8 text-center text-red-500">Invalid link parameters.</div>;

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="font-serif text-2xl font-bold text-[#1A1A1A]">Create New Order</h1>
                    <p className="text-[#6B6B6B]">for {shopName} ({shopRole})</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Product List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h2 className="font-semibold text-lg">Select Products</h2>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        {products
                            .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map(product => {
                                const price = getPrice(product);
                                const inCart = cart.find(c => c.id === product.id);
                                return (
                                    <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                        <div className="flex">
                                            <div className="w-24 h-24 bg-gray-100 flex-shrink-0">
                                                {product.images && product.images.length > 0 && (
                                                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                            <div className="p-3 flex-grow flex flex-col justify-between">
                                                <div>
                                                    <h3 className="font-medium line-clamp-1">{product.name}</h3>
                                                    <p className="font-bold text-[#C77D2E]">Rs. {price}</p>
                                                </div>

                                                {inCart ? (
                                                    <div className="flex items-center gap-3 bg-gray-50 rounded-md p-1 w-fit">
                                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(product.id, -1)}>
                                                            <Minus className="h-3 w-3" />
                                                        </Button>
                                                        <span className="text-sm font-medium w-4 text-center">{inCart.quantity}</span>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(product.id, 1)}>
                                                            <Plus className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => addToCart(product)}>
                                                        Add to Order
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                )
                            })}
                    </div>
                </div>

                {/* Bill Summary */}
                <div className="lg:col-span-1">
                    <div className="sticky top-4">
                        <Card className="shadow-lg border-t-4 border-t-[#C77D2E]">
                            <CardContent className="p-6 space-y-4">
                                <h2 className="font-serif text-xl font-bold flex items-center gap-2">
                                    <ShoppingCart className="h-5 w-5" /> Order Summary
                                </h2>

                                <div className="space-y-2 max-h-[30vh] overflow-y-auto">
                                    {cart.length === 0 ? (
                                        <p className="text-sm text-center text-muted-foreground py-4">Cart is empty</p>
                                    ) : (
                                        cart.map(item => (
                                            <div key={item.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                                                <div className="flex-1">
                                                    <p className="font-medium">{item.name}</p>
                                                    <p className="text-xs text-muted-foreground">{item.quantity} x Rs. {item.price}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">Rs. {item.price * item.quantity}</span>
                                                    <Trash className="h-3 w-3 text-red-400 cursor-pointer" onClick={() => removeFromCart(item.id)} />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <Separator />

                                <div className="space-y-3">
                                    <div className="flex justify-between text-lg font-bold">
                                        <span>Total Amount</span>
                                        <span>Rs. {totalAmount.toLocaleString()}</span>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-semibold uppercase text-muted-foreground">Payment Status</label>
                                            <Badge variant={collectedAmount >= totalAmount ? "default" : "outline"} className="text-[10px]">
                                                {collectedAmount >= totalAmount ? "FULL PAYMENT" : (collectedAmount === 0 ? "PENDING FULL" : "PARTIAL PAYMENT")}
                                            </Badge>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 text-[10px] h-8"
                                                onClick={() => setCollectedAmount(totalAmount)}
                                            >
                                                Paid Full
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 text-[10px] h-8"
                                                onClick={() => setCollectedAmount(0)}
                                            >
                                                Pending Full
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-semibold uppercase text-muted-foreground">Amount Collected</label>
                                        </div>    <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-gray-500">Rs.</span>
                                            <Input
                                                type="number"
                                                value={collectedAmount || ''}
                                                onChange={(e) => setCollectedAmount(Number(e.target.value))}
                                                className="pl-7 h-11 text-lg font-bold"
                                                placeholder="Amount collected now"
                                                min={0}
                                                max={totalAmount}
                                            />
                                        </div>
                                        {totalAmount > 0 && collectedAmount > 0 && collectedAmount < totalAmount && (
                                            <div className="flex justify-between text-xs text-orange-600 font-medium">
                                                <span>Partial Payment Mode</span>
                                                <Button
                                                    variant="link"
                                                    className="h-auto p-0 text-xs text-orange-600"
                                                    onClick={() => setCollectedAmount(0)}
                                                >
                                                    Switch to Full Pending
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-between text-sm font-medium pt-2 border-t">
                                        <span>New Pending Balance</span>
                                        <span className={newPendingAmount > 0 ? "text-red-600" : "text-green-600"}>
                                            Rs.{newPendingAmount.toLocaleString()}
                                        </span>
                                    </div>

                                    {!limitCheck.valid && (
                                        <div className="bg-red-50 p-2 rounded-md flex gap-2 text-xs text-red-600 border border-red-200">
                                            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                                            {limitCheck.message}
                                        </div>
                                    )}

                                    {newPendingAmount > 0 && (
                                        <div className="space-y-1 pt-2 border-t">
                                            <div className="flex justify-between items-center">
                                                <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
                                                    Payment Due Date <span className="text-red-500">*</span>
                                                </label>
                                            </div>
                                            <Input
                                                type="date"
                                                value={paymentDue}
                                                onChange={(e) => setPaymentDue(e.target.value)}
                                                min={new Date().toISOString().split('T')[0]}
                                                className="h-10"
                                                required
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Notes (Optional)</label>
                                    <Textarea
                                        placeholder="Delivery instructions, etc."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="text-sm"
                                    />
                                </div>

                                <Button
                                    className="w-full bg-[#C77D2E] hover:bg-[#B66D1E] text-white"
                                    size="lg"
                                    onClick={handleSubmit}
                                    disabled={cart.length === 0 || !limitCheck.valid || isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            {collectedAmount >= totalAmount ? "Create Paid Order" : "Create Order"}
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
