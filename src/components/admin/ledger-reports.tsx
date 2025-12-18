"use client";

import { useState, useEffect } from "react";
import { getShopLedgerReports } from "@/app/actions/salesman-actions";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, DollarSign, AlertCircle } from "lucide-react";

export function LedgerReports() {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const { reports } = await getShopLedgerReports();
            setReports(reports || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div className="text-center py-8"><Loader2 className="animate-spin h-6 w-6 mx-auto" /></div>;
    }

    return (
        <Card>
            <CardContent className="pt-6">
                {reports.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>No ledger data found.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Shop Name</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead className="text-right">Total Limit</TableHead>
                                <TableHead className="text-right">Used Pending</TableHead>
                                <TableHead className="text-right">Available</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reports.map((report) => {
                                const limit = Number(report.pending_amount_limit || 0);
                                const used = Number(report.total_pending_used || 0);
                                const remaining = Number(report.remaining_limit || 0);
                                const percent = limit > 0 ? (used / limit) * 100 : 0;

                                return (
                                    <TableRow key={report.shop_id}>
                                        <TableCell className="font-medium">{report.shop_name}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{report.shop_phone || 'N/A'}</TableCell>
                                        <TableCell className="text-right">₹{limit.toLocaleString()}</TableCell>
                                        <TableCell className="text-right font-bold text-[#C77D2E]">₹{used.toLocaleString()}</TableCell>
                                        <TableCell className="text-right text-green-600">₹{remaining.toLocaleString()}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {remaining <= 0 && limit > 0 ? (
                                                    <Badge variant="destructive">Blocked</Badge>
                                                ) : percent > 80 ? (
                                                    <Badge className="bg-orange-500 hover:bg-orange-600">Warning</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-green-600 border-green-600">Safe</Badge>
                                                )}
                                                {percent >= 100 && <AlertCircle className="h-4 w-4 text-red-500" />}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
