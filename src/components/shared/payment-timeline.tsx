"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, DollarSign, CreditCard, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Payment {
    id: string;
    amount: number;
    payment_method: string;
    notes?: string;
    created_at: string;
    payment_sequence?: number;
    remaining_balance?: number;
    status: "pending" | "completed" | "failed" | "refunded";
    order?: {
        order_number: string;
        total_amount: number;
    };
    recorded_by_user?: {
        full_name: string;
        email: string;
        role?: string;
    };
}

interface PaymentTimelineProps {
    payments: Payment[];
    orderNumber?: string;
    totalAmount?: number;
    className?: string;
}

export function PaymentTimeline({
    payments,
    orderNumber,
    totalAmount,
    className,
}: PaymentTimelineProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-PK", {
            style: "currency",
            currency: "PKR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat("en-PK", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(dateString));
    };

    const getPaymentMethodBadge = (method: string) => {
        const variants: Record<string, { variant: any; label: string }> = {
            cash: { variant: "default", label: "Cash" },
            bank_transfer: { variant: "secondary", label: "Bank Transfer" },
            card: { variant: "outline", label: "Card" },
            online: { variant: "outline", label: "Online" },
        };

        const config = variants[method] || { variant: "default", label: method };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const getRoleIcon = (role?: string) => {
        if (role === "salesman") return "S";
        if (role === "admin" || role === "sub_admin") return "A";
        return "U";
    };

    if (payments.length === 0) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="font-serif text-xl flex items-center gap-2">
                        <Clock className="h-5 w-5 text-[#2D5F3F]" />
                        Payment History
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>No payments recorded yet</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="font-serif text-xl flex items-center gap-2">
                        <Clock className="h-5 w-5 text-[#2D5F3F]" />
                        Payment History
                        {orderNumber && (
                            <Badge variant="outline" className="ml-2 font-mono text-xs">
                                {orderNumber}
                            </Badge>
                        )}
                    </CardTitle>
                    {totalAmount && (
                        <div className="text-right text-sm">
                            <p className="text-muted-foreground">Order Total</p>
                            <p className="text-lg font-semibold">{formatCurrency(totalAmount)}</p>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="relative">
                    {/* Timeline Line */}
                    <div className="absolute left-[17px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-500 via-blue-500 to-gray-300" />

                    {/* Payment Entries */}
                    <div className="space-y-6">
                        {payments.map((payment, index) => (
                            <div key={payment.id} className="relative pl-10">
                                {/* Timeline Dot */}
                                <div className="absolute left-0 top-0">
                                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-sm shadow-lg ring-4 ring-background">
                                        {payment.payment_sequence || index + 1}
                                    </div>
                                </div>

                                {/* Payment Card */}
                                <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl font-bold text-green-600">
                                                    {formatCurrency(payment.amount)}
                                                </span>
                                                {getPaymentMethodBadge(payment.payment_method)}
                                                <Badge
                                                    variant={payment.status === "completed" ? "default" : "secondary"}
                                                    className={cn(
                                                        "ml-2 capitalize",
                                                        payment.status === "pending" && "bg-orange-500 hover:bg-orange-600 text-white",
                                                        payment.status === "completed" && "bg-green-600 hover:bg-green-700 text-white"
                                                    )}
                                                >
                                                    {payment.status}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Clock className="h-3 w-3" />
                                                {formatDate(payment.created_at)}
                                            </div>
                                        </div>

                                        {payment.remaining_balance !== undefined && (
                                            <div className="text-right">
                                                <p className="text-xs text-muted-foreground">Balance After</p>
                                                <p className={cn(
                                                    "text-lg font-semibold",
                                                    payment.remaining_balance === 0 ? "text-green-600" : "text-orange-600"
                                                )}>
                                                    {formatCurrency(payment.remaining_balance)}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {payment.notes && (
                                        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded border-l-2 border-blue-500">
                                            <p className="text-sm text-foreground">{payment.notes}</p>
                                        </div>
                                    )}

                                    {payment.recorded_by_user && (
                                        <div className="mt-3 pt-3 border-t flex items-center gap-2">
                                            <Avatar className="h-6 w-6">
                                                <AvatarFallback className="text-xs bg-[#2D5F3F] text-white">
                                                    {getRoleIcon(payment.recorded_by_user.role)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-xs text-muted-foreground">
                                                Recorded by <span className="font-medium text-foreground">{payment.recorded_by_user.full_name}</span>
                                                {payment.recorded_by_user.role === "salesman" && (
                                                    <Badge variant="outline" className="ml-2 text-xs">Salesman</Badge>
                                                )}
                                            </span>
                                        </div>
                                    )}

                                    {payment.order && !orderNumber && (
                                        <div className="mt-2">
                                            <Badge variant="outline" className="font-mono text-xs">
                                                Order: {payment.order.order_number}
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Summary Footer */}
                    <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-green-700 dark:text-green-300">
                                    Total Payments Made
                                </p>
                                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                                    {payments.length} Payment{payments.length !== 1 ? "s" : ""}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-medium text-green-700 dark:text-green-300">
                                    Total Amount Paid
                                </p>
                                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                                    {formatCurrency(
                                        payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
