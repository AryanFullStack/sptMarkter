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
import { Search, Eye, DollarSign, User } from "lucide-react";

export default function OrdersManagementPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentNotes, setPaymentNotes] = useState("");
  const supabase = createClient();
  const router = useRouter();

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
    const { data } = await supabase
      .from("orders")
      .select(`
        *,
        users (
          email,
          full_name,
          role
        ),
        addresses (
          full_name,
          phone,
          address_line1,
          city,
          state
        )
      `)
      .order("created_at", { ascending: false });

    if (data) {
      setOrders(data);
      setFilteredOrders(data);
    }
    setLoading(false);
  }

  function filterOrders() {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.users?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    loadOrders();
  }

  async function recordPayment() {
    if (!selectedOrder) return;

    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from("payments").insert({
      order_id: selectedOrder.id,
      amount: paymentAmount,
      payment_method: paymentMethod,
      recorded_by: user?.id,
      notes: paymentNotes,
    });

    const newPaidAmount = Number(selectedOrder.paid_amount) + paymentAmount;
    await supabase
      .from("orders")
      .update({ paid_amount: newPaidAmount })
      .eq("id", selectedOrder.id);

    setIsPaymentOpen(false);
    setPaymentAmount(0);
    setPaymentNotes("");
    loadOrders();
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
                    <TableHead>Date</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Pending</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono">{order.order_number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.users?.full_name || "N/A"}</p>
                          <p className="text-sm text-[#6B6B6B]">{order.users?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>₹{order.total_amount?.toFixed(2)}</TableCell>
                      <TableCell>₹{order.paid_amount?.toFixed(2)}</TableCell>
                      <TableCell className="text-[#C77D2E]">
                        ₹{(order.total_amount - order.paid_amount).toFixed(2)}
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
                              setIsDetailOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {order.total_amount > order.paid_amount && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-[#D4AF37]"
                              onClick={() => {
                                setSelectedOrder(order);
                                setPaymentAmount(order.total_amount - order.paid_amount);
                                setIsPaymentOpen(true);
                              }}
                            >
                              <DollarSign className="h-4 w-4" />
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
                    <Label>Status</Label>
                    <Select
                      value={selectedOrder.status}
                      onValueChange={(value) => updateOrderStatus(selectedOrder.id, value)}
                    >
                      <SelectTrigger>
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
                  </div>
                </div>
                <div>
                  <Label>Customer</Label>
                  <p>{selectedOrder.users?.full_name || "N/A"}</p>
                  <p className="text-sm text-[#6B6B6B]">{selectedOrder.users?.email}</p>
                </div>
                <div>
                  <Label>Shipping Address</Label>
                  {selectedOrder.addresses && (
                    <div className="text-sm">
                      <p>{selectedOrder.addresses.full_name}</p>
                      <p>{selectedOrder.addresses.address_line1}</p>
                      <p>{selectedOrder.addresses.city}, {selectedOrder.addresses.state}</p>
                      <p>{selectedOrder.addresses.phone}</p>
                    </div>
                  )}
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>Total Amount</Label>
                    <p className="text-lg font-semibold">₹{selectedOrder.total_amount?.toFixed(2)}</p>
                  </div>
                  <div>
                    <Label>Paid Amount</Label>
                    <p className="text-lg font-semibold text-[#2D5F3F]">₹{selectedOrder.paid_amount?.toFixed(2)}</p>
                  </div>
                  <div>
                    <Label>Pending Amount</Label>
                    <p className="text-lg font-semibold text-[#C77D2E]">
                      ₹{(selectedOrder.total_amount - selectedOrder.paid_amount).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">Record Payment</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div>
                  <Label>Order Number</Label>
                  <p className="font-mono">{selectedOrder.order_number}</p>
                </div>
                <div>
                  <Label>Pending Amount</Label>
                  <p className="text-lg font-semibold text-[#C77D2E]">
                    ₹{(selectedOrder.total_amount - selectedOrder.paid_amount).toFixed(2)}
                  </p>
                </div>
                <div>
                  <Label>Payment Amount</Label>
                  <Input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    max={selectedOrder.total_amount - selectedOrder.paid_amount}
                  />
                </div>
                <div>
                  <Label>Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Add any notes about this payment..."
                  />
                </div>
                <Button
                  onClick={recordPayment}
                  className="w-full bg-[#D4AF37] hover:bg-[#C19B2E] text-white"
                >
                  Record Payment
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
