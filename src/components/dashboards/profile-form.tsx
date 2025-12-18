"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Phone, Mail, Save, MapPin, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    const [loading, setLoading] = useState(false);
    const [addresses, setAddresses] = useState<any[]>([]);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [loadingAddresses, setLoadingAddresses] = useState(true);
    const [savingAddress, setSavingAddress] = useState(false);

    const { toast } = useToast();
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

            toast({
                title: "Profile Updated",
                description: "Your profile information has been saved successfully.",
            });
        } catch (error: any) {
            console.error("Error updating profile:", error);
            toast({
                title: "Update Failed",
                description: error.message || "Failed to update profile. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
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

            toast({
                title: "Address Added",
                description: "New address has been saved successfully.",
            });

            // Refresh to ensure order is correct
            fetchAddresses();
        } catch (error: any) {
            console.error("Error adding address:", error);
            toast({
                title: "Error adding address",
                description: error.message || "Failed to add address. Please try again.",
                variant: "destructive",
            });
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
            toast({
                title: "Address Deleted",
                description: "The address has been removed.",
            });
        } catch (error: any) {
            console.error("Error deleting address:", error);
            toast({
                title: "Error deleting address",
                description: error.message || "Failed to delete address.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl font-display flex items-center gap-2">
                        <User className="h-5 w-5 text-[#D4AF37]" />
                        Personal Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                    <Input
                                        id="email"
                                        value={initialData.email}
                                        disabled
                                        className="pl-9 bg-gray-50"
                                        title="Email cannot be changed"
                                    />
                                </div>
                                <p className="text-xs text-gray-500">Email cannot be changed</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role">Account Type</Label>
                                <Input
                                    id="role"
                                    value={initialData.role.replace("_", " ").toUpperCase()}
                                    disabled
                                    className="bg-gray-50 font-medium"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="full_name">Full Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                    <Input
                                        id="full_name"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        className="pl-9"
                                        placeholder="Enter your full name"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                    <Input
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="pl-9"
                                        placeholder="Enter phone number"
                                        type="tel"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="bg-[#D4AF37] hover:bg-[#B8941F] text-white min-w-[150px]"
                            >
                                {loading ? (
                                    "Saving..."
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xl font-display flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-[#D4AF37]" />
                        Saved Addresses
                    </CardTitle>
                    {!showAddressForm && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAddressForm(true)}
                            className="text-[#D4AF37] border-[#D4AF37] hover:bg-[#D4AF37] hover:text-white"
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Add New
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    {showAddressForm ? (
                        <div className="bg-gray-50 p-6 rounded-lg border">
                            <h3 className="font-semibold mb-4">Add New Address</h3>
                            <AddressForm
                                onSubmit={handleAddAddress}
                                onCancel={() => setShowAddressForm(false)}
                                defaultName={formData.full_name || initialData?.full_name}
                                defaultPhone={formData.phone || initialData?.phone}
                                isLoading={savingAddress}
                            />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {loadingAddresses ? (
                                <p className="text-center text-gray-500 py-4">Loading addresses...</p>
                            ) : addresses.length === 0 ? (
                                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                                    <MapPin className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                                    <p className="text-gray-500 mb-2">No saved addresses</p>
                                    <Button variant="link" onClick={() => setShowAddressForm(true)}>
                                        Add your first address
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {addresses.map((address) => (
                                        <div
                                            key={address.id}
                                            className={`p-4 rounded-lg border-2 ${address.is_default
                                                ? "border-[#D4AF37] bg-[#D4AF37]/5"
                                                : "border-gray-100 bg-white"
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold">{address.name}</span>
                                                    {address.is_default && (
                                                        <span className="text-[10px] bg-[#D4AF37] text-white px-1.5 py-0.5 rounded">
                                                            DEFAULT
                                                        </span>
                                                    )}
                                                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded capitalize">
                                                        {address.address_type}
                                                    </span>
                                                </div>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Address</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Are you sure you want to delete this address? This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDeleteAddress(address.id)}
                                                                className="bg-red-500 hover:bg-red-600"
                                                            >
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                            <div className="text-sm text-gray-600 space-y-0.5">
                                                <p>{address.phone}</p>
                                                <p>{address.address_line1}</p>
                                                {address.address_line2 && <p>{address.address_line2}</p>}
                                                <p>{address.city}, {address.state} {address.postal_code}</p>
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
