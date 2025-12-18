"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, Column } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/utils/export-utils";
import { Activity } from "lucide-react";

export default function SubAdminActivityPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        loadActivity();
    }, []);

    async function loadActivity() {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from("audit_logs")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(100);

        setLogs(data || []);
        setLoading(false);
    }

    const columns: Column<any>[] = [
        {
            key: "created_at",
            header: "Date & Time",
            sortable: true,
            render: (log) => formatDate(log.created_at, true),
        },
        {
            key: "action",
            header: "Action",
            render: (log) => <Badge variant="outline">{log.action}</Badge>,
        },
        {
            key: "entity_type",
            header: "Entity",
            render: (log) => log.entity_type,
        },
        {
            key: "entity_id",
            header: "Entity ID",
            render: (log) => (
                <span className="font-mono text-xs">{log.entity_id?.substring(0, 8)}...</span>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-serif text-4xl font-semibold text-[#1A1A1A]">
                    My Activity
                </h1>
                <p className="text-[#6B6B6B] mt-2">
                    Track your actions and changes
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="font-serif text-2xl flex items-center gap-2">
                        <Activity className="h-6 w-6" />
                        Activity History
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-12 text-[#6B6B6B]">Loading...</div>
                    ) : (
                        <DataTable
                            data={logs}
                            columns={columns}
                            searchable
                            searchPlaceholder="Search activity..."
                            emptyMessage="No activity found"
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
