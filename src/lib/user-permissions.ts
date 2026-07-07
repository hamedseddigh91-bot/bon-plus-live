import "server-only";
import { cache } from "react";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  canAccessModule,
  requireUserContext,
  type UserContext,
} from "@/lib/auth-session";

export type PermissionMap = Record<string, { view: boolean; edit: boolean }>;
export type PermissionLevel = "view" | "edit";

const getPermissionMapCached = cache(async (businessId: string, userId: string, email: string): Promise<PermissionMap> => {
  const supabase = createSupabaseAdminClient();
  const { data: membership } = await supabase
    .from("business_users")
    .select("id")
    .eq("business_id", businessId)
    .or(`auth_user_id.eq.${userId},email.ilike.${email}`)
    .maybeSingle();

  if (!membership?.id) return {};

  const { data } = await supabase
    .from("user_module_permissions")
    .select("module_key, can_view, can_edit")
    .eq("business_user_id", membership.id)
    .eq("business_id", businessId);

  const result: PermissionMap = {};
  for (const row of data ?? []) {
    result[row.module_key] = { view: Boolean(row.can_view), edit: Boolean(row.can_edit) };
  }
  return result;
});

export async function getCurrentUserPermissionMap(context: UserContext): Promise<PermissionMap> {
  return getPermissionMapCached(context.currentBusiness.id, context.user.id, context.user.email);
}

function fallbackAllowed(context: UserContext, moduleKey: string, level: PermissionLevel) {
  if (level === "view") return canAccessModule(context.role, moduleKey);
  return context.role === "manager";
}


export async function userHasModulePermission(
  context: UserContext,
  moduleKey: string,
  level: PermissionLevel = "view",
): Promise<boolean> {
  if (context.role === "owner" || context.isPlatformAdmin) return true;
  const permissions = await getCurrentUserPermissionMap(context);
  const explicit = permissions[moduleKey];
  return explicit
    ? level === "edit"
      ? explicit.edit
      : explicit.view
    : fallbackAllowed(context, moduleKey, level);
}

export async function requireModulePermission(
  moduleKey: string,
  level: PermissionLevel = "view",
): Promise<UserContext> {
  const context = await requireUserContext();

  const allowed = await userHasModulePermission(context, moduleKey, level);

  if (!allowed) {
    throw new Error("Permission denied.");
  }

  return context;
}

export async function requireAnyModulePermission(
  moduleKeys: string[],
  level: PermissionLevel = "view",
): Promise<UserContext> {
  const context = await requireUserContext();

  if (context.role === "owner" || context.isPlatformAdmin) {
    return context;
  }

  const permissions = await getCurrentUserPermissionMap(context);
  const allowed = moduleKeys.some((moduleKey) => {
    const explicit = permissions[moduleKey];
    return explicit
      ? level === "edit"
        ? explicit.edit
        : explicit.view
      : fallbackAllowed(context, moduleKey, level);
  });

  if (!allowed) {
    throw new Error("Permission denied.");
  }

  return context;
}
