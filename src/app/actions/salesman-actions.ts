"use server";

import { createAdminClient } from "@/supabase/admin";
import { createClient } from "@/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Get brands assigned to a salesman
 */
export async function getAssignedBrands(salesmanId: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable");

  const { data, error } = await supabase
    .from("salesman_brands")
    .select(`
      id,
      brand_id,
      assigned_at,
      brands (
        id,
        name,
        slug,
        logo_url
      )
    `)
    .eq("salesman_id", salesmanId);

  if (error) {
    console.error("Error fetching assigned brands:", error);
    return { error: "Failed to fetch assigned brands" };
  }

  return { brands: data };
}

/**
 * Search for Beauty Parlor or Shop clients
 */
export async function searchClients(query: string, role?: "beauty_parlor" | "retailer") {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable");

  let queryBuilder = supabase
    .from("users")
    .select(`
      id,
      email,
      full_name,
      phone,
      role,
      pending_amount_limit,
      assigned_salesman_id,
      created_at
    `)
    .in("role", role ? [role] : ["beauty_parlor", "retailer"]);

  // Search by name, email, or phone
  if (query) {
    queryBuilder = queryBuilder.or(
      `full_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`
    );
  }

  queryBuilder = queryBuilder.order("full_name", { ascending: true }).limit(20);

  const { data, error } = await queryBuilder;

  if (error) {
    console.error("Error searching clients:", error);
    return { error: "Failed to search clients" };
  }

  return { clients: data };
}

/**
 * Get complete financial status for a client
 */
export async function getClientFinancialStatus(clientId: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable");

  // Get user info - STRICTLY enforce role check for shop/parlor
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, email, full_name, phone, role, pending_amount_limit, assigned_salesman_id")
    .eq("id", clientId)
    .in("role", ["beauty_parlor", "retailer"])
    .single();

  if (userError || !user) {
    return { error: "Shop not found or invalid role" };
  }

  // Get all orders (not cancelled)
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select(`
      id,
      order_number,
      total_amount,
      paid_amount,
      pending_amount,
      payment_status,
      status,
      created_at
    `)
    .eq("user_id", clientId)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });

  if (ordersError) {
    return { error: "Failed to fetch orders" };
  }

  // Calculate totals
  const totalLifetimeValue = orders?.reduce((sum, order) => sum + Number(order.total_amount || 0), 0) || 0;
  const totalPaid = orders?.reduce((sum, order) => sum + Number(order.paid_amount || 0), 0) || 0;
  const currentPending = orders?.reduce(
    (sum, order) => order.payment_status !== "paid" ? sum + Number(order.pending_amount || 0) : sum,
    0
  ) || 0;

  const pendingLimit = Number(user.pending_amount_limit || 0);
  const remainingLimit = Math.max(0, pendingLimit - currentPending);

  return {
    user,
    orders,
    financialSummary: {
      totalLifetimeValue,
      totalPaid,
      currentPending,
      pendingLimit,
      remainingLimit,
      limitUsagePercentage: pendingLimit > 0 ? (currentPending / pendingLimit) * 100 : 0,
    },
  };
}

/**
 * Check if salesman can create an order for a client (pending limit validation)
 */
export async function canCreateOrder(
  clientId: string,
  orderTotal: number,
  paidAmount: number
) {
  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) return { valid: false, error: "Unauthorized" };

  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable");

  // Verify salesman role
  const { data: salesmanData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (salesmanData?.role !== "salesman") {
    return { valid: false, error: "Unauthorized: Salesman access required" };
  }

  // Get client financial status
  const status = await getClientFinancialStatus(clientId);

  if (status.error || !status.financialSummary) {
    return { valid: false, error: status.error || "Failed to fetch client status" };
  }

  const newPending = orderTotal - paidAmount;

  // If paying in full, no limit check needed
  if (newPending <= 0) {
    return { valid: true };
  }

  const { currentPending, pendingLimit } = status.financialSummary;
  const totalPendingAfterOrder = currentPending + newPending;

  if (totalPendingAfterOrder > pendingLimit) {
    return {
      valid: false,
      error: `Pending limit would be exceeded. Current: Rs. ${currentPending.toLocaleString()}, New order pending: Rs. ${newPending.toLocaleString()}, Limit: Rs. ${pendingLimit.toLocaleString()}. Total after order: Rs. ${totalPendingAfterOrder.toLocaleString()}`,
      currentPending,
      newPending,
      pendingLimit,
      totalAfter: totalPendingAfterOrder,
    };
  }

  return { valid: true };
}

/**
 * Create order for a client (salesman)
 */
export async function createOrderForClient(
  clientId: string,
  items: any[],
  paidAmount: number,
  brandId: string, // NEW: Added brandId
  notes?: string
) {
  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable");

  // Verify salesman role
  const { data: salesmanData } = await  supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (salesmanData?.role !== "salesman") {
    return { error: "Unauthorized: Salesman access required" };
  }

  // Verify brand assignment
  if (brandId) {
    const { data: assignment } = await supabase
      .from("salesman_brands")
      .select("id")
      .eq("salesman_id", user.id)
      .eq("brand_id", brandId)
      .single();
      
    if (!assignment) {
      return { error: "Unauthorized: You are not assigned to this brand" };
    }
  }

  // Get client data to determine role for pricing
  const { data: clientData } = await supabase
    .from("users")
    .select("role")
    .eq("id", clientId)
    .single();

  if (!clientData) {
    return { error: "Client not found" };
  }

  // Calculate order total with role-based pricing
  let subtotal = 0;
  for (const item of items) {
    const price =
      clientData.role === "beauty_parlor"
        ? item.beauty_price
        : item.retailer_price;
    subtotal += price * item.quantity;
  }

  const totalAmount = subtotal;
  const pendingAmount = totalAmount - paidAmount;

  // Validate pending limit
  const validation = await canCreateOrder(clientId, totalAmount, paidAmount);
  if (!validation.valid) {
    return { error: validation.error };
  }

  // Generate order number
  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  // Create order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      user_id: clientId,
      status: "created",
      items: items,
      subtotal,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      pending_amount: pendingAmount,
      payment_status: paidAmount >= totalAmount ? "paid" : paidAmount > 0 ? "partial" : "pending",
      shipping_address: {}, 
      recorded_by: user.id,
      created_via: "salesman",
      brand_id: brandId, // NEW: Uncommented to ensure triggers can link order to brand ledger
      notes: notes || "Order created by salesman",
    })
    .select()
    .single();

  if (orderError) {
    console.error("Error creating order:", orderError);
    return { error: "Failed to create order" };
  }

  // Record initial payment if any
  if (paidAmount > 0) {
    await supabase.from("payments").insert({
      order_id: order.id,
      amount: paidAmount,
      payment_method: "cash",
      recorded_by: user.id,
      notes: "Initial payment during order creation",
      status: 'completed' // CRITICAL: Ensure triggers pick up this payment
    });
  }

  // Log activity
  await supabase.from("salesman_activity_logs").insert({
    salesman_id: user.id,
    action_type: "order_created",
    entity_type: "order",
    entity_id: order.id,
    details: {
      client_id: clientId,
      order_number: orderNumber,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      brand_id: brandId,
    },
  });

  revalidatePath("/salesman");
  revalidatePath("/admin");
  revalidatePath("/dashboard");

  return { success: true, order };
}

/**
 * Record partial payment for an order (salesman)
 */
export async function recordPartialPayment(
  orderId: string,
  amount: number,
  paymentMethod: string,
  notes: string,
  status: "pending" | "completed" = "completed"
) {
  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable");

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const userRole = userData?.role || "";

  // Get order details for validation
  const { data: order, error: orderFetchError } = await supabase
    .from("orders")
    .select("id, user_id, pending_amount, payment_status")
    .eq("id", orderId)
    .single();

  if (orderFetchError) {
    if (orderFetchError.code === 'PGRST116') {
      return { error: "Order not found or access restricted" };
    }
    return { error: `Failed to fetch order: ${orderFetchError.message}` };
  }

  if (!order) {
    return { error: "Order not found" };
  }

  // Permission check:
  // 1. Admin/Sub-Admin/Salesman can record for any order (as long as they have access to the client)
  // 2. Retailer/Parlor can ONLY record (request) for THEIR OWN order, and status must be 'pending' (requesting)
  const isStaff = ["admin", "sub_admin", "salesman"].includes(userRole);
  const isOwner = order.user_id === user.id;

  if (!isStaff && !isOwner) {
    return { error: "Unauthorized: You can only record payments for your own orders" };
  }

  if (!isStaff && status !== "pending") {
    return { error: "Unauthorized: Clients can only submit payment requests for approval" };
  }

  // Validate amount
  if (amount <= 0) {
    return { error: "Payment amount must be greater than 0" };
  }

  if (amount > Number(order.pending_amount)) {
    return { error: `Payment amount (Rs. ${amount}) exceeds pending amount (Rs. ${order.pending_amount})` };
  }

  // Record payment
  const { error: paymentError } = await supabase.from("payments").insert({
    order_id: orderId,
    amount,
    payment_method: paymentMethod,
    recorded_by: user.id,
    notes: notes || (status === "pending" ? "Payment request by user" : "Payment recorded by salesman"),
    status: status,
  });

  if (paymentError) {
    console.error("Error recording payment:", paymentError);
    return { error: "Failed to record payment" };
  }

  // Note: Database triggers handle order and ledger updates automatically for 'completed' status

  // Log activity
  await supabase.from("salesman_activity_logs").insert({
    salesman_id: user.id,
    action_type: "payment_recorded",
    entity_type: "order",
    entity_id: orderId,
    details: {
      amount,
      payment_method: paymentMethod,
      notes,
    },
  });

  revalidatePath("/salesman");
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/sub-admin");
  revalidatePath("/sub-admin/orders");
  revalidatePath("/dashboard");

  return { success: true };
}

/**
 * Get salesman activity log
 */
export async function getSalesmanActivity(
  salesmanId: string,
  startDate?: string,
  endDate?: string
) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable");

  let query = supabase
    .from("salesman_activity_logs")
    .select("*")
    .eq("salesman_id", salesmanId)
    .order("created_at", { ascending: false });

  if (startDate) {
    query = query.gte("created_at", startDate);
  }

  if (endDate) {
    query = query.lte("created_at", endDate);
  }

  const { data, error } = await query.limit(100);

  if (error) {
    console.error("Error fetching activity log:", error);
    return { error: "Failed to fetch activity log" };
  }

  return { activities: data };
}

/**
 * Get salesman dashboard statistics
 */
export async function getSalesmanDashboardData(salesmanId: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable");

  // Get assigned brands
  const brands = await getAssignedBrands(salesmanId);

  // Get ALL orders to calculate accurate stats
  const { data: allOrders } = await supabase
    .from("orders")
    .select(`
      id,
      user_id,
      total_amount,
      paid_amount,
      pending_amount,
      created_at
    `)
    .eq("recorded_by", salesmanId);

  // Get recent 10 orders for the list
  const { data: recentOrders } = await supabase
    .from("orders")
    .select(`
      id,
      order_number,
      total_amount,
      paid_amount,
      pending_amount,
      payment_status,
      status,
      created_at,
      user:user_id (
        id,
        full_name,
        email
      )
    `)
    .eq("recorded_by", salesmanId)
    .order("created_at", { ascending: false })
    .limit(10);

  // Calculate stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const ordersToday =
    allOrders?.filter((o) => new Date(o.created_at) >= today).length || 0;
  
  const totalOrdersValue = allOrders?.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || 0;
  const totalCollection = allOrders?.reduce((sum, o) => sum + Number(o.paid_amount || 0), 0) || 0;
  const totalPending = allOrders?.reduce((sum, o) => sum + Number(o.pending_amount || 0), 0) || 0;
  
  const clientsServed = new Set(allOrders?.map((o) => o.user_id).filter(Boolean)).size;

  // Get brand-wise pending totals
  const { data: brandLedgers } = await supabase
    .from("salesman_shop_ledger")
    .select("brand_id, shop_id, pending_amount, last_updated, brands(name)")
    .eq("salesman_id", salesmanId);

  const brandPendingMap: Record<string, { id: string; name: string; amount: number }> = {};
  brandLedgers?.forEach((l: any) => {
    const bId = l.brand_id;
    const bName = l.brands?.name || "Unknown Brand";
    if (!brandPendingMap[bId]) brandPendingMap[bId] = { id: bId, name: bName, amount: 0 };
    brandPendingMap[bId].amount += Number(l.pending_amount || 0);
  });

  // Get Shop summaries (Total Pending per Shop)
  const shopLedgersMap: Record<string, { id: string; name: string; pending: number; last_updated: string }> = {};
  
  // Also collect shop IDs to fetch names
  const shopIds = Array.from(new Set(brandLedgers?.map(l => l.shop_id).filter(Boolean)));
  
  let shopNames: Record<string, string> = {};
  if (shopIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, full_name")
      .in("id", shopIds);
    
    users?.forEach(u => {
      shopNames[u.id] = u.full_name || "Unknown Shop";
    });
  }

  brandLedgers?.forEach((l: any) => {
    const sId = l.shop_id || 'unknown';
    if (!shopLedgersMap[sId]) {
      shopLedgersMap[sId] = { 
        id: sId, 
        name: shopNames[sId] || "Shop", 
        pending: 0, 
        last_updated: l.last_updated 
      };
    }
    shopLedgersMap[sId].pending += Number(l.pending_amount || 0);
    if (new Date(l.last_updated) > new Date(shopLedgersMap[sId].last_updated)) {
      shopLedgersMap[sId].last_updated = l.last_updated;
    }
  });

  // Get recent activity
  const activity = await getSalesmanActivity(salesmanId);

  return {
    brands: brands.brands || [],
    recentOrders: recentOrders || [],
    brandPending: Object.values(brandPendingMap),
    shopLedgers: Object.values(shopLedgersMap).sort((a, b) => b.pending - a.pending),
    stats: {
      ordersToday,
      totalOrdersValue,
      totalCollection,
      totalPending,
      clientsServed,
    },
    recentActivity: activity.activities || [],
  };
}

/**
 * Get full order history for a salesman
 */
export async function getSalesmanOrderHistory(salesmanId: string, limit = 50, offset = 0) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable");

  const { data, error, count } = await supabase
    .from("orders")
    .select(`
      id,
      order_number,
      total_amount,
      paid_amount,
      pending_amount,
      payment_status,
      status,
      created_at,
      user:user_id (
        id,
        full_name,
        email
      )
    `, { count: 'exact' })
    .eq("recorded_by", salesmanId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching order history:", error);
    return { error: "Failed to fetch order history" };
  }

  return { orders: data, totalCount: count };
}

/**
 * Get full details for a specific order
 */
export async function getOrderDetails(orderId: string) {
    const supabase = createAdminClient();
    if (!supabase) throw new Error("Admin client unavailable");

    const { data, error } = await supabase
        .from("orders")
        .select(`
            *,
            user:user_id (*),
            recorded_by_user:recorded_by (full_name),
            payments (*)
        `)
        .eq("id", orderId)
        .single();

    if (error) {
        console.error("Error fetching order details:", error);
        return { error: "Failed to fetch order details" };
    }

    return { order: data };
}

/**
 * Get independent ledger details for a specific salesman and shop
 */
export async function getSalesmanShopLedger(salesmanId: string, shopId: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable");

  // Get ledgers (per brand)
  const { data: ledgers, error } = await supabase
    .from("salesman_shop_ledger")
    .select(`
      brand_id,
      pending_amount,
      total_sales,
      total_collected,
      brands (name, logo_url)
    `)
    .eq("salesman_id", salesmanId)
    .eq("shop_id", shopId);

  if (error) {
    console.error("Error fetching ledgers:", error);
    return { error: "Failed to fetch ledgers" };
  }

  // Aggregate total pending for this salesman
  const totalInternalPending = ledgers?.reduce((sum, l) => sum + Number(l.pending_amount), 0) || 0;

  return {
    ledgers: ledgers || [],
    totalInternalPending
  };
}

/**
 * Get products for a specific brand
 */
export async function getProductsForBrand(brandId: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable");

  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .eq("brand_id", brandId)
    .order("name");

  if (error) {
    console.error("Error fetching products:", error);
    return { error: "Failed to fetch products" };
  }

  return { products };
}

/**
 * Get pending payment requests for Admin or Salesman
 */
export async function getPaymentRequests(salesmanId?: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable");

  let query = supabase
    .from("payments")
    .select(`
      id,
      amount,
      payment_method,
      notes,
      created_at,
      status,
      order:order_id (
        id,
        order_number,
        total_amount,
        pending_amount,
        items,
        user:user_id (id, full_name, role),
        recorded_by_user:recorded_by (full_name)
      )
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (salesmanId) {
    // 1. Get all orders recorded by this salesman
    const { data: recordedOrders } = await supabase
      .from("orders")
      .select("id")
      .eq("recorded_by", salesmanId);
    
    // 2. Get all clients assigned to this salesman
    const { data: assignedClients } = await supabase
      .from("users")
      .select("id")
      .eq("assigned_salesman_id", salesmanId);
    
    // 3. Get all orders for those assigned clients
    const clientIds = assignedClients?.map(c => c.id) || [];
    const { data: clientOrders } = await supabase
      .from("orders")
      .select("id")
      .in("user_id", clientIds);

    const orderIds = Array.from(new Set([
        ...(recordedOrders?.map(o => o.id) || []),
        ...(clientOrders?.map(o => o.id) || [])
    ]));

    if (orderIds.length > 0) {
      query = query.in("order_id", orderIds);
    } else {
      return { requests: [] };
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching payment requests:", error);
    return { error: "Failed to fetch payment requests" };
  }

  return { requests: data };
}

/**
 * Approve a payment request
 */
export async function approvePaymentRequest(paymentId: string) {
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable");

  // Verify role (Admin, Sub-Admin, or Salesman)
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!["admin", "sub_admin", "salesman"].includes(userData?.role || "")) {
    return { error: "Unauthorized: Insufficient permissions" };
  }

  // Update payment status
  const { error: updateError } = await supabase
    .from("payments")
    .update({ 
      status: "completed",
      recorded_by: user.id, // Mark who approved/collected it
      notes: "Payment approved and collected"
    })
    .eq("id", paymentId);

  if (updateError) {
    console.error("Error approving payment:", updateError);
    return { error: "Failed to approve payment" };
  }

  // Note: Database triggers handle order and ledger updates automatically when status becomes 'completed'

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/sub-admin");
  revalidatePath("/sub-admin/orders");
  revalidatePath("/salesman");
  revalidatePath("/dashboard");

  return { success: true };
}

// Helper functions (DELETED: redundant due to database triggers)

/**
 * Get ledger reports for all shops (Admin use)
 */
export async function getShopLedgerReports() {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable");

  // Get all shops (retailers and beauty parlors)
  const { data: shops, error: shopsError } = await supabase
    .from("users")
    .select("id, full_name, phone, pending_amount_limit")
    .in("role", ["retailer", "beauty_parlor"]);

  if (shopsError) throw new Error(shopsError.message);

  // Get all pending amount sums per user
  const { data: orderSums, error: orderError } = await supabase
    .from("orders")
    .select("user_id, pending_amount")
    .neq("status", "cancelled")
    .neq("payment_status", "paid");

  if (orderError) throw new Error(orderError.message);

  // Map pending amounts to shop IDs
  const pendingMap = new Map();
  orderSums?.forEach(o => {
    const current = pendingMap.get(o.user_id) || 0;
    pendingMap.set(o.user_id, current + Number(o.pending_amount || 0));
  });

  const reports = shops.map(shop => {
    const used = pendingMap.get(shop.id) || 0;
    const limit = Number(shop.pending_amount_limit || 0);
    return {
      shop_id: shop.id,
      shop_name: shop.full_name,
      shop_phone: shop.phone,
      pending_amount_limit: limit,
      total_pending_used: used,
      remaining_limit: Math.max(0, limit - used)
    };
  });

  return { reports };
}
