"use client";

import { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash, Plus, Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    getBrands,
    createBrand,
    updateBrand,
    deleteBrand,
    toggleBrandStatus
} from "@/app/actions/brand-actions";
import { Brand } from "@/types/custom";

export function BrandsManager() {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        loadBrands();
    }, []);

    async function loadBrands() {
        setLoading(true);
        const data = await getBrands();
        setBrands(data);
        setLoading(false);
    }

    const filteredBrands = brands.filter((brand) =>
        brand.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSubmitting(true);
        const formData = new FormData(e.currentTarget);

        // Checkbox handling
        const isActive = e.currentTarget.is_active?.checked;
        // FormData 'on' needs to be handled if using server action directly from form, 
        // but here we are calling the action function which takes FormData.
        // The Input type="checkbox" in form sends 'on' if checked. 
        // My server action checks `formData.get("is_active") === "on"`.
        // However, Switch component might not work standardly with FormData if controlled? 
        // Let's use a hidden input or ensure standard behaviour.

        let result;
        if (editingBrand) {
            result = await updateBrand(editingBrand.id, formData);
        } else {
            result = await createBrand(formData);
        }

        if (result?.error) {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        } else {
            toast({ title: "Success", description: `Brand ${editingBrand ? "updated" : "created"} successfully` });
            setIsDialogOpen(false);
            setEditingBrand(null);
            loadBrands();
        }
        setSubmitting(false);
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure? This will remove the brand from products.")) return;
        const result = await deleteBrand(id);
        if (result.error) {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        } else {
            toast({ title: "Deleted", description: "Brand deleted successfully" });
            loadBrands();
        }
    }

    async function handleToggleStatus(id: string, current: boolean) {
        const result = await toggleBrandStatus(id, current);
        if (result.error) {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        } else {
            loadBrands();
        }
    }

    const openEdit = (brand: Brand) => {
        setEditingBrand(brand);
        setIsDialogOpen(true);
    };

    const openCreate = () => {
        setEditingBrand(null);
        setIsDialogOpen(true);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Search brands..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button onClick={openCreate} className="bg-[#D4AF37] hover:bg-[#B5952F] text-white">
                    <Plus className="h-4 w-4 mr-2" /> Add Brand
                </Button>
            </div>

            <div className="border rounded-lg bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Logo</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#D4AF37]" />
                                </TableCell>
                            </TableRow>
                        ) : filteredBrands.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                                    No brands found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredBrands.map((brand) => (
                                <TableRow key={brand.id}>
                                    <TableCell>
                                        {brand.logo_url ? (
                                            <img src={brand.logo_url} alt={brand.name} className="h-8 w-8 object-contain" />
                                        ) : (
                                            <div className="h-8 w-8 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500">
                                                N/A
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium">{brand.name}</TableCell>
                                    <TableCell className="text-gray-500">{brand.slug}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={brand.is_active}
                                                onCheckedChange={() => handleToggleStatus(brand.id, brand.is_active)}
                                            />
                                            <span className="text-xs text-gray-500">{brand.is_active ? "Active" : "Inactive"}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(brand)}>
                                            <Edit className="h-4 w-4 text-gray-500" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(brand.id)}>
                                            <Trash className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingBrand ? "Edit Brand" : "Add New Brand"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Brand Name</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="e.g. L'Oreal"
                                defaultValue={editingBrand?.name}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="slug">Slug (URL friendly)</Label>
                            <Input
                                id="slug"
                                name="slug"
                                placeholder="e.g. loreal"
                                defaultValue={editingBrand?.slug}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="logo_url">Logo URL</Label>
                            <Input
                                id="logo_url"
                                name="logo_url"
                                placeholder="https://..."
                                defaultValue={editingBrand?.logo_url || ""}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_active"
                                name="is_active"
                                className="h-4 w-4"
                                defaultChecked={editingBrand ? editingBrand.is_active : true}
                            />
                            <Label htmlFor="is_active">Active</Label>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingBrand ? "Update" : "Create")}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
