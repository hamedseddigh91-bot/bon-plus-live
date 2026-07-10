"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireModulePermission } from "@/lib/user-permissions";
import { requireAuthenticatedUser, requireCurrentBusinessSlug } from "@/lib/auth-session";

export type ActionCenterItem = {
  id: string;
  title: string;
  detail: string;
  category: "crm" | "loyalty" | "finance" | "operations" | "costing";
  priority: "urgent" | "high" | "normal";
  href: string;
  createdAt?: string | null;
};

export type ActionCenterState = {
  success: boolean;
  message?: string;
  urgent: ActionCenterItem[];
  dueToday: ActionCenterItem[];
  crm: ActionCenterItem[];
  loyalty: ActionCenterItem[];
  finance: ActionCenterItem[];
  operations: ActionCenterItem[];
  costing: ActionCenterItem[];
};

async function context() {
  const actor = await requireAuthenticatedUser();
  const businessSlug = await requireCurrentBusinessSlug();
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("_operations_get_context", {
    p_slug: businessSlug,
    p_actor_auth_user_id: actor.id,
    p_actor_email: actor.email,
  });
  const row = Array.isArray(data) ? data[0] : null;
  if (error || !row?.business_id) throw new Error(error?.message ?? "Business access was not found.");
  return { supabase, businessId: row.business_id as string };
}

function daysLeft(value: string | null) {
  if (!value) return Number.POSITIVE_INFINITY;
  return Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000);
}

export async function getActionCenterState(): Promise<ActionCenterState> {
  await requireModulePermission("action_center", "view");
  try {
    const { supabase, businessId } = await context();
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [feedbacks, recoveries, discounts, loyaltyCounters, invoices, recipes] = await Promise.all([
      supabase.from("feedback_submissions").select("id,workflow_stage,overall_score,source_id,phone,created_at,customer_sources(name)").eq("business_id", businessId).order("created_at", { ascending: false }).limit(80),
      supabase.from("feedback_recovery_cases").select("id,feedback_submission_id,phone,priority,status,complaint_reason,updated_at").eq("business_id", businessId).not("status", "in", '("resolved","closed")').order("updated_at", { ascending: true }).limit(50),
      supabase.from("discount_codes").select("id,code,expires_at,status,usage_limit,used_count,customer_id,customers(phone)").eq("business_id", businessId).order("expires_at", { ascending: true }).limit(100),
      supabase.from("loyalty_customer_counters").select("id,phone,pending_rewards,rule_id,loyalty_program_rules(name,reward_label)").eq("business_id", businessId).gt("pending_rewards", 0).limit(100),
      supabase.from("finance_entries").select("id,title,amount,entry_date,payment_status,status").eq("business_id", businessId).eq("entry_type", "expense").eq("status", "active").neq("payment_status", "paid").order("entry_date", { ascending: true }).limit(100),
      supabase.from("recipe_costing_items").select("id,name,item_type,purchase_price,purchase_qty,sale_price,components,active").eq("business_id", businessId).eq("active", true).order("name").limit(200),
    ]);

    const crm: ActionCenterItem[] = [];
    const loyalty: ActionCenterItem[] = [];
    const finance: ActionCenterItem[] = [];
    const costing: ActionCenterItem[] = [];
    const operations: ActionCenterItem[] = [];

    for (const row of feedbacks.data ?? []) {
      if (row.workflow_stage === "new") {
        crm.push({ id: row.id, title: "Review new feedback", detail: `${row.phone ?? "Customer"} · ${row.overall_score ?? "—"}/5 · ${((row.customer_sources as unknown as { name?: string } | null)?.name ?? "Feedback")}`, category: "crm", priority: Number(row.overall_score ?? 5) <= 2 ? "urgent" : "normal", href: "/admin/crm/feedback", createdAt: row.created_at });
      }
    }

    for (const row of recoveries.data ?? []) {
      crm.push({ id: row.id, title: "Open customer follow-up", detail: `${row.phone} · ${row.complaint_reason ?? "Needs follow-up"}`, category: "crm", priority: row.priority === "urgent" || row.priority === "high" ? "urgent" : "high", href: "/admin/crm/follow-ups", createdAt: row.updated_at });
    }

    for (const row of discounts.data ?? []) {
      const remaining = Number(row.usage_limit ?? 0) - Number(row.used_count ?? 0);
      const left = daysLeft(row.expires_at);
      const finished = row.status !== "active" || remaining <= 0 || left < 0;
      if (finished) continue;
      const customerRel = row.customers as unknown as { phone?: string } | null;
      loyalty.push({ id: row.id, title: left <= 3 ? "Discount code expiry reminder" : "Discount code follow-up", detail: `${row.code} · ${customerRel?.phone ?? "No phone"} · ${Number.isFinite(left) ? `${left} day(s) left` : "No expiry"}`, category: "loyalty", priority: left <= 3 ? "urgent" : "normal", href: "/admin/crm/discounts" });
    }


    for (const row of loyaltyCounters.data ?? []) {
      const rule = row.loyalty_program_rules as unknown as { name?: string; reward_label?: string } | null;
      loyalty.push({
        id: row.id,
        title: "Loyalty reward ready",
        detail: `${row.phone} · ${rule?.name ?? "Loyalty"} · ${Number(row.pending_rewards ?? 0)} reward(s) ready`,
        category: "loyalty",
        priority: "high",
        href: "/admin/crm/loyalty",
      });
    }

    for (const row of invoices.data ?? []) {
      const overdue = new Date(row.entry_date).getTime() < monthStart.getTime();
      finance.push({ id: row.id, title: overdue ? "Previous month unpaid invoice" : "Unpaid invoice", detail: `${row.title} · ${Number(row.amount ?? 0).toFixed(3)} OMR · ${row.entry_date}`, category: "finance", priority: overdue ? "urgent" : "high", href: "/admin/finance/invoices", createdAt: row.entry_date });
    }


    for (const row of recipes.data ?? []) {
      const components = Array.isArray(row.components) ? row.components : [];
      if (row.item_type === "menu_item" && components.length === 0) {
        costing.push({ id: row.id, title: "Menu item missing recipe", detail: row.name, category: "costing", priority: "high", href: "/admin/finance/costing" });
      }
      if (row.item_type === "ingredient" && (Number(row.purchase_price) <= 0 || Number(row.purchase_qty) <= 0)) {
        costing.push({ id: row.id, title: "Ingredient missing valid purchase cost", detail: row.name, category: "costing", priority: "high", href: "/admin/finance/costing" });
      }
      if (row.item_type === "prep_item" && (components.length === 0 || Number(row.purchase_qty) <= 0)) {
        costing.push({ id: row.id, title: "Prep item missing recipe or output quantity", detail: row.name, category: "costing", priority: "high", href: "/admin/finance/costing" });
      }
      if (row.item_type === "menu_item" && Number(row.sale_price) <= 0) {
        costing.push({ id: row.id, title: "Menu item missing sale price", detail: row.name, category: "costing", priority: "normal", href: "/admin/finance/costing" });
      }
    }

    const all = [...crm, ...loyalty, ...finance, ...operations, ...costing];
    const urgent = all.filter((item) => item.priority === "urgent");
    const today = new Date().toISOString().slice(0, 10);
    const dueToday = all.filter((item) => item.createdAt?.slice(0, 10) === today && item.priority !== "urgent");

    return { success: true, urgent, dueToday, crm, loyalty, finance, operations, costing };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Could not load Action Center.", urgent: [], dueToday: [], crm: [], loyalty: [], finance: [], operations: [], costing: [] };
  }
}
