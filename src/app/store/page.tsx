import { MainNav } from "@/components/main-nav";
import { MainFooter } from "@/components/main-footer";
import { StoreFilters } from "@/components/store-filters";
import { ProductGrid } from "@/components/product-grid";
import { createClient } from "../../../supabase/server";

export default async function StorePage({
  searchParams,
}: {
  searchParams: { category?: string; brand?: string; search?: string };
}) {
  const supabase = await createClient();

  // Fetch authenticated user and role server-side for accurate initial pricing
  const { data: { user } } = await supabase.auth.getUser();
  let userRole: string | null = null;

  if (user) {
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    userRole = userData?.role || null;
  }

  // Fetch brands and categories for filters first to resolve slugs
  const { data: brands } = await supabase.from("brands").select("*");
  const { data: categories } = await supabase.from("categories").select("*");

  // Build query
  let query = supabase.from("products").select("*");

  if (searchParams.category) {
    const category = categories?.find(c => c.slug === searchParams.category);
    if (category) {
      query = query.eq("category_id", category.id);
    }
  }

  if (searchParams.brand) {
    const brand = brands?.find(b => b.slug === searchParams.brand);
    if (brand) {
      query = query.eq("brand_id", brand.id);
    }
  }

  if (searchParams.search) {
    query = query.ilike("name", `%${searchParams.search}%`);
  }

  // Fetch products
  const { data: products, error: productsError } = await query;

  if (productsError) {
    console.error("❌ Store - Error fetching products:", productsError);
  } else {
    console.log("✅ Store - Products found:", products?.length || 0);
  }

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
          <aside className="lg:w-64 flex-shrink-0 sticky top-24 h-fit">
            <StoreFilters brands={brands || []} categories={categories || []} />
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-charcoal-light">
                {products?.length || 0} products found
              </p>
            </div>

            <ProductGrid products={products || []} initialUserRole={userRole} />
          </div>
        </div>
      </div>

      <MainFooter />
    </div>
  );
}
