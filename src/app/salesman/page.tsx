import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import { getSalesmanUnifiedDashboard } from "@/app/actions/salesman-actions";
import SalesmanDashboardView from "./salesman-dashboard-view";

// Revalidate occasionally, but we rely on revalidatePath for actions
export const revalidate = 60; // 1 minute background revalidation as fallback

export default async function SalesmanOverview() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    // Verify salesman role
    const { data: userData } = await supabase
        .from('users')
        .select('role, id')
        .eq('id', user.id)
        .single();

    if (!userData || userData.role !== 'salesman') {
        redirect("/dashboard"); // Or unauthorized page
    }

    const dashboardData = await getSalesmanUnifiedDashboard(user.id);

    return <SalesmanDashboardView initialData={dashboardData} userData={userData} />;
}
