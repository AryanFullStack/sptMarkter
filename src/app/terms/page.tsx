import { MainNav } from "@/components/main-nav";
import { MainFooter } from "@/components/main-footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-cream">
      <MainNav />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-5xl font-bold text-charcoal mb-8">
            Terms & Conditions
          </h1>

          <div className="bg-white rounded-lg shadow-sm p-8 lg:p-12 space-y-8">
            <section>
              <h2 className="font-display text-2xl font-bold text-charcoal mb-4">
                1. Introduction
              </h2>
              <p className="text-charcoal-light leading-relaxed">
                Welcome to Spectrum Marketers. By accessing and using our website and services, you agree to be bound by these Terms and Conditions. Please read them carefully before making any purchase.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-charcoal mb-4">
                2. Account Registration
              </h2>
              <p className="text-charcoal-light leading-relaxed mb-3">
                To access certain features and make purchases, you must create an account. You agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-charcoal-light">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-charcoal mb-4">
                3. Pricing and Payments
              </h2>
              <p className="text-charcoal-light leading-relaxed mb-3">
                Prices are displayed based on your account type (Beauty Parlor, Retailer, or Local Customer). We reserve the right to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-charcoal-light">
                <li>Modify prices without prior notice</li>
                <li>Offer promotional discounts at our discretion</li>
                <li>Verify business credentials for wholesale accounts</li>
                <li>Set credit limits for eligible business accounts</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-charcoal mb-4">
                4. Orders and Delivery
              </h2>
              <p className="text-charcoal-light leading-relaxed">
                All orders are subject to acceptance and product availability. We will notify you if any items are out of stock. Delivery times are estimates and may vary based on location and circumstances beyond our control.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-charcoal mb-4">
                5. Returns and Refunds
              </h2>
              <p className="text-charcoal-light leading-relaxed">
                We accept returns within 7 days of delivery for unopened products in original packaging. Refunds will be processed within 7-10 business days after receiving the returned items. Shipping costs are non-refundable unless the return is due to our error.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-charcoal mb-4">
                6. Product Authenticity
              </h2>
              <p className="text-charcoal-light leading-relaxed">
                We guarantee that all products sold are authentic and sourced from authorized distributors. If you receive a counterfeit product, please contact us immediately for a full refund and replacement.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-charcoal mb-4">
                7. Credit Terms (Business Accounts)
              </h2>
              <p className="text-charcoal-light leading-relaxed">
                Credit facilities are available to verified Beauty Parlors and Retailers. Credit terms include payment deadlines, interest on overdue amounts, and potential suspension of credit privileges for non-payment.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-charcoal mb-4">
                8. Limitation of Liability
              </h2>
              <p className="text-charcoal-light leading-relaxed">
                Spectrum Marketers shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or services. Our total liability is limited to the purchase price of the product in question.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-charcoal mb-4">
                9. Changes to Terms
              </h2>
              <p className="text-charcoal-light leading-relaxed">
                We reserve the right to modify these Terms and Conditions at any time. Changes will be effective immediately upon posting to the website. Continued use of our services constitutes acceptance of the modified terms.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-charcoal mb-4">
                10. Contact Information
              </h2>
              <p className="text-charcoal-light leading-relaxed">
                For questions about these Terms and Conditions, please contact us at info@spectrummarketers.com or call +92 300 1234567.
              </p>
            </section>
          </div>

          <p className="text-center text-charcoal-light mt-8">
            Last updated: January 2024
          </p>
        </div>
      </div>

      <MainFooter />
    </div>
  );
}
