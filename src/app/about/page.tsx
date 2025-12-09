import { MainNav } from "@/components/main-nav";
import { MainFooter } from "@/components/main-footer";
import { Award, Users, Target, Heart } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-cream">
      <MainNav />

      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-20">
          <h1 className="font-display text-5xl lg:text-6xl font-bold text-charcoal mb-6">
            About Spectrum Marketers
          </h1>
          <p className="text-xl text-charcoal-light leading-relaxed">
            Your trusted partner in premium beauty products, serving beauty professionals and enthusiasts across Pakistan since 2020.
          </p>
        </div>

        {/* Story Section */}
        <div className="max-w-4xl mx-auto mb-20">
          <div className="bg-white rounded-lg p-8 lg:p-12 shadow-sm">
            <h2 className="font-display text-3xl font-bold text-charcoal mb-6">
              Our Story
            </h2>
            <div className="space-y-4 text-charcoal-light leading-relaxed">
              <p>
                Spectrum Marketers was founded with a simple mission: to provide beauty professionals and enthusiasts with access to premium, authentic beauty products at competitive prices.
              </p>
              <p>
                What started as a small distribution business has grown into one of Pakistan's most trusted beauty product suppliers, serving thousands of beauty parlors, retailers, and individual customers.
              </p>
              <p>
                We pride ourselves on our commitment to quality, authenticity, and customer service. Every product in our catalog is carefully selected and verified to ensure it meets our high standards.
              </p>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-20">
          <h2 className="font-display text-3xl font-bold text-charcoal text-center mb-12">
            Our Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Award className="h-8 w-8" />,
                title: "Quality First",
                description: "We never compromise on product authenticity and quality",
              },
              {
                icon: <Users className="h-8 w-8" />,
                title: "Customer Focus",
                description: "Your success is our success. We're here to support you",
              },
              {
                icon: <Target className="h-8 w-8" />,
                title: "Reliability",
                description: "Consistent supply and timely delivery you can count on",
              },
              {
                icon: <Heart className="h-8 w-8" />,
                title: "Passion",
                description: "We love beauty products and it shows in everything we do",
              },
            ].map((value, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-6 text-center space-y-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gold/10 text-gold">
                  {value.icon}
                </div>
                <h3 className="font-display text-xl font-semibold text-charcoal">
                  {value.title}
                </h3>
                <p className="text-sm text-charcoal-light">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-charcoal rounded-lg p-12 text-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="font-display text-5xl font-bold text-gold mb-2">
                5000+
              </div>
              <div className="text-cream-light/80">Happy Customers</div>
            </div>
            <div>
              <div className="font-display text-5xl font-bold text-gold mb-2">
                500+
              </div>
              <div className="text-cream-light/80">Premium Products</div>
            </div>
            <div>
              <div className="font-display text-5xl font-bold text-gold mb-2">
                50+
              </div>
              <div className="text-cream-light/80">Trusted Brands</div>
            </div>
          </div>
        </div>
      </div>

      <MainFooter />
    </div>
  );
}
