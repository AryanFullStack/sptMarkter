"use server";

import { createNotification, notifyAdmins } from "@/lib/notification-service";
import { createAdminClient } from "@/supabase/admin";

/**
 * Trigger notification when a new order is created
 */
export async function notifyOrderCreated(orderId: string, clientId: string, salesmanId: string, orderNumber: string, totalAmount: number) {
  try {
    const supabase = createAdminClient();
    if (!supabase) return;

    // Get client and salesman details
    const [{ data: clientData }, { data: salesmanData }] = await Promise.all([
      supabase.from("users").select("full_name, email").eq("id", clientId).single(),
      supabase.from("users").select("full_name, email").eq("id", salesmanId).single(),
    ]);

    // Notify the customer
    if (clientData) {
      await createNotification({
        user_id: clientId,
        title: "New Order Created",
        message: `Your order ${orderNumber} for Rs. ${totalAmount.toLocaleString()} has been created`,
        event_type: "order_created",
        related_order_id: orderId,
      });
    }

    // Notify admins
    await notifyAdmins({
      title: "New Order",
      message: `${salesmanData?.full_name || "Salesman"} created order ${orderNumber} for ${clientData?.full_name || "customer"} - Rs. ${totalAmount.toLocaleString()}`,
      event_type: "order_created",
      related_order_id: orderId,
    });
  } catch (error) {
    console.error("Error in notifyOrderCreated:", error);
  }
}

/**
 * Trigger notification when payment is due soon
 */
export async function notifyPaymentDueSoon(orderId: string, clientId: string, dueDate: string, pendingAmount: number) {
  try {
    const supabase = createAdminClient();
    if (!supabase) return;

    // Get order and client details
    const { data: orderData } = await supabase
      .from("orders")
      .select("order_number, recorded_by")
      .eq("id", orderId)
      .single();

    if (!orderData) return;

    // Notify the customer
    await createNotification({
      user_id: clientId,
      title: "Payment Due Soon",
      message: `Payment of Rs. ${pendingAmount.toLocaleString()} for order ${orderData.order_number} is due on ${new Date(dueDate).toLocaleDateString()}`,
      event_type: "payment_due_soon",
      related_order_id: orderId,
    });

    // Notify the salesman who created the order (if exists)
    if (orderData.recorded_by) {
      const { data: salesmanData } = await supabase
        .from("users")
        .select("role")
        .eq("id", orderData.recorded_by)
        .single();

      if (salesmanData?.role === "salesman") {
        await createNotification({
          user_id: orderData.recorded_by,
          title: "Client Payment Due Soon",
          message: `Payment for order ${orderData.order_number} is due on ${new Date(dueDate).toLocaleDateString()}`,
          event_type: "payment_due_soon",
          related_order_id: orderId,
        });
      }
    }
  } catch (error) {
    console.error("Error in notifyPaymentDueSoon:", error);
  }
}

/**
 * Trigger notification when payment is overdue
 */
export async function notifyPaymentOverdue(orderId: string, clientId: string, pendingAmount: number) {
  try {
    const supabase = createAdminClient();
    if (!supabase) return;

    const { data: orderData } = await supabase
      .from("orders")
      .select("order_number, recorded_by")
      .eq("id", orderId)
      .single();

    if (!orderData) return;

    // Notify the customer
    await createNotification({
      user_id: clientId,
      title: "Payment Overdue",
      message: `Payment of Rs. ${pendingAmount.toLocaleString()} for order ${orderData.order_number} is overdue!`,
      event_type: "payment_overdue",
      related_order_id: orderId,
    });

    // Notify admin
    await notifyAdmins({
      title: "Overdue Payment Alert",
      message: `Order ${orderData.order_number} has overdue payment of Rs. ${pendingAmount.toLocaleString()}`,
      event_type: "payment_overdue",
      related_order_id: orderId,
    });

    // Notify assigned salesman
    if (orderData.recorded_by) {
      await createNotification({
        user_id: orderData.recorded_by,
        title: "Client Payment Overdue",
        message: `Order ${orderData.order_number} payment is overdue - Rs. ${pendingAmount.toLocaleString()}`,
        event_type: "payment_overdue",
        related_order_id: orderId,
      });
    }
  } catch (error) {
    console.error("Error in notifyPaymentOverdue:", error);
  }
}

/**
 * Trigger notification when pending limit is exceeded
 */
export async function notifyPendingLimitExceeded(clientId: string, currentPending: number, limit: number) {
  try {
    const supabase = createAdminClient();
    if (!supabase) return;

    const { data: clientData } = await supabase
      .from("users")
      .select("full_name, email, assigned_salesman_id")
      .eq("id", clientId)
      .single();

    if (!clientData) return;

    // Notify the customer
    await createNotification({
      user_id: clientId,
      title: "Pending Limit Exceeded",
      message: `Your pending amount Rs. ${currentPending.toLocaleString()} has exceeded the limit of Rs. ${limit.toLocaleString()}. Please clear pending payments to place new orders.`,
      event_type: "pending_limit_exceeded",
    });

    // Notify admins
    await notifyAdmins({
      title: "Client Limit Exceeded",
      message: `${clientData.full_name || clientData.email} has exceeded pending limit - Rs. ${currentPending.toLocaleString()} / Rs. ${limit.toLocaleString()}`,
      event_type: "pending_limit_exceeded",
      related_user_id: clientId,
    });

    // Notify assigned salesman
    if (clientData.assigned_salesman_id) {
      await createNotification({
        user_id: clientData.assigned_salesman_id,
        title: "Client Limit Exceeded",
        message: `${clientData.full_name || clientData.email} has exceeded their pending limit`,
        event_type: "pending_limit_exceeded",
        related_user_id: clientId,
      });
    }
  } catch (error) {
    console.error("Error in notifyPendingLimitExceeded:", error);
  }
}

/**
 * Trigger notification when pending limit warning (80% threshold)
 */
export async function notifyPendingLimitWarning(clientId: string, currentPending: number, limit: number) {
  try {
    await createNotification({
      user_id: clientId,
      title: "Pending Limit Warning",
      message: `Your pending amount Rs. ${currentPending.toLocaleString()} is approaching the limit of Rs. ${limit.toLocaleString()}`,
      event_type: "pending_limit_warning",
    });
  } catch (error) {
    console.error("Error in notifyPendingLimitWarning:", error);
  }
}
