import { MainNav } from "@/components/main-nav";
import { MainFooter } from "@/components/main-footer";
import CustomerDashboard from "@/components/dashboards/customer-dashboard";
import RetailerDashboard from "@/components/dashboards/retailer-dashboard";
import ParlorDashboard from "@/components/dashboards/parlor-dashboard";
import AdminDashboard from "@/components/dashboards/admin-dashboard";
import { redirect } from "next/navigation";
import { createClient } from "../../../supabase/server";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  const role = userData?.role || "customer";

  return (
    <div className="min-h-screen bg-[#FDFCF9]">
      <MainNav />
      
      <main>
        {(role === "admin" || role === "sub_admin") && <AdminDashboard />}
        {role === "beauty_parlor" && <ParlorDashboard />}
        {role === "retailer" && <RetailerDashboard />}
        {role === "customer" && <CustomerDashboard />}
      </main>

      <MainFooter />
    </div>
  );
}
