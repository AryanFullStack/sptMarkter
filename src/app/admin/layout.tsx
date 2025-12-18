"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
    Tag,
    Warehouse,
    UserCog,
    Menu,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import UserProfile from "@/components/user-profile";

const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Sub-Admins", href: "/admin/sub-admin", icon: UserCog },
    { name: "Products", href: "/admin/products", icon: Package },
    { name: "Inventory", href: "/admin/inventory", icon: Warehouse },
    { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
    { name: "Payments", href: "/admin/payments", icon: DollarSign },
    { name: "Coupons", href: "/admin/coupons", icon: Tag },
    { name: "Reports", href: "/admin/reports", icon: BarChart3 },
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
                <p className="text-[#6B6B6B]">Loading...</p>
            </div>
        );
    }

    if (!isAdmin) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[#FDFCF9]">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-[#E8E8E8] transform transition-transform duration-200 ease-in-out",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="p-6 border-b border-[#E8E8E8]">
                        <div className="flex items-center justify-between">
                            <h1 className="font-serif text-2xl font-semibold text-[#1A1A1A]">
                                Admin Panel
                            </h1>
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
                    <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link key={item.name} href={item.href}>
                                    <Button
                                        variant="ghost"
                                        className={cn(
                                            "w-full justify-start gap-3 hover:bg-[#F7F5F2]",
                                            "text-[#6B6B6B] hover:text-[#1A1A1A]"
                                        )}
                                    >
                                        <Icon className="h-5 w-5" />
                                        {item.name}
                                    </Button>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Profile */}
                    <div className="p-4 border-t border-[#E8E8E8]">
                        <UserProfile />
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Top bar */}
                <header className="sticky top-0 z-30 bg-white border-b border-[#E8E8E8] px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="lg:hidden"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu className="h-6 w-6" />
                        </Button>
                        <div className="flex-1 lg:flex-none" />
                        <div className="lg:hidden">
                            <UserProfile />
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-6">{children}</main>
            </div>
        </div>
    );
}
