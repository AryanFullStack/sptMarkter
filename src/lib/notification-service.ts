"use server";

import { createClient } from "@/supabase/server";
import { CreateNotificationParams, NotificationFilters, Notification } from "@/types/notifications";
import { UserRole } from "@/lib/rbac";

/**
 * Create a notification for one or more users
 * 
 * @param params Notification parameters
 * @returns Success status and notification ID(s)
 */
export async function createNotification(params: CreateNotificationParams) {
  const supabase = await createClient();

  try {
    // If targeting by role, get all users with that role
    if (params.role && !params.user_id) {
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id")
        .eq("role", params.role)
        .eq("approved", true); // Only send to approved users

      if (usersError) {
        console.error("Error fetching users by role:", usersError);
        return { success: false, error: usersError.message };
      }

      if (!users || users.length === 0) {
        return { success: true, count: 0, message: "No users found with that role" };
      }

      // Create notification for each user
      const notifications = users.map(user => ({
        user_id: user.id,
        role: params.role,
        title: params.title,
        message: params.message,
        event_type: params.event_type,
        related_order_id: params.related_order_id || null,
        related_user_id: params.related_user_id || null,
        data: params.data || null,
      }));

      const { error: insertError, data } = await supabase
        .from("notifications")
        .insert(notifications)
        .select();

      if (insertError) {
        console.error("Error creating notifications:", insertError);
        return { success: false, error: insertError.message };
      }

      return { success: true, count: data?.length || 0, notifications: data };
    }

    // Create notification for a specific user
    if (params.user_id) {
      const { error: insertError, data } = await supabase
        .from("notifications")
        .insert({
          user_id: params.user_id,
          role: params.role || null,
          title: params.title,
          message: params.message,
          event_type: params.event_type,
          related_order_id: params.related_order_id || null,
          related_user_id: params.related_user_id || null,
          data: params.data || null,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating notification:", insertError);
        return { success: false, error: insertError.message };
      }

      return { success: true, notification: data };
    }

    return { success: false, error: "Either user_id or role must be provided" };
  } catch (error: any) {
    console.error("Unexpected error creating notification:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Create notifications for multiple specific users
 */
export async function createNotificationsForUsers(
  userIds: string[],
  params: Omit<CreateNotificationParams, 'user_id' | 'role'>
) {
  const supabase = await createClient();

  try {
    const notifications = userIds.map(userId => ({
      user_id: userId,
      title: params.title,
      message: params.message,
      event_type: params.event_type,
      related_order_id: params.related_order_id || null,
      related_user_id: params.related_user_id || null,
      data: params.data || null,
    }));

    const { error, data } = await supabase
      .from("notifications")
      .insert(notifications)
      .select();

    if (error) {
      console.error("Error creating notifications:", error);
      return { success: false, error: error.message };
    }

    return { success: true, count: data?.length || 0, notifications: data };
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("notifications")
      .update({ read_status: true })
      .eq("id", notificationId);

    if (error) {
      console.error("Error marking notification as read:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Mark all notifications as read for the current user
 */
export async function markAllNotificationsAsRead() {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const { error } = await supabase
      .from("notifications")
      .update({ read_status: true })
      .eq("user_id", user.id)
      .eq("read_status", false);

    if (error) {
      console.error("Error marking all notifications as read:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get notifications for the current user
 */
export async function getNotifications(filters: NotificationFilters = {}) {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Unauthorized", notifications: [] };
    }

    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Apply filters
    if (filters.read_status !== undefined) {
      query = query.eq("read_status", filters.read_status);
    }

    if (filters.event_type) {
      query = query.eq("event_type", filters.event_type);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching notifications. Code:", error.code, "Message:", error.message, "Details:", error.details);
      return { success: false, error: error.message, notifications: [] };
    }

    // console.log(`Fetched ${data?.length} notifications for user ${user.id}`);
    return { success: true, notifications: data as Notification[] };
  } catch (error: any) {
    console.error("Unexpected error in getNotifications:", error);
    return { success: false, error: error.message, notifications: [] };
  }
}

/**
 * Get unread notification count for the current user
 */
export async function getUnreadNotificationCount() {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Unauthorized", count: 0 };
    }

    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: 'exact', head: true })
      .eq("user_id", user.id)
      .eq("read_status", false);

    if (error) {
      console.error("Error fetching unread count:", error);
      return { success: false, error: error.message, count: 0 };
    }

    return { success: true, count: count || 0 };
  } catch (error: any) {
    console.error("Unexpected error in getUnreadCount:", error);
    return { success: false, error: error.message, count: 0 };
  }
}

/**
 * Delete old notifications (cleanup utility)
 * @param daysOld Delete notifications older than this many days
 */
export async function deleteOldNotifications(daysOld: number = 90) {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", user.id)
      .lt("created_at", cutoffDate.toISOString());

    if (error) {
      console.error("Error deleting old notifications:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Notify all admins
 */
export async function notifyAdmins(
  params: Omit<CreateNotificationParams, 'user_id' | 'role'>
) {
  return createNotification({
    ...params,
    role: 'admin',
  });
}

/**
 * Notify all sub-admins
 */
export async function notifySubAdmins(
  params: Omit<CreateNotificationParams, 'user_id' | 'role'>
) {
  return createNotification({
    ...params,
    role: 'sub_admin',
  });
}

/**
 * Notify admins and sub-admins
 */
export async function notifyAdminStaff(
  params: Omit<CreateNotificationParams, 'user_id' | 'role'>
) {
  const adminResult = await notifyAdmins(params);
  const subAdminResult = await notifySubAdmins(params);
  
  return {
    success: adminResult.success && subAdminResult.success,
    adminCount: (adminResult as any).count || 0,
    subAdminCount: (subAdminResult as any).count || 0,
  };
}
