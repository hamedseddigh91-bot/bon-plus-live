"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus, Save, Trash2 } from "lucide-react";
import {
  removeBusinessLogo,
  saveCoreControlSettings,
  uploadBusinessLogo,
  type CoreControlState,
} from "@/app/admin/settings/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAdminLanguage } from "@/lib/admin-language";

const copy = {
  fa: {
    title: "تنظیمات عمومی",
    desc: "اطلاعات پایه بیزینس و تجربه عمومی سیستم",
    save: "ذخیره",
    saving: "در حال ذخیره...",
    business: "نام بیزینس",
    logo: "لوگو",
    uploadLogo: "آپلود لوگو",
    replaceLogo: "تغییر لوگو",
    removeLogo: "حذف لوگو",
    logoHint: "PNG، JPG، WEBP یا SVG تا 5MB",
    color: "رنگ برند",
    address: "آدرس",
    mobile: "شماره موبایل",
    po: "P.O.Box",
    lang: "زبان پیش‌فرض",
    theme: "تم پیش‌فرض",
    currency: "واحد پول",
    decimals: "تعداد اعشار",
  },
  ar: {
    title: "الإعدادات العامة",
    desc: "بيانات النشاط والإعدادات العامة للنظام",
    save: "حفظ",
    saving: "جارٍ الحفظ...",
    business: "اسم النشاط",
    logo: "الشعار",
    uploadLogo: "رفع الشعار",
    replaceLogo: "تغيير الشعار",
    removeLogo: "حذف الشعار",
    logoHint: "PNG أو JPG أو WEBP أو SVG حتى 5MB",
    color: "لون العلامة",
    address: "العنوان",
    mobile: "رقم الهاتف",
    po: "صندوق البريد",
    lang: "اللغة الافتراضية",
    theme: "المظهر الافتراضي",
    currency: "العملة",
    decimals: "الكسور",
  },
  en: {
    title: "General Settings",
    desc: "Business profile and global system experience",
    save: "Save",
    saving: "Saving...",
    business: "Business name",
    logo: "Logo",
    uploadLogo: "Upload logo",
    replaceLogo: "Replace logo",
    removeLogo: "Remove logo",
    logoHint: "PNG, JPG, WEBP or SVG up to 5MB",
    color: "Brand color",
    address: "Address",
    mobile: "Mobile number",
    po: "P.O.Box",
    lang: "Default language",
    theme: "Default theme",
    currency: "Currency",
    decimals: "Decimals",
  },
};

export function GeneralSettingsManager({ initialState }: { initialState: CoreControlState }) {
  const { language } = useAdminLanguage();
  const t = copy[language];
  const [s, setS] = useState(initialState.settings);
  const [msg, setMsg] = useState(initialState.message || "");
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  if (!s) return <Card className="p-6">{msg || "Settings unavailable"}</Card>;

  const input = "w-full rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-soft)] px-4 py-3 text-sm text-[color:var(--admin-text)] outline-none";
  const field = (label: string, node: React.ReactNode) => (
    <label><span className="mb-2 block text-sm font-bold text-[color:var(--admin-muted)]">{label}</span>{node}</label>
  );

  const save = () => start(async () => {
    const r = await saveCoreControlSettings({ ...s });
    setMsg(r.message || (r.success ? "Saved" : "Error"));
    if (r.settings) setS(r.settings);
  });

  const uploadLogo = (file: File | null) => {
    if (!file) return;
    start(async () => {
      const form = new FormData();
      form.set("logo", file);
      const result = await uploadBusinessLogo(form);
      setMsg(result.message);
      if (result.success && typeof result.logoUrl === "string") {
        setS((current) => current ? { ...current, logoUrl: result.logoUrl ?? null } : current);
      }
      if (fileRef.current) fileRef.current.value = "";
    });
  };

  const removeLogo = () => start(async () => {
    const result = await removeBusinessLogo();
    setMsg(result.message);
    if (result.success) setS((current) => current ? { ...current, logoUrl: null } : current);
  });

  return (
    <div className="space-y-5">
      <Card className="p-6">
        <h1 className="text-2xl font-black text-[color:var(--admin-text)]">{t.title}</h1>
        <p className="mt-2 text-sm text-[color:var(--admin-muted)]">{t.desc}</p>
      </Card>

      <Card className="p-6">
        <div className="grid gap-5 md:grid-cols-2">
          {field(t.business, <input className={input} value={s.businessName} onChange={(e) => setS({ ...s, businessName: e.target.value })} />)}

          <div>
            <span className="mb-2 block text-sm font-bold text-[color:var(--admin-muted)]">{t.logo}</span>
            <div className="rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-soft)] p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[color:var(--admin-border)] bg-black/10">
                  {s.logoUrl ? <img src={s.logoUrl} alt="Business logo" className="h-full w-full object-contain p-2" /> : <ImagePlus className="h-7 w-7 text-[color:var(--admin-muted)]" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-[color:var(--admin-muted)]">{t.logoHint}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(e) => uploadLogo(e.target.files?.[0] ?? null)} />
                    <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()} disabled={pending || !initialState.canEdit}>
                      <ImagePlus className="h-4 w-4" />{s.logoUrl ? t.replaceLogo : t.uploadLogo}
                    </Button>
                    {s.logoUrl && (
                      <Button type="button" variant="secondary" onClick={removeLogo} disabled={pending || !initialState.canEdit}>
                        <Trash2 className="h-4 w-4" />{t.removeLogo}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {field(t.color, <input className={input} value={s.accentColor || ""} onChange={(e) => setS({ ...s, accentColor: e.target.value })} />)}
          {field(t.address, <input className={input} value={s.address || ""} onChange={(e) => setS({ ...s, address: e.target.value })} />)}
          {field(t.mobile, <input className={input} value={s.mobileNumber || ""} onChange={(e) => setS({ ...s, mobileNumber: e.target.value })} />)}
          {field(t.po, <input className={input} value={s.poBox || ""} onChange={(e) => setS({ ...s, poBox: e.target.value })} />)}
          {field(t.lang, <select className={input} value={s.defaultLanguage} onChange={(e) => setS({ ...s, defaultLanguage: e.target.value as "fa" | "ar" | "en" })}><option value="fa">فارسی</option><option value="ar">العربية</option><option value="en">English</option></select>)}
          {field(t.theme, <select className={input} value={s.defaultTheme} onChange={(e) => setS({ ...s, defaultTheme: e.target.value as "dark" | "light" | "liquid-dark" | "liquid-light" })}><option value="dark">Dark</option><option value="light">Light</option><option value="liquid-dark">Liquid Glass Dark</option><option value="liquid-light">Liquid Glass Light</option></select>)}
          {field(t.currency, <input className={input} value={s.currencyCode} onChange={(e) => setS({ ...s, currencyCode: e.target.value })} />)}
          {field(t.decimals, <input type="number" min={0} max={3} className={input} value={s.currencyDecimals} onChange={(e) => setS({ ...s, currencyDecimals: Number(e.target.value) })} />)}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Button onClick={save} disabled={pending || !initialState.canEdit}><Save className="h-4 w-4" />{pending ? t.saving : t.save}</Button>
          {msg && <span className="text-sm text-[color:var(--admin-muted)]">{msg}</span>}
        </div>
      </Card>
    </div>
  );
}
