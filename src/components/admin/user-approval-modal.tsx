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
import { CheckCircle, XCircle } from "lucide-react";

interface User {
    id: string;
    full_name: string | null;
    email: string | null;
    role: string;
}

interface UserApprovalModalProps {
    user: User;
    onClose: () => void;
    onSubmit: (approved: boolean, creditLimit?: number) => Promise<void>;
}

export function UserApprovalModal({ user, onClose, onSubmit }: UserApprovalModalProps) {
    const [creditLimit, setCreditLimit] = useState<number>(50000);
    const [loading, setLoading] = useState(false);

    const handleApprove = async () => {
        setLoading(true);
        try {
            await onSubmit(true, creditLimit);
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        setLoading(true);
        try {
            await onSubmit(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-serif text-2xl">Review User Application</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div>
                        <p className="text-sm text-[#6B6B6B]">Name</p>
                        <p className="font-medium text-[#1A1A1A]">{user.full_name || "N/A"}</p>
                    </div>

                    <div>
                        <p className="text-sm text-[#6B6B6B]">Email</p>
                        <p className="font-medium text-[#1A1A1A]">{user.email}</p>
                    </div>

                    <div>
                        <p className="text-sm text-[#6B6B6B]">Role</p>
                        <p className="font-medium text-[#1A1A1A] capitalize">
                            {user.role.replace("_", " ")}
                        </p>
                    </div>

                    {(user.role === "retailer" || user.role === "beauty_parlor") && (
                        <div>
                            <Label htmlFor="creditLimit">Credit Limit (₹)</Label>
                            <Input
                                id="creditLimit"
                                type="number"
                                value={creditLimit}
                                onChange={(e) => setCreditLimit(Number(e.target.value))}
                                placeholder="Enter credit limit"
                                min="0"
                                step="1000"
                            />
                            <p className="text-xs text-[#6B6B6B] mt-1">
                                Set the maximum credit limit for this user
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={handleReject}
                        disabled={loading}
                        className="flex-1"
                    >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                    </Button>
                    <Button
                        onClick={handleApprove}
                        disabled={loading}
                        className="flex-1 bg-[#2D5F3F] hover:bg-[#2D5F3F]/90"
                    >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
