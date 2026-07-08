"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAdminLanguage } from "@/lib/admin-language";
import {
  saveWhatsAppTemplate,
  type WhatsAppTemplate,
} from "@/app/admin/settings/whatsapp-messages/actions";

const titles: Record<string, { fa: string; ar: string; en: string }> = {
  feedback_high: { fa: "فیدبک: امتیاز 4 یا بیشتر", ar: "الآراء: تقييم 4 أو أكثر", en: "Feedback: score 4+" },
  feedback_mid: { fa: "فیدبک: بیشتر از 2 و کمتر از 4", ar: "الآراء: أكثر من 2 وأقل من 4", en: "Feedback: above 2 and below 4" },
  feedback_low: { fa: "فیدبک: امتیاز 2 یا کمتر", ar: "الآراء: تقييم 2 أو أقل", en: "Feedback: score 2 or lower" },
  followup: { fa: "پیگیری مشتری", ar: "متابعة العميل", en: "Customer follow-up" },
  discount_early: { fa: "کد تخفیف: بیشتر از 3 روز", ar: "كود الخصم: أكثر من 3 أيام", en: "Discount code: more than 3 days" },
  discount_expiry: { fa: "کد تخفیف: 3 روز یا کمتر", ar: "كود الخصم: 3 أيام أو أقل", en: "Discount code: 3 days or less" },
  cash_closing: { fa: "صندوق بسته‌شده", ar: "إغلاق الصندوق", en: "Cash closing" },
  invoice: { fa: "فاکتور", ar: "الفاتورة", en: "Invoice" },
  loyalty_progress: { fa: "وفاداری: هنوز به تارگت نرسیده", ar: "الولاء: لم يصل للهدف", en: "Loyalty: target not reached" },
  loyalty_reward: { fa: "وفاداری: جایزه آماده است", ar: "الولاء: المكافأة جاهزة", en: "Loyalty: reward available" },
};

const copy = {
  fa: { title: "متن‌های واتساپ", desc: "تمام دکمه‌های واتساپ سیستم متن خود را از این صفحه می‌خوانند.", fa: "فارسی", ar: "عربی", en: "انگلیسی", save: "ذخیره", active: "فعال", saved: "ذخیره شد", failed: "ذخیره نشد", placeholders: "متغیرهای قابل استفاده" },
  ar: { title: "رسائل واتساب", desc: "جميع أزرار واتساب تقرأ النص من هذه الصفحة.", fa: "فارسي", ar: "عربي", en: "إنجليزي", save: "حفظ", active: "مفعل", saved: "تم الحفظ", failed: "فشل الحفظ", placeholders: "المتغيرات المتاحة" },
  en: { title: "WhatsApp Messages", desc: "Every WhatsApp action in the system reads its message from this central page.", fa: "Persian", ar: "Arabic", en: "English", save: "Save", active: "Active", saved: "Saved", failed: "Save failed", placeholders: "Available placeholders" },
};

const placeholderMap: Record<string, string[]> = {
  discount_early: ["{code}", "{expiry_date}", "{remaining_days}"],
  discount_expiry: ["{code}", "{expiry_date}", "{remaining_days}"],
};

export function WhatsAppTemplatesManager({
  initialState,
}: {
  initialState: { success: boolean; message?: string; templates: WhatsAppTemplate[] };
}) {
  const { language } = useAdminLanguage();
  const t = copy[language];
  const [rows, setRows] = useState(initialState.templates);
  const [status, setStatus] = useState<Record<string, { ok: boolean; text: string }>>({});
  const [pending, start] = useTransition();
  const input = "w-full rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-soft)] p-3 text-sm text-[color:var(--admin-text)] outline-none focus:border-amber-400/50";

  const updateRow = (id: string, patch: Partial<WhatsAppTemplate>) => {
    setRows((current) => current.map((row) => row.id === id ? { ...row, ...patch } : row));
    setStatus((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  };

  const saveRow = (row: WhatsAppTemplate) => {
    start(async () => {
      const result = await saveWhatsAppTemplate(row);
      setStatus((current) => ({
        ...current,
        [row.id]: {
          ok: result.success,
          text: result.success ? t.saved : result.message || t.failed,
        },
      }));
    });
  };

  return (
    <div className="space-y-5">
      <Card className="p-6">
        <h1 className="text-2xl font-black text-[color:var(--admin-text)]">{t.title}</h1>
        <p className="mt-2 text-sm text-[color:var(--admin-muted)]">{t.desc}</p>
        {!initialState.success && initialState.message && (
          <p className="mt-3 rounded-xl border border-red-300/20 bg-red-300/10 px-3 py-2 text-sm text-red-700">
            {initialState.message}
          </p>
        )}
      </Card>

      {rows.map((row) => {
        const placeholders = placeholderMap[row.template_key] ?? [];
        const rowStatus = status[row.id];

        return (
          <Card key={row.id} className="p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-black text-[color:var(--admin-text)]">
                  {titles[row.template_key]?.[language] || row.label}
                </h2>
                {placeholders.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[color:var(--admin-muted)]">
                    <span className="font-bold">{t.placeholders}:</span>
                    {placeholders.map((placeholder) => (
                      <code key={placeholder} className="rounded-lg border border-[color:var(--admin-border)] bg-[color:var(--admin-soft)] px-2 py-1">
                        {placeholder}
                      </code>
                    ))}
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2 text-sm text-[color:var(--admin-muted)]">
                <input
                  type="checkbox"
                  checked={row.is_active}
                  onChange={(event) => updateRow(row.id, { is_active: event.target.checked })}
                />
                {t.active}
              </label>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <label>
                <span className="mb-2 block text-xs font-bold text-[color:var(--admin-muted)]">{t.fa}</span>
                <textarea rows={7} className={input} value={row.message_fa} onChange={(event) => updateRow(row.id, { message_fa: event.target.value })} />
              </label>
              <label>
                <span className="mb-2 block text-xs font-bold text-[color:var(--admin-muted)]">{t.ar}</span>
                <textarea rows={7} className={input} value={row.message_ar} onChange={(event) => updateRow(row.id, { message_ar: event.target.value })} />
              </label>
              <label>
                <span className="mb-2 block text-xs font-bold text-[color:var(--admin-muted)]">{t.en}</span>
                <textarea rows={7} className={input} value={row.message_en} onChange={(event) => updateRow(row.id, { message_en: event.target.value })} />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
              {rowStatus && (
                <span className={
                  rowStatus.ok
                    ? "inline-flex items-center gap-1 text-sm font-semibold text-emerald-600"
                    : "text-sm font-semibold text-red-600"
                }>
                  {rowStatus.ok && <CheckCircle2 className="h-4 w-4" />}
                  {rowStatus.text}
                </span>
              )}
              <Button onClick={() => saveRow(row)} disabled={pending}>
                <Save className="h-4 w-4" />
                {t.save}
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
