import { Package, CreditCard, TrendingUp, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export function RetailerDashboard({ user }: { user: any }) {
  const creditLimit = user.credit_limit || 0;
  const creditUsed = user.credit_used || 0;
  const creditAvailable = creditLimit - creditUsed;
  const creditUtilization = creditLimit > 0 ? (creditUsed / creditLimit) * 100 : 0;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="font-display text-4xl font-bold text-charcoal">
            Retailer Dashboard
          </h1>
          <Badge className="bg-gold text-white">Wholesale Pricing</Badge>
        </div>
        <p className="text-charcoal-light">
          Welcome back, {user.full_name || user.name}
        </p>
      </div>

      {/* Credit Summary */}
      <Card className="border-gold/30 bg-gradient-to-br from-gold/5 to-transparent">
        <CardHeader>
          <CardTitle className="font-display text-2xl flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-gold" />
            Credit Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-charcoal-light mb-1">Credit Limit</p>
              <p className="text-3xl font-bold text-charcoal">
                Rs. {creditLimit.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-charcoal-light mb-1">Used</p>
              <p className="text-3xl font-bold text-warning">
                Rs. {creditUsed.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-charcoal-light mb-1">Available</p>
              <p className="text-3xl font-bold text-success">
                Rs. {creditAvailable.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Credit Utilization Bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-charcoal-light">Credit Utilization</span>
              <span className="font-semibold text-charcoal">
                {creditUtilization.toFixed(1)}%
              </span>
            </div>
            <div className="h-3 bg-cream-light rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gold to-warning transition-all"
                style={{ width: `${Math.min(creditUtilization, 100)}%` }}
              />
            </div>
          </div>

          {creditUtilization > 80 && (
            <div className="flex items-start gap-2 p-4 bg-warning/10 border border-warning/30 rounded-lg">
              <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-charcoal mb-1">
                  High Credit Utilization
                </p>
                <p className="text-charcoal-light">
                  You're using {creditUtilization.toFixed(0)}% of your credit limit.
                  Consider making a payment soon.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-charcoal-light">All time orders</p>
            <Button asChild variant="link" className="px-0 text-gold mt-2">
              <Link href="/dashboard/orders">View orders</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. 0</div>
            <p className="text-xs text-charcoal-light">Outstanding balance</p>
            <Button asChild variant="link" className="px-0 text-gold mt-2">
              <Link href="/dashboard/payments">View payments</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. 0</div>
            <p className="text-xs text-charcoal-light">Lifetime value</p>
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
              <Link href="/store">Browse Products</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
