"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/supabase/client";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Activity,
    Menu,
    X,
    Bell,
    ChevronRight,
    Search,
    User,
    Settings,
    CreditCard,
    Home,
    ShoppingBag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import UserProfile from "@/components/user-profile";

interface DashboardLayoutProps {
    children: React.ReactNode;
    role: "retailer" | "beauty_parlor" | "customer" | "local_customer";
}

export default function DashboardLayout({
    children,
    role
}: DashboardLayoutProps) {
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [currentHash, setCurrentHash] = useState("");
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        setLoading(false);
        const handleHashChange = () => {
            setCurrentHash(window.location.hash);
        };
        window.addEventListener("hashchange", handleHashChange);
        setCurrentHash(window.location.hash);
        return () => window.removeEventListener("hashchange", handleHashChange);
    }, []);

    const navigation = [
        { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
        { name: "Orders & Payments", href: "/dashboard#orders", icon: CreditCard },
        { name: "Profile & Settings", href: "/dashboard#profile", icon: Settings },
        { name: "Back to Shop", href: "/store", icon: ShoppingBag },
    ];

    const getRoleBranding = () => {
        switch (role) {
            case "beauty_parlor":
                return {
                    name: "Beauty Professional",
                    color: "text-purple-600",
                    accent: "bg-purple-600",
                    border: "border-purple-600",
                    spinner: "border-purple-600"
                };
            case "retailer":
                return {
                    name: "Wholesale Partner",
                    color: "text-[#D4AF37]",
                    accent: "bg-[#D4AF37]",
                    border: "border-[#D4AF37]",
                    spinner: "border-[#D4AF37]"
                };
            default:
                return {
                    name: "Customer Portal",
                    color: "text-[#2D5F3F]",
                    accent: "bg-[#2D5F3F]",
                    border: "border-[#2D5F3F]",
                    spinner: "border-[#2D5F3F]"
                };
        }
    };

    const branding = getRoleBranding();

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDFCF9] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className={cn("w-12 h-12 border-4 border-t-transparent rounded-full animate-spin", branding.spinner)} />
                    <p className="text-[#6B6B6B] font-medium animate-pulse">Syncing your workspace...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFCF9]">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-all"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-[#E8E8E8] shadow-xl transform transition-transform duration-300 ease-in-out lg:shadow-none",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Header/Logo */}
                    <div className="p-6 border-b border-[#E8E8E8]">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="font-serif text-2xl font-bold text-[#1A1A1A]">
                                    Spectrum
                                </h1>
                                <p className={cn("text-[10px] uppercase tracking-widest font-bold", branding.color)}>
                                    {branding.name}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="lg:hidden"
                                onClick={() => setSidebarOpen(false)}
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto p-4 space-y-1 mt-4">
                        {navigation.map((item) => {
                            const Icon = item.icon;

                            // Robust active check for fragments
                            let isActive = false;
                            if (item.href.includes('#')) {
                                const [base, hash] = item.href.split('#');
                                isActive = pathname === base && currentHash === `#${hash}` || (currentHash === "" && hash === "overview" && pathname === base);
                            } else {
                                isActive = pathname === item.href && currentHash === "";
                            }

                            const handleNavClick = (e: React.MouseEvent, href: string) => {
                                setSidebarOpen(false);

                                if (href.includes('#')) {
                                    const [base, hash] = href.split('#');
                                    if (pathname === base) {
                                        // If same page, manual hash update to trigger event
                                        e.preventDefault();
                                        window.location.hash = hash;
                                        setCurrentHash(`#${hash}`);
                                    }
                                }
                            };

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={(e) => handleNavClick(e, item.href)}
                                >
                                    <Button
                                        variant="ghost"
                                        className={cn(
                                            "w-full justify-start gap-3 h-12 transition-all duration-200",
                                            isActive
                                                ? cn("bg-[#F7F5F2] text-[#1A1A1A] font-semibold border-r-4 rounded-r-none", branding.border)
                                                : "text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F7F5F2]/50"
                                        )}
                                    >
                                        <Icon className={cn("h-5 w-5", isActive ? branding.color : "text-[#A0A0A0]")} />
                                        {item.name}
                                        {isActive && <ChevronRight className={cn("h-4 w-4 ml-auto", branding.color)} />}
                                    </Button>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer / User Profile */}
                    <div className="p-4 border-t border-[#E8E8E8] bg-[#FDFCF9]/50">
                        <UserProfile />
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="lg:pl-64 flex flex-col min-h-screen">
                {/* Topbar */}
                <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-[#E8E8E8] px-4 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="lg:hidden hover:bg-[#F7F5F2]"
                                onClick={() => setSidebarOpen(true)}
                            >
                                <Menu className="h-6 w-6" />
                            </Button>
                            <div className="hidden lg:block">
                                <h2 className="text-sm font-medium text-[#6B6B6B]">
                                    Your Dashboard
                                </h2>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 lg:gap-4">
                            <div className="hidden sm:flex flex-col items-end mr-2">
                                <p className="text-xs font-bold text-[#1A1A1A]">{branding.name}</p>
                                <p className={cn("text-[10px] flex items-center gap-1", branding.color)}>
                                    <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", branding.accent)} />
                                    Active Session
                                </p>
                            </div>
                            <Button variant="ghost" size="icon" className="relative text-[#6B6B6B] hover:text-[#1A1A1A]">
                                <Bell className="h-5 w-5" />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full border-2 border-white" />
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Page View */}
                <main className="flex-1">
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </main>

                {/* Mobile Bottom Nav */}
                <div className="lg:hidden sticky bottom-0 z-40 bg-white border-t border-[#E8E8E8] flex justify-around p-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    {navigation.map(item => {
                        const Icon = item.icon;

                        let isActive = false;
                        if (item.href.includes('#')) {
                            const [base, hash] = item.href.split('#');
                            isActive = pathname === base && currentHash === `#${hash}` || (currentHash === "" && hash === "overview" && pathname === base);
                        } else {
                            isActive = pathname === item.href && currentHash === "";
                        }

                        const handleMobileNavClick = (e: React.MouseEvent, href: string) => {
                            if (href.includes('#')) {
                                const [base, hash] = href.split('#');
                                if (pathname === base) {
                                    e.preventDefault();
                                    window.location.hash = hash;
                                    setCurrentHash(`#${hash}`);
                                }
                            }
                        };

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={(e) => handleMobileNavClick(e, item.href)}
                                className="flex flex-col items-center gap-1 px-3 py-1"
                            >
                                <Icon className={cn("h-5 w-5", isActive ? branding.color : "text-[#6B6B6B]")} />
                                <span className={cn("text-[10px] font-medium", isActive ? branding.color : "text-[#6B6B6B]")}>{item.name.split(' ')[0]}</span>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}
