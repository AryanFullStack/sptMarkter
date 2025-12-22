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

  let productsMap = new Map();
  if (productIds.size > 0) {
      const { data: products } = await supabase
        .from('products')
        .select(`
            id, 
            name, 
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

    // 1. Process standard order items
    if (order.order_items && Array.isArray(order.order_items)) {
      order.order_items.forEach((item: any) => {
        const product = productsMap.get(item.product_id?.toString());
        // Handle brands being an array or object
        let brand = product?.brands;
        if (Array.isArray(brand)) brand = brand[0];
        
        const brandName = brand?.name || "Unbranded";
        const brandId = brand?.id || "unbranded";
        
        const current = brandMap.get(brandId) || { name: brandName, total: 0, count: 0 };
        current.total += Number(item.subtotal || (item.quantity * item.price) || 0);
        current.count += (item.quantity || 0);
        brandMap.set(brandId, current);
      });
    } 
    // 2. Process items from the JSON column (Salesman orders)
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((item: any) => {
        const pid = item.product_id || item.id || item.productId;
        const product = productsMap.get(pid?.toString());
        
        // Handle brands being an array or object
        let brand = product?.brands;
        if (Array.isArray(brand)) brand = brand[0];
        
        const brandId = brand?.id || "unbranded";
        const brandName = brand?.name || "Unbranded";
        
        const current = brandMap.get(brandId) || { name: brandName, total: 0, count: 0 };
        
        // Determine price based on user role if available, or use the price stored in item
        // Standard keys: price, beauty_price, retailer_price
        const price = item.price || 
                     (userProfile?.role === 'beauty_parlor' ? (item.beauty_price || item.price_beauty_parlor) : 
                                                              (item.retailer_price || item.price_retailer)) || 0;
        
        current.total += (item.quantity || 0) * price;
        current.count += (item.quantity || 0);
        brandMap.set(brandId, current);
      });
    }
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
