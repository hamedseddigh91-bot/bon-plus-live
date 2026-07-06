import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type Provider = "google" | "talabat";

export type ExternalReviewInput = {
  businessId: string;
  provider: Provider;
  externalId: string;
  reviewerName?: string | null;
  rating?: number | null;
  comment?: string | null;
  createdAt?: string | null;
  raw?: unknown;
};

function segmentFor(score: number | null | undefined) {
  if ((score ?? 0) <= 2) return "unhappy";
  if ((score ?? 0) < 4) return "medium";
  return "satisfied";
}

export async function ingestExternalReview(input: ExternalReviewInput) {
  const db: any = createSupabaseAdminClient();
  const externalId = String(input.externalId || "").trim();
  if (!externalId) return { success: false, message: "Missing external review id." };

  const { data: existing } = await db
    .from("external_review_imports")
    .select("id,feedback_submission_id")
    .eq("business_id", input.businessId)
    .eq("provider", input.provider)
    .eq("external_review_id", externalId)
    .maybeSingle();
  if (existing) return { success: true, imported: false, feedbackId: existing.feedback_submission_id };

  const sourceKey = input.provider.toUpperCase();
  let { data: source } = await db
    .from("customer_sources")
    .select("id")
    .eq("business_id", input.businessId)
    .eq("source_key", sourceKey)
    .maybeSingle();

  if (!source) {
    const inserted = await db.from("customer_sources").insert({
      business_id: input.businessId,
      source_key: sourceKey,
      name: input.provider === "google" ? "Google Maps" : "Talabat",
      is_active: true,
      is_system: true,
    }).select("id").single();
    source = inserted.data;
  }

  const score = input.rating == null ? null : Math.max(1, Math.min(5, Number(input.rating)));
  const reviewerPrefix = input.reviewerName?.trim() ? `${input.reviewerName.trim()}\n\n` : "";
  const { data: feedback, error: feedbackError } = await db.from("feedback_submissions").insert({
    business_id: input.businessId,
    phone: "",
    source_id: source?.id ?? null,
    customer_message: `${reviewerPrefix}${input.comment ?? ""}`.trim() || null,
    overall_score: score,
    language: "en",
    segment: segmentFor(score),
    google_maps_link_shown: false,
    reward_generated: false,
    created_at: input.createdAt || new Date().toISOString(),
  }).select("id").single();

  if (feedbackError) return { success: false, message: feedbackError.message };

  const { error: importError } = await db.from("external_review_imports").insert({
    business_id: input.businessId,
    provider: input.provider,
    external_review_id: externalId,
    reviewer_name: input.reviewerName ?? null,
    rating: score,
    comment: input.comment ?? null,
    review_created_at: input.createdAt ?? null,
    feedback_submission_id: feedback.id,
    raw_payload: input.raw ?? {},
  });

  if (importError) return { success: false, message: importError.message };
  return { success: true, imported: true, feedbackId: feedback.id };
}

const starMap: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

export async function syncGoogleReviewsForBusiness(businessId: string) {
  const db: any = createSupabaseAdminClient();
  const { data: config, error } = await db
    .from("external_review_integrations")
    .select("account_id,location_id,is_enabled")
    .eq("business_id", businessId)
    .eq("provider", "google")
    .maybeSingle();
  if (error || !config?.is_enabled) return { success: false, message: error?.message || "Google integration is disabled.", imported: 0 };

  let token = process.env.GOOGLE_BUSINESS_ACCESS_TOKEN || "";
  if (process.env.GOOGLE_BUSINESS_REFRESH_TOKEN && process.env.GOOGLE_BUSINESS_CLIENT_ID && process.env.GOOGLE_BUSINESS_CLIENT_SECRET) {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_BUSINESS_CLIENT_ID,
        client_secret: process.env.GOOGLE_BUSINESS_CLIENT_SECRET,
        refresh_token: process.env.GOOGLE_BUSINESS_REFRESH_TOKEN,
        grant_type: "refresh_token",
      }),
      cache: "no-store",
    });
    if (!tokenResponse.ok) return { success: false, message: `Google token refresh failed: ${tokenResponse.status}`, imported: 0 };
    const tokenBody: any = await tokenResponse.json();
    token = tokenBody.access_token || "";
  }
  if (!token) return { success: false, message: "Google Business OAuth credentials are not configured.", imported: 0 };
  const account = String(config.account_id || "").replace(/^accounts\//, "");
  const location = String(config.location_id || "").replace(/^locations\//, "");
  if (!account || !location) return { success: false, message: "Google account and location IDs are required.", imported: 0 };

  let pageToken = "";
  let imported = 0;
  try {
    do {
      const url = new URL(`https://mybusiness.googleapis.com/v4/accounts/${encodeURIComponent(account)}/locations/${encodeURIComponent(location)}/reviews`);
      url.searchParams.set("pageSize", "50");
      url.searchParams.set("orderBy", "updateTime desc");
      if (pageToken) url.searchParams.set("pageToken", pageToken);
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      if (!response.ok) throw new Error(`Google reviews sync failed: ${response.status} ${await response.text()}`);
      const body: any = await response.json();
      for (const review of body.reviews ?? []) {
        const result = await ingestExternalReview({
          businessId,
          provider: "google",
          externalId: review.reviewId || review.name,
          reviewerName: review.reviewer?.displayName ?? null,
          rating: starMap[review.starRating] ?? null,
          comment: review.comment ?? null,
          createdAt: review.createTime ?? review.updateTime ?? null,
          raw: review,
        });
        if (result.success && result.imported) imported += 1;
      }
      pageToken = body.nextPageToken || "";
    } while (pageToken);

    await db.from("external_review_integrations").update({ last_synced_at: new Date().toISOString(), last_error: null, updated_at: new Date().toISOString() }).eq("business_id", businessId).eq("provider", "google");
    return { success: true, message: `${imported} Google review(s) imported.`, imported };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Google sync failed.";
    await db.from("external_review_integrations").update({ last_error: message, updated_at: new Date().toISOString() }).eq("business_id", businessId).eq("provider", "google");
    return { success: false, message, imported };
  }
}

export async function syncGoogleReviewsIfDue(businessId: string, minIntervalMinutes = 15) {
  const db: any = createSupabaseAdminClient();
  const { data: config } = await db
    .from("external_review_integrations")
    .select("is_enabled,last_synced_at")
    .eq("business_id", businessId)
    .eq("provider", "google")
    .maybeSingle();
  if (!config?.is_enabled) return { success: true, skipped: true, imported: 0, message: "Google integration disabled." };
  const last = config.last_synced_at ? new Date(config.last_synced_at).getTime() : 0;
  const fresh = last > 0 && Date.now() - last < minIntervalMinutes * 60_000;
  if (fresh) return { success: true, skipped: true, imported: 0, message: "Google reviews are fresh." };
  return syncGoogleReviewsForBusiness(businessId);
}
