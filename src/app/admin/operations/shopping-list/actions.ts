"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAuthenticatedUser, requireCurrentBusinessSlug } from "@/lib/auth-session";
import { requireModulePermission } from "@/lib/user-permissions";

export type ShoppingDepartment = "bar" | "hall" | "kitchen";

export type ShoppingListItemRow = {
  id: string;
  ingredientId: string | null;
  ingredientName: string;
  unit: string | null;
  department: ShoppingDepartment;
  quantity: number;
  notes: string | null;
  requestedByEmail: string | null;
  createdAt: string;
};

export type ShoppingListState = {
  success: boolean;
  message?: string;
  listId: string | null;
  items: ShoppingListItemRow[];
  ingredients: { id: string; name: string; unit: string | null }[];
};

export type ShoppingListHistoryRow = {
  id: string;
  finalizedAt: string | null;
  finalizedByEmail: string | null;
  itemCount: number;
  createdAt: string;
};

export type ShoppingListDetail = {
  id: string;
  finalizedAt: string | null;
  finalizedByEmail: string | null;
  createdAt: string;
  items: ShoppingListItemRow[];
};

async function shoppingListContext() {
  const actor = await requireAuthenticatedUser();
  const businessSlug = await requireCurrentBusinessSlug();
  const supabase = createSupabaseAdminClient();
  const { data: business, error } = await supabase
    .from("businesses")
    .select("id")
    .eq("slug", businessSlug)
    .maybeSingle();
  if (error || !business) throw new Error(error?.message ?? "Business was not found.");
  return { actor, supabase, businessId: business.id as string };
}

function mapItem(row: Record<string, unknown>): ShoppingListItemRow {
  return {
    id: row.id as string,
    ingredientId: (row.ingredient_id as string | null) ?? null,
    ingredientName: row.ingredient_name as string,
    unit: (row.unit as string | null) ?? null,
    department: row.department as ShoppingDepartment,
    quantity: Number(row.quantity ?? 0),
    notes: (row.notes as string | null) ?? null,
    requestedByEmail: (row.requested_by_email as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

async function getOrCreateOpenList(supabase: ReturnType<typeof createSupabaseAdminClient>, businessId: string) {
  const { data: existing } = await supabase
    .from("shopping_lists")
    .select("id")
    .eq("business_id", businessId)
    .eq("status", "open")
    .maybeSingle();
  if (existing) return existing.id as string;

  const { data: created, error } = await supabase
    .from("shopping_lists")
    .insert({ business_id: businessId })
    .select("id")
    .single();
  if (error || !created) throw new Error(error?.message ?? "Could not start a new shopping list.");
  return created.id as string;
}

export async function getShoppingListState(): Promise<ShoppingListState> {
  await requireModulePermission("shopping_list", "view");
  try {
    const { supabase, businessId } = await shoppingListContext();
    const listId = await getOrCreateOpenList(supabase, businessId);

    const [{ data: items, error: itemsError }, { data: ingredients, error: ingredientsError }] = await Promise.all([
      supabase
        .from("shopping_list_items")
        .select("*")
        .eq("shopping_list_id", listId)
        .order("department")
        .order("created_at"),
      supabase
        .from("recipe_costing_items")
        .select("id,name,unit")
        .eq("business_id", businessId)
        .eq("item_type", "ingredient")
        .eq("active", true)
        .order("name"),
    ]);

    if (itemsError) return { success: false, message: itemsError.message, listId, items: [], ingredients: [] };
    if (ingredientsError) return { success: false, message: ingredientsError.message, listId, items: [], ingredients: [] };

    return {
      success: true,
      listId,
      items: (items ?? []).map(mapItem),
      ingredients: (ingredients ?? []).map((row) => ({ id: row.id as string, name: row.name as string, unit: (row.unit as string | null) ?? null })),
    };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Could not load the shopping list.", listId: null, items: [], ingredients: [] };
  }
}

export async function addShoppingListItem(input: {
  ingredientId?: string | null;
  ingredientName: string;
  unit?: string | null;
  department: ShoppingDepartment;
  quantity: number;
  notes?: string;
}): Promise<{ success: boolean; message?: string }> {
  await requireModulePermission("shopping_list", "edit");
  try {
    const { actor, supabase, businessId } = await shoppingListContext();
    const listId = await getOrCreateOpenList(supabase, businessId);

    if (!input.ingredientName.trim()) return { success: false, message: "Ingredient name is required." };
    if (!(input.quantity > 0)) return { success: false, message: "Enter a quantity greater than 0." };

    const { error } = await supabase.from("shopping_list_items").insert({
      shopping_list_id: listId,
      business_id: businessId,
      ingredient_id: input.ingredientId || null,
      ingredient_name: input.ingredientName.trim(),
      unit: input.unit?.trim() || null,
      department: input.department,
      quantity: input.quantity,
      notes: input.notes?.trim() || null,
      requested_by_email: actor.email,
    });
    if (error) return { success: false, message: error.message };

    revalidatePath("/admin/operations/shopping-list");
    return { success: true };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Could not add the item." };
  }
}

export async function updateShoppingListItem(input: {
  id: string;
  quantity?: number;
  notes?: string;
  department?: ShoppingDepartment;
}): Promise<{ success: boolean; message?: string }> {
  await requireModulePermission("shopping_list", "edit");
  try {
    const { supabase } = await shoppingListContext();
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.quantity !== undefined) {
      if (!(input.quantity > 0)) return { success: false, message: "Enter a quantity greater than 0." };
      patch.quantity = input.quantity;
    }
    if (input.notes !== undefined) patch.notes = input.notes.trim() || null;
    if (input.department !== undefined) patch.department = input.department;

    const { error } = await supabase.from("shopping_list_items").update(patch).eq("id", input.id);
    if (error) return { success: false, message: error.message };

    revalidatePath("/admin/operations/shopping-list");
    return { success: true };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Could not update the item." };
  }
}

export async function deleteShoppingListItem(id: string): Promise<{ success: boolean; message?: string }> {
  await requireModulePermission("shopping_list", "edit");
  try {
    const { supabase } = await shoppingListContext();
    const { error } = await supabase.from("shopping_list_items").delete().eq("id", id);
    if (error) return { success: false, message: error.message };
    revalidatePath("/admin/operations/shopping-list");
    return { success: true };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Could not remove the item." };
  }
}

export async function finalizeShoppingList(): Promise<{ success: boolean; message?: string }> {
  await requireModulePermission("shopping_list", "edit");
  try {
    const { actor, supabase, businessId } = await shoppingListContext();
    const listId = await getOrCreateOpenList(supabase, businessId);

    const { count } = await supabase
      .from("shopping_list_items")
      .select("id", { count: "exact", head: true })
      .eq("shopping_list_id", listId);
    if (!count) return { success: false, message: "Add at least one item before finalizing." };

    const { error } = await supabase
      .from("shopping_lists")
      .update({
        status: "finalized",
        finalized_at: new Date().toISOString(),
        finalized_by: actor.id,
        finalized_by_email: actor.email,
        updated_at: new Date().toISOString(),
      })
      .eq("id", listId);
    if (error) return { success: false, message: error.message };

    // Start the next open list right away so the shared list resets.
    await getOrCreateOpenList(supabase, businessId);

    revalidatePath("/admin/operations/shopping-list");
    return { success: true };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Could not finalize the shopping list." };
  }
}

export async function getShoppingListHistory(): Promise<{ success: boolean; message?: string; lists: ShoppingListHistoryRow[] }> {
  await requireModulePermission("shopping_list", "view");
  try {
    const { supabase, businessId } = await shoppingListContext();
    const { data: lists, error } = await supabase
      .from("shopping_lists")
      .select("id,finalized_at,finalized_by_email,created_at,shopping_list_items(count)")
      .eq("business_id", businessId)
      .eq("status", "finalized")
      .order("finalized_at", { ascending: false })
      .limit(100);
    if (error) return { success: false, message: error.message, lists: [] };

    return {
      success: true,
      lists: (lists ?? []).map((row) => ({
        id: row.id as string,
        finalizedAt: (row.finalized_at as string | null) ?? null,
        finalizedByEmail: (row.finalized_by_email as string | null) ?? null,
        itemCount: Array.isArray(row.shopping_list_items) ? Number((row.shopping_list_items[0] as { count?: number } | undefined)?.count ?? 0) : 0,
        createdAt: row.created_at as string,
      })),
    };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Could not load shopping list history.", lists: [] };
  }
}

export async function getShoppingListDetail(id: string): Promise<{ success: boolean; message?: string; list: ShoppingListDetail | null }> {
  await requireModulePermission("shopping_list", "view");
  try {
    const { supabase } = await shoppingListContext();
    const [{ data: list, error: listError }, { data: items, error: itemsError }] = await Promise.all([
      supabase.from("shopping_lists").select("id,finalized_at,finalized_by_email,created_at").eq("id", id).maybeSingle(),
      supabase.from("shopping_list_items").select("*").eq("shopping_list_id", id).order("department").order("created_at"),
    ]);
    if (listError || !list) return { success: false, message: listError?.message ?? "List was not found.", list: null };
    if (itemsError) return { success: false, message: itemsError.message, list: null };

    return {
      success: true,
      list: {
        id: list.id as string,
        finalizedAt: (list.finalized_at as string | null) ?? null,
        finalizedByEmail: (list.finalized_by_email as string | null) ?? null,
        createdAt: list.created_at as string,
        items: (items ?? []).map(mapItem),
      },
    };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Could not load the shopping list.", list: null };
  }
}
