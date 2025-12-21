"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import { getPendingLimitInfo, updatePendingLimit } from "@/app/actions/pending-limit-actions";
import { notify } from "@/lib/notifications";

interface UserPendingLimitDialogProps {
    userId: string;
    userName: string;
    isOpen: boolean;
    onClose: () => void;
}

export function UserPendingLimitDialog({ userId, userName, isOpen, onClose }: UserPendingLimitDialogProps) {
    const [pendingInfo, setPendingInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [newLimit, setNewLimit] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && userId) {
            loadData();
        }
    }, [isOpen, userId]);

    async function loadData() {
        setLoading(true);
        try {
            const data = await getPendingLimitInfo(userId);
            if (data.error) {
                notify.error("Error", data.error);
            } else {
                setPendingInfo(data);
                setNewLimit(data.pendingAmountLimit?.toString() || "0");
            }
        } catch (e) {
            console.error(e);
            notify.error("Error", "Failed to load pending limit data");
        }
        setLoading(false);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!newLimit || isNaN(Number(newLimit)) || Number(newLimit) < 0) {
            notify.error("Invalid Limit", "Please enter a valid positive number");
            return;
        }
        setSubmitting(true);
        try {
            const result = await updatePendingLimit(userId, Number(newLimit));
            if (result.error) {
                notify.error("Error", result.error);
            } else {
                notify.success("Success", "Pending amount limit updated successfully");
                loadData(); // Reload data
            }
        } catch (e: any) {
            notify.error("Error", e.message);
        }
        setSubmitting(false);
    }

    const usagePercentage = pendingInfo
        ? (pendingInfo.currentPending / pendingInfo.pendingAmountLimit) * 100
        : 0;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Manage Pending Amount Limit - {userName}</DialogTitle>
                    <DialogDescription>Set the maximum pending amount allowed for this user.</DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="py-10 text-center">Loading...</div>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-[#F7F5F2] p-4 rounded-lg text-center">
                                <div className="text-sm text-[#6B6B6B]">Current Pending</div>
                                <div className="text-2xl font-bold text-[#C77D2E]">
                                    Rs. {Number(pendingInfo?.currentPending || 0).toLocaleString()}
                                </div>
                            </div>
                            <div className="bg-[#F7F5F2] p-4 rounded-lg text-center">
                                <div className="text-sm text-[#6B6B6B]">Allowed Limit</div>
                                <div className="text-2xl font-bold text-[#1A1A1A]">
                                    Rs. {Number(pendingInfo?.pendingAmountLimit || 0).toLocaleString()}
                                </div>
                            </div>
                            <div className="bg-[#F7F5F2] p-4 rounded-lg text-center">
                                <div className="text-sm text-[#6B6B6B]">Remaining</div>
                                <div className="text-2xl font-bold text-[#2D5F3F]">
                                    Rs. {Number(pendingInfo?.remainingAllowed || 0).toLocaleString()}
                                </div>
                            </div>
                        </div>

                        {pendingInfo?.pendingAmountLimit > 0 && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-[#6B6B6B]">Usage</span>
                                    <span className="font-semibold">{usagePercentage.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all ${usagePercentage >= 90
                                            ? "bg-red-500"
                                            : usagePercentage >= 70
                                                ? "bg-[#C77D2E]"
                                                : "bg-[#2D5F3F]"
                                            }`}
                                        style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {usagePercentage >= 90 && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-red-700">
                                    <p className="font-semibold">High Usage Warning</p>
                                    <p>This user is near their pending amount limit ({usagePercentage.toFixed(0)}% used).</p>
                                </div>
                            </div>
                        )}

                        <div className="border rounded-lg p-4 space-y-4">
                            <h3 className="font-semibold text-lg">Update Limit</h3>
                            <form onSubmit={handleSubmit} className="grid gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="newLimit">New Pending Amount Limit (Rs.)</Label>
                                    <Input
                                        id="newLimit"
                                        type="number"
                                        min={0}
                                        step="100"
                                        value={newLimit}
                                        onChange={(e) => setNewLimit(e.target.value)}
                                        placeholder="Enter limit amount..."
                                        required
                                    />
                                    <p className="text-xs text-[#6B6B6B]">
                                        Set to 0 to prevent any pending payments (full payment required at checkout).
                                    </p>
                                </div>
                                <Button type="submit" disabled={submitting} className="w-full">
                                    {submitting ? "Updating..." : "Update Limit"}
                                </Button>
                            </form>
                        </div>
                    </div>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
