"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import { Globe2 } from "lucide-react";
import { financeText, type FinanceCopy, type FinanceLanguage } from "@/features/admin/finance/finance-i18n";
import { useAdminLanguage } from "@/lib/admin-language";

type FinanceShellProps = {
  active: "closing" | "invoices" | "cash" | "costing";
  intro: keyof FinanceCopy;
  children: (props: { language: FinanceLanguage; t: FinanceCopy }) => ReactNode;
};

const tabs: Array<{
  key: "closing" | "invoices" | "cash" | "costing";
  href: string;
  labelKey: keyof FinanceCopy;
}> = [
  { key: "closing", href: "/admin/finance/closing", labelKey: "closing" },
  { key: "invoices", href: "/admin/finance/invoices", labelKey: "invoices" },
  { key: "cash", href: "/admin/finance/cash", labelKey: "cash" },
  { key: "costing", href: "/admin/finance/costing", labelKey: "costing" },
];

export function FinanceShell({ active, intro, children }: FinanceShellProps) {
  const { language: adminLanguage } = useAdminLanguage();
  const language = adminLanguage as FinanceLanguage;
  const t = financeText[language];

  return (
    <div
      className="bp-module-page space-y-6"
      dir={t.dir}
      lang={language}
      style={{ fontFamily: language === "fa" ? "var(--font-persian)" : undefined }}
    >
      <section className="bp-module-hero relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-16 h-60 w-60 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-200/15 bg-amber-200/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-amber-100">
              <Globe2 className="h-3.5 w-3.5" />
              {t.title}
            </div>
            <h1 className="text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
              {t[active]}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/48">
              {t[intro]}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs font-semibold text-white/45">
            {language === "fa"
              ? "زبان از بالای سایت کنترل می‌شود"
              : language === "ar"
                ? "يتم التحكم باللغة من أعلى الموقع"
                : "Language is controlled from the site header"}
          </div>
        </div>

        <div className="relative z-10 mt-6 grid gap-3 md:grid-cols-4">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              className={`bp-module-tab rounded-2xl border px-4 py-3 text-center text-sm font-bold transition duration-300 ${
                active === tab.key
                  ? "border-amber-200 bg-gradient-to-r from-amber-200 to-yellow-300 text-black shadow-[0_18px_44px_rgba(251,191,36,0.16)]"
                  : "border-white/10 bg-black/20 text-white/55 hover:bg-white/10 hover:text-white"
              }`}
            >
              {t[tab.labelKey]}
            </Link>
          ))}
        </div>
      </section>

      {children({ language, t })}
    </div>
  );
}
