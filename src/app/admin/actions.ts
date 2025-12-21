"use server";

import { createClient } from "../../../supabase/server";
import { createAdminClient } from "@/supabase/admin";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/utils/audit-logger";

const checkPermissions = async (allowedRoles: string[]) => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.error("Action Failed: Not authenticated");
        throw new Error("Not authenticated");
    }

    const supabaseAdmin = createAdminClient();
    if (!supabaseAdmin) throw new Error("Server configuration error");

    const { data: userData, error } = await supabaseAdmin
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();
    
    if (error || !userData) {
         console.error("Permission Check Failed: User data not found", error);
         throw new Error("Permission verification failed");
    }
    
    if (!allowedRoles.includes(userData.role)) {
        console.error(`Permission Denied: User role ${userData.role} not in ${allowedRoles}`);
        throw new Error(`Unauthorized: Role '${userData.role || 'none'}' cannot perform this action.`);
    }
    
    return user;
};

// User Management Actions
export async function approveUser(userId: string, approved: boolean, creditLimit?: number) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const updateData: any = { approved };
  if (creditLimit !== undefined) {
    updateData.credit_limit = creditLimit;
  }

  const { error } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", userId);

  if (error) throw error;

  // Log audit
  await logAudit({
    action: approved ? "USER_APPROVED" : "USER_REJECTED",
    entity_type: "user",
    entity_id: userId,
    changes: updateData,
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function updateUserRole(userId: string, role: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("users")
    .update({ role })
    .eq("id", userId);

  if (error) throw error;

  await logAudit({
    action: "USER_ROLE_UPDATED",
    entity_type: "user",
    entity_id: userId,
    changes: { role },
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function suspendUser(userId: string, suspended: boolean) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Note: You may need to add a 'suspended' or 'is_active' column to users table
  const { error } = await supabase
    .from("users")
    .update({ is_active: !suspended })
    .eq("id", userId);

  if (error) throw error;

  await logAudit({
    action: suspended ? "USER_SUSPENDED" : "USER_ACTIVATED",
    entity_type: "user",
    entity_id: userId,
    changes: { is_active: !suspended },
  });

  revalidatePath("/admin/users");
  return { success: true };
}

// Product Management Actions
export async function createProduct(productData: any) {
  // Verify permissions first
  await checkPermissions(['admin']);

  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable");

  // Fix UUID validation: convert empty strings to null
  const cleanedData = {
    ...productData,
    category_id: productData.category_id || null,
    brand_id: productData.brand_id || null,
  };

  const { data, error } = await supabase
    .from("products")
    .insert(cleanedData)
    .select()
    .single();

  if (error) {
    console.error("Error creating product:", error);
    throw new Error(error.message);
  }

  // Log audit - using auth user since we are in a server action with auth
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();

  if (user) {
    await logAudit({
        action: "PRODUCT_CREATED",
        entity_type: "product",
        entity_id: data.id,
        changes: cleanedData,
    });
  }

  revalidatePath("/admin/products");
  return { success: true, data };
}

export async function updateProduct(productId: string, productData: any) {
  await checkPermissions(['admin']);

  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable");

  // Fix UUID validation: convert empty strings to null
  const cleanedData = {
    ...productData,
    category_id: productData.category_id || null,
    brand_id: productData.brand_id || null,
  };

  const { data, error } = await supabase
    .from("products")
    .update(cleanedData)
    .eq("id", productId)
    .select()
    .single();

  if (error) {
      console.error("Error updating product:", error);
      throw new Error(error.message);
  }

  // Audit Log
  await logAudit({
    action: "PRODUCT_UPDATED",
    entity_type: "product",
    entity_id: productId,
    changes: cleanedData,
  });

  revalidatePath("/admin/products");
  return { success: true, data };
}

export async function deleteProduct(productId: string) {
  await checkPermissions(['admin']);

  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable");

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) {
      console.error("Error deleting product:", error);
      throw new Error(error.message);
  }

  await logAudit({
    action: "PRODUCT_DELETED",
    entity_type: "product",
    entity_id: productId,
  });

  revalidatePath("/admin/products");
  return { success: true };
}

// Inventory Management Actions
export async function adjustStock(productId: string, quantityChange: number, reason: string) {
  // Check permissions - only admin and sub_admin can adjust stock
  await checkPermissions(['admin', 'sub_admin']);

  // Get authenticated user for audit logging
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Use admin client to bypass RLS
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable");

  // Get current stock
  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("stock_quantity")
    .eq("id", productId)
    .single();

  if (fetchError) {
    console.error("Error fetching product:", fetchError);
    throw new Error(`Failed to fetch product: ${fetchError.message}`);
  }

  const previousQuantity = product.stock_quantity || 0;
  const newQuantity = previousQuantity + quantityChange;

  // Prevent negative stock
  if (newQuantity < 0) {
    throw new Error(`Invalid stock adjustment: resulting quantity would be negative (${newQuantity})`);
  }

  // Update product stock
  const { error: updateError } = await supabase
    .from("products")
    .update({ stock_quantity: newQuantity })
    .eq("id", productId);

  if (updateError) {
    console.error("Error updating product stock:", updateError);
    throw new Error(`Failed to update stock: ${updateError.message}`);
  }

  // Log inventory change
  const { error: logError } = await supabase
    .from("inventory_logs")
    .insert({
      product_id: productId,
      previous_quantity: previousQuantity,
      new_quantity: newQuantity,
      quantity_change: quantityChange,
      reason,
      created_by: user.id,
    });

  if (logError) {
    console.error("Error logging inventory change:", logError);
    // Don't throw - the stock was already updated
  }

  await logAudit({
    action: "INVENTORY_ADJUSTED",
    entity_type: "product",
    entity_id: productId,
    changes: { previousQuantity, newQuantity, quantityChange, reason },
  });

  // Revalidate both admin and sub-admin routes
  revalidatePath("/admin/inventory");
  revalidatePath("/sub-admin/stock");
  return { success: true };
}

// Payment Recording Actions
export async function recordPayment(paymentData: {
  order_id: string;
  amount: number;
  payment_method: string;
  notes?: string;
  proof_url?: string;
}) {
  // Verify permissions (Admin or Sub-Admin only)
  const user = await checkPermissions(['admin', 'sub_admin']);

  const supabaseAdmin = createAdminClient();
  if (!supabaseAdmin) throw new Error("Admin client unavailable");

  // Fetch current order for validation (using admin client to bypass RLS)
  const { data: order, error: orderFetchError } = await supabaseAdmin
    .from("orders")
    .select("paid_amount, total_amount, pending_amount")
    .eq("id", paymentData.order_id)
    .single();

  if (orderFetchError) {
    if (orderFetchError.code === 'PGRST116') {
      throw new Error(`Order not found with ID: ${paymentData.order_id}`);
    }
    throw orderFetchError;
  }

  if (!order) {
    throw new Error(`Order not found with ID: ${paymentData.order_id}`);
  }

  // Validate payment amount doesn't exceed pending amount
  if (paymentData.amount > Number(order.pending_amount)) {
    throw new Error(`Payment amount (Rs. ${paymentData.amount}) exceeds outstanding balance (Rs. ${order.pending_amount})`);
  }

  // Insert payment record
  // Note: The database trigger 'update_order_payment_status_trigger' will automatically:
  // 1. Calculate total paid amount from all payments WHERE status = 'completed'
  // 2. Update order.paid_amount
  // 3. Calculate and update order.pending_amount
  // 4. Update order.payment_status ('pending', 'partial', or 'paid')
  const { data: payment, error: paymentError } = await supabaseAdmin
    .from("payments")
    .insert({
      ...paymentData,
      recorded_by: user.id,
      status: 'completed', // CRITICAL: Trigger filters by status = 'completed'
    })
    .select()
    .single();

  if (paymentError) throw paymentError;

  // Calculate what the new amounts should be for audit logging
  const newPaidAmount = (order.paid_amount || 0) + paymentData.amount;
  const newPendingAmount = order.total_amount - newPaidAmount;

  await logAudit({
    action: "PAYMENT_RECORDED",
    entity_type: "payment",
    entity_id: payment.id,
    changes: { ...paymentData, newPaidAmount, newPendingAmount },
  });

  revalidatePath("/admin/payments");
  revalidatePath("/admin/orders");
  revalidatePath("/sub-admin/orders");
  return { success: true, data: payment };
}

// Order Management Actions
export async function updateOrderStatus(orderId: string, status: string) {
  // Check permissions - both admin and sub_admin can update status
  await checkPermissions(['admin', 'sub_admin']);

  const supabaseAdmin = createAdminClient();
  if (!supabaseAdmin) throw new Error("Admin client unavailable");

  const { error } = await supabaseAdmin
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (error) {
    console.error("Error updating order status:", error);
    throw new Error(error.message);
  }

  // Log audit
  await logAudit({
    action: "ORDER_STATUS_UPDATED",
    entity_type: "order",
    entity_id: orderId,
    changes: { status },
  }, supabaseAdmin); // Pass admin client to bypass RLS in audit log if needed

  revalidatePath("/admin/orders");
  revalidatePath("/sub-admin/orders");
  return { success: true };
}

export async function assignOrderToSubAdmin(orderId: string, subAdminId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("orders")
    .update({ assigned_to: subAdminId })
    .eq("id", orderId);

  if (error) throw error;

  await logAudit({
    action: "ORDER_ASSIGNED",
    entity_type: "order",
    entity_id: orderId,
    changes: { assigned_to: subAdminId },
  });

  revalidatePath("/admin/orders");
  return { success: true };
}

// Coupon Management Actions
export async function createCoupon(couponData: any) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("coupons")
    .insert(couponData)
    .select()
    .single();

  if (error) throw error;

  await logAudit({
    action: "COUPON_CREATED",
    entity_type: "coupon",
    entity_id: data.id,
    changes: couponData,
  });

  revalidatePath("/admin/coupons");
  return { success: true, data };
}

export async function updateCoupon(couponId: string, couponData: any) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("coupons")
    .update(couponData)
    .eq("id", couponId)
    .select()
    .single();

  if (error) throw error;

  await logAudit({
    action: "COUPON_UPDATED",
    entity_type: "coupon",
    entity_id: couponId,
    changes: couponData,
  });

  revalidatePath("/admin/coupons");
  return { success: true, data };
}

// Secure Data Loading Actions (Bypassing RLS for Admins)
// Secure Data Loading Actions (Bypassing RLS for Admins)
export async function loadAdminDashboardDataAction() {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable");

  // Parallel fetch for potential speed
  const [ordersRes, productsRes, usersRes] = await Promise.all([
     supabase.from("orders")
     .select(`
        id, 
        total_amount, 
        paid_amount, 
        pending_amount,
        status, 
        created_at, 
        order_number, 
        users:users!user_id(full_name),
        recorded_by_user:recorded_by(full_name)
     `)
     .order("created_at", { ascending: false }),
     supabase.from("products").select("id, name, stock_quantity, images").lte("stock_quantity", 10).limit(5),
     supabase
        .from("users")
        .select(`
            id, role, approved, created_at, full_name, email, phone,
            addresses:addresses(city, address_type, is_default)
        `)
        .neq("role", "admin")
  ]);

  const orders = ordersRes.data || [];
  const lowStockProducts = productsRes.data || [];
  const rawUsers = usersRes.data || [];

  // Transform users to include a single "primary" address (default or first found)
  const users = rawUsers.map((u: any) => {
      const primaryAddress = u.addresses?.find((a: any) => a.is_default) || u.addresses?.[0];
      return {
          ...u,
          address: primaryAddress ? { city: primaryAddress.city, type: primaryAddress.address_type } : null
      };
  });

  // Calculate Stats
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const pendingCredits = orders.reduce((sum, o) => {
      const total = Number(o.total_amount) || 0;
      const paid = Number(o.paid_amount) || 0;
      return sum + (total - paid);
  }, 0);
  
  const stats = {
      totalRevenue,
      totalOrders: orders.length,
      pendingCredits,
      lowStockItems: lowStockProducts.length,
      activeCustomers: users.filter((u: any) => u.approved).length,
      pendingApprovals: users.filter((u: any) => !u.approved && ["retailer", "beauty_parlor", "salesman", "sub_admin"].includes(u.role)).length
  };

  // Recent 5
  const recentOrders = orders.slice(0, 5);

  // Sales Data (Simple Daily aggregation)
  // Group by date (DD/MM)
  const salesMap = new Map();
  orders.forEach(o => {
      const date = new Date(o.created_at).toLocaleDateString('en-GB'); // DD/MM/YYYY
      const current = salesMap.get(date) || 0;
      salesMap.set(date, current + (Number(o.total_amount) || 0));
  });
  // Convert to array and take last 7 entries (pseudo)
  // For actual graph we'd sort keys.
  const salesData = Array.from(salesMap.entries())
       .map(([name, total]) => ({ name, total }))
       .slice(0, 7)
       .reverse();

  return {
     stats,
     recentOrders,
     lowStockProducts,
     salesData,
     pendingUsers: users.filter((u: any) => !u.approved && ["retailer", "beauty_parlor", "salesman", "sub_admin"].includes(u.role)),
     allUsers: users,
     pendingPaymentOrders: orders.filter(o => {
         const total = Number(o.total_amount) || 0;
         const paid = Number(o.paid_amount) || 0;
         return (total - paid) > 0;
     })
  };
}

export async function getPendingUsersAction() {
    await checkPermissions(['admin', 'sub_admin']);

    const supabase = createAdminClient();
    if (!supabase) throw new Error("Admin client unavailable");

    const { data: users, error } = await supabase
        .from("users")
        .select(`
            id, role, approved, created_at, full_name, email, phone,
            addresses:addresses(city, address_type, is_default)
        `)
        .is("approved", null)
        .neq("role", "admin")
        .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return users;
}


export async function deleteUserAction(userId: string) {
    console.log(`[deleteUserAction] Start deleting user: ${userId}`);
    await checkPermissions(['admin', 'sub_admin']); 

    const supabase = createAdminClient();
    if (!supabase) throw new Error("Admin client unavailable");

    // Delete from Auth (References public.users via Cascade)
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
        console.error("[deleteUserAction] Error:", error);
        throw new Error(error.message);
    }
    
    console.log("[deleteUserAction] Success");
    revalidatePath("/admin");
    revalidatePath("/sub-admin");
    return { success: true };
}

export async function updateUserRoleAction(userId: string, role: string) {
    console.log(`[updateUserRoleAction] Start updating role for ${userId} to ${role}`);
    await checkPermissions(['admin']); // Only Admin can change roles? Or Sub-Admin too? For now Admin only.

    const supabase = createAdminClient();
    if (!supabase) throw new Error("Admin client unavailable");

    const { error } = await supabase.from("users").update({ role }).eq("id", userId);
    if (error) {
        console.error("[updateUserRoleAction] Error:", error);
        throw new Error(error.message);
    }
    
    console.log("[updateUserRoleAction] Success");
    revalidatePath("/admin");
    revalidatePath("/sub-admin");
    return { success: true };
}

export async function approveUserAction(userId: string) {
    console.log(`[approveUserAction] Approving user ${userId}`);
    await checkPermissions(['admin', 'sub_admin']); 

    const supabase = createAdminClient();
    if (!supabase) throw new Error("Admin client unavailable");

    const { error } = await supabase
        .from("users")
        .update({ approved: new Date().toISOString() })
        .eq("id", userId);

    if (error) {
        console.error("[approveUserAction] Error:", error);
        throw new Error(error.message);
    }
    
    console.log("[approveUserAction] Success");
    revalidatePath("/admin");
    revalidatePath("/sub-admin");
    return { success: true };
}

export async function markOrderPaidAction(orderId: string, totalAmount: number) {
    const supabase = createAdminClient();
    if (!supabase) throw new Error("Admin client unavailable");

    const { error } = await supabase
        .from("orders")
        .update({ 
            paid_amount: totalAmount,
            pending_amount: 0,
            payment_status: 'paid' 
        })
        .eq("id", orderId);

    if (error) throw new Error(error.message);
    
    revalidatePath("/admin");
    return { success: true };
}

export async function loadAdminOrdersAction() {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable");

  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      users:users!user_id (
        email,
        full_name,
        role
      ),
      order_items_data:order_items!order_id(
        *,
        product:products(name, images)
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function loadSubAdminOrdersAction() {
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable");

  // Sub-Admins see ALL orders for now to ensure visibility
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      user:users!user_id(full_name, email),
      order_items_data:order_items!order_id(
        *,
        product:products(name, images)
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

// Salesman Management Actions
export async function assignSalesmanToBrands(salesmanId: string, brandIds: string[]) {
  await checkPermissions(['admin']);

  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable");

  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();

  // First, remove all existing brand assignments for this salesman
  const { error: deleteError } = await supabase
    .from("salesman_brands")
    .delete()
    .eq("salesman_id", salesmanId);

  if (deleteError) throw new Error(deleteError.message);

  // Then add new assignments
  if (brandIds.length > 0) {
    const assignments = brandIds.map(brandId => ({
      salesman_id: salesmanId,
      brand_id: brandId,
      assigned_by: user?.id
    }));

    const { error: insertError } = await supabase
      .from("salesman_brands")
      .insert(assignments);

    if (insertError) throw new Error(insertError.message);
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function assignSalesmanToClient(clientId: string, salesmanId: string | null) {
  await checkPermissions(['admin']);

  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable");

  const { error } = await supabase
    .from("users")
    .update({ assigned_salesman_id: salesmanId })
    .eq("id", clientId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  return { success: true };
}

export async function getDetailedUserProfile(userId: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable");

  // Get user details
  const { data: user, error: userError } = await supabase
    .from("users")
    .select(`
      *,
      assigned_salesman:assigned_salesman_id (
        id,
        full_name,
        email
      )
    `)
    .eq("id", userId)
    .single();

  if (userError) throw new Error(userError.message);

  // Get all orders (both direct and via salesman)
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select(`
      *,
      recorded_by_user:recorded_by (
        id,
        full_name,
        email,
        role
      ),
      payments:payments (
        id,
        amount,
        payment_method,
        notes,
        created_at,
        payment_sequence,
        remaining_balance,
        recorded_by_user:recorded_by (
          full_name,
          email
        )
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (ordersError) throw new Error(ordersError.message);

  // Calculate financial metrics
  const totalLifetimeValue = orders?.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || 0;
  const totalPaid = orders?.reduce((sum, o) => sum + Number(o.paid_amount || 0), 0) || 0;
  const currentPending = orders?.reduce(
    (sum, o) => o.payment_status !== 'paid' ? sum + Number(o.pending_amount || 0) : sum,
    0
  ) || 0;

  const pendingLimit = Number(user.pending_amount_limit || 0);
  const remainingLimit = Math.max(0, pendingLimit - currentPending);
  const limitUsagePercentage = pendingLimit > 0 ? (currentPending / pendingLimit) * 100 : 0;

  // Get all payments across all orders for timeline
  const { data: allPayments } = await supabase
    .from("payments")
    .select(`
      *,
      order:orders!order_id (
        order_number,
        total_amount
      ),
      recorded_by_user:recorded_by (
        full_name,
        email,
        role
      )
    `)
    .in("order_id", orders?.map(o => o.id) || [])
    .order("created_at", { ascending: false });

  return {
    user,
    orders,
    allPayments: allPayments || [],
    financialSummary: {
      totalLifetimeValue,
      totalPaid,
      currentPending,
      pendingLimit,
      remainingLimit,
      limitUsagePercentage,
      status: limitUsagePercentage >= 100 ? 'exceeded' : limitUsagePercentage >= 80 ? 'warning' : 'safe'
    }
  };
}

export async function getAllSalesmen() {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable");

  console.log("Fetching all salesmen...");

  const { data, error } = await supabase
    .from("users")
    .select(`
      id,
      full_name,
      email,
      phone,
      created_at,
      salesman_brands!salesman_brands_salesman_id_fkey (
        id,
        brand:brands (
          id,
          name,
          logo_url
        )
      ),
      orders!recorded_by (
        id,
        total_amount,
        created_at
      )
    `)
    .eq("role", "salesman")
    .order("full_name", { ascending: true });

  if (error) {
    console.error("Error fetching salesmen:", error);
    throw new Error(error.message);
  }

  console.log(`Found ${data?.length || 0} salesmen:`, data);

  return data;
}

export async function updateSalesman(userId: string, updates: { full_name?: string; phone?: string; password?: string }) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable");

  // Update profile
  const { error: profileError } = await supabase
    .from("users")
    .update({
      full_name: updates.full_name,
      phone: updates.phone,
    })
    .eq("id", userId);

  if (profileError) throw profileError;

  // Update password if provided
  if (updates.password) {
    const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
      password: updates.password,
    });
    if (authError) throw authError;
  }

  return { success: true };
}

export async function getSalesmanClients(salesmanId: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable");

  const { data, error } = await supabase
    .from("users")
    .select(`
      id,
      full_name,
      email,
      phone,
      role,
      pending_amount_limit,
      created_at
    `)
    .eq("assigned_salesman_id", salesmanId)
    .in("role", ["beauty_parlor", "retailer"])
    .order("full_name", { ascending: true });

  if (error) throw new Error(error.message);


  return data;
}

export async function getAllBrands() {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable");

  const { data, error } = await supabase
    .from("brands")
    .select("id, name, logo_url, is_active")
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("Error fetching brands:", error);
    throw new Error(error.message);
  }

  return data || [];
}

export async function createSalesman(userData: {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}) {
  await checkPermissions(['admin']);

  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable");

  console.log("Creating salesman auth user...");
  let userId = "";

  // 1. Try to create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: userData.email,
    password: userData.password,
    email_confirm: true,
    user_metadata: { full_name: userData.full_name }
  });

  if (authError) {
    // Handle "User already registered" case (Orphan repair)
    if (authError.message.includes("already registered") || authError.status === 422) {
      console.log("User already exists in Auth, checking profile...");
      
      const { data: existingUser } = await supabase
        .from("users")
        .select("id, role")
        .eq("email", userData.email)
        .single();

      if (existingUser) {
        throw new Error(`This email is already registered to an existing user with role: ${existingUser.role}`);
      } else {
        // Orphan repair
        const { data: usersList } = await supabase.auth.admin.listUsers();
        const targetUser = usersList.users.find(u => u.email === userData.email);
        
        if (targetUser) {
          console.log("Found orphan auth user:", targetUser.id);
          userId = targetUser.id;
          await supabase.auth.admin.updateUserById(userId, { password: userData.password });
        } else {
          throw authError;
        }
      }
    } else {
      throw authError; // Real error
    }
  } else {
    userId = authData.user.id;
  }

  // 2. Create or Update user profile
  const { error: profileError } = await supabase
    .from("users")
    .upsert({
      id: userId,
      email: userData.email,
      full_name: userData.full_name,
      phone: userData.phone || null,
      role: "salesman",
    });

  if (profileError) {
    console.error("Profile creation error:", profileError);
    if (profileError.message.includes("invalid input value for enum user_role")) {
      throw new Error("Database error: 'salesman' role missing. Please execute migrations.");
    }
    throw profileError;
  }

  revalidatePath("/admin/users");
  return { success: true, userId };
}

export async function getConsolidatedPendingPaymentsAction() {
  await checkPermissions(['admin', 'sub_admin']);

  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable");

  // Fetch orders with pending balance
  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      id,
      order_number,
      total_amount,
      paid_amount,
      pending_amount,
      status,
      created_at,
      payment_status,
      user:user_id (
        id,
        full_name,
        role,
        email
      ),
      recorded_by_user:recorded_by (
        id,
        full_name,
        role
      )
    `)
    .gt("pending_amount", 0)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return orders;
}

export async function getSalesmenPerformanceAction() {
  await checkPermissions(['admin', 'sub_admin']);

  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable");

  // 1. Fetch all salesmen
  const { data: salesmen, error: sErr } = await supabase
    .from("users")
    .select("id, full_name, email, phone, created_at")
    .eq("role", "salesman")
    .order("full_name");

  if (sErr) throw new Error(sErr.message);

  // 2. Fetch all orders recorded by salesmen to aggregate data
  // We'll process this in-memory for precise counts
  const { data: orders, error: oErr } = await supabase
    .from("orders")
    .select(`
      id,
      total_amount,
      paid_amount,
      pending_amount,
      created_at,
      recorded_by,
      user_id,
      users:user_id (full_name)
    `)
    .not("recorded_by", "is", null);

  if (oErr) throw new Error(oErr.message);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const performanceData = salesmen.map(salesman => {
    const salesmanOrders = orders.filter(o => o.recorded_by === salesman.id);
    
    // Unique Shops (Order-based)
    const shopsMap = new Map();
    salesmanOrders.forEach(o => {
      if (!shopsMap.has(o.user_id)) {
        const userObj = Array.isArray(o.users) ? o.users[0] : o.users;
        shopsMap.set(o.user_id, {
          id: o.user_id,
          name: (userObj as any)?.full_name || "Unknown Shop",
          orderCount: 0,
          totalSales: 0,
          totalPending: 0
        });
      }
      const shop = shopsMap.get(o.user_id);
      shop.orderCount++;
      shop.totalSales += Number(o.total_amount) || 0;
      shop.totalPending += Number(o.pending_amount) || 0;
    });

    const totalSales = salesmanOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
    const totalCollected = salesmanOrders.reduce((sum, o) => sum + (Number(o.paid_amount) || 0), 0);
    const totalPending = salesmanOrders.reduce((sum, o) => sum + (Number(o.pending_amount) || 0), 0);
    const todayOrders = salesmanOrders.filter(o => new Date(o.created_at) >= today).length;

    return {
      ...salesman,
      stats: {
        totalSales,
        totalCollected,
        totalPending,
        todayOrders,
        orderCount: salesmanOrders.length,
        shopCount: shopsMap.size
      },
      shops: Array.from(shopsMap.values()).sort((a, b) => b.totalSales - a.totalSales)
    };
  });

  return performanceData;
}
