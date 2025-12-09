import {
  Package,
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle,
  ShoppingCart,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export function AdminDashboard({ user }: { user: any }) {
  const isSubAdmin = user.role === "sub_admin";

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="font-display text-4xl font-bold text-charcoal">
            {isSubAdmin ? "Sub-Admin" : "Admin"} Dashboard
          </h1>
          <Badge className="bg-charcoal text-white">
            {isSubAdmin ? "Sub-Admin" : "Administrator"}
          </Badge>
        </div>
        <p className="text-charcoal-light">
          Welcome back, {user.full_name || user.name}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow border-gold/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. 0</div>
            <p className="text-xs text-charcoal-light">+0% from last month</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-charcoal-light">All time orders</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Credits</CardTitle>
            <AlertCircle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. 0</div>
            <p className="text-xs text-charcoal-light">Outstanding payments</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <Package className="h-4 w-4 text-error" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-charcoal-light">Need reordering</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-2xl">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {!isSubAdmin && (
              <>
                <Button
                  asChild
                  variant="outline"
                  className="h-24 flex-col gap-2 border-gold/30 hover:bg-gold/10"
                >
                  <Link href="/admin/products">
                    <Package className="h-6 w-6 text-gold" />
                    <span>Manage Products</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-24 flex-col gap-2 border-gold/30 hover:bg-gold/10"
                >
                  <Link href="/admin/users">
                    <Users className="h-6 w-6 text-gold" />
                    <span>Manage Users</span>
                  </Link>
                </Button>
              </>
            )}
            <Button
              asChild
              variant="outline"
              className="h-24 flex-col gap-2 border-gold/30 hover:bg-gold/10"
            >
              <Link href="/admin/orders">
                <ShoppingCart className="h-6 w-6 text-gold" />
                <span>View Orders</span>
              </Link>
            </Button>
            {!isSubAdmin && (
              <Button
                asChild
                variant="outline"
                className="h-24 flex-col gap-2 border-gold/30 hover:bg-gold/10"
              >
                <Link href="/admin/reports">
                  <TrendingUp className="h-6 w-6 text-gold" />
                  <span>View Reports</span>
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-2xl">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-charcoal-light">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recent orders</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
