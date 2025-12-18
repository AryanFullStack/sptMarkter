import { MainNav } from "@/components/main-nav";
import { MainFooter } from "@/components/main-footer";
import { ProductGrid } from "@/components/product-grid";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Award, Truck, Shield } from "lucide-react";
import Link from "next/link";
import { createClient } from "../../supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch featured products
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .limit(8);

  if (error) {
    console.error("❌ Error fetching products:", error);
  } else {
    console.log("✅ Fetched products count:", products?.length || 0);
  }

  return (
    <div className="min-h-screen bg-cream">
      <MainNav />

      {/* Hero Section */}
      <section className="relative h-[600px] lg:h-[700px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal/90 to-charcoal/50 z-10" />
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1600&q=80')",
          }}
        />
        <div className="relative z-20 container mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/20 backdrop-blur text-gold border border-gold/30">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Premium Beauty Collection</span>
            </div>
            <h1 className="font-display text-5xl lg:text-7xl font-bold text-white leading-tight">
              Elevate Your Beauty Business
            </h1>
            <p className="text-xl text-cream-light/90 leading-relaxed">
              Discover premium beauty products for parlors, retailers, and beauty enthusiasts. Wholesale pricing, quality guaranteed.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="bg-gold hover:bg-gold-dark text-white text-base px-8">
                <Link href="/store">
                  Shop Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white text-gold-dark hover:bg-white hover:text-charcoal text-base px-8">
                <Link href="/about">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Award className="h-8 w-8" />,
                title: "Premium Quality",
                description: "Authentic products from trusted brands",
              },
              {
                icon: <Truck className="h-8 w-8" />,
                title: "Fast Delivery",
                description: "Quick shipping across Pakistan",
              },
              {
                icon: <Shield className="h-8 w-8" />,
                title: "Secure Payment",
                description: "Multiple payment options available",
              },
              {
                icon: <Sparkles className="h-8 w-8" />,
                title: "Wholesale Pricing",
                description: "Special rates for businesses",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="text-center space-y-3 p-6 rounded-lg hover:bg-cream-light transition-colors"
              >
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gold/10 text-gold">
                  {feature.icon}
                </div>
                <h3 className="font-display text-lg font-semibold text-charcoal">
                  {feature.title}
                </h3>
                <p className="text-sm text-charcoal-light">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-cream-light">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold text-charcoal mb-4">
              Shop by Category
            </h2>
            <p className="text-charcoal-light max-w-2xl mx-auto">
              Explore our curated collection of premium beauty products
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: "Skincare", image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&q=80", slug: "skincare" },
              { name: "Makeup", image: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400&q=80", slug: "makeup" },
              { name: "Haircare", image: "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=400&q=80", slug: "haircare" },
              { name: "Fragrances", image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&q=80", slug: "fragrances" },
            ].map((category) => (
              <Link
                key={category.slug}
                href={`/store?category=${category.slug}`}
                className="group relative aspect-square rounded-lg overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 to-transparent z-10" />
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                  style={{ backgroundImage: `url('${category.image}')` }}
                />
                <div className="relative z-20 h-full flex items-end p-6">
                  <h3 className="font-display text-2xl font-bold text-white">
                    {category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="font-display text-4xl font-bold text-charcoal mb-2">
                Featured Products
              </h2>
              <p className="text-charcoal-light">Handpicked bestsellers for you</p>
            </div>
            <Button asChild variant="outline" className="border-charcoal text-charcoal hover:bg-charcoal hover:text-white">
              <Link href="/store">View All</Link>
            </Button>
          </div>
          <ProductGrid products={products?.slice(0, 8) || []} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-charcoal text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-4xl font-bold mb-4">
            Ready to Start Your Beauty Journey?
          </h2>
          <p className="text-cream-light/80 mb-8 max-w-2xl mx-auto text-lg">
            Join thousands of beauty professionals who trust Spectrum Marketers for their business needs.
          </p>
          <Button asChild size="lg" className="bg-gold hover:bg-gold-dark text-white text-base px-8">
            <Link href="/sign-up">
              Create Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      <MainFooter />
    </div>
  );
}
