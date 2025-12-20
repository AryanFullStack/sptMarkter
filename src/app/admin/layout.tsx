"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/supabase/client";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    Package,
    ShoppingCart,
    DollarSign,
    BarChart3,
    FileText,
    Warehouse,
    UserCog,
    Menu,
    X,
    Bell,
    ChevronRight,
    TrendingUp,
    ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import UserProfile from "@/components/user-profile";

const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Payments", href: "/admin/payments", icon: DollarSign },
    { name: "Approvals", href: "/admin/approvals", icon: ShieldCheck },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Salesmen", href: "/admin/salesmen", icon: BarChart3 },
    { name: "Inventory", href: "/admin/inventory", icon: Warehouse },
    { name: "Products", href: "/admin/products", icon: Package },
    { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
    { name: "Audit Logs", href: "/admin/audit-logs", icon: FileText },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const supabase = createClient();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        checkAdmin();
    }, []);

    async function checkAdmin() {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
            router.push("/sign-in");
            return;
        }

        const { data: userData } = await supabase
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single();

        if (userData?.role !== "admin" && userData?.role !== "sub_admin") {
            router.push("/dashboard");
            return;
        }

        setIsAdmin(true);
        setLoading(false);
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDFCF9] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                    <p className="text-[#6B6B6B] font-medium animate-pulse">Initializing Secure Panel...</p>
                </div>
            </div>
        );
    }

    if (!isAdmin) return null;

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
                                <p className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">
                                    Administrative Hub
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
                            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                            return (
                                <Link key={item.name} href={item.href}>
                                    <Button
                                        variant="ghost"
                                        className={cn(
                                            "w-full justify-start gap-3 h-12 transition-all duration-200",
                                            isActive
                                                ? "bg-[#F7F5F2] text-[#1A1A1A] font-semibold border-r-4 border-r-[#D4AF37] rounded-r-none"
                                                : "text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F7F5F2]/50"
                                        )}
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <Icon className={cn("h-5 w-5", isActive ? "text-[#D4AF37]" : "text-[#A0A0A0]")} />
                                        {item.name}
                                        {isActive && <ChevronRight className="h-4 w-4 ml-auto text-[#D4AF37]" />}
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
                                    {navigation.find(n => n.href === pathname)?.name || "Management"}
                                </h2>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 lg:gap-4">
                            <div className="hidden sm:flex flex-col items-end mr-2">
                                <p className="text-xs font-bold text-[#1A1A1A]">Authority System</p>
                                <p className="text-[10px] text-green-500 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                    Secure Connection
                                </p>
                            </div>
                            <Button variant="ghost" size="icon" className="relative text-[#6B6B6B] hover:text-[#D4AF37]">
                                <Bell className="h-5 w-5" />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Page View */}
                <main className="flex-1 p-4 lg:p-8">
                    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </main>

                {/* Mobile Bottom Nav */}
                <div className="lg:hidden sticky bottom-0 z-40 bg-white border-t border-[#E8E8E8] flex justify-around p-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    {navigation.slice(0, 5).map(item => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.name} href={item.href} className="flex flex-col items-center gap-1 px-3 py-1">
                                <Icon className={cn("h-5 w-5", isActive ? "text-[#D4AF37]" : "text-[#6B6B6B]")} />
                                <span className={cn("text-[10px] font-medium", isActive ? "text-[#D4AF37]" : "text-[#6B6B6B]")}>{item.name.split(' ')[0]}</span>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}

