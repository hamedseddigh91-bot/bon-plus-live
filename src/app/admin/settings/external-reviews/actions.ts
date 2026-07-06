"use server";

import { revalidatePath } from "next/cache";
import { requireModulePermission } from "@/lib/user-permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { syncGoogleReviewsForBusiness } from "@/lib/external-reviews";

export type ExternalReviewIntegration = {
  provider: "google" | "talabat";
  isEnabled: boolean;
  accountId: string;
  locationId: string;
  businessSlug: string;
  lastSyncedAt: string | null;
  lastError: string | null;
};

export async function getExternalReviewIntegrations() {
  const ctx = await requireModulePermission("settings_feedback", "view");
  const db: any = createSupabaseAdminClient();
  const { data, error } = await db
    .from("external_review_integrations")
    .select("provider,is_enabled,account_id,location_id,business_slug,last_synced_at,last_error")
    .eq("business_id", ctx.currentBusiness.id)
    .order("provider");
  return {
    success: !error,
    message: error?.message,
    rows: (data ?? []).map((r: any) => ({
      provider: r.provider,
      isEnabled: Boolean(r.is_enabled),
      accountId: r.account_id ?? "",
      locationId: r.location_id ?? "",
      businessSlug: r.business_slug ?? ctx.currentBusiness.slug,
      lastSyncedAt: r.last_synced_at ?? null,
      lastError: r.last_error ?? null,
    })) as ExternalReviewIntegration[],
  };
}

export async function saveExternalReviewIntegration(input: ExternalReviewIntegration) {
  const ctx = await requireModulePermission("settings_feedback", "edit");
  const db: any = createSupabaseAdminClient();
  const { error } = await db.from("external_review_integrations").upsert({
    business_id: ctx.currentBusiness.id,
    provider: input.provider,
    is_enabled: Boolean(input.isEnabled),
    account_id: input.accountId.trim() || null,
    location_id: input.locationId.trim() || null,
    business_slug: input.businessSlug.trim() || ctx.currentBusiness.slug,
    updated_at: new Date().toISOString(),
  }, { onConflict: "business_id,provider" });
  if (error) return { success: false, message: error.message };
  revalidatePath("/admin/settings/external-reviews");
  return { success: true, message: "Integration settings saved." };
}

export async function runGoogleReviewSync() {
  const ctx = await requireModulePermission("settings_feedback", "edit");
  const result = await syncGoogleReviewsForBusiness(ctx.currentBusiness.id);
  revalidatePath("/admin/settings/external-reviews");
  revalidatePath("/admin/crm/feedback");
  return result;
}
