"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/supabase/client";
import { PaymentRequestManagement } from "@/components/shared/payment-request-management";
import { Loader2 } from "lucide-react";

export default function RequestsPage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        setLoading(false);
    }

    if (loading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-serif text-3xl font-bold text-[#1A1A1A]">Payment Requests</h1>
                <p className="text-[#6B6B6B]">Manage and approve payment requests from your clients</p>
            </div>

            <PaymentRequestManagement salesmanId={user?.id} />
        </div>
    );
}
