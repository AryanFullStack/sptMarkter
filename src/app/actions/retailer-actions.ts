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

  // 2. Fetch Orders with essential fields only
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id, order_number, total_amount, paid_amount, pending_amount, payment_status, status, created_at, items")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100); // Limit to recent 100 orders for performance

  if (ordersError) {
    console.error("Error fetching orders:", ordersError);
    throw new Error("Failed to fetch orders");
  }

  // 2.1 Fetch Products and Brands separately for the items in these orders
  // Collect all product IDs
  const productIds = new Set<string>();
  orders.forEach((o: any) => {
    // Standard order items
    if (o.order_items && Array.isArray(o.order_items)) {
      o.order_items.forEach((i: any) => {
         if (i.product_id) productIds.add(i.product_id.toString());
      });
    }
    
    // Salesman orders store items in a JSON column called 'items'
    if (o.items && Array.isArray(o.items)) {
      o.items.forEach((i: any) => {
        // Try multiple possible keys for product ID
        const pid = i.product_id || i.id || i.productId;
        if (pid) productIds.add(pid.toString());
      });
    }
  });

  // 2.1 Fetch only essential product data
  let productsMap = new Map();
  if (productIds.size > 0) {
      const { data: products } = await supabase
        .from('products')
        .select('id, name, brand_id, price_customer, price_retailer, price_beauty_parlor, brands!inner(id, name)')
        .in('id', Array.from(productIds));
    
      if (products) {
          products.forEach((p: any) => productsMap.set(p.id, p));
      }
  }

  // 3. Aggregate Data
  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum: number, o: any) => sum + Number(o.total_amount), 0);
  const pendingPayments = orders
    .filter((o: any) => o.payment_status !== 'paid' && o.status !== 'cancelled')
    .reduce((sum: number, o: any) => sum + Number(o.pending_amount), 0);

  // Brand Summary Aggregation
  const brandMap = new Map<string, { name: string, total: number, count: number }>();

  orders.forEach((order: any) => {
    if (order.status === 'cancelled') return;

    const userRole = userProfile?.role;
    let itemsToProcess: any[] = [];
    let isJsonSource = false;

    // Prioritize standard order_items, fallback to JSON items (common for salesman orders)
    if (order.order_items && Array.isArray(order.order_items) && order.order_items.length > 0) {
      itemsToProcess = order.order_items;
      isJsonSource = false;
    } else if (order.items && Array.isArray(order.items) && order.items.length > 0) {
      itemsToProcess = order.items;
      isJsonSource = true;
    }

    itemsToProcess.forEach((item: any) => {
      const pid = (isJsonSource ? (item.product_id || item.id || item.productId) : item.product_id)?.toString();
      const product = productsMap.get(pid);
      
      let brand = product?.brands;
      if (Array.isArray(brand)) brand = brand[0];
      
      const brandName = brand?.name || "Unbranded";
      const brandId = brand?.id || "unbranded";
      
      const current = brandMap.get(brandId) || { name: brandName, total: 0, count: 0 };
      
      // Determine the best price to use - Prioritize historically recorded price
      let price = Number(item.price || item.unit_price || 0);

      // Only if historical price is missing, try to fetch current role-specific price
      if (price === 0) {
        if (product) {
          if (userRole === 'beauty_parlor') {
            price = product.price_beauty_parlor || 0;
          } else if (userRole === 'retailer') {
            price = product.price_retailer || 0;
          }
          // Fallback to customer price if role price is missing
          if (price === 0) price = product.price_customer || 0;
        } else if (isJsonSource) {
          // If no product data but it's JSON (salesman order), check JSON-specific keys
          if (userRole === 'beauty_parlor') {
            price = item.price_beauty_parlor || item.beauty_price || 0;
          } else if (userRole === 'retailer') {
            price = item.price_retailer || item.retailer_price || 0;
          }
        }
      }
      
      const qty = Number(item.quantity || 1);
      current.total += qty * price;
      current.count += qty;
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
      totalPaid: totalSpent - pendingPayments, // Helper for UI
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
 * Unified loader for dashboard data to avoid multiple client-side waterfalls
 */
export async function loadUnifiedDashboardData(role: "retailer" | "beauty_parlor") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Fetch all required data in parallel on the server
  const [dashboardData, { data: upcoming }, { data: overdue }] = await Promise.all([
    getRetailerDashboardData(),
    supabase
      .from("orders")
      .select(`
        id, order_number, user_id, total_amount, paid_amount, pending_amount,
        initial_payment_required, initial_payment_status, initial_payment_due_date,
        pending_payment_due_date, created_via, recorded_by
      `)
      .eq("user_id", user.id)
      .or(`initial_payment_due_date.lte.${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()},pending_payment_due_date.lte.${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()}`)
      .order("initial_payment_due_date", { ascending: true, nullsFirst: false }),
    supabase
      .from("orders")
      .select(`
        id, order_number, user_id, total_amount, paid_amount, pending_amount,
        initial_payment_required, initial_payment_status, initial_payment_due_date,
        pending_payment_due_date, created_via, recorded_by
      `)
      .eq("user_id", user.id)
      .or(`and(initial_payment_due_date.lt.${new Date().toISOString()},initial_payment_status.eq.not_collected),pending_payment_due_date.lt.${new Date().toISOString()}`)
      .neq("payment_status", "paid")
  ]);

  return {
    ...dashboardData,
    upcomingPayments: upcoming || [],
    overduePayments: overdue || [],
    user
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
