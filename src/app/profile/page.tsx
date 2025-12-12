"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MainNav from "@/components/main-nav";
import MainFooter from "@/components/main-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/supabase/client";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState({
    full_name: "",
    phone: ""
  });
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      router.push("/sign-in");
      return;
    }

    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();

    const { data: userAddresses } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", authUser.id);

    if (userData) {
      setUser(userData);
      setProfile({
        full_name: userData.full_name || "",
        phone: userData.phone || ""
      });
    }

    if (userAddresses) setAddresses(userAddresses);
    setLoading(false);
  }

  async function handleUpdateProfile() {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    await supabase
      .from("users")
      .update(profile)
      .eq("id", authUser.id);

    alert("Profile updated successfully!");
    loadProfile();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCF9]">
        <MainNav />
        <div className="container mx-auto px-4 py-16">
          <p className="text-center text-[#6B6B6B]">Loading...</p>
        </div>
        <MainFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF9]">
      <MainNav />
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="font-serif text-4xl font-semibold text-[#1A1A1A] mb-8">My Profile</h1>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-2xl">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-[#F7F5F2]"
                />
              </div>
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </div>
              <div>
                <Label>Role</Label>
                <Input
                  value={user?.role || ""}
                  disabled
                  className="bg-[#F7F5F2] capitalize"
                />
              </div>
              <Button
                onClick={handleUpdateProfile}
                className="bg-[#D4AF37] hover:bg-[#C19B2E] text-white"
              >
                Update Profile
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-2xl">Saved Addresses</CardTitle>
            </CardHeader>
            <CardContent>
              {addresses.length === 0 ? (
                <p className="text-[#6B6B6B]">No saved addresses</p>
              ) : (
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <div key={address.id} className="p-4 border border-[#F7F5F2] rounded">
                      <p className="font-semibold text-[#1A1A1A]">{address.full_name}</p>
                      <p className="text-[#6B6B6B] text-sm">{address.address_line1}</p>
                      <p className="text-[#6B6B6B] text-sm">{address.city}, {address.state} {address.postal_code}</p>
                      <p className="text-[#6B6B6B] text-sm">{address.phone}</p>
                      {address.is_default && (
                        <span className="text-[#D4AF37] text-xs">Default</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <MainFooter />
    </div>
  );
}
