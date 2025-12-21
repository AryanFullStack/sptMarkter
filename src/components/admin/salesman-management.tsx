"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { notify } from "@/lib/notifications";
import { Loader2, UserPlus, Tag, Building2, CheckCircle, XCircle, Pencil, TrendingUp, ShoppingBag } from "lucide-react";
import { getAllSalesmen, assignSalesmanToBrands, updateSalesman, createSalesman, getAllBrands } from "@/app/admin/actions";

interface Brand {
    id: string;
    name: string;
    logo_url?: string;
}

interface Salesman {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
    created_at: string;
    salesman_brands?: Array<{
        id: string;
        brand: Brand;
    }>;
    orders?: Array<{
        id: string;
        total_amount: number;
        created_at: string;
    }>;
}

export function SalesmanManagement() {
    const [salesmen, setSalesmen] = useState<Salesman[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showBrandDialog, setShowBrandDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);

    const [selectedSalesman, setSelectedSalesman] = useState<Salesman | null>(null);
    const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);

    const [creatingUser, setCreatingUser] = useState(false);
    const [updatingUser, setUpdatingUser] = useState(false);
    const [assigningBrands, setAssigningBrands] = useState(false);

    // New user form state
    const [newUser, setNewUser] = useState({
        email: "",
        password: "",
        full_name: "",
        phone: "",
    });

    // Edit user form state
    const [editUser, setEditUser] = useState({
        full_name: "",
        phone: "",
        password: "", // Optional
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            console.log("Loading salesmen and brands...");

            const [salesmenData, brandsData] = await Promise.all([
                getAllSalesmen(),
                fetchBrands()
            ]);

            console.log("Salesmen data received:", salesmenData);
            console.log("Brands data received:", brandsData);

            setSalesmen(salesmenData as any || []);
            setBrands(brandsData || []);

            console.log("Data loaded successfully");
        } catch (error: any) {
            console.error("Error loading data:", error);

            let errorMessage = "Failed to load salesman data";
            if (error.message?.includes("salesman_brands")) {
                errorMessage = "Database tables not ready. Please ensure all migrations are run.";
            }

            notify.error("Error", errorMessage);
        } finally {
            setLoading(false);
        }
    }

    async function fetchBrands() {
        console.log("Fetching brands... (via Server Action)");
        try {
            const data = await getAllBrands();

            if (!data || data.length === 0) {
                console.warn("Brands fetch success but returned 0 items. Check 'is_active' status in DB.");
            } else {
                console.log(`Fetched ${data.length} brands successfully:`, data);
            }
            return data || [];
        } catch (error: any) {
            console.error("Error fetching brands:", error);
            notify.error("Error", `Error fetching brands: ${error.message}`);
            return [];
        }
    }

    async function handleCreateSalesman() {
        console.log("Create button clicked");

        // Validation with explicit logging
        if (!newUser.email || !newUser.password || !newUser.full_name) {
            console.log("Validation failed:", newUser);
            notify.error("Validation Error", "Please fill in all required fields");
            return;
        }

        setCreatingUser(true);

        try {
            console.log("Calling createSalesman server action...");

            await createSalesman(newUser);

            console.log("Salesman created successfully!");

            notify.success("Salesman Created", `${newUser.full_name} has been created successfully`);

            // Reset form and reload data
            setNewUser({ email: "", password: "", full_name: "", phone: "" });
            setShowCreateDialog(false);
            loadData();
        } catch (error: any) {
            console.error("Create handler caught error:", error);

            let errorMessage = error.message || "Failed to create salesman";

            if (error.message?.includes("migrations")) {
                errorMessage = "Database tables not ready! Run SQL migrations in Supabase.";
            }

            notify.error("Creation Failed", errorMessage);
        } finally {
            console.log("Creation attempt finished");
            setCreatingUser(false);
        }
    }

    async function handleUpdateSalesman() {
        if (!selectedSalesman || !editUser.full_name) return;

        setUpdatingUser(true);

        try {
            await updateSalesman(selectedSalesman.id, {
                full_name: editUser.full_name,
                phone: editUser.phone,
                password: editUser.password || undefined,
            });

            notify.success("Salesman Updated", "Salesman details updated successfully");

            setShowEditDialog(false);
            setSelectedSalesman(null);
            loadData();
        } catch (error: any) {
            console.error("Error updating salesman:", error);
            notify.error("Update Failed", error.message || "Failed to update salesman");
        } finally {
            setUpdatingUser(false);
        }
    }

    async function handleAssignBrands() {
        if (!selectedSalesman) return;

        setAssigningBrands(true);

        try {
            await assignSalesmanToBrands(selectedSalesman.id, selectedBrandIds);

            notify.success("Brands Assigned", `${selectedBrandIds.length} brand(s) assigned to ${selectedSalesman.full_name}`);

            setShowBrandDialog(false);
            setSelectedSalesman(null);
            setSelectedBrandIds([]);
            loadData();
        } catch (error: any) {
            console.error("Error assigning brands:", error);
            notify.error("Assignment Failed", error.message || "Failed to assign brands");
        } finally {
            setAssigningBrands(false);
        }
    }

    const openBrandDialog = (salesman: Salesman) => {
        setSelectedSalesman(salesman);
        const currentBrandIds = salesman.salesman_brands?.map(sb => sb.brand.id) || [];
        setSelectedBrandIds(currentBrandIds);
        setShowBrandDialog(true);
    };

    const openEditDialog = (salesman: Salesman) => {
        setSelectedSalesman(salesman);
        setEditUser({
            full_name: salesman.full_name,
            phone: salesman.phone || "",
            password: "",
        });
        setShowEditDialog(true);
    };

    const toggleBrandSelection = (brandId: string) => {
        setSelectedBrandIds(prev =>
            prev.includes(brandId)
                ? prev.filter(id => id !== brandId)
                : [...prev, brandId]
        );
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-PK", {
            style: "currency",
            currency: "PKR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const calculateStats = (salesman: Salesman) => {
        if (!salesman.orders) return { totalSales: 0, ordersToday: 0 };

        const totalSales = salesman.orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const ordersToday = salesman.orders.filter(order => new Date(order.created_at) >= today).length;

        return { totalSales, ordersToday };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Create Button */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-serif font-bold">Salesman Management</h2>
                    <p className="text-sm text-muted-foreground">Manage salesmen and assign brands</p>
                </div>
                <Button
                    onClick={() => setShowCreateDialog(true)}
                    className="bg-[#2D5F3F] hover:bg-[#234a32]"
                >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Salesman
                </Button>
            </div>

            {/* Salesmen List */}
            {salesmen.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <UserPlus className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                        <p className="text-lg font-medium mb-2">No Salesmen Yet</p>
                        <p className="text-sm text-muted-foreground mb-4">
                            Create your first salesman to start managing brand assignments
                        </p>
                        <Button onClick={() => setShowCreateDialog(true)}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Create First Salesman
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {salesmen.map((salesman) => {
                        const stats = calculateStats(salesman);
                        return (
                            <Card key={salesman.id} className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-xl flex items-center gap-2">
                                                {salesman.full_name}
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                    Salesman
                                                </Badge>
                                            </CardTitle>
                                            <p className="text-sm text-muted-foreground mt-1">{salesman.email}</p>
                                            {salesman.phone && (
                                                <p className="text-sm text-muted-foreground">{salesman.phone}</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openEditDialog(salesman)}
                                            >
                                                <Pencil className="h-4 w-4 mr-1" />
                                                Edit
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openBrandDialog(salesman)}
                                            >
                                                <Tag className="h-4 w-4 mr-1" />
                                                Brands
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {/* Stats */}
                                        <div className="grid grid-cols-2 gap-4 py-2">
                                            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                                                <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mb-1">
                                                    <TrendingUp className="h-3 w-3" />
                                                    Total Sales
                                                </p>
                                                <p className="text-lg font-bold text-emerald-700">
                                                    {formatCurrency(stats.totalSales)}
                                                </p>
                                            </div>
                                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                                <p className="text-xs text-blue-600 font-medium flex items-center gap-1 mb-1">
                                                    <ShoppingBag className="h-3 w-3" />
                                                    Orders Today
                                                </p>
                                                <p className="text-lg font-bold text-blue-700">
                                                    {stats.ordersToday}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Assigned Brands */}
                                        <div>
                                            <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                                                <Tag className="h-4 w-4" />
                                                Assigned Brands ({salesman.salesman_brands?.length || 0})
                                            </Label>

                                            {salesman.salesman_brands && salesman.salesman_brands.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {salesman.salesman_brands.map((sb) => (
                                                        <Badge key={sb.id} variant="secondary" className="gap-1">
                                                            <Building2 className="h-3 w-3" />
                                                            {sb.brand.name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground italic">
                                                    No brands assigned yet
                                                </p>
                                            )}
                                        </div>

                                        {/* Created Date */}
                                        <div className="text-xs text-muted-foreground pt-2 border-t">
                                            Created on {new Date(salesman.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Create Salesman Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-2xl">Create New Salesman</DialogTitle>
                        <DialogDescription>
                            Create a new salesman user account. They will be able to create orders and record payments.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="create-full_name">Full Name *</Label>
                            <Input
                                id="create-full_name"
                                placeholder="Enter full name"
                                value={newUser.full_name}
                                onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="create-email">Email *</Label>
                            <Input
                                id="create-email"
                                type="email"
                                placeholder="salesman@example.com"
                                value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="create-password">Password *</Label>
                            <Input
                                id="create-password"
                                type="password"
                                placeholder="Minimum 6 characters"
                                value={newUser.password}
                                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="create-phone">Phone (Optional)</Label>
                            <Input
                                id="create-phone"
                                type="tel"
                                placeholder="+92 300 1234567"
                                value={newUser.phone}
                                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={creatingUser}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateSalesman} disabled={creatingUser} className="bg-[#2D5F3F] hover:bg-[#234a32]">
                            {creatingUser && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Salesman
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Salesman Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-2xl">Edit Salesman</DialogTitle>
                        <DialogDescription>
                            Update details for {selectedSalesman?.full_name}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-full_name">Full Name *</Label>
                            <Input
                                id="edit-full_name"
                                value={editUser.full_name}
                                onChange={(e) => setEditUser({ ...editUser, full_name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-phone">Phone</Label>
                            <Input
                                id="edit-phone"
                                value={editUser.phone}
                                onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-password">New Password (Optional)</Label>
                            <Input
                                id="edit-password"
                                type="password"
                                placeholder="Leave empty to keep current"
                                value={editUser.password}
                                onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">Only enter if you want to change the password</p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={updatingUser}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateSalesman} disabled={updatingUser} className="bg-[#2D5F3F] hover:bg-[#234a32]">
                            {updatingUser && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Assign Brands Dialog */}
            <Dialog open={showBrandDialog} onOpenChange={setShowBrandDialog}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-2xl">Assign Brands</DialogTitle>
                        <DialogDescription>
                            Select which brands {selectedSalesman?.full_name} can sell
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        {brands.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                                No brands available. Please create brands first.
                            </p>
                        ) : (
                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                {brands.map((brand) => {
                                    const isSelected = selectedBrandIds.includes(brand.id);
                                    return (
                                        <div
                                            key={brand.id}
                                            onClick={() => toggleBrandSelection(brand.id)}
                                            className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`h-5 w-5 rounded border-2 flex items-center justify-center ${isSelected ? "bg-[#2D5F3F] border-[#2D5F3F]" : "border-gray-300"
                                                    }`}>
                                                    {isSelected && <CheckCircle className="h-4 w-4 text-white" />}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{brand.name}</p>
                                                </div>
                                            </div>
                                            <Building2 className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowBrandDialog(false)} disabled={assigningBrands}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAssignBrands}
                            disabled={assigningBrands || brands.length === 0}
                            className="bg-[#2D5F3F] hover:bg-[#234a32]"
                        >
                            {assigningBrands && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Assign {selectedBrandIds.length} Brand{selectedBrandIds.length !== 1 ? "s" : ""}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
