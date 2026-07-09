"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireCurrentBusinessSlug } from "@/lib/auth-session";
import { requireModulePermission } from "@/lib/user-permissions";

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

const modulePatterns: Record<string, string[]> = {
  finance: ["invoice", "finance", "cash", "closing", "supplier", "period"],
  feedback: ["feedback", "recovery", "question", "reward"],
  users: ["user", "permission", "role"],
  settings: ["setting", "template", "logo", "business"],
  loyalty: ["loyalty"],
  recipes: ["recipe", "ingredient", "preparation", "menu_item", "cost"],
  system: ["system", "login", "logout", "auth"],
};

const BUSINESS_UTC_OFFSET = "+04:00";

function nextCalendarDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return date;

  const value = new Date(Date.UTC(year, month - 1, day));
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10);
}

export async function getActivityLogs(
  input: {
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    module?: string;
    limit?: number;
    offset?: number;
  } = {},
): Promise<ActivityLogsState> {
  await requireModulePermission("activity_logs", "view");

  const supabase = createSupabaseAdminClient();
  const businessSlug = await requireCurrentBusinessSlug();
  const limit = Math.min(Math.max(input.limit ?? 25, 1), 100);
  const offset = Math.max(input.offset ?? 0, 0);

  const businessResult = await supabase
    .from("businesses")
    .select("id,name,slug")
    .eq("slug", businessSlug)
    .maybeSingle();

  if (businessResult.error || !businessResult.data) {
    return {
      success: false,
      message: businessResult.error?.message ?? "Business not found.",
      business: null,
      logs: [],
      pagination: { limit, offset, filteredTotal: 0, hasMore: false },
    };
  }

  let query = supabase
    .from("activity_logs")
    .select("id,action,entity_type,entity_id,metadata,created_at", { count: "exact" })
    .eq("business_id", businessResult.data.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const search = input.search?.trim();
  if (search) {
    const safe = search.replace(/[%,()]/g, " ").trim();
    if (safe) {
      query = query.or(
        `action.ilike.%${safe}%,entity_type.ilike.%${safe}%,entity_id.ilike.%${safe}%`,
      );
    }
  }

  if (input.dateFrom) {
    query = query.gte("created_at", `${input.dateFrom}T00:00:00${BUSINESS_UTC_OFFSET}`);
  }
  if (input.dateTo) {
    query = query.lt(
      "created_at",
      `${nextCalendarDate(input.dateTo)}T00:00:00${BUSINESS_UTC_OFFSET}`,
    );
  }

  const selectedModule = input.module?.trim();
  if (selectedModule && selectedModule !== "all") {
    const patterns = modulePatterns[selectedModule] ?? [selectedModule];
    const clauses = patterns.flatMap((pattern) => [
      `action.ilike.%${pattern}%`,
      `entity_type.ilike.%${pattern}%`,
    ]);
    query = query.or(clauses.join(","));
  }

  const result = await query;
  if (result.error) {
    return {
      success: false,
      message: result.error.message,
      business: businessResult.data,
      logs: [],
      pagination: { limit, offset, filteredTotal: 0, hasMore: false },
    };
  }

  const rows = (result.data ?? []).map((row) => ({
    id: row.id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    metadata: (row.metadata ?? null) as Record<string, unknown> | null,
    createdAt: row.created_at,
  }));
  const total = result.count ?? rows.length;

  return {
    success: true,
    business: businessResult.data,
    logs: rows,
    pagination: {
      limit,
      offset,
      filteredTotal: total,
      hasMore: offset + rows.length < total,
    },
  };
}
