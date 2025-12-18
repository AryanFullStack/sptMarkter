"use client";

import { useState } from "react";
import { useAddress } from "@/context/address-context";
import { useToast } from "@/hooks/use-toast";
import { MainNav } from "@/components/main-nav";
import { MainFooter } from "@/components/main-footer";
import { Button } from "@/components/ui/button";
import { AddressForm } from "@/components/checkout/address-form";
import { MapPin, Plus, Edit, Trash2, Home, Briefcase } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function AddressesPage() {
    const { addresses, loading, addAddress, updateAddress, deleteAddress, setDefaultAddress } =
        useAddress();
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingAddress, setEditingAddress] = useState<any>(null);
    const [savingAddress, setSavingAddress] = useState(false);

    const { toast } = useToast();

    const handleAddAddress = async (data: any) => {
        setSavingAddress(true);
        try {
            await addAddress(data);
            toast({
                title: "Address saved",
                description: "Your new address has been added successfully.",
            });
            setShowAddForm(false);
        } catch (error: any) {
            toast({
                title: "Error saving address",
                description: error.message || "There was a problem saving your address. Please try again.",
                variant: "destructive",
            });
        } finally {
            setSavingAddress(false);
        }
    };

    const handleUpdateAddress = async (data: any) => {
        if (editingAddress) {
            setSavingAddress(true);
            try {
                await updateAddress(editingAddress.id, data);
                toast({
                    title: "Address updated",
                    description: "Your address has been updated successfully.",
                });
                setEditingAddress(null);
            } catch (error: any) {
                toast({
                    title: "Error updating address",
                    description: error.message || "Failed to update address. Please try again.",
                    variant: "destructive",
                });
            } finally {
                setSavingAddress(false);
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this address?")) {
            try {
                await deleteAddress(id);
                toast({
                    title: "Address deleted",
                    description: "Address has been removed from your account.",
                });
            } catch (error) {
                toast({
                    title: "Error deleting address",
                    description: "Failed to delete address. Please try again.",
                    variant: "destructive",
                });
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDFCF9]">
                <MainNav />
                <div className="container mx-auto px-4 py-16 text-center">
                    <p>Loading addresses...</p>
                </div>
                <MainFooter />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFCF9]">
            <MainNav />

            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="font-display text-4xl font-bold text-[#1A1A1A]">
                        My Addresses
                    </h1>
                    <Button
                        onClick={() => setShowAddForm(true)}
                        className="bg-[#D4AF37] hover:bg-[#B8941F]"
                    >
                        <Plus className="mr-2 h-5 w-5" />
                        Add New Address
                    </Button>
                </div>

                {addresses.length === 0 ? (
                    <div className="text-center py-16">
                        <MapPin className="h-24 w-24 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            No Addresses Yet
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Add your first shipping address to get started
                        </p>
                        <Button
                            onClick={() => setShowAddForm(true)}
                            className="bg-[#D4AF37] hover:bg-[#B8941F]"
                        >
                            <Plus className="mr-2 h-5 w-5" />
                            Add Address
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {addresses.map((address) => (
                            <div
                                key={address.id}
                                className="bg-white rounded-lg p-6 shadow-sm relative"
                            >
                                {/* Address Type Icon */}
                                <div className="absolute top-4 right-4">
                                    {address.address_type === "home" ? (
                                        <Home className="h-5 w-5 text-gray-400" />
                                    ) : (
                                        <Briefcase className="h-5 w-5 text-gray-400" />
                                    )}
                                </div>

                                {/* Address Details */}
                                <div className="mb-4">
                                    <h3 className="font-semibold text-lg">{address.name}</h3>
                                    <p className="text-sm text-gray-600">{address.phone}</p>
                                </div>

                                <p className="text-sm text-gray-700 mb-1">
                                    {address.address_line1}
                                </p>
                                {address.address_line2 && (
                                    <p className="text-sm text-gray-700 mb-1">
                                        {address.address_line2}
                                    </p>
                                )}
                                <p className="text-sm text-gray-700">
                                    {address.city}, {address.state} {address.postal_code}
                                </p>

                                {/* Default Badge */}
                                {address.is_default && (
                                    <div className="mt-3">
                                        <span className="inline-block bg-[#D4AF37] text-white text-xs px-3 py-1 rounded">
                                            Default Address
                                        </span>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2 mt-4 pt-4 border-t">
                                    {!address.is_default && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setDefaultAddress(address.id)}
                                            className="flex-1"
                                        >
                                            Set Default
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditingAddress(address)}
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDelete(address.id)}
                                        className="text-red-500 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Address Dialog */}
            <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Add New Address</DialogTitle>
                    </DialogHeader>
                    <AddressForm
                        onSubmit={handleAddAddress}
                        onCancel={() => setShowAddForm(false)}
                        isLoading={savingAddress}
                    />
                </DialogContent>
            </Dialog>

            {/* Edit Address Dialog */}
            <Dialog open={!!editingAddress} onOpenChange={() => setEditingAddress(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Address</DialogTitle>
                    </DialogHeader>
                    <AddressForm
                        onSubmit={handleUpdateAddress}
                        onCancel={() => setEditingAddress(null)}
                        initialData={editingAddress}
                        submitLabel="Update Address"
                        isLoading={savingAddress}
                    />
                </DialogContent>
            </Dialog>

            <MainFooter />
        </div>
    );
}
