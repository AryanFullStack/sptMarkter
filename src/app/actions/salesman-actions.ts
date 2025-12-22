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
 * Get all shops available for assignment
 */
export async function getAssignableShops() {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable");

  const { data, error } = await supabase
    .from("users")
    .select(`
      id, 
      full_name, 
      email, 
      role, 
      phone, 
      address:addresses (
        city, 
        address_line1
      )
    `)
    .in("role", ["retailer", "beauty_parlor"])
    .order("full_name");

  if (error) {
    console.error("Error fetching shops:", error);
    return { error: "Failed to fetch shops" };
  }

  return { shops: data };
}

/**
 * Assign shop to salesman with schedule
 */
export async function assignShopToSalesman(
  salesmanId: string, 
  shopId: string, 
  recurringDays: string[], 
  assignmentDates: string[]
) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable");

  // 1. Clear existing assignments for this pair (optional, or just add?)
  console.log(`[assignShopToSalesman] Start. Salesman: ${salesmanId}, Shop: ${shopId}, Days: ${recurringDays.join(',')}, Dates: ${assignmentDates.join(',')}`);

  // Let's remove existing for this pair to avoid duplicates/conflicts if re-assigning
  // But maybe we want to Append? The UI should probably handle the "Current State".
  // For now, let's Delete All for this pair and Insert New to be safe and clean.
  
  const { error: deleteError } = await supabase
    .from("salesman_shop_assignments")
    .delete()
    .eq("salesman_id", salesmanId)
    .eq("shop_id", shopId);

  if (deleteError) {
    console.error("Error clearing old assignments:", deleteError);
    return { error: "Failed to update assignments" };
  }

  const inserts = [];
  
  // Recurring
  for (const day of recurringDays) {
    inserts.push({
      salesman_id: salesmanId,
      shop_id: shopId,
      recurring_day: day,
      assignment_date: null
    });
  }

  // Specific Dates
  for (const date of assignmentDates) {
    inserts.push({
      salesman_id: salesmanId,
      shop_id: shopId,
      recurring_day: null,
      assignment_date: date
    });
  }

  if (inserts.length > 0) {
    console.log(`[assignShopToSalesman] Inserting ${inserts.length} rows`);
    const { error: insertError } = await supabase
      .from("salesman_shop_assignments")
      .insert(inserts);

    if (insertError) {
       console.error("Error inserting assignments:", insertError);
       return { error: "Failed to save assignments" };
    }
  } else {
     console.log(`[assignShopToSalesman] No inserts generated. Days/Dates empty.`);
  }
  
  // Also update the legacy 'assigned_salesman_id' on users table for backward compat / single owner
  console.log(`[assignShopToSalesman] Updating user legacy field`);
  const { error: updateError } = await supabase.from("users").update({ assigned_salesman_id: salesmanId }).eq("id", shopId);
  
  if (updateError) {
      console.error("[assignShopToSalesman] Error updating legacy field:", updateError);
  }

  console.log(`[assignShopToSalesman] Success. REVALIDATING PATHS.`);

  revalidatePath("/admin/salesmen");
  revalidatePath("/salesman");
  revalidatePath("/salesman/shops");
  return { success: true };
}

/**
 * Get assigned shops for a salesman
 */
export async function getSalesmanAssignedShops(salesmanId: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable");

  const { data: assignments, error } = await supabase
    .from("salesman_shop_assignments")
    .select(`
      shop_id,
      recurring_day,
      assignment_date,
      shop:shop_id (
        id,
        full_name,
        address:addresses (
          address_line1,
          city
        ), 
        pending_amount_limit
      )
    `)
    .eq("salesman_id", salesmanId);

  if (error) {
    console.error("Error fetching assigned shops:", error);
    return { error: "Failed to fetch assigned shops" };
  }

  // Process into a nice list
  // We want: List of Unique Shops, with their "Schedule"
  const shopMap = new Map();

  assignments?.forEach((a: any) => {
      const s = a.shop;
      if (!s) return;
      
      const shopId = s.id;
      if (!shopMap.has(shopId)) {
          shopMap.set(shopId, {
              ...s,
              schedule: { recurring: [], dates: [] }
          });
      }
      const entry = shopMap.get(shopId);
      if (a.recurring_day && !entry.schedule.recurring.includes(a.recurring_day)) {
          entry.schedule.recurring.push(a.recurring_day);
      }
      if (a.assignment_date && !entry.schedule.dates.includes(a.assignment_date)) {
          entry.schedule.dates.push(a.assignment_date);
      }
  });

  const finalShops = Array.from(shopMap.values());
  console.log(`[getSalesmanAssignedShops] Returning ${finalShops.length} shops for salesman ${salesmanId}`);
  return { shops: finalShops };
}

/**
 * Get Today's Route (Shops assigned for Today)
 */
export async function getSalesmanRouteToday(salesmanId: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable");

  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }); // Monday, Tuesday...
  const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

  const { data, error } = await supabase
      .from("salesman_shop_assignments")
      .select(`
          shop:shop_id (
              id,
              full_name,
              phone,
              email,
              role,
              pending_amount_limit,
              address:addresses (
                address_line1,
                city
              )
          )
      `)
      .eq("salesman_id", salesmanId)
      .or(`recurring_day.eq.${dayName},assignment_date.eq.${dateStr}`);

  if (error) {
      console.error("Error fetching route:", error);
      return { error: "Failed to fetch route" };
  }

  // Dedup in case both match
  const uniqueShops = new Map();
  data?.forEach((item: any) => {
      if (item.shop) uniqueShops.set(item.shop.id, item.shop);
  });

  return { route: Array.from(uniqueShops.values()) };
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

  // Verify Shop Assignment
  const { data: shopAssignment } = await supabase
      .from("salesman_shop_assignments")
      .select("id")
      .eq("salesman_id", user.id)
      .eq("shop_id", clientId)
      .single();

  if (!shopAssignment) {
      return { error: "Unauthorized: You are not assigned to this shop. Please contact your administrator." };
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
      // brand_id: brandId, // TEMPORARY FIX: Commented out until DB schema is updated. See notes below.
      notes: notes ? `${notes} (Brand ID: ${brandId})` : `Order created by salesman (Brand ID: ${brandId})`,
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
      notes,
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
  

  // Calculate Ledger Data dynamically from orders
  // STRICT VISIBILITY: Salesmen only see their assigned shops and their own brand orders
  
  // 1. Fetch Assigned Shops to form the base list
  const assignedShopsRes = await getSalesmanAssignedShops(salesmanId);
  const assignedShops = assignedShopsRes.shops || [];
  const assignedShopIds = new Set(assignedShops.map((s: any) => s.id));

  const clientsServed = new Set(allOrders?.map((o) => o.user_id).filter(Boolean)).size;

  const brandPendingMap: Record<string, { id: string; name: string; amount: number }> = {};
  const shopLedgersMap: Record<string, { id: string; name: string; pending: number; last_updated: string; address_line1?: string; city?: string }> = {};

  // Initialize shop ledgers with assigned shops (even if 0 pending)
  assignedShops.forEach((s: any) => {
      shopLedgersMap[s.id] = {
          id: s.id,
          name: s.full_name || "Unknown Shop",
          pending: 0,
          last_updated: s.created_at, // default
          address_line1: s.address?.[0]?.address_line1,
          city: s.address?.[0]?.city,
      };
  });

  // We need to fetch user details for the shop names since allOrders only has user_id


  // Helper to find brand name (if we have brands loaded)
  const brandMap: Record<string, string> = {};
  brands.brands?.forEach((b: any) => brandMap[b.brand_id] = b.brands?.name || "Unknown Brand");

  allOrders?.forEach(order => {
     if (Number(order.pending_amount) > 0) {
        // 1. Group by Shop
        const uId = order.user_id;
        if (uId && assignedShopIds.has(uId)) {
            // Only count if shop is currently assigned
            if (shopLedgersMap[uId]) {
                shopLedgersMap[uId].pending += Number(order.pending_amount);
                const orderDate = new Date(order.created_at);
                const lastDate = new Date(shopLedgersMap[uId].last_updated);
                if (orderDate > lastDate) {
                    shopLedgersMap[uId].last_updated = order.created_at;
                }
            }
        }

        // 2. Group by Brand (Try column first, then notes fallback)
        let bId = (order as any).brand_id; 
        
        // Fallback: Parse from notes
        if (!bId && order.notes) {
            const match = order.notes.match(/Brand ID: ([a-f0-9-]+)/i);
            if (match && match[1]) {
                bId = match[1];
            }
        }

        if (bId) {
             if (!brandPendingMap[bId]) {
                 brandPendingMap[bId] = {
                     id: bId,
                     name: brandMap[bId] || "Unknown Brand",
                     amount: 0
                 };
             }
             brandPendingMap[bId].amount += Number(order.pending_amount);
        }
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

  // Get Assigned Brands to map names/logos
  const brandsRes = await getAssignedBrands(salesmanId);
  const assignedBrands = brandsRes.brands || [];
  
  // Create a map for quick brand lookup
  const brandMap = new Map();
  assignedBrands.forEach((b: any) => {
      brandMap.set(b.brand_id, b.brands);
  });

  // Fetch all orders for this shop recorded by this salesman
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id, pending_amount, total_amount, paid_amount, notes")
    .eq("recorded_by", salesmanId)
    .eq("user_id", shopId)
    .gt("pending_amount", 0);

  if (ordersError) {
    console.error("Error fetching orders for ledger:", ordersError);
    return { error: "Failed to fetch ledger details" };
  }

  // Aggregate by Brand
  const ledgerMap = new Map();

  orders?.forEach(order => {
      let bId = (order as any).brand_id;
      
      // Fallback: Parse from notes
      if (!bId && order.notes) {
          const match = order.notes.match(/Brand ID: ([a-f0-9-]+)/i);
          if (match && match[1]) {
              bId = match[1];
          }
      }

      if (bId) {
          if (!ledgerMap.has(bId)) {
              ledgerMap.set(bId, {
                  brand_id: bId,
                  pending_amount: 0,
                  total_sales: 0,
                  total_collected: 0,
                  brands: brandMap.get(bId) || { name: "Unknown Brand", logo_url: null }
              });
          }
          const entry = ledgerMap.get(bId);
          entry.pending_amount += Number(order.pending_amount);
          entry.total_sales += Number(order.total_amount);
          entry.total_collected += Number(order.paid_amount);
      }
  });

  const ledgers = Array.from(ledgerMap.values());
  const totalInternalPending = ledgers.reduce((sum, l) => sum + l.pending_amount, 0);

  return {
    ledgers,
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
  const { data: payment, error: updateError } = await supabase
    .from("payments")
    .update({ 
      status: "completed",
      recorded_by: user.id, // Mark who approved/collected it
      notes: "Payment approved and collected"
    })
    .eq("id", paymentId)
    .select("order_id")
    .single();

  if (updateError || !payment) {
    console.error("Error approving payment:", updateError);
    return { error: "Failed to approve payment" };
  }

  // Force update order totals (Manual Logic for robustness)
  if (payment.order_id) {
    const { data: orderPayments, error: paymentFetchError } = await supabase
      .from("payments")
      .select("amount")
      .eq("order_id", payment.order_id)
      .eq("status", "completed");

    if (!paymentFetchError && orderPayments) {
      const totalPaid = orderPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      
      const { data: order } = await supabase
        .from("orders")
        .select("total_amount")
        .eq("id", payment.order_id)
        .single();
        
      if (order) {
        const totalAmount = Number(order.total_amount);
        const pendingAmount = Math.max(0, totalAmount - totalPaid);
        const paymentStatus = totalPaid >= totalAmount ? "paid" : totalPaid > 0 ? "partial" : "pending";
        
        await supabase
          .from("orders")
          .update({
             paid_amount: totalPaid,
             pending_amount: pendingAmount,
             payment_status: paymentStatus
          })
          .eq("id", payment.order_id);
      }
    }
  }

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

/**
 * Search for clients (Retailers/Beauty Parlors)
 */
export async function searchClients(query: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable");

  try {
    const filter = "full_name.ilike.%" + query + "%,email.ilike.%" + query + "%,phone.ilike.%" + query + "%";
    
    const { data } = await supabase
      .from("users")
      .select("id, full_name, email, phone, role, is_active, addresses(address_line1, city, state, postal_code)")
      .or(filter)
      .in('role', ['retailer', 'beauty_parlor'])
      .limit(20);

    return { clients: data };
  } catch (error) {
    console.error("Error searching clients:", error);
    return { error: "Failed to search clients" };
  }
}

