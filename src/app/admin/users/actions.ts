"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireCurrentBusinessSlug, type BusinessRole } from "@/lib/auth-session";
import { requireModulePermission } from "@/lib/user-permissions";

export type BusinessUser = {
  id: string;
  businessId: string;
  authUserId: string | null;
  email: string;
  displayName: string | null;
  role: BusinessRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UsersState = {
  success: boolean;
  message?: string;
  users: BusinessUser[];
};

async function findAuthUserByEmail(email: string) {
  const supabase = createSupabaseAdminClient();
  const cleanEmail = email.toLowerCase();

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error) return null;

    const found = data.users.find((user) => user.email?.toLowerCase() === cleanEmail);

    if (found) return found;

    if (data.users.length < 1000) break;
  }

  return null;
}

async function createOrUpdateAuthUser(input: {
  email: string;
  password: string;
  displayName: string;
}) {
  const supabase = createSupabaseAdminClient();
  const email = input.email.trim().toLowerCase();
  const existing = await findAuthUserByEmail(email);

  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: input.password,
      email_confirm: true,
      user_metadata: {
        display_name: input.displayName,
      },
    } as any);

    if (error || !data.user) {
      throw new Error(error?.message ?? "Could not update auth user.");
    }

    return data.user;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      display_name: input.displayName,
    },
  });

  if (error || !data.user) {
    throw new Error(error?.message ?? "Could not create auth user.");
  }

  return data.user;
}

export async function getBusinessUsers(): Promise<UsersState> {
  const actor = (await requireModulePermission("settings_users", "view")).user;
  const businessSlug = await requireCurrentBusinessSlug();
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc("admin_list_business_users_fast", {
    p_slug: businessSlug,
    p_actor_auth_user_id: actor.id,
    p_actor_email: actor.email,
  });

  if (error) {
    return {
      success: false,
      message: error.message,
      users: [],
    };
  }

  return data as UsersState;
}

export async function createBusinessUserDirect(input: {
  email: string;
  displayName: string;
  password: string;
  role: BusinessRole;
  active: boolean;
}) {
  const actor = (await requireModulePermission("settings_users", "edit")).user;
  const businessSlug = await requireCurrentBusinessSlug();
  const supabase = createSupabaseAdminClient();

  const email = input.email.trim().toLowerCase();
  const displayName = input.displayName.trim() || email;
  const password = input.password;

  if (!email || password.length < 6) {
    return {
      success: false,
      message: "Email and password with at least 6 characters are required.",
    };
  }

  try {
    const authUser = await createOrUpdateAuthUser({
      email,
      password,
      displayName,
    });

    const { data, error } = await supabase.rpc("admin_upsert_business_user_fast", {
      p_slug: businessSlug,
      p_email: email,
      p_display_name: displayName,
      p_role: input.role,
      p_is_active: input.active,
      p_actor_auth_user_id: actor.id,
      p_actor_email: actor.email,
    });

    if (error || !data?.success) {
      return {
        success: false,
        message: data?.message ?? error?.message ?? "Could not save business user.",
      };
    }

    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("slug", businessSlug)
      .maybeSingle();

    if (business?.id) {
      await supabase
        .from("business_users")
        .update({
          auth_user_id: authUser.id,
          updated_at: new Date().toISOString(),
        })
        .eq("business_id", business.id)
        .ilike("email", email);
    }

    revalidatePath("/admin/users");

    return {
      success: true,
      message: "User created.",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Create user failed.",
    };
  }
}

export async function saveBusinessUser(input: {
  email: string;
  displayName: string;
  role: BusinessRole;
  active: boolean;
}) {
  const actor = (await requireModulePermission("settings_users", "edit")).user;
  const businessSlug = await requireCurrentBusinessSlug();
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc("admin_upsert_business_user_fast", {
    p_slug: businessSlug,
    p_email: input.email,
    p_display_name: input.displayName || null,
    p_role: input.role,
    p_is_active: input.active,
    p_actor_auth_user_id: actor.id,
    p_actor_email: actor.email,
  });

  revalidatePath("/admin/users");

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  return data as { success: boolean; message?: string };
}
