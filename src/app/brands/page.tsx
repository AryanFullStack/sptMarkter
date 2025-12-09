import { MainNav } from "@/components/main-nav";
import { MainFooter } from "@/components/main-footer";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "../../../supabase/server";

export default async function BrandsPage() {
  const supabase = await createClient();

  const { data: brands } = await supabase
    .from("brands")
    .select("*")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="min-h-screen bg-cream">
      <MainNav />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="font-display text-5xl font-bold text-charcoal mb-4">
            Our Brands
          </h1>
          <p className="text-xl text-charcoal-light">
            Discover premium beauty brands we proudly carry
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {brands?.map((brand) => (
            <Link
              key={brand.id}
              href={`/store?brand=${brand.slug}`}
              className="group bg-white rounded-lg p-8 border border-charcoal/10 hover:border-gold hover:shadow-lg transition-all"
            >
              <div className="aspect-square relative mb-4 flex items-center justify-center">
                {brand.logo_url ? (
                  <Image
                    src={brand.logo_url}
                    alt={brand.name}
                    fill
                    className="object-contain"
                  />
                ) : (
                  <div className="font-display text-2xl font-bold text-charcoal group-hover:text-gold transition-colors">
                    {brand.name}
                  </div>
                )}
              </div>
              <h3 className="font-display text-lg font-semibold text-charcoal text-center group-hover:text-gold transition-colors">
                {brand.name}
              </h3>
              {brand.description && (
                <p className="text-sm text-charcoal-light text-center mt-2 line-clamp-2">
                  {brand.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      </div>

      <MainFooter />
    </div>
  );
}
