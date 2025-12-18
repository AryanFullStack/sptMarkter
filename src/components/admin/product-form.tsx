"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FileUpload } from "@/components/shared/file-upload";
import { createClient } from "@/supabase/client";
import { createProduct, updateProduct } from "@/app/admin/actions";
import { compressAndUploadImage } from "@/utils/image-compression";
import { Loader2 } from "lucide-react";

interface ProductFormProps {
    product?: any;
    onClose: () => void;
}

export function ProductForm({ product, onClose }: ProductFormProps) {
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [brands, setBrands] = useState<any[]>([]);
    const [uploadingImages, setUploadingImages] = useState(false);

    const [formData, setFormData] = useState({
        name: product?.name || "",
        slug: product?.slug || "",
        description: product?.description || "",
        price_customer: product?.price_customer || 0,
        price_retailer: product?.price_retailer || 0,
        price_beauty_parlor: product?.price_beauty_parlor || 0,
        stock_quantity: product?.stock_quantity || 0,
        category_id: product?.category_id || "",
        brand_id: product?.brand_id || "",
        is_featured: product?.is_featured || false,
        images: product?.images || [],
    });

    const supabase = createClient();

    useEffect(() => {
        loadCategories();
        loadBrands();
    }, []);

    async function loadCategories() {
        const { data } = await supabase
            .from("categories")
            .select("id, name")
            .eq("is_active", true)
            .order("name");

        setCategories(data || []);
    }

    async function loadBrands() {
        const { data } = await supabase
            .from("brands")
            .select("id, name")
            .eq("is_active", true)
            .order("name");

        setBrands(data || []);
    }

    const handleFileSelect = async (files: File[]) => {
        setUploadingImages(true);
        try {
            const uploadPromises = files.map(async (file) => {
                const formData = new FormData();
                formData.append("file", file);

                const response = await fetch("/api/upload-image", {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || "Upload failed");
                }

                const { url } = await response.json();
                return url;
            });

            const uploadedUrls = await Promise.all(uploadPromises);

            setFormData(prev => ({
                ...prev,
                images: [...prev.images, ...uploadedUrls],
            }));
        } catch (error: any) {
            console.error("Error uploading images:", error);
            alert(`Failed to upload images: ${error.message || "Unknown error"}`);
        } finally {
            setUploadingImages(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Generate slug from name if not provided
            const slugValue = formData.slug || formData.name.toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "");

            const productData = {
                ...formData,
                slug: slugValue,
            };

            if (product) {
                await updateProduct(product.id, productData);
            } else {
                await createProduct(productData);
            }

            onClose();
        } catch (error: any) {
            console.error("Error saving product:", error);
            alert(error.message || "Failed to save product");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="font-serif text-2xl">
                        {product ? "Edit Product" : "Add New Product"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Basic Information</h3>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="name">Product Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="slug">Slug</Label>
                                <Input
                                    id="slug"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    placeholder="auto-generated from name"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="category">Category</Label>
                                <Select
                                    value={formData.category_id}
                                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="brand">Brand</Label>
                                <Select
                                    value={formData.brand_id}
                                    onValueChange={(value) => setFormData({ ...formData, brand_id: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select brand" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {brands.map((brand) => (
                                            <SelectItem key={brand.id} value={brand.id}>
                                                {brand.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Pricing (₹)</h3>

                        <div className="grid md:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="price_customer">Customer Price *</Label>
                                <Input
                                    id="price_customer"
                                    type="number"
                                    step="0.01"
                                    value={formData.price_customer}
                                    onChange={(e) => setFormData({ ...formData, price_customer: parseFloat(e.target.value) })}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="price_retailer">Retailer Price *</Label>
                                <Input
                                    id="price_retailer"
                                    type="number"
                                    step="0.01"
                                    value={formData.price_retailer}
                                    onChange={(e) => setFormData({ ...formData, price_retailer: parseFloat(e.target.value) })}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="price_parlor">Beauty Parlor Price *</Label>
                                <Input
                                    id="price_parlor"
                                    type="number"
                                    step="0.01"
                                    value={formData.price_beauty_parlor}
                                    onChange={(e) => setFormData({ ...formData, price_beauty_parlor: parseFloat(e.target.value) })}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Inventory */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Inventory</h3>

                        <div>
                            <Label htmlFor="stock">Stock Quantity</Label>
                            <Input
                                id="stock"
                                type="number"
                                value={formData.stock_quantity}
                                onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>

                    {/* Images */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Product Images</h3>

                        <FileUpload
                            onFileSelect={handleFileSelect}
                            accept="image/*"
                            multiple
                            maxSize={5}
                            preview
                        />

                        {uploadingImages && (
                            <div className="flex items-center gap-2 text-sm text-[#6B6B6B]">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Uploading images...
                            </div>
                        )}

                        {formData.images.length > 0 && (
                            <div className="grid grid-cols-4 gap-2">
                                {formData.images.map((url: string, index: number) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={url}
                                            alt={`Product ${index + 1}`}
                                            className="w-full h-24 object-cover rounded-lg border border-[#E8E8E8]"
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="destructive"
                                            className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => {
                                                setFormData({
                                                    ...formData,
                                                    images: formData.images.filter((_: string, i: number) => i !== index),
                                                });
                                            }}
                                        >
                                            ×
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Options */}
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="featured"
                            checked={formData.is_featured}
                            onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                        />
                        <Label htmlFor="featured" className="cursor-pointer">
                            Feature this product on homepage
                        </Label>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || uploadingImages}>
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                product ? "Update Product" : "Create Product"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
