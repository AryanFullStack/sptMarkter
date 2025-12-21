import { createClient as createBrowserClient } from "@/supabase/client";
import { createClient as createServerClient } from "@/supabase/server";

export interface AuditLogEntry {
  action: string;
  entity_type: string;
  entity_id?: string;
  changes?: any;
  ip_address?: string;
}

/**
 * Logs an audit entry.
 * @param entry The audit log entry details.
 * @param customSupabase Optional Supabase client (e.g., admin client or a specific server client).
 */
export async function logAudit(entry: AuditLogEntry, customSupabase?: any) {
  let supabase = customSupabase;
  
  if (!supabase) {
    // Determine if we are on the server or browser
    if (typeof window === 'undefined') {
      supabase = await createServerClient();
    } else {
      supabase = createBrowserClient();
    }
  }
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error("Cannot log audit: No user authenticated");
    return null;
  }

  const { data, error } = await supabase
    .from("audit_logs")
    .insert({
      user_id: user.id,
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id,
      changes: entry.changes,
      ip_address: entry.ip_address,
    })
    .select()
    .single();

  if (error) {
    console.error("Audit log error:", error);
    return null;
  }

  return data;
}

export async function getAuditLogs(filters?: {
  userId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  const supabase = createBrowserClient();
  
  let query = supabase
    .from("audit_logs")
    .select(`
      *,
      users:user_id (
        full_name,
        email,
        role
      )
    `)
    .order("created_at", { ascending: false });

  if (filters?.userId) {
    query = query.eq("user_id", filters.userId);
  }
  if (filters?.entityType) {
    query = query.eq("entity_type", filters.entityType);
  }
  if (filters?.entityId) {
    query = query.eq("entity_id", filters.entityId);
  }
  if (filters?.action) {
    query = query.ilike("action", `%${filters.action}%`);
  }
  if (filters?.startDate) {
    query = query.gte("created_at", filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte("created_at", filters.endDate);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching audit logs:", error);
    return [];
  }

  return data || [];
}
