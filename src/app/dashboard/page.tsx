import { MainNav } from "@/components/main-nav";
import { MainFooter } from "@/components/main-footer";
import { CustomerDashboard } from "@/components/dashboards/customer-dashboard";
import { RetailerDashboard } from "@/components/dashboards/retailer-dashboard";
import { ParlorDashboard } from "@/components/dashboards/parlor-dashboard";
import { AdminDashboard } from "@/components/dashboards/admin-dashboard";
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

  const role = userData?.role || "local_customer";

  return (
    <div className="min-h-screen bg-cream">
      <MainNav />
      
      <main className="container mx-auto px-4 py-8">
        {role === "admin" && <AdminDashboard user={userData} />}
        {role === "sub_admin" && <AdminDashboard user={userData} />}
        {role === "beauty_parlor" && <ParlorDashboard user={userData} />}
        {role === "retailer" && <RetailerDashboard user={userData} />}
        {role === "local_customer" && <CustomerDashboard user={userData} />}
      </main>

      <MainFooter />
    </div>
  );
}
