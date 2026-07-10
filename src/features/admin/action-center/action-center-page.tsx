"use client";

import Link from "next/link";
import { AlertTriangle, BadgeDollarSign, ChefHat, CircleDollarSign, Clock3, HeartHandshake, ListChecks } from "lucide-react";
import type { ActionCenterItem, ActionCenterState } from "@/app/admin/action-center/actions";
import { Card } from "@/components/ui/card";
import { useAdminLanguage } from "@/lib/admin-language";

const copy = {
  fa: {
    openActions: "اقدامات باز",
    urgent: "فوری",
    dueToday: "موعد امروز",
    customerFollowups: "پیگیری مشتریان",
    urgentActions: "اقدامات فوری",
    dueTodayTitle: "موارد امروز",
    discountReminders: "یادآوری تخفیف و وفاداری",
    financialAttention: "موارد مالی نیازمند توجه",
    operationsTasks: "کارهای عملیاتی",
    costingAlerts: "هشدارهای قیمت تمام‌شده",
    empty: "اقدام بازی وجود ندارد.",
    priorities: { urgent: "فوری", high: "مهم", normal: "عادی" },
    itemTitles: {
      "Review new feedback": "بررسی فیدبک جدید",
      "Open customer follow-up": "پیگیری باز مشتری",
      "Discount code expiry reminder": "یادآوری انقضای کد تخفیف",
      "Discount code follow-up": "پیگیری کد تخفیف",
      "Previous month unpaid invoice": "فاکتور پرداخت‌نشده ماه‌های قبل",
      "Unpaid invoice": "فاکتور پرداخت‌نشده",
      "Menu item missing recipe": "آیتم منو بدون رسپی",
      "Ingredient missing valid purchase cost": "ماده اولیه بدون قیمت خرید معتبر",
      "Prep item missing recipe or output quantity": "آماده‌سازی بدون رسپی یا مقدار خروجی",
      "Menu item missing sale price": "آیتم منو بدون قیمت فروش",
      "Loyalty reward ready": "جایزه وفاداری آماده تحویل",
    } as Record<string, string>,
  },
  ar: {
    openActions: "الإجراءات المفتوحة",
    urgent: "عاجل",
    dueToday: "مستحق اليوم",
    customerFollowups: "متابعات العملاء",
    urgentActions: "إجراءات عاجلة",
    dueTodayTitle: "مهام اليوم",
    discountReminders: "تذكيرات الخصومات والولاء",
    financialAttention: "أمور مالية تحتاج متابعة",
    operationsTasks: "مهام العمليات",
    costingAlerts: "تنبيهات التكلفة",
    empty: "لا توجد إجراءات معلقة.",
    priorities: { urgent: "عاجل", high: "مهم", normal: "عادي" },
    itemTitles: {
      "Review new feedback": "مراجعة رأي جديد",
      "Open customer follow-up": "متابعة عميل مفتوحة",
      "Discount code expiry reminder": "تذكير بانتهاء كود الخصم",
      "Discount code follow-up": "متابعة كود الخصم",
      "Previous month unpaid invoice": "فاتورة غير مدفوعة من شهر سابق",
      "Unpaid invoice": "فاتورة غير مدفوعة",
      "Menu item missing recipe": "عنصر منيو بدون وصفة",
      "Ingredient missing valid purchase cost": "مادة أولية بدون تكلفة شراء صالحة",
      "Prep item missing recipe or output quantity": "تحضير بدون وصفة أو كمية ناتج",
      "Menu item missing sale price": "عنصر منيو بدون سعر بيع",
      "Loyalty reward ready": "مكافأة ولاء جاهزة",
    } as Record<string, string>,
  },
  en: {
    openActions: "Open actions",
    urgent: "Urgent",
    dueToday: "Due today",
    customerFollowups: "Customer follow-ups",
    urgentActions: "Urgent Actions",
    dueTodayTitle: "Due Today",
    discountReminders: "Discount & Loyalty Reminders",
    financialAttention: "Financial Attention",
    operationsTasks: "Operations Tasks",
    costingAlerts: "Costing Alerts",
    empty: "No pending action.",
    priorities: { urgent: "Urgent", high: "High", normal: "Normal" },
    itemTitles: {} as Record<string, string>,
  },
} as const;

function ActionList({ title, items, icon: Icon, language }: { title: string; items: ActionCenterItem[]; icon: typeof AlertTriangle; language: "fa" | "ar" | "en" }) {
  const c = copy[language];
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-3"><Icon className="h-5 w-5 text-amber-200" /><h2 className="font-bold text-white">{title}</h2></div>
        <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-black text-white/65">{items.length}</span>
      </div>
      <div className="divide-y divide-white/10">
        {items.length === 0 && <div className="px-5 py-6 text-sm text-white/35">{c.empty}</div>}
        {items.slice(0, 20).map((item) => (
          <Link key={`${item.category}-${item.id}`} href={item.href} className="flex items-start justify-between gap-4 px-5 py-4 transition hover:bg-white/[0.04]">
            <div className="min-w-0">
              <p className="font-semibold text-white">{c.itemTitles[item.title] ?? item.title}</p>
              <p className="mt-1 truncate text-sm text-white/45">{item.detail}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${item.priority === "urgent" ? "bg-red-400/15 text-red-200" : item.priority === "high" ? "bg-amber-300/15 text-amber-100" : "bg-white/[0.07] text-white/50"}`}>{c.priorities[item.priority]}</span>
          </Link>
        ))}
      </div>
    </Card>
  );
}

export function ActionCenterPage({ state }: { state: ActionCenterState }) {
  const { language } = useAdminLanguage();
  const c = copy[language];
  const openTotal = state.crm.length + state.loyalty.length + state.finance.length + state.operations.length + state.costing.length;

  return (
    <div className="space-y-6">
      {!state.success && <div className="rounded-3xl border border-red-300/20 bg-red-300/10 p-4 text-sm text-red-100">{state.message}</div>}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5"><p className="text-xs text-white/40">{c.openActions}</p><p className="mt-2 text-3xl font-black text-white">{openTotal}</p></Card>
        <Card className="p-5"><p className="text-xs text-white/40">{c.urgent}</p><p className="mt-2 text-3xl font-black text-red-200">{state.urgent.length}</p></Card>
        <Card className="p-5"><p className="text-xs text-white/40">{c.dueToday}</p><p className="mt-2 text-3xl font-black text-amber-100">{state.dueToday.length}</p></Card>
        <Card className="p-5"><p className="text-xs text-white/40">{c.customerFollowups}</p><p className="mt-2 text-3xl font-black text-emerald-200">{state.crm.length + state.loyalty.length}</p></Card>
      </section>

      <ActionList title={c.urgentActions} items={state.urgent} icon={AlertTriangle} language={language} />
      <ActionList title={c.dueTodayTitle} items={state.dueToday} icon={Clock3} language={language} />

      <section className="grid gap-6 xl:grid-cols-2">
        <ActionList title={c.customerFollowups} items={state.crm} icon={HeartHandshake} language={language} />
        <ActionList title={c.discountReminders} items={state.loyalty} icon={BadgeDollarSign} language={language} />
        <ActionList title={c.financialAttention} items={state.finance} icon={CircleDollarSign} language={language} />
        <ActionList title={c.operationsTasks} items={state.operations} icon={ListChecks} language={language} />
        <div className="xl:col-span-2"><ActionList title={c.costingAlerts} items={state.costing} icon={ChefHat} language={language} /></div>
      </section>
    </div>
  );
}
