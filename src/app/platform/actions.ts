"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requirePlatformAdminContext } from "@/lib/auth-session";

export type PlatformBusiness = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  accentColor: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PlatformState = {
  success: boolean;
  message?: string;
  businesses: PlatformBusiness[];
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

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

async function upsertBusinessUserDirect(input: {
  businessId: string;
  authUserId: string;
  email: string;
  displayName: string;
  role: "owner" | "manager" | "accountant" | "staff" | "read_only";
}) {
  const supabase = createSupabaseAdminClient();
  const email = input.email.trim().toLowerCase();

  const { data: existing } = await supabase
    .from("business_users")
    .select("id")
    .eq("business_id", input.businessId)
    .ilike("email", email)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase
      .from("business_users")
      .update({
        auth_user_id: input.authUserId,
        email,
        display_name: input.displayName,
        role: input.role,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase.from("business_users").insert({
    business_id: input.businessId,
    auth_user_id: input.authUserId,
    email,
    display_name: input.displayName,
    role: input.role,
    is_active: true,
  });

  if (error) throw new Error(error.message);
}

export async function getPlatformState(): Promise<PlatformState> {
  await requirePlatformAdminContext();

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("businesses")
    .select("id,name,slug,logo_url,accent_color,is_active,created_at,updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    return {
      success: false,
      message: error.message,
      businesses: [],
    };
  }

  return {
    success: true,
    businesses: (data ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      logoUrl: item.logo_url,
      accentColor: item.accent_color,
      active: item.is_active,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    })),
  };
}

export async function createBusinessWithOwner(input: {
  businessName: string;
  slug: string;
  ownerEmail: string;
  ownerName: string;
  ownerPassword: string;
}) {
  const platform = await requirePlatformAdminContext();
  const supabase = createSupabaseAdminClient();

  const businessName = input.businessName.trim();
  const slug = slugify(input.slug || businessName);
  const ownerEmail = input.ownerEmail.trim().toLowerCase();
  const ownerName = input.ownerName.trim() || "Owner";
  const ownerPassword = input.ownerPassword;

  if (!businessName || !slug || !ownerEmail || ownerPassword.length < 6) {
    return {
      success: false,
      message: "Business name, slug, owner email and password are required.",
    };
  }

  try {
    const { data: existingBusiness } = await supabase
      .from("businesses")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existingBusiness?.id) {
      return {
        success: false,
        message: "This slug is already used.",
      };
    }

    const ownerUser = await createOrUpdateAuthUser({
      email: ownerEmail,
      password: ownerPassword,
      displayName: ownerName,
    });

    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .insert({
        name: businessName,
        slug,
        is_active: true,
        accent_color: "#ffd42a",
      })
      .select("id,name,slug")
      .single();

    if (businessError || !business) {
      throw new Error(businessError?.message ?? "Could not create business.");
    }

    await supabase.from("app_settings").insert({
      business_id: business.id,
      feedback_lock_hours: 24,
      feedback_auto_source_key: "feedback",
      default_language: "en",
    });

    await upsertBusinessUserDirect({
      businessId: business.id,
      authUserId: ownerUser.id,
      email: ownerEmail,
      displayName: ownerName,
      role: "owner",
    });

    await supabase.from("activity_logs").insert({
      business_id: business.id,
      action: "business_created_by_platform",
      entity_type: "business",
      entity_id: business.id,
      metadata: {
        platformAdminEmail: platform.user.email,
        ownerEmail,
        ownerName,
      },
    });

    revalidatePath("/platform");

    return {
      success: true,
      message: "Business and owner created.",
      slug,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Create business failed.",
    };
  }
}
