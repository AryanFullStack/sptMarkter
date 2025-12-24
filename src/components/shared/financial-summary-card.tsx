"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, TrendingUp, DollarSign, Wallet, ShieldCheck, ArrowRight } from "lucide-react";
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

    const getStatusTheme = () => {
        if (limitUsagePercentage >= 100) return {
            text: "text-red-600",
            bg: "bg-red-50",
            border: "border-red-100",
            gradient: "from-red-500 to-rose-600",
            icon: AlertCircle,
            label: "Limit Exceeded"
        };
        if (limitUsagePercentage >= 80) return {
            text: "text-orange-600",
            bg: "bg-orange-50",
            border: "border-orange-100",
            gradient: "from-orange-400 to-amber-600",
            icon: AlertCircle,
            label: "Approaching Limit"
        };
        return {
            text: "text-emerald-600",
            bg: "bg-emerald-50",
            border: "border-emerald-100",
            gradient: "from-emerald-400 to-teal-600",
            icon: ShieldCheck,
            label: "Within Limit"
        };
    };

    const theme = getStatusTheme();

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-PK", {
            style: "currency",
            currency: "PKR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount).replace("PKR", "Rs.");
    };

    return (
        <Card className={cn("overflow-hidden border-none shadow-xl bg-white", className)}>
            <CardContent className="p-0">
                <div className="p-6 lg:p-10 space-y-8">
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.25em]">Strategic Oversight</p>
                            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-[#1A1A1A]">Financial Standing</h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge className={cn("px-5 py-2 rounded-full border-none shadow-sm font-bold text-[10px] uppercase tracking-widest leading-none", theme.bg, theme.text)}>
                                <theme.icon className="h-4 w-4 mr-2" />
                                {theme.label}
                            </Badge>
                        </div>
                    </div>

                    {/* Main Stats and Progress */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                        <div className="lg:col-span-5 space-y-2">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Currently Utilized</p>
                            <p className={cn("text-5xl lg:text-6xl font-black tracking-tighter", theme.text)}>
                                {formatCurrency(totalPending)}
                            </p>
                        </div>

                        <div className="lg:col-span-7 space-y-5">
                            <div className="flex justify-between items-end">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Usage Intensity</p>
                                <p className={cn("text-2xl font-black tracking-tight", theme.text)}>
                                    {limitUsagePercentage.toFixed(1)}%
                                </p>
                            </div>

                            <div className="relative h-6 w-full bg-gray-100/80 rounded-2xl overflow-hidden shadow-inner border border-gray-200/50">
                                <div
                                    className={cn("h-full transition-all duration-[1500ms] ease-in-out bg-gradient-to-r relative", theme.gradient)}
                                    style={{ width: `${Math.min(limitUsagePercentage, 100)}%` }}
                                >
                                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:24px_24px] animate-[shimmer_2s_linear_infinite]" />
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em] text-[#A0A0A0]">
                                <span>Minimum Level</span>
                                <div className="flex items-center gap-1.5 font-black text-blue-600">
                                    <div className="w-2 h-2 rounded-full bg-blue-600" />
                                    Available: {formatCurrency(remainingLimit)}
                                </div>
                                <span>Limit Cap: {formatCurrency(pendingLimit)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-[#F0F0F0]">
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#A0A0A0]">Available Credit</p>
                            <p className="text-xl font-bold text-blue-600">{formatCurrency(remainingLimit)}</p>
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#A0A0A0]">Total Settled</p>
                            <p className="text-xl font-bold text-[#1A1A1A]">{formatCurrency(totalPaid)}</p>
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#A0A0A0]">Lifetime Value</p>
                            <p className="text-xl font-bold text-[#1A1A1A]">{formatCurrency(totalLifetimeValue)}</p>
                        </div>
                        <div className="hidden md:flex flex-col justify-end items-end">
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1.5">
                                <ShieldCheck className="h-4 w-4" />
                                Portfolio Analysis Current
                            </p>
                        </div>
                    </div>

                    {limitUsagePercentage >= 80 && (
                        <div className={cn("p-5 rounded-2xl border flex items-start gap-5 animate-in fade-in slide-in-from-top-3 duration-500", theme.bg, theme.border)}>
                            <AlertCircle className={cn("h-6 w-6 shrink-0", theme.text)} />
                            <p className={cn("text-sm font-medium leading-relaxed italic", theme.text)}>
                                {limitUsagePercentage >= 100
                                    ? "Critical Authorization Notice: New procurement cycles are currently restricted due to credit ceiling exhaustion. Immediate reconciliation required."
                                    : "Predictive Warning: Account utilization is approaching assigned ceiling. Balance settlement recommended to ensure operational continuity."}
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
