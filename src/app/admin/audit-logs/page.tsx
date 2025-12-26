"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, Column } from "@/components/shared/data-table";
import { ExportButton } from "@/components/shared/export-button";
import { getAuditLogsAction } from "@/app/admin/actions/audit-logs";
import { formatDate } from "@/utils/export-utils";
import { Badge } from "@/components/ui/badge";

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLogs();
    }, []);

    async function loadLogs() {
        setLoading(true);
        const data = await getAuditLogsAction({ limit: 100 });
        setLogs(data);
        setLoading(false);
    }

    // Helper function to format changes in a readable way
    function formatChanges(changes: any, action: string): string {
        if (!changes) return "-";

        const details: string[] = [];

        // Payment-related actions
        if (action === "PAYMENT_RECORDED" || action === "PARTIAL_PAYMENT_RECORDED") {
            if (changes.amount) details.push(`Amount: Rs. ${changes.amount}`);
            if (changes.payment_method) details.push(`Method: ${changes.payment_method}`);
            if (changes.newPaidAmount !== undefined) details.push(`Paid: Rs. ${changes.newPaidAmount}`);
            if (changes.newPendingAmount !== undefined) details.push(`Pending: Rs. ${changes.newPendingAmount}`);
            if (changes.notes) details.push(`Notes: ${changes.notes}`);
        }
        // Order-related actions
        else if (action.includes("ORDER")) {
            if (changes.order_number) details.push(`Order: ${changes.order_number}`);
            if (changes.total_amount) details.push(`Total: Rs. ${changes.total_amount}`);
            if (changes.paid_amount !== undefined) details.push(`Paid: Rs. ${changes.paid_amount}`);
            if (changes.status) details.push(`Status: ${changes.status}`);
            if (changes.newStatus) details.push(`To: ${changes.newStatus}`);
        }
        // User-related actions
        else if (action.includes("USER")) {
            if (changes.role) details.push(`Role: ${changes.role}`);
            if (changes.email) details.push(`Email: ${changes.email}`);
            if (changes.full_name) details.push(`Name: ${changes.full_name}`);
            if (changes.approved !== undefined) details.push(`Approved: ${changes.approved}`);
            if (changes.is_active !== undefined) details.push(`Active: ${changes.is_active}`);
        }
        // Inventory-related actions
        else if (action.includes("INVENTORY")) {
            if (changes.previousQuantity !== undefined) details.push(`Prev: ${changes.previousQuantity}`);
            if (changes.newQuantity !== undefined) details.push(`New: ${changes.newQuantity}`);
            if (changes.quantityChange !== undefined) details.push(`Change: ${changes.quantityChange}`);
            if (changes.reason) details.push(`Reason: ${changes.reason}`);
        }
        // Generic fallback
        else {
            Object.keys(changes).forEach(key => {
                if (key !== "order_id" && key !== "entity_id" && !key.includes("_id") && changes[key] !== null && changes[key] !== undefined && typeof changes[key] !== 'object') {
                    details.push(`${key}: ${changes[key]}`);
                }
            });
        }

        return details.length > 0 ? details.join(" | ") : "-";
    }

    const columns: Column<any>[] = [
        {
            key: "created_at",
            header: "Timestamp",
            sortable: true,
            render: (log) => formatDate(log.created_at, true)
        },
        {
            key: "action",
            header: "Action",
            sortable: true,
            render: (log) => {
                const action = log.action;
                let variant: "default" | "outline" | "secondary" | "destructive" = "outline";

                if (action.includes("CREATED") || action.includes("APPROVED")) variant = "default";
                if (action.includes("DELETED") || action.includes("REJECTED")) variant = "destructive";
                if (action.includes("PAYMENT")) variant = "secondary";

                return (
                    <Badge variant={variant} className="whitespace-nowrap">
                        {action.replace(/_/g, " ")}
                    </Badge>
                );
            }
        },
        {
            key: "entity_type",
            header: "Entity",
            sortable: true,
            render: (log) => log.entity_type
        },
        {
            key: "users",
            header: "User",
            render: (log) => (
                <div>
                    <p className="font-medium">{log.users?.full_name || "System"}</p>
                    <p className="text-sm text-[#6B6B6B]">{log.users?.role}</p>
                </div>
            )
        },
        {
            key: "changes",
            header: "Details",
            render: (log) => (
                <div className="text-xs max-w-md">
                    <p className="text-[#1A1A1A]">{formatChanges(log.changes, log.action)}</p>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="font-serif text-4xl font-semibold text-[#1A1A1A]">
                        Audit Logs
                    </h1>
                    <p className="text-[#6B6B6B] mt-2">
                        Track all system activities and changes
                    </p>
                </div>
                <ExportButton data={logs} filename="audit-logs-export" />
            </div>

            <Card>
                <CardContent className="pt-6">
                    {loading ? (
                        <div className="text-center py-12 text-[#6B6B6B]">Loading logs...</div>
                    ) : (
                        <DataTable
                            data={logs}
                            columns={columns}
                            searchable
                            searchPlaceholder="Search logs..."
                            emptyMessage="No audit logs found"
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
