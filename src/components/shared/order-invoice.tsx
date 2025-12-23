"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import { formatCurrency, formatDate } from "@/utils/export-utils";
import { Logo } from "@/components/logo";

interface OrderInvoiceProps {
    order: any;
    onClose?: () => void;
}

export function OrderInvoice({ order, onClose }: OrderInvoiceProps) {
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        window.print();
    };

    if (!order) return null;

    const customer = order.users || order.user;
    const items = order.order_items_data || order.items || [];
    const shippingAddress = order.shipping_address;

    return (
        <div className="bg-white p-2 rounded-lg shadow-lg max-w-[80mm] mx-auto border print:shadow-none print:border-0 print:p-0">
            {/* Action Buttons - Hidden during print */}
            <div className="flex justify-between items-center mb-4 print:hidden">
                <h2 className="text-sm font-bold">80mm Invoice</h2>
                <div className="flex gap-2">
                    <Button onClick={handlePrint} variant="outline" size="sm" className="flex gap-2 print-invoice-button">
                        <Printer className="h-3 w-3" />
                        Print
                    </Button>
                    {onClose && (
                        <Button onClick={onClose} variant="ghost" size="icon" className="h-8 w-8">
                            <X className="h-3 w-3" />
                        </Button>
                    )}
                </div>
            </div>

            <div ref={printRef} className="print:m-0 print-container font-sans text-[10px] leading-tight text-black">
                {/* Header - SM Branding */}
                <div className="text-center border-b border-dashed pb-2 mb-2">
                    <div className="font-bold text-lg leading-none">SM</div>
                    <div className="font-bold text-sm">SPECTRUM MARKETERS</div>
                    <div className="text-[8px] mt-1">
                        Industrial Area, Karachi | +92 300 1234567
                    </div>
                </div>

                {/* Order Metadata */}
                <div className="mb-2 space-y-0.5">
                    <p className="font-bold">Invoice #: <span className="font-normal">{order.order_number}</span></p>
                    <p className="font-bold">Date: <span className="font-normal">{formatDate(order.created_at)}</span></p>
                    <p className="font-bold">Status: <span className="font-normal uppercase">{order.payment_status || 'Pending'}</span></p>
                </div>

                {/* Bill To & Ship To */}
                <div className="grid grid-cols-1 gap-2 mb-2 border-t border-dashed pt-2">
                    <div>
                        <h3 className="font-bold underline mb-0.5">Bill To</h3>
                        <p>{customer?.full_name || "N/A"}</p>
                        <p className="text-[9px]">{customer?.email}</p>
                    </div>
                    <div>
                        <h3 className="font-bold underline mb-0.5">Ship To</h3>
                        {shippingAddress && Object.keys(shippingAddress).length > 0 ? (
                            <div className="text-[9px]">
                                {shippingAddress.address_line1 ? (
                                    <>
                                        <p>{shippingAddress.address_line1}</p>
                                        {shippingAddress.address_line2 && <p>{shippingAddress.address_line2}</p>}
                                        <p>{shippingAddress.city}{shippingAddress.state ? `, ${shippingAddress.state}` : ''}</p>
                                        <p>Tel: {shippingAddress.phone}</p>
                                    </>
                                ) : (
                                    <p className="italic">Address details not fully recorded.</p>
                                )}
                            </div>
                        ) : (
                            <p className="italic">No shipping address recorded.</p>
                        )}
                    </div>
                </div>

                {/* Items Table */}
                <table className="w-full mb-2 border-t border-b border-dashed">
                    <thead>
                        <tr className="text-left">
                            <th className="py-1 font-bold">Item</th>
                            <th className="py-1 text-center font-bold">Qty</th>
                            <th className="py-1 text-right font-bold">Price</th>
                            <th className="py-1 text-right font-bold">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item: any, idx: number) => {
                            const name = item.product?.name || item.name || "Product";
                            const qty = item.quantity || 1;
                            const price = item.price || 0;
                            return (
                                <tr key={item.id || idx} className="border-t border-gray-100 align-top">
                                    <td className="py-1 pr-1">{name}</td>
                                    <td className="py-1 text-center">{qty}</td>
                                    <td className="py-1 text-right">{price}</td>
                                    <td className="py-1 text-right font-bold">{(price * qty)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* Summary */}
                <div className="flex justify-end mb-2">
                    <div className="w-full max-w-[50mm] space-y-0.5">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>Rs. {Number(order.subtotal || order.total_amount)}</span>
                        </div>
                        {order.discount_amount > 0 && (
                            <div className="flex justify-between font-bold">
                                <span>Discount</span>
                                <span>-Rs. {Number(order.discount_amount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold border-t border-double pt-1">
                            <span className="text-sm">Total</span>
                            <span className="text-sm">Rs. {Number(order.total_amount)}</span>
                        </div>
                        <div className="flex justify-between text-[9px] pt-1">
                            <span className="text-green-700">Paid</span>
                            <span>Rs. {Number(order.paid_amount || 0)}</span>
                        </div>
                        <div className="flex justify-between text-[9px]">
                            <span className="text-amber-700">Pending</span>
                            <span>Rs. {Number(order.pending_amount || (order.total_amount - (order.paid_amount || 0)))}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="pt-2 border-t border-dashed text-center text-[8px]">
                    <p>Thank you for choosing Spectrum Marketers!</p>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        size: 80mm 80mm;
                        margin: 0;
                    }

                    /* Root Reset */
                    html, body {
                        background: white !important;
                        color: black !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        overflow: visible !important;
                        height: auto !important;
                    }

                    /* Hide Everything EXCEPT the portal */
                    body > * {
                        display: none !important;
                    }

                    /* Portal path */
                    body > div[data-radix-portal],
                    body > div[data-radix-portal] > div,
                    body > div[data-radix-portal] [role="dialog"],
                    body > div:has(> [role="dialog"]),
                    [role="dialog"] {
                        display: block !important;
                        visibility: visible !important;
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 80mm !important;
                        height: auto !important;
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        transform: none !important;
                        box-shadow: none !important;
                        border: none !important;
                    }

                    /* UI Hiding */
                    .DialogOverlay, [role="dialog"] > button, .print\\:hidden, button {
                        display: none !important;
                    }

                    /* Container Optimization */
                    .print-container {
                        display: block !important;
                        width: 80mm !important;
                        padding: 2mm !important;
                        margin: 0 !important;
                        background: white !important;
                    }

                    .print-container * {
                        visibility: visible !important;
                        color: black !important;
                        background: transparent !important;
                    }

                    /* Color Enforcement */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>
        </div>
    );
}
