import { Package, Heart, MapPin, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function CustomerDashboard({ user }: { user: any }) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl font-bold text-charcoal mb-2">
          Welcome back, {user.full_name || user.name}!
        </h1>
        <p className="text-charcoal-light">Manage your orders and account</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Orders</CardTitle>
            <Package className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-charcoal-light">Total orders</p>
            <Button asChild variant="link" className="px-0 text-gold mt-2">
              <Link href="/dashboard/orders">View all orders</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wishlist</CardTitle>
            <Heart className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-charcoal-light">Saved items</p>
            <Button asChild variant="link" className="px-0 text-gold mt-2">
              <Link href="/dashboard/wishlist">View wishlist</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Addresses</CardTitle>
            <MapPin className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-charcoal-light">Saved addresses</p>
            <Button asChild variant="link" className="px-0 text-gold mt-2">
              <Link href="/dashboard/addresses">Manage addresses</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            <Bell className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-charcoal-light">Unread messages</p>
            <Button asChild variant="link" className="px-0 text-gold mt-2">
              <Link href="/dashboard/notifications">View all</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-2xl">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-charcoal-light">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No orders yet</p>
            <Button asChild className="mt-4 bg-gold hover:bg-gold-dark text-white">
              <Link href="/store">Start Shopping</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
