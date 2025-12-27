"use client";

import { useState, useEffect } from "react";
import { getAuditLogsAction } from "@/app/admin/actions/audit-logs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/utils/export-utils";
import { Activity, Clock, ShoppingBag, DollarSign, UserCheck, Trash2, UserCog } from "lucide-react";

interface SalesmanActivityFeedProps {
    userId: string;
}

export function SalesmanActivityFeed({ userId }: SalesmanActivityFeedProps) {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId) {
            loadLogs();
        }
    }, [userId]);

    async function loadLogs() {
        setLoading(true);
        const data = await getAuditLogsAction({ userId, limit: 10 });
        setLogs(data);
        setLoading(false);
    }

    const getActionIcon = (action: string) => {
        if (action.includes("ORDER")) return <ShoppingBag className="h-4 w-4 text-blue-500" />;
        if (action.includes("PAYMENT")) return <DollarSign className="h-4 w-4 text-green-500" />;
        if (action.includes("APPROVED")) return <UserCheck className="h-4 w-4 text-emerald-500" />;
        if (action.includes("DELETED")) return <Trash2 className="h-4 w-4 text-red-500" />;
        if (action.includes("ROLE")) return <UserCog className="h-4 w-4 text-purple-500" />;
        return <Activity className="h-4 w-4 text-gray-500" />;
    };

    const formatLogDetails = (log: any) => {
        const { changes, action } = log;
        if (!changes) return log.action.replace(/_/g, " ");

        if (action === "ORDER_CREATED") {
            return `Created order #${changes.order_number?.substring(0, 8)} for Rs. ${changes.total_amount}`;
        }
        if (action === "PAYMENT_RECORDED") {
            return `Recorded payment of Rs. ${changes.amount} via ${changes.payment_method}`;
        }
        if (action === "PAYMENT_REQUESTED") {
            return `Requested payment of Rs. ${changes.amount}`;
        }

        return action.replace(/_/g, " ");
    };

    if (loading) {
        return (
            <Card className="border-none shadow-sm bg-white animate-pulse">
                <CardHeader>
                    <div className="h-6 w-32 bg-gray-200 rounded" />
                </CardHeader>
                <CardContent className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex gap-4">
                            <div className="h-10 w-10 bg-gray-200 rounded-full" />
                            <div className="space-y-2 flex-1">
                                <div className="h-4 bg-gray-200 rounded w-3/4" />
                                <div className="h-3 bg-gray-200 rounded w-1/4" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-none shadow-sm bg-white">
            <CardHeader>
                <CardTitle className="font-serif text-xl flex items-center gap-2">
                    <Activity className="h-5 w-5 text-[#D4AF37]" /> Recent Activity
                </CardTitle>
                <CardDescription>Your latest system interactions</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {logs.length > 0 ? (
                        logs.map((log) => (
                            <div key={log.id} className="flex gap-4 items-start group">
                                <div className="mt-1 w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:bg-[#D4AF37]/10 transition-colors shrink-0">
                                    {getActionIcon(log.action)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[#1A1A1A] leading-none mb-1">
                                        {formatLogDetails(log)}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-[#6B6B6B]">
                                        <Clock className="h-3 w-3" />
                                        <span>{formatDate(log.created_at, true)}</span>
                                        <Badge variant="outline" className="text-[10px] py-0 h-4 border-gray-200 bg-gray-50/50">
                                            {log.entity_type}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-[#6B6B6B] italic">
                            No recent activity found.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
