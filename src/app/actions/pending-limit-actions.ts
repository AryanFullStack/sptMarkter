"use server";

import { createAdminClient } from "@/supabase/admin";
import { createClient } from "@/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Get pending limit information for a user
 * @param userId - User ID to check
 * @returns Object with limit, current pending, and remaining allowed
 */
export async function getPendingLimitInfo(userId: string) {
  const supabase = createAdminClient();

  // Get user's pending limit
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("pending_amount_limit, role")
    .eq("id", userId)
    .single();

  if (userError) {
    console.error("Error fetching user pending limit:", userError);
    return { error: "Failed to fetch user data" };
  }

  // Calculate current pending amount from orders
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("pending_amount")
    .eq("user_id", userId)
    .neq("payment_status", "paid")
    .neq("status", "cancelled");

  if (ordersError) {
    console.error("Error fetching orders:", ordersError);
    return { error: "Failed to fetch orders" };
  }

  const currentPending = orders?.reduce(
    (sum, order) => sum + Number(order.pending_amount || 0),
    0
  ) || 0;

  const limit = Number(user.pending_amount_limit || 0);
  const remaining = Math.max(0, limit - currentPending);

  return {
    pendingAmountLimit: limit,
    currentPending,
    remainingAllowed: remaining,
    role: user.role,
  };
}

/**
 * Update pending amount limit for a user (Admin only)
 * @param userId - User ID to update
 * @param newLimit - New pending amount limit
 */
export async function updatePendingLimit(userId: string, newLimit: number) {
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  // Verify admin role
  const supabaseAdmin = createAdminClient();
  const { data: userData } = await supabaseAdmin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userData?.role !== "admin") {
    return { error: "Unauthorized: Admin access required" };
  }

  // Validate limit
  if (newLimit < 0) {
    return { error: "Limit cannot be negative" };
  }

  // Update the limit
  const { error: updateError } = await supabaseAdmin
    .from("users")
    .update({ pending_amount_limit: newLimit })
    .eq("id", userId);

  if (updateError) {
    console.error("Error updating pending limit:", updateError);
    return { error: "Failed to update limit: " + updateError.message };
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Validate if a checkout can proceed based on pending limit
 * @param userId - User ID making the purchase
 * @param orderTotal - Total order amount
 * @param paidAmount - Amount being paid now
 * @returns Validation result with error message if invalid
 */
export async function validateCheckoutPendingLimit(
  userId: string,
  orderTotal: number,
  paidAmount: number
) {
  const supabase = createAdminClient();

  // Get user info
  const { data: user } = await supabase
    .from("users")
    .select("pending_amount_limit, role")
    .eq("id", userId)
    .single();

  // Only validate for retailer and beauty_parlor roles
  if (!user || (user.role !== "retailer" && user.role !== "beauty_parlor")) {
    return { valid: true };
  }

  const newPending = orderTotal - paidAmount;

  // If paying in full, no limit check needed
  if (newPending <= 0) {
    return { valid: true };
  }

  // Get current pending amount
  const limitInfo = await getPendingLimitInfo(userId);
  
  if (limitInfo.error) {
    return { valid: false, error: limitInfo.error };
  }

  const totalPendingAfterOrder = limitInfo.currentPending + newPending;
  const limit = limitInfo.pendingAmountLimit;

  if (totalPendingAfterOrder > limit) {
    return {
      valid: false,
      error: `Pending amount limit exceeded. Current pending: ₹${limitInfo.currentPending.toLocaleString()}, New order pending: ₹${newPending.toLocaleString()}, Limit: ₹${limit.toLocaleString()}. Please pay the full amount or reduce pending orders.`,
      currentPending: limitInfo.currentPending,
      newPending,
      limit,
      totalAfter: totalPendingAfterOrder,
    };
  }

  return { valid: true };
}
