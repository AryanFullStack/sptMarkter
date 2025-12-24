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
import { Loader2, UserPlus, Tag, Building2, CheckCircle, XCircle, Pencil, TrendingUp, ShoppingBag, Plus, Trash2, Search, Calendar as CalendarIcon, Store, MapPin, Clock } from "lucide-react";
import { getAllSalesmen, assignSalesmanToBrands, updateSalesman, createSalesman, getAllBrands } from "@/app/admin/actions";
import { getAssignableShops, assignShopToSalesman, getSalesmanAssignedShops } from "@/app/actions/salesman-actions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";

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
    const [showShopDialog, setShowShopDialog] = useState(false);

    const [availableShops, setAvailableShops] = useState<any[]>([]);
    const [assignedShops, setAssignedShops] = useState<any[]>([]);
    const [selectedShopId, setSelectedShopId] = useState<string>("");
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [assignmentDate, setAssignmentDate] = useState<string>("");

    const [selectedSalesman, setSelectedSalesman] = useState<Salesman | null>(null);
    const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
    const [shopSearchQuery, setShopSearchQuery] = useState("");
    const router = useRouter();

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

    const refreshAssignedShops = async () => {
        if (!selectedSalesman) return;
        try {
            const res = await getSalesmanAssignedShops(selectedSalesman.id);
            setAssignedShops(res.shops || []);
            router.refresh();
        } catch (e) {
            console.error("Refresh failed:", e);
        }
    };

    const openShopDialog = async (salesman: Salesman) => {
        setSelectedSalesman(salesman);
        setShowShopDialog(true);
        setLoading(true);

        try {
            const [shopsRes, assignedRes] = await Promise.all([
                getAssignableShops(),
                getSalesmanAssignedShops(salesman.id)
            ]);
            setAvailableShops(shopsRes.shops || []);
            setAssignedShops(assignedRes.shops || []);
        } catch (e) {
            console.error(e);
            notify.error("Error", "Failed to load shop data");
        } finally {
            setLoading(false);
        }
    };

    const handleAddShopToDay = async (shopId: string, day: string) => {
        if (!selectedSalesman) return;

        const currentShop = assignedShops.find(s => s.id === shopId);
        const currentDays = currentShop?.schedule?.recurring || [];

        if (currentDays.includes(day)) {
            notify.info("Already Assigned", `This shop is already assigned for ${day}`);
            return;
        }

        const newDays = [...currentDays, day];
        const currentDates = currentShop?.schedule?.dates || [];

        try {
            const res = await assignShopToSalesman(selectedSalesman.id, shopId, newDays, currentDates);

            if (res.error) {
                notify.error("Assignment Failed", res.error);
                return;
            }

            notify.success("Assigned", `Successfully added to ${day}`);
            await refreshAssignedShops();
        } catch (e: any) {
            notify.error("Error", e.message || "Failed to assign shop");
        }
    };

    const handleRemoveShopFromDay = async (shopId: string, day: string) => {
        if (!selectedSalesman) return;

        const currentShop = assignedShops.find(s => s.id === shopId);
        if (!currentShop) return;

        const newDays = currentShop.schedule.recurring.filter((d: string) => d !== day);
        const currentDates = currentShop.schedule.dates || [];

        try {
            const res = await assignShopToSalesman(selectedSalesman.id, shopId, newDays, currentDates);

            if (res.error) {
                notify.error("Removal Failed", res.error);
                return;
            }

            notify.success("Removed", `Successfully removed from ${day}`);
            await refreshAssignedShops();
        } catch (e: any) {
            notify.error("Error", e.message || "Failed to remove shop");
        }
    };

    const toggleDay = (day: string) => {
        setSelectedDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const filteredAvailableShops = availableShops.filter(shop =>
        shop.full_name?.toLowerCase().includes(shopSearchQuery.toLowerCase()) ||
        shop.address?.[0]?.city?.toLowerCase().includes(shopSearchQuery.toLowerCase())
    );

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
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-10 w-40" />
                </div>
                <div className="grid gap-4">
                    {[1, 2, 3].map((i) => (
                        <Card key={i}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="h-6 w-32" />
                                            <Skeleton className="h-5 w-20 rounded-full" />
                                        </div>
                                        <Skeleton className="h-4 w-40" />
                                    </div>
                                    <div className="flex gap-2">
                                        <Skeleton className="h-8 w-20" />
                                        <Skeleton className="h-8 w-20" />
                                        <Skeleton className="h-8 w-20" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <Skeleton className="h-20 rounded-lg" />
                                        <Skeleton className="h-20 rounded-lg" />
                                    </div>
                                    <Skeleton className="h-4 w-32" />
                                    <div className="flex gap-2">
                                        <Skeleton className="h-6 w-24 rounded-full" />
                                        <Skeleton className="h-6 w-24 rounded-full" />
                                    </div>
                                    <Skeleton className="h-4 w-full" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
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
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openShopDialog(salesman)}
                                            >
                                                <Store className="h-4 w-4 mr-1" />
                                                Shops
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
            )
            }

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
            {/* Weekly Route Planner Dialog */}
            <Dialog open={showShopDialog} onOpenChange={setShowShopDialog}>
                <DialogContent className="sm:max-w-[95vw] lg:max-w-7xl h-[90vh] flex flex-col p-0 overflow-hidden bg-[#FDFCF9]">
                    <DialogHeader className="p-4 md:p-6 border-b bg-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <DialogTitle className="font-serif text-xl md:text-2xl flex items-center gap-2">
                                    <CalendarIcon className="h-6 w-6 text-[#D4AF37]" />
                                    Weekly Route Planner
                                </DialogTitle>
                                <DialogDescription className="text-xs md:text-sm">
                                    Planning routes for <span className="font-bold text-foreground">{selectedSalesman?.full_name}</span>
                                </DialogDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 md:h-10 border-[#E8E8E8] hover:bg-gray-50"
                                    onClick={async () => {
                                        if (!selectedSalesman) return;
                                        setLoading(true);
                                        const res = await getSalesmanAssignedShops(selectedSalesman.id);
                                        setAssignedShops(res.shops || []);
                                        setLoading(false);
                                        notify.success("Refresh", "Routes updated");
                                    }}
                                >
                                    <Clock className="h-4 w-4 md:mr-2" />
                                    <span className="hidden md:inline">Refresh</span>
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setShowShopDialog(false)} className="lg:hidden">
                                    Close
                                </Button>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                        {/* 1. Shop Selection Sidebar (Available Shops) */}
                        <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r bg-white flex flex-col overflow-hidden">
                            <div className="p-4 space-y-4">
                                <div>
                                    <Label className="text-[10px] font-bold uppercase text-muted-foreground mb-1.5 block tracking-wider">
                                        1. Find Shop to Assign
                                    </Label>
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search shops or cities..."
                                            className="pl-9 h-10 text-sm border-[#E8E8E8]"
                                            value={shopSearchQuery}
                                            onChange={(e) => setShopSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {selectedShopId && (
                                    <div className="p-3 rounded-lg bg-[#FDFCF9] border border-[#D4AF37] shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                                        <p className="text-[10px] font-bold text-[#D4AF37] uppercase mb-1">Selected Shop</p>
                                        <p className="text-sm font-bold text-[#1A1A1A]">
                                            {availableShops.find(s => s.id === selectedShopId)?.full_name}
                                        </p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedShopId("")}
                                            className="h-6 px-2 mt-1 text-[10px] text-red-500 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <XCircle className="h-3 w-3 mr-1" /> Clear Selection
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <Separator />

                            <ScrollArea className="flex-1">
                                <div className="p-2 space-y-1">
                                    {filteredAvailableShops.length === 0 ? (
                                        <div className="py-12 text-center">
                                            <Store className="h-8 w-8 mx-auto mb-2 opacity-10" />
                                            <p className="text-xs text-muted-foreground">No shops found</p>
                                        </div>
                                    ) : (
                                        filteredAvailableShops.map((shop) => (
                                            <div
                                                key={shop.id}
                                                onClick={() => setSelectedShopId(shop.id)}
                                                className={`p-3 rounded-lg cursor-pointer transition-all border ${selectedShopId === shop.id
                                                    ? "bg-[#D4AF37] border-[#D4AF37] text-white shadow-md ring-2 ring-[#D4AF37]/20"
                                                    : "bg-white border-transparent hover:border-[#E8E8E8] hover:bg-gray-50"
                                                    }`}
                                            >
                                                <p className={`text-sm font-bold ${selectedShopId === shop.id ? "text-white" : "text-[#1A1A1A]"}`}>
                                                    {shop.full_name}
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <MapPin className={`h-3 w-3 ${selectedShopId === shop.id ? "text-white/80" : "text-muted-foreground"}`} />
                                                    <p className={`text-[11px] ${selectedShopId === shop.id ? "text-white/80" : "text-muted-foreground"} truncate`}>
                                                        {shop.address?.[0]?.city || 'No City'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </div>

                        {/* 2. Planner Area */}
                        <div className="flex-1 flex flex-col overflow-hidden bg-[#FDFCF9]">
                            <div className="p-4 border-b bg-[#F7F5F2]/50 text-center lg:text-left">
                                <p className="text-xs text-muted-foreground">
                                    <span className="font-bold text-[#D4AF37]">Instructions:</span> Select a shop from the left, then click <b>"+"</b> on any day to assign.
                                </p>
                            </div>

                            {/* Desktop View: 7-Column Grid */}
                            <div className="hidden lg:block flex-1 overflow-x-auto p-4">
                                <div className="grid grid-cols-7 gap-4 min-w-[1000px] h-full">
                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                                        const shopsForDay = assignedShops.filter(s => s.schedule?.recurring?.includes(day));

                                        return (
                                            <div key={day} className="flex flex-col h-full bg-white rounded-xl border border-[#E8E8E8] shadow-sm overflow-hidden">
                                                <div className="p-3 border-b bg-[#F7F5F2] flex items-center justify-between">
                                                    <h3 className="font-bold text-[#1A1A1A]">{day}</h3>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className={`h-7 w-7 rounded-full transition-all border shadow-sm ${selectedShopId
                                                            ? "bg-white hover:bg-[#D4AF37] hover:text-white"
                                                            : "opacity-30 cursor-not-allowed"
                                                            }`}
                                                        disabled={!selectedShopId}
                                                        onClick={() => handleAddShopToDay(selectedShopId, day)}
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>

                                                <ScrollArea className="flex-1">
                                                    <div className="p-2 space-y-2">
                                                        {shopsForDay.length === 0 ? (
                                                            <div className="py-8 text-center px-2">
                                                                <Clock className="h-8 w-8 mx-auto mb-2 opacity-5 text-muted-foreground" />
                                                                <p className="text-[10px] text-muted-foreground italic">No visits scheduled</p>
                                                            </div>
                                                        ) : (
                                                            shopsForDay.map(shop => (
                                                                <div
                                                                    key={`${day}-${shop.id}`}
                                                                    className="group p-2.5 bg-[#FDFCF9] border border-[#E8E8E8] rounded-xl hover:border-[#D4AF37] hover:shadow-sm transition-all relative"
                                                                >
                                                                    <p className="text-xs font-bold text-[#1A1A1A] pr-6 truncate">{shop.full_name}</p>
                                                                    <p className="text-[10px] text-[#6B6B6B] truncate flex items-center gap-1 mt-0.5">
                                                                        <MapPin className="h-2 w-2" /> {shop.address?.[0]?.city}
                                                                    </p>

                                                                    <button
                                                                        onClick={() => handleRemoveShopFromDay(shop.id, day)}
                                                                        className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 h-5 w-5 bg-red-50 text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                                                        title="Remove from day"
                                                                    >
                                                                        <Trash2 className="h-2.5 w-2.5" />
                                                                    </button>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </ScrollArea>

                                                <div className="p-2 bg-[#F7F5F2]/50 border-t text-[10px] font-bold text-center text-muted-foreground">
                                                    {shopsForDay.length} Shops
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Mobile View: Tabs */}
                            <div className="lg:hidden flex-1 flex flex-col overflow-hidden">
                                <Tabs defaultValue="Monday" className="flex-1 flex flex-col">
                                    <div className="px-4 py-2 border-b bg-white overflow-x-auto no-scrollbar">
                                        <TabsList className="bg-[#F7F5F2] h-10 p-1">
                                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                                <TabsTrigger
                                                    key={day}
                                                    value={day}
                                                    className="text-[11px] md:text-xs px-3 data-[state=active]:bg-[#D4AF37] data-[state=active]:text-white h-8"
                                                >
                                                    {day.substring(0, 3)}
                                                </TabsTrigger>
                                            ))}
                                        </TabsList>
                                    </div>

                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                                        const shopsForDay = assignedShops.filter(s => s.schedule?.recurring?.includes(day));
                                        return (
                                            <TabsContent key={day} value={day} className="flex-1 flex flex-col m-0 p-4 overflow-hidden">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="font-bold text-lg">{day} Schedule</h3>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleAddShopToDay(selectedShopId, day)}
                                                        disabled={!selectedShopId}
                                                        className="bg-[#2D5F3F]"
                                                    >
                                                        <Plus className="h-4 w-4 mr-1" /> Add Selected
                                                    </Button>
                                                </div>

                                                <ScrollArea className="flex-1">
                                                    <div className="space-y-3">
                                                        {shopsForDay.length === 0 ? (
                                                            <div className="py-12 text-center border-2 border-dashed rounded-xl border-[#E8E8E8]">
                                                                <Clock className="h-10 w-10 mx-auto mb-2 opacity-10" />
                                                                <p className="text-sm text-muted-foreground italic">No visits scheduled for {day}</p>
                                                                {!selectedShopId && <p className="text-[10px] text-muted-foreground mt-1">Select a shop above to add here</p>}
                                                            </div>
                                                        ) : (
                                                            shopsForDay.map(shop => (
                                                                <div
                                                                    key={`${day}-${shop.id}`}
                                                                    className="p-4 bg-white border border-[#E8E8E8] rounded-xl flex items-center justify-between shadow-sm"
                                                                >
                                                                    <div>
                                                                        <p className="font-bold text-sm">{shop.full_name}</p>
                                                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                                            <MapPin className="h-3 w-3" /> {shop.address?.[0]?.city}
                                                                        </p>
                                                                    </div>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => handleRemoveShopFromDay(shop.id, day)}
                                                                        className="h-8 w-8 text-red-500 hover:bg-red-50"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </ScrollArea>
                                            </TabsContent>
                                        );
                                    })}
                                </Tabs>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-4 border-t bg-white hidden lg:flex">
                        <Button variant="outline" onClick={() => setShowShopDialog(false)}>
                            Close Planner
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
