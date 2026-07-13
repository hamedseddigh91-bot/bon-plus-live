"use client";

import Link from "next/link";
import { type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, useMemo, useState, useTransition } from "react";
import {
  Building2,
  ChefHat,
  ExternalLink,
  Languages,
  MessageCircle,
  Percent,
  ReceiptText,
  Save,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
  Wand2,
} from "lucide-react";
import {
  type CoreControlState,
  type CoreControlSettings,
  saveCoreControlSettings,
} from "@/app/admin/settings/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  adminLanguageOptions,
  adminThemeOptions,
  type AdminLanguage,
  type AdminTheme,
  useAdminLanguage,
} from "@/lib/admin-language";

type AppControlCenterProps = {
  initialState: CoreControlState;
};

type Copy = {
  heroKicker: string;
  heroTitle: string;
  heroText: string;
  save: string;
  saving: string;
  saved: string;
  applyLocal: string;
  openFeedback: string;
  manageUsers: string;
  businessProfile: string;
  businessName: string;
  logoUrl: string;
  accentColor: string;
  address: string;
  mobileNumber: string;
  poBox: string;
  googleReview: string;
  globalExperience: string;
  defaultLanguage: string;
  defaultTheme: string;
  currency: string;
  decimals: string;
  financeRules: string;
  vat: string;
  talabat: string;
  tipCard: string;
  invoiceWhatsapp: string;
  whatsapp: string;
  invoiceLogo: string;
  invoiceFooter: string;
  feedbackRules: string;
  lockHours: string;
  sourceKey: string;
  recipeRules: string;
  targetFoodCost: string;
  lowMargin: string;
  accessControl: string;
  currentRole: string;
  canEdit: string;
  readOnly: string;
  permissionMap: string;
  enabled: string;
  disabled: string;
};

const copyByLanguage: Record<AdminLanguage, Copy> = {
  fa: {
    heroKicker: "Core Control Pack",
    heroTitle: "مرکز کنترل تنظیمات اپ",
    heroText: "اطلاعات بیزینس، زبان و تم پیش‌فرض، قوانین مالی، فاکتور، واتساپ، فیدبک و رسپی را از یکجا کنترل کن.",
    save: "ذخیره تنظیمات",
    saving: "در حال ذخیره...",
    saved: "ذخیره شد",
    applyLocal: "اعمال روی همین مرورگر",
    openFeedback: "باز کردن لینک فیدبک",
    manageUsers: "مدیریت کاربران",
    businessProfile: "پروفایل بیزینس",
    businessName: "نام بیزینس",
    logoUrl: "لینک لوگو",
    accentColor: "رنگ برند",
    address: "آدرس",
    mobileNumber: "شماره موبایل",
    poBox: "P.O.Box",
    googleReview: "لینک Google Review",
    globalExperience: "زبان و ظاهر پیش‌فرض",
    defaultLanguage: "زبان پیش‌فرض",
    defaultTheme: "تم پیش‌فرض",
    currency: "واحد پول",
    decimals: "تعداد اعشار",
    financeRules: "قوانین مالی",
    vat: "VAT %",
    talabat: "Talabat",
    tipCard: "Tip Card",
    invoiceWhatsapp: "فاکتور و واتساپ",
    whatsapp: "شماره واتساپ",
    invoiceLogo: "لوگوی فاکتور",
    invoiceFooter: "متن پایین فاکتور",
    feedbackRules: "قوانین فیدبک",
    lockHours: "قفل تکرار شماره / ساعت",
    sourceKey: "Source key",
    recipeRules: "قوانین Recipe Cost",
    targetFoodCost: "Food Cost هدف %",
    lowMargin: "هشدار Margin پایین %",
    accessControl: "نقش‌ها و دسترسی‌ها",
    currentRole: "نقش فعلی",
    canEdit: "قابل ویرایش",
    readOnly: "فقط نمایش",
    permissionMap: "نقشه دسترسی‌ها",
    enabled: "فعال",
    disabled: "غیرفعال",
  },
  ar: {
    heroKicker: "Core Control Pack",
    heroTitle: "مركز تحكم إعدادات التطبيق",
    heroText: "تحكم ببيانات النشاط، اللغة والمظهر الافتراضي، المالية، الفواتير، واتساب، الآراء وتكلفة الوصفات من مكان واحد.",
    save: "حفظ الإعدادات",
    saving: "جارٍ الحفظ...",
    saved: "تم الحفظ",
    applyLocal: "تطبيق على هذا المتصفح",
    openFeedback: "فتح رابط الآراء",
    manageUsers: "إدارة المستخدمين",
    businessProfile: "ملف النشاط",
    businessName: "اسم النشاط",
    logoUrl: "رابط الشعار",
    accentColor: "لون العلامة",
    address: "العنوان",
    mobileNumber: "رقم الهاتف",
    poBox: "صندوق البريد",
    googleReview: "رابط Google Review",
    globalExperience: "اللغة والمظهر الافتراضي",
    defaultLanguage: "اللغة الافتراضية",
    defaultTheme: "المظهر الافتراضي",
    currency: "العملة",
    decimals: "عدد الكسور",
    financeRules: "قواعد المالية",
    vat: "VAT %",
    talabat: "Talabat",
    tipCard: "Tip Card",
    invoiceWhatsapp: "الفاتورة وواتساب",
    whatsapp: "رقم واتساب",
    invoiceLogo: "شعار الفاتورة",
    invoiceFooter: "نص أسفل الفاتورة",
    feedbackRules: "قواعد الآراء",
    lockHours: "قفل تكرار الرقم / ساعة",
    sourceKey: "Source key",
    recipeRules: "قواعد تكلفة الوصفات",
    targetFoodCost: "هدف Food Cost %",
    lowMargin: "تنبيه Margin منخفض %",
    accessControl: "الأدوار والصلاحيات",
    currentRole: "الدور الحالي",
    canEdit: "قابل للتعديل",
    readOnly: "عرض فقط",
    permissionMap: "خريطة الصلاحيات",
    enabled: "مفعل",
    disabled: "غير مفعل",
  },
  en: {
    heroKicker: "Core Control Pack",
    heroTitle: "App control center",
    heroText: "Control business profile, default language/theme, finance rules, invoice, WhatsApp, feedback and recipe costing from one place.",
    save: "Save settings",
    saving: "Saving...",
    saved: "Saved",
    applyLocal: "Apply to this browser",
    openFeedback: "Open feedback link",
    manageUsers: "Manage users",
    businessProfile: "Business profile",
    businessName: "Business name",
    logoUrl: "Logo URL",
    accentColor: "Brand color",
    address: "Address",
    mobileNumber: "Mobile number",
    poBox: "P.O.Box",
    googleReview: "Google Review link",
    globalExperience: "Default language & theme",
    defaultLanguage: "Default language",
    defaultTheme: "Default theme",
    currency: "Currency",
    decimals: "Decimals",
    financeRules: "Finance rules",
    vat: "VAT %",
    talabat: "Talabat",
    tipCard: "Tip Card",
    invoiceWhatsapp: "Invoice & WhatsApp",
    whatsapp: "WhatsApp number",
    invoiceLogo: "Invoice logo",
    invoiceFooter: "Invoice footer text",
    feedbackRules: "Feedback rules",
    lockHours: "Phone repeat lock / hours",
    sourceKey: "Source key",
    recipeRules: "Recipe Cost rules",
    targetFoodCost: "Target Food Cost %",
    lowMargin: "Low Margin alert %",
    accessControl: "Roles & permissions",
    currentRole: "Current role",
    canEdit: "Editable",
    readOnly: "Read only",
    permissionMap: "Permission map",
    enabled: "Enabled",
    disabled: "Disabled",
  },
};

function emptySettings(): CoreControlSettings {
  return {
    businessId: "",
    businessName: "Bon Plus",
    slug: "bon-plus-cafe",
    logoUrl: null,
    accentColor: null,
    googleMapsReviewUrl: null,
    address: null,
    mobileNumber: null,
    poBox: null,
    defaultLanguage: "fa",
    defaultTheme: "dark",
    currencyCode: "OMR",
    currencyDecimals: 3,
    vatPercent: 0,
    whatsappNumber: null,
    invoiceFooterText: null,
    invoiceLogoUrl: null,
    enableTalabat: true,
    enableTipCard: true,
    feedbackLockHours: 24,
    feedbackAutoSourceKey: "feedback",
    recipeTargetFoodCostPercent: 30,
    recipeLowMarginPercent: 55,
    publicFeedbackUrl: "",
    qrImageUrl: "",
    updatedAt: null,
  };
}

function textValue(value: string | null | undefined) {
  return value ?? "";
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-white/48">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-white outline-none [color-scheme:dark] placeholder:text-white/28 focus:border-amber-200/45"
    />
  );
}

function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-white outline-none [color-scheme:dark] focus:border-amber-200/45"
    />
  );
}

function ToggleCard({
  label,
  enabled,
  onChange,
  enabledText,
  disabledText,
}: {
  label: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  enabledText: string;
  disabledText: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`rounded-2xl border p-4 text-left transition ${
        enabled
          ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
          : "border-white/10 bg-black/15 text-white/48"
      }`}
    >
      <p className="text-sm font-black text-white">{label}</p>
      <p className="mt-2 text-xs font-semibold">{enabled ? enabledText : disabledText}</p>
    </button>
  );
}

export function AppControlCenter({ initialState }: AppControlCenterProps) {
  const { language, setLanguage, theme, setTheme } = useAdminLanguage();
  const text = copyByLanguage[language];
  const [state, setState] = useState(initialState);
  const [settings, setSettings] = useState<CoreControlSettings>(initialState.settings ?? emptySettings());
  const [message, setMessage] = useState<string | null>(initialState.message ?? null);
  const [isPending, startTransition] = useTransition();
  const canEdit = state.canEdit && state.success;

  const controlSummary = useMemo(
    () => [
      { label: text.defaultLanguage, value: settings.defaultLanguage.toUpperCase(), icon: Languages },
      { label: text.defaultTheme, value: settings.defaultTheme, icon: Wand2 },
      { label: text.currency, value: settings.currencyCode, icon: WalletCards },
      { label: text.vat, value: `${settings.vatPercent || 0}%`, icon: Percent },
    ],
    [settings, text],
  );

  const update = <Key extends keyof CoreControlSettings>(key: Key, value: CoreControlSettings[Key]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const save = () => {
    startTransition(async () => {
      const result = await saveCoreControlSettings({
        businessName: settings.businessName,
        logoUrl: settings.logoUrl,
        accentColor: settings.accentColor,
        googleMapsReviewUrl: settings.googleMapsReviewUrl,
        address: settings.address,
        mobileNumber: settings.mobileNumber,
        poBox: settings.poBox,
        defaultLanguage: settings.defaultLanguage,
        defaultTheme: settings.defaultTheme,
        currencyCode: settings.currencyCode,
        currencyDecimals: settings.currencyDecimals,
        vatPercent: settings.vatPercent,
        whatsappNumber: settings.whatsappNumber,
        invoiceFooterText: settings.invoiceFooterText,
        invoiceLogoUrl: settings.invoiceLogoUrl,
        enableTalabat: settings.enableTalabat,
        enableTipCard: settings.enableTipCard,
        feedbackLockHours: settings.feedbackLockHours,
        feedbackAutoSourceKey: settings.feedbackAutoSourceKey,
        recipeTargetFoodCostPercent: settings.recipeTargetFoodCostPercent,
        recipeLowMarginPercent: settings.recipeLowMarginPercent,
      });

      setState(result);
      setMessage(result.message ?? (result.success ? text.saved : null));

      if (result.settings) {
        setSettings(result.settings);
      }
    });
  };

  const applyLocalDefaults = () => {
    setLanguage(settings.defaultLanguage);
    setTheme(settings.defaultTheme);
    setMessage(text.saved);
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2.35rem] border border-white/10 bg-white/[0.065] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.22)] sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full" style={{ background: "radial-gradient(circle, rgba(167,139,250,0.28), transparent 70%)" }} />
        <div className="pointer-events-none absolute -bottom-24 left-12 h-80 w-80 rounded-full" style={{ background: "radial-gradient(circle, rgba(252,211,77,0.20), transparent 70%)" }} />

        <div className="relative z-10 grid gap-6 xl:grid-cols-[1fr_auto] xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/15 bg-amber-200/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-amber-100">
              <Sparkles className="h-3.5 w-3.5" />
              {text.heroKicker}
            </div>
            <h2 className="mt-5 max-w-3xl text-4xl font-black tracking-[-0.055em] text-white sm:text-5xl">
              {text.heroTitle}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/48">{text.heroText}</p>
          </div>

          <div className="flex flex-wrap gap-2 xl:justify-end">
            <Button onClick={applyLocalDefaults} variant="secondary" disabled={!settings.businessId}>
              <Wand2 className="h-4 w-4" />
              {text.applyLocal}
            </Button>
            <Button onClick={save} disabled={!canEdit || isPending || !settings.businessName.trim()}>
              <Save className="h-4 w-4" />
              {isPending ? text.saving : text.save}
            </Button>
          </div>
        </div>
      </section>

      {message && (
        <div className="rounded-3xl border border-amber-200/10 bg-amber-200/[0.07] p-4 text-sm font-semibold text-amber-100">
          {message}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {controlSummary.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/36">{item.label}</p>
                <Icon className="h-5 w-5 text-amber-100" />
              </div>
              <p className="mt-4 text-2xl font-black text-white">{item.value}</p>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Card className="p-5">
            <div className="mb-5 flex items-center gap-3">
              <Building2 className="h-5 w-5 text-amber-100" />
              <h3 className="text-2xl font-black tracking-[-0.04em] text-white">{text.businessProfile}</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label={text.businessName}>
                <TextInput value={settings.businessName} onChange={(event) => update("businessName", event.target.value)} disabled={!canEdit} />
              </Field>
              <Field label={text.accentColor}>
                <TextInput value={textValue(settings.accentColor)} onChange={(event) => update("accentColor", event.target.value)} placeholder="#FACC15" disabled={!canEdit} />
              </Field>
              <Field label={text.logoUrl}>
                <TextInput value={textValue(settings.logoUrl)} onChange={(event) => update("logoUrl", event.target.value)} placeholder="https://..." disabled={!canEdit} />
              </Field>
              <Field label={text.googleReview}>
                <TextInput value={textValue(settings.googleMapsReviewUrl)} onChange={(event) => update("googleMapsReviewUrl", event.target.value)} placeholder="https://g.page/r/..." disabled={!canEdit} />
              </Field>
              <Field label={text.mobileNumber}>
                <div className="flex overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                  <span className="flex items-center border-e border-white/10 px-3 text-sm font-black text-amber-200" dir="ltr">+968</span>
                  <input value={textValue(settings.mobileNumber).replace(/\D+/g, "").slice(-8)} onChange={(event) => update("mobileNumber", event.target.value.replace(/\D+/g, "").slice(0, 8))} placeholder="91234567" inputMode="numeric" maxLength={8} dir="ltr" disabled={!canEdit} className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm font-semibold text-white outline-none disabled:opacity-50" />
                </div>
              </Field>
              <Field label={text.poBox}>
                <TextInput value={textValue(settings.poBox)} onChange={(event) => update("poBox", event.target.value)} disabled={!canEdit} />
              </Field>
              <div className="md:col-span-2">
                <Field label={text.address}>
                  <TextInput value={textValue(settings.address)} onChange={(event) => update("address", event.target.value)} disabled={!canEdit} />
                </Field>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-5 flex items-center gap-3">
              <Languages className="h-5 w-5 text-amber-100" />
              <h3 className="text-2xl font-black tracking-[-0.04em] text-white">{text.globalExperience}</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <Field label={text.defaultLanguage}>
                <SelectInput value={settings.defaultLanguage} onChange={(event) => update("defaultLanguage", event.target.value as AdminLanguage)} disabled={!canEdit}>
                  {adminLanguageOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </SelectInput>
              </Field>
              <Field label={text.defaultTheme}>
                <SelectInput value={settings.defaultTheme} onChange={(event) => update("defaultTheme", event.target.value as AdminTheme)} disabled={!canEdit}>
                  {adminThemeOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.value}</option>
                  ))}
                </SelectInput>
              </Field>
              <Field label={text.currency}>
                <TextInput value={settings.currencyCode} onChange={(event) => update("currencyCode", event.target.value.toUpperCase())} disabled={!canEdit} />
              </Field>
              <Field label={text.decimals}>
                <TextInput type="number" min={0} max={3} value={settings.currencyDecimals} onChange={(event) => update("currencyDecimals", Number(event.target.value))} disabled={!canEdit} />
              </Field>
            </div>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="p-5">
              <div className="mb-5 flex items-center gap-3">
                <WalletCards className="h-5 w-5 text-amber-100" />
                <h3 className="text-2xl font-black tracking-[-0.04em] text-white">{text.financeRules}</h3>
              </div>
              <div className="grid gap-4">
                <Field label={text.vat}>
                  <TextInput type="number" step="0.001" value={settings.vatPercent} onChange={(event) => update("vatPercent", Number(event.target.value))} disabled={!canEdit} />
                </Field>
                <div className="grid gap-3 md:grid-cols-2">
                  <ToggleCard label={text.talabat} enabled={settings.enableTalabat} onChange={(value) => update("enableTalabat", value)} enabledText={text.enabled} disabledText={text.disabled} />
                  <ToggleCard label={text.tipCard} enabled={settings.enableTipCard} onChange={(value) => update("enableTipCard", value)} enabledText={text.enabled} disabledText={text.disabled} />
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="mb-5 flex items-center gap-3">
                <ChefHat className="h-5 w-5 text-amber-100" />
                <h3 className="text-2xl font-black tracking-[-0.04em] text-white">{text.recipeRules}</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <Field label={text.targetFoodCost}>
                  <TextInput type="number" step="0.001" value={settings.recipeTargetFoodCostPercent} onChange={(event) => update("recipeTargetFoodCostPercent", Number(event.target.value))} disabled={!canEdit} />
                </Field>
                <Field label={text.lowMargin}>
                  <TextInput type="number" step="0.001" value={settings.recipeLowMarginPercent} onChange={(event) => update("recipeLowMarginPercent", Number(event.target.value))} disabled={!canEdit} />
                </Field>
              </div>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <div className="mb-5 flex items-center gap-3">
              <ReceiptText className="h-5 w-5 text-amber-100" />
              <h3 className="text-2xl font-black tracking-[-0.04em] text-white">{text.invoiceWhatsapp}</h3>
            </div>
            <div className="space-y-4">
              <Field label={text.whatsapp}>
                <div className="flex overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                  <span className="flex items-center border-e border-white/10 px-3 text-sm font-black text-amber-200" dir="ltr">+968</span>
                  <input value={textValue(settings.whatsappNumber).replace(/\D+/g, "").slice(-8)} onChange={(event) => update("whatsappNumber", event.target.value.replace(/\D+/g, "").slice(0, 8))} placeholder="91234567" inputMode="numeric" maxLength={8} dir="ltr" disabled={!canEdit} className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm font-semibold text-white outline-none disabled:opacity-50" />
                </div>
              </Field>
              <Field label={text.invoiceLogo}>
                <TextInput value={textValue(settings.invoiceLogoUrl)} onChange={(event) => update("invoiceLogoUrl", event.target.value)} placeholder="https://..." disabled={!canEdit} />
              </Field>
              <Field label={text.invoiceFooter}>
                <textarea
                  value={textValue(settings.invoiceFooterText)}
                  onChange={(event) => update("invoiceFooterText", event.target.value)}
                  disabled={!canEdit}
                  className="min-h-28 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-white outline-none [color-scheme:dark] placeholder:text-white/28 focus:border-amber-200/45"
                />
              </Field>
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-5 flex items-center gap-3">
              <MessageCircle className="h-5 w-5 text-amber-100" />
              <h3 className="text-2xl font-black tracking-[-0.04em] text-white">{text.feedbackRules}</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <Field label={text.lockHours}>
                <TextInput type="number" min={0} value={settings.feedbackLockHours} onChange={(event) => update("feedbackLockHours", Number(event.target.value))} disabled={!canEdit} />
              </Field>
              <Field label={text.sourceKey}>
                <TextInput value={settings.feedbackAutoSourceKey} onChange={(event) => update("feedbackAutoSourceKey", event.target.value)} disabled={!canEdit} />
              </Field>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {settings.publicFeedbackUrl && (
                <a href={settings.publicFeedbackUrl} target="_blank" rel="noreferrer">
                  <Button type="button" variant="secondary">
                    <ExternalLink className="h-4 w-4" />
                    {text.openFeedback}
                  </Button>
                </a>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-5 flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-amber-100" />
              <h3 className="text-2xl font-black tracking-[-0.04em] text-white">{text.accessControl}</h3>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/35">{text.currentRole}</p>
                <p className="mt-3 text-xl font-black capitalize text-white">{state.role?.replace("_", " ") ?? "—"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/35">{text.canEdit}</p>
                <p className="mt-3 text-xl font-black text-white">{canEdit ? text.enabled : text.readOnly}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/admin/users">
                <Button type="button" variant="secondary">
                  <Users className="h-4 w-4" />
                  {text.manageUsers}
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      <Card className="p-5">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h3 className="text-2xl font-black tracking-[-0.04em] text-white">{text.permissionMap}</h3>
          <Badge variant="amber">v4.7</Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {state.permissions.map((permission) => (
            <div key={permission.role} className="rounded-[1.35rem] border border-white/10 bg-black/18 p-4">
              <p className="text-lg font-black text-white">{permission.label}</p>
              <p className="mt-2 min-h-12 text-xs leading-5 text-white/42">{permission.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {permission.modules.map((module) => (
                  <Badge key={module} variant="secondary" className="px-2 py-0.5 text-[10px]">
                    {module}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
