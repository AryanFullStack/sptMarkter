"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, Column } from "@/components/shared/data-table";
import { ExportButton } from "@/components/shared/export-button";
import { CreateSubAdminModal } from "@/components/admin/create-subadmin-modal";
import { UserCog, Plus, Shield, Activity } from "lucide-react";
import { formatDate } from "@/utils/export-utils";

export default function SubAdminManagementPage() {
  const [subAdmins, setSubAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadSubAdmins();
  }, []);

  async function loadSubAdmins() {
    setLoading(true);
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("role", "sub_admin")
      .order("created_at", { ascending: false });

    setSubAdmins(data || []);
    setLoading(false);
  }

  const columns: Column<any>[] = [
    {
      key: "full_name",
      header: "Name",
      sortable: true,
      render: (user) => (
        <div>
          <p className="font-medium text-[#1A1A1A]">{user.full_name || "N/A"}</p>
          <p className="text-sm text-[#6B6B6B]">{user.email}</p>
        </div>
      ),
    },
    {
      key: "created_at",
      header: "Created",
      sortable: true,
      render: (user) => formatDate(user.created_at),
    },
    {
      key: "status",
      header: "Status",
      render: (user) =>
        user.is_active !== false ? (
          <Badge className="bg-[#2D5F3F] text-white">Active</Badge>
        ) : (
          <Badge variant="outline">Inactive</Badge>
        ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (user) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Shield className="h-4 w-4 mr-1" />
            Permissions
          </Button>
          <Button size="sm" variant="outline">
            <Activity className="h-4 w-4 mr-1" />
            Activity
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-serif text-4xl font-semibold text-[#1A1A1A]">
            Sub-Admin Management
          </h1>
          <p className="text-[#6B6B6B] mt-2">
            Manage sub-admin users and their permissions
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton data={subAdmins} filename="sub-admins-export" />
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Sub-Admin
          </Button>
        </div>
      </div>

      {/* Stats Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-[#6B6B6B]">
            Total Sub-Admins
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-[#D4AF37]" />
            <span className="text-2xl font-bold text-[#1A1A1A]">
              {subAdmins.length}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Sub-Admins Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-12 text-[#6B6B6B]">Loading...</div>
          ) : (
            <DataTable
              data={subAdmins}
              columns={columns}
              searchable
              searchPlaceholder="Search sub-admins..."
              emptyMessage="No sub-admins found"
            />
          )}
        </CardContent>
      </Card>

      {showCreateModal && (
        <CreateSubAdminModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadSubAdmins();
          }}
        />
      )}
    </div>
  );
}
