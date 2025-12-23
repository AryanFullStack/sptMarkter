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
        const isPaid = order.pending_amount <= 0;

        if (isPaid) {
            return (
                <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-3 w-3" />
                    Paid
                </Badge>
            );
        }

        return (
            <Badge variant="outline" className="gap-1 border-orange-500 text-orange-700 hover:bg-orange-50">
                <AlertCircle className="h-3 w-3" />
                Pending
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
        <Card className={cn("overflow-hidden hover:shadow-lg transition-shadow border-none shadow-sm", className)}>
            <CardContent className="p-6 space-y-6">
                {/* Top Section: ID & Date + Badges */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="font-mono font-bold text-base">{order.order_number}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(order.created_at)}
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                        {getPaymentStatusBadge()}
                        {getOrderStatusBadge(order.status)}
                    </div>
                </div>

                {/* Financial Summary - Horizontal Grid */}
                <div className="grid grid-cols-3 gap-6 py-4 border-y border-gray-50 bg-gray-50/30 -mx-6 px-6">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total</p>
                        <p className="text-lg font-bold">{formatCurrency(order.total_amount)}</p>
                    </div>

                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase tracking-widest">Paid</p>
                        <p className="text-lg font-bold text-green-600">{formatCurrency(order.paid_amount)}</p>
                    </div>

                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-orange-700 dark:text-orange-400 uppercase tracking-widest">Pending</p>
                        <p className="text-lg font-bold text-orange-600">{formatCurrency(order.pending_amount)}</p>
                    </div>
                </div>

                {/* Items */}
                <div className="space-y-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#A0A0A0]">Order Items</p>
                    <div className="space-y-4">
                        {order.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-start border-b border-gray-50 pb-2 last:border-0">
                                <p className="text-sm font-medium text-foreground leading-snug max-w-[70%]">
                                    {item.name || item.product_name} <span className="text-muted-foreground lowercase text-xs">x{item.quantity}</span>
                                </p>
                                <p className="text-sm font-bold whitespace-nowrap">
                                    {formatCurrency((item.price || item.unit_price) * item.quantity)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    {onRecordPayment && order.pending_amount > 0 && (
                        <Button
                            size="lg"
                            onClick={() => onRecordPayment(order.id)}
                            className="flex-1 bg-[#1A1A1A] hover:bg-[#333333] text-white shadow-xl shadow-black/5 transition-all active:scale-[0.98] font-bold"
                        >
                            Record Payment
                        </Button>
                    )}

                    {onViewDetails && (
                        <Button variant="outline" size="lg" onClick={() => onViewDetails(order.id)} className="flex-1 font-semibold text-gray-600 hover:text-black hover:bg-gray-50">
                            View Details
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
