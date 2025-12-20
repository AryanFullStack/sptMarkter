import CustomerDashboard from "@/components/dashboards/customer-dashboard";
import RetailerDashboard from "@/components/dashboards/retailer-dashboard";
import ParlorDashboard from "@/components/dashboards/parlor-dashboard";
import SalesmanDashboard from "@/components/dashboards/salesman-dashboard";
import { redirect } from "next/navigation";
import { createClient } from "../../../supabase/server";
import DashboardLayout from "@/components/dashboards/dashboard-layout";

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

  // Redirect admins and sub-admins to their respective dashboards
  if (role === "admin") {
    return redirect("/admin");
  }
  if (role === "sub_admin") {
    return redirect("/sub-admin");
  }
  if (role === "salesman") {
    return redirect("/salesman");
  }

  return (
    <DashboardLayout role={role as any}>
      {role === "beauty_parlor" && <ParlorDashboard />}
      {role === "retailer" && <RetailerDashboard />}
      {(role === "customer" || role === "local_customer") && <CustomerDashboard />}
    </DashboardLayout>
  );
}
