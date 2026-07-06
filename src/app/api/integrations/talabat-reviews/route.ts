import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ingestExternalReview } from "@/lib/external-reviews";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-webhook-secret");
  if (!process.env.TALABAT_REVIEWS_WEBHOOK_SECRET || secret !== process.env.TALABAT_REVIEWS_WEBHOOK_SECRET) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const payload: any = await request.json();
  const slug = String(payload.business_slug || payload.businessSlug || "").trim();
  if (!slug) return NextResponse.json({ success: false, message: "business_slug is required" }, { status: 400 });
  const db: any = createSupabaseAdminClient();
  const { data: business } = await db.from("businesses").select("id").eq("slug", slug).maybeSingle();
  if (!business) return NextResponse.json({ success: false, message: "Business not found" }, { status: 404 });
  const reviews = Array.isArray(payload.reviews) ? payload.reviews : [payload.review ?? payload];
  let imported = 0;
  for (const review of reviews) {
    const result = await ingestExternalReview({
      businessId: business.id,
      provider: "talabat",
      externalId: String(review.id || review.review_id || review.reviewId || ""),
      reviewerName: review.reviewer_name || review.reviewerName || null,
      rating: Number(review.rating || review.score || 0) || null,
      comment: review.comment || review.text || review.message || null,
      createdAt: review.created_at || review.createdAt || review.date || null,
      raw: review,
    });
    if (result.success && result.imported) imported += 1;
  }
  return NextResponse.json({ success: true, imported });
}
