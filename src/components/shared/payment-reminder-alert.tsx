"use client";

import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, AlertCircle, Clock, Calendar } from "lucide-react";
import { acknowledgeReminder, markReminderAsSeen } from "@/app/actions/payment-schedule-actions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface PaymentReminder {
    id: string;
    order_id: string;
    reminder_type: "initial_due" | "pending_due" | "overdue";
    due_date: string;
    amount: number;
    is_seen: boolean;
    order: {
        order_number: string;
        user: {
            full_name: string;
        };
    };
}

interface PaymentReminderAlertProps {
    reminders: PaymentReminder[];
    onDismiss?: () => void;
}

export function PaymentReminderAlert({ reminders, onDismiss }: PaymentReminderAlertProps) {
    const router = useRouter();
    const [visibleReminders, setVisibleReminders] = useState(reminders);
    const [dismissedIds, setDismissedIds] = useState<string[]>([]);

    useEffect(() => {
        // Mark unseen reminders as seen when component mounts
        const unseenReminders = reminders.filter(r => !r.is_seen);
        unseenReminders.forEach(reminder => {
            markReminderAsSeen(reminder.id);
        });
    }, [reminders]);

    useEffect(() => {
        setVisibleReminders(reminders.filter(r => !dismissedIds.includes(r.id)));
    }, [reminders, dismissedIds]);

    const handleAcknowledge = async (reminderId: string) => {
        await acknowledgeReminder(reminderId);
        setDismissedIds(prev => [...prev, reminderId]);
        router.refresh();
        onDismiss?.();
    };

    const getDaysUntilDue = (dueDate: string) => {
        const due = new Date(dueDate);
        const today = new Date();
        const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    const getReminderConfig = (reminder: PaymentReminder) => {
        const daysUntilDue = getDaysUntilDue(reminder.due_date);

        if (reminder.reminder_type === "overdue" || daysUntilDue < 0) {
            return {
                variant: "destructive" as const,
                icon: AlertCircle,
                title: "Overdue Payment",
                color: "text-red-600",
                bgColor: "bg-red-50 border-red-200",
                badgeColor: "bg-red-100 text-red-800"
            };
        } else if (daysUntilDue <= 3) {
            return {
                variant: "default" as const,
                icon: Clock,
                title: "Payment Due Soon",
                color: "text-orange-600",
                bgColor: "bg-orange-50 border-orange-200",
                badgeColor: "bg-orange-100 text-orange-800"
            };
        } else {
            return {
                variant: "default" as const,
                icon: Calendar,
                title: "Upcoming Payment",
                color: "text-blue-600",
                bgColor: "bg-blue-50 border-blue-200",
                badgeColor: "bg-blue-100 text-blue-800"
            };
        }
    };

    if (visibleReminders.length === 0) {
        return null;
    }

    return (
        <div className="space-y-3 mb-6">
            {visibleReminders.map((reminder) => {
                const config = getReminderConfig(reminder);
                const Icon = config.icon;
                const daysUntilDue = getDaysUntilDue(reminder.due_date);

                return (
                    <Alert
                        key={reminder.id}
                        className={cn(
                            "relative animate-in slide-in-from-top-2 duration-300",
                            config.bgColor
                        )}
                    >
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-2 h-6 w-6"
                            onClick={() => handleAcknowledge(reminder.id)}
                        >
                            <X className="h-4 w-4" />
                        </Button>

                        <Icon className={cn("h-5 w-5 mt-0.5", config.color)} />

                        <div className="flex-1">
                            <AlertTitle className="text-base font-semibold mb-2 flex items-center gap-2">
                                {config.title}
                                <Badge variant="outline" className={config.badgeColor}>
                                    {reminder.reminder_type === "initial_due" ? "Initial Payment" : "Pending Payment"}
                                </Badge>
                            </AlertTitle>

                            <AlertDescription className="space-y-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="font-medium">Order:</span>{" "}
                                        <span className="font-mono">{reminder.order.order_number}</span>
                                    </div>
                                    <div>
                                        <span className="font-medium"> Amount:</span>{" "}
                                        <span className="font-semibold">Rs. {Number(reminder.amount).toLocaleString()}</span>
                                    </div>
                                    <div>
                                        <span className="font-medium">Due Date:</span>{" "}
                                        {new Date(reminder.due_date).toLocaleDateString()}
                                    </div>
                                    <div>
                                        <span className="font-medium">
                                            {daysUntilDue < 0 ? "Overdue by:" : "Due in:"}
                                        </span>{" "}
                                        <span className={cn(
                                            "font-semibold",
                                            daysUntilDue < 0 ? "text-red-600" : daysUntilDue <= 3 ? "text-orange-600" : "text-blue-600"
                                        )}>
                                            {Math.abs(daysUntilDue)} {Math.abs(daysUntilDue) === 1 ? "day" : "days"}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-3">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => router.push(`/orders/${reminder.order_id}`)}
                                        className="h-8"
                                    >
                                        View Order
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => handleAcknowledge(reminder.id)}
                                        className="h-8"
                                    >
                                        Acknowledge
                                    </Button>
                                </div>
                            </AlertDescription>
                        </div>
                    </Alert>
                );
            })}
        </div>
    );
}
