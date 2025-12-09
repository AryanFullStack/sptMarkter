import { MainNav } from "@/components/main-nav";
import { MainFooter } from "@/components/main-footer";
import { ProductImageGallery } from "@/components/product-image-gallery";
import { ProductInfo } from "@/components/product-info";
import { createClient } from "../../../../supabase/server";
import { notFound } from "next/navigation";

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("*, brands(name), categories(name)")
    .eq("slug", params.slug)
    .eq("is_active", true)
    .single();

  if (!product) {
    notFound();
  }

  const { data: { user } } = await supabase.auth.getUser();
  let userRole = "local_customer";
  
  if (user) {
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    userRole = userData?.role || "local_customer";
  }

  const price =
    userRole === "beauty_parlor"
      ? product.beauty_price
      : userRole === "retailer"
      ? product.retailer_price
      : product.customer_price;

  return (
    <div className="min-h-screen bg-cream">
      <MainNav />

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <ProductImageGallery
            images={
              product.images?.length > 0
                ? product.images
                : ["https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80"]
            }
            productName={product.name}
          />
          <ProductInfo
            product={product}
            price={price}
            userRole={userRole}
            brand={product.brands?.name}
            category={product.categories?.name}
          />
        </div>
      </div>

      <MainFooter />
    </div>
  );
}
