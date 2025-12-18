"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/supabase/client";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export default function InvoicePage({ params }: { params: { id: string } }) {
    const [order, setOrder] = useState<any>(null);
    const [shippingAddress, setShippingAddress] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchOrder() {
            const { data, error } = await supabase
                .from("orders")
                .select(`
                  *,
                  items:order_items(*)
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

    if (loading) return <div className="p-8 text-center">Loading Invoice...</div>;

    return (
        <div className="min-h-screen bg-white text-black p-8 font-serif">
            {/* Print Button (Hidden when printing) */}
            <div className="print:hidden mb-8 text-center">
                <Button onClick={() => window.print()} className="bg-[#D4AF37] hover:bg-[#B8941F]">
                    <Printer className="mr-2 h-4 w-4" />
                    Print Invoice
                </Button>
            </div>

            {/* Invoice Container */}
            <div className="max-w-3xl mx-auto border print:border-0 p-8">
                {/* Header */}
                <div className="flex justify-between items-start mb-12 border-b pb-8">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">INVOICE</h1>
                        <p className="text-gray-600">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-bold">Spectrum Marketers</h2>
                        <p>123 Luxury Lane</p>
                        <p>Islamabad, Pakistan</p>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-8 mb-12">
                    <div>
                        <h3 className="font-bold text-gray-500 text-sm uppercase mb-2">Billed To</h3>
                        <div className="text-sm">
                            <p className="font-bold">{shippingAddress?.name || "Guest Details"}</p>
                            <p>{shippingAddress?.phone}</p>
                            <p>{order.user_email}</p>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-500 text-sm uppercase mb-2">Shipped To</h3>
                        <div className="text-sm">
                            <p>{shippingAddress?.address_line1}</p>
                            {shippingAddress?.address_line2 && <p>{shippingAddress.address_line2}</p>}
                            <p>{shippingAddress?.city}, {shippingAddress?.state} {shippingAddress?.postal_code}</p>
                        </div>
                    </div>
                </div>

                {/* Order Meta */}
                <div className="grid grid-cols-3 gap-4 mb-12 bg-gray-50 p-4 rounded print:bg-transparent print:p-0">
                    <div>
                        <p className="text-xs text-gray-500 uppercase">Payment Method</p>
                        <p className="font-semibold capitalize">{order.payment_method?.replace("_", " ")}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase">Order Date</p>
                        <p className="font-semibold">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase">Total Amount</p>
                        <p className="font-semibold">Rs. {order.total_amount.toLocaleString()}</p>
                    </div>
                </div>

                {/* Items Table */}
                <table className="w-full mb-12">
                    <thead>
                        <tr className="border-b-2 border-black">
                            <th className="text-left py-2">Item Description</th>
                            <th className="text-right py-2">Quantity</th>
                            <th className="text-right py-2">Price</th>
                            <th className="text-right py-2">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items.map((item: any) => (
                            <tr key={item.id} className="border-b border-gray-200">
                                <td className="py-4">
                                    <p className="font-bold">{item.product_name}</p>
                                </td>
                                <td className="text-right py-4">{item.quantity}</td>
                                <td className="text-right py-4">Rs. {item.price.toLocaleString()}</td>
                                <td className="text-right py-4">Rs. {item.subtotal.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end mb-12">
                    <div className="w-64 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Subtotal</span>
                            <span>Rs. {(order.total_amount - (order.shipping_cost || 0)).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Shipping</span>
                            <span>Rs. {order.shipping_cost?.toLocaleString() || "0"}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                            <span>Total</span>
                            <span>Rs. {order.total_amount.toLocaleString()}</span>
                        </div>
                        {order.pending_amount > 0 && (
                            <div className="flex justify-between text-orange-600 text-sm">
                                <span>Pending Balance</span>
                                <span>Rs. {order.pending_amount.toLocaleString()}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center text-sm text-gray-500 border-t pt-8">
                    <p>Thank you for your business!</p>
                    <p>For support, contact us at support@spectrummarketers.com</p>
                </div>
            </div>
        </div>
    );
}
