import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { syncGoogleReviewsForBusiness } from "@/lib/external-reviews";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (!process.env.INTEGRATIONS_CRON_SECRET || secret !== process.env.INTEGRATIONS_CRON_SECRET) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const db: any = createSupabaseAdminClient();
  const { data, error } = await db.from("external_review_integrations").select("business_id").eq("provider", "google").eq("is_enabled", true);
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  const results = [];
  for (const row of data ?? []) results.push({ businessId: row.business_id, ...(await syncGoogleReviewsForBusiness(row.business_id)) });
  return NextResponse.json({ success: true, results });
}
