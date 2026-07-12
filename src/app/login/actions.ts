"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  createSupabaseAuthClient,
  type UserContext,
} from "@/lib/auth-session";
import { getFirstAllowedAdminRoute } from "@/lib/user-permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { BUSINESS_COOKIE_NAME, getCurrentBusinessSlug } from "@/lib/business-context";

const cookieOptions = {
  path: "/",
  sameSite: "lax" as const,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
};

export async function signInWithPassword(input: {
  email: string;
  password: string;
}) {
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!email || !password) {
    return {
      success: false,
      message: "Email and password are required.",
    };
  }

  const supabase = createSupabaseAuthClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session || !data.user.email) {
    return {
      success: false,
      message: error?.message ?? "Login failed.",
    };
  }

  const currentSlug = await getCurrentBusinessSlug();
  const admin = createSupabaseAdminClient();

  const { data: context } = await admin.rpc("admin_get_user_context_fast", {
    p_auth_user_id: data.user.id,
    p_email: data.user.email,
    p_current_slug: currentSlug,
  });

  const { data: platformContext } = await admin.rpc("platform_get_admin_fast", {
    p_auth_user_id: data.user.id,
    p_email: data.user.email,
  });

  if (!context?.success && !platformContext?.success) {
    return {
      success: false,
      message: context?.message ?? platformContext?.message ?? "This user does not have access.",
    };
  }

  const cookieStore = await cookies();

  cookieStore.set(ACCESS_TOKEN_COOKIE, data.session.access_token, {
    ...cookieOptions,
    maxAge: data.session.expires_in,
  });

  cookieStore.set(REFRESH_TOKEN_COOKIE, data.session.refresh_token, {
    ...cookieOptions,
    maxAge: 60 * 60 * 24 * 30,
  });

  const resolvedBusinessSlug = context?.success ? context.currentBusiness?.slug : null;
  if (resolvedBusinessSlug) {
    cookieStore.set(BUSINESS_COOKIE_NAME, resolvedBusinessSlug, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  const redirectTo = context?.success
    ? await getFirstAllowedAdminRoute(context as UserContext)
    : "/platform";

  return {
    success: true,
    message: "Logged in.",
    redirectTo,
  };
}

export async function signOut() {
  const cookieStore = await cookies();

  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
  cookieStore.delete(BUSINESS_COOKIE_NAME);

  redirect("/login");
}
