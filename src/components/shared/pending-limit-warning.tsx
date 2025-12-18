"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, AlertCircle, XCircle, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface PendingLimitWarningProps {
    currentPending: number;
    pendingLimit: number;
    onPayNow?: () => void;
    className?: string;
}

export function PendingLimitWarning({
    currentPending,
    pendingLimit,
    onPayNow,
    className,
}: PendingLimitWarningProps) {
    const limitUsagePercentage = pendingLimit > 0 ? (currentPending / pendingLimit) * 100 : 0;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-PK", {
            style: "currency",
            currency: "PKR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Don't show warning if below 80%
    if (limitUsagePercentage < 80) {
        return null;
    }

    const isExceeded = limitUsagePercentage >= 100;
    const isApproaching = limitUsagePercentage >= 80 && limitUsagePercentage < 100;

    if (isExceeded) {
        return (
            <Alert
                variant="destructive"
                className={cn("border-2 animate-in fade-in-50", className)}
            >
                <XCircle className="h-5 w-5" />
                <AlertTitle className="text-lg font-bold flex items-center gap-2">
                    Pending Limit Exceeded - Orders Blocked
                </AlertTitle>
                <AlertDescription className="mt-2 space-y-3">
                    <div className="space-y-1">
                        <p className="text-sm font-medium">
                            Your pending amount of <span className="font-bold">{formatCurrency(currentPending)}</span> has exceeded
                            your limit of <span className="font-bold">{formatCurrency(pendingLimit)}</span>.
                        </p>
                        <p className="text-sm">
                            You cannot place new orders until you reduce your pending balance.
                        </p>
                    </div>
                    {onPayNow && (
                        <Button
                            onClick={onPayNow}
                            variant="outline"
                            className="mt-2 bg-white hover:bg-gray-100 text-red-700 border-red-300 hover:border-red-400"
                        >
                            <DollarSign className="h-4 w-4 mr-2" />
                            Make a Payment
                        </Button>
                    )}
                </AlertDescription>
            </Alert>
        );
    }

    if (isApproaching) {
        return (
            <Alert
                variant="default"
                className={cn(
                    "border-2 border-orange-500 bg-orange-50 dark:bg-orange-950/20 animate-in fade-in-50",
                    className
                )}
            >
                <AlertTriangle className="h-5 w-5 text-orange-700 dark:text-orange-500" />
                <AlertTitle className="text-lg font-bold text-orange-900 dark:text-orange-100">
                    Approaching Pending Limit
                </AlertTitle>
                <AlertDescription className="mt-2 space-y-3 text-orange-800 dark:text-orange-200">
                    <div className="space-y-1">
                        <p className="text-sm font-medium">
                            You've used <span className="font-bold">{limitUsagePercentage.toFixed(1)}%</span> of your pending limit.
                        </p>
                        <p className="text-sm">
                            Current pending: <span className="font-bold">{formatCurrency(currentPending)}</span> of{" "}
                            <span className="font-bold">{formatCurrency(pendingLimit)}</span> limit
                        </p>
                        <p className="text-sm">
                            Consider making a payment soon to avoid order restrictions.
                        </p>
                    </div>
                    {onPayNow && (
                        <Button
                            onClick={onPayNow}
                            variant="default"
                            className="mt-2 bg-orange-600 hover:bg-orange-700 text-white"
                        >
                            <DollarSign className="h-4 w-4 mr-2" />
                            Make a Payment
                        </Button>
                    )}
                </AlertDescription>
            </Alert>
        );
    }

    return null;
}
