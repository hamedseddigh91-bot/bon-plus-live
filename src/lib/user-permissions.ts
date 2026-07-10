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

  const state = await getCurrentUserPermissionState(context);

  // The auth context itself proves this user should have a membership. If the
  // matching row cannot be resolved, deny rather than silently falling back to
  // broad role permissions.
  if (!state.membershipFound) return false;

  const explicit = state.permissions[moduleKey];
  if (explicit) {
    return level === "edit" ? explicit.edit : explicit.view;
  }

  // Once a user has any custom permission rows, the custom map is authoritative
  // and missing modules are denied. This prevents manager-role fallback from
  // accidentally granting edit access to modules omitted from the map.
  if (state.hasExplicitPermissions) return false;

  return fallbackAllowed(context, moduleKey, level);
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

  if (context.role === "owner" || context.isPlatformAdmin) {
    return context;
  }

  const state = await getCurrentUserPermissionState(context);
  if (!state.membershipFound) {
    await redirectPermissionDenied();
  }

  const allowed = moduleKeys.some((moduleKey) => {
    const explicit = state.permissions[moduleKey];
    if (explicit) {
      return level === "edit" ? explicit.edit : explicit.view;
    }

    if (state.hasExplicitPermissions) return false;
    return fallbackAllowed(context, moduleKey, level);
  });

  if (!allowed) {
    await redirectPermissionDenied();
  }

  return context;
}
