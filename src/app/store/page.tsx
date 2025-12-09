import { MainNav } from "@/components/main-nav";
import { MainFooter } from "@/components/main-footer";
import { StoreFilters } from "@/components/store-filters";
import { ProductCard } from "@/components/product-card";
import { createClient } from "../../../supabase/server";

export default async function StorePage({
  searchParams,
}: {
  searchParams: { category?: string; brand?: string; search?: string };
}) {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("*, brands(name), categories(name)")
    .eq("is_active", true);

  if (searchParams.category) {
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", searchParams.category)
      .single();
    if (category) {
      query = query.eq("category_id", category.id);
    }
  }

  if (searchParams.brand) {
    const { data: brand } = await supabase
      .from("brands")
      .select("id")
      .eq("slug", searchParams.brand)
      .single();
    if (brand) {
      query = query.eq("brand_id", brand.id);
    }
  }

  if (searchParams.search) {
    query = query.ilike("name", `%${searchParams.search}%`);
  }

  const { data: products } = await query;
  const { data: brands } = await supabase.from("brands").select("*").eq("is_active", true);
  const { data: categories } = await supabase.from("categories").select("*").eq("is_active", true);

  return (
    <div className="min-h-screen bg-cream">
      <MainNav />

      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-charcoal mb-2">
            Our Store
          </h1>
          <p className="text-charcoal-light">
            Discover premium beauty products for your business
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <StoreFilters brands={brands || []} categories={categories || []} />
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-charcoal-light">
                {products?.length || 0} products found
              </p>
            </div>

            {products && products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product: any) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    slug={product.slug}
                    price={product.customer_price}
                    image={
                      product.images?.[0] ||
                      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80"
                    }
                    brand={product.brands?.name}
                    stockStatus={
                      product.stock_quantity === 0
                        ? "out_of_stock"
                        : product.stock_quantity <= product.low_stock_threshold
                        ? "low_stock"
                        : "in_stock"
                    }
                    stockCount={product.stock_quantity}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-charcoal-light text-lg">No products found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <MainFooter />
    </div>
  );
}
