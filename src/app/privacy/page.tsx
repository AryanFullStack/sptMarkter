import { MainNav } from "@/components/main-nav";
import { MainFooter } from "@/components/main-footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-cream">
      <MainNav />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-5xl font-bold text-charcoal mb-8">
            Privacy Policy
          </h1>

          <div className="bg-white rounded-lg shadow-sm p-8 lg:p-12 space-y-8">
            <section>
              <h2 className="font-display text-2xl font-bold text-charcoal mb-4">
                1. Information We Collect
              </h2>
              <p className="text-charcoal-light leading-relaxed mb-3">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside space-y-2 text-charcoal-light">
                <li>Name, email address, phone number, and shipping address</li>
                <li>Business information for wholesale accounts</li>
                <li>Payment information (processed securely through payment providers)</li>
                <li>Order history and preferences</li>
                <li>Communications with our customer service team</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-charcoal mb-4">
                2. How We Use Your Information
              </h2>
              <p className="text-charcoal-light leading-relaxed mb-3">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-charcoal-light">
                <li>Process and fulfill your orders</li>
                <li>Communicate with you about your orders and account</li>
                <li>Provide customer support</li>
                <li>Send promotional emails (with your consent)</li>
                <li>Improve our products and services</li>
                <li>Detect and prevent fraud</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-charcoal mb-4">
                3. Information Sharing
              </h2>
              <p className="text-charcoal-light leading-relaxed">
                We do not sell or rent your personal information to third parties. We may share your information with:
              </p>
              <ul className="list-disc list-inside space-y-2 text-charcoal-light mt-3">
                <li>Service providers who help us operate our business</li>
                <li>Shipping companies to deliver your orders</li>
                <li>Payment processors to handle transactions</li>
                <li>Law enforcement when required by law</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-charcoal mb-4">
                4. Data Security
              </h2>
              <p className="text-charcoal-light leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-charcoal mb-4">
                5. Cookies and Tracking
              </h2>
              <p className="text-charcoal-light leading-relaxed">
                We use cookies and similar tracking technologies to improve your browsing experience, analyze site traffic, and personalize content. You can control cookies through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-charcoal mb-4">
                6. Your Rights
              </h2>
              <p className="text-charcoal-light leading-relaxed mb-3">
                You have the right to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-charcoal-light">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your information</li>
                <li>Opt-out of marketing communications</li>
                <li>Object to processing of your information</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-charcoal mb-4">
                7. Children's Privacy
              </h2>
              <p className="text-charcoal-light leading-relaxed">
                Our services are not intended for children under 18 years of age. We do not knowingly collect personal information from children.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-charcoal mb-4">
                8. Changes to This Policy
              </h2>
              <p className="text-charcoal-light leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last Updated" date.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-charcoal mb-4">
                9. Contact Us
              </h2>
              <p className="text-charcoal-light leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-cream-light rounded-lg">
                <p className="text-charcoal-light">
                  <strong className="text-charcoal">Email:</strong> privacy@spectrummarketers.com
                </p>
                <p className="text-charcoal-light mt-2">
                  <strong className="text-charcoal">Phone:</strong> +92 300 1234567
                </p>
                <p className="text-charcoal-light mt-2">
                  <strong className="text-charcoal">Address:</strong> 123 Beauty Street, Saddar, Karachi, Pakistan
                </p>
              </div>
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
