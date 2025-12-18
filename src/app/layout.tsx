import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TempoInit } from "@/components/tempo-init";
import { ThemeProvider } from "@/components/theme-provider";
import { CartProvider } from "@/context/cart-context";
import { WishlistProvider } from "@/context/wishlist-context";
import { AddressProvider } from "@/context/address-context";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Spectrum Marketers - Premium Beauty Ecommerce",
  description: "Premium B2B2C beauty products ecommerce platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <CartProvider>
            <WishlistProvider>
              <AddressProvider>
                {children}
                <Toaster />
              </AddressProvider>
            </WishlistProvider>
          </CartProvider>
        </ThemeProvider>
        <TempoInit />
      </body>
    </html>
  );
}
