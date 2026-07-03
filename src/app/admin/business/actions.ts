"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  BUSINESS_COOKIE_NAME,
  getCurrentBusinessSlug,
} from "@/lib/business-context";
import { getAuthenticatedUser } from "@/lib/auth-session";

export type BusinessListItem = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  accentColor: string | null;
  active: boolean;
  role?: string;
  createdAt: string;
  updatedAt: string;
};

export type BusinessListState = {
  success: boolean;
  message?: string;
  businesses: BusinessListItem[];
  currentSlug: string;
};

export async function listBusinesses(input: { search?: string } = {}): Promise<BusinessListState> {
  const user = await getAuthenticatedUser();
  const currentSlug = await getCurrentBusinessSlug();

  if (user) {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase.rpc("admin_get_user_context_fast", {
      p_auth_user_id: user.id,
      p_email: user.email,
      p_current_slug: currentSlug,
    });

    if (!error && data?.success) {
      return {
        success: true,
        businesses: data.businesses ?? [],
        currentSlug: data.currentBusiness?.slug ?? currentSlug,
      };
    }
  }

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc("admin_list_businesses_fast", {
    p_search: input.search?.trim() || null,
  });

  if (error) {
    return { success: false, message: error.message, businesses: [], currentSlug };
  }

  return {
    ...(data as Omit<BusinessListState, "currentSlug">),
    currentSlug,
  };
}

export async function setCurrentBusiness(slug: string) {
  const cleanSlug = slug.trim();

  if (!cleanSlug) {
    return { success: false, message: "Business slug is required." };
  }

  const user = await getAuthenticatedUser();

  if (user) {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase.rpc("admin_get_user_context_fast", {
      p_auth_user_id: user.id,
      p_email: user.email,
      p_current_slug: cleanSlug,
    });

    if (error || !data?.success || data.currentBusiness?.slug !== cleanSlug) {
      return {
        success: false,
        message: "You do not have access to this business.",
      };
    }
  }

  const cookieStore = await cookies();

  cookieStore.set(BUSINESS_COOKIE_NAME, cleanSlug, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/feedback");
  revalidatePath("/admin/questions");
  revalidatePath("/admin/rewards");
  revalidatePath("/admin/discounts");
  revalidatePath("/admin/reports");
  revalidatePath("/admin/activity-logs");
  revalidatePath("/admin/users");

  return { success: true, message: "Business changed.", slug: cleanSlug };
}
