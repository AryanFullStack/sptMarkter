"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createCoupon, updateCoupon } from "@/app/admin/actions";

export function CouponForm({ coupon, onClose }: any) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        code: coupon?.code || "",
        description: coupon?.description || "",
        discount_type: coupon?.discount_type || "percentage",
        discount_value: coupon?.discount_value || 0,
        min_order_amount: coupon?.min_order_amount || 0,
        max_discount_amount: coupon?.max_discount_amount || null,
        usage_limit: coupon?.usage_limit || null,
        valid_from: coupon?.valid_from || "",
        valid_until: coupon?.valid_until || "",
        is_active: coupon?.is_active ?? true,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (coupon) {
                await updateCoupon(coupon.id, formData);
            } else {
                await createCoupon(formData);
            }
            onClose();
        } catch (error: any) {
            alert(error.message || "Failed to save coupon");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="font-serif text-2xl">
                        {coupon ? "Edit Coupon" : "Create Coupon"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <Label>Coupon Code *</Label>
                            <Input
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                placeholder="e.g., SAVE20"
                                required
                            />
                        </div>

                        <div>
                            <Label>Discount Type *</Label>
                            <Select
                                value={formData.discount_type}
                                onValueChange={(value) => setFormData({ ...formData, discount_type: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="percentage">Percentage</SelectItem>
                                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <Label>Description</Label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe this coupon..."
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <Label>Discount Value *</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.discount_value}
                                onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
                                required
                            />
                        </div>

                        <div>
                            <Label>Min Order Amount</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.min_order_amount}
                                onChange={(e) => setFormData({ ...formData, min_order_amount: parseFloat(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <Label>Max Discount Amount</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.max_discount_amount || ""}
                                onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value ? parseFloat(e.target.value) : null })}
                                placeholder="Optional"
                            />
                        </div>

                        <div>
                            <Label>Usage Limit</Label>
                            <Input
                                type="number"
                                value={formData.usage_limit || ""}
                                onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value ? parseInt(e.target.value) : null })}
                                placeholder="Leave empty for unlimited"
                            />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <Label>Valid From</Label>
                            <Input
                                type="datetime-local"
                                value={formData.valid_from}
                                onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                            />
                        </div>

                        <div>
                            <Label>Valid Until</Label>
                            <Input
                                type="datetime-local"
                                value={formData.valid_until}
                                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch
                            checked={formData.is_active}
                            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                        />
                        <Label>Active</Label>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : coupon ? "Update" : "Create"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
