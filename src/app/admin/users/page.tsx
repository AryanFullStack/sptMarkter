"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Edit, Trash2, Eye, ShieldAlert, ShieldCheck, Mail, Phone, MapPin, ExternalLink, UserCog } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { loadAdminDashboardDataAction, updateUserRoleAction, deleteUserAction, suspendUser } from "@/app/admin/actions";

export default function UsersManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, roleFilter, users]);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await loadAdminDashboardDataAction();
      setUsers(data.allUsers || []);
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to load users", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  function filterUsers() {
    let filtered = users;
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (roleFilter !== "all") {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    setFilteredUsers(filtered);
  }

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await updateUserRoleAction(userId, newRole);
      toast({ title: "Success", description: "User role updated" });
      loadUsers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleToggleStatus = async (user: any) => {
    const isCurrentlyActive = user.is_active !== false;
    try {
      await suspendUser(user.id, isCurrentlyActive);
      toast({
        title: isCurrentlyActive ? "User Suspended" : "User Activated",
        description: `Account has been ${isCurrentlyActive ? 'suspended' : 'activated'}.`
      });
      loadUsers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-gray-900";
      case "sub_admin": return "bg-gray-600";
      case "beauty_parlor": return "bg-[#D4AF37]";
      case "retailer": return "bg-[#C77D2E]";
      case "salesman": return "bg-blue-600";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="font-serif text-4xl font-semibold text-[#1A1A1A] mb-2">User Management</h1>
        <p className="text-[#6B6B6B]">Comprehensive control over user roles, accounts, and system access</p>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="bg-[#FDFCF9] border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="font-serif text-2xl flex items-center gap-2">
              <UserCog className="h-6 w-6 text-[#D4AF37]" />
              System Users ({filteredUsers.length})
            </CardTitle>
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#6B6B6B]" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 w-full md:w-64"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-40 h-10">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="retailer">Retailer</SelectItem>
                  <SelectItem value="beauty_parlor">Beauty Parlor</SelectItem>
                  <SelectItem value="salesman">Salesman</SelectItem>
                  <SelectItem value="sub_admin">Sub Admin</SelectItem>
                  <SelectItem value="local_customer">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#FDFCF9]">
              <TableRow>
                <TableHead className="w-[300px]">User Profile</TableHead>
                <TableHead>Contact & Location</TableHead>
                <TableHead>Role Management</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 text-[#6B6B6B]">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-8 w-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
                      Loading users list...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-[#FDFCF9]/50 transition-colors">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-lg text-[#1A1A1A]">{user.full_name || "N/A"}</span>
                      <span className="text-[10px] text-[#6B6B6B] font-mono lowercase">{user.id}</span>
                      <span className="text-[10px] text-[#6B6B6B] mt-1 italic">Joined {new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1.5 grayscale-[0.5]">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3.5 w-3.5 text-[#D4AF37]" />
                        {user.email}
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-2 text-xs text-[#6B6B6B]">
                          <Phone className="h-3 w-3" />
                          {user.phone}
                        </div>
                      )}
                      {user.address && (
                        <div className="flex items-center gap-2 text-xs text-[#6B6B6B]">
                          <MapPin className="h-3 w-3" />
                          {user.address.city || "No City"}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      <Badge className={`${getRoleBadgeColor(user.role)} text-[10px] uppercase w-fit`}>
                        {user.role.replace("_", " ")}
                      </Badge>
                      <Select
                        defaultValue={user.role}
                        onValueChange={(val) => handleUpdateRole(user.id, val)}
                      >
                        <SelectTrigger className="h-7 text-[10px] border-dashed">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="local_customer">Customer</SelectItem>
                          <SelectItem value="retailer">Retailer</SelectItem>
                          <SelectItem value="beauty_parlor">Beauty Parlor</SelectItem>
                          <SelectItem value="salesman">Salesman</SelectItem>
                          <SelectItem value="sub_admin">Sub Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      {user.is_active !== false ? (
                        <Badge className="bg-[#2D5F3F] text-white text-[10px] uppercase w-fit flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" /> Active
                        </Badge>
                      ) : (
                        <Badge className="bg-[#8B3A3A] text-white text-[10px] uppercase w-fit flex items-center gap-1">
                          <ShieldAlert className="h-3 w-3" /> Suspended
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] text-muted-foreground underline p-0 justify-start"
                        onClick={() => handleToggleStatus(user)}
                      >
                        {user.is_active !== false ? "Suspend Account" : "Re-activate"}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white"
                        onClick={() => router.push(`/admin/orders?user=${user.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Activity
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-[#8B3A3A] hover:bg-red-50"
                        onClick={async () => {
                          if (confirm("Delete this user?")) {
                            await deleteUserAction(user.id);
                            loadUsers();
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
