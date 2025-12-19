"use server";

import { createClient } from "@/supabase/server";
import { recordPartialPayment } from "./salesman-actions";
import { revalidatePath } from "next/cache";

export async function getRetailerDashboardData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // 1. Fetch User Profile with pending limit
  const { data: userProfile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  // 2. Fetch Orders with Items (Just IDs first to avoid join errors)
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        id,
        quantity,
        price,
        product_id
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (ordersError) {
    console.error("Error fetching orders:", ordersError);
    throw new Error("Failed to fetch orders");
  }

  // 2.1 Fetch Products and Brands separately for the items in these orders
  // Collect all product IDs
  const productIds = new Set<string>();
  orders.forEach((o: any) => {
    o.order_items.forEach((i: any) => {
       if (i.product_id) productIds.add(i.product_id);
    });
  });

  let productsMap = new Map();
  if (productIds.size > 0) {
      const { data: products } = await supabase
        .from('products')
        .select(`
            id, 
            title, 
            brand_id, 
            brands (id, name)
        `)
        .in('id', Array.from(productIds));
    
      if (products) {
          products.forEach((p: any) => productsMap.set(p.id, p));
      }
  }

  // 3. Aggregate Data
  const totalOrders = orders.length;
  // totalSpent might be calculated from total_amount of orders where payment_status is 'paid' or just all confirmed orders?
  // Let's assume all orders roughly.
  const totalSpent = orders.reduce((sum: number, o: any) => sum + Number(o.total_amount), 0);
  const pendingPayments = orders
    .filter((o: any) => o.payment_status !== 'paid' && o.status !== 'cancelled')
    .reduce((sum: number, o: any) => sum + Number(o.pending_amount), 0);

  // Brand Summary Aggregation
  const brandMap = new Map<string, { name: string, total: number, count: number }>();

  orders.forEach((order: any) => {
    if (order.status === 'cancelled') return; // Skip cancelled

    order.order_items.forEach((item: any) => {
      // Manual Join
      const product = productsMap.get(item.product_id);
      const brand = product?.brands;
      const brandName = brand?.name || "Unbranded";
      const brandId = brand?.id || "unbranded";
      
      const current = brandMap.get(brandId) || { name: brandName, total: 0, count: 0 };
      current.total += Number(item.subtotal || (item.quantity * item.price));
      current.count += item.quantity;
      brandMap.set(brandId, current);
    });
  });

  const brandSummary = Array.from(brandMap.values()).sort((a, b) => b.total - a.total);

  // Calculate pending limit info
  const pendingAmountLimit = Number(userProfile?.pending_amount_limit || 0);

  return {
    stats: {
      totalOrders,
      totalSpent,
      pendingPayments,
      pendingAmountLimit,
    },
    recentOrders: orders.slice(0, 5),
    brandSummary,
    pendingInfo: {
      currentPending: pendingPayments,
      limit: pendingAmountLimit,
      remaining: Math.max(0, pendingAmountLimit - pendingPayments),
    },
    userProfile
  };
}
/**
 * Request a payment (creates a pending payment record)
 */
export async function requestPayment(
  orderId: string,
  amount: number,
  paymentMethod: string,
  notes: string
) {
  const res = await recordPartialPayment(orderId, amount, paymentMethod, notes, "pending");
  
  if (res.success) {
    revalidatePath("/dashboard");
    revalidatePath("/orders");
  }
  
  return res;
}
