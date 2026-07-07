"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { LayoutGrid, ListChecks, QrCode, SlidersHorizontal, Star } from "lucide-react";
import { useAdminLanguage } from "@/lib/admin-language";
import { useAdminPermissions } from "@/lib/admin-permissions";

const items = [
  {
    href: "/admin/settings/feedback-center",
    key: "overview",
    moduleKey: "settings_feedback",
    icon: LayoutGrid,
  },
  {
    href: "/admin/questions",
    key: "questions",
    moduleKey: "questions",
    icon: ListChecks,
  },
  {
    href: "/admin/settings/feedback",
    key: "responseRules",
    moduleKey: "settings_feedback",
    icon: SlidersHorizontal,
  },
  {
    href: "/admin/settings/external-reviews",
    key: "external",
    moduleKey: "settings_feedback",
    icon: Star,
  },
  {
    href: "/admin/settings/qr",
    key: "qr",
    moduleKey: "settings_feedback",
    icon: QrCode,
  },
] as const;

const labels = {
  fa: {
    overview: "مرکز فیدبک",
    questions: "سؤال‌های فیدبک",
    responseRules: "قوانین پاسخ و پاداش",
    external: "ریویوهای خارجی",
    qr: "QR فیدبک",
  },
  ar: {
    overview: "مركز التقييم",
    questions: "أسئلة التقييم",
    responseRules: "قواعد الرد والمكافآت",
    external: "المراجعات الخارجية",
    qr: "QR التقييم",
  },
  en: {
    overview: "Feedback Center",
    questions: "Feedback Questions",
    responseRules: "Response & Reward Rules",
    external: "External Reviews",
    qr: "Feedback QR",
  },
};

export function FeedbackSettingsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { language } = useAdminLanguage();
  const { canView } = useAdminPermissions();
  const text = labels[language];
  const visibleItems = items.filter((item) => canView(item.moduleKey));

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-[color:var(--admin-border)] bg-[color:var(--admin-card)] p-4">
        <div className="overflow-x-auto pb-1">
          <nav className="flex min-w-max items-center gap-2">
            {visibleItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onMouseEnter={() => router.prefetch(item.href)}
                  onFocus={() => router.prefetch(item.href)}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                    active
                      ? "bg-amber-200 text-black"
                      : "text-[color:var(--admin-muted)] hover:bg-[color:var(--admin-soft)] hover:text-[color:var(--admin-text)]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {text[item.key]}
                </Link>
              );
            })}
          </nav>
        </div>
      </section>

      {children}
    </div>
  );
}
