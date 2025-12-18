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
        logo_url,
        is_active
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

  // Get user info
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, email, full_name, phone, role, pending_amount_limit, assigned_salesman_id")
    .eq("id", clientId)
    .single();

  if (userError) {
    return { error: "Failed to fetch client data" };
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
      error: `Pending limit would be exceeded. Current: ₹${currentPending.toLocaleString()}, New order pending: ₹${newPending.toLocaleString()}, Limit: ₹${pendingLimit.toLocaleString()}. Total after order: ₹${totalPendingAfterOrder.toLocaleString()}`,
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
      shipping_address: {}, // Will be updated by client or admin
      recorded_by: user.id,
      created_via: "salesman",
      notes: notes || "Order created by salesman",
    })
    .select()
    .single();

  if (orderError) {
    console.error("Error creating order:", orderError);
    return { error: "Failed to create order" };
  }

  // If there's an initial payment, record it
  if (paidAmount > 0) {
    const { error: paymentError } = await supabase.from("payments").insert({
      order_id: order.id,
      amount: paidAmount,
      payment_method: "cash",
      recorded_by: user.id,
      notes: notes || "Initial payment collected by salesman",
    });

    if (paymentError) {
      console.error("Error recording payment:", paymentError);
      // Order created but payment failed - log this
    }
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
  notes: string
) {
  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable");

  // Verify salesman role
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userData?.role !== "salesman") {
    return { error: "Unauthorized: Salesman access required" };
  }

  // Validate amount
  if (amount <= 0) {
    return { error: "Payment amount must be greater than 0" };
  }

  // Get order details
  const { data: order } = await supabase
    .from("orders")
    .select("id, pending_amount, payment_status")
    .eq("id", orderId)
    .single();

  if (!order) {
    return { error: "Order not found" };
  }

  if (amount > Number(order.pending_amount)) {
    return { error: `Payment amount (₹${amount}) exceeds pending amount (₹${order.pending_amount})` };
  }

  // Record payment
  const { error: paymentError } = await supabase.from("payments").insert({
    order_id: orderId,
    amount,
    payment_method: paymentMethod,
    recorded_by: user.id,
    notes: notes || "Payment recorded by salesman",
  });

  if (paymentError) {
    console.error("Error recording payment:", paymentError);
    return { error: "Failed to record payment" };
  }

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

  // Get orders created by this salesman
  const { data: orders } = await supabase
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
    orders?.filter((o) => new Date(o.created_at) >= today).length || 0;
  
  const totalOrdersValue = orders?.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || 0;
  
  const clientsServed = new Set(orders?.map((o) => o.user && typeof o.user === 'object' && 'id' in o.user ? o.user.id : null).filter(Boolean)).size;

  // Get recent activity
  const activity = await getSalesmanActivity(salesmanId);

  return {
    brands: brands.brands || [],
    recentOrders: orders || [],
    stats: {
      ordersToday,
      totalOrdersValue,
      clientsServed,
    },
    recentActivity: activity.activities || [],
  };
}
