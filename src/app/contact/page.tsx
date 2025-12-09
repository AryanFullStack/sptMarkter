"use client";

import { MainNav } from "@/components/main-nav";
import { MainFooter } from "@/components/main-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import { useState } from "react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log(formData);
  };

  return (
    <div className="min-h-screen bg-cream">
      <MainNav />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="font-display text-5xl font-bold text-charcoal mb-4">
            Get In Touch
          </h1>
          <p className="text-xl text-charcoal-light">
            Have questions? We'd love to hear from you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Form */}
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <h2 className="font-display text-2xl font-bold text-charcoal mb-6">
              Send us a Message
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+92 300 1234567"
                />
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  placeholder="Tell us how we can help you..."
                  rows={5}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gold hover:bg-gold-dark text-white"
              >
                Send Message
              </Button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            <div className="bg-white rounded-lg p-8 shadow-sm">
              <h2 className="font-display text-2xl font-bold text-charcoal mb-6">
                Contact Information
              </h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-6 w-6 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-charcoal mb-1">Phone</h3>
                    <p className="text-charcoal-light">+92 300 1234567</p>
                    <p className="text-charcoal-light">+92 321 7654321</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-6 w-6 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-charcoal mb-1">Email</h3>
                    <p className="text-charcoal-light">
                      info@spectrummarketers.com
                    </p>
                    <p className="text-charcoal-light">
                      support@spectrummarketers.com
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-charcoal mb-1">
                      Address
                    </h3>
                    <p className="text-charcoal-light">
                      123 Beauty Street, Saddar
                      <br />
                      Karachi, Pakistan
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* WhatsApp CTA */}
            <div className="bg-green-50 rounded-lg p-8 border border-green-200">
              <div className="flex items-center gap-3 mb-4">
                <MessageCircle className="h-8 w-8 text-green-600" />
                <h3 className="font-display text-xl font-bold text-charcoal">
                  Chat on WhatsApp
                </h3>
              </div>
              <p className="text-charcoal-light mb-4">
                Get instant support and quick responses to your queries.
              </p>
              <Button
                asChild
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <a
                  href="https://wa.me/923001234567"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Start WhatsApp Chat
                </a>
              </Button>
            </div>

            {/* Business Hours */}
            <div className="bg-white rounded-lg p-8 shadow-sm">
              <h3 className="font-display text-xl font-bold text-charcoal mb-4">
                Business Hours
              </h3>
              <div className="space-y-2 text-charcoal-light">
                <div className="flex justify-between">
                  <span>Monday - Friday</span>
                  <span className="font-medium">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday</span>
                  <span className="font-medium">10:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span className="font-medium">Closed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MainFooter />
    </div>
  );
}
