"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Package, Calendar, DollarSign, CreditCard, User, Building2,
    CheckCircle, Clock, AlertCircle, XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderCardEnhancedProps {
    order: {
        id: string;
        order_number: string;
        total_amount: number;
        paid_amount: number;
        pending_amount: number;
        payment_status: "pending" | "partial" | "paid";
        status: string;
        created_at: string;
        created_via?: "direct" | "salesman";
        recorded_by_user?: {
            full_name: string;
            email: string;
            role?: string;
        };
        items: any[];
        payments?: Array<{
            id: string;
            amount: number;
            payment_method: string;
            created_at: string;
            notes?: string;
        }>;
    };
    onRecordPayment?: (orderId: string) => void;
    onViewDetails?: (orderId: string) => void;
    showPaymentHistory?: boolean;
    className?: string;
}

export function OrderCardEnhanced({
    order,
    onRecordPayment,
    onViewDetails,
    showPaymentHistory = false,
    className,
}: OrderCardEnhancedProps) {
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
        }).format(new Date(dateString));
    };

    const getPaymentStatusBadge = () => {
        const config = {
            paid: {
                icon: CheckCircle,
                variant: "default" as const,
                label: "Paid",
                className: "bg-green-600 hover:bg-green-700",
            },
            partial: {
                icon: Clock,
                variant: "secondary" as const,
                label: "Partial",
                className: "bg-orange-500 hover:bg-orange-600 text-white",
            },
            pending: {
                icon: AlertCircle,
                variant: "outline" as const,
                label: "Pending",
                className: "border-red-500 text-red-700 hover:bg-red-50",
            },
        };

        const { icon: Icon, variant, label, className: badgeClassName } =
            config[order.payment_status] || config.pending;

        return (
            <Badge variant={variant} className={cn("gap-1", badgeClassName)}>
                <Icon className="h-3 w-3" />
                {label}
            </Badge>
        );
    };

    const getOrderStatusBadge = (status: string) => {
        const statusConfig: Record<string, { variant: any; className?: string }> = {
            created: { variant: "outline" },
            confirmed: { variant: "default", className: "bg-blue-600" },
            processing: { variant: "default", className: "bg-purple-600" },
            shipped: { variant: "default", className: "bg-indigo-600" },
            delivered: { variant: "default", className: "bg-green-600" },
            completed: { variant: "default", className: "bg-green-700" },
            cancelled: { variant: "destructive" },
        };

        const config = statusConfig[status] || { variant: "outline" };

        return (
            <Badge variant={config.variant} className={config.className}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    // Group items by brand if available
    const groupedItems = order.items.reduce((acc: any, item: any) => {
        const brand = item.brand || "Other";
        if (!acc[brand]) acc[brand] = [];
        acc[brand].push(item);
        return acc;
    }, {});

    return (
        <Card className={cn("overflow-hidden hover:shadow-lg transition-shadow", className)}>
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 pb-3">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-[#2D5F3F]" />
                            <span className="font-mono font-bold text-lg">{order.order_number}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {formatDate(order.created_at)}
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                        {getPaymentStatusBadge()}
                        {getOrderStatusBadge(order.status)}
                    </div>
                </div>

                {/* Created Via Attribution */}
                {order.created_via === "salesman" && order.recorded_by_user && (
                    <div className="mt-3 pt-3 border-t flex items-center gap-2 text-sm">
                        <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-blue-600 text-white">
                                S
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-muted-foreground">
                            Created by salesman <span className="font-medium text-foreground">{order.recorded_by_user.full_name}</span>
                        </span>
                    </div>
                )}
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
                {/* Financial Summary */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="text-lg font-bold">{formatCurrency(order.total_amount)}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-green-700 dark:text-green-400">Paid</p>
                        <p className="text-lg font-bold text-green-600">{formatCurrency(order.paid_amount)}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-orange-700 dark:text-orange-400">Pending</p>
                        <p className="text-lg font-bold text-orange-600">{formatCurrency(order.pending_amount)}</p>
                    </div>
                </div>

                <Separator />

                {/* Items Grouped by Brand */}
                <div className="space-y-3">
                    <p className="text-sm font-semibold">Order Items</p>
                    {Object.entries(groupedItems).map(([brand, items]: [string, any]) => (
                        <div key={brand} className="space-y-2">
                            {brand !== "Other" && (
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">{brand}</span>
                                </div>
                            )}
                            <div className="pl-6 space-y-1">
                                {items.map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            {item.name || item.product_name} <span className="text-xs">x{item.quantity}</span>
                                        </span>
                                        <span className="font-medium">
                                            {formatCurrency((item.price || item.unit_price) * item.quantity)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Payment History (if enabled and has payments) */}
                {showPaymentHistory && order.payments && order.payments.length > 0 && (
                    <>
                        <Separator />
                        <div className="space-y-2">
                            <p className="text-sm font-semibold">Recent Payments</p>
                            <div className="space-y-1">
                                {order.payments.slice(0, 3).map((payment) => (
                                    <div key={payment.id} className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">
                                            {formatDate(payment.created_at)} - {payment.payment_method}
                                        </span>
                                        <span className="font-medium text-green-600">
                                            {formatCurrency(payment.amount)}
                                        </span>
                                    </div>
                                ))}
                                {order.payments.length > 3 && (
                                    <p className="text-xs text-muted-foreground italic">
                                        +{order.payments.length - 3} more payment{order.payments.length - 3 !== 1 ? "s" : ""}
                                    </p>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </CardContent>

            <CardFooter className="bg-gray-50 dark:bg-gray-900 flex gap-2">
                {onViewDetails && (
                    <Button variant="outline" size="sm" onClick={() => onViewDetails(order.id)} className="flex-1">
                        View Details
                    </Button>
                )}
                {onRecordPayment && order.payment_status !== "paid" && (
                    <Button
                        size="sm"
                        onClick={() => onRecordPayment(order.id)}
                        className="flex-1 bg-[#2D5F3F] hover:bg-[#234a32]"
                    >
                        <DollarSign className="h-4 w-4 mr-1" />
                        Record Payment
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
