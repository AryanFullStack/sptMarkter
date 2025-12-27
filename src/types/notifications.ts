/**
 * Notification event types
 * Must match the notification_event_type enum in the database
 */
export type NotificationEventType =
  // Order events
  | 'order_created'
  | 'order_status_updated'
  
  // Payment events
  | 'payment_received'
  | 'payment_updated'
  | 'payment_due_soon'
  | 'payment_overdue'
  
  // Credit limit events
  | 'pending_limit_exceeded'
  | 'pending_limit_warning'
  
  // Salesman events
  | 'salesman_assigned'
  | 'salesman_unassigned'
  
  // User management events
  | 'user_registered'
  | 'user_approved'
  | 'user_role_updated'
  | 'user_suspended'
  
  // Deal/discount events
  | 'deal_applied'
  | 'discount_applied'
  
  // Inventory events
  | 'stock_low'
  | 'stock_out';

export interface Notification {
  id: string;
  user_id: string;
  role?: string | null;
  title: string;
  message: string;
  event_type: NotificationEventType;
  related_order_id?: string | null;
  related_user_id?: string | null;
  data?: Record<string, any> | null;
  read_status: boolean;
  read_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationParams {
  user_id?: string; // If not provided, will be derived from role
  role?: string; // Target all users with this role
  title: string;
  message: string;
  event_type: NotificationEventType;
  related_order_id?: string;
  related_user_id?: string;
  data?: Record<string, any>;
}

export interface NotificationFilters {
  read_status?: boolean;
  event_type?: NotificationEventType;
  limit?: number;
  offset?: number;
}
