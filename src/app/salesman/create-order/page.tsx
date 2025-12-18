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
    ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
    id: string;
    name: string;
    price: number;
    beauty_price: number;
    retailer_price: number;
    quantity: number;
    image_url?: string;
}

export default function CreateOrderPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();

    const shopId = searchParams.get("shopId");
    const brandId = searchParams.get("brandId");

    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<any[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [shopRole, setShopRole] = useState<string>("local_customer");
    const [shopName, setShopName] = useState("");
    const [financialStatus, setFinancialStatus] = useState<any>(null);
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Check limit state
    const [limitCheck, setLimitCheck] = useState<{ valid: boolean; message?: string }>({ valid: true });

    useEffect(() => {
        if (shopId && brandId) {
            loadData();
        }
    }, [shopId, brandId]);

    useEffect(() => {
        checkLimit();
    }, [cart, financialStatus]);

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
            toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }

    const getPrice = (product: any) => {
        return shopRole === "beauty_parlor" ? product.beauty_price : product.retailer_price;
    };

    const addToCart = (product: any) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { ...product, quantity: 1, price: getPrice(product) }];
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

    const checkLimit = () => {
        if (!financialStatus) return;

        const pendingLimit = financialStatus.pendingLimit;
        const currentPending = financialStatus.currentPending;
        const newTotalPending = currentPending + totalAmount;

        if (pendingLimit > 0 && newTotalPending > pendingLimit) {
            setLimitCheck({
                valid: false,
                message: `Pending Limit Exceeded! Available: ₹${Math.max(0, pendingLimit - currentPending).toLocaleString()}, Order: ₹${totalAmount.toLocaleString()}`
            });
        } else {
            setLimitCheck({ valid: true });
        }
    };

    const handleSubmit = async () => {
        if (!shopId || !brandId) return;
        if (cart.length === 0) {
            toast({ title: "Cart is empty", variant: "destructive" });
            return;
        }
        if (!limitCheck.valid) {
            toast({ title: "Limit Exceeded", description: limitCheck.message, variant: "destructive" });
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

            const result = await createOrderForClient(shopId, items, 0, brandId, notes); // Assuming 0 paid initially for now, usually credit

            if (result.error) {
                toast({ title: "Failed to create order", description: result.error, variant: "destructive" });
            } else {
                toast({ title: "Success", description: "Order created successfully" });
                router.push(`/salesman/shop/${shopId}`);
            }
        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
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
                    <h2 className="font-semibold text-lg">Select Products</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {products.map(product => {
                            const price = getPrice(product);
                            const inCart = cart.find(c => c.id === product.id);
                            return (
                                <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                    <div className="flex">
                                        <div className="w-24 h-24 bg-gray-100 flex-shrink-0">
                                            {product.image_url && (
                                                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                        <div className="p-3 flex-grow flex flex-col justify-between">
                                            <div>
                                                <h3 className="font-medium line-clamp-1">{product.name}</h3>
                                                <p className="font-bold text-[#C77D2E]">₹{price}</p>
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
                                                    <p className="text-xs text-muted-foreground">{item.quantity} x ₹{item.price}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">₹{item.price * item.quantity}</span>
                                                    <Trash className="h-3 w-3 text-red-400 cursor-pointer" onClick={() => removeFromCart(item.id)} />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <Separator />

                                <div className="space-y-1">
                                    <div className="flex justify-between text-lg font-bold">
                                        <span>Total Amount</span>
                                        <span>₹{totalAmount.toLocaleString()}</span>
                                    </div>
                                    {!limitCheck.valid && (
                                        <div className="bg-red-50 p-2 rounded-md flex gap-2 text-xs text-red-600 border border-red-200">
                                            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                                            {limitCheck.message}
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
                                            <CheckCircle className="mr-2 h-4 w-4" /> Creates Order (Credit)
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
