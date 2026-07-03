"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentBusinessSlug } from "@/lib/business-context";

export type ActivityLogRow = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type ActivityLogsState = {
  success: boolean;
  message?: string;
  business: { id: string; name: string; slug: string } | null;
  logs: ActivityLogRow[];
  pagination: {
    limit: number;
    offset: number;
    filteredTotal: number;
    hasMore: boolean;
  };
};

export async function getActivityLogs(input: {
  search?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<ActivityLogsState> {
  const supabase = createSupabaseAdminClient();
  const businessSlug = await getCurrentBusinessSlug();

  const { data, error } = await supabase.rpc("admin_get_activity_logs_fast", {
    p_slug: businessSlug,
    p_search: input.search?.trim() || null,
    p_limit: input.limit ?? 50,
    p_offset: input.offset ?? 0,
  });

  if (error) {
    return {
      success: false,
      message: error.message,
      business: null,
      logs: [],
      pagination: { limit: 50, offset: 0, filteredTotal: 0, hasMore: false },
    };
  }

  return data as ActivityLogsState;
}
