"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "./logo";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  Heart,
  Package,
  LogOut,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { ThemeSwitcher } from "./theme-switcher";

export function MainNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-charcoal/10 bg-cream/95 backdrop-blur supports-[backdrop-filter]:bg-cream/80">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Logo />

          {/* Desktop Search */}
          <div className="hidden flex-1 max-w-xl mx-8 lg:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-charcoal-light" />
              <Input
                type="search"
                placeholder="Search for products, brands..."
                className="pl-10 bg-white border-charcoal/20 focus:border-gold"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            <Link
              href="/store"
              className="text-sm font-medium text-charcoal hover:text-gold transition-colors"
            >
              Store
            </Link>
            <Link
              href="/brands"
              className="text-sm font-medium text-charcoal hover:text-gold transition-colors"
            >
              Brands
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-charcoal hover:text-gold transition-colors"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium text-charcoal hover:text-gold transition-colors"
            >
              Contact
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            
            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-gold/10"
            >
              <Heart className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-gold/10"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gold text-white text-xs flex items-center justify-center font-medium">
                0
              </span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-gold/10">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/sign-in" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Sign In
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/sign-up" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Sign Up
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer">
                    <Package className="mr-2 h-4 w-4" />
                    My Orders
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer">
                    <Heart className="mr-2 h-4 w-4" />
                    Wishlist
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="pb-4 lg:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-charcoal-light" />
            <Input
              type="search"
              placeholder="Search products..."
              className="pl-10 bg-white border-charcoal/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-charcoal/10 bg-cream">
          <nav className="container mx-auto px-4 py-6 flex flex-col gap-4">
            <Link
              href="/store"
              className="text-base font-medium text-charcoal hover:text-gold transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Store
            </Link>
            <Link
              href="/brands"
              className="text-base font-medium text-charcoal hover:text-gold transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Brands
            </Link>
            <Link
              href="/about"
              className="text-base font-medium text-charcoal hover:text-gold transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-base font-medium text-charcoal hover:text-gold transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
