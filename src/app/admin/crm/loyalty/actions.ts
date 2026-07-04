"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentBusinessSlug } from "@/lib/business-context";
import { requireAuthenticatedUser } from "@/lib/auth-session";

export type LoyaltyRuleRow = {
  id: string; name: string; categoryKey: string; thresholdCount: number; rewardType: string; rewardValue: number;
  messageEn: string; messageAr: string; messageFa: string;
};
export type LoyaltyCounterRow = { id: string; phone: string; ruleId: string; ruleName: string; currentCount: number; totalCount: number; lastPurchaseAt: string | null };
export type LoyaltyCounterState = { success: boolean; message?: string; rules: LoyaltyRuleRow[]; counters: LoyaltyCounterRow[] };

async function context() {
  const actor = await requireAuthenticatedUser();
  const slug = await getCurrentBusinessSlug();
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("_operations_get_context", { p_slug: slug, p_actor_auth_user_id: actor.id, p_actor_email: actor.email });
  const row = Array.isArray(data) ? data[0] : null;
  if (error || !row?.business_id) throw new Error(error?.message ?? "Business access was not found.");
  return { supabase, businessId: row.business_id as string };
}

export async function getLoyaltyCounterState(): Promise<LoyaltyCounterState> {
  try {
    const { supabase, businessId } = await context();
    const [rulesResult, countersResult] = await Promise.all([
      supabase.from("loyalty_program_rules").select("*").eq("business_id", businessId).eq("is_active", true).order("name"),
      supabase.from("loyalty_customer_counters").select("*,loyalty_program_rules(name)").eq("business_id", businessId).order("updated_at", { ascending: false }).limit(100),
    ]);
    if (rulesResult.error || countersResult.error) return { success: false, message: rulesResult.error?.message ?? countersResult.error?.message, rules: [], counters: [] };
    return {
      success: true,
      rules: (rulesResult.data ?? []).map((r: any) => ({ id: r.id, name: r.name, categoryKey: r.category_key, thresholdCount: r.threshold_count, rewardType: r.reward_type, rewardValue: Number(r.reward_value || 0), messageEn: r.message_en, messageAr: r.message_ar, messageFa: r.message_fa })),
      counters: (countersResult.data ?? []).map((c: any) => ({ id: c.id, phone: c.phone, ruleId: c.rule_id, ruleName: c.loyalty_program_rules?.name ?? "—", currentCount: c.current_count, totalCount: c.total_count, lastPurchaseAt: c.last_purchase_at })),
    };
  } catch (error) { return { success: false, message: error instanceof Error ? error.message : "Loyalty state failed.", rules: [], counters: [] }; }
}

export async function recordLoyaltyPurchase(input: { phone: string; ruleId: string }) {
  try {
    const { supabase, businessId } = await context();
    const phone = input.phone.trim();
    const { data: rule, error: ruleError } = await supabase.from("loyalty_program_rules").select("*").eq("business_id", businessId).eq("id", input.ruleId).eq("is_active", true).single();
    if (ruleError || !rule) return { success: false, message: ruleError?.message ?? "Rule not found." };
    const { data: customer } = await supabase.from("customers").select("id").eq("business_id", businessId).eq("phone", phone).maybeSingle();
    const { data: existing } = await supabase.from("loyalty_customer_counters").select("*").eq("business_id", businessId).eq("phone", phone).eq("rule_id", input.ruleId).maybeSingle();
    const nextCurrent = Number(existing?.current_count || 0) + 1;
    const threshold = Number(rule.threshold_count || 1);
    const rewardReached = nextCurrent >= threshold;
    const storedCurrent = rewardReached ? 0 : nextCurrent;
    const payload = { business_id: businessId, customer_id: customer?.id ?? null, phone, rule_id: input.ruleId, current_count: storedCurrent, total_count: Number(existing?.total_count || 0) + 1, last_purchase_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    const result = existing
      ? await supabase.from("loyalty_customer_counters").update(payload).eq("id", existing.id).select().single()
      : await supabase.from("loyalty_customer_counters").insert(payload).select().single();
    if (result.error) return { success: false, message: result.error.message };
    return {
      success: true,
      message: rewardReached ? "Reward reached." : "Purchase recorded.",
      count: nextCurrent,
      displayCount: storedCurrent,
      threshold,
      rewardReached,
      rule: { name: rule.name, rewardType: rule.reward_type, rewardValue: Number(rule.reward_value || 0), messageEn: rule.message_en, messageAr: rule.message_ar, messageFa: rule.message_fa },
    };
  } catch (error) { return { success: false, message: error instanceof Error ? error.message : "Purchase record failed." }; }
}
