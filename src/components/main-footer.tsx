import Link from "next/link";
import { Logo } from "./logo";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

export function MainFooter() {
  return (
    <footer className="bg-charcoal text-cream">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="text-cream">
              <Logo className="text-cream" />
            </div>
            <p className="text-sm text-cream-light/80 leading-relaxed">
              Premium beauty products supplier serving beauty parlors, retailers, and customers across Pakistan.
            </p>
            <div className="flex gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-cream-light/10 flex items-center justify-center hover:bg-gold transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-cream-light/10 flex items-center justify-center hover:bg-gold transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-cream-light/10 flex items-center justify-center hover:bg-gold transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/store" className="text-sm text-cream-light/80 hover:text-gold transition-colors">
                  Shop All Products
                </Link>
              </li>
              <li>
                <Link href="/brands" className="text-sm text-cream-light/80 hover:text-gold transition-colors">
                  Our Brands
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-cream-light/80 hover:text-gold transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-cream-light/80 hover:text-gold transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-sm text-cream-light/80 hover:text-gold transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="font-display text-lg font-semibold mb-4">Customer Service</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/dashboard" className="text-sm text-cream-light/80 hover:text-gold transition-colors">
                  My Account
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-sm text-cream-light/80 hover:text-gold transition-colors">
                  Track Order
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-cream-light/80 hover:text-gold transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/delivery" className="text-sm text-cream-light/80 hover:text-gold transition-colors">
                  Delivery Policy
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-cream-light/80 hover:text-gold transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div>
            <h3 className="font-display text-lg font-semibold mb-4">Get In Touch</h3>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2 text-sm text-cream-light/80">
                <Phone className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>+92 300 1234567</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-cream-light/80">
                <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>info@spectrummarketers.com</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-cream-light/80">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Karachi, Pakistan</span>
              </li>
            </ul>
            
            <div>
              <p className="text-sm font-medium mb-2">Subscribe to Newsletter</p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Your email"
                  className="bg-cream-light/10 border-cream-light/20 text-cream placeholder:text-cream-light/50"
                />
                <Button className="bg-gold hover:bg-gold-dark text-white">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-cream-light/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-cream-light/60">
              © {new Date().getFullYear()} Spectrum Marketers. All rights reserved.
            </p>
            <div className="flex gap-6">
              <img src="/payment-visa.svg" alt="Visa" className="h-6 opacity-60" />
              <img src="/payment-mastercard.svg" alt="Mastercard" className="h-6 opacity-60" />
              <img src="/payment-bank.svg" alt="Bank Transfer" className="h-6 opacity-60" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
