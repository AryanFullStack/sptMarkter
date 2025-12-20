"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/supabase/client";
import { getAssignedBrands } from "@/app/actions/salesman-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tag, Loader2 } from "lucide-react";

export default function BrandsPage() {
    const [brands, setBrands] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const res = await getAssignedBrands(user.id);
            if (res.brands) setBrands(res.brands);
        }
        setLoading(false);
    }

    if (loading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-serif text-3xl font-bold text-[#1A1A1A]">My Assigned Brands</h1>
                <p className="text-[#6B6B6B]">Brands you are authorized to represent and sell</p>
            </div>

            <Card>
                <CardContent className="pt-6">
                    {!brands || brands.length === 0 ? (
                        <p className="text-center py-8 text-[#6B6B6B]">No brands assigned to you yet.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {brands.map((b: any) => (
                                <div key={b.id} className="flex items-center gap-4 p-4 border rounded-lg bg-white hover:shadow-md transition-shadow">
                                    {b.brands?.logo_url ? (
                                        <img src={b.brands.logo_url} alt={b.brands.name} className="w-12 h-12 object-contain" />
                                    ) : (
                                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                            <Tag className="h-6 w-6 text-gray-400" />
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="font-semibold text-[#1A1A1A]">{b.brands?.name}</h3>
                                        <Badge variant="secondary" className="text-xs mt-1 bg-[#F7F5F2]">Active</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
