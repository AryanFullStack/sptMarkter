"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import UserProfile from "@/components/user-profile";

const navigation = [
    { name: "Dashboard", href: "/sub-admin", icon: LayoutDashboard },
    { name: "Orders", href: "/sub-admin/orders", icon: ShoppingCart },
    { name: "Stock", href: "/sub-admin/stock", icon: Package },
    { name: "Activity", href: "/sub-admin/activity", icon: Activity },
];

export default function SubAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [loading, setLoading] = useState(true);
    const [isSubAdmin, setIsSubAdmin] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        checkSubAdmin();
    }, []);

    async function checkSubAdmin() {
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

        if (userData?.role !== "sub_admin") {
            router.push("/dashboard");
            return;
        }

        setIsSubAdmin(true);
        setLoading(false);
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDFCF9] flex items-center justify-center">
                <p className="text-[#6B6B6B]">Loading...</p>
            </div>
        );
    }

    if (!isSubAdmin) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[#FDFCF9]">
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside
                className={cn(
                    "fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-[#E8E8E8] transform transition-transform duration-200 ease-in-out",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                <div className="flex flex-col h-full">
                    <div className="p-6 border-b border-[#E8E8E8]">
                        <div className="flex items-center justify-between">
                            <h1 className="font-serif text-2xl font-semibold text-[#1A1A1A]">
                                Sub-Admin
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

                    <div className="p-4 border-t border-[#E8E8E8]">
                        <UserProfile />
                    </div>
                </div>
            </aside>

            <div className="lg:pl-64">
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

                <main className="p-6">{children}</main>
            </div>
        </div>
    );
}
