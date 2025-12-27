import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TempoInit } from "@/components/tempo-init";
import { ThemeProvider } from "@/components/theme-provider";
import { CartProvider } from "@/context/cart-context";
import { WishlistProvider } from "@/context/wishlist-context";
import { AddressProvider } from "@/context/address-context";
import { Toaster } from "@/components/ui/toaster";
import { RealtimeProvider } from "@/components/providers/realtime-provider";
import { NotificationProvider } from "@/context/notification-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Spectrum Marketers - Premium Beauty Ecommerce",
  description: "Premium B2B2C beauty products ecommerce platform",
};

import { AuthProvider } from "@/context/auth-context";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Server-side auth check to prevent navbar flicker
  const { createClient } = await import("@/supabase/server"); // Dynamic import to avoid build issues? Or standard import
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  let userRole = null;

  if (user) {
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    userRole = userData?.role || null;
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider initialUser={user} initialUserRole={userRole}>
            <RealtimeProvider>
              <NotificationProvider>
                <CartProvider>
                  <WishlistProvider>
                    <AddressProvider>
                      {children}
                      <Toaster />
                    </AddressProvider>
                  </WishlistProvider>
                </CartProvider>
              </NotificationProvider>
            </RealtimeProvider>
          </AuthProvider>
        </ThemeProvider>
        <TempoInit />
      </body>
    </html>
  );
}
