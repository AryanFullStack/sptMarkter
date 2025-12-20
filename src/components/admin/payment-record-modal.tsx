"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { FileUpload } from "@/components/shared/file-upload";
import { recordPayment } from "@/app/admin/actions";
import { compressAndUploadImage } from "@/utils/image-compression";
import { formatCurrency } from "@/utils/export-utils";
import { Loader2 } from "lucide-react";

interface Order {
    id: string;
    order_number: string;
    total_amount: number;
    paid_amount: number | null;
    pending_amount: number | null;
}

interface PaymentRecordModalProps {
    order: Order;
    onClose: () => void;
    onSuccess: () => void;
}

export function PaymentRecordModal({ order, onClose, onSuccess }: PaymentRecordModalProps) {
    const [loading, setLoading] = useState(false);
    const [uploadingProof, setUploadingProof] = useState(false);
    const [formData, setFormData] = useState({
        amount: order.pending_amount || order.total_amount,
        payment_method: "cash" as const,
        notes: "",
        proof_url: "",
    });

    const pendingAmount = order.pending_amount || order.total_amount;

    const handleFileSelect = async (files: File[]) => {
        if (files.length === 0) return;

        setUploadingProof(true);
        try {
            const url = await compressAndUploadImage(files[0], "payment-proofs", "payments");
            setFormData({ ...formData, proof_url: url });
        } catch (error) {
            console.error("Error uploading proof:", error);
            alert("Failed to upload payment proof");
        } finally {
            setUploadingProof(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await recordPayment({
                order_id: order.id,
                amount: formData.amount,
                payment_method: formData.payment_method,
                notes: formData.notes,
                proof_url: formData.proof_url || undefined,
            });

            onSuccess();
        } catch (error: any) {
            console.error("Error recording payment:", error);
            alert(error.message || "Failed to record payment");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="font-serif text-2xl">Record Payment</DialogTitle>
                    <div className="text-sm text-[#6B6B6B] space-y-1 mt-2">
                        <p>Order: <span className="font-mono">#{order.order_number}</span></p>
                        <p>Total: {formatCurrency(order.total_amount)}</p>
                        <p>Paid: {formatCurrency(order.paid_amount || 0)}</p>
                        <p className="text-[#C77D2E] font-semibold">
                            Pending: {formatCurrency(pendingAmount)}
                        </p>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="amount">Payment Amount (Rs.) *</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                            max={pendingAmount}
                            required
                        />
                        <div className="flex justify-between text-xs text-[#6B6B6B] mt-1">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, amount: pendingAmount })}
                                className="text-[#D4AF37] hover:underline"
                            >
                                Full payment
                            </button>
                            <span>
                                Remaining: {formatCurrency(pendingAmount - formData.amount)}
                            </span>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="payment_method">Payment Method *</Label>
                        <Select
                            value={formData.payment_method}
                            onValueChange={(value: any) => setFormData({ ...formData, payment_method: value })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                <SelectItem value="card">Card</SelectItem>
                                <SelectItem value="online">Online Payment</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Add any notes about this payment..."
                            rows={3}
                        />
                    </div>

                    <div>
                        <Label>Payment Proof (Optional)</Label>
                        <FileUpload
                            onFileSelect={handleFileSelect}
                            accept="image/*"
                            maxSize={5}
                            preview={false}
                        />
                        {uploadingProof && (
                            <div className="flex items-center gap-2 text-sm text-[#6B6B6B] mt-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Uploading proof...
                            </div>
                        )}
                        {formData.proof_url && !uploadingProof && (
                            <div className="mt-2">
                                <img
                                    src={formData.proof_url}
                                    alt="Payment proof"
                                    className="w-32 h-32 object-cover rounded border"
                                />
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={loading || uploadingProof}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || uploadingProof || formData.amount <= 0}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Recording...
                                </>
                            ) : (
                                "Record Payment"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
