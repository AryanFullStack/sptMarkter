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
import { createClient } from "@/supabase/client";
import { UserPlus } from "lucide-react";

interface CreateSubAdminModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateSubAdminModal({ onClose, onSuccess }: CreateSubAdminModalProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // Note: In production, you'd want to use an admin API to create users
            // For now, we'll just create a user record
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (authError) throw authError;

            if (authData.user) {
                // Update user role to sub_admin
                const { error: updateError } = await supabase
                    .from("users")
                    .update({
                        role: "sub_admin",
                        full_name: fullName,
                    })
                    .eq("id", authData.user.id);

                if (updateError) throw updateError;

                onSuccess();
                onClose();
            }
        } catch (err: any) {
            setError(err.message || "Failed to create sub-admin");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-serif text-2xl">Create Sub-Admin</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                            id="fullName"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Enter full name"
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter email address"
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="password">Temporary Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter temporary password"
                            required
                            minLength={6}
                        />
                        <p className="text-xs text-[#6B6B6B] mt-1">
                            Minimum 6 characters. User will be able to change this later.
                        </p>
                    </div>

                    {error && (
                        <p className="text-sm text-[#8B3A3A] bg-[#8B3A3A]/10 p-2 rounded">
                            {error}
                        </p>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            {loading ? "Creating..." : "Create Sub-Admin"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
