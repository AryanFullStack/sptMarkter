"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, Column } from "@/components/shared/data-table";
import { ExportButton } from "@/components/shared/export-button";
import { ProductForm } from "@/components/admin/product-form";
import { Package, Plus, Edit, Trash2, Image as ImageIcon } from "lucide-react";
import { formatDate, formatCurrency } from "@/utils/export-utils";
import { deleteProduct } from "@/app/admin/actions";
import { notify } from "@/lib/notifications";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_customer: number;
  price_retailer: number;
  price_beauty_parlor: number;
  stock_quantity: number | null;
  images: string[] | null;
  is_featured: boolean | null;
  created_at: string;
  brand_id: string | null;
  category_id: string | null;
  brand?: { name: string };
  category?: { name: string };
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [filter, setFilter] = useState<"all" | "low-stock" | "featured">("all");

  const supabase = createClient();

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        brand:brands(name),
        category:categories(name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading products:", error);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  }

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      await deleteProduct(productId);
      notify.success("Product Deleted", "Product has been successfully deleted from the catalog.");
      loadProducts();
    } catch (error: any) {
      console.error("Error deleting product:", error);
      notify.error("Error", error.message || "Failed to delete product");
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingProduct(null);
    loadProducts();
  };

  const columns: Column<Product>[] = [
    {
      key: "images",
      header: "Image",
      render: (product) => (
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#F7F5F2] flex items-center justify-center">
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="h-6 w-6 text-[#6B6B6B]" />
          )}
        </div>
      ),
    },
    {
      key: "name",
      header: "Product",
      sortable: true,
      render: (product) => (
        <div>
          <p className="font-medium text-[#1A1A1A]">{product.name}</p>
          <p className="text-sm text-[#6B6B6B]">{product.slug}</p>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category / Brand",
      render: (product) => (
        <div className="text-sm">
          <p>{product.category?.name || "N/A"}</p>
          <p className="text-[#6B6B6B]">{product.brand?.name || "N/A"}</p>
        </div>
      ),
    },
    {
      key: "price_customer",
      header: "Prices",
      render: (product) => (
        <div className="text-sm space-y-1">
          <p><span className="text-[#6B6B6B]">Customer:</span> {formatCurrency(product.price_customer)}</p>
          <p><span className="text-[#6B6B6B]">Retailer:</span> {formatCurrency(product.price_retailer)}</p>
          <p><span className="text-[#6B6B6B]">Parlor:</span> {formatCurrency(product.price_beauty_parlor)}</p>
        </div>
      ),
    },
    {
      key: "stock_quantity",
      header: "Stock",
      sortable: true,
      render: (product) => {
        const stock = product.stock_quantity || 0;
        const stockClass = stock <= 10 ? "text-[#8B3A3A]" : stock <= 50 ? "text-[#C77D2E]" : "text-[#2D5F3F]";
        return (
          <Badge variant="outline" className={stockClass}>
            {stock} units
          </Badge>
        );
      },
    },
    {
      key: "is_featured",
      header: "Featured",
      render: (product) =>
        product.is_featured ? (
          <Badge className="bg-[#D4AF37] text-white">Featured</Badge>
        ) : (
          <span className="text-[#6B6B6B]">-</span>
        ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (product) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleEdit(product)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-[#8B3A3A]"
            onClick={() => handleDelete(product.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const stats = {
    total: products.length,
    lowStock: products.filter(p => (p.stock_quantity || 0) <= 10).length,
    featured: products.filter(p => p.is_featured).length,
  };

  const filteredProducts = products.filter(p => {
    if (filter === "low-stock") return (p.stock_quantity || 0) <= 10;
    if (filter === "featured") return p.is_featured;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-serif text-4xl font-semibold text-[#1A1A1A]">
            Product Management
          </h1>
          <p className="text-[#6B6B6B] mt-2">
            Add, edit, and manage your product catalog
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton data={products} filename="products-export" />
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className={cn(
            "cursor-pointer transition-all hover:shadow-md ring-2 ring-transparent",
            filter === "all" && "ring-[#2D5F3F] bg-[#2D5F3F]/5 shadow-md"
          )}
          onClick={() => setFilter("all")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#6B6B6B]">
              Total Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className={cn("h-5 w-5", filter === "all" ? "text-[#1E4D2B]" : "text-[#D4AF37]")} />
              <span className="text-2xl font-bold text-[#1A1A1A]">
                {stats.total}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "cursor-pointer transition-all hover:shadow-md ring-2 ring-transparent",
            filter === "low-stock" && "ring-[#8B3A3A] bg-[#8B3A3A]/5 shadow-md"
          )}
          onClick={() => setFilter(filter === "low-stock" ? "all" : "low-stock")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#6B6B6B]">
              Low Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className={cn("h-5 w-5", filter === "low-stock" ? "text-red-700" : "text-[#8B3A3A]")} />
              <span className={cn("text-2xl font-bold", filter === "low-stock" ? "text-red-700" : "text-[#8B3A3A]")}>
                {stats.lowStock}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "cursor-pointer transition-all hover:shadow-md ring-2 ring-transparent",
            filter === "featured" && "ring-[#D4AF37] bg-[#D4AF37]/5 shadow-md"
          )}
          onClick={() => setFilter(filter === "featured" ? "all" : "featured")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#6B6B6B]">
              Featured
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className={cn("h-5 w-5", filter === "featured" ? "text-yellow-700" : "text-[#D4AF37]")} />
              <span className={cn("text-2xl font-bold", filter === "featured" ? "text-yellow-700" : "text-[#D4AF37]")}>
                {stats.featured}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
          <CardTitle className="text-xl font-serif">
            {filter === "low-stock" ? "Low Stock Items" : filter === "featured" ? "Featured Items" : "Product Catalog"}
          </CardTitle>
          {filter !== "all" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilter("all")}
              className="text-xs font-bold text-[#6B6B6B] hover:text-[#1A1A1A]"
            >
              Clear Filter
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-12 text-[#6B6B6B]">
              Loading products...
            </div>
          ) : (
            <DataTable
              data={filteredProducts}
              columns={columns}
              searchable
              searchPlaceholder="Search products..."
              emptyMessage="No products found"
            />
          )}
        </CardContent>
      </Card>

      {/* Product Form Modal */}
      {showForm && (
        <ProductForm
          product={editingProduct}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
