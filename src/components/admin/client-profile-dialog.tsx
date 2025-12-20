"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
    User, DollarSign, Package, TrendingUp, Clock,
    Building2, Tag, ChevronRight, Loader2, Edit
} from "lucide-react";
import { getDetailedUserProfile } from "@/app/admin/actions";
import { FinancialSummaryCard } from "@/components/shared/financial-summary-card";
import { PaymentTimeline } from "@/components/shared/payment-timeline";
import { OrderCardEnhanced } from "@/components/shared/order-card-enhanced";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePendingLimit } from "@/app/actions/pending-limit-actions";

interface ClientProfileDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId: string;
}

export function ClientProfileDialog({
    open,
    onOpenChange,
    userId,
}: ClientProfileDialogProps) {
    const [profileData, setProfileData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [editingLimit, setEditingLimit] = useState(false);
    const [newLimit, setNewLimit] = useState("");
    const [updatingLimit, setUpdatingLimit] = useState(false);

    const { toast } = useToast();

    // Load profile data when dialog opens
    React.useEffect(() => {
        if (open && userId) {
            loadProfile();
        }
    }, [open, userId]);

    async function loadProfile() {
        setLoading(true);
        try {
            const data = await getDetailedUserProfile(userId);
            setProfileData(data);
            setNewLimit(data.user.pending_amount_limit?.toString() || "0");
        } catch (error) {
            console.error("Error loading profile:", error);
            toast({
                title: "Error",
                description: "Failed to load user profile",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }

    async function handleUpdateLimit() {
        const limitValue = parseFloat(newLimit);

        if (isNaN(limitValue) || limitValue < 0) {
            toast({
                title: "Invalid Amount",
                description: "Please enter a valid limit amount",
                variant: "destructive",
            });
            return;
        }

        setUpdatingLimit(true);
        try {
            await updatePendingLimit(userId, limitValue);
            toast({
                title: "Limit Updated",
                description: `Pending limit updated to Rs. ${limitValue.toLocaleString()}`,
            });
            setEditingLimit(false);
            loadProfile(); // Reload to show updated data
        } catch (error: any) {
            toast({
                title: "Update Failed",
                description: error.message || "Failed to update limit",
                variant: "destructive",
            });
        } finally {
            setUpdatingLimit(false);
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-PK", {
            style: "currency",
            currency: "PKR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : profileData ? (
                    <>
                        <DialogHeader>
                            <DialogTitle className="font-serif text-3xl">Client Profile</DialogTitle>
                            <DialogDescription>
                                Complete financial overview and order history
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                            {/* User Info Header */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-16 w-16">
                                                <AvatarFallback className="text-2xl bg-[#2D5F3F] text-white">
                                                    {profileData.user.full_name?.charAt(0) || "U"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h3 className="text-2xl font-bold">{profileData.user.full_name}</h3>
                                                <p className="text-sm text-muted-foreground">{profileData.user.email}</p>
                                                {profileData.user.phone && (
                                                    <p className="text-sm text-muted-foreground">{profileData.user.phone}</p>
                                                )}
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="capitalize">
                                            {profileData.user.role.replace("_", " ")}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {profileData.user.assigned_salesman && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <User className="h-4 w-4" />
                                            <span className="text-muted-foreground">
                                                Assigned Salesman:{" "}
                                                <span className="font-medium text-foreground">
                                                    {profileData.user.assigned_salesman.full_name}
                                                </span>
                                            </span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Financial Summary */}
                            <FinancialSummaryCard
                                totalPending={profileData.financialSummary.currentPending}
                                pendingLimit={profileData.financialSummary.pendingLimit}
                                totalPaid={profileData.financialSummary.totalPaid}
                                totalLifetimeValue={profileData.financialSummary.totalLifetimeValue}
                            />

                            {/* Pending Limit Management */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-xl">Pending Limit Management</CardTitle>
                                        {!editingLimit && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setEditingLimit(true)}
                                            >
                                                <Edit className="h-4 w-4 mr-2" />
                                                Edit Limit
                                            </Button>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {editingLimit ? (
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="new-limit">New Pending Limit (PKR)</Label>
                                                <Input
                                                    id="new-limit"
                                                    type="number"
                                                    min="0"
                                                    step="1000"
                                                    value={newLimit}
                                                    onChange={(e) => setNewLimit(e.target.value)}
                                                    className="text-lg"
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={handleUpdateLimit}
                                                    disabled={updatingLimit}
                                                    className="bg-[#2D5F3F] hover:bg-[#234a32]"
                                                >
                                                    {updatingLimit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    Save Limit
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        setEditingLimit(false);
                                                        setNewLimit(profileData.user.pending_amount_limit?.toString() || "0");
                                                    }}
                                                    disabled={updatingLimit}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Current Limit</p>
                                                <p className="text-2xl font-bold">
                                                    {formatCurrency(profileData.user.pending_amount_limit || 0)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Status</p>
                                                <Badge
                                                    variant={profileData.financialSummary.status === "safe" ? "default" : "destructive"}
                                                    className="mt-1"
                                                >
                                                    {profileData.financialSummary.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Order History */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        <Package className="h-5 w-5" />
                                        Order History ({profileData.orders.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {profileData.orders.length === 0 ? (
                                        <p className="text-center text-muted-foreground py-8">No orders yet</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {profileData.orders.map((order: any) => (
                                                <OrderCardEnhanced
                                                    key={order.id}
                                                    order={order}
                                                    showPaymentHistory={true}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Payment Timeline */}
                            {profileData.allPayments && profileData.allPayments.length > 0 && (
                                <PaymentTimeline payments={profileData.allPayments} />
                            )}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Close
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">Failed to load profile data</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
