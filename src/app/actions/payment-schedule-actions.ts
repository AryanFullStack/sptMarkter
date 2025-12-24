"use server";

import { createClient } from "@/supabase/server";
import { createAdminClient } from "@/supabase/admin";
import { revalidatePath } from "next/cache";

/**
 * Collect initial payment for an order
 * Only admin, sub-admin, or assigned salesman can collect
 */
export async function collectInitialPayment(orderId: string) {
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const supabase = createAdminClient();
  if (!supabase) return { error: "Server configuration error" };

  // Get user role
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const userRole = userData?.role || "";

  // Get order details
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, user_id, initial_payment_required, initial_payment_status, recorded_by, total_amount")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return { error: "Order not found" };
  }

  // Check if initial payment is set
  if (!order.initial_payment_required || order.initial_payment_required === 0) {
    return { error: "No initial payment was set for this order" };
  }

  // Check if already collected
  if (order.initial_payment_status === "collected") {
    return { error: "Initial payment has already been collected" };
  }

  // Permission check
  const isAdmin = ["admin", "sub_admin"].includes(userRole);
  const isSalesman = userRole === "salesman" && order.recorded_by === user.id;

  if (!isAdmin && !isSalesman) {
    return { error: "Unauthorized: Only admin, sub-admin, or the assigned salesman can collect payments" };
  }

  // Update initial payment status
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      initial_payment_status: "collected",
      updated_at: new Date().toISOString()
    })
    .eq("id", orderId);

  if (updateError) {
    console.error("Error updating initial payment status:", updateError);
    return { error: "Failed to update payment status" };
  }

  // Record payment in payments table
  const { error: paymentError } = await supabase
    .from("payments")
    .insert({
      order_id: orderId,
      amount: order.initial_payment_required,
      payment_method: "cash",
      recorded_by: user.id,
      notes: "Initial payment collected on delivery",
      status: "completed"
    });

  if (paymentError) {
    console.error("Error recording payment:", paymentError);
    return { error: "Payment status updated but failed to record payment transaction" };
  }

  // Database triggers will auto-update paid_amount, pending_amount, and payment_status

  revalidatePath("/admin");
  revalidatePath("/salesman");
  revalidatePath("/dashboard");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/payment-schedule");

  return { success: true };
}

/**
 * Set payment due date for an order
 * Can set either initial_payment_due_date or pending_payment_due_date
 */
export async function setPaymentDueDate(
  orderId: string,
  dueDate: string,
  paymentType: "initial" | "pending"
) {
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const supabase = createAdminClient();
  if (!supabase) return { error: "Server configuration error" };

  // Get user role
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const userRole = userData?.role || "";

  // Get order details
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, user_id, order_number, initial_payment_required, pending_amount, recorded_by")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return { error: "Order not found" };
  }

  // Permission check
  const isAdmin = ["admin", "sub_admin"].includes(userRole);
  const isSalesman = userRole === "salesman" && order.recorded_by === user.id;

  if (!isAdmin && !isSalesman) {
    return { error: "Unauthorized: Only admin, sub-admin, or the assigned salesman can set due dates" };
  }

  // Validate due date
  const dueDateObj = new Date(dueDate);
  if (isNaN(dueDateObj.getTime())) {
    return { error: "Invalid due date format" };
  }

  // Determine which field to update
  const fieldToUpdate = paymentType === "initial" ? "initial_payment_due_date" : "pending_payment_due_date";
  const amount = paymentType === "initial" ? order.initial_payment_required : order.pending_amount;

  // Update order due date
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      [fieldToUpdate]: dueDate,
      updated_at: new Date().toISOString()
    })
    .eq("id", orderId);

  if (updateError) {
    console.error("Error setting due date:", updateError);
    return { error: "Failed to set due date" };
  }

  // Create payment reminder for the customer
  const reminderType = paymentType === "initial" ? "initial_due" : "pending_due";
  
  const { error: reminderError } = await supabase
    .from("payment_reminders")
    .insert({
      order_id: orderId,
      user_id: order.user_id,
      reminder_type: reminderType,
      due_date: dueDate,
      amount: amount
    });

  if (reminderError) {
    console.error("Error creating reminder:", reminderError);
    // Don't fail the operation if reminder creation fails
  }

  revalidatePath("/admin");
  revalidatePath("/salesman");
  revalidatePath("/dashboard");

  return { success: true };
}

/**
 * Get upcoming payments (orders with due dates approaching)
 */
export async function getUpcomingPayments(userId?: string, userRole?: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable");

  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30); // Next 30 days

  let query = supabase
    .from("orders")
    .select(`
      id,
      order_number,
      user_id,
      total_amount,
      paid_amount,
      pending_amount,
      initial_payment_required,
      initial_payment_status,
      initial_payment_due_date,
      pending_payment_due_date,
      created_via,
      recorded_by,
      user:user_id (id, full_name, email, role)
    `)
    .or(`initial_payment_due_date.lte.${futureDate.toISOString()},pending_payment_due_date.lte.${futureDate.toISOString()}`)
    .order("initial_payment_due_date", { ascending: true, nullsFirst: false });

  // Filter by role
  if (userId && userRole === "salesman") {
    // Salesmen see only their recorded orders
    query = query.eq("recorded_by", userId);
  } else if (userId && (userRole === "retailer" || userRole === "beauty_parlor")) {
    // Retailers/Parlors see only their own orders
    query = query.eq("user_id", userId);
  }
  // Admin/Sub-admin see all (no additional filter)

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching upcoming payments:", error);
    return { error: "Failed to fetch upcoming payments" };
  }

  return { payments: data };
}

/**
 * Get overdue payments
 */
export async function getOverduePayments(userId?: string, userRole?: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable");

  const today = new Date().toISOString();

  let query = supabase
    .from("orders")
    .select(`
      id,
      order_number,
      user_id,
      total_amount,
      paid_amount,
      pending_amount,
      initial_payment_required,
      initial_payment_status,
      initial_payment_due_date,
      pending_payment_due_date,
      created_via,
      recorded_by,
      user:user_id (id, full_name, email, role)
    `)
    .or(`and(initial_payment_due_date.lt.${today},initial_payment_status.eq.not_collected),pending_payment_due_date.lt.${today}`)
    .neq("payment_status", "paid");

  // Filter by role
  if (userId && userRole === "salesman") {
    query = query.eq("recorded_by", userId);
  } else if (userId && (userRole === "retailer" || userRole === "beauty_parlor")) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching overdue payments:", error);
    return { error: "Failed to fetch overdue payments" };
  }

  return { payments: data };
}

/**
 * Get payment reminders for a user based on their role
 */
export async function getPaymentReminders(userId: string, userRole: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable");

  let query = supabase
    .from("payment_reminders")
    .select(`
      id,
      order_id,
      reminder_type,
      due_date,
      amount,
      is_seen,
      is_acknowledged,
      created_at,
      order:order_id (
        id,
        order_number,
        user_id,
        total_amount,
        user:user_id (full_name)
      )
    `)
    .eq("is_acknowledged", false)
    .order("due_date", { ascending: true });

  // Filter based on role
  if (userRole === "retailer" || userRole === "beauty_parlor") {
    // Customers see only their own reminders
    query = query.eq("user_id", userId);
  } else if (userRole === "salesman") {
    // Salesmen see reminders for orders they created
    const { data: salesmanOrders } = await supabase
      .from("orders")
      .select("id")
      .eq("recorded_by", userId);
    
    const orderIds = salesmanOrders?.map(o => o.id) || [];
    if (orderIds.length > 0) {
      query = query.in("order_id", orderIds);
    } else {
      return { reminders: [] };
    }
  }
  // Admin/Sub-admin see all reminders (no additional filter)

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching reminders:", error);
    return { error: "Failed to fetch reminders" };
  }

  return { reminders: data };
}

/**
 * Mark a reminder as seen
 */
export async function markReminderAsSeen(reminderId: string) {
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const supabase = createAdminClient();
  if (!supabase) return { error: "Server configuration error" };

  const { error } = await supabase
    .from("payment_reminders")
    .update({
      is_seen: true,
      seen_at: new Date().toISOString()
    })
    .eq("id", reminderId);

  if (error) {
    console.error("Error marking reminder as seen:", error);
    return { error: "Failed to update reminder" };
  }

  return { success: true };
}

/**
 * Acknowledge a reminder (dismiss it)
 */
export async function acknowledgeReminder(reminderId: string) {
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const supabase = createAdminClient();
  if (!supabase) return { error: "Server configuration error" };

  const { error } = await supabase
    .from("payment_reminders")
    .update({
      is_acknowledged: true,
      acknowledged_at: new Date().toISOString()
    })
    .eq("id", reminderId);

  if (error) {
    console.error("Error acknowledging reminder:", error);
    return { error: "Failed to acknowledge reminder" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/admin");
  revalidatePath("/salesman");

  return { success: true };
}

/**
 * Get orders with uncollected initial payments
 */
export async function getUncollectedInitialPayments(userId?: string, userRole?: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable");

  let query = supabase
    .from("orders")
    .select(`
      id,
      order_number,
      user_id,
      total_amount,
      initial_payment_required,
      initial_payment_status,
      initial_payment_due_date,
      created_at,
      recorded_by,
      user:user_id (id, full_name, email, role)
    `)
    .eq("initial_payment_status", "not_collected")
    .not("initial_payment_required", "is", null)
    .order("created_at", { ascending: false });

  // Filter by role
  if (userId && userRole === "salesman") {
    query = query.eq("recorded_by", userId);
  }
  // Admin/Sub-admin see all

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching uncollected payments:", error);
    return { error: "Failed to fetch uncollected payments" };
  }

  return { orders: data };
}
