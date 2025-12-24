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
import { Skeleton } from "@/components/ui/skeleton";

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

  // Pagination & Search State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({ total: 0, lowStock: 0, featured: 0 });

  const ITEMS_PER_PAGE = 15;
  const supabase = createClient();

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadProducts(currentPage, searchQuery, filter);
  }, [currentPage, filter]); // Search is handled by debounce/enter separately

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        loadProducts(1, searchQuery, filter);
      } else {
        setCurrentPage(1); // will trigger above effect
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);


  async function loadStats() {
    try {
      const [totalRes, lowStockRes, featuredRes] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }).lte("stock_quantity", 10),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("is_featured", true)
      ]);

      setStats({
        total: totalRes.count || 0,
        lowStock: lowStockRes.count || 0,
        featured: featuredRes.count || 0
      });
    } catch (e) {
      console.error("Error loading stats", e);
    }
  }

  async function loadProducts(page: number, search: string, activeFilter: string) {
    setLoading(true);
    try {
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from("products")
        .select(`
            *,
            brand:brands(name),
            category:categories(name)
          `, { count: "exact" });

      // Apply filters
      if (activeFilter === "low-stock") {
        query = query.lte("stock_quantity", 10);
      } else if (activeFilter === "featured") {
        query = query.eq("is_featured", true);
      }

      // Apply search
      if (search) {
        query = query.ilike("name", `%${search}%`);
      }

      const { data, count, error } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      setProducts(data || []);
      if (count !== null) {
        setTotalItems(count);
        setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
      }
    } catch (error) {
      console.error("Error loading products:", error);
      notify.error("Error", "Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      await deleteProduct(productId);
      notify.success("Product Deleted", "Product has been successfully deleted from the catalog.");
      loadProducts(currentPage, searchQuery, filter);
      loadStats(); // Refresh stats
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
    loadProducts(currentPage, searchQuery, filter);
    loadStats();
  };

  const handleFilterChange = (newFilter: "all" | "low-stock" | "featured") => {
    if (filter === newFilter) {
      setFilter("all"); // Toggle off
      setCurrentPage(1);
    } else {
      setFilter(newFilter);
      setCurrentPage(1);
    }
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
      sortable: false, // Server side sort not impl for this column yet
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
      sortable: false,
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
          onClick={() => handleFilterChange("all")}
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
          onClick={() => handleFilterChange("low-stock")}
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
          onClick={() => handleFilterChange("featured")}
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
          <div className="flex items-center gap-4">
            {/* Search Input */}
            <div className="relative w-64">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
            {filter !== "all" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFilterChange("all")}
                className="text-xs font-bold text-[#6B6B6B] hover:text-[#1A1A1A]"
              >
                Clear Filter
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="border border-[#E8E8E8] rounded-lg overflow-hidden">
              <div className="grid grid-cols-6 gap-4 p-4 bg-[#F7F5F2] border-b">
                {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-4 w-20" />)}
              </div>
              <div className="divide-y">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="grid grid-cols-6 gap-4 p-4 items-center">
                    <Skeleton className="h-16 w-16 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-8 rounded-md" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <DataTable
                data={products}
                columns={columns}
                searchable={false} // usage controlled externally
                emptyMessage="No products found"
              />

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-[#6B6B6B]">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
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
