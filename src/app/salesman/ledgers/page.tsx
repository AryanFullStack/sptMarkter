"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/supabase/client";
import { getSalesmanDashboardData } from "@/app/actions/salesman-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Users, Loader2 } from "lucide-react";
import Link from "next/link";

export default function LedgersPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const dashboardData = await getSalesmanDashboardData(user.id);
            setData(dashboardData);
        }
        setLoading(false);
    }

    if (loading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin" /></div>;
    if (!data) return null;

    const { shopLedgers } = data;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-serif text-3xl font-bold text-[#1A1A1A]">Shop Ledgers</h1>
                <p className="text-[#6B6B6B]">Overview of pending amounts for each shop under your brands</p>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Shop Name</TableHead>
                                    <TableHead className="text-right">Total Pending</TableHead>
                                    <TableHead className="text-right">Last Order</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {shopLedgers?.map((sl: any) => (
                                    <TableRow key={sl.id}>
                                        <TableCell className="font-medium">{sl.name}</TableCell>
                                        <TableCell className="text-right text-red-600 font-bold">Rs. {Number(sl.pending).toLocaleString()}</TableCell>
                                        <TableCell className="text-right text-xs text-[#6B6B6B]">{new Date(sl.last_updated).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/salesman/shop/${sl.id}`}>
                                                <Button variant="ghost" size="sm" className="text-[#D4AF37]">View Ledger</Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {(!shopLedgers || shopLedgers.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-[#6B6B6B]">No shop ledgers found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
