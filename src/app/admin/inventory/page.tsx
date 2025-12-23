"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable, Column } from "@/components/shared/data-table";
import { ExportButton } from "@/components/shared/export-button";
import { adjustStock } from "@/app/admin/actions";
import { Package, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { formatDate } from "@/utils/export-utils";
import { notify } from "@/lib/notifications";
import { cn } from "@/lib/utils";

interface Product {
    id: string;
    name: string;
    stock_quantity: number | null;
    brand?: { name: string };
}

export default function InventoryPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [inventoryLogs, setInventoryLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
    const [adjustment, setAdjustment] = useState({ quantity: 0, reason: "" });

    const [stockFilter, setStockFilter] = useState<"all" | "low" | "medium">("all");
    const supabase = createClient();

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);

        const [productsData, logsData] = await Promise.all([
            supabase
                .from("products")
                .select("id, name, stock_quantity, brand:brands(name)")
                .order("stock_quantity", { ascending: true }),
            supabase
                .from("inventory_logs")
                .select("*, product:products(name), user:created_by(full_name)")
                .order("created_at", { ascending: false })
                .limit(50)
        ]);

        const products = (productsData.data || []).map((p: any) => ({
            ...p,
            brand: p.brand?.[0] || { name: "N/A" }
        }));
        setProducts(products);
        setInventoryLogs(logsData.data || []);
        setLoading(false);
    }

    const handleAdjustStock = async () => {
        if (!adjustingProduct || adjustment.quantity === 0) return;

        try {
            await adjustStock(adjustingProduct.id, adjustment.quantity, adjustment.reason);
            notify.success("Stock Adjusted", `Inventory for ${adjustingProduct.name} has been updated.`);
            setAdjustingProduct(null);
            setAdjustment({ quantity: 0, reason: "" });
            loadData();
        } catch (error) {
            console.error("Error adjusting stock:", error);
            notify.error("Error", "Failed to adjust stock. Please try again.");
        }
    };

    const productColumns: Column<Product>[] = [
        {
            key: "name",
            header: "Product",
            sortable: true,
            render: (p) => (
                <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-sm text-[#6B6B6B]">{p.brand?.name}</p>
                </div>
            )
        },
        {
            key: "stock_quantity",
            header: "Stock",
            sortable: true,
            render: (p) => {
                const stock = p.stock_quantity || 0;
                return (
                    <Badge
                        variant="outline"
                        className={stock <= 10 ? "text-[#8B3A3A]" : stock <= 50 ? "text-[#C77D2E]" : "text-[#2D5F3F]"}
                    >
                        {stock} units
                    </Badge>
                );
            }
        },
        {
            key: "actions",
            header: "Actions",
            render: (p) => (
                <Button size="sm" onClick={() => setAdjustingProduct(p)}>
                    Adjust Stock
                </Button>
            )
        }
    ];

    const logColumns: Column<any>[] = [
        {
            key: "created_at",
            header: "Date",
            sortable: true,
            render: (log) => formatDate(log.created_at, true)
        },
        {
            key: "product",
            header: "Product",
            render: (log) => log.product?.name || "N/A"
        },
        {
            key: "quantity_change",
            header: "Change",
            render: (log) => (
                <div className="flex items-center gap-1">
                    {log.quantity_change > 0 ? (
                        <TrendingUp className="h-4 w-4 text-[#2D5F3F]" />
                    ) : (
                        <TrendingDown className="h-4 w-4 text-[#8B3A3A]" />
                    )}
                    <span className={log.quantity_change > 0 ? "text-[#2D5F3F]" : "text-[#8B3A3A]"}>
                        {log.quantity_change > 0 ? "+" : ""}{log.quantity_change}
                    </span>
                </div>
            )
        },
        {
            key: "previous_quantity",
            header: "Previous",
            render: (log) => log.previous_quantity
        },
        {
            key: "new_quantity",
            header: "New",
            render: (log) => log.new_quantity
        },
        {
            key: "reason",
            header: "Reason",
            render: (log) => log.reason || "-"
        },
        {
            key: "user",
            header: "By",
            render: (log) => log.user?.full_name || "System"
        }
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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="font-serif text-4xl font-semibold text-[#1A1A1A]">
                        Inventory Management
                    </h1>
                    <p className="text-[#6B6B6B] mt-2">
                        Monitor stock levels and adjust inventory
                    </p>
                </div>
                <ExportButton data={products} filename="inventory-export" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card
                    className={cn(
                        "cursor-pointer transition-all hover:shadow-md ring-2 ring-transparent",
                        stockFilter === "low" && "ring-red-500 bg-red-50/10 shadow-md"
                    )}
                    onClick={() => toggleFilter("low")}
                >
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-[#6B6B6B]">
                            Low Stock Alert
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <AlertTriangle className={cn("h-5 w-5", stockFilter === "low" ? "text-red-700" : "text-[#8B3A3A]")} />
                            <span className={cn("text-2xl font-bold", stockFilter === "low" ? "text-red-700" : "text-[#8B3A3A]")}>
                                {stats.lowStock}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className={cn(
                        "cursor-pointer transition-all hover:shadow-md ring-2 ring-transparent",
                        stockFilter === "medium" && "ring-orange-500 bg-orange-50/10 shadow-md"
                    )}
                    onClick={() => toggleFilter("medium")}
                >
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-[#6B6B6B]">
                            Medium Stock
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Package className={cn("h-5 w-5", stockFilter === "medium" ? "text-orange-700" : "text-[#C77D2E]")} />
                            <span className={cn("text-2xl font-bold", stockFilter === "medium" ? "text-orange-700" : "text-[#C77D2E]")}>
                                {stats.mediumStock}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className={cn(
                        "cursor-pointer transition-all hover:shadow-md ring-2 ring-transparent",
                        stockFilter === "all" && "ring-[#2D5F3F] bg-[#2D5F3F]/5 shadow-md"
                    )}
                    onClick={() => setStockFilter("all")}
                >
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-[#6B6B6B]">
                            Total Products
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Package className={cn("h-5 w-5", stockFilter === "all" ? "text-[#1E4D2B]" : "text-[#D4AF37]")} />
                            <span className="text-2xl font-bold text-[#1A1A1A]">
                                {stats.total}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Products Table */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="font-serif text-2xl">
                            {stockFilter === "low" ? "Low Stock Items" : stockFilter === "medium" ? "Medium Stock Items" : "Stock Levels"}
                        </CardTitle>
                    </div>
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
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-12 text-[#6B6B6B]">Loading...</div>
                    ) : (
                        <DataTable
                            data={filteredProducts}
                            columns={productColumns}
                            searchable
                            searchPlaceholder="Search products..."
                        />
                    )}
                </CardContent>
            </Card>

            {/* Inventory Logs */}
            <Card>
                <CardHeader>
                    <CardTitle className="font-serif text-2xl">Recent Adjustments</CardTitle>
                </CardHeader>
                <CardContent>
                    <DataTable
                        data={inventoryLogs}
                        columns={logColumns}
                        emptyMessage="No inventory adjustments yet"
                    />
                </CardContent>
            </Card>

            {/* Adjustment Modal */}
            {adjustingProduct && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle className="font-serif text-2xl">Adjust Stock</CardTitle>
                            <p className="text-sm text-[#6B6B6B]">{adjustingProduct.name}</p>
                            <p className="text-sm">Current: {adjustingProduct.stock_quantity || 0} units</p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Quantity Change</Label>
                                <Input
                                    type="number"
                                    value={adjustment.quantity}
                                    onChange={(e) => setAdjustment({ ...adjustment, quantity: parseInt(e.target.value) || 0 })}
                                    placeholder="Enter positive or negative number"
                                />
                                <p className="text-xs text-[#6B6B6B] mt-1">
                                    New stock: {(adjustingProduct.stock_quantity || 0) + adjustment.quantity}
                                </p>
                            </div>

                            <div>
                                <Label>Reason</Label>
                                <Input
                                    value={adjustment.reason}
                                    onChange={(e) => setAdjustment({ ...adjustment, reason: e.target.value })}
                                    placeholder="e.g., Restocked, Damaged, Sold"
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setAdjustingProduct(null);
                                        setAdjustment({ quantity: 0, reason: "" });
                                    }}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleAdjustStock}
                                    disabled={adjustment.quantity === 0}
                                    className="flex-1"
                                >
                                    Confirm
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
