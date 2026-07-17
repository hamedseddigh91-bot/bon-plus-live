"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAuthenticatedUser, requireCurrentBusinessSlug } from "@/lib/auth-session";
import { requireModulePermission } from "@/lib/user-permissions";
import { normalizeOmanPhone } from "@/lib/oman-phone";

export type LoyaltyRuleRow = {
  id: string;
  name: string;
  categoryKey: string;
  thresholdCount: number;
  rewardType: string;
  rewardValue: number;
  rewardLabel: string;
  messageEn: string;
  messageAr: string;
  messageFa: string;
};

export type LoyaltyCounterRow = {
  id: string;
  phone: string;
  ruleId: string;
  ruleName: string;
  currentCount: number;
  totalCount: number;
  pendingRewards: number;
  lastPurchaseAt: string | null;
  thresholdCount: number;
  rewardType: string;
  rewardValue: number;
  rewardLabel: string;
  messageEn: string;
  messageAr: string;
  messageFa: string;
};

export type LoyaltyCounterState = {
  success: boolean;
  message?: string;
  rules: LoyaltyRuleRow[];
  counters: LoyaltyCounterRow[];
};

async function context() {
  const actor = await requireAuthenticatedUser();
  const slug = await requireCurrentBusinessSlug();
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("_operations_get_context", {
    p_slug: slug,
    p_actor_auth_user_id: actor.id,
    p_actor_email: actor.email,
  });
  const row = Array.isArray(data) ? data[0] : null;
  if (error || !row?.business_id) throw new Error(error?.message ?? "Business access was not found.");
  return { supabase, businessId: row.business_id as string, actor };
}

export async function getLoyaltyCounterState(): Promise<LoyaltyCounterState> {
  await requireModulePermission("loyalty", "view");
  try {
    const { supabase, businessId } = await context();
    const [rulesResult, countersResult] = await Promise.all([
      supabase.from("loyalty_program_rules").select("*").eq("business_id", businessId).eq("is_active", true).order("name"),
      supabase.from("loyalty_customer_counters")
        .select("*,loyalty_program_rules(name,threshold_count,reward_type,reward_value,reward_label,message_en,message_ar,message_fa)")
        .eq("business_id", businessId)
        .order("updated_at", { ascending: false })
        .limit(200),
    ]);

    if (rulesResult.error || countersResult.error) return { success: false, message: rulesResult.error?.message ?? countersResult.error?.message, rules: [], counters: [] };

    return {
      success: true,
      rules: (rulesResult.data ?? []).map((r: any) => ({
        id: r.id,
        name: r.name,
        categoryKey: r.category_key,
        thresholdCount: Number(r.threshold_count || 0),
        rewardType: r.reward_type,
        rewardValue: Number(r.reward_value || 0),
        rewardLabel: r.reward_label ?? "",
        messageEn: r.message_en ?? "",
        messageAr: r.message_ar ?? "",
        messageFa: r.message_fa ?? "",
      })),
      counters: (countersResult.data ?? []).map((c: any) => {
        const rule = c.loyalty_program_rules ?? {};
        return {
          id: c.id,
          phone: c.phone,
          ruleId: c.rule_id,
          ruleName: rule.name ?? "—",
          currentCount: Number(c.current_count || 0),
          totalCount: Number(c.total_count || 0),
          pendingRewards: Number(c.pending_rewards || 0),
          lastPurchaseAt: c.last_purchase_at,
          thresholdCount: Number(rule.threshold_count || 0),
          rewardType: rule.reward_type ?? "",
          rewardValue: Number(rule.reward_value || 0),
          rewardLabel: rule.reward_label ?? "",
          messageEn: rule.message_en ?? "",
          messageAr: rule.message_ar ?? "",
          messageFa: rule.message_fa ?? "",
        };
      }),
    };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Loyalty state failed.", rules: [], counters: [] };
  }
}

export async function recordLoyaltyPurchase(input: { phone: string; ruleId: string }) {
  await requireModulePermission("loyalty", "edit");
  try {
    const { supabase, businessId } = await context();
    const phone = normalizeOmanPhone(input.phone);
    if (!phone) return { success: false, message: "Enter a valid 8-digit Oman phone number." };

    const { data: rule, error: ruleError } = await supabase.from("loyalty_program_rules").select("*").eq("business_id", businessId).eq("id", input.ruleId).eq("is_active", true).single();
    if (ruleError || !rule) return { success: false, message: ruleError?.message ?? "Rule not found." };

    const { data: customer } = await supabase.from("customers").select("id").eq("business_id", businessId).eq("phone", phone).maybeSingle();
    const { data: existing } = await supabase.from("loyalty_customer_counters").select("*").eq("business_id", businessId).eq("phone", phone).eq("rule_id", input.ruleId).maybeSingle();

    const threshold = Math.max(1, Number(rule.threshold_count || 1));
    const rawCount = Number(existing?.current_count || 0) + 1;
    const rewardReached = rawCount >= threshold;
    const nextCurrent = rewardReached ? rawCount - threshold : rawCount;
    const pendingRewards = Number(existing?.pending_rewards || 0) + (rewardReached ? 1 : 0);
    const payload = {
      business_id: businessId,
      customer_id: customer?.id ?? null,
      phone,
      rule_id: input.ruleId,
      current_count: nextCurrent,
      total_count: Number(existing?.total_count || 0) + 1,
      pending_rewards: pendingRewards,
      last_purchase_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const result = existing
      ? await supabase.from("loyalty_customer_counters").update(payload).eq("id", existing.id).select().single()
      : await supabase.from("loyalty_customer_counters").insert(payload).select().single();
    if (result.error) return { success: false, message: result.error.message };

    revalidatePath("/admin/crm/loyalty");
    return {
      success: true,
      message: rewardReached ? "Reward earned and saved as available." : "Purchase recorded.",
      count: nextCurrent,
      totalCount: payload.total_count,
      threshold,
      pendingRewards,
      rewardReached,
      rule: {
        name: rule.name,
        rewardType: rule.reward_type,
        rewardValue: Number(rule.reward_value || 0),
        rewardLabel: rule.reward_label ?? "",
        messageEn: rule.message_en ?? "",
        messageAr: rule.message_ar ?? "",
        messageFa: rule.message_fa ?? "",
      },
    };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Purchase record failed." };
  }
}

export async function redeemLoyaltyReward(counterId: string) {
  await requireModulePermission("loyalty", "edit");
  try {
    const { supabase, businessId, actor } = await context();
    const { data: counter, error } = await supabase
      .from("loyalty_customer_counters")
      .select("*,loyalty_program_rules(reward_type,reward_value,reward_label)")
      .eq("business_id", businessId)
      .eq("id", counterId)
      .single();
    if (error || !counter) return { success: false, message: error?.message ?? "Counter not found." };
    if (Number(counter.pending_rewards || 0) <= 0) return { success: false, message: "No available reward." };
    const rule: any = counter.loyalty_program_rules ?? {};
    const { error: insertError } = await supabase.from("loyalty_reward_redemptions").insert({
      business_id: businessId,
      counter_id: counter.id,
      phone: counter.phone,
      rule_id: counter.rule_id,
      reward_type: rule.reward_type ?? "free_item",
      reward_value: Number(rule.reward_value || 0),
      reward_label: rule.reward_label ?? null,
      redeemed_by: actor.id,
      redeemed_by_email: actor.email,
    });
    if (insertError) return { success: false, message: insertError.message };
    const { error: updateError } = await supabase.from("loyalty_customer_counters").update({ pending_rewards: Number(counter.pending_rewards) - 1, updated_at: new Date().toISOString() }).eq("id", counter.id).eq("business_id", businessId);
    if (updateError) return { success: false, message: updateError.message };
    revalidatePath("/admin/crm/loyalty");
    return { success: true, message: "Reward marked as used." };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Reward redemption failed." };
  }
}

export async function getCustomerLanguageByPhone(phone: string): Promise<"fa" | "ar" | "en"> {
  await requireModulePermission("loyalty", "view");
  const supabase = createSupabaseAdminClient();
  const businessSlug = await requireCurrentBusinessSlug();
  const { data: business } = await supabase.from("businesses").select("id").eq("slug", businessSlug).maybeSingle();
  if (!business) return "en";
  const normalized = normalizeOmanPhone(phone) ?? phone;
  const { data: customer } = await supabase
    .from("customers")
    .select("language")
    .eq("business_id", business.id)
    .eq("phone", normalized)
    .maybeSingle();
  return (customer?.language as "fa" | "ar" | "en" | undefined) ?? "en";
}
