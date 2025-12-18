"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Package, Truck, XCircle } from "lucide-react";
import { formatDate } from "@/utils/export-utils";

interface OrderTimelineProps {
    status: string;
    createdAt: string;
    updatedAt?: string;
}

export function OrderTimelineView({ status, createdAt, updatedAt }: OrderTimelineProps) {
    const statuses = [
        { key: "created", label: "Order Placed", icon: Clock },
        { key: "confirmed", label: "Confirmed", icon: CheckCircle },
        { key: "processing", label: "Processing", icon: Package },
        { key: "shipped", label: "Shipped", icon: Truck },
        { key: "delivered", label: "Delivered", icon: CheckCircle },
    ];

    const currentStatusIndex = statuses.findIndex(s => s.key === status);

    return (
        <div className="space-y-4">
            {statuses.map((s, index) => {
                const Icon = s.icon;
                const isCompleted = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;

                return (
                    <div key={s.key} className="flex gap-4">
                        <div className="flex flex-col items-center">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center ${isCompleted
                                        ? "bg-[#2D5F3F] text-white"
                                        : "bg-[#E8E8E8] text-[#6B6B6B]"
                                    }`}
                            >
                                <Icon className="h-5 w-5" />
                            </div>
                            {index < statuses.length - 1 && (
                                <div
                                    className={`w-0.5 h-12 ${isCompleted ? "bg-[#2D5F3F]" : "bg-[#E8E8E8]"
                                        }`}
                                />
                            )}
                        </div>
                        <div className="flex-1 pb-8">
                            <p
                                className={`font-semibold ${isCurrent ? "text-[#1A1A1A]" : isCompleted ? "text-[#2D5F3F]" : "text-[#6B6B6B]"
                                    }`}
                            >
                                {s.label}
                            </p>
                            {isCurrent && (
                                <p className="text-sm text-[#6B6B6B] mt-1">
                                    {formatDate(updatedAt || createdAt, true)}
                                </p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
