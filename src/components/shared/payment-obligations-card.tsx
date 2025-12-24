"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Calendar } from "lucide-react";
import { format } from "date-fns";

interface PaymentObligation {
    id: string;
    order_number: string;
    total_amount: number;
    paid_amount: number;
    pending_amount: number;
    initial_payment_required?: number;
    initial_payment_status?: string;
    pending_payment_due_date?: string;
}

interface PaymentObligationsCardProps {
    orders: PaymentObligation[];
}

export function PaymentObligationsCard({ orders }: PaymentObligationsCardProps) {
    const getDaysUntilDue = (dueDate: string) => {
        const due = new Date(dueDate);
        const today = new Date();
        const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    const getUrgencyColor = (daysUntilDue: number) => {
        if (daysUntilDue < 0) return "text-red-600 bg-red-50 border-red-200";
        if (daysUntilDue <= 3) return "text-orange-600 bg-orange-50 border-orange-200";
        return "text-blue-600 bg-blue-50 border-blue-200";
    };

    // Filter orders with pending amounts
    const pendingOrders = orders.filter(
        (order) => Number(order.pending_amount) > 0 || order.initial_payment_status === "not_collected"
    );

    if (pendingOrders.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Your Payment Obligations</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <p className="text-lg">🎉 You're all caught up!</p>
                        <p className="text-sm mt-2">No pending payments at the moment.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    Your Payment Obligations
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {pendingOrders.map((order) => {
                        const dueDate = order.pending_payment_due_date;
                        const daysUntilDue = dueDate ? getDaysUntilDue(dueDate) : null;
                        const hasInitialPayment = order.initial_payment_status === "not_collected";

                        return (
                            <div
                                key={order.id}
                                className={`border-2 rounded-lg p-4 space-y-3 ${daysUntilDue !== null ? getUrgencyColor(daysUntilDue) : "border-gray-200"
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-mono text-sm font-semibold">{order.order_number}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Total: Rs. {Number(order.total_amount).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold">
                                            Rs. {Number(order.pending_amount).toLocaleString()}
                                        </p>
                                        <p className="text-xs">Pending</p>
                                    </div>
                                </div>

                                {hasInitialPayment && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                                        <p className="text-xs font-medium text-yellow-800">
                                            ⏳ Initial payment of Rs.{" "}
                                            {Number(order.initial_payment_required).toLocaleString()} to be collected on
                                            delivery
                                        </p>
                                    </div>
                                )}

                                {dueDate && (
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            <span>Due: {format(new Date(dueDate), "MMM dd, yyyy")}</span>
                                        </div>
                                        {daysUntilDue !== null && (
                                            <Badge
                                                variant={
                                                    daysUntilDue < 0
                                                        ? "destructive"
                                                        : daysUntilDue <= 3
                                                            ? "default"
                                                            : "secondary"
                                                }
                                            >
                                                {daysUntilDue < 0
                                                    ? `${Math.abs(daysUntilDue)} days overdue`
                                                    : `Due in ${daysUntilDue} days`}
                                            </Badge>
                                        )}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
                                    <div>
                                        <span className="text-muted-foreground">Paid:</span>
                                        <span className="font-semibold ml-1">
                                            Rs. {Number(order.paid_amount).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-muted-foreground">Remaining:</span>
                                        <span className="font-semibold ml-1">
                                            Rs. {Number(order.pending_amount).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {pendingOrders.some(
                    (o) => o.pending_payment_due_date && getDaysUntilDue(o.pending_payment_due_date) <= 3
                ) && (
                        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <p className="text-sm text-orange-800">
                                ⚠️ You have payments due soon. Please ensure timely payment to maintain your account
                                in good standing.
                            </p>
                        </div>
                    )}
            </CardContent>
        </Card>
    );
}
