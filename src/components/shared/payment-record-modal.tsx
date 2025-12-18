"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, DollarSign } from "lucide-react";

interface PaymentRecordModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orderId: string;
    orderNumber: string;
    pendingAmount: number;
    onPaymentRecorded?: () => void;
    recordPaymentAction: (orderId: string, amount: number, method: string, notes: string) => Promise<{ success?: boolean; error?: string }>;
}

export function PaymentRecordModal({
    open,
    onOpenChange,
    orderId,
    orderNumber,
    pendingAmount,
    onPaymentRecorded,
    recordPaymentAction,
}: PaymentRecordModalProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [amount, setAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<string>("cash");
    const [notes, setNotes] = useState("");

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-PK", {
            style: "currency",
            currency: "PKR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const paymentAmount = parseFloat(amount);

        if (isNaN(paymentAmount) || paymentAmount <= 0) {
            toast({
                title: "Invalid Amount",
                description: "Please enter a valid payment amount greater than 0",
                variant: "destructive",
            });
            return;
        }

        if (paymentAmount > pendingAmount) {
            toast({
                title: "Amount Exceeds Pending",
                description: `Payment amount (${formatCurrency(paymentAmount)}) cannot exceed pending amount (${formatCurrency(pendingAmount)})`,
                variant: "destructive",
            });
            return;
        }

        if (!notes.trim()) {
            toast({
                title: "Notes Required",
                description: "Please add notes describing this payment",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);

        try {
            const result = await recordPaymentAction(orderId, paymentAmount, paymentMethod, notes);

            if (result.error) {
                toast({
                    title: "Payment Recording Failed",
                    description: result.error,
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Payment Recorded Successfully",
                    description: `${formatCurrency(paymentAmount)} payment recorded for order ${orderNumber}`,
                });

                // Reset form
                setAmount("");
                setPaymentMethod("cash");
                setNotes("");

                onOpenChange(false);
                onPaymentRecorded?.();
            }
        } catch (error) {
            console.error("Error recording payment:", error);
            toast({
                title: "Error",
                description: "Failed to record payment. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="font-serif text-2xl flex items-center gap-2">
                            <DollarSign className="h-6 w-6 text-[#2D5F3F]" />
                            Record Payment
                        </DialogTitle>
                        <DialogDescription>
                            Record a partial or full payment for order <span className="font-mono font-medium">{orderNumber}</span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Pending Amount Display */}
                        <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                            <p className="text-sm text-muted-foreground">Pending Amount</p>
                            <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                                {formatCurrency(pendingAmount)}
                            </p>
                        </div>

                        {/* Payment Amount */}
                        <div className="space-y-2">
                            <Label htmlFor="amount">Payment Amount (PKR) *</Label>
                            <Input
                                id="amount"
                                type="number"
                                min="0"
                                step="0.01"
                                max={pendingAmount}
                                placeholder="Enter amount"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                                className="text-lg"
                            />
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setAmount((pendingAmount / 2).toFixed(2))}
                                >
                                    Half
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setAmount(pendingAmount.toFixed(2))}
                                >
                                    Full Amount
                                </Button>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="space-y-2">
                            <Label htmlFor="payment-method">Payment Method *</Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger id="payment-method">
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

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="notes">Payment Notes *</Label>
                            <Textarea
                                id="notes"
                                placeholder="E.g., First installment, collected in person, reference #12345"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                required
                                rows={3}
                            />
                            <p className="text-xs text-muted-foreground">
                                Add details about this payment for record-keeping
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-[#2D5F3F] hover:bg-[#234a32]"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Record Payment
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
