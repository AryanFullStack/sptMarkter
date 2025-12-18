import { MainNav } from "@/components/main-nav";
import { MainFooter } from "@/components/main-footer";
import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";

export default async function SalesmanLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/sign-in");
    }

    const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

    if (userData?.role !== "salesman") {
        redirect("/dashboard");
    }

    return (
        <div className="min-h-screen bg-[#FDFCF9] flex flex-col">
            <MainNav />
            <main className="flex-grow">
                {children}
            </main>
            <MainFooter />
        </div>
    );
}
