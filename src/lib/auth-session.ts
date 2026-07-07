import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { cache } from "react";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentBusinessSlug } from "@/lib/business-context";

export const ACCESS_TOKEN_COOKIE = "cr_access_token";
export const REFRESH_TOKEN_COOKIE = "cr_refresh_token";

export type BusinessRole = "owner" | "manager" | "accountant" | "staff" | "read_only";

export type AuthUser = {
  id: string;
  email: string;
};

export type UserBusiness = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  accentColor: string | null;
  active: boolean;
  role: BusinessRole;
  createdAt: string;
  updatedAt: string;
};

export type UserContext = {
  success: boolean;
  message?: string | null;
  user: AuthUser;
  businesses: UserBusiness[];
  currentBusiness: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    accentColor: string | null;
  };
  role: BusinessRole;
  isPlatformAdmin: boolean;
};

export type PlatformAdminContext = {
  success: boolean;
  message?: string | null;
  admin: {
    id: string;
    authUserId: string;
    email: string;
    displayName: string | null;
    active: boolean;
    createdAt: string;
    updatedAt: string;
  };
  user: AuthUser;
};

export function createSupabaseAuthClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Missing Supabase public environment variables.");
  }

  return createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export const getAuthenticatedUser = cache(async (): Promise<AuthUser | null> => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    return null;
  }

  const supabase = createSupabaseAuthClient();
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user?.email) {
    return null;
  }

  return {
    id: data.user.id,
    email: data.user.email,
  };
});

export async function requireAuthenticatedUser() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export const getPlatformAdminContext = cache(async (): Promise<PlatformAdminContext | null> => {
  const user = await getAuthenticatedUser();

  if (!user) {
    return null;
  }

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc("platform_get_admin_fast", {
    p_auth_user_id: user.id,
    p_email: user.email,
  });

  if (error || !data?.success) {
    return null;
  }

  return {
    ...(data as Omit<PlatformAdminContext, "user">),
    user,
  };
});

export async function requirePlatformAdminContext() {
  const context = await getPlatformAdminContext();

  if (!context) {
    redirect("/admin");
  }

  return context;
}

export const getUserContext = cache(async (): Promise<UserContext | null> => {
  const user = await getAuthenticatedUser();

  if (!user) {
    return null;
  }

  const currentSlug = await getCurrentBusinessSlug();
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc("admin_get_user_context_fast", {
    p_auth_user_id: user.id,
    p_email: user.email,
    p_current_slug: currentSlug,
  });

  if (error || !data?.success) {
    return null;
  }

  return data as UserContext;
});

export async function requireUserContext() {
  const context = await getUserContext();

  if (!context) {
    redirect("/login");
  }

  return context;
}

export function canAccessModule(role: BusinessRole, module: string) {
  const ownerModules = [
    "dashboard",
    "feedback",
    "recovery",
    "customers",
    "settings",
    "questions",
    "rewards",
    "discounts",
    "reports",
    "activity_logs",
    "users",
    "system",
    "operations",
  ];

  const managerModules = [
    "dashboard",
    "feedback",
    "recovery",
    "customers",
    "settings",
    "questions",
    "rewards",
    "discounts",
    "reports",
    "activity_logs",
    "operations",
  ];

  const accountantModules = [
    "dashboard",
    "reports",
    "operations",
  ];

  const staffModules = [
    "dashboard",
    "feedback",
    "recovery",
    "customers",
  ];

  const readOnlyModules = [
    "dashboard",
    "reports",
  ];

  const map: Record<BusinessRole, string[]> = {
    owner: ownerModules,
    manager: managerModules,
    accountant: accountantModules,
    staff: staffModules,
    read_only: readOnlyModules,
  };

  return map[role]?.includes(module) ?? false;
}
