"use server";

import { revalidatePath } from "next/cache";
import { getCurrentBusinessSlug } from "@/lib/business-context";
import { requireAuthenticatedUser } from "@/lib/auth-session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type RecipeComponent = {
  itemId: string;
  qty: number;
  notes?: string;
};

export type RecipeCostingItem = {
  id: string;
  businessId: string;
  itemType: "ingredient" | "menu_item";
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
  componentCount: number;
  status: "good" | "watch" | "danger";
};

export type RecipeCostingSummary = {
  success: boolean;
  message?: string;
  ingredientCount: number;
  menuItemCount: number;
  averageCost: number;
  averageSalePrice: number;
  lowMarginCount: number;
};

export type RecipeCostingState = {
  success: boolean;
  message?: string;
  items: RecipeCostingItem[];
  ingredients: RecipeCostingItem[];
  menuItems: RecipeCostingItem[];
  recipeCosts: RecipeCostRow[];
  summary: RecipeCostingSummary;
};

export type ActionResult = {
  success: boolean;
  message?: string;
};

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

  return value
    .map((component) => {
      if (!component || typeof component !== "object") return null;
      const row = component as Record<string, unknown>;
      const itemId = String(row.itemId ?? row.item_id ?? "").trim();
      const qty = numberValue(row.qty as number | string | null | undefined);
      const notes = String(row.notes ?? "").trim();

      if (!itemId || qty <= 0) return null;

      return {
        itemId,
        qty,
        ...(notes ? { notes } : {}),
      };
    })
    .filter((component): component is RecipeComponent => Boolean(component));
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

  if (usableQty <= 0) return 0;

  return price / usableQty;
}

function calculateRecipeCosts(items: RecipeCostingItem[]): RecipeCostRow[] {
  const ingredientMap = new Map(
    items
      .filter((item) => item.active && item.itemType === "ingredient")
      .map((item) => [item.id, ingredientUnitCost(item)]),
  );

  return items
    .filter((item) => item.active && item.itemType === "menu_item")
    .map((item) => {
      const recipeCost = item.components.reduce((sum, component) => {
        return sum + (ingredientMap.get(component.itemId) ?? 0) * numberValue(component.qty);
      }, 0);
      const salePrice = numberValue(item.salePrice);
      const grossProfit = salePrice - recipeCost;
      const marginPercent = salePrice > 0 ? (grossProfit / salePrice) * 100 : 0;
      const foodCostPercent = salePrice > 0 ? (recipeCost / salePrice) * 100 : 0;
      const targetProfit = numberValue(item.targetProfitPercent);
      const status: RecipeCostRow["status"] =
        salePrice <= 0 || marginPercent < targetProfit - 15
          ? "danger"
          : marginPercent < targetProfit
            ? "watch"
            : "good";

      return {
        itemId: item.id,
        name: item.name,
        category: item.category,
        salePrice,
        recipeCost,
        grossProfit,
        marginPercent,
        foodCostPercent,
        componentCount: item.components.length,
        status,
      };
    });
}

function buildState(items: RecipeCostingItem[], message?: string): RecipeCostingState {
  const activeItems = items.filter((item) => item.active);
  const ingredients = activeItems.filter((item) => item.itemType === "ingredient");
  const menuItems = activeItems.filter((item) => item.itemType === "menu_item");
  const recipeCosts = calculateRecipeCosts(activeItems);
  const summary: RecipeCostingSummary = {
    success: true,
    ingredientCount: ingredients.length,
    menuItemCount: menuItems.length,
    averageCost: recipeCosts.length
      ? recipeCosts.reduce((sum, row) => sum + row.recipeCost, 0) / recipeCosts.length
      : 0,
    averageSalePrice: recipeCosts.length
      ? recipeCosts.reduce((sum, row) => sum + row.salePrice, 0) / recipeCosts.length
      : 0,
    lowMarginCount: recipeCosts.filter((row) => row.status !== "good").length,
  };

  return {
    success: true,
    message,
    items: activeItems,
    ingredients,
    menuItems,
    recipeCosts,
    summary,
  };
}

async function getCostingContext(): Promise<CostingContext> {
  const actor = await requireAuthenticatedUser();
  const businessSlug = await getCurrentBusinessSlug();
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc("_operations_get_context", {
    p_slug: businessSlug,
    p_actor_auth_user_id: actor.id,
    p_actor_email: actor.email,
  });

  const context = Array.isArray(data) ? data[0] : null;

  if (error || !context?.business_id) {
    return {
      success: false,
      message: error?.message ?? "Business access was not found.",
      businessId: null,
      businessSlug,
      actor,
      role: null,
    };
  }

  if (!["owner", "manager", "accountant"].includes(context.actor_role)) {
    return {
      success: false,
      message: "You do not have recipe costing access.",
      businessId: context.business_id as string,
      businessSlug,
      actor,
      role: context.actor_role as string,
    };
  }

  return {
    success: true,
    businessId: context.business_id as string,
    businessSlug,
    actor,
    role: context.actor_role as string,
  };
}

export async function getRecipeCostingState(): Promise<RecipeCostingState> {
  const context = await getCostingContext();

  if (!context.success || !context.businessId) {
    return {
      success: false,
      message: context.message ?? "Recipe costing access failed.",
      items: [],
      ingredients: [],
      menuItems: [],
      recipeCosts: [],
      summary: {
        success: false,
        message: context.message,
        ingredientCount: 0,
        menuItemCount: 0,
        averageCost: 0,
        averageSalePrice: 0,
        lowMarginCount: 0,
      },
    };
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("recipe_costing_items")
    .select("*")
    .eq("business_id", context.businessId)
    .eq("active", true)
    .order("item_type", { ascending: true })
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    return {
      success: false,
      message: error.message,
      items: [],
      ingredients: [],
      menuItems: [],
      recipeCosts: [],
      summary: {
        success: false,
        message: error.message,
        ingredientCount: 0,
        menuItemCount: 0,
        averageCost: 0,
        averageSalePrice: 0,
        lowMarginCount: 0,
      },
    };
  }

  return buildState((data ?? []).map(mapItem));
}

export async function saveRecipeCostingItem(input: {
  id?: string | null;
  itemType: "ingredient" | "menu_item";
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
  const context = await getCostingContext();

  if (!context.success || !context.businessId) {
    return {
      success: false,
      message: context.message ?? "Recipe costing access failed.",
    };
  }

  const name = input.name.trim();

  if (!name) {
    return {
      success: false,
      message: "Name is required.",
    };
  }

  const supabase = createSupabaseAdminClient();
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
    target_profit_percent: Math.min(100, Math.max(0, numberValue(input.targetProfitPercent || 65))),
    components: input.itemType === "menu_item" ? normalizeComponents(input.components ?? []) : [],
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

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  return {
    success: true,
    message: input.itemType === "ingredient" ? "Ingredient saved." : "Menu item saved.",
  };
}

export async function archiveRecipeCostingItem(input: { id: string }): Promise<ActionResult> {
  const context = await getCostingContext();

  if (!context.success || !context.businessId) {
    return {
      success: false,
      message: context.message ?? "Recipe costing access failed.",
    };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("recipe_costing_items")
    .update({ active: false })
    .eq("id", input.id)
    .eq("business_id", context.businessId);

  revalidatePath("/admin/recipes");

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  return {
    success: true,
    message: "Item archived.",
  };
}
