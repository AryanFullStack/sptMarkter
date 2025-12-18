"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable, Column } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import { adjustStock } from "@/app/admin/actions";

export default function SubAdminStockPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [adjustingProduct, setAdjustingProduct] = useState<any>(null);
    const [adjustment, setAdjustment] = useState({ quantity: 0, reason: "" });
    const supabase = createClient();

    useEffect(() => {
        loadProducts();
    }, []);

    async function loadProducts() {
        // Sub-admins might have assigned brands - for now show all
        const { data } = await supabase
            .from("products")
            .select("id, name, stock_quantity, brand:brands(name)")
            .order("name");

        setProducts(data || []);
        setLoading(false);
    }

    const handleAdjustStock = async () => {
        if (!adjustingProduct || adjustment.quantity === 0) return;

        try {
            await adjustStock(adjustingProduct.id, adjustment.quantity, adjustment.reason);
            setAdjustingProduct(null);
            setAdjustment({ quantity: 0, reason: "" });
            loadProducts();
        } catch (error) {
            console.error("Error adjusting stock:", error);
            alert("Failed to adjust stock");
        }
    };

    const columns: Column<any>[] = [
        {
            key: "name",
            header: "Product",
            sortable: true,
            render: (p) => (
                <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-sm text-[#6B6B6B]">{p.brand?.name}</p>
                </div>
            ),
        },
        {
            key: "stock_quantity",
            header: "Current Stock",
            sortable: true,
            render: (p) => (
                <Badge variant="outline">{p.stock_quantity || 0} units</Badge>
            ),
        },
        {
            key: "actions",
            header: "Actions",
            render: (p) => (
                <Button size="sm" onClick={() => setAdjustingProduct(p)}>
                    Adjust
                </Button>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-serif text-4xl font-semibold text-[#1A1A1A]">
                    Stock Management
                </h1>
                <p className="text-[#6B6B6B] mt-2">
                    Manage inventory for assigned products
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="font-serif text-2xl flex items-center gap-2">
                        <Package className="h-6 w-6" />
                        Products
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-12 text-[#6B6B6B]">Loading...</div>
                    ) : (
                        <DataTable
                            data={products}
                            columns={columns}
                            searchable
                            searchPlaceholder="Search products..."
                        />
                    )}
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
                                    onChange={(e) =>
                                        setAdjustment({ ...adjustment, quantity: parseInt(e.target.value) || 0 })
                                    }
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
                                    placeholder="e.g., Restocked, Damaged"
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
