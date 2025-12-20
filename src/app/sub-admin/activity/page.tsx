"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DataTable, Column } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/utils/export-utils";
import { Activity, History, Search, Filter, ShieldCheck, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function SubAdminActivityPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        loadActivity();
    }, []);

    async function loadActivity() {
        setLoading(true);
        try {
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
        } catch (error) {
            console.error("Error loading activity logs:", error);
        }
        setLoading(false);
    }

    const columns: Column<any>[] = [
        {
            key: "created_at",
            header: "Execution Timestamp",
            sortable: true,
            render: (log) => (
                <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-[#A0A0A0]" />
                    <span className="text-sm font-medium text-[#1A1A1A]">{formatDate(log.created_at, true)}</span>
                </div>
            ),
        },
        {
            key: "action",
            header: "Operational Action",
            render: (log) => (
                <Badge variant="outline" className={cn(
                    "px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                    log.action?.includes('create') ? "bg-green-50 text-green-700 border-green-100" :
                        log.action?.includes('delete') ? "bg-red-50 text-red-700 border-red-100" :
                            "bg-[#FDFCF9] text-[#1A1A1A] border-[#E8E8E8]"
                )}>
                    {log.action?.replace("_", " ")}
                </Badge>
            ),
        },
        {
            key: "entity_type",
            header: "Log Entity",
            render: (log) => (
                <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-[#2D5F3F]" />
                    <span className="text-sm font-semibold text-[#1A1A1A] capitalize">{log.entity_type}</span>
                </div>
            ),
        },
        {
            key: "entity_id",
            header: "Security Hash",
            render: (log) => (
                <code className="text-[10px] bg-[#F7F5F2] px-2 py-1 rounded font-mono text-[#6B6B6B]">
                    {log.entity_id?.substring(0, 12)}...
                </code>
            ),
        },
    ];

    return (
        <div className="space-y-10">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[#E8E8E8] pb-8">
                <div>
                    <h1 className="font-serif text-4xl font-bold text-[#1A1A1A] tracking-tight">Audit Trail</h1>
                    <p className="text-[#6B6B6B] mt-1 text-lg flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-[#2D5F3F]" />
                        Immutable record of operational maneuvers
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="flex flex-col items-end">
                        <p className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-widest">Logged Events</p>
                        <p className="text-2xl font-bold text-[#1A1A1A]">{logs?.length || 0}</p>
                    </div>
                </div>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-[#F7F5F2]/50 border-b border-[#E8E8E8] px-8 py-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="font-serif text-2xl text-[#1A1A1A]">History Stream</CardTitle>
                            <CardDescription>Chronological sequence of system interactions</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="icon" className="h-10 w-10 border-[#E8E8E8] bg-white"><Search className="h-4 w-4 text-[#6B6B6B]" /></Button>
                            <Button variant="outline" size="icon" className="h-10 w-10 border-[#E8E8E8] bg-white" onClick={loadActivity}><History className="h-4 w-4 text-[#6B6B6B]" /></Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="p-4 lg:p-8">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-24 gap-4">
                                <div className="w-12 h-12 border-4 border-[#FDFCF9] border-t-[#2D5F3F] rounded-full animate-spin" />
                                <p className="text-[#6B6B6B] font-medium italic">Decrypting Logs...</p>
                            </div>
                        ) : (
                            <DataTable
                                data={logs}
                                columns={columns}
                                searchable
                                searchPlaceholder="Track specific actions or entities..."
                                emptyMessage="No audit records discovered in current session"
                                className="border-none"
                            />
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

