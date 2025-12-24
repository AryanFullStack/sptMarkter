"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable, Column } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Package, Search, Filter, ArrowUpRight, ArrowDownRight, RefreshCw, AlertCircle, Warehouse, Layers } from "lucide-react";
import { adjustStock } from "@/app/admin/actions";
import { cn } from "@/lib/utils";
import { notify } from "@/lib/notifications";

export default function SubAdminStockPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [adjustingProduct, setAdjustingProduct] = useState<any>(null);
    const [adjustment, setAdjustment] = useState({ quantity: 0, reason: "" });
    const [stockFilter, setStockFilter] = useState<"all" | "low" | "medium">("all");
    const supabase = createClient();

    useEffect(() => {
        loadProducts();
    }, []);

    async function loadProducts() {
        setLoading(true);
        try {
            const { data } = await supabase
                .from("products")
                .select("id, name, stock_quantity, brand:brands(name)")
                .order("name");

            setProducts(data || []);
        } catch (error) {
            console.error("Error loading products:", error);
            notify.error("Error", "Failed to load product registry");
        }
        setLoading(false);
    }

    const handleAdjustStock = async () => {
        if (!adjustingProduct || adjustment.quantity === 0) return;

        try {
            await adjustStock(adjustingProduct.id, adjustment.quantity, adjustment.reason);
            notify.success("Registry Updated", `${adjustingProduct.name} stock adjusted by ${adjustment.quantity} units.`);
            setAdjustingProduct(null);
            setAdjustment({ quantity: 0, reason: "" });
            loadProducts();
        } catch (error) {
            console.error("Error adjusting stock:", error);
            notify.error("Action Failed", "Failed to update inventory record");
        }
    };

    const columns: Column<any>[] = [
        {
            key: "name",
            header: "Product / Brand",
            sortable: true,
            render: (p) => (
                <div className="flex flex-col">
                    <p className="font-bold text-[#1A1A1A]">{p.name}</p>
                    <p className="text-[10px] uppercase tracking-widest text-[#2D5F3F] font-bold mt-0.5">{p.brand?.name || "Global Brand"}</p>
                </div>
            ),
        },
        {
            key: "stock_quantity",
            header: "Current Inventory",
            sortable: true,
            render: (p) => {
                const isLow = (p.stock_quantity || 0) < 10;
                return (
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className={cn(
                            "px-3 py-1 font-mono font-bold",
                            isLow ? "bg-red-50 text-red-700 border-red-100" : "bg-[#FDFCF9] text-[#1A1A1A] border-[#E8E8E8]"
                        )}>
                            {p.stock_quantity || 0} units
                        </Badge>
                        {isLow && <AlertCircle className="h-4 w-4 text-red-500 animate-pulse" />}
                    </div>
                );
            },
        },
        {
            key: "actions",
            header: "Operational Control",
            render: (p) => (
                <Button
                    size="sm"
                    variant="ghost"
                    className="group border border-transparent hover:border-[#2D5F3F] hover:bg-white text-[#2D5F3F] transition-all font-bold"
                    onClick={() => setAdjustingProduct(p)}
                >
                    <RefreshCw className="h-4 w-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                    Adjust Registry
                </Button>
            ),
        },
    ];

    const stats = {
        total: products.length,
        lowStock: products.filter(p => (p.stock_quantity || 0) <= 10).length,
        mediumStock: products.filter(p => {
            const stock = p.stock_quantity || 0;
            return stock > 10 && stock <= 50;
        }).length
    };

    const filteredProducts = products.filter(p => {
        const stock = p.stock_quantity || 0;
        if (stockFilter === "low") return stock <= 10;
        if (stockFilter === "medium") return stock > 10 && stock <= 50;
        return true;
    });

    const toggleFilter = (filter: "low" | "medium" | "all") => {
        setStockFilter(prev => prev === filter ? "all" : filter);
    };

    return (
        <div className="space-y-10">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[#E8E8E8] pb-8">
                <div>
                    <h1 className="font-serif text-4xl font-bold text-[#1A1A1A] tracking-tight">Product Registry</h1>
                    <p className="text-[#6B6B6B] mt-1 text-lg flex items-center gap-2">
                        <Warehouse className="h-5 w-5 text-[#2D5F3F]" />
                        Inventory management and stock audit desk
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="flex flex-col items-end">
                        <p className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-widest">Global SKUs</p>
                        <p className="text-2xl font-bold text-[#1A1A1A]">{products?.length || 0}</p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card
                    className={cn(
                        "border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all cursor-pointer ring-2 ring-transparent",
                        stockFilter === "low" && "ring-red-500 shadow-md bg-red-50/10"
                    )}
                    onClick={() => toggleFilter("low")}
                >
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-widest">
                            Low Stock Alert
                        </CardTitle>
                        <AlertCircle className={cn("h-4 w-4", stockFilter === "low" ? "text-red-600" : "text-red-500")} />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className={cn("text-3xl font-bold", stockFilter === "low" ? "text-red-700" : "text-red-600")}>
                                {stats.lowStock}
                            </span>
                            <span className="text-[10px] font-medium text-[#6B6B6B]">Items &lt; 10 units</span>
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className={cn(
                        "border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all cursor-pointer ring-2 ring-transparent",
                        stockFilter === "medium" && "ring-[#C77D2E] shadow-md bg-[#C77D2E]/5"
                    )}
                    onClick={() => toggleFilter("medium")}
                >
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-widest">
                            Medium Stock
                        </CardTitle>
                        <Package className={cn("h-4 w-4", stockFilter === "medium" ? "text-[#B06A20]" : "text-[#C77D2E]")} />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className={cn("text-3xl font-bold", stockFilter === "medium" ? "text-[#B06A20]" : "text-[#C77D2E]")}>
                                {stats.mediumStock}
                            </span>
                            <span className="text-[10px] font-medium text-[#6B6B6B]">Items 10-50 units</span>
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className={cn(
                        "border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all cursor-pointer ring-2 ring-transparent",
                        stockFilter === "all" && "ring-[#2D5F3F] shadow-md bg-[#2D5F3F]/5"
                    )}
                    onClick={() => setStockFilter("all")}
                >
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-widest">
                            Total Products
                        </CardTitle>
                        <Layers className={cn("h-4 w-4", stockFilter === "all" ? "text-[#1E4D2B]" : "text-[#2D5F3F]")} />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className={cn("text-3xl font-bold", stockFilter === "all" ? "text-[#1A1A1A]" : "text-[#1A1A1A]")}>
                                {stats.total}
                            </span>
                            <span className="text-[10px] font-medium text-[#6B6B6B]">Managed SKUs</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-[#F7F5F2]/50 border-b border-[#E8E8E8] px-8 py-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="font-serif text-2xl">
                                {stockFilter === "low" ? "Low Stock Registry" : stockFilter === "medium" ? "Medium Stock Registry" : "Inventory Stream"}
                            </CardTitle>
                            <CardDescription>
                                {stockFilter === "low" ? "Viewing products requiring immediate attention" : stockFilter === "medium" ? "Viewing products with moderate stock levels" : "Live tracking of all product stock levels"}
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            {stockFilter !== "all" && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setStockFilter("all")}
                                    className="text-xs font-bold text-[#6B6B6B] hover:text-[#1A1A1A]"
                                >
                                    Clear Filter
                                </Button>
                            )}
                            <Button variant="outline" size="icon" className="h-10 w-10 border-[#E8E8E8] bg-white" onClick={loadProducts}><RefreshCw className="h-4 w-4 text-[#6B6B6B]" /></Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="p-4 lg:p-8">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-24 gap-4">
                                <div className="w-12 h-12 border-4 border-[#FDFCF9] border-t-[#2D5F3F] rounded-full animate-spin" />
                                <p className="text-[#6B6B6B] font-medium italic">Scanning Registry...</p>
                            </div>
                        ) : (
                            <DataTable
                                data={filteredProducts}
                                columns={columns}
                                searchable
                                searchPlaceholder="Track product name or brand..."
                                className="border-none"
                            />
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Adjustment Modal */}
            {adjustingProduct && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <Card className="w-full max-w-lg border-none shadow-2xl overflow-hidden">
                        <div className="bg-[#1A1A1A] p-8 text-white">
                            <Badge className="bg-[#2D5F3F] mb-4">Official Adjustment Entry</Badge>
                            <CardTitle className="font-serif text-3xl font-bold">Adjust Registry</CardTitle>
                            <CardDescription className="text-gray-400 mt-2 text-lg">
                                Current Integrity: {adjustingProduct.stock_quantity || 0} units for <span className="text-white font-bold">{adjustingProduct.name}</span>
                            </CardDescription>
                        </div>
                        <CardContent className="space-y-6 p-8 bg-white">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase tracking-widest font-bold text-[#6B6B6B]">Delta Quantity</Label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            value={adjustment.quantity}
                                            onChange={(e) =>
                                                setAdjustment({ ...adjustment, quantity: parseInt(e.target.value) || 0 })
                                            }
                                            className="h-14 text-xl font-bold pl-12 border-[#E8E8E8] focus:border-[#2D5F3F] transition-all"
                                            placeholder="0"
                                        />
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                            {adjustment.quantity >= 0 ? <ArrowUpRight className="h-6 w-6 text-green-500" /> : <ArrowDownRight className="h-6 w-6 text-red-500" />}
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-[#6B6B6B] font-medium italic">
                                        Projected Balance: <span className="text-[#1A1A1A] font-bold">{(adjustingProduct.stock_quantity || 0) + adjustment.quantity} units</span>
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase tracking-widest font-bold text-[#6B6B6B]">Reason Code</Label>
                                    <Input
                                        value={adjustment.reason}
                                        onChange={(e) => setAdjustment({ ...adjustment, reason: e.target.value })}
                                        placeholder="Restocked, Damaged, Return"
                                        className="h-14 border-[#E8E8E8] focus:border-[#2D5F3F] transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setAdjustingProduct(null);
                                        setAdjustment({ quantity: 0, reason: "" });
                                    }}
                                    className="flex-1 h-14 border-[#E8E8E8] text-[#1A1A1A] hover:bg-[#FDFCF9] font-bold"
                                >
                                    Cancel Action
                                </Button>
                                <Button
                                    onClick={handleAdjustStock}
                                    disabled={adjustment.quantity === 0}
                                    className="flex-1 h-14 bg-[#1A1A1A] hover:bg-[#333333] text-white font-bold shadow-lg shadow-black/10"
                                >
                                    Confirm Adjustment
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}