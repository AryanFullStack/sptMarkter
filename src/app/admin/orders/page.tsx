"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/supabase/client";
import DashboardNavbar from "@/components/dashboard-navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Eye, DollarSign, User, FileText } from "lucide-react";
import { loadAdminOrdersAction, updateOrderStatus as updateOrderStatusAction } from "@/app/admin/actions";
import { useToast } from "@/hooks/use-toast";
import { OrderInvoice } from "@/components/shared/order-invoice";
import { PaymentRecordModal } from "@/components/admin/payment-record-modal";

export default function OrdersManagementPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [statusToUpdate, setStatusToUpdate] = useState("");
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentNotes, setPaymentNotes] = useState("");
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    checkAdmin();
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [searchTerm, statusFilter, orders]);

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/sign-in");
      return;
    }

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userData?.role !== "admin" && userData?.role !== "sub_admin") {
      router.push("/dashboard");
    }
  }

  async function loadOrders() {
    try {
      const data = await loadAdminOrdersAction();
      setOrders(data || []);
      setFilteredOrders(data || []);
    } catch (error) {
      console.error("Failed to load orders:", error);
    }
    setLoading(false);
  }



  function filterOrders() {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(order => {
        const user = Array.isArray(order.users) ? order.users[0] : order.users;
        return (
          order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    if (!newStatus) return;
    try {
      await updateOrderStatusAction(orderId, newStatus);

      const updated = orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
      setOrders(updated);
      // Re-apply filter? Simplified: just update filtered list too if it contains it
      setFilteredOrders((prev: any[]) => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }));
      }
      toast({ title: "Status Updated", description: `Order status changed to ${newStatus}` });
    } catch (error) {
      console.error("Update failed", error);
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  }

  async function recordPayment() {
    // This function should be implemented or removed if using PaymentRecordModal
    toast({ title: "Info", description: "Please use the payment modal to record payments" });
  }


  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-[#2D5F3F] text-white";
      case "shipped": return "bg-[#C77D2E] text-white";
      case "processing": return "bg-[#D4AF37] text-white";
      case "cancelled": return "bg-[#8B3A3A] text-white";
      default: return "bg-[#6B6B6B] text-white";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCF9]">
        <DashboardNavbar />
        <div className="container mx-auto px-4 py-16">
          <p className="text-center text-[#6B6B6B]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF9]">
      <DashboardNavbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-serif text-4xl font-semibold text-[#1A1A1A] mb-2">Order Management</h1>
          <p className="text-[#6B6B6B]">Manage all orders, payments, and deliveries</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="font-serif text-2xl">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-[#6B6B6B]" />
                <Input
                  placeholder="Search by order number or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-2xl">All Orders ({filteredOrders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Pending</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono">{order.order_number}</TableCell>
                      <TableCell>
                        {(() => {
                          const user = Array.isArray(order.users) ? order.users[0] : order.users;
                          return (
                            <div>
                              <p className="font-medium">{user?.full_name || "N/A"}</p>
                              <p className="text-sm text-[#6B6B6B]">{user?.email}</p>
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {(Array.isArray(order.users) ? order.users[0] : order.users)?.role?.replace("_", " ") || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>Rs. {order.total_amount?.toFixed(2)}</TableCell>
                      <TableCell>Rs. {order.paid_amount?.toFixed(2)}</TableCell>
                      <TableCell className="text-[#C77D2E]">
                        Rs. {(order.pending_amount || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {order.recorded_by_user ? (
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{order.recorded_by_user.full_name}</span>
                            <Badge variant="outline" className="text-[10px] w-fit capitalize bg-blue-50 text-blue-700 border-blue-100">
                              {order.recorded_by_user.role?.replace("_", " ")}
                            </Badge>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-[10px] capitalize bg-gray-50 text-gray-600 border-gray-100">
                            Customer
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedOrder(order);
                              setStatusToUpdate(order.status);
                              setIsDetailOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsInvoiceOpen(true);
                            }}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          {order.pending_amount > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-[#000000]"
                              onClick={() => {
                                setSelectedOrder(order);
                                setPaymentAmount(order.pending_amount);
                                setIsPaymentOpen(true);
                              }}
                            >
                              Collect
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">Order Details</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Order Number</Label>
                    <p className="font-mono text-lg">{selectedOrder.order_number}</p>
                  </div>

                  <div>
                    <Label className="mb-2 block">Status Update</Label>
                    <div className="flex gap-2">
                      <Select
                        value={statusToUpdate}
                        onValueChange={setStatusToUpdate}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={() => updateOrderStatus(selectedOrder.id, statusToUpdate)}>
                        Update
                      </Button>
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Customer</Label>
                  {(() => {
                    const user = Array.isArray(selectedOrder.users) ? selectedOrder.users[0] : selectedOrder.users;
                    return (
                      <>
                        <p>{user?.full_name || "N/A"}</p>
                        <p className="text-sm text-[#6B6B6B]">{user?.email}</p>
                        <Badge variant="outline" className="mt-1 capitalize">{user?.role?.replace("_", " ")}</Badge>
                      </>
                    );
                  })()}
                </div>
                <div>
                  <Label>Order Recorded By</Label>
                  {selectedOrder.recorded_by_user ? (
                    <div className="flex flex-col gap-1">
                      <p className="font-medium text-[#1A1A1A]">{selectedOrder.recorded_by_user.full_name}</p>
                      <Badge variant="secondary" className="w-fit capitalize bg-blue-50 text-blue-700 border-blue-100">
                        {selectedOrder.recorded_by_user.role?.replace("_", " ")}
                      </Badge>
                    </div>
                  ) : (
                    <Badge variant="outline" className="w-fit capitalize bg-green-50 text-green-700 border-green-100">
                      Direct Customer Order
                    </Badge>
                  )}
                </div>
                <div>
                  <Label>Shipping Address</Label>
                  {selectedOrder.shipping_address && Object.keys(selectedOrder.shipping_address).length > 0 ? (
                    <div className="text-sm">
                      {selectedOrder.shipping_address.address_line1 ? (
                        <>
                          <p>{selectedOrder.shipping_address.full_name}</p>
                          <p>{selectedOrder.shipping_address.address_line1}</p>
                          <p>{selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state}</p>
                          <p>{selectedOrder.shipping_address.phone}</p>
                        </>
                      ) : (
                        <p className="text-gray-500 italic">Address data incomplete</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No shipping address recorded</p>
                  )}
                </div>

                {/* Order Items List */}
                <div>
                  <Label className="mb-2 block">Order Items</Label>
                  <div className="space-y-3 border rounded-lg p-3 bg-gray-50 max-h-48 overflow-y-auto">
                    {(() => {
                      const displayItems = (selectedOrder.order_items_data && selectedOrder.order_items_data.length > 0)
                        ? selectedOrder.order_items_data
                        : (selectedOrder.items || []);

                      if (displayItems.length === 0) {
                        return <p className="text-gray-500 italic">No items found.</p>;
                      }
                      return displayItems.map((item: any, idx: number) => {
                        const name = item.product?.name || item.name || "Unknown Product";
                        const price = item.price || 0;
                        const qty = item.quantity || 1;
                        return (
                          <div key={item.id || idx} className="flex justify-between items-start text-sm">
                            <div className="flex gap-2">
                              <span className="font-semibold w-6 text-center">{qty}x</span>
                              <span className="text-gray-700">{name}</span>
                            </div>
                            <span className="font-medium">Rs. {(price * qty).toFixed(2)}</span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>Total Amount</Label>
                    <p className="text-lg font-semibold">Rs. {selectedOrder.total_amount?.toFixed(2)}</p>
                  </div>
                  <div>
                    <Label>Paid Amount</Label>
                    <p className="text-lg font-semibold text-[#2D5F3F]">Rs. {selectedOrder.paid_amount?.toFixed(2)}</p>
                  </div>
                  <div>
                    <Label>Pending Amount</Label>
                    <p className="text-lg font-semibold text-[#C77D2E]">
                      Rs. {(selectedOrder.total_amount - selectedOrder.paid_amount).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>



        {isPaymentOpen && selectedOrder && (
          <PaymentRecordModal
            order={selectedOrder}
            onClose={() => {
              setIsPaymentOpen(false);
              setSelectedOrder(null);
            }}
            onSuccess={() => {
              setIsPaymentOpen(false);
              setSelectedOrder(null);
              loadOrders();
            }}
          />
        )}
        <Dialog open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none">
            <OrderInvoice
              order={selectedOrder}
              onClose={() => setIsInvoiceOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
