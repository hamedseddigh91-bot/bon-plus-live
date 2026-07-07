"use server";

import crypto from "crypto";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAuthenticatedUser, requireCurrentBusinessSlug } from "@/lib/auth-session";
import { requireModulePermission } from "@/lib/user-permissions";
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
  reason?: string | null;
  earlyReminderSentAt?: string | null;
  expiryReminderSentAt?: string | null;
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
  await requireModulePermission("discounts", "view");
  const supabase = createSupabaseAdminClient();
  const businessSlug = await requireCurrentBusinessSlug();

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

  const state = data as DiscountCenterState;
  const ids = state.codes.map((row) => row.id);

  if (ids.length > 0) {
    const { data: reminderRows } = await supabase
      .from("discount_codes")
      .select("id,reason,early_reminder_sent_at,expiry_reminder_sent_at,customer_id,customers(phone)")
      .in("id", ids);

    const reminders = new Map(
      (reminderRows ?? []).map((row) => {
        const customerRel = row.customers as unknown as { phone?: string } | null;
        return [row.id, {
          reason: row.reason ?? null,
          phone: customerRel?.phone ?? null,
          earlyReminderSentAt: row.early_reminder_sent_at ?? null,
          expiryReminderSentAt: row.expiry_reminder_sent_at ?? null,
        }];
      }),
    );

    state.codes = state.codes.map((row) => {
      const extra = reminders.get(row.id);
      return extra ? {
        ...row,
        reason: extra.reason,
        feedbackPhone: row.feedbackPhone ?? extra.phone,
        earlyReminderSentAt: extra.earlyReminderSentAt,
        expiryReminderSentAt: extra.expiryReminderSentAt,
      } : row;
    });
  }

  return state;
}

export async function redeemDiscountCode(input: {
  code: string;
  note?: string;
}) {
  await requireModulePermission("discounts", "edit");
  const supabase = createSupabaseAdminClient();
  const businessSlug = await requireCurrentBusinessSlug();

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


export type DiscountValidation = {
  success: boolean;
  message?: string;
  valid?: boolean;
  code?: {
    code: string;
    phone: string | null;
    reason: string | null;
    rewardType: RewardType;
    discountValue: number | null;
    freeItemName: string | null;
    expiresAt: string | null;
    usageLimit: number;
    usedCount: number;
    remainingUses: number;
    status: string;
  } | null;
};

async function discountContext() {
  const actor = await requireAuthenticatedUser();
  const businessSlug = await requireCurrentBusinessSlug();
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("_operations_get_context", {
    p_slug: businessSlug,
    p_actor_auth_user_id: actor.id,
    p_actor_email: actor.email,
  });
  const context = Array.isArray(data) ? data[0] : null;
  if (error || !context?.business_id) throw new Error(error?.message ?? "Business access was not found.");
  return { actor, supabase, businessId: context.business_id as string };
}

function makeManualCode() {
  return `BP-${crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
}

export async function createManualDiscountCode(input: {
  phone: string;
  rewardType: "percentage" | "fixed" | "free_cafe_item" | "free_food_item";
  value: number;
  acquisitionSource: string;
  usageLimit: number;
  expiryDays: number;
}) {
  await requireModulePermission("discounts", "edit");
  try {
    const { actor, supabase, businessId } = await discountContext();
    const phone = input.phone.trim();
    const { data: customer } = await supabase.from("customers").select("id").eq("business_id", businessId).eq("phone", phone).maybeSingle();
    const code = makeManualCode();
    const expiresAt = new Date(Date.now() + Math.max(1, input.expiryDays || 7) * 86400000).toISOString();
    const freeItem = input.rewardType === "free_cafe_item" ? `Cafe item × ${Math.max(1, input.value || 1)}` : input.rewardType === "free_food_item" ? `Food item × ${Math.max(1, input.value || 1)}` : null;
    const rewardType: RewardType = input.rewardType === "free_cafe_item" || input.rewardType === "free_food_item" ? "free_item" : input.rewardType;
    const { error } = await supabase.from("discount_codes").insert({
      business_id: businessId,
      customer_id: customer?.id ?? null,
      code,
      source: "manual",
      reason: input.acquisitionSource.trim() || "Other",
      reward_type: rewardType,
      discount_value: rewardType === "free_item" ? null : Number(input.value || 0),
      free_item_name: freeItem,
      expires_at: expiresAt,
      usage_limit: Math.max(1, Math.floor(input.usageLimit || 1)),
      used_count: 0,
      status: "active",
      created_by: actor.id,
    });
    if (error) return { success: false, message: error.message };
    revalidatePath("/admin/crm/loyalty");
    return { success: true, message: "Discount code created.", code };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Could not create discount code." };
  }
}

export async function validateDiscountCode(codeInput: string): Promise<DiscountValidation> {
  await requireModulePermission("discounts", "view");
  try {
    const { supabase, businessId } = await discountContext();
    const codeText = codeInput.trim().toUpperCase();
    const { data, error } = await supabase.from("discount_codes")
      .select("code,reason,reward_type,discount_value,free_item_name,expires_at,usage_limit,used_count,status,customer_id,customers(phone)")
      .eq("business_id", businessId).eq("code", codeText).maybeSingle();
    if (error) return { success: false, message: error.message, valid: false, code: null };
    if (!data) return { success: true, valid: false, message: "Code not found.", code: null };
    const expired = Boolean(data.expires_at && new Date(data.expires_at).getTime() < Date.now());
    const remaining = Math.max(0, Number(data.usage_limit || 0) - Number(data.used_count || 0));
    const valid = data.status === "active" && !expired && remaining > 0;
    const customerRel = data.customers as unknown as { phone?: string } | null;
    return { success: true, valid, message: valid ? "Code is valid." : expired ? "Code has expired." : remaining <= 0 ? "Code usage limit reached." : "Code is not active.", code: {
      code: data.code,
      phone: customerRel?.phone ?? null,
      reason: data.reason,
      rewardType: data.reward_type,
      discountValue: data.discount_value,
      freeItemName: data.free_item_name,
      expiresAt: data.expires_at,
      usageLimit: data.usage_limit,
      usedCount: data.used_count,
      remainingUses: remaining,
      status: data.status,
    }};
  } catch (error) {
    return { success: false, valid: false, message: error instanceof Error ? error.message : "Validation failed.", code: null };
  }
}

export async function markDiscountReminderSent(input: { codeId: string; stage: "early" | "expiry" }) {
  await requireModulePermission("discounts", "edit");
  try {
    const { actor, supabase, businessId } = await discountContext();
    const column = input.stage === "early" ? "early_reminder_sent_at" : "expiry_reminder_sent_at";
    const byColumn = input.stage === "early" ? "early_reminder_sent_by" : "expiry_reminder_sent_by";
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("discount_codes")
      .update({ [column]: now, [byColumn]: actor.id, updated_at: now })
      .eq("id", input.codeId)
      .eq("business_id", businessId);

    if (error) return { success: false, message: error.message };

    await supabase.from("activity_logs").insert({
      business_id: businessId,
      actor_user_id: actor.id,
      action: "discount_reminder_confirmed",
      entity_type: "discount_code",
      entity_id: input.codeId,
      metadata: { stage: input.stage, confirmed_at: now },
    });

    revalidatePath("/admin/crm/loyalty");
    revalidatePath("/admin/action-center");
    return { success: true, message: "Reminder marked as sent.", sentAt: now };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Could not confirm reminder." };
  }
}
