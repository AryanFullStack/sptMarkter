"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createClient } from "@/supabase/client";

interface Address {
    id: string;
    user_id: string;
    name: string;
    phone: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state?: string; // Optional - not required in database
    postal_code: string;
    country: string;
    is_default: boolean;
    address_type: "home" | "office" | "shop" | "beauty_parlor";
}

interface AddressContextType {
    addresses: Address[];
    loading: boolean;
    fetchAddresses: () => Promise<void>;
    addAddress: (address: Omit<Address, "id" | "user_id">) => Promise<void>;
    updateAddress: (id: string, address: Partial<Address>) => Promise<void>;
    deleteAddress: (id: string) => Promise<void>;
    setDefaultAddress: (id: string) => Promise<void>;
}

const AddressContext = createContext<AddressContextType | undefined>(undefined);

export function AddressProvider({ children }: { children: ReactNode }) {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchAddresses = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            setAddresses([]);
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from("addresses")
            .select("*")
            .eq("user_id", user.id)
            .order("is_default", { ascending: false });

        if (!error && data) {
            setAddresses(data);
        }
        setLoading(false);
    };

    const addAddress = async (address: Omit<Address, "id" | "user_id">) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.error("AddressContext: No authenticated user found");
                throw new Error("You must be logged in to add an address");
            }

            console.log("AddressContext: Adding address for user", user.id, address);

            // Validate address fields
            if (!address.name || !address.phone || !address.address_line1 || !address.city || !address.postal_code) {
                throw new Error("Missing required address fields");
            }

            // If this is the first address or marked as default, unset other defaults
            if (address.is_default || addresses.length === 0) {
                const { error: updateError } = await supabase
                    .from("addresses")
                    .update({ is_default: false })
                    .eq("user_id", user.id);

                if (updateError) console.error("AddressContext: Error unsetting defaults", updateError);
            }

            const addressPayload = {
                ...address,
                // Database requires state but UI doesn't ask for it anymore
                state: address.state || "N/A",
                user_id: user.id,
                is_default: address.is_default || addresses.length === 0,
            };

            console.log("AddressContext: Inserting address payload:", addressPayload);

            const { data, error } = await supabase
                .from("addresses")
                .insert(addressPayload)
                .select()
                .single();

            if (error) {
                console.error("AddressContext: Error inserting address:", error);

                // Detailed error mapping
                let errorMessage = "Failed to save address. ";
                if (error.code === '23502') { // Not null violation
                    errorMessage += "Missing required field: " + (error.details || error.message);
                } else if (error.code === '23514') {
                    errorMessage += "Invalid address type.";
                } else if (error.code === '23503') {
                    errorMessage += "User reference error.";
                } else if (error.code === '23505') {
                    errorMessage += "This address already exists.";
                } else {
                    errorMessage += error.message;
                }

                throw new Error(errorMessage);
            }

            console.log("AddressContext: Address added successfully:", data?.id);
            await fetchAddresses();
        } catch (err: any) {
            console.error("AddressContext: Unexpected error adding address", err);
            throw err;
        }
    };

    const updateAddress = async (id: string, address: Partial<Address>) => {
        try {
            console.log("AddressContext: Updating address", id, address);

            const { error } = await supabase
                .from("addresses")
                .update(address)
                .eq("id", id);

            if (error) {
                console.error("AddressContext: Error updating address", error);
                throw new Error(`Failed to update address: ${error.message}`);
            }

            console.log("AddressContext: Address updated successfully");
            await fetchAddresses();
        } catch (err: any) {
            console.error("AddressContext: Unexpected error updating address", err);
            throw err;
        }
    };

    const deleteAddress = async (id: string) => {
        try {
            console.log("AddressContext: Deleting address", id);

            const { error } = await supabase
                .from("addresses")
                .delete()
                .eq("id", id);

            if (error) {
                console.error("AddressContext: Error deleting address", error);
                throw new Error(`Failed to delete address: ${error.message}`);
            }

            console.log("AddressContext: Address deleted successfully");
            await fetchAddresses();
        } catch (err: any) {
            console.error("AddressContext: Unexpected error deleting address", err);
            throw err;
        }
    };

    const setDefaultAddress = async (id: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Unset all defaults first
        await supabase
            .from("addresses")
            .update({ is_default: false })
            .eq("user_id", user.id);

        // Set new default
        await supabase
            .from("addresses")
            .update({ is_default: true })
            .eq("id", id);

        await fetchAddresses();
    };

    useEffect(() => {
        fetchAddresses();
    }, []);

    return (
        <AddressContext.Provider
            value={{
                addresses,
                loading,
                fetchAddresses,
                addAddress,
                updateAddress,
                deleteAddress,
                setDefaultAddress,
            }}
        >
            {children}
        </AddressContext.Provider>
    );
}

export function useAddress() {
    const context = useContext(AddressContext);
    if (!context) {
        throw new Error("useAddress must be used within AddressProvider");
    }
    return context;
}
