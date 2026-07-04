"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { MessageSquareText, ClipboardList, Users, BadgePercent } from "lucide-react";
import { useAdminLanguage } from "@/lib/admin-language";

type CrmTab = "feedback" | "follow-ups" | "customers" | "loyalty";

const copy = {
  fa: { title: "CRM", subtitle: "فیدبک‌ها، پیگیری مشتریان ناراضی، مشتریان و وفاداری در یک مرکز عملیاتی.", feedback: "فیدبک‌ها", followups: "پیگیری‌ها", customers: "مشتریان", loyalty: "وفاداری و تخفیف" },
  ar: { title: "CRM", subtitle: "الآراء، متابعة العملاء غير الراضين، العملاء والولاء في مركز تشغيلي واحد.", feedback: "الآراء", followups: "المتابعات", customers: "العملاء", loyalty: "الولاء والخصومات" },
  en: { title: "CRM", subtitle: "Feedback, unhappy-customer follow-up, customers and loyalty in one operational center.", feedback: "Feedback", followups: "Follow-ups", customers: "Customers", loyalty: "Loyalty & discounts" },
} as const;

const tabs = [
  { key: "feedback" as const, href: "/admin/crm/feedback", label: "feedback" as const, icon: MessageSquareText },
  { key: "follow-ups" as const, href: "/admin/crm/follow-ups", label: "followups" as const, icon: ClipboardList },
  { key: "customers" as const, href: "/admin/crm/customers", label: "customers" as const, icon: Users },
  { key: "loyalty" as const, href: "/admin/crm/loyalty", label: "loyalty" as const, icon: BadgePercent },
];

export function CrmShell({ active, children }: { active: CrmTab; children: ReactNode }) {
  const { language } = useAdminLanguage();
  const t = copy[language];
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-[color:var(--admin-border)] bg-[color:var(--admin-card)] p-6 shadow-2xl shadow-black/10 backdrop-blur-xl">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="relative z-10">
          <h1 className="text-3xl font-black tracking-[-0.04em] text-[color:var(--admin-text)] sm:text-4xl">{t.title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--admin-muted)]">{t.subtitle}</p>
          <div className="mt-6 grid gap-3 md:grid-cols-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const selected = active === tab.key;
              return (
                <Link key={tab.key} href={tab.href} className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition ${selected ? "border-amber-200 bg-gradient-to-r from-amber-200 to-yellow-300 text-black" : "border-[color:var(--admin-border)] bg-black/10 text-[color:var(--admin-muted)] hover:text-[color:var(--admin-text)]"}`}>
                  <Icon className="h-4 w-4" />
                  {t[tab.label]}
                </Link>
              );
            })}
          </div>
        </div>
      </section>
      {children}
    </div>
  );
}
