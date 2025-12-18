import { notFound } from "next/navigation";
import { createClient } from "../../../../supabase/server";
import { MainNav } from "@/components/main-nav";
import { MainFooter } from "@/components/main-footer";
import { ProductGallery } from "@/components/product/product-gallery";
import { PriceLabel } from "@/components/product/price-label";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { WishlistButton } from "@/components/product/wishlist-button";
import { ProductCard } from "@/components/product-card";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, Shield, Star } from "lucide-react";
import Link from "next/link";

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = await createClient();

  // Fetch product by slug
  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (error || !product) {
    notFound();
  }

  // Fetch related products (same category)
  const { data: relatedProducts } = await supabase
    .from("products")
    .select("*")
    .eq("category_id", product.category_id)
    .neq("id", product.id)
    .limit(4);

  const getStockStatus = () => {
    if (product.stock_quantity === 0) return { label: "Out of Stock", color: "bg-red-500" };
    if (product.stock_quantity <= (product.low_stock_threshold || 10))
      return { label: "Low Stock", color: "bg-orange-500" };
    return { label: "In Stock", color: "bg-green-500" };
  };

  const stockStatus = getStockStatus();

  return (
    <div className="min-h-screen bg-[#FDFCF9]">
      <MainNav />

      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-8">
          <Link href="/" className="hover:text-[#D4AF37]">
            Home
          </Link>
          <span>/</span>
          <Link href="/store" className="hover:text-[#D4AF37]">
            Store
          </Link>
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        {/* Product Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Left: Image Gallery */}
          <ProductGallery
            images={product.images || []}
            productName={product.name}
          />

          {/* Right: Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="font-display text-4xl font-bold text-[#1A1A1A] mb-2">
                {product.name}
              </h1>

              {/* Stock Status */}
              <div className="flex items-center gap-3 mb-4">
                <Badge className={`${stockStatus.color} text-white`}>
                  {stockStatus.label}
                </Badge>
                <span className="text-sm text-gray-600">
                  {product.stock_quantity} units available
                </span>
              </div>
            </div>

            {/* Price */}
            <PriceLabel product={product} showLabel className="py-4 border-y" />

            {/* Description */}
            <div>
              <h3 className="font-semibold text-lg mb-2">Description</h3>
              <p className="text-gray-700 leading-relaxed">
                {product.description || "No description available."}
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-4">
              <AddToCartButton product={product} />
              <WishlistButton product={product} className="w-full" />
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-[#D4AF37]" />
                <span className="text-sm text-gray-700">Authentic Products</span>
              </div>
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-[#D4AF37]" />
                <span className="text-sm text-gray-700">Fast Delivery</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-[#D4AF37]" />
                <span className="text-sm text-gray-700">Secure Payment</span>
              </div>
              <div className="flex items-center gap-3">
                <Star className="h-5 w-5 text-[#D4AF37]" />
                <span className="text-sm text-gray-700">Quality Assured</span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="font-display text-3xl font-bold text-[#1A1A1A] mb-8">
              Related Products
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct: any) => (
                <ProductCard
                  key={relatedProduct.id}
                  id={relatedProduct.id}
                  name={relatedProduct.name}
                  slug={relatedProduct.slug}
                  price={relatedProduct.price_customer}
                  image={relatedProduct.images?.[0]}
                  brand={relatedProduct.brand_id}
                  stockStatus={
                    relatedProduct.stock_quantity === 0
                      ? "out_of_stock"
                      : relatedProduct.stock_quantity <= 10
                        ? "low_stock"
                        : "in_stock"
                  }
                  stockCount={relatedProduct.stock_quantity}
                />
              ))}
            </div>
          </div>
        )}

        {/* Reviews Placeholder */}
        <div className="mt-16 border-t pt-12">
          <h2 className="font-display text-3xl font-bold text-[#1A1A1A] mb-6">
            Customer Reviews
          </h2>
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-600">
              Reviews coming soon. Be the first to share your experience!
            </p>
          </div>
        </div>
      </main>

      <MainFooter />
    </div>
  );
}
