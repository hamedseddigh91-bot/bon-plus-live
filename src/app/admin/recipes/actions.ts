"use server";

import { revalidatePath } from "next/cache";
import { getCurrentBusinessSlug } from "@/lib/business-context";
import { requireAuthenticatedUser } from "@/lib/auth-session";
import { requireModulePermission } from "@/lib/user-permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type RecipeComponent = { itemId: string; qty: number; notes?: string };

export type RecipeCostingItem = {
  id: string;
  businessId: string;
  itemType: "ingredient" | "prep_item" | "menu_item";
  name: string;
  category: string;
  unit: string;
  purchaseQty: number | string;
  purchasePrice: number | string;
  wastePercent: number | string;
  salePrice: number | string;
  targetProfitPercent: number | string;
  components: RecipeComponent[];
  notes: string | null;
  active: boolean;
  createdByEmail: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RecipeCostRow = {
  itemId: string;
  name: string;
  category: string;
  salePrice: number;
  recipeCost: number;
  grossProfit: number;
  marginPercent: number;
  foodCostPercent: number;
  saleMultiple: number;
  componentCount: number;
};

export type RecipeCostingSummary = {
  success: boolean;
  message?: string;
  ingredientCount: number;
  prepItemCount: number;
  menuItemCount: number;
  averageCost: number;
  averageSalePrice: number;
  averageGrossProfit: number;
  averageSaleMultiple: number;
};

export type RecipeCostingState = {
  success: boolean;
  message?: string;
  items: RecipeCostingItem[];
  ingredients: RecipeCostingItem[];
  prepItems: RecipeCostingItem[];
  menuItems: RecipeCostingItem[];
  recipeCosts: RecipeCostRow[];
  summary: RecipeCostingSummary;
};

export type ActionResult = { success: boolean; message?: string };

type CostingContext = {
  success: boolean;
  message?: string;
  businessId: string | null;
  businessSlug: string;
  actor: Awaited<ReturnType<typeof requireAuthenticatedUser>>;
  role: string | null;
};

function numberValue(value: number | string | null | undefined) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function normalizeComponents(value: unknown): RecipeComponent[] {
  if (!Array.isArray(value)) return [];
  return value.map((component) => {
    if (!component || typeof component !== "object") return null;
    const row = component as Record<string, unknown>;
    const itemId = String(row.itemId ?? row.item_id ?? "").trim();
    const qty = numberValue(row.qty as number | string | null | undefined);
    const notes = String(row.notes ?? "").trim();
    if (!itemId || qty <= 0) return null;
    return { itemId, qty, ...(notes ? { notes } : {}) };
  }).filter((component): component is RecipeComponent => Boolean(component));
}

function mapItem(row: any): RecipeCostingItem {
  return {
    id: row.id,
    businessId: row.business_id,
    itemType: row.item_type,
    name: row.name,
    category: row.category,
    unit: row.unit,
    purchaseQty: row.purchase_qty,
    purchasePrice: row.purchase_price,
    wastePercent: row.waste_percent,
    salePrice: row.sale_price,
    targetProfitPercent: row.target_profit_percent,
    components: normalizeComponents(row.components),
    notes: row.notes,
    active: row.active,
    createdByEmail: row.created_by_email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function ingredientUnitCost(item: Pick<RecipeCostingItem, "purchaseQty" | "purchasePrice" | "wastePercent">) {
  const qty = numberValue(item.purchaseQty);
  const price = numberValue(item.purchasePrice);
  const waste = numberValue(item.wastePercent);
  const usableQty = qty * (1 - waste / 100);
  return usableQty > 0 ? price / usableQty : 0;
}

function buildUnitCostResolver(items: RecipeCostingItem[]) {
  const byId = new Map(items.filter((item) => item.active).map((item) => [item.id, item]));
  const memo = new Map<string, number>();

  const unitCostFor = (itemId: string, path = new Set<string>()): number => {
    if (memo.has(itemId)) return memo.get(itemId) ?? 0;
    const item = byId.get(itemId);
    if (!item || path.has(itemId)) return 0;
    if (item.itemType === "ingredient") {
      const cost = ingredientUnitCost(item);
      memo.set(itemId, cost);
      return cost;
    }
    if (item.itemType === "prep_item") {
      const next = new Set(path);
      next.add(itemId);
      const batchCost = item.components.reduce((sum, component) => sum + unitCostFor(component.itemId, next) * numberValue(component.qty), 0);
      const outputQty = numberValue(item.purchaseQty);
      const cost = outputQty > 0 ? batchCost / outputQty : 0;
      memo.set(itemId, cost);
      return cost;
    }
    return 0;
  };

  return { unitCostFor, byId };
}

function calculateRecipeCosts(items: RecipeCostingItem[]): RecipeCostRow[] {
  const { unitCostFor } = buildUnitCostResolver(items);
  return items.filter((item) => item.active && item.itemType === "menu_item").map((item) => {
    const recipeCost = item.components.reduce((sum, component) => sum + unitCostFor(component.itemId) * numberValue(component.qty), 0);
    const salePrice = numberValue(item.salePrice);
    const grossProfit = salePrice - recipeCost;
    const marginPercent = salePrice > 0 ? (grossProfit / salePrice) * 100 : 0;
    const foodCostPercent = salePrice > 0 ? (recipeCost / salePrice) * 100 : 0;
    const saleMultiple = recipeCost > 0 ? salePrice / recipeCost : 0;
    return { itemId: item.id, name: item.name, category: item.category, salePrice, recipeCost, grossProfit, marginPercent, foodCostPercent, saleMultiple, componentCount: item.components.length };
  });
}

function buildState(items: RecipeCostingItem[], message?: string): RecipeCostingState {
  const activeItems = items.filter((item) => item.active);
  const ingredients = activeItems.filter((item) => item.itemType === "ingredient");
  const prepItems = activeItems.filter((item) => item.itemType === "prep_item");
  const menuItems = activeItems.filter((item) => item.itemType === "menu_item");
  const recipeCosts = calculateRecipeCosts(activeItems);
  const average = (selector: (row: RecipeCostRow) => number) => recipeCosts.length ? recipeCosts.reduce((sum, row) => sum + selector(row), 0) / recipeCosts.length : 0;
  return {
    success: true,
    message,
    items: activeItems,
    ingredients,
    prepItems,
    menuItems,
    recipeCosts,
    summary: {
      success: true,
      ingredientCount: ingredients.length,
      prepItemCount: prepItems.length,
      menuItemCount: menuItems.length,
      averageCost: average((row) => row.recipeCost),
      averageSalePrice: average((row) => row.salePrice),
      averageGrossProfit: average((row) => row.grossProfit),
      averageSaleMultiple: average((row) => row.saleMultiple),
    },
  };
}

function emptyState(message: string): RecipeCostingState {
  return {
    success: false,
    message,
    items: [], ingredients: [], prepItems: [], menuItems: [], recipeCosts: [],
    summary: { success: false, message, ingredientCount: 0, prepItemCount: 0, menuItemCount: 0, averageCost: 0, averageSalePrice: 0, averageGrossProfit: 0, averageSaleMultiple: 0 },
  };
}

async function getCostingContext(): Promise<CostingContext> {
  const actor = await requireAuthenticatedUser();
  const businessSlug = await getCurrentBusinessSlug();
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("_operations_get_context", { p_slug: businessSlug, p_actor_auth_user_id: actor.id, p_actor_email: actor.email });
  const context = Array.isArray(data) ? data[0] : null;
  if (error || !context?.business_id) return { success: false, message: error?.message ?? "Business access was not found.", businessId: null, businessSlug, actor, role: null };
  if (!["owner", "manager", "accountant"].includes(context.actor_role)) return { success: false, message: "You do not have recipe costing access.", businessId: context.business_id as string, businessSlug, actor, role: context.actor_role as string };
  return { success: true, businessId: context.business_id as string, businessSlug, actor, role: context.actor_role as string };
}

export async function getRecipeCostingState(): Promise<RecipeCostingState> {
  await requireModulePermission("costing", "view");
  const context = await getCostingContext();
  if (!context.success || !context.businessId) return emptyState(context.message ?? "Recipe costing access failed.");
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("recipe_costing_items").select("*").eq("business_id", context.businessId).eq("active", true).order("item_type").order("category").order("name");
  if (error) return emptyState(error.message);
  return buildState((data ?? []).map(mapItem));
}

function createsCycle(itemId: string, components: RecipeComponent[], items: RecipeCostingItem[]) {
  const graph = new Map(items.filter((i) => i.itemType === "prep_item").map((i) => [i.id, i.components.map((c) => c.itemId)]));
  graph.set(itemId, components.map((c) => c.itemId));
  const visit = (node: string, path: Set<string>): boolean => {
    if (node === itemId && path.size > 0) return true;
    if (path.has(node)) return false;
    const nextPath = new Set(path); nextPath.add(node);
    return (graph.get(node) ?? []).some((next) => visit(next, nextPath));
  };
  return components.some((c) => visit(c.itemId, new Set<string>()));
}

export async function saveRecipeCostingItem(input: {
  id?: string | null;
  itemType: "ingredient" | "prep_item" | "menu_item";
  name: string;
  category?: string;
  unit?: string;
  purchaseQty?: string;
  purchasePrice?: string;
  wastePercent?: string;
  salePrice?: string;
  targetProfitPercent?: string;
  components?: RecipeComponent[];
  notes?: string;
}): Promise<ActionResult> {
  await requireModulePermission("costing", "edit");
  const context = await getCostingContext();
  if (!context.success || !context.businessId) return { success: false, message: context.message ?? "Recipe costing access failed." };
  const name = input.name.trim();
  if (!name) return { success: false, message: "Name is required." };

  const supabase = createSupabaseAdminClient();
  const components = input.itemType === "ingredient" ? [] : normalizeComponents(input.components ?? []);
  if (input.itemType !== "ingredient") {
    const { data } = await supabase.from("recipe_costing_items").select("*").eq("business_id", context.businessId).eq("active", true);
    const items = (data ?? []).map(mapItem);
    const allowed = new Set(items.filter((item) => item.itemType === "ingredient" || item.itemType === "prep_item").map((item) => item.id));
    if (components.some((component) => !allowed.has(component.itemId))) return { success: false, message: "Recipes can only contain ingredients and prep items." };
    if (input.itemType === "prep_item" && input.id && createsCycle(input.id, components, items)) return { success: false, message: "Circular prep dependency is not allowed." };
  }

  const payload = {
    business_id: context.businessId,
    item_type: input.itemType,
    name,
    category: input.category?.trim() || "General",
    unit: input.unit?.trim() || "piece",
    purchase_qty: Math.max(0, numberValue(input.purchaseQty)),
    purchase_price: Math.max(0, numberValue(input.purchasePrice)),
    waste_percent: Math.min(99.99, Math.max(0, numberValue(input.wastePercent))),
    sale_price: Math.max(0, numberValue(input.salePrice)),
    target_profit_percent: 0,
    components,
    notes: input.notes?.trim() || null,
    active: true,
    created_by: context.actor.id,
    created_by_email: context.actor.email,
  };

  const query = input.id
    ? supabase.from("recipe_costing_items").update(payload).eq("id", input.id).eq("business_id", context.businessId)
    : supabase.from("recipe_costing_items").insert(payload);
  const { error } = await query;
  revalidatePath("/admin/recipes");
  revalidatePath("/admin/finance/costing");
  if (error) return { success: false, message: error.message };
  return { success: true, message: input.itemType === "ingredient" ? "Ingredient saved." : input.itemType === "prep_item" ? "Prep item saved." : "Menu item saved." };
}

export async function archiveRecipeCostingItem(input: { id: string }): Promise<ActionResult> {
  await requireModulePermission("costing", "edit");
  const context = await getCostingContext();
  if (!context.success || !context.businessId) return { success: false, message: context.message ?? "Recipe costing access failed." };
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("recipe_costing_items").update({ active: false }).eq("id", input.id).eq("business_id", context.businessId);
  revalidatePath("/admin/recipes");
  revalidatePath("/admin/finance/costing");
  return error ? { success: false, message: error.message } : { success: true, message: "Item archived." };
}
