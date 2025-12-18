"use client";

import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";

interface AddressFormProps {
    onSubmit: (address: any) => void;
    onCancel?: () => void;
    initialData?: any;
    submitLabel?: string;
    defaultName?: string;
    defaultPhone?: string;
    isLoading?: boolean;
}

export function AddressForm({
    onSubmit,
    onCancel,
    initialData,
    submitLabel = "Save Address",
    defaultName,
    defaultPhone,
    isLoading = false,
}: AddressFormProps) {
    const [formData, setFormData] = useState({
        name: initialData?.name || defaultName || "",
        phone: initialData?.phone || defaultPhone || "",
        address_line1: initialData?.address_line1 || "",
        address_line2: initialData?.address_line2 || "",
        city: initialData?.city || "",
        postal_code: initialData?.postal_code || "",
        country: initialData?.country || "Pakistan",
        address_type: initialData?.address_type || "home",
        is_default: initialData?.is_default || false,
    });

    const isNamePreFilled = !!defaultName;
    const isPhonePreFilled = !!defaultPhone;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Submitting address form:", formData);
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* If Name/Phone are pre-filled, we can hide them or show them as read-only/disabled
                User requested: "not again add this", implying they don't want to type it. 
                Showing as disabled inputs confirms we have the info. 
            */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>

                <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                        id="phone"
                        required
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                </div>
            </div>

            <div>
                <Label htmlFor="address_type">Address Type</Label>
                <Select
                    value={formData.address_type}
                    onValueChange={(value) =>
                        setFormData({ ...formData, address_type: value })
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="shop">Shop</SelectItem>
                        <SelectItem value="beauty_parlor">Beauty Parlor</SelectItem>
                        <SelectItem value="office">Office</SelectItem>
                        <SelectItem value="home">Home</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div>
                <Label htmlFor="address_line1">Address Line 1 *</Label>
                <Input
                    id="address_line1"
                    placeholder="Street address, P.O. box, etc."
                    required
                    value={formData.address_line1}
                    onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                />
            </div>

            <div>
                <Label htmlFor="address_line2">Address Line 2 (Optional)</Label>
                <Input
                    id="address_line2"
                    placeholder="Apartment, suite, unit, building, floor, etc."
                    value={formData.address_line2}
                    onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                        id="city"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                </div>

                <div>
                    <Label htmlFor="postal_code">Postal Code *</Label>
                    <Input
                        id="postal_code"
                        required
                        value={formData.postal_code}
                        onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    />
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <Checkbox
                    id="is_default"
                    checked={formData.is_default}
                    onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_default: checked as boolean })
                    }
                />
                <Label htmlFor="is_default" className="cursor-pointer">
                    Set as default address
                </Label>
            </div>

            <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={isLoading} className="flex-1 bg-[#D4AF37] hover:bg-[#B8941F]">
                    {isLoading ? "Saving..." : submitLabel}
                </Button>
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
            </div>
        </form >
    );
}
