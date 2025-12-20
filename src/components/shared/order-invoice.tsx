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
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg max-w-4xl mx-auto border print:shadow-none print:border-0 print:p-0">
            {/* Action Buttons - Hidden during print */}
            <div className="flex justify-between items-center mb-8 print:hidden">
                <h2 className="text-xl font-bold">Inovice Preview</h2>
                <div className="flex gap-2">
                    <Button onClick={handlePrint} variant="outline" className="flex gap-2 print-invoice-button">
                        <Printer className="h-4 w-4" />
                        Print Invoice
                    </Button>
                    {onClose && (
                        <Button onClick={onClose} variant="ghost" size="icon">
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            <div ref={printRef} className="print:m-0 print-container">
                {/* Header */}
                <div className="flex justify-between border-b pb-4 mb-4">
                    <div>
                        <Logo className="mb-4" />
                        <address className="not-italic text-sm text-gray-600 mt-2">
                            <p>House # 12, Street 34</p>
                            <p>Industrial Area, Karachi, Pakistan</p>
                            <p>Contact: +92 300 1234567</p>
                            <p>Email: info@spectrummarketers.com</p>
                        </address>
                    </div>
                    <div className="text-right">
                        <h1 className="text-3xl font-bold text-gray-800 uppercase mb-2">Invoice</h1>
                        <p className="text-gray-600 font-mono">Invoice #: {order.order_number}</p>
                        <p className="text-gray-600">Date: {formatDate(order.created_at)}</p>
                        <div className="mt-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                {order.payment_status || 'Pending'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Client & Shipping */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">Bill To</h3>
                        <p className="font-bold text-gray-800">{customer?.full_name || "N/A"}</p>
                        <p className="text-gray-600">{customer?.email}</p>
                        <p className="text-gray-600">{customer?.phone}</p>
                    </div>
                    <div>
                        <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">Ship To</h3>
                        {shippingAddress ? (
                            <div className="text-gray-600 text-sm">
                                <p className="font-bold text-gray-800">{shippingAddress.full_name}</p>
                                <p>{shippingAddress.address_line1}</p>
                                {shippingAddress.address_line2 && <p>{shippingAddress.address_line2}</p>}
                                <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postal_code}</p>
                                <p>Tel: {shippingAddress.phone}</p>
                            </div>
                        ) : (
                            <p className="text-gray-400 italic">No shipping address provided.</p>
                        )}
                    </div>
                </div>

                {/* Items Table */}
                <table className="w-full mb-4 border-collapse">
                    <thead>
                        <tr className="border-b-2 border-gray-100">
                            <th className="text-left py-4 px-2 text-xs font-bold uppercase text-gray-400">Description</th>
                            <th className="text-center py-4 px-2 text-xs font-bold uppercase text-gray-400">Qty</th>
                            <th className="text-right py-4 px-2 text-xs font-bold uppercase text-gray-400">Unit Price</th>
                            <th className="text-right py-4 px-2 text-xs font-bold uppercase text-gray-400">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item: any, idx: number) => {
                            const name = item.product?.name || item.name || "Product";
                            const qty = item.quantity || 1;
                            const price = item.price || 0;
                            return (
                                <tr key={item.id || idx} className="border-b border-gray-50">
                                    <td className="py-2 px-2 text-sm text-gray-700 font-medium">{name}</td>
                                    <td className="py-2 px-2 text-center text-sm text-gray-600">{qty}</td>
                                    <td className="py-2 px-2 text-right text-sm text-gray-600">Rs. {price.toLocaleString()}</td>
                                    <td className="py-2 px-2 text-right text-sm text-gray-800 font-bold">Rs. {(price * qty).toLocaleString()}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* Summary */}
                <div className="flex justify-end">
                    <div className="w-full max-w-xs space-y-3">
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="font-medium">Rs. {Number(order.subtotal || order.total_amount).toLocaleString()}</span>
                        </div>
                        {order.discount_amount > 0 && (
                            <div className="flex justify-between py-2 border-b border-gray-100 text-red-600 font-medium">
                                <span>Discount</span>
                                <span>- Rs. {Number(order.discount_amount).toLocaleString()}</span>
                            </div>
                        )}
                        <div className="flex justify-between py-2 border-b-2 border-gray-200">
                            <span className="text-lg font-bold text-gray-800">Total</span>
                            <span className="text-xl font-bold text-gray-900">Rs. {Number(order.total_amount).toLocaleString()}</span>
                        </div>

                        <div className="pt-4 space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="text-green-600 font-medium">Paid</span>
                                <span className="font-bold">Rs. {Number(order.paid_amount || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-amber-600 font-medium">Pending</span>
                                <span className="font-bold">Rs. {Number(order.pending_amount || (order.total_amount - (order.paid_amount || 0))).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-4 border-t text-center text-gray-400 text-[10px]">
                    <p className="mb-1">Thank you for your business with Spectrum Marketers!</p>
                    <p>This is a computer-generated invoice and does not require a physical signature.</p>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    /* Header/Footer removal */
                    @page {
                        size: A4;
                        margin: 1cm;
                    }

                    /* 1. Global Reset */
                    html, body {
                        background: white !important;
                        color: black !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        overflow: visible !important;
                        height: auto !important;
                    }

                    /* 2. Hide Everything at Root level EXCEPT the portal */
                    body > * {
                        display: none !important;
                    }

                    /* 3. Re-enable the Portal and Dialog containing the invoice */
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
                        width: 100% !important;
                        height: auto !important;
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        transform: none !important; /* Neutralize Shadcn centering */
                        box-shadow: none !important;
                        border: none !important;
                        opacity: 1 !important;
                    }

                    /* 4. Sub-hide UI elements inside the container */
                    .DialogOverlay,
                    [role="dialog"] > button,
                    .print\\:hidden,
                    button {
                        display: none !important;
                    }

                    /* 5. Invoice Specific Styling */
                    .print-container {
                        display: block !important;
                        width: 100% !important;
                        max-width: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        background: white !important;
                    }

                    .print-container * {
                        visibility: visible !important;
                        color: black !important;
                        background-color: transparent !important;
                    }

                    /* 6. Precision Table Handling for A4 */
                    table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                        page-break-inside: auto;
                    }

                    tr {
                        page-break-inside: avoid;
                        page-break-after: auto;
                    }

                    thead {
                        display: table-header-group;
                    }

                    /* 7. Force rendering colors/images */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    /* 8. Text fixes */
                    h1, h2, h3, h4, p, span, td, th {
                        color: black !important;
                    }
                }
            `}</style>
        </div>
    );
}
