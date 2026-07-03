"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentBusinessSlug } from "@/lib/business-context";
import type { FeedbackSegment, RewardType } from "@/types/feedback";

export type AdminRewardsBusiness = {
  id: string;
  name: string;
  slug: string;
};

export type AdminDiscountSettings = {
  id?: string;
  businessId: string;
  defaultExpiryDays: number;
  defaultUsageLimit: number;
  codePrefix: string;
  autoGenerateEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminRewardRule = {
  id?: string;
  businessId: string;
  segment: FeedbackSegment;
  active: boolean;
  messageEn: string;
  messageAr: string;
  messageFa: string;
  rewardType: RewardType;
  discountValue: number | null;
  freeItemName: string | null;
  customExpiryDays: number | null;
  customUsageLimit: number | null;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminRewardsState = {
  success: boolean;
  message?: string;
  business: AdminRewardsBusiness | null;
  discountSettings: AdminDiscountSettings | null;
  rewards: AdminRewardRule[];
};

export type SaveRewardsInput = {
  businessId: string;
  discountSettings: {
    defaultExpiryDays: number;
    defaultUsageLimit: number;
    codePrefix: string;
    autoGenerateEnabled: boolean;
  };
  rewards: {
    segment: FeedbackSegment;
    active: boolean;
    messageEn: string;
    messageAr: string;
    messageFa: string;
    rewardType: RewardType;
    discountValue: number | null;
    freeItemName: string | null;
    customExpiryDays: number | null;
    customUsageLimit: number | null;
  }[];
};

export async function getAdminRewards(): Promise<AdminRewardsState> {
  const supabase = createSupabaseAdminClient();
  const businessSlug = await getCurrentBusinessSlug();

  const { data, error } = await supabase.rpc("admin_get_rewards_fast", {
    p_slug: businessSlug,
  });

  if (error) {
    return {
      success: false,
      message: error.message,
      business: null,
      discountSettings: null,
      rewards: [],
    };
  }

  return data as AdminRewardsState;
}

export async function saveAdminRewards(input: SaveRewardsInput) {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc("admin_save_rewards_fast", {
    p_business_id: input.businessId,
    p_discount_settings: input.discountSettings,
    p_rewards: input.rewards,
  });

  revalidatePath("/admin/rewards");
  revalidatePath("/feedback");

  if (error) {
    return {
      success: false,
      message: error.message,
      business: null,
      discountSettings: null,
      rewards: [],
    };
  }

  return data as AdminRewardsState;
}
