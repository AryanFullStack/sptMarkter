"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, TrendingUp, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface FinancialSummaryCardProps {
    totalPending: number;
    pendingLimit: number;
    totalPaid?: number;
    totalLifetimeValue?: number;
    className?: string;
}

export function FinancialSummaryCard({
    totalPending,
    pendingLimit,
    totalPaid = 0,
    totalLifetimeValue = 0,
    className,
}: FinancialSummaryCardProps) {
    const remainingLimit = Math.max(0, pendingLimit - totalPending);
    const limitUsagePercentage = pendingLimit > 0 ? (totalPending / pendingLimit) * 100 : 0;

    const getStatusColor = () => {
        if (limitUsagePercentage >= 100) return "text-red-600";
        if (limitUsagePercentage >= 80) return "text-orange-600";
        return "text-green-600";
    };

    const getStatusBadge = () => {
        if (limitUsagePercentage >= 100) {
            return (
                <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Limit Exceeded
                </Badge>
            );
        }
        if (limitUsagePercentage >= 80) {
            return (
                <Badge variant="outline" className="gap-1 border-orange-500 text-orange-700">
                    <AlertCircle className="h-3 w-3" />
                    Approaching Limit
                </Badge>
            );
        }
        return (
            <Badge variant="outline" className="gap-1 border-green-500 text-green-700">
                <CheckCircle className="h-3 w-3" />
                Within Limit
            </Badge>
        );
    };

    const getProgressColor = () => {
        if (limitUsagePercentage >= 100) return "bg-red-600";
        if (limitUsagePercentage >= 80) return "bg-orange-500";
        return "bg-green-600";
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-PK", {
            style: "currency",
            currency: "PKR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <Card className={cn("overflow-hidden", className)}>
            <CardHeader className="bg-gradient-to-r from-[#2D5F3F]/5 to-[#2D5F3F]/10 border-b">
                <div className="flex items-center justify-between">
                    <CardTitle className="font-serif text-xl flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-[#2D5F3F]" />
                        Financial Summary
                    </CardTitle>
                    {getStatusBadge()}
                </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                {/* Pending Amount */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Current Pending</span>
                        <span className={cn("text-2xl font-bold", getStatusColor())}>
                            {formatCurrency(totalPending)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Pending Limit: {formatCurrency(pendingLimit)}</span>
                        <span className={getStatusColor()}>
                            {limitUsagePercentage.toFixed(1)}% used
                        </span>
                    </div>
                    <Progress
                        value={Math.min(limitUsagePercentage, 100)}
                        className={cn("h-2 transition-all duration-500", "[&>div]:".concat(getProgressColor()))}
                    />
                </div>

                {/* Available Limit */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                                Available Credit Limit
                            </p>
                            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                {formatCurrency(remainingLimit)}
                            </p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-blue-500 opacity-50" />
                    </div>
                </div>

                {/* Additional Stats (if provided) */}
                {(totalPaid > 0 || totalLifetimeValue > 0) && (
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        {totalLifetimeValue > 0 && (
                            <div>
                                <p className="text-xs text-muted-foreground">Total Orders</p>
                                <p className="text-lg font-semibold text-foreground">
                                    {formatCurrency(totalLifetimeValue)}
                                </p>
                            </div>
                        )}
                        {totalPaid > 0 && (
                            <div>
                                <p className="text-xs text-muted-foreground">Total Paid</p>
                                <p className="text-lg font-semibold text-green-600">
                                    {formatCurrency(totalPaid)}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Warning Message */}
                {limitUsagePercentage >= 80 && (
                    <div className={cn(
                        "p-3 rounded-lg border text-sm",
                        limitUsagePercentage >= 100
                            ? "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-800 dark:text-red-300"
                            : "bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-950/20 dark:border-orange-800 dark:text-orange-300"
                    )}>
                        <p className="font-medium flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            {limitUsagePercentage >= 100
                                ? "Orders Blocked: Please clear pending payments"
                                : "Approaching limit: Consider making a payment soon"}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
