"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/supabase/client";
import DashboardNavbar from "@/components/dashboard-navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

export default function ProductsManagementPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    category_id: "",
    brand_id: "",
    price_customer: 0,
    price_retailer: 0,
    price_beauty_parlor: 0,
    stock_quantity: 0,
    images: [] as string[],
    is_featured: false,
  });
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    checkAdmin();
    loadData();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchTerm, products]);

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/sign-in");
      return;
    }

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userData?.role !== "admin") {
      router.push("/dashboard");
    }
  }

  async function loadData() {
    const [productsRes, categoriesRes, brandsRes] = await Promise.all([
      supabase.from("products").select("*, categories(name), brands(name)").order("created_at", { ascending: false }),
      supabase.from("categories").select("*"),
      supabase.from("brands").select("*"),
    ]);

    if (productsRes.data) setProducts(productsRes.data);
    if (categoriesRes.data) setCategories(categoriesRes.data);
    if (brandsRes.data) setBrands(brandsRes.data);
    setLoading(false);
  }

  function filterProducts() {
    if (!searchTerm) {
      setFilteredProducts(products);
      return;
    }

    const filtered = products.filter(product =>
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.slug?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }

  async function handleAddProduct() {
    const slug = formData.name.toLowerCase().replace(/\s+/g, "-");
    await supabase.from("products").insert({
      ...formData,
      slug,
    });

    setIsAddOpen(false);
    resetForm();
    loadData();
  }

  async function handleUpdateProduct() {
    if (!selectedProduct) return;

    await supabase
      .from("products")
      .update(formData)
      .eq("id", selectedProduct.id);

    setIsEditOpen(false);
    resetForm();
    loadData();
  }

  async function deleteProduct(id: string) {
    if (confirm("Are you sure you want to delete this product?")) {
      await supabase.from("products").delete().eq("id", id);
      loadData();
    }
  }

  function resetForm() {
    setFormData({
      name: "",
      slug: "",
      description: "",
      category_id: "",
      brand_id: "",
      price_customer: 0,
      price_retailer: 0,
      price_beauty_parlor: 0,
      stock_quantity: 0,
      images: [],
      is_featured: false,
    });
    setSelectedProduct(null);
  }

  function openEditDialog(product: any) {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description || "",
      category_id: product.category_id,
      brand_id: product.brand_id,
      price_customer: product.price_customer,
      price_retailer: product.price_retailer,
      price_beauty_parlor: product.price_beauty_parlor,
      stock_quantity: product.stock_quantity,
      images: product.images || [],
      is_featured: product.is_featured,
    });
    setIsEditOpen(true);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCF9]">
        <DashboardNavbar />
        <div className="container mx-auto px-4 py-16">
          <p className="text-center text-[#6B6B6B]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF9]">
      <DashboardNavbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="font-serif text-4xl font-semibold text-[#1A1A1A] mb-2">Product Management</h1>
            <p className="text-[#6B6B6B]">Manage all products, pricing, and inventory</p>
          </div>
          <Button
            onClick={() => setIsAddOpen(true)}
            className="bg-[#D4AF37] hover:bg-[#C19B2E] text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="font-serif text-2xl">Search Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-[#6B6B6B]" />
              <Input
                placeholder="Search by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-2xl">All Products ({filteredProducts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Customer Price</TableHead>
                    <TableHead>Retailer Price</TableHead>
                    <TableHead>Parlor Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        {product.images?.[0] ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            width={50}
                            height={50}
                            className="rounded object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-[#F7F5F2] rounded flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-[#6B6B6B]" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.categories?.name || "N/A"}</TableCell>
                      <TableCell>{product.brands?.name || "N/A"}</TableCell>
                      <TableCell>₹{product.price_customer?.toFixed(2)}</TableCell>
                      <TableCell>₹{product.price_retailer?.toFixed(2)}</TableCell>
                      <TableCell>₹{product.price_beauty_parlor?.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={product.stock_quantity <= 10 ? "bg-[#8B3A3A] text-white" : "bg-[#2D5F3F] text-white"}>
                          {product.stock_quantity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-[#8B3A3A]"
                            onClick={() => deleteProduct(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">Add New Product</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Product Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Brand</Label>
                  <Select
                    value={formData.brand_id}
                    onValueChange={(value) => setFormData({ ...formData, brand_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>Customer Price</Label>
                  <Input
                    type="number"
                    value={formData.price_customer}
                    onChange={(e) => setFormData({ ...formData, price_customer: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Retailer Price</Label>
                  <Input
                    type="number"
                    value={formData.price_retailer}
                    onChange={(e) => setFormData({ ...formData, price_retailer: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Beauty Parlor Price</Label>
                  <Input
                    type="number"
                    value={formData.price_beauty_parlor}
                    onChange={(e) => setFormData({ ...formData, price_beauty_parlor: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <Label>Stock Quantity</Label>
                <Input
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Image URL</Label>
                <Input
                  placeholder="https://example.com/image.jpg"
                  onChange={(e) => setFormData({ ...formData, images: [e.target.value] })}
                />
              </div>
              <Button
                onClick={handleAddProduct}
                className="w-full bg-[#D4AF37] hover:bg-[#C19B2E] text-white"
              >
                Add Product
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">Edit Product</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Product Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Brand</Label>
                  <Select
                    value={formData.brand_id}
                    onValueChange={(value) => setFormData({ ...formData, brand_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>Customer Price</Label>
                  <Input
                    type="number"
                    value={formData.price_customer}
                    onChange={(e) => setFormData({ ...formData, price_customer: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Retailer Price</Label>
                  <Input
                    type="number"
                    value={formData.price_retailer}
                    onChange={(e) => setFormData({ ...formData, price_retailer: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Beauty Parlor Price</Label>
                  <Input
                    type="number"
                    value={formData.price_beauty_parlor}
                    onChange={(e) => setFormData({ ...formData, price_beauty_parlor: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <Label>Stock Quantity</Label>
                <Input
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: Number(e.target.value) })}
                />
              </div>
              <Button
                onClick={handleUpdateProduct}
                className="w-full bg-[#D4AF37] hover:bg-[#C19B2E] text-white"
              >
                Update Product
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
