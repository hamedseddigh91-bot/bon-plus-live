import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  canAccessModule,
  requireUserContext,
  type UserContext,
} from "@/lib/auth-session";

export type PermissionMap = Record<string, { view: boolean; edit: boolean }>;
export type PermissionLevel = "view" | "edit";

export type CurrentPermissionState = {
  permissions: PermissionMap;
  membershipFound: boolean;
  hasExplicitPermissions: boolean;
};

async function redirectPermissionDenied(): Promise<never> {
  const headerStore = await headers();
  const referer = headerStore.get("referer");
  let target = "/admin?permissionDenied=1";

  if (referer) {
    try {
      const url = new URL(referer);
      if (url.pathname.startsWith("/admin")) {
        url.searchParams.set("permissionDenied", "1");
        target = `${url.pathname}${url.search}${url.hash}`;
      }
    } catch {
      // Fall back to the admin home if the referrer cannot be parsed.
    }
  }

  redirect(target);
}

async function resolveCurrentPermissionState(
  businessId: string,
  userId: string,
  email: string,
): Promise<CurrentPermissionState> {
  const supabase = createSupabaseAdminClient();
  const normalizedEmail = email.trim().toLowerCase();

  // Resolve the exact business membership deterministically. Avoid a compound
  // PostgREST OR filter here because permission enforcement must fail closed
  // if identity resolution is inconsistent.
  let membershipId: string | null = null;

  const { data: byAuthUser } = await supabase
    .from("business_users")
    .select("id")
    .eq("business_id", businessId)
    .eq("auth_user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  membershipId = byAuthUser?.id ?? null;

  if (!membershipId && normalizedEmail) {
    const { data: byEmail } = await supabase
      .from("business_users")
      .select("id")
      .eq("business_id", businessId)
      .ilike("email", normalizedEmail)
      .eq("is_active", true)
      .maybeSingle();

    membershipId = byEmail?.id ?? null;
  }

  if (!membershipId) {
    return {
      permissions: {},
      membershipFound: false,
      hasExplicitPermissions: false,
    };
  }

  const { data, error } = await supabase
    .from("user_module_permissions")
    .select("module_key, can_view, can_edit")
    .eq("business_user_id", membershipId)
    .eq("business_id", businessId);

  if (error) {
    // Permission reads must fail closed for authenticated non-owner users.
    return {
      permissions: {},
      membershipFound: true,
      hasExplicitPermissions: true,
    };
  }

  const permissions: PermissionMap = {};
  for (const row of data ?? []) {
    permissions[row.module_key] = {
      view: Boolean(row.can_view),
      edit: Boolean(row.can_edit),
    };
  }

  return {
    permissions,
    membershipFound: true,
    hasExplicitPermissions: (data?.length ?? 0) > 0,
  };
}

export async function getCurrentUserPermissionState(
  context: UserContext,
): Promise<CurrentPermissionState> {
  return resolveCurrentPermissionState(
    context.currentBusiness.id,
    context.user.id,
    context.user.email,
  );
}

export async function getCurrentUserPermissionMap(context: UserContext): Promise<PermissionMap> {
  const state = await getCurrentUserPermissionState(context);
  return state.permissions;
}

const permissionFallbackModules: Record<string, string> = {
  action_center: "dashboard",
  finance_closing: "operations",
  finance_invoices: "operations",
  finance_cash: "operations",
  costing: "operations",
  shopping_list: "operations",
  followups: "recovery",
  loyalty: "rewards",
  settings_general: "settings",
  settings_feedback: "settings",
  settings_users: "settings",
  settings_whatsapp: "settings",
};

export const adminPermissionRoutes = [
  { moduleKey: "dashboard", href: "/admin" },
  { moduleKey: "action_center", href: "/admin/action-center" },
  { moduleKey: "feedback", href: "/admin/crm/feedback" },
  { moduleKey: "followups", href: "/admin/crm/follow-ups" },
  { moduleKey: "customers", href: "/admin/crm/customers" },
  { moduleKey: "discounts", href: "/admin/crm/discounts" },
  { moduleKey: "loyalty", href: "/admin/crm/loyalty" },
  { moduleKey: "shopping_list", href: "/admin/operations/shopping-list" },
  { moduleKey: "finance_closing", href: "/admin/finance/closing" },
  { moduleKey: "finance_invoices", href: "/admin/finance/invoices" },
  { moduleKey: "finance_cash", href: "/admin/finance/cash" },
  { moduleKey: "costing", href: "/admin/finance/costing" },
  { moduleKey: "reports", href: "/admin/reports" },
  { moduleKey: "activity_logs", href: "/admin/activity-logs" },
  { moduleKey: "settings_general", href: "/admin/settings/general" },
  { moduleKey: "settings_feedback", href: "/admin/settings/feedback-center" },
  { moduleKey: "settings_users", href: "/admin/settings/users" },
  { moduleKey: "settings_whatsapp", href: "/admin/settings/whatsapp-messages" },
] as const;

function fallbackAllowed(context: UserContext, moduleKey: string, level: PermissionLevel) {
  if (level === "edit") return context.role === "manager";
  const fallbackModule = permissionFallbackModules[moduleKey] ?? moduleKey;
  return canAccessModule(context.role, fallbackModule);
}

export function permissionStateAllows(
  context: UserContext,
  state: CurrentPermissionState,
  moduleKey: string,
  level: PermissionLevel = "view",
): boolean {
  if (context.role === "owner" || context.isPlatformAdmin) return true;
  if (!state.membershipFound) return false;

  const explicit = state.permissions[moduleKey];
  if (explicit) return level === "edit" ? explicit.edit : explicit.view;
  if (state.hasExplicitPermissions) return false;

  return fallbackAllowed(context, moduleKey, level);
}

export function firstAllowedAdminRouteFromState(
  context: UserContext,
  state: CurrentPermissionState,
): string {
  if (context.role === "owner" || context.isPlatformAdmin) return "/admin";

  return adminPermissionRoutes.find(({ moduleKey }) =>
    permissionStateAllows(context, state, moduleKey, "view"),
  )?.href ?? "/admin/no-access";
}

export async function getFirstAllowedAdminRoute(context: UserContext): Promise<string> {
  if (context.role === "owner" || context.isPlatformAdmin) return "/admin";
  const state = await getCurrentUserPermissionState(context);
  return firstAllowedAdminRouteFromState(context, state);
}

export async function userHasModulePermission(
  context: UserContext,
  moduleKey: string,
  level: PermissionLevel = "view",
): Promise<boolean> {
  const state = await getCurrentUserPermissionState(context);
  return permissionStateAllows(context, state, moduleKey, level);
}

export async function requireModulePermission(
  moduleKey: string,
  level: PermissionLevel = "view",
): Promise<UserContext> {
  const context = await requireUserContext();
  const allowed = await userHasModulePermission(context, moduleKey, level);

  if (!allowed) {
    await redirectPermissionDenied();
  }

  return context;
}

export async function requireAnyModulePermission(
  moduleKeys: string[],
  level: PermissionLevel = "view",
): Promise<UserContext> {
  const context = await requireUserContext();

  const state = await getCurrentUserPermissionState(context);
  const allowed = moduleKeys.some((moduleKey) =>
    permissionStateAllows(context, state, moduleKey, level),
  );

  if (!allowed) {
    await redirectPermissionDenied();
  }

  return context;
}
