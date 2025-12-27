import { NotificationEventType } from "@/types/notifications";
import {
  ShoppingCart,
  DollarSign,
  User,
  AlertCircle,
  CheckCircle,
  UserPlus,
  UserCog,
  Tag,
  TrendingDown,
  Package,
  Bell,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

/**
 * Get the appropriate icon for a notification event type
 */
export function getNotificationIcon(eventType: NotificationEventType) {
  const iconMap: Record<NotificationEventType, any> = {
    order_created: ShoppingCart,
    order_status_updated: Package,
    payment_received: DollarSign,
    payment_updated: DollarSign,
    payment_due_soon: Clock,
    payment_overdue: AlertCircle,
    pending_limit_exceeded: AlertCircle,
    pending_limit_warning: AlertCircle,
    salesman_assigned: UserPlus,
    salesman_unassigned: User,
    user_registered: UserPlus,
    user_approved: CheckCircle,
    user_role_updated: UserCog,
    user_suspended: AlertCircle,
    deal_applied: Tag,
    discount_applied: Tag,
    stock_low: TrendingDown,
    stock_out: AlertCircle,
  };

  return iconMap[eventType] || Bell;
}

/**
 * Get icon color class for notification event type
 */
export function getNotificationIconColor(eventType: NotificationEventType): string {
  const colorMap: Record<NotificationEventType, string> = {
    order_created: "text-blue-600",
    order_status_updated: "text-blue-500",
    payment_received: "text-green-600",
    payment_updated: "text-green-500",
    payment_due_soon: "text-yellow-600",
    payment_overdue: "text-red-600",
    pending_limit_exceeded: "text-red-600",
    pending_limit_warning: "text-orange-600",
    salesman_assigned: "text-purple-600",
    salesman_unassigned: "text-gray-600",
    user_registered: "text-blue-600",
    user_approved: "text-green-600",
    user_role_updated: "text-purple-600",
    user_suspended: "text-red-600",
    deal_applied: "text-green-600",
    discount_applied: "text-green-600",
    stock_low: "text-orange-600",
    stock_out: "text-red-600",
  };

  return colorMap[eventType] || "text-gray-600";
}

/**
 * Format timestamp to relative time (e.g., "5 minutes ago")
 */
export function getRelativeTime(timestamp: string): string {
  try {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  } catch (error) {
    return timestamp;
  }
}

/**
 * Get navigation link for a notification based on its type and related entities
 */
export function getNotificationLink(notification: {
  event_type: NotificationEventType;
  related_order_id?: string | null;
  related_user_id?: string | null;
  data?: Record<string, any> | null;
}): string | null {
  // Order-related notifications
  if (
    notification.event_type.startsWith('order_') ||
    notification.event_type.startsWith('payment_')
  ) {
    if (notification.related_order_id) {
      return `/orders/${notification.related_order_id}`;
    }
  }

  // User-related notifications
  if (notification.event_type.startsWith('user_')) {
    if (notification.related_user_id) {
      return `/admin/users/${notification.related_user_id}`;
    }
  }

  // Salesman-related notifications
  if (notification.event_type.startsWith('salesman_')) {
    if (notification.data?.shop_id) {
      return `/salesman/shop/${notification.data.shop_id}`;
    }
  }

  // Default fallback
  return null;
}

/**
 * Play notification sound
 */
export function playNotificationSound() {
  try {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.5; // Set to 50% volume
    audio.play().catch((error) => {
      // Silently fail if autoplay is blocked
      console.warn('Notification sound blocked by browser:', error);
    });
  } catch (error) {
    console.warn('Error playing notification sound:', error);
  }
}

/**
 * Get badge variant for notification priority
 */
export function getNotificationPriority(eventType: NotificationEventType): 'default' | 'warning' | 'error' {
  const highPriority: NotificationEventType[] = [
    'payment_overdue',
    'pending_limit_exceeded',
    'stock_out',
    'user_suspended',
  ];

  const mediumPriority: NotificationEventType[] = [
    'payment_due_soon',
    'pending_limit_warning',
    'stock_low',
  ];

  if (highPriority.includes(eventType)) return 'error';
  if (mediumPriority.includes(eventType)) return 'warning';
  return 'default';
}
