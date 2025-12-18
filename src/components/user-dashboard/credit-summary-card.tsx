"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/utils/export-utils";
import { CreditCard, AlertTriangle, TrendingUp } from "lucide-react";

interface CreditSummaryProps {
    creditLimit: number;
    creditUsed: number;
    pendingAmount?: number;
}

export function CreditSummaryCard({ creditLimit, creditUsed, pendingAmount = 0 }: CreditSummaryProps) {
    const availableCredit = creditLimit - creditUsed - pendingAmount;
    const usagePercentage = ((creditUsed + pendingAmount) / creditLimit) * 100;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-serif text-2xl flex items-center gap-2">
                    <CreditCard className="h-6 w-6 text-[#D4AF37]" />
                    Credit Summary
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-[#6B6B6B]">Credit Usage</span>
                        <span className="font-semibold">{usagePercentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={usagePercentage} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-[#6B6B6B]">Credit Limit</p>
                        <p className="text-lg font-semibold text-[#1A1A1A]">
                            {formatCurrency(creditLimit)}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-[#6B6B6B]">Used</p>
                        <p className="text-lg font-semibold text-[#C77D2E]">
                            {formatCurrency(creditUsed)}
                        </p>
                    </div>
                </div>

                {pendingAmount > 0 && (
                    <div className="bg-[#C77D2E]/10 p-3 rounded-lg flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 text-[#C77D2E] mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-[#C77D2E]">Pending Amount</p>
                            <p className="text-lg font-bold text-[#C77D2E]">
                                {formatCurrency(pendingAmount)}
                            </p>
                        </div>
                    </div>
                )}

                <div className="border-t pt-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-[#6B6B6B]">Available Credit</span>
                        <span className="text-xl font-bold text-[#2D5F3F] flex items-center gap-1">
                            <TrendingUp className="h-5 w-5" />
                            {formatCurrency(availableCredit)}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
