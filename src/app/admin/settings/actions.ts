"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { BusinessRole } from "@/lib/auth-session";
import type { LanguageCode } from "@/types/feedback";
import { requireModulePermission, userHasModulePermission } from "@/lib/user-permissions";
import { normalizeOmanPhone } from "@/lib/oman-phone";

type AdminLanguage = "fa" | "ar" | "en";
type AdminTheme = "dark" | "light" | "liquid-dark" | "liquid-light";

export type CoreControlSettings = {
  businessId: string;
  businessName: string;
  slug: string;
  logoUrl: string | null;
  accentColor: string | null;
  googleMapsReviewUrl: string | null;
  address: string | null;
  mobileNumber: string | null;
  poBox: string | null;
  defaultLanguage: AdminLanguage;
  defaultTheme: AdminTheme;
  currencyCode: string;
  currencyDecimals: number;
  vatPercent: number;
  whatsappNumber: string | null;
  invoiceFooterText: string | null;
  invoiceLogoUrl: string | null;
  enableTalabat: boolean;
  enableTipCard: boolean;
  feedbackLockHours: number;
  feedbackAutoSourceKey: string;
  recipeTargetFoodCostPercent: number;
  recipeLowMarginPercent: number;
  publicFeedbackUrl: string;
  qrImageUrl: string;
  updatedAt: string | null;
};

export type CoreControlState = {
  success: boolean;
  message?: string;
  settings: CoreControlSettings | null;
  role: BusinessRole | null;
  canEdit: boolean;
  permissions: Array<{
    role: BusinessRole;
    label: string;
    description: string;
    modules: string[];
  }>;
};

export type SaveCoreControlInput = {
  businessName: string;
  logoUrl?: string | null;
  accentColor?: string | null;
  googleMapsReviewUrl?: string | null;
  address?: string | null;
  mobileNumber?: string | null;
  poBox?: string | null;
  defaultLanguage: AdminLanguage;
  defaultTheme: AdminTheme;
  currencyCode: string;
  currencyDecimals: number;
  vatPercent: number;
  whatsappNumber?: string | null;
  invoiceFooterText?: string | null;
  invoiceLogoUrl?: string | null;
  enableTalabat: boolean;
  enableTipCard: boolean;
  feedbackLockHours: number;
  feedbackAutoSourceKey: string;
  recipeTargetFoodCostPercent: number;
  recipeLowMarginPercent: number;
};

export type BusinessSettings = {
  businessId: string;
  businessName: string;
  slug: string;
  logoUrl: string | null;
  accentColor: string | null;
  googleMapsReviewUrl: string | null;
  address: string | null;
  mobileNumber: string | null;
  poBox: string | null;
  feedbackLockHours: number;
  feedbackAutoSourceKey: string;
  defaultLanguage: LanguageCode;
  defaultTheme: AdminTheme;
  currencyCode: string;
  currencyDecimals: number;
  vatPercent: number;
  whatsappNumber: string | null;
  invoiceFooterText: string | null;
  invoiceLogoUrl: string | null;
  enableTalabat: boolean;
  enableTipCard: boolean;
  recipeTargetFoodCostPercent: number;
  recipeLowMarginPercent: number;
  publicFeedbackUrl: string;
  qrImageUrl: string;
};

export type BusinessSettingsState = {
  success: boolean;
  message?: string;
  settings: BusinessSettings | null;
};

export type SaveBusinessSettingsInput = {
  businessName: string;
  logoUrl?: string | null;
  accentColor?: string | null;
  googleMapsReviewUrl: string | null;
  address?: string | null;
  mobileNumber?: string | null;
  poBox?: string | null;
  feedbackLockHours: number;
  defaultLanguage: LanguageCode;
  defaultTheme?: AdminTheme;
  currencyCode?: string;
  currencyDecimals?: number;
  vatPercent?: number;
  whatsappNumber?: string | null;
  invoiceFooterText?: string | null;
  invoiceLogoUrl?: string | null;
  enableTalabat?: boolean;
  enableTipCard?: boolean;
  feedbackAutoSourceKey: string;
  recipeTargetFoodCostPercent?: number;
  recipeLowMarginPercent?: number;
};

const rolePermissions: CoreControlState["permissions"] = [
  {
    role: "owner",
    label: "Owner",
    description: "Full access to settings, users, finance, reports and system controls.",
    modules: ["All modules", "Users", "Settings", "Finance", "System"],
  },
  {
    role: "manager",
    label: "Manager",
    description: "Operational access without platform-level system ownership.",
    modules: ["Finance", "Feedback", "Customers", "Reports", "Settings"],
  },
  {
    role: "accountant",
    label: "Accountant",
    description: "Finance and reports access for daily accounting work.",
    modules: ["Finance", "Reports", "Dashboard"],
  },
  {
    role: "staff",
    label: "Staff",
    description: "Customer-facing access for feedback, recovery and CRM tasks.",
    modules: ["Feedback", "Recovery", "Customers"],
  },
  {
    role: "read_only",
    label: "Read only",
    description: "View-only reporting access.",
    modules: ["Dashboard", "Reports"],
  },
];

function getBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

function cleanText(value: string | null | undefined) {
  const next = String(value ?? "").trim();
  return next.length > 0 ? next : null;
}

function normalizeLanguage(value: unknown): AdminLanguage {
  if (value === "fa" || value === "ar" || value === "en") return value;
  return "fa";
}

function normalizeTheme(value: unknown): AdminTheme {
  if (value === "light" || value === "dark" || value === "liquid-dark" || value === "liquid-light") return value;
  return "dark";
}

function numberValue(value: unknown, fallback = 0) {
  const next = Number(value ?? fallback);
  return Number.isFinite(next) ? next : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

async function getSettingsRow(businessId: string) {
  const supabase = createSupabaseAdminClient();

  const { data: existing, error: existingError } = await supabase
    .from("app_settings")
    .select(
      "business_id,feedback_lock_hours,feedback_auto_source_key,default_language,default_theme,currency_code,currency_decimals,vat_percent,whatsapp_number,invoice_footer_text,invoice_logo_url,enable_talabat,enable_tip_card,recipe_target_food_cost_percent,recipe_low_margin_percent,updated_at",
    )
    .eq("business_id", businessId)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) return existing;

  const { data: inserted, error: insertError } = await supabase
    .from("app_settings")
    .insert({
      business_id: businessId,
      feedback_lock_hours: 24,
      feedback_auto_source_key: "feedback",
      default_language: "fa",
      default_theme: "dark",
      currency_code: "OMR",
      currency_decimals: 3,
      vat_percent: 0,
      enable_talabat: true,
      enable_tip_card: true,
      recipe_target_food_cost_percent: 30,
      recipe_low_margin_percent: 55,
    })
    .select(
      "business_id,feedback_lock_hours,feedback_auto_source_key,default_language,default_theme,currency_code,currency_decimals,vat_percent,whatsapp_number,invoice_footer_text,invoice_logo_url,enable_talabat,enable_tip_card,recipe_target_food_cost_percent,recipe_low_margin_percent,updated_at",
    )
    .single();

  if (insertError) {
    throw new Error(insertError.message);
  }

  return inserted;
}

function mapSettings(params: {
  business: Record<string, any>;
  appSettings: Record<string, any>;
}) {
  const baseUrl = getBaseUrl();
  const feedbackUrl = `${baseUrl}/feedback`;

  return {
    businessId: String(params.business.id),
    businessName: String(params.business.name ?? "Bon Plus"),
    slug: String(params.business.slug ?? "bon-plus-cafe"),
    logoUrl: params.business.logo_url ?? null,
    accentColor: params.business.accent_color ?? null,
    googleMapsReviewUrl: params.business.google_maps_review_url ?? null,
    address: params.business.address ?? null,
    mobileNumber: params.business.mobile_number ?? null,
    poBox: params.business.po_box ?? null,
    defaultLanguage: normalizeLanguage(params.appSettings.default_language),
    defaultTheme: normalizeTheme(params.appSettings.default_theme),
    currencyCode: String(params.appSettings.currency_code ?? "OMR"),
    currencyDecimals: clamp(numberValue(params.appSettings.currency_decimals, 3), 0, 3),
    vatPercent: numberValue(params.appSettings.vat_percent, 0),
    whatsappNumber: params.appSettings.whatsapp_number ?? null,
    invoiceFooterText: params.appSettings.invoice_footer_text ?? null,
    invoiceLogoUrl: params.appSettings.invoice_logo_url ?? null,
    enableTalabat: Boolean(params.appSettings.enable_talabat ?? true),
    enableTipCard: Boolean(params.appSettings.enable_tip_card ?? true),
    feedbackLockHours: Math.max(0, numberValue(params.appSettings.feedback_lock_hours, 24)),
    feedbackAutoSourceKey: String(params.appSettings.feedback_auto_source_key ?? "feedback"),
    recipeTargetFoodCostPercent: numberValue(params.appSettings.recipe_target_food_cost_percent, 30),
    recipeLowMarginPercent: numberValue(params.appSettings.recipe_low_margin_percent, 55),
    publicFeedbackUrl: feedbackUrl,
    qrImageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(feedbackUrl)}`,
    updatedAt: params.appSettings.updated_at ?? null,
  } satisfies CoreControlSettings;
}

export async function getCoreControlState(): Promise<CoreControlState> {
  const context = await requireModulePermission("settings_general", "view");
  const supabase = createSupabaseAdminClient();

  try {
    const [canEdit, businessResult, appSettings] = await Promise.all([
      userHasModulePermission(context, "settings_general", "edit"),
      supabase
        .from("businesses")
        .select("id,name,slug,logo_url,accent_color,google_maps_review_url,address,mobile_number,po_box")
        .eq("id", context.currentBusiness.id)
        .maybeSingle(),
      getSettingsRow(context.currentBusiness.id),
    ]);

    const { data: business, error: businessError } = businessResult;

    if (businessError || !business) {
      return {
        success: false,
        message: businessError?.message ?? "Business was not found.",
        settings: null,
        role: context.role,
        canEdit: false,
        permissions: rolePermissions,
      };
    }

    return {
      success: true,
      settings: mapSettings({ business, appSettings }),
      role: context.role,
      canEdit,
      permissions: rolePermissions,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Settings could not be loaded.",
      settings: null,
      role: context.role,
      canEdit: false,
      permissions: rolePermissions,
    };
  }
}

export async function saveCoreControlSettings(input: SaveCoreControlInput): Promise<CoreControlState> {
  const context = await requireModulePermission("settings_general", "edit");

  const businessName = cleanText(input.businessName);

  if (!businessName) {
    return {
      success: false,
      message: "Business name is required.",
      settings: null,
      role: context.role,
      canEdit: true,
      permissions: rolePermissions,
    };
  }

  const supabase = createSupabaseAdminClient();
  const { error: businessError } = await supabase
    .from("businesses")
    .update({
      name: businessName,
      logo_url: cleanText(input.logoUrl),
      accent_color: cleanText(input.accentColor),
      google_maps_review_url: cleanText(input.googleMapsReviewUrl),
      address: cleanText(input.address),
      mobile_number: input.mobileNumber ? normalizeOmanPhone(input.mobileNumber) || null : null,
      po_box: cleanText(input.poBox),
      updated_at: new Date().toISOString(),
    })
    .eq("id", context.currentBusiness.id);

  if (businessError) {
    return {
      success: false,
      message: businessError.message,
      settings: null,
      role: context.role,
      canEdit: true,
      permissions: rolePermissions,
    };
  }

  const { error: settingsError } = await supabase.from("app_settings").upsert(
    {
      business_id: context.currentBusiness.id,
      feedback_lock_hours: Math.max(0, Math.round(numberValue(input.feedbackLockHours, 24))),
      feedback_auto_source_key: cleanText(input.feedbackAutoSourceKey) ?? "feedback",
      default_language: normalizeLanguage(input.defaultLanguage),
      default_theme: normalizeTheme(input.defaultTheme),
      currency_code: (cleanText(input.currencyCode) ?? "OMR").toUpperCase().slice(0, 8),
      currency_decimals: clamp(Math.round(numberValue(input.currencyDecimals, 3)), 0, 3),
      vat_percent: clamp(numberValue(input.vatPercent, 0), 0, 100),
      whatsapp_number: input.whatsappNumber ? normalizeOmanPhone(input.whatsappNumber) || null : null,
      invoice_footer_text: cleanText(input.invoiceFooterText),
      invoice_logo_url: cleanText(input.invoiceLogoUrl),
      enable_talabat: Boolean(input.enableTalabat),
      enable_tip_card: Boolean(input.enableTipCard),
      recipe_target_food_cost_percent: clamp(numberValue(input.recipeTargetFoodCostPercent, 30), 0, 100),
      recipe_low_margin_percent: clamp(numberValue(input.recipeLowMarginPercent, 55), 0, 100),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "business_id" },
  );

  if (settingsError) {
    return {
      success: false,
      message: settingsError.message,
      settings: null,
      role: context.role,
      canEdit: true,
      permissions: rolePermissions,
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/finance");
  revalidatePath("/admin/finance/closing");
  revalidatePath("/admin/finance/invoices");
  revalidatePath("/admin/finance/cash");
  revalidatePath("/admin/recipes");
  revalidatePath("/feedback");

  const nextState = await getCoreControlState();

  return {
    ...nextState,
    message: "Core control settings saved.",
  };
}

export async function getBusinessSettings(): Promise<BusinessSettingsState> {
  const state = await getCoreControlState();

  if (!state.success || !state.settings) {
    return {
      success: false,
      message: state.message,
      settings: null,
    };
  }

  return {
    success: true,
    settings: {
      businessId: state.settings.businessId,
      businessName: state.settings.businessName,
      slug: state.settings.slug,
      logoUrl: state.settings.logoUrl,
      accentColor: state.settings.accentColor,
      googleMapsReviewUrl: state.settings.googleMapsReviewUrl,
      address: state.settings.address,
      mobileNumber: state.settings.mobileNumber,
      poBox: state.settings.poBox,
      feedbackLockHours: state.settings.feedbackLockHours,
      feedbackAutoSourceKey: state.settings.feedbackAutoSourceKey,
      defaultLanguage: state.settings.defaultLanguage as LanguageCode,
      defaultTheme: state.settings.defaultTheme,
      currencyCode: state.settings.currencyCode,
      currencyDecimals: state.settings.currencyDecimals,
      vatPercent: state.settings.vatPercent,
      whatsappNumber: state.settings.whatsappNumber,
      invoiceFooterText: state.settings.invoiceFooterText,
      invoiceLogoUrl: state.settings.invoiceLogoUrl,
      enableTalabat: state.settings.enableTalabat,
      enableTipCard: state.settings.enableTipCard,
      recipeTargetFoodCostPercent: state.settings.recipeTargetFoodCostPercent,
      recipeLowMarginPercent: state.settings.recipeLowMarginPercent,
      publicFeedbackUrl: state.settings.publicFeedbackUrl,
      qrImageUrl: state.settings.qrImageUrl,
    },
  };
}

export async function saveBusinessSettings(input: SaveBusinessSettingsInput): Promise<BusinessSettingsState> {
  const current = await getCoreControlState();

  if (!current.settings) {
    return {
      success: false,
      message: current.message ?? "Settings could not be loaded.",
      settings: null,
    };
  }

  const result = await saveCoreControlSettings({
    ...current.settings,
    businessName: input.businessName,
    logoUrl: input.logoUrl ?? current.settings.logoUrl,
    accentColor: input.accentColor ?? current.settings.accentColor,
    googleMapsReviewUrl: input.googleMapsReviewUrl,
    address: input.address ?? current.settings.address,
    mobileNumber: input.mobileNumber ?? current.settings.mobileNumber,
    poBox: input.poBox ?? current.settings.poBox,
    feedbackLockHours: input.feedbackLockHours,
    defaultLanguage: input.defaultLanguage as AdminLanguage,
    defaultTheme: input.defaultTheme ?? current.settings.defaultTheme,
    currencyCode: input.currencyCode ?? current.settings.currencyCode,
    currencyDecimals: input.currencyDecimals ?? current.settings.currencyDecimals,
    vatPercent: input.vatPercent ?? current.settings.vatPercent,
    whatsappNumber: input.whatsappNumber ?? current.settings.whatsappNumber,
    invoiceFooterText: input.invoiceFooterText ?? current.settings.invoiceFooterText,
    invoiceLogoUrl: input.invoiceLogoUrl ?? current.settings.invoiceLogoUrl,
    enableTalabat: input.enableTalabat ?? current.settings.enableTalabat,
    enableTipCard: input.enableTipCard ?? current.settings.enableTipCard,
    feedbackAutoSourceKey: input.feedbackAutoSourceKey,
    recipeTargetFoodCostPercent: input.recipeTargetFoodCostPercent ?? current.settings.recipeTargetFoodCostPercent,
    recipeLowMarginPercent: input.recipeLowMarginPercent ?? current.settings.recipeLowMarginPercent,
  });

  if (!result.success || !result.settings) {
    return {
      success: false,
      message: result.message,
      settings: null,
    };
  }

  return {
    success: true,
    message: result.message,
    settings: {
      businessId: result.settings.businessId,
      businessName: result.settings.businessName,
      slug: result.settings.slug,
      logoUrl: result.settings.logoUrl,
      accentColor: result.settings.accentColor,
      googleMapsReviewUrl: result.settings.googleMapsReviewUrl,
      address: result.settings.address,
      mobileNumber: result.settings.mobileNumber,
      poBox: result.settings.poBox,
      feedbackLockHours: result.settings.feedbackLockHours,
      feedbackAutoSourceKey: result.settings.feedbackAutoSourceKey,
      defaultLanguage: result.settings.defaultLanguage as LanguageCode,
      defaultTheme: result.settings.defaultTheme,
      currencyCode: result.settings.currencyCode,
      currencyDecimals: result.settings.currencyDecimals,
      vatPercent: result.settings.vatPercent,
      whatsappNumber: result.settings.whatsappNumber,
      invoiceFooterText: result.settings.invoiceFooterText,
      invoiceLogoUrl: result.settings.invoiceLogoUrl,
      enableTalabat: result.settings.enableTalabat,
      enableTipCard: result.settings.enableTipCard,
      recipeTargetFoodCostPercent: result.settings.recipeTargetFoodCostPercent,
      recipeLowMarginPercent: result.settings.recipeLowMarginPercent,
      publicFeedbackUrl: result.settings.publicFeedbackUrl,
      qrImageUrl: result.settings.qrImageUrl,
    },
  };
}

export async function uploadBusinessLogo(formData: FormData): Promise<{ success: boolean; message: string; logoUrl?: string | null }> {
  const context = await requireModulePermission("settings_general", "edit");

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, message: "Please choose a logo file." };
  }
  if (!file.type.startsWith("image/")) {
    return { success: false, message: "Logo must be an image file." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { success: false, message: "Logo must be 5 MB or smaller." };
  }

  const supabase = createSupabaseAdminClient();
  const extension = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const path = `${context.currentBusiness.id}/logo-${Date.now()}.${extension}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from("business-assets")
    .upload(path, bytes, { contentType: file.type, upsert: false, cacheControl: "3600" });

  if (uploadError) return { success: false, message: uploadError.message };
  const { data } = supabase.storage.from("business-assets").getPublicUrl(path);
  const logoUrl = data.publicUrl;
  const { error: updateError } = await supabase
    .from("businesses")
    .update({ logo_url: logoUrl, updated_at: new Date().toISOString() })
    .eq("id", context.currentBusiness.id);

  if (updateError) {
    await supabase.storage.from("business-assets").remove([path]);
    return { success: false, message: updateError.message };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/settings/general");
  return { success: true, message: "Logo uploaded.", logoUrl };
}

export async function removeBusinessLogo(): Promise<{ success: boolean; message: string; logoUrl?: null }> {
  const context = await requireModulePermission("settings_general", "edit");
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("businesses")
    .update({ logo_url: null, updated_at: new Date().toISOString() })
    .eq("id", context.currentBusiness.id);
  if (error) return { success: false, message: error.message };
  revalidatePath("/admin");
  revalidatePath("/admin/settings/general");
  return { success: true, message: "Logo removed.", logoUrl: null };
}
