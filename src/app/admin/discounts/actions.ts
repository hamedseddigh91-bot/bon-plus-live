"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentBusinessSlug } from "@/lib/business-context";
import type { FeedbackSegment, RewardType } from "@/types/feedback";

export type DiscountStatusFilter = "all" | "available" | "used_up" | "expired" | string;
export type DiscountSourceFilter = "all" | "system" | "manual" | string;
export type DiscountRewardFilter = "all" | RewardType;

export type DiscountCodeRow = {
  id: string;
  code: string;
  rewardType: RewardType;
  discountValue: number | null;
  freeItemName: string | null;
  expiresAt: string | null;
  usageLimit: number;
  usedCount: number;
  status: string;
  source: string;
  createdAt: string;
  feedbackSubmissionId: string | null;
  feedbackPhone: string | null;
  feedbackScore: number | null;
  feedbackSegment: FeedbackSegment | null;
  isExpired: boolean;
  isUsedUp: boolean;
};

export type DiscountCenterState = {
  success: boolean;
  message?: string;
  business: { id: string; name: string; slug: string } | null;
  stats: {
    total: number;
    available: number;
    usedUp: number;
    expired: number;
    filtered: number;
  };
  codes: DiscountCodeRow[];
  pagination: {
    limit: number;
    offset: number;
    filteredTotal: number;
    hasMore: boolean;
  };
};

export async function getDiscountCenter(input: {
  status?: DiscountStatusFilter;
  source?: DiscountSourceFilter;
  rewardType?: DiscountRewardFilter;
  search?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<DiscountCenterState> {
  const supabase = createSupabaseAdminClient();
  const businessSlug = await getCurrentBusinessSlug();

  const { data, error } = await supabase.rpc("admin_get_discount_center_fast", {
    p_slug: businessSlug,
    p_status: input.status ?? "all",
    p_source: input.source ?? "all",
    p_reward_type: input.rewardType ?? "all",
    p_search: input.search?.trim() || null,
    p_limit: input.limit ?? 25,
    p_offset: input.offset ?? 0,
  });

  if (error) {
    return {
      success: false,
      message: error.message,
      business: null,
      stats: { total: 0, available: 0, usedUp: 0, expired: 0, filtered: 0 },
      codes: [],
      pagination: { limit: 25, offset: 0, filteredTotal: 0, hasMore: false },
    };
  }

  return data as DiscountCenterState;
}

export async function redeemDiscountCode(input: {
  code: string;
  note?: string;
}) {
  const supabase = createSupabaseAdminClient();
  const businessSlug = await getCurrentBusinessSlug();

  const { data, error } = await supabase.rpc("admin_redeem_discount_code_fast", {
    p_slug: businessSlug,
    p_code: input.code,
    p_note: input.note ?? null,
  });

  revalidatePath("/admin/discounts");

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  return data as { success: boolean; message?: string; code?: string };
}
