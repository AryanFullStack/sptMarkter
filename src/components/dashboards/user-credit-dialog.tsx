"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CreditCard, History, Plus, Minus, RefreshCcw } from "lucide-react";
import { getUserCredit, getCreditTransactions, updateUserCredit } from "@/app/actions/credit-actions";
import { useToast } from "@/hooks/use-toast";

interface UserCreditDialogProps {
    userId: string;
    userName: string;
    isOpen: boolean;
    onClose: () => void;
}

export function UserCreditDialog({ userId, userName, isOpen, onClose }: UserCreditDialogProps) {
    const [balance, setBalance] = useState({ balance: 0, used_credit: 0, pending_credit: 0 });
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState("");
    const [type, setType] = useState<"add" | "deduct" | "adjustment">("add");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (isOpen && userId) {
            loadData();
        }
    }, [isOpen, userId]);

    async function loadData() {
        setLoading(true);
        try {
            const [creditData, txData] = await Promise.all([
                getUserCredit(userId),
                getCreditTransactions(userId)
            ]);
            setBalance(creditData);
            setTransactions(txData);
        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "Failed to load credit data", variant: "destructive" });
        }
        setLoading(false);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!amount || isNaN(Number(amount))) {
            toast({ title: "Invalid Amount", variant: "destructive" });
            return;
        }
        setSubmitting(true);
        try {
            const result = await updateUserCredit(userId, Number(amount), type, description);
            if (result.error) {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            } else {
                toast({ title: "Success", description: "Credit updated successfully" });
                setAmount("");
                setDescription("");
                loadData(); // Reload data
            }
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        }
        setSubmitting(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Credit Management - {userName}</DialogTitle>
                    <DialogDescription>Manage credit balance and view history.</DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="py-10 text-center">Loading...</div>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-[#F7F5F2] p-4 rounded-lg text-center">
                                <div className="text-sm text-[#6B6B6B]">Available Balance</div>
                                <div className="text-2xl font-bold text-[#1A1A1A]">Rs. {Number(balance.balance).toLocaleString()}</div>
                            </div>
                            <div className="bg-[#F7F5F2] p-4 rounded-lg text-center">
                                <div className="text-sm text-[#6B6B6B]">Used Credit</div>
                                <div className="text-xl font-semibold text-[#6B6B6B]">Rs. {Number(balance.used_credit).toLocaleString()}</div>
                            </div>
                            <div className="bg-[#F7F5F2] p-4 rounded-lg text-center">
                                <div className="text-sm text-[#6B6B6B]">Pending</div>
                                <div className="text-xl font-semibold text-[#C77D2E]">Rs. {Number(balance.pending_credit).toLocaleString()}</div>
                            </div>
                        </div>

                        <div className="border rounded-lg p-4 space-y-4">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <RefreshCcw className="h-4 w-4" /> Update Credit
                            </h3>
                            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-4 items-end">
                                <div className="space-y-1">
                                    <Label>Type</Label>
                                    <Select value={type} onValueChange={(v: any) => setType(v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="add">Add Credit</SelectItem>
                                            <SelectItem value="deduct">Deduct Credit</SelectItem>
                                            <SelectItem value="adjustment">Adjustment</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label>Amount (Rs.)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label>Description/Notes</Label>
                                    <Input
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Reason for update..."
                                    />
                                </div>
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? "Updating..." : "Update"}
                                </Button>
                            </form>
                        </div>

                        <div>
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                <History className="h-4 w-4" /> Transaction History
                            </h3>
                            <div className="border rounded-lg overflow-hidden">
                                <div className="max-h-[300px] overflow-y-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-[#F7F5F2] text-[#6B6B6B] sticky top-0">
                                            <tr>
                                                <th className="p-3">Date</th>
                                                <th className="p-3">Type</th>
                                                <th className="p-3">Amount</th>
                                                <th className="p-3">Description</th>
                                                <th className="p-3">By</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {transactions.length === 0 ? (
                                                <tr><td colSpan={5} className="p-4 text-center text-[#6B6B6B]">No transactions found.</td></tr>
                                            ) : (
                                                transactions.map(tx => (
                                                    <tr key={tx.id} className="border-t border-[#F7F5F2]">
                                                        <td className="p-3">{new Date(tx.created_at).toLocaleDateString()}</td>
                                                        <td className="p-3 capitalize">
                                                            <span className={`px-2 py-0.5 rounded text-xs ${tx.type === 'add' ? 'bg-green-100 text-green-800' :
                                                                tx.type === 'deduct' ? 'bg-red-100 text-red-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                {tx.type}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 font-semibold">Rs. {Number(tx.amount).toLocaleString()}</td>
                                                        <td className="p-3 text-[#6B6B6B]">{tx.description || '-'}</td>
                                                        <td className="p-3 text-xs">{tx.performer?.email || 'System'}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
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
