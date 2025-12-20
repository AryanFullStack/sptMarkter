"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, TrendingDown, Wallet, ArrowRight } from "lucide-react";

interface PendingSummaryCardProps {
    currentPending: number;
    allowedLimit: number;
    onPayClick?: () => void;
}

export function PendingSummaryCard({
    currentPending,
    allowedLimit,
    onPayClick
}: PendingSummaryCardProps) {
    const remainingAllowed = Math.max(0, allowedLimit - currentPending);
    const usagePercentage = allowedLimit > 0 ? (currentPending / allowedLimit) * 100 : 0;
    const isNearLimit = usagePercentage >= 80;
    const isOverLimit = currentPending > allowedLimit;

    return (
        <Card className="border-[#D4AF37]/30 bg-gradient-to-br from-[#D4AF37]/5 to-transparent overflow-hidden relative">
            {/* Decorative Background Element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-3xl" />

            <CardHeader className="relative">
                <CardTitle className="font-serif text-2xl flex items-center gap-2">
                    <Wallet className="h-6 w-6 text-[#D4AF37]" />
                    Pending Amount Status
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6 relative">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-[#D4AF37]/20 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="h-2 w-2 rounded-full bg-[#C77D2E]" />
                            <p className="text-sm text-[#6B6B6B] font-medium">Total Pending</p>
                        </div>
                        <p className="text-2xl md:text-3xl font-bold text-[#C77D2E]">
                            Rs. {currentPending.toLocaleString()}
                        </p>
                    </div>

                    <div className="bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-[#D4AF37]/20 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="h-2 w-2 rounded-full bg-[#1A1A1A]" />
                            <p className="text-sm text-[#6B6B6B] font-medium">Allowed Limit</p>
                        </div>
                        <p className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">
                            Rs. {allowedLimit.toLocaleString()}
                        </p>
                    </div>

                    <div className="bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-[#D4AF37]/20 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="h-2 w-2 rounded-full bg-[#2D5F3F]" />
                            <p className="text-sm text-[#6B6B6B] font-medium">Remaining Allowed</p>
                        </div>
                        <p className="text-2xl md:text-3xl font-bold text-[#2D5F3F]">
                            Rs. {remainingAllowed.toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Usage Progress */}
                {allowedLimit > 0 && (
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-[#6B6B6B] font-medium">Limit Usage</span>
                            <span className={`font-semibold ${isOverLimit ? 'text-red-600' :
                                isNearLimit ? 'text-[#C77D2E]' :
                                    'text-[#2D5F3F]'
                                }`}>
                                {usagePercentage.toFixed(1)}%
                            </span>
                        </div>
                        <Progress
                            value={Math.min(usagePercentage, 100)}
                            className={`h-3 ${isOverLimit ? '[&>div]:bg-red-500' :
                                isNearLimit ? '[&>div]:bg-[#C77D2E]' :
                                    '[&>div]:bg-[#2D5F3F]'
                                }`}
                        />
                    </div>
                )}

                {/* Warnings */}
                {isOverLimit && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-semibold text-red-900 mb-1">Limit Exceeded!</p>
                            <p className="text-sm text-red-700">
                                Your pending amount exceeds the allowed limit. You must pay the full amount for new orders until your pending balance is reduced.
                            </p>
                        </div>
                    </div>
                )}

                {isNearLimit && !isOverLimit && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-semibold text-orange-900 mb-1">Approaching Limit</p>
                            <p className="text-sm text-orange-700">
                                You're using {usagePercentage.toFixed(0)}% of your pending amount limit. Consider making a payment soon.
                            </p>
                        </div>
                    </div>
                )}

                {/* Pay Button */}
                {currentPending > 0 && onPayClick && (
                    <Button
                        onClick={onPayClick}
                        className="w-full bg-gradient-to-r from-[#D4AF37] to-[#C19B2E] hover:from-[#C19B2E] hover:to-[#B8941F] text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                        size="lg"
                    >
                        <TrendingDown className="h-5 w-5 mr-2" />
                        Pay Pending Amount
                        <ArrowRight className="h-5 w-5 ml-auto" />
                    </Button>
                )}

                {allowedLimit === 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                        <p className="text-sm text-blue-700">
                            Your pending amount limit is Rs. 0. All orders must be paid in full at checkout.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
