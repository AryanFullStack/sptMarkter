"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, Column } from "@/components/shared/data-table";
import { formatCurrency, formatDate } from "@/utils/export-utils";
import { Badge } from "@/components/ui/badge";
import { DollarSign } from "lucide-react";

interface Payment {
    id: string;
    amount: number;
    payment_method: string;
    created_at: string;
    notes?: string;
    order?: { order_number: string };
}

interface PaymentHistoryProps {
    payments: Payment[];
}

export function PaymentHistory({ payments }: PaymentHistoryProps) {
    const columns: Column<Payment>[] = [
        {
            key: "created_at",
            header: "Date",
            sortable: true,
            render: (p) => formatDate(p.created_at, true),
        },
        {
            key: "order",
            header: "Order",
            render: (p) => (
                <span className="font-mono text-sm">
                    #{p.order?.order_number || "N/A"}
                </span>
            ),
        },
        {
            key: "amount",
            header: "Amount",
            sortable: true,
            render: (p) => (
                <span className="font-semibold text-[#2D5F3F]">
                    {formatCurrency(p.amount)}
                </span>
            ),
        },
        {
            key: "payment_method",
            header: "Method",
            render: (p) => (
                <Badge variant="outline" className="capitalize">
                    {p.payment_method.replace("_", " ")}
                </Badge>
            ),
        },
        {
            key: "notes",
            header: "Notes",
            render: (p) => p.notes || "-",
        },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-serif text-2xl flex items-center gap-2">
                    <DollarSign className="h-6 w-6 text-[#2D5F3F]" />
                    Payment History
                </CardTitle>
            </CardHeader>
            <CardContent>
                <DataTable
                    data={payments}
                    columns={columns}
                    emptyMessage="No payment history available"
                />
            </CardContent>
        </Card>
    );
}
