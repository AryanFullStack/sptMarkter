"use server";

import { createClient } from "@/supabase/server";

export async function getAuditLogsAction(filters?: {
  userId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  const supabase = await createClient();
  
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
