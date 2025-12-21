"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { notify } from "@/lib/notifications";
import { Check, X, UserPlus, Mail, Phone, Calendar, ShieldCheck, UserX } from "lucide-react";
import { getPendingUsersAction, approveUserAction, deleteUserAction } from "@/app/admin/actions";

export default function ApprovalsPage() {
    const [pendingUsers, setPendingUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        loadPendingUsers();
    }, []);

    async function loadPendingUsers() {
        setLoading(true);
        try {
            const data = await getPendingUsersAction();
            setPendingUsers(data);
        } catch (error: any) {
            notify.error("Error", "Failed to load pending users");
        } finally {
            setLoading(false);
        }
    }

    const handleApprove = async (userId: string) => {
        setActionLoading(userId);
        try {
            await approveUserAction(userId);
            notify.success("User Approved", "The user account is now active.");
            loadPendingUsers();
        } catch (error: any) {
            notify.error("Error", error.message || "Failed to approve user");
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (userId: string) => {
        if (!confirm("Are you sure you want to REJECT and DELETE this registration? This action cannot be undone.")) return;

        setActionLoading(userId);
        try {
            await deleteUserAction(userId);
            notify.success("Registration Rejected", "The user record has been removed.");
            loadPendingUsers();
        } catch (error: any) {
            notify.error("Error", error.message || "Failed to reject user");
        } finally {
            setActionLoading(null);
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case "admin": return "bg-[#1A1A1A] text-white";
            case "sub_admin": return "bg-[#2C2C2C] text-white";
            case "beauty_parlor": return "bg-[#D4AF37] text-white";
            case "retailer": return "bg-[#C77D2E] text-white";
            case "salesman": return "bg-blue-600 text-white";
            default: return "bg-[#6B6B6B] text-white";
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="font-serif text-4xl font-semibold text-[#1A1A1A]">
                        User Approvals
                    </h1>
                    <p className="text-[#6B6B6B] mt-2">
                        Verify and activate new registrations to the platform
                    </p>
                </div>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-white border-b">
                    <CardTitle className="font-serif text-2xl flex items-center gap-2">
                        <UserPlus className="h-6 w-6 text-[#D4AF37]" />
                        Pending Verification ({pendingUsers.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-3 text-[#6B6B6B]">
                            <div className="h-8 w-8 border-4 border-[#C77D2E] border-t-transparent rounded-full animate-spin"></div>
                            Loading pending registrations...
                        </div>
                    ) : pendingUsers.length === 0 ? (
                        <div className="text-center py-24 text-[#6B6B6B]">
                            <ShieldCheck className="h-16 w-16 mx-auto mb-4 opacity-20 text-green-600" />
                            <p className="text-lg font-medium">Clear Queue!</p>
                            <p className="text-sm">No users currently awaiting approval.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-[#FDFCF9]">
                                <TableRow>
                                    <TableHead>User Identification</TableHead>
                                    <TableHead>Contact Info</TableHead>
                                    <TableHead>Role Requested</TableHead>
                                    <TableHead>Registration Date</TableHead>
                                    <TableHead className="text-right">Decision</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingUsers.map((user) => (
                                    <TableRow key={user.id} className="hover:bg-[#FDFCF9]/50 transition-colors">
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-lg text-[#1A1A1A]">
                                                    {user.full_name || "N/A"}
                                                </span>
                                                <span className="text-[10px] text-[#6B6B6B] font-mono select-all">
                                                    ID: {user.id}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm text-[#1A1A1A]">
                                                    <Mail className="h-3 w-3 text-[#D4AF37]" />
                                                    {user.email}
                                                </div>
                                                {user.phone && (
                                                    <div className="flex items-center gap-2 text-xs text-[#6B6B6B]">
                                                        <Phone className="h-3 w-3" />
                                                        {user.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getRoleBadgeColor(user.role)}>
                                                {user.role.replace("_", " ")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm text-[#6B6B6B]">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-[#8B3A3A] hover:text-[#8B3A3A] hover:bg-red-50"
                                                    disabled={actionLoading === user.id}
                                                    onClick={() => handleReject(user.id)}
                                                >
                                                    <UserX className="h-4 w-4 mr-1" />
                                                    Reject
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="bg-[#2D5F3F] hover:bg-[#1E422B] text-white"
                                                    disabled={actionLoading === user.id}
                                                    onClick={() => handleApprove(user.id)}
                                                >
                                                    {actionLoading === user.id ? (
                                                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    ) : (
                                                        <>
                                                            <Check className="h-4 w-4 mr-1" />
                                                            Approve
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
