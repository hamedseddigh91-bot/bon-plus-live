"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentBusinessSlug } from "@/lib/business-context";
import { requireModulePermission } from "@/lib/user-permissions";

export type UserPermission = {
  moduleKey: string;
  canView: boolean;
  canEdit: boolean;
};

const MODULES = [
  "dashboard","action_center","finance_closing","finance_invoices","finance_cash","costing",
  "feedback","followups","customers","discounts","loyalty","reports","activity_logs","system",
  "settings_general","settings_feedback","settings_users","settings_whatsapp"
] as const;

export async function getUserPermissions(businessUserId: string) {
  await requireModulePermission("settings_users", "view");
  const businessSlug = await getCurrentBusinessSlug();
  const supabase = createSupabaseAdminClient();

  const { data: business } = await supabase.from("businesses").select("id").eq("slug", businessSlug).maybeSingle();
  if (!business?.id) return { success: false, message: "Business not found.", permissions: [] as UserPermission[] };

  const { data: user } = await supabase.from("business_users").select("id, role").eq("id", businessUserId).eq("business_id", business.id).maybeSingle();
  if (!user) return { success: false, message: "User not found.", permissions: [] as UserPermission[] };

  const { data, error } = await supabase
    .from("user_module_permissions")
    .select("module_key, can_view, can_edit")
    .eq("business_id", business.id)
    .eq("business_user_id", businessUserId);

  if (error) return { success: false, message: error.message, permissions: [] as UserPermission[] };

  const map = new Map((data ?? []).map((row: any) => [row.module_key, row]));
  const permissions = MODULES.map((moduleKey) => {
    const row: any = map.get(moduleKey);
    return {
      moduleKey,
      canView: Boolean(row?.can_view),
      canEdit: Boolean(row?.can_edit),
    };
  });

  return { success: true, permissions };
}

export async function saveUserPermissions(input: { businessUserId: string; permissions: UserPermission[] }) {
  const actorContext = await requireModulePermission("settings_users", "edit");
  const actor = actorContext.user;
  const businessSlug = await getCurrentBusinessSlug();
  const supabase = createSupabaseAdminClient();

  const { data: business } = await supabase.from("businesses").select("id").eq("slug", businessSlug).maybeSingle();
  if (!business?.id) return { success: false, message: "Business not found." };

  const { data: target } = await supabase.from("business_users").select("id").eq("id", input.businessUserId).eq("business_id", business.id).maybeSingle();
  if (!target) return { success: false, message: "User not found." };

  const rows = input.permissions
    .filter((p) => MODULES.includes(p.moduleKey as any))
    .map((p) => ({
      business_id: business.id,
      business_user_id: input.businessUserId,
      module_key: p.moduleKey,
      can_view: p.canEdit ? true : Boolean(p.canView),
      can_edit: Boolean(p.canEdit),
      updated_by_auth_user_id: actor.id,
      updated_by_email: actor.email,
      updated_at: new Date().toISOString(),
    }));

  const { error } = await supabase.from("user_module_permissions").upsert(rows, {
    onConflict: "business_user_id,module_key",
  });

  if (error) return { success: false, message: error.message };

  await supabase.from("activity_logs").insert({
    business_id: business.id,
    actor_user_id: actor.id,
    action: "user_permissions_updated",
    entity_type: "business_user",
    entity_id: input.businessUserId,
    metadata: { permissions: rows.map((row) => ({ module_key: row.module_key, can_view: row.can_view, can_edit: row.can_edit })) },
  });

  revalidatePath("/admin/settings/users");
  return { success: true, message: "Permissions saved." };
}
