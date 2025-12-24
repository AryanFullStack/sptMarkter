"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { collectInitialPayment, setPaymentDueDate } from "@/app/actions/payment-schedule-actions";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notifications";
import { Calendar as CalendarIcon, DollarSign, Clock } from "lucide-react";
import { format } from "date-fns";

interface Order {
    id: string;
    order_number: string;
    user_id: string;
    total_amount: number;
    initial_payment_required: number;
    initial_payment_status?: string;
    initial_payment_due_date?: string;
    pending_payment_due_date?: string;
    pending_amount?: number;
    created_at: string;
    user: {
        id: string;
        full_name: string;
        email: string;
        role: string;
    };
}

interface PaymentManagementCardsProps {
    uncollectedOrders: Order[];
    scheduledOrders: Order[];
}

export function PaymentManagementCards({
    uncollectedOrders,
    scheduledOrders,
}: PaymentManagementCardsProps) {
    const router = useRouter();
    const [collectingId, setCollectingId] = useState<string | null>(null);
    const [dueDateDialog, setDueDateDialog] = useState<{
        open: boolean;
        orderId: string | null;
        paymentType: "initial" | "pending";
    }>({ open: false, orderId: null, paymentType: "pending" });
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [settingDueDate, setSettingDueDate] = useState(false);

    const handleCollectPayment = async (orderId: string) => {
        setCollectingId(orderId);
        try {
            const result = await collectInitialPayment(orderId);
            if (result.error) {
                notify.error("Collection Failed", result.error);
            } else {
                notify.success("Payment Collected", "Initial payment has been marked as collected");
                router.refresh();
            }
        } catch (error: any) {
            notify.error("Error", error.message || "Failed to collect payment");
        } finally {
            setCollectingId(null);
        }
    };

    const handleSetDueDate = async () => {
        if (!dueDateDialog.orderId || !selectedDate) return;

        setSettingDueDate(true);
        try {
            const result = await setPaymentDueDate(
                dueDateDialog.orderId,
                selectedDate.toISOString(),
                dueDateDialog.paymentType
            );
            if (result.error) {
                notify.error("Failed", result.error);
            } else {
                notify.success("Due Date Set", "Payment due date has been set successfully");
                setDueDateDialog({ open: false, orderId: null, paymentType: "pending" });
                setSelectedDate(undefined);
                router.refresh();
            }
        } catch (error: any) {
            notify.error("Error", error.message || "Failed to set due date");
        } finally {
            setSettingDueDate(false);
        }
    };

    const getDaysUntilDue = (dueDate: string) => {
        const due = new Date(dueDate);
        const today = new Date();
        const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    return (
        <>
            <div className="grid gap-6 md:grid-cols-2">
                {/* Initial Payments to Collect */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-green-600" />
                            Initial Payments to Collect
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {uncollectedOrders.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                No uncollected initial payments
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {uncollectedOrders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-mono text-sm font-semibold">{order.order_number}</p>
                                                <p className="text-sm text-muted-foreground">{order.user.full_name}</p>
                                                <Badge variant="outline" className="mt-1 text-xs">
                                                    {order.user.role.replace("_", " ")}
                                                </Badge>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-green-600">
                                                    Rs. {Number(order.initial_payment_required).toLocaleString()}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Total: Rs. {Number(order.total_amount).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                onClick={() => handleCollectPayment(order.id)}
                                                disabled={collectingId === order.id}
                                                className="flex-1"
                                            >
                                                {collectingId === order.id ? "Collecting..." : "Mark as Collected"}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    setDueDateDialog({ open: true, orderId: order.id, paymentType: "initial" })
                                                }
                                            >
                                                <CalendarIcon className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Scheduled Payments */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-orange-600" />
                            Scheduled Payments
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {scheduledOrders.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                No scheduled payments
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {scheduledOrders.map((order) => {
                                    const dueDate = order.pending_payment_due_date;
                                    const daysUntilDue = dueDate ? getDaysUntilDue(dueDate) : null;

                                    return (
                                        <div
                                            key={order.id}
                                            className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-mono text-sm font-semibold">{order.order_number}</p>
                                                    <p className="text-sm text-muted-foreground">{order.user.full_name}</p>
                                                    {dueDate && (
                                                        <div className="mt-2 flex items-center gap-1 text-xs">
                                                            <CalendarIcon className="h-3 w-3" />
                                                            <span>Due: {format(new Date(dueDate), "MMM dd, yyyy")}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-orange-600">
                                                        Rs. {Number(order.pending_amount || 0).toLocaleString()}
                                                    </p>
                                                    {daysUntilDue !== null && (
                                                        <Badge
                                                            variant={
                                                                daysUntilDue < 0
                                                                    ? "destructive"
                                                                    : daysUntilDue <= 3
                                                                        ? "default"
                                                                        : "outline"
                                                            }
                                                            className="mt-1 text-xs"
                                                        >
                                                            {daysUntilDue < 0
                                                                ? `${Math.abs(daysUntilDue)}d overdue`
                                                                : `${daysUntilDue}d left`}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>

                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    setDueDateDialog({ open: true, orderId: order.id, paymentType: "pending" })
                                                }
                                                className="w-full"
                                            >
                                                <CalendarIcon className="h-4 w-4 mr-2" />
                                                {dueDate ? "Update Due Date" : "Set Due Date"}
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Due Date Dialog */}
            <Dialog
                open={dueDateDialog.open}
                onOpenChange={(open) =>
                    setDueDateDialog({ ...dueDateDialog, open })
                }
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Set Payment Due Date</DialogTitle>
                        <DialogDescription>
                            Choose when this payment should be collected
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-center py-4">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            disabled={(date) => date < new Date()}
                            initialFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() =>
                                setDueDateDialog({ open: false, orderId: null, paymentType: "pending" })
                            }
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleSetDueDate} disabled={!selectedDate || settingDueDate}>
                            {settingDueDate ? "Setting..." : "Set Due Date"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
