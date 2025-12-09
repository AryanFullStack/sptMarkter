import { MainNav } from "@/components/main-nav";
import { MainFooter } from "@/components/main-footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQPage() {
  const faqs = [
    {
      question: "What types of customers do you serve?",
      answer:
        "We serve three main customer types: Beauty Parlors (wholesale pricing), Retailers (discounted rates), and Local Customers (retail pricing). Each customer type gets role-specific pricing and benefits.",
    },
    {
      question: "How do I get wholesale pricing?",
      answer:
        "To access wholesale pricing, register as a Beauty Parlor or Retailer during sign-up. Our team will verify your business credentials, and once approved, you'll automatically see discounted prices on all products.",
    },
    {
      question: "Do you offer credit facilities?",
      answer:
        "Yes, we offer credit facilities to verified Beauty Parlors and Retailers. Credit limits are assigned based on your business profile and purchase history. You can make partial payments and settle the balance later.",
    },
    {
      question: "What is your delivery policy?",
      answer:
        "We deliver across Pakistan. Orders are typically processed within 1-2 business days and delivered within 3-7 business days depending on your location. Free delivery is available on orders above Rs. 5,000.",
    },
    {
      question: "Are all products authentic?",
      answer:
        "Absolutely! We only source products directly from authorized distributors and brands. Every product comes with authenticity guarantees, and we stand behind the quality of everything we sell.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept multiple payment methods including cash on delivery, bank transfers, online payments, and credit/debit cards. Business customers can also use our credit facility for partial payments.",
    },
    {
      question: "Can I return or exchange products?",
      answer:
        "Yes, we have a 7-day return policy for unopened products in original packaging. If you receive a damaged or incorrect item, please contact us within 24 hours for immediate replacement.",
    },
    {
      question: "How can I track my order?",
      answer:
        "Once your order is shipped, you'll receive a tracking number via email and SMS. You can also track your order status by logging into your account and visiting the Orders section.",
    },
    {
      question: "Do you offer bulk discounts?",
      answer:
        "Yes! Retailers and Beauty Parlors automatically receive bulk pricing. For very large orders, please contact our sales team for custom quotes and additional discounts.",
    },
    {
      question: "How do I become a registered retailer?",
      answer:
        "During registration, select 'Retailer' as your account type and provide your business details. Our team will verify your information within 24-48 hours. Once approved, you'll have access to wholesale pricing.",
    },
  ];

  return (
    <div className="min-h-screen bg-cream">
      <MainNav />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-display text-5xl font-bold text-charcoal mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-charcoal-light">
              Find answers to common questions about our products and services
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-8">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left font-display text-lg font-semibold text-charcoal hover:text-gold">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-charcoal-light leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div className="mt-12 bg-gold/10 rounded-lg p-8 text-center">
            <h2 className="font-display text-2xl font-bold text-charcoal mb-2">
              Still have questions?
            </h2>
            <p className="text-charcoal-light mb-6">
              Our support team is here to help you
            </p>
            <a
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 bg-gold hover:bg-gold-dark text-white rounded-lg transition-colors font-medium"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>

      <MainFooter />
    </div>
  );
}
