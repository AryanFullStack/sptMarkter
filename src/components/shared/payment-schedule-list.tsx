"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Clock, AlertCircle, ArrowUpRight, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentItem {
    id: string;
    order_number: string;
    total_amount: number;
    paid_amount: number;
    pending_amount: number;
    initial_payment_required?: number;
    initial_payment_due_date?: string;
    pending_payment_due_date?: string;
}

interface PaymentScheduleListProps {
    upcomingPayments: PaymentItem[];
    overduePayments: PaymentItem[];
    onPayNow?: (orderId: string) => void;
    theme?: "retailer" | "parlor";
    className?: string;
}

export function PaymentScheduleList({
    upcomingPayments,
    overduePayments,
    onPayNow,
    theme = "retailer",
    className
}: PaymentScheduleListProps) {
    const formatDate = (dateString?: string) => {
        if (!dateString) return "N/A";
        return new Intl.DateTimeFormat("en-PK", {
            year: "numeric",
            month: "short",
            day: "numeric",
        }).format(new Date(dateString));
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-PK", {
            style: "currency",
            currency: "PKR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const themeColors = {
        retailer: {
            accent: "text-[#D4AF37]",
            border: "border-[#D4AF37]/20",
            bg: "bg-[#FDFCF9]",
            button: "bg-[#1A1A1A] hover:bg-[#333333]",
            badge: "bg-[#D4AF37] hover:bg-[#D4AF37]",
        },
        parlor: {
            accent: "text-purple-600",
            border: "border-purple-100",
            bg: "bg-purple-50/50",
            button: "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700",
            badge: "bg-purple-600 hover:bg-purple-700",
        }
    };

    const colors = themeColors[theme];

    const allPayments = [
        ...overduePayments.map(p => ({ ...p, status: "overdue" as const })),
        ...upcomingPayments.map(p => ({ ...p, status: "upcoming" as const }))
    ].sort((a, b) => {
        const dateA = new Date(a.pending_payment_due_date || a.initial_payment_due_date || 0);
        const dateB = new Date(b.pending_payment_due_date || b.initial_payment_due_date || 0);
        return dateA.getTime() - dateB.getTime();
    });

    if (allPayments.length === 0) {
        return (
            <Card className={cn("border-none shadow-sm", className)}>
                <CardHeader>
                    <CardTitle className="font-serif text-2xl">Payment Schedule</CardTitle>
                    <CardDescription>No pending settlements discovered</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <CheckCircle className="h-12 w-12 text-green-200 mb-4" />
                    <p className="text-[#A0A0A0] italic">Your account is fully settled. No upcoming commitments.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn("border-none shadow-sm overflow-hidden", className)}>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#F7F5F2] pb-6 gap-4">
                <div>
                    <CardTitle className="font-serif text-2xl">Payment Roadmap</CardTitle>
                    <CardDescription>Chronological overview of pending commitments</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    {overduePayments.length > 0 && (
                        <Badge variant="destructive" className="animate-pulse">
                            {overduePayments.length} Overdue
                        </Badge>
                    )}
                    <Badge variant="outline" className={cn("border-none shadow-sm", colors.bg, colors.accent)}>
                        {upcomingPayments.length} Upcoming
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {/* Desktop View: Table */}
                <div className="hidden md:block">
                    <Table>
                        <TableHeader className="bg-[#F7F5F2]/30">
                            <TableRow>
                                <TableHead className="pl-6 py-4">Ref & Date</TableHead>
                                <TableHead>Execution Window</TableHead>
                                <TableHead>Amount Due</TableHead>
                                <TableHead className="pr-6 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allPayments.map((payment) => {
                                const isOverdue = payment.status === "overdue";
                                const dueDate = payment.pending_payment_due_date || payment.initial_payment_due_date;

                                return (
                                    <TableRow key={payment.id} className="hover:bg-[#FDFCF9] group transition-all">
                                        <TableCell className="pl-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-lg flex items-center justify-center font-mono text-[10px] font-bold shadow-sm border",
                                                    isOverdue ? "bg-red-50 text-red-600 border-red-100" : "bg-white text-black border-gray-100"
                                                )}>
                                                    #{payment.order_number.slice(-4)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-[#1A1A1A]">#{payment.order_number}</p>
                                                    <p className="text-[10px] text-[#6B6B6B] uppercase tracking-widest font-semibold">Consignment Ref</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {isOverdue ? (
                                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                                ) : (
                                                    <Calendar className="h-4 w-4 text-[#A0A0A0]" />
                                                )}
                                                <div className="space-y-0.5">
                                                    <p className={cn("text-sm font-bold", isOverdue ? "text-red-600" : "text-[#1A1A1A]")}>
                                                        {formatDate(dueDate)}
                                                    </p>
                                                    <p className="text-[10px] text-[#6B6B6B] font-medium">
                                                        {isOverdue ? "Exceeded Deadline" : "Settlement Expected"}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-0.5">
                                                <p className="text-sm font-bold text-[#1A1A1A]">
                                                    {formatCurrency(payment.pending_amount)}
                                                </p>
                                                <p className="text-[10px] text-[#6B6B6B] font-medium italic">
                                                    Remaining Balance
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="pr-6 text-right">
                                            <Button
                                                size="sm"
                                                className={cn("h-8 rounded-lg shadow-sm font-bold text-[10px] uppercase tracking-wider transition-all active:scale-95 border-none", colors.button)}
                                                onClick={() => onPayNow?.(payment.id)}
                                            >
                                                Settle Now <ArrowUpRight className="ml-1 h-3 w-3" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile View: Stacked Cards */}
                <div className="md:hidden divide-y divide-[#F7F5F2]">
                    {allPayments.map((payment) => {
                        const isOverdue = payment.status === "overdue";
                        const dueDate = payment.pending_payment_due_date || payment.initial_payment_due_date;

                        return (
                            <div key={payment.id} className="p-5 space-y-4 hover:bg-[#FDFCF9] transition-colors">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-lg flex items-center justify-center font-mono text-[10px] font-bold shadow-sm border",
                                            isOverdue ? "bg-red-50 text-red-600 border-red-100" : "bg-white text-black border-gray-100"
                                        )}>
                                            #{payment.order_number.slice(-4)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-[#1A1A1A]">#{payment.order_number}</p>
                                            <p className="text-[10px] text-[#6B6B6B] uppercase tracking-widest font-semibold">Ref</p>
                                        </div>
                                    </div>
                                    <Badge variant={isOverdue ? "destructive" : "outline"} className={cn("text-[8px] uppercase tracking-tighter", !isOverdue && colors.accent)}>
                                        {isOverdue ? "Overdue" : "Scheduled"}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-4 bg-[#F7F5F2]/20 p-3 rounded-xl border border-[#F7F5F2]">
                                    <div className="space-y-1">
                                        <p className="text-[9px] text-[#6B6B6B] uppercase font-bold tracking-widest">Due Date</p>
                                        <div className="flex items-center gap-1.5">
                                            {isOverdue ? <AlertCircle className="h-3 w-3 text-red-500" /> : <Calendar className="h-3 w-3 text-gray-400" />}
                                            <span className={cn("text-xs font-bold", isOverdue ? "text-red-600" : "text-[#1A1A1A]")}>
                                                {formatDate(dueDate)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] text-[#6B6B6B] uppercase font-bold tracking-widest">Due Amount</p>
                                        <p className="text-xs font-bold text-[#1A1A1A]">
                                            {formatCurrency(payment.pending_amount)}
                                        </p>
                                    </div>
                                </div>

                                <Button
                                    className={cn("w-full h-10 rounded-xl shadow-md font-bold text-xs uppercase tracking-widest transition-all active:scale-95 border-none", colors.button)}
                                    onClick={() => onPayNow?.(payment.id)}
                                >
                                    Settle Dues <ArrowUpRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
