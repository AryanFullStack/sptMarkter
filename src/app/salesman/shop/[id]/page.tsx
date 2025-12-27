import { getClientFinancialStatus, getSalesmanShopLedger, getAssignedBrands } from "@/app/actions/salesman-actions";
import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";
import ShopDetailsView from "./shop-details-view";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Add specific revalidation to ensure fresh data
export const dynamic = 'force-dynamic';

export default async function ShopDetailPage({ params }: { params: { id: string } }) {
    const shopId = params.id;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth/login');
    }

    // Verify salesman role from users table
    const { data: userData } = await supabase
        .from('users')
        .select('role, id')
        .eq('id', user.id)
        .single();

    if (!userData || userData.role !== 'salesman') {
        redirect('/dashboard');
    }

    try {
        // Parallel data fetching on the server
        const [clientStatus, ledgerStatus, brandsRes, addrRes] = await Promise.all([
            getClientFinancialStatus(shopId, user.id),
            getSalesmanShopLedger(user.id, shopId),
            getAssignedBrands(user.id),
            supabase.from("addresses").select("*").eq("user_id", shopId).order("is_default", { ascending: false })
        ]);

        if (!clientStatus || clientStatus.error) {
            return (
                <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
                    <p>Shop not found or access denied.</p>
                    <Link href="/salesman/shops">
                        <Button variant="outline" className="mt-4">Back to Search</Button>
                    </Link>
                </div>
            );
        }

        return (
            <ShopDetailsView
                shopId={shopId}
                shopData={clientStatus}
                ledgerData={ledgerStatus}
                assignedBrands={brandsRes.brands || []}
                addresses={addrRes.data || []}
                salesmanId={userData.id}
            />
        );

    } catch (e) {
        console.error("Error loading shop data:", e);
        return (
            <div className="container mx-auto px-4 py-8 text-center text-red-500">
                <p>An unexpected error occurred while loading shop data.</p>
                <Link href="/salesman/shops">
                    <Button variant="outline" className="mt-4">Back to Search</Button>
                </Link>
            </div>
        );
    }
}
