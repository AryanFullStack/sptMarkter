"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Trash, MapPin } from "lucide-react";
import { updateUserRoleAction, deleteUserAction } from "@/app/admin/actions";
import { useToast } from "@/hooks/use-toast";
import { UserPendingLimitDialog } from "./user-pending-limit-dialog";

interface User {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    role: string;
    approved: boolean;
    created_at: string;
    address?: {
        city: string;
        type: string;
    } | null;
}

interface UsersTableProps {
    users: User[];
    onUpdate: () => void;
}

export function UsersTable({ users, onUpdate }: UsersTableProps) {
    const { toast } = useToast();
    const [updating, setUpdating] = useState<string | null>(null);
    const [selectedUserForLimit, setSelectedUserForLimit] = useState<{ id: string, name: string, role: string } | null>(null);

    const handleUpdateUserRole = async (userId: string, newRole: string) => {
        setUpdating(userId);
        try {
            await updateUserRoleAction(userId, newRole);
            toast({ title: "Role Updated", description: "User role has been updated." });
            onUpdate();
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to update role", variant: "destructive" });
        } finally {
            setUpdating(null);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
        try {
            await deleteUserAction(userId);
            toast({ title: "User Deleted", description: "User has been removed." });
            onUpdate();
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to delete user", variant: "destructive" });
        }
    };

    if (users.length === 0) {
        return (
            <div className="text-center py-12 text-[#6B6B6B]">
                <p>No users found.</p>
            </div>
        );
    }

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>User Details</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-[#1A1A1A]">{user.full_name || "N/A"}</span>
                                    <span className="text-xs text-[#6B6B6B]">Joined {new Date(user.created_at).toLocaleDateString()}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col text-sm">
                                    <span>{user.email}</span>
                                    <span className="text-[#6B6B6B]">{user.phone || "No phone"}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                {user.address ? (
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3 text-[#C77D2E]" />
                                            <span className="font-medium">{user.address.city}</span>
                                        </div>
                                        <span className="text-xs capitalize text-[#6B6B6B]">{user.address.type}</span>
                                    </div>
                                ) : (
                                    <span className="text-[#6B6B6B] italic">N/A</span>
                                )}
                            </TableCell>
                            <TableCell>
                                <Select
                                    value={user.role}
                                    onValueChange={(newRole) => handleUpdateUserRole(user.id, newRole)}
                                    disabled={updating === user.id}
                                >
                                    <SelectTrigger className="w-[140px] h-8 text-xs">
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="local_customer">Local Customer</SelectItem>
                                        <SelectItem value="retailer">Retailer</SelectItem>
                                        <SelectItem value="beauty_parlor">Beauty Parlor</SelectItem>
                                        <SelectItem value="salesman">Salesman</SelectItem>
                                        <SelectItem value="sub_admin">Sub Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell>
                                {user.approved ? (
                                    <Badge className="bg-[#2D5F3F] text-white hover:bg-[#2D5F3F]">Approved</Badge>
                                ) : (
                                    <Badge className="bg-[#C77D2E] text-white hover:bg-[#C77D2E]">Pending</Badge>
                                )}
                            </TableCell>
                            <TableCell>
                                <div className="flex gap-2">
                                    {(user.role === 'retailer' || user.role === 'beauty_parlor') && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 text-xs"
                                            onClick={() => setSelectedUserForLimit({ id: user.id, name: user.full_name || user.email, role: user.role })}
                                        >
                                            Set Pending Limit
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                                        onClick={() => handleDeleteUser(user.id)}
                                    >
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {selectedUserForLimit && (
                <UserPendingLimitDialog
                    userId={selectedUserForLimit.id}
                    userName={selectedUserForLimit.name}
                    isOpen={!!selectedUserForLimit}
                    onClose={() => setSelectedUserForLimit(null)}
                />
            )}
        </>
    );
}
