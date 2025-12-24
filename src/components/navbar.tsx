"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { User, ShoppingCart, LogOut, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (authUser) {
      setUser(authUser);

      // Fetch user role from database
      const { data: userData } = await supabase
        .from("users")
        .select("role, full_name")
        .eq("id", authUser.id)
        .single();

      if (userData) {
        setUserRole(userData.role);
      }
    }

    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const getDashboardLink = () => {
    if (!userRole) return "/dashboard";
    if (userRole === "admin" || userRole === "sub_admin") return "/admin";
    return "/dashboard";
  };

  const getRoleBadgeColor = () => {
    switch (userRole) {
      case "admin":
        return "bg-[#D4AF37] text-white";
      case "sub_admin":
        return "bg-[#C77D2E] text-white";
      case "retailer":
        return "bg-[#2D5F3F] text-white";
      case "beauty_parlor":
        return "bg-[#8B3A3A] text-white";
      default:
        return "bg-[#6B6B6B] text-white";
    }
  };

  return (
    <nav className="border-b border-[#E8E8E8] bg-white sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#D4AF37] to-[#C19B2E] rounded-lg" />
            <span className="font-serif text-xl font-semibold text-[#1A1A1A]">
              Spectrum Marketers
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/store"
              className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
            >
              Store
            </Link>
            <Link
              href="/about"
              className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
            >
              Contact
            </Link>
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="w-20 h-8 bg-[#F7F5F2] animate-pulse rounded" />
            ) : user ? (
              <>
                {/* Cart Icon (for customers) */}
                {userRole === "customer" && (
                  <Link href="/cart">
                    <Button variant="ghost" size="icon">
                      <ShoppingCart className="h-5 w-5" />
                    </Button>
                  </Link>
                )}

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <User className="h-4 w-4" />
                      <span className="hidden md:inline">Account</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{user.email}</span>
                        {userRole && (
                          <Badge
                            className={`w-fit text-xs ${getRoleBadgeColor()}`}
                          >
                            {userRole.replace("_", " ").toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={getDashboardLink()} className="cursor-pointer">
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-[#8B3A3A] cursor-pointer"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              // Show Sign In / Sign Up when not logged in
              <div className="flex items-center gap-2">
                <Link href="/sign-in">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/sign-up">
                  <Button className="bg-[#D4AF37] hover:bg-[#C19B2E] text-white">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
