"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { notify } from "@/lib/notifications";
import { User, Phone, Mail, Save, MapPin, Plus, Trash2, Shield, Lock, Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AddressForm } from "@/components/checkout/address-form";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface ProfileFormProps {
    user: any;
    initialData: {
        full_name: string;
        phone: string;
        email: string;
        role: string;
    };
}

export function ProfileForm({ user, initialData }: ProfileFormProps) {
    const [formData, setFormData] = useState({
        full_name: initialData.full_name || "",
        phone: initialData.phone || "",
    });
    const [passwordData, setPasswordData] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [showPasswords, setShowPasswords] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingPassword, setLoadingPassword] = useState(false);
    const [addresses, setAddresses] = useState<any[]>([]);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [loadingAddresses, setLoadingAddresses] = useState(true);
    const [savingAddress, setSavingAddress] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        try {
            const { data, error } = await supabase
                .from("addresses")
                .select("*")
                .eq("user_id", user.id)
                .order("is_default", { ascending: false });

            if (error) throw error;
            setAddresses(data || []);
        } catch (error) {
            console.error("Error fetching addresses:", error);
        } finally {
            setLoadingAddresses(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from("users")
                .update({
                    full_name: formData.full_name,
                    phone: formData.phone,
                })
                .eq("id", user.id);

            if (error) throw error;

            notify.success("Profile Synchronized", "Your professional credentials have been successfully updated.");
        } catch (error: any) {
            console.error("Error updating profile:", error);
            notify.error("Synchronization Failed", error.message || "Unable to update profile at this time.");
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            notify.error("Mismatch Detected", "The new password and confirmation do not align.");
            return;
        }

        if (passwordData.newPassword.length < 6) {
            notify.error("Insufficient Strength", "Security protocol requires a minimum of 6 characters.");
            return;
        }

        setLoadingPassword(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: passwordData.newPassword
            });

            if (error) throw error;

            notify.success("Access Updated", "Your security credentials have been successfully rotated.");

            setPasswordData({
                oldPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
        } catch (error: any) {
            console.error("Error updating password:", error);
            notify.error("Security Update Failed", error.message || "Unable to rotate access credentials.");
        } finally {
            setLoadingPassword(false);
        }
    };

    const handleAddAddress = async (addressData: any) => {
        setSavingAddress(true);
        try {
            if (addressData.is_default) {
                await supabase
                    .from("addresses")
                    .update({ is_default: false })
                    .eq("user_id", user.id);
            }

            const { data, error } = await supabase
                .from("addresses")
                .insert({
                    ...addressData,
                    user_id: user.id,
                })
                .select()
                .single();

            if (error) throw error;

            setAddresses((prev) => {
                if (data.is_default) {
                    return [data, ...prev.map(a => ({ ...a, is_default: false }))];
                }
                return [...prev, data];
            });
            setShowAddressForm(false);
            notify.success("Registry Updated", "New operational address has been successfully logged.");
            fetchAddresses();
        } catch (error: any) {
            console.error("Error adding address:", error);
            notify.error("Registry Error", error.message || "Failed to log new address.");
        } finally {
            setSavingAddress(false);
        }
    };

    const handleDeleteAddress = async (id: string) => {
        try {
            const { error } = await supabase
                .from("addresses")
                .delete()
                .eq("id", id);

            if (error) throw error;

            setAddresses(addresses.filter(a => a.id !== id));
            notify.success("Address Purged", "The specifies location has been removed from the registry.");
        } catch (error: any) {
            console.error("Error deleting address:", error);
            notify.error("Purge Failed", error.message || "Failed to remove the address.");
        }
    };

    return (
        <div className="space-y-8 pb-20 px-0">
            {/* Identity & Contact - Simplified */}
            <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden rounded-2xl">
                <CardHeader className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-slate-900 rounded-xl text-white shadow-md">
                            <User className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold text-slate-900">Partner Persona</CardTitle>
                            <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Primary identity & contact hub</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Registry Email</Label>
                                <Input
                                    value={initialData.email}
                                    disabled
                                    className="h-11 bg-slate-100/50 border-slate-200 rounded-xl font-medium text-slate-900 opacity-60"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Authorization Tier</Label>
                                <Input
                                    value={initialData.role.replace("_", " ").toUpperCase()}
                                    disabled
                                    className="h-11 bg-slate-100/50 border-slate-200 rounded-xl font-bold text-slate-900 opacity-60"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="full_name" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Operational Name</Label>
                                <Input
                                    id="full_name"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    className="h-11 border-slate-200 rounded-xl font-medium text-slate-900 focus:border-slate-400 transition-all"
                                    placeholder="Legal Identity"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="phone" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Direct Communication</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="h-11 border-slate-200 rounded-xl font-medium text-slate-900 focus:border-slate-400 transition-all"
                                    placeholder="Contact Number"
                                    type="tel"
                                />
                            </div>
                        </div>

                        <div className="flex justify-start">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="h-11 px-8 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 text-xs uppercase tracking-wider"
                            >
                                {loading ? "Updating..." : "Save Identity Changes"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Access Security - Simplified */}
            <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden rounded-2xl">
                <CardHeader className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-slate-900 rounded-xl text-white shadow-md">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold text-slate-900">Access Security</CardTitle>
                            <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Security & credentials hub</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <form onSubmit={handlePasswordUpdate} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">New PIN</Label>
                                <Input
                                    type="password"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    className="h-11 border-slate-200 rounded-xl font-medium"
                                    placeholder="Enter new PIN"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Confirm PIN</Label>
                                <Input
                                    type="password"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    className="h-11 border-slate-200 rounded-xl font-medium"
                                    placeholder="Confirm new PIN"
                                />
                            </div>
                            <div className="flex items-end">
                                <Button
                                    type="submit"
                                    disabled={loadingPassword}
                                    className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 text-xs uppercase tracking-wider"
                                >
                                    {loadingPassword ? "Updating Access..." : "Rotate Access PIN"}
                                </Button>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Distribution Hubs - Simplified */}
            <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden rounded-2xl">
                <CardHeader className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-slate-900 rounded-xl text-white shadow-md">
                                <MapPin className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold text-slate-900">Distribution Hubs</CardTitle>
                                <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Operational dispatch registry</CardDescription>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAddressForm(!showAddressForm)}
                            className="rounded-xl border-slate-200 font-bold hover:bg-slate-50 transition-all text-[10px] uppercase tracking-wider px-4"
                        >
                            {showAddressForm ? "Collapse Form" : "Append Location"}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    {showAddressForm && (
                        <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-top-4 duration-500">
                            <AddressForm
                                onSubmit={handleAddAddress}
                                onCancel={() => setShowAddressForm(false)}
                                isLoading={savingAddress}
                            />
                        </div>
                    )}

                    {loadingAddresses ? (
                        <div className="flex justify-center py-10 opacity-20">
                            <div className="animate-spin h-6 w-6 border-2 border-slate-900 border-t-transparent rounded-full" />
                        </div>
                    ) : addresses.length === 0 ? (
                        <div className="text-center py-10 opacity-30">
                            <MapPin className="h-10 w-10 mx-auto mb-2" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">No operational addresses logged</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {addresses.map((address) => (
                                <div
                                    key={address.id}
                                    className={cn(
                                        "p-5 rounded-xl border transition-all group",
                                        address.is_default ? "bg-slate-900 border-slate-900 text-white shadow-md" : "bg-white border-slate-100 hover:border-slate-300"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={cn("p-1.5 rounded-lg", address.is_default ? "bg-white/10" : "bg-slate-100")}>
                                                <MapPin className={cn("h-3.5 w-3.5", address.is_default ? "text-white" : "text-slate-900")} />
                                            </div>
                                            <p className="text-[9px] font-bold uppercase tracking-wider">{address.type || 'Standard Registry'}</p>
                                        </div>
                                        {address.is_default && (
                                            <span className="text-[8px] font-bold uppercase bg-white/20 px-2 py-0.5 rounded-full">Primary</span>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-bold text-sm">Target ID: {address.full_name}</p>
                                        <p className={cn("text-xs font-medium", address.is_default ? "text-white/60" : "text-slate-500")}>
                                            {address.address_line1}, {address.city}, {address.state}
                                        </p>
                                    </div>
                                    <div className="mt-4 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className={cn("text-[10px] font-bold", address.is_default ? "text-white/40" : "text-slate-400")}>{address.phone}</p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteAddress(address.id)}
                                            className={cn("h-7 px-2 hover:bg-red-500 hover:text-white rounded-lg transition-colors", address.is_default && "hover:bg-red-600")}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

