"use server";

import { createAdminClient } from "@/supabase/admin";
import { revalidatePath } from "next/cache";

export async function getUserCredit(userId: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable");

  try {
    const { data, error } = await supabase
      .from("user_credits")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching user credit:", error);
      return { success: false, error: "Failed to fetch user credit" };
    }

    // If no record found, return default zero balance
    return { 
      success: true,
      balance: data || { user_id: userId, balance: 0, used_credit: 0, pending_credit: 0 } 
    };
  } catch (error: any) {
    console.error("getUserCredit Error:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

export async function getCreditTransactions(userId: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Admin client unavailable");

  try {
    const { data, error } = await supabase
      .from("credit_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching credit transactions:", error);
      return { success: false, error: "Failed to fetch credit transactions" };
    }

    return { success: true, transactions: data || [] };
  } catch (error: any) {
    console.error("getCreditTransactions Error:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

export async function updateUserCredit(
  userId: string, 
  amount: number, 
  type: "add" | "deduct" | "adjustment", 
  description: string,
  performedBy: string
) {
  try {
    const supabase = createAdminClient();
    if (!supabase) throw new Error("Admin client unavailable");

    // 1. Get current balance
    const { data: credit, error: fetchError } = await supabase
      .from("user_credits")
      .select("*")
      .eq("user_id", userId)
      .single();

    let currentBalance = 0;
    let currentUsed = 0;

    if (fetchError && fetchError.code !== "PGRST116") {
      throw fetchError;
    }

    if (credit) {
      currentBalance = Number(credit.balance);
      currentUsed = Number(credit.used_credit);
    }

    // 2. Calculate new balance
    let newBalance = currentBalance;
    let transAmount = amount;

    if (type === "add") {
      newBalance += amount;
    } else if (type === "deduct") {
      newBalance -= amount;
    } else if (type === "adjustment") {
      newBalance = amount; // In adjustment, amount IS the new balance
      transAmount = amount - currentBalance;
    }

    // 3. Update or Insert
    const { error: updateError } = await supabase
      .from("user_credits")
      .upsert({
        user_id: userId,
        balance: newBalance,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (updateError) {
      console.error("Failed to update credit:", updateError);
      return { success: false, error: "Failed to update credit balance" };
    }

    // 4. Log Transaction
    const { error: transError } = await supabase
      .from("credit_transactions")
      .insert({
        user_id: userId,
        amount: transAmount,
        type: type === "add" ? "deposit" : type === "deduct" ? "usage" : "adjustment",
        description,
        performed_by: performedBy
      });

    if (transError) {
      console.error("Failed to log credit transaction:", transError);
      // We don't return error here because the balance was updated successfully
    }

    revalidatePath("/admin/users");
    return { success: true, newBalance };
  } catch (error: any) {
    console.error("updateUserCredit Error:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}
