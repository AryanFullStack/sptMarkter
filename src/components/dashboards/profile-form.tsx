"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { notify } from "@/lib/notifications";
import { User, Phone, Mail, Save, MapPin, Plus, Trash2, Shield, Lock, Eye, EyeOff, KeyRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AddressForm } from "@/components/checkout/address-form";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
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

            notify.success("Profile Synchronized", "Your professional credentials have been successfully updated in our registry.");
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
            // In Supabase, we can use updateUser to change the password directly for the logged-in user
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
            // If setting as default, unset other defaults
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
            notify.success("Address Purged", "The specified location has been removed from the registry.");
        } catch (error: any) {
            console.error("Error deleting address:", error);
            notify.error("Purge Failed", error.message || "Failed to remove the address.");
        }
    };

    return (
        <div className="space-y-12 pb-20">
            {/* Identity & Contact */}
            <Card className="border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="px-8 pt-8 pb-4">
                    <CardTitle className="text-2xl font-serif flex items-center gap-3">
                        <div className="p-2 bg-[#FDFCF9] rounded-lg text-[#D4AF37]">
                            <User className="h-6 w-6" />
                        </div>
                        Partner Identity
                    </CardTitle>
                    <CardDescription>Formal identification and communication channels</CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-[#6B6B6B]">Registry Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A0A0A0]" />
                                    <Input
                                        id="email"
                                        value={initialData.email}
                                        disabled
                                        className="pl-11 h-12 bg-[#FDFCF9] border-[#E8E8E8] font-medium text-[#1A1A1A] transition-all focus:ring-0 focus:border-[#D4AF37] cursor-not-allowed"
                                    />
                                </div>
                                <p className="text-[10px] text-amber-600 font-bold flex items-center gap-1 uppercase">
                                    <Shield className="h-3 w-3" /> Locked Registry Entity
                                </p>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-[#6B6B6B]">Authorization Tier</Label>
                                <div className="relative">
                                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D4AF37]" />
                                    <Input
                                        id="role"
                                        value={initialData.role.replace("_", " ").toUpperCase()}
                                        disabled
                                        className="pl-11 h-12 bg-[#FDFCF9] border-[#E8E8E8] font-bold text-[#D4AF37] tracking-widest uppercase text-xs"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3 font-semibold">
                                <Label htmlFor="full_name" className="text-[10px] font-bold uppercase tracking-widest text-[#6B6B6B]">Operational Name</Label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A0A0A0]" />
                                    <Input
                                        id="full_name"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        className="pl-11 h-12 border-[#E8E8E8] transition-all focus:border-[#D4AF37] focus:ring-0"
                                        placeholder="Enter legal name"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-3 font-semibold">
                                <Label htmlFor="phone" className="text-[10px] font-bold uppercase tracking-widest text-[#6B6B6B]">Direct Contact</Label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A0A0A0]" />
                                    <Input
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="pl-11 h-12 border-[#E8E8E8] transition-all focus:border-[#D4AF37] focus:ring-0"
                                        placeholder="Enter phone number"
                                        type="tel"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="bg-[#1A1A1A] hover:bg-[#333333] text-white h-12 px-10 rounded-xl shadow-lg shadow-black/10 transition-all active:scale-95"
                            >
                                {loading ? "Syncing..." : "Update Terminal Access"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="px-8 pt-8 pb-4">
                    <CardTitle className="text-2xl font-serif flex items-center gap-3">
                        <div className="p-2 bg-[#FDFCF9] rounded-lg text-amber-600">
                            <KeyRound className="h-6 w-6" />
                        </div>
                        Security & Credentials
                    </CardTitle>
                    <CardDescription>Rotate your access keys to maintain terminal integrity</CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                    <form onSubmit={handlePasswordUpdate} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-[#6B6B6B]">Old Access Key</Label>
                                <div className="relative">
                                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A0A0A0]" />
                                    <Input
                                        type={showPasswords ? "text" : "password"}
                                        value={passwordData.oldPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                                        className="pl-11 h-12 border-[#E8E8E8] transition-all focus:border-amber-500 focus:ring-0"
                                        placeholder="Enter current key"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-[#6B6B6B]">New Access Key</Label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A0A0A0]" />
                                    <Input
                                        type={showPasswords ? "text" : "password"}
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        className="pl-11 h-12 border-[#E8E8E8] transition-all focus:border-amber-500 focus:ring-0"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords(!showPasswords)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A0A0A0] hover:text-[#1A1A1A]"
                                    >
                                        {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-[#6B6B6B]">Confirm New Key</Label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A0A0A0]" />
                                    <Input
                                        type={showPasswords ? "text" : "password"}
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        className="pl-11 h-12 border-[#E8E8E8] transition-all focus:border-amber-500 focus:ring-0"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button
                                type="submit"
                                disabled={loadingPassword}
                                className="bg-amber-600 hover:bg-amber-700 text-white h-12 px-10 rounded-xl shadow-lg shadow-amber-600/10 transition-all active:scale-95 border-none"
                            >
                                {loadingPassword ? "Updating..." : "Rotate Credentials"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Logistics Registry */}
            <Card className="border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between px-8 pt-8 pb-6 border-b border-[#F7F5F2]">
                    <div>
                        <CardTitle className="text-2xl font-serif flex items-center gap-3">
                            <div className="p-2 bg-[#FDFCF9] rounded-lg text-[#2D5F3F]">
                                <MapPin className="h-6 w-6" />
                            </div>
                            Logistics Registry
                        </CardTitle>
                        <CardDescription>Managed distribution points for consignments</CardDescription>
                    </div>
                    {!showAddressForm && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAddressForm(true)}
                            className="text-[#D4AF37] border-[#D4AF37] hover:bg-[#D4AF37] hover:text-white rounded-lg h-10 px-4"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Register Location
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="px-8 py-8">
                    {showAddressForm ? (
                        <div className="bg-[#FDFCF9] p-8 rounded-2xl border border-[#E8E8E8] animate-in zoom-in-95 duration-300">
                            <div className="flex items-center gap-2 mb-6 text-[#1A1A1A]">
                                <MapPin className="h-5 w-5 text-[#D4AF37]" />
                                <h3 className="font-bold text-lg">Add New Operational Point</h3>
                            </div>
                            <AddressForm
                                onSubmit={handleAddAddress}
                                onCancel={() => setShowAddressForm(false)}
                                defaultName={formData.full_name || initialData?.full_name}
                                defaultPhone={formData.phone || initialData?.phone}
                                isLoading={savingAddress}
                            />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {loadingAddresses ? (
                                <div className="text-center py-12">
                                    <div className="w-8 h-8 border-3 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
                                </div>
                            ) : addresses.length === 0 ? (
                                <div className="text-center py-20 border-2 border-dashed border-[#E8E8E8] rounded-2xl bg-[#FDFCF9]/50">
                                    <MapPin className="h-12 w-12 mx-auto text-[#E8E8E8] mb-4" />
                                    <p className="text-[#6B6B6B] font-serif text-lg">No distribution hubs registered</p>
                                    <Button variant="link" onClick={() => setShowAddressForm(true)} className="text-[#D4AF37] font-bold mt-2">
                                        Initialize first registry entry
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {addresses.map((address) => (
                                        <div
                                            key={address.id}
                                            className={cn(
                                                "p-6 rounded-2xl border-2 transition-all hover:shadow-md relative group",
                                                address.is_default
                                                    ? "border-[#D4AF37]/30 bg-[#D4AF37]/5"
                                                    : "border-[#F7F5F2] bg-white"
                                            )}
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("p-2 rounded-lg", address.is_default ? "bg-[#D4AF37] text-white" : "bg-[#F7F5F2] text-[#6B6B6B]")}>
                                                        <MapPin className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-[#1A1A1A]">{address.name}</span>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            {address.is_default && (
                                                                <span className="text-[8px] bg-[#1A1A1A] text-white px-1.5 py-0.5 rounded-full font-bold tracking-widest uppercase">
                                                                    PRIMARY
                                                                </span>
                                                            )}
                                                            <span className="text-[9px] bg-[#E8E8E8]/50 text-[#6B6B6B] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tight">
                                                                {address.address_type}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#A0A0A0] hover:text-red-500 hover:bg-red-50 transition-colors">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent className="rounded-2xl border-none">
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle className="font-serif text-xl">Confirm Registry Removal</AlertDialogTitle>
                                                            <AlertDialogDescription className="text-sm">
                                                                Are you certain you want to decommission this distribution point? This will remove all associated logistics records.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel className="rounded-xl border-[#E8E8E8]">Abort</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDeleteAddress(address.id)}
                                                                className="bg-red-500 hover:bg-red-600 rounded-xl border-none"
                                                            >
                                                                Confirm Removal
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                            <div className="text-sm text-[#6B6B6B] space-y-1.5 bg-[#FDFCF9]/50 p-4 rounded-xl mt-2 group-hover:bg-white transition-colors">
                                                <p className="flex items-center gap-2"><Phone className="h-3 w-3" /> {address.phone}</p>
                                                <p className="font-medium text-[#1A1A1A] leading-relaxed">
                                                    {address.address_line1}
                                                    {address.address_line2 && <br />}
                                                    {address.address_line2}
                                                </p>
                                                <p className="text-xs font-bold uppercase tracking-wide text-[#A0A0A0]">{address.city}, {address.state} {address.postal_code}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div >
    );
}

