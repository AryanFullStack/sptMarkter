"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/supabase/client";
import { ProfileForm } from "@/components/dashboards/profile-form";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase
                .from("users")
                .select("*")
                .eq("id", user.id)
                .single();

            if (profile) {
                setUser({ ...user, ...profile });
            }
        }
        setLoading(false);
    }

    if (loading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-serif text-3xl font-bold text-[#1A1A1A]">Profile Settings</h1>
                <p className="text-[#6B6B6B]">Manage your personal information and account settings</p>
            </div>

            <div className="max-w-2xl">
                {user && (
                    <ProfileForm
                        user={user}
                        initialData={{
                            full_name: user?.full_name || "",
                            email: user?.email || "",
                            phone: user?.phone || "",
                            role: user?.role || "salesman",
                        }}
                    />
                )}
            </div>
        </div>
    );
}
