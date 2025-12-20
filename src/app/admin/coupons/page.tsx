"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, Column } from "@/components/shared/data-table";
import { Plus } from "lucide-react";
import { formatDate } from "@/utils/export-utils";
import { CouponForm } from "@/components/admin/coupon-form";

export default function CouponsPage() {
    const [coupons, setCoupons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);

    const supabase = createClient();

    useEffect(() => {
        loadCoupons();
    }, []);

    async function loadCoupons() {
        setLoading(true);
        const { data } = await supabase
            .from("coupons")
            .select("*")
            .order("created_at", { ascending: false });

        setCoupons(data || []);
        setLoading(false);
    }

    const columns: Column<any>[] = [
        {
            key: "code",
            header: "Code",
            sortable: true,
            render: (c) => <Badge className="font-mono">{c.code}</Badge>
        },
        {
            key: "description",
            header: "Description",
            render: (c) => c.description || "-"
        },
        {
            key: "discount_value",
            header: "Discount",
            render: (c) =>
                c.discount_type === "percentage" ? `${c.discount_value}%` : `Rs. ${c.discount_value}`
        },
        {
            key: "usage_count",
            header: "Usage",
            render: (c) => `${c.usage_count || 0} / ${c.usage_limit || "∞"}`
        },
        {
            key: "valid_until",
            header: "Valid Until",
            sortable: true,
            render: (c) => c.valid_until ? formatDate(c.valid_until) : "No expiry"
        },
        {
            key: "is_active",
            header: "Status",
            render: (c) =>
                c.is_active ?
                    <Badge className="bg-[#2D5F3F] text-white">Active</Badge> :
                    <Badge variant="outline">Inactive</Badge>
        },
        {
            key: "actions",
            header: "Actions",
            render: (c) => (
                <Button size="sm" variant="outline" onClick={() => {
                    setEditingCoupon(c);
                    setShowForm(true);
                }}>
                    Edit
                </Button>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="font-serif text-4xl font-semibold text-[#1A1A1A]">
                        Coupon Management
                    </h1>
                    <p className="text-[#6B6B6B] mt-2">
                        Create and manage promotional coupons
                    </p>
                </div>
                <Button onClick={() => setShowForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Coupon
                </Button>
            </div>

            <Card>
                <CardContent className="pt-6">
                    {loading ? (
                        <div className="text-center py-12 text-[#6B6B6B]">Loading coupons...</div>
                    ) : (
                        <DataTable
                            data={coupons}
                            columns={columns}
                            searchable
                            searchPlaceholder="Search coupons..."
                        />
                    )}
                </CardContent>
            </Card>

            {showForm && (
                <CouponForm
                    coupon={editingCoupon}
                    onClose={() => {
                        setShowForm(false);
                        setEditingCoupon(null);
                        loadCoupons();
                    }}
                />
            )}
        </div>
    );
}
