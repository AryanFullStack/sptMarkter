import { MainNav } from "@/components/main-nav";
import { MainFooter } from "@/components/main-footer";
import { Package, Truck, MapPin, Clock } from "lucide-react";

export default function DeliveryPage() {
  return (
    <div className="min-h-screen bg-cream">
      <MainNav />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-5xl font-bold text-charcoal mb-8">
            Delivery Policy
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {[
              {
                icon: <Package className="h-6 w-6" />,
                title: "Order Processing",
                description: "1-2 business days",
              },
              {
                icon: <Truck className="h-6 w-6" />,
                title: "Delivery Time",
                description: "3-7 business days",
              },
              {
                icon: <MapPin className="h-6 w-6" />,
                title: "Coverage",
                description: "All Pakistan",
              },
              {
                icon: <Clock className="h-6 w-6" />,
                title: "Tracking",
                description: "Real-time updates",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-6 shadow-sm flex items-start gap-4"
              >
                <div className="h-12 w-12 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                  <div className="text-gold">{item.icon}</div>
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-charcoal mb-1">
                    {item.title}
                  </h3>
                  <p className="text-charcoal-light">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg shadow-sm p-8 lg:p-12 space-y-8">
            <section>
              <h2 className="font-display text-2xl font-bold text-charcoal mb-4">
                Delivery Areas
              </h2>
              <p className="text-charcoal-light leading-relaxed mb-4">
                We deliver to all major cities and towns across Pakistan, including:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  "Karachi",
                  "Lahore",
                  "Islamabad",
                  "Rawalpindi",
                  "Faisalabad",
                  "Multan",
                  "Peshawar",
                  "Quetta",
                  "Sialkot",
                  "Gujranwala",
                  "Hyderabad",
                  "Sukkur",
                ].map((city) => (
                  <div
                    key={city}
                    className="flex items-center gap-2 text-charcoal-light"
                  >
                    <div className="h-2 w-2 rounded-full bg-gold" />
                    {city}
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-charcoal mb-4">
                Delivery Charges
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-4 bg-cream-light rounded-lg">
                  <span className="text-charcoal-light">Orders below Rs. 5,000</span>
                  <span className="font-semibold text-charcoal">Rs. 200</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gold/10 rounded-lg">
                  <span className="text-charcoal-light">Orders above Rs. 5,000</span>
                  <span className="font-semibold text-gold">FREE</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-cream-light rounded-lg">
                  <span className="text-charcoal-light">Remote areas</span>
                  <span className="font-semibold text-charcoal">Rs. 300</span>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-charcoal mb-4">
                Order Processing
              </h2>
              <p className="text-charcoal-light leading-relaxed mb-4">
                Orders are processed within 1-2 business days after payment confirmation. You will receive:
              </p>
              <ul className="list-disc list-inside space-y-2 text-charcoal-light">
                <li>Order confirmation email immediately after purchase</li>
                <li>Shipping confirmation with tracking number when dispatched</li>
                <li>SMS updates on delivery status</li>
                <li>Delivery notification when order is out for delivery</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-charcoal mb-4">
                Delivery Timeline
              </h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-gold text-white flex items-center justify-center flex-shrink-0 font-semibold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-charcoal mb-1">Major Cities</h4>
                    <p className="text-charcoal-light text-sm">3-4 business days</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-gold text-white flex items-center justify-center flex-shrink-0 font-semibold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-charcoal mb-1">Other Cities</h4>
                    <p className="text-charcoal-light text-sm">5-6 business days</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-gold text-white flex items-center justify-center flex-shrink-0 font-semibold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-charcoal mb-1">Remote Areas</h4>
                    <p className="text-charcoal-light text-sm">7-10 business days</p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-charcoal mb-4">
                Tracking Your Order
              </h2>
              <p className="text-charcoal-light leading-relaxed">
                Once your order is shipped, you'll receive a tracking number via email and SMS. You can track your order in real-time by:
              </p>
              <ul className="list-disc list-inside space-y-2 text-charcoal-light mt-4">
                <li>Logging into your account and visiting the Orders section</li>
                <li>Using the tracking link provided in the shipping confirmation email</li>
                <li>Contacting our customer support team</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-charcoal mb-4">
                Delivery Issues
              </h2>
              <p className="text-charcoal-light leading-relaxed mb-4">
                If you experience any issues with your delivery:
              </p>
              <ul className="list-disc list-inside space-y-2 text-charcoal-light">
                <li>Contact us within 24 hours of delivery for damaged items</li>
                <li>Ensure someone is available to receive the package</li>
                <li>Provide accurate delivery address and contact information</li>
                <li>We'll arrange re-delivery or replacement for any issues</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-charcoal mb-4">
                Contact Us
              </h2>
              <p className="text-charcoal-light leading-relaxed">
                For delivery-related queries, contact our support team at support@spectrummarketers.com or call +92 300 1234567 during business hours (Monday-Saturday, 9 AM - 6 PM).
              </p>
            </section>
          </div>
        </div>
      </div>

      <MainFooter />
    </div>
  );
}
