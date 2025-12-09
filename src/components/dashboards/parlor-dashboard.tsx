import { Package, CreditCard, Calendar, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export function ParlorDashboard({ user }: { user: any }) {
  const creditLimit = user.credit_limit || 0;
  const creditUsed = user.credit_used || 0;
  const creditAvailable = creditLimit - creditUsed;
  const creditUtilization = creditLimit > 0 ? (creditUsed / creditLimit) * 100 : 0;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="font-display text-4xl font-bold text-charcoal">
            Beauty Parlor Dashboard
          </h1>
          <Badge className="bg-gold text-white">Best Pricing</Badge>
        </div>
        <p className="text-charcoal-light">
          Welcome back, {user.full_name || user.name}
        </p>
      </div>

      {/* Credit & Payment Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-gold/30 bg-gradient-to-br from-gold/5 to-transparent">
          <CardHeader>
            <CardTitle className="font-display text-xl flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-gold" />
              Credit Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-charcoal-light mb-1">Credit Limit</p>
                <p className="text-2xl font-bold text-charcoal">
                  Rs. {creditLimit.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-charcoal-light mb-1">Available</p>
                <p className="text-2xl font-bold text-success">
                  Rs. {creditAvailable.toLocaleString()}
                </p>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-charcoal-light">Used</span>
                <span className="font-semibold text-charcoal">
                  Rs. {creditUsed.toLocaleString()} ({creditUtilization.toFixed(0)}%)
                </span>
              </div>
              <div className="h-2 bg-cream-light rounded-full overflow-hidden">
                <div
                  className="h-full bg-gold transition-all"
                  style={{ width: `${Math.min(creditUtilization, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-warning/30 bg-gradient-to-br from-warning/5 to-transparent">
          <CardHeader>
            <CardTitle className="font-display text-xl flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Pending Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <p className="text-4xl font-bold text-charcoal mb-2">Rs. 0</p>
              <p className="text-sm text-charcoal-light mb-4">
                Total outstanding balance
              </p>
              <Button
                asChild
                variant="outline"
                className="border-gold text-gold hover:bg-gold hover:text-white"
              >
                <Link href="/dashboard/payments">View Invoices</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

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
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. 0</div>
            <p className="text-xs text-charcoal-light">Monthly purchases</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Due</CardTitle>
            <CreditCard className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. 0</div>
            <p className="text-xs text-charcoal-light">Next payment</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-2xl">Payment Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-charcoal-light">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No upcoming payments</p>
            <Button asChild className="mt-4 bg-gold hover:bg-gold-dark text-white">
              <Link href="/store">Place New Order</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
