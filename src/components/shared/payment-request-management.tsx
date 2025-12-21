"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { notify } from "@/lib/notifications";
import { Check, Clock, DollarSign, User, Store, Tag, Loader2 } from "lucide-react";
import { getPaymentRequests, approvePaymentRequest } from "@/app/actions/salesman-actions";

interface PaymentRequestManagementProps {
    salesmanId?: string;
}

export function PaymentRequestManagement({ salesmanId }: PaymentRequestManagementProps) {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        loadRequests();
    }, [salesmanId]);

    async function loadRequests() {
        setLoading(true);
        try {
            const res = await getPaymentRequests(salesmanId);
            if (res.error) throw new Error(res.error);
            setRequests(res.requests || []);
        } catch (e: any) {
            notify.error("Error", e.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleApprove(id: string) {
        setActionLoading(id);
        try {
            const res = await approvePaymentRequest(id);
            if (res.error) throw new Error(res.error);
            notify.success("Success", "Payment approved and recorded.");
            loadRequests();
        } catch (e: any) {
            notify.error("Error", e.message);
        } finally {
            setActionLoading(null);
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-serif text-2xl flex items-center gap-2">
                    <Clock className="h-6 w-6 text-orange-500" />
                    Pending Payment Requests
                </CardTitle>
            </CardHeader>
            <CardContent>
                {requests.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Check className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>No pending payment requests.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Shop / Client</TableHead>
                                <TableHead>Order Details</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Requested On</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.map((req) => (
                                <TableRow key={req.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-semibold flex items-center gap-1">
                                                <Store className="h-3 w-3" /> {req.order?.user?.full_name || "Unknown"}
                                            </span>
                                            <span className="text-xs text-muted-foreground capitalize">
                                                {req.order?.user?.role?.replace("_", " ")}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-mono text-xs">#{req.order?.order_number}</span>
                                            <span className="text-xs flex items-center gap-1 text-purple-600">
                                                <Tag className="h-3 w-3" /> {
                                                    req.order?.brand?.name ||
                                                    (req.order?.items && Array.isArray(req.order.items) && req.order.items.length > 0
                                                        ? (req.order.items[0].brand_name || "Assigned Brand")
                                                        : "N/A")
                                                }
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-green-600">Rs. {req.amount.toLocaleString()}</span>
                                            <span className="text-[10px] text-muted-foreground">Total: Rs. {req.order?.total_amount?.toLocaleString()}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm">{new Date(req.created_at).toLocaleDateString()}</span>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            size="sm"
                                            className="bg-[#2D5F3F] hover:bg-[#1E422B] text-white"
                                            disabled={actionLoading === req.id}
                                            onClick={() => handleApprove(req.id)}
                                        >
                                            {actionLoading === req.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Check className="h-4 w-4 mr-1" />
                                            )}
                                            Approve & Collect
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
