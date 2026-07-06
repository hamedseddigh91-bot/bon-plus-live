"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireModulePermission } from "@/lib/user-permissions";

export type LoyaltyRuleSetting = {
  id: string;
  name: string;
  categoryKey: string;
  thresholdCount: number;
  rewardType: "percentage" | "fixed" | "free_item";
  rewardValue: number;
  rewardLabel: string;
  isActive: boolean;
};

export async function getLoyaltyRulesSettings() {
  const ctx = await requireModulePermission("settings_general", "view");
  const db: any = createSupabaseAdminClient();
  const { data, error } = await db
    .from("loyalty_program_rules")
    .select("id,name,category_key,threshold_count,reward_type,reward_value,reward_label,is_active")
    .eq("business_id", ctx.currentBusiness.id)
    .order("name");

  return {
    success: !error,
    message: error?.message,
    rules: (data ?? []).map((row: any) => ({
      id: row.id,
      name: row.name,
      categoryKey: row.category_key,
      thresholdCount: Number(row.threshold_count || 0),
      rewardType: row.reward_type,
      rewardValue: Number(row.reward_value || 0),
      rewardLabel: row.reward_label ?? "",
      isActive: Boolean(row.is_active),
    })) as LoyaltyRuleSetting[],
  };
}

export async function saveLoyaltyRuleSetting(input: Partial<LoyaltyRuleSetting> & { name: string; categoryKey: string }) {
  const ctx = await requireModulePermission("settings_general", "edit");
  const threshold = Math.max(1, Math.round(Number(input.thresholdCount || 1)));
  const rewardType = input.rewardType === "fixed" || input.rewardType === "free_item" ? input.rewardType : "percentage";
  const payload = {
    business_id: ctx.currentBusiness.id,
    name: input.name.trim(),
    category_key: input.categoryKey.trim() || "general",
    threshold_count: threshold,
    reward_type: rewardType,
    reward_value: Math.max(0, Number(input.rewardValue || 0)),
    reward_label: input.rewardLabel?.trim() || null,
    is_active: input.isActive !== false,
    updated_at: new Date().toISOString(),
  };
  if (!payload.name) return { success: false, message: "Rule name is required." };
  const db: any = createSupabaseAdminClient();
  const query = input.id
    ? db.from("loyalty_program_rules").update(payload).eq("id", input.id).eq("business_id", ctx.currentBusiness.id)
    : db.from("loyalty_program_rules").insert(payload);
  const { error } = await query;
  if (error) return { success: false, message: error.message };
  revalidatePath("/admin/settings/loyalty-rules");
  revalidatePath("/admin/crm/loyalty");
  return { success: true, message: "Loyalty rule saved." };
}
