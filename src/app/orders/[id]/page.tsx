"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/supabase/client";
import { MainNav } from "@/components/main-nav";
import { MainFooter } from "@/components/main-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, MapPin, Truck, Package, Download, Printer } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { notFound, useSearchParams, useRouter } from "next/navigation";
import { cancelOrderAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [shippingAddress, setShippingAddress] = useState<any>(null);
  const supabase = createClient();
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get("success") === "true";
  const { toast } = useToast();
  const router = useRouter();

  const handleCancelOrder = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;

    setLoading(true);
    const result = await cancelOrderAction(params.id);

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      setLoading(false);
    } else {
      toast({ title: "Order Cancelled", description: "Your order has been cancelled successfully." });
      setOrder({ ...order, status: 'cancelled' }); // Optimistic update
      router.refresh(); // Refresh server data
      setLoading(false);
    }
  };

  useEffect(() => {
    async function fetchOrder() {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          items:order_items(*, product:products(name, images))
        `)
        .eq("id", params.id)
        .single();

      if (error || !data) {
        notFound();
      }

      setOrder(data);

      if (data.shipping_address_id) {
        const { data: address } = await supabase
          .from("addresses")
          .select("*")
          .eq("id", data.shipping_address_id)
          .single();
        setShippingAddress(address);
      }

      setLoading(false);
    }

    fetchOrder();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCF9]">
        <MainNav />
        <div className="container mx-auto px-4 py-16 text-center">
          <p>Loading order details...</p>
        </div>
        <MainFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF9]">
      <MainNav />

      <div className="container mx-auto px-4 py-8">
        {isSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 mb-8 text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
            <p className="text-gray-600 mb-4">
              Thank you for your order. We've received your request and will begin processing it right away.
            </p>
            <p className="font-mono text-sm text-gray-500">Order #{order.id}</p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
          {/* Order Details */}
          <div className="flex-1 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Order Items</h2>
                <Badge className="bg-[#D4AF37]">{order.items.length} Items</Badge>
              </div>

              <div className="space-y-4">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex gap-4 py-4 border-b last:border-0">
                    <div className="relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
                      <Image
                        src={item.product?.images?.[0] || "/placeholder.jpg"}
                        alt={item.product?.name || "Product"}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.product?.name || "Unknown Product"}</h3>
                      <p className="text-gray-600 text-sm">Qty: {item.quantity}</p>
                      <p className="text-[#D4AF37] font-bold mt-1">
                        Rs. {item.price.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">Rs. {(item.quantity * item.price).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tracking Steps */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-6">Order Status</h2>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                <div className="space-y-8 relative">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white z-10">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold">Order Placed</p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${order.status !== 'pending' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                      }`}>
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <p className={`font-semibold ${order.status === 'pending' ? 'text-gray-500' : ''}`}>
                        Processing
                      </p>
                      <p className="text-sm text-gray-500">We're packing your order</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${order.status === 'shipped' || order.status === 'delivered' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                      }`}>
                      <Truck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className={`font-semibold ${['shipped', 'delivered'].includes(order.status) ? '' : 'text-gray-500'}`}>
                        Shipped
                      </p>
                      <p className="text-sm text-gray-500">On the way to you</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 space-y-6">
            {/* Payment Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-bold mb-4">Payment Summary</h3>
              <div className="space-y-2 text-sm border-b pb-4 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>Rs. {order.total_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>Rs. {order.shipping_cost?.toLocaleString() || "0"}</span>
                </div>
              </div>

              <div className="flex justify-between font-bold text-lg mb-2">
                <span>Total</span>
                <span>Rs. {order.total_amount.toLocaleString()}</span>
              </div>

              {order.pending_amount > 0 && (
                <div className="mt-4 p-3 bg-orange-50 rounded border border-orange-100">
                  <div className="flex justify-between text-green-700 text-sm mb-1">
                    <span>Paid</span>
                    <span>Rs. {order.paid_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-orange-700 font-bold">
                    <span>Pending</span>
                    <span>Rs. {order.pending_amount.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Shipping Address */}
            {shippingAddress && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-bold mb-4">Shipping Address</h3>
                <div className="text-sm text-gray-600">
                  <p className="font-semibold text-gray-900 mb-1">{shippingAddress.name}</p>
                  <p>{shippingAddress.address_line1}</p>
                  {shippingAddress.address_line2 && <p>{shippingAddress.address_line2}</p>}
                  <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postal_code}</p>
                  <p className="mt-2">{shippingAddress.phone}</p>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Button className="w-full bg-[#1A1A1A] hover:bg-[#333333]" asChild>
                <Link href="/store">Continue Shopping</Link>
              </Button>
              <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50" asChild>
                <Link href={`/orders/${params.id}/invoice`} target="_blank">
                  <Printer className="mr-2 h-4 w-4" />
                  View Invoice
                </Link>
              </Button>
              {order.status === "pending" && (
                <Button
                  variant="destructive"
                  className="w-full mt-2"
                  onClick={handleCancelOrder}
                >
                  Cancel Order
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <MainFooter />
    </div>
  );
}
