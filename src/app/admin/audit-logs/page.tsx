"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, Column } from "@/components/shared/data-table";
import { ExportButton } from "@/components/shared/export-button";
import { getAuditLogs } from "@/utils/audit-logger";
import { formatDate } from "@/utils/export-utils";
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLogs();
    }, []);

    async function loadLogs() {
        setLoading(true);
        const data = await getAuditLogs({ limit: 100 });
        setLogs(data);
        setLoading(false);
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
            render: (log) => (
                <Badge variant="outline">{log.action}</Badge>
            )
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
            header: "Changes",
            render: (log) => (
                <pre className="text-xs max-w-xs overflow-x-auto">
                    {log.changes ? JSON.stringify(log.changes, null, 2) : "-"}
                </pre>
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
