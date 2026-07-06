"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Gift, MessageCircle, Settings2, SlidersHorizontal, Star, UserCog } from "lucide-react";
import { useAdminLanguage } from "@/lib/admin-language";
import { useAdminPermissions } from "@/lib/admin-permissions";

const items = [
  { href: "/admin/settings/general", key: "general", moduleKey: "settings_general", icon: Settings2 },
  { href: "/admin/settings/feedback", key: "feedback", moduleKey: "settings_feedback", icon: SlidersHorizontal },
  { href: "/admin/settings/users", key: "users", moduleKey: "settings_users", icon: UserCog },
  { href: "/admin/settings/loyalty-rules", key: "loyalty", moduleKey: "settings_general", icon: Gift },
  { href: "/admin/settings/whatsapp-messages", key: "whatsapp", moduleKey: "settings_whatsapp", icon: MessageCircle },
  { href: "/admin/settings/external-reviews", key: "external", moduleKey: "settings_feedback", icon: Star },
] as const;

const labels = {
  fa: { general: "عمومی", feedback: "تنظیمات فیدبک", users: "کاربران", loyalty: "قوانین وفاداری", whatsapp: "متن‌های واتساپ", external: "ریویوهای خارجی" },
  ar: { general: "عام", feedback: "إعدادات الآراء", users: "المستخدمون", loyalty: "قواعد الولاء", whatsapp: "رسائل واتساب", external: "المراجعات الخارجية" },
  en: { general: "General", feedback: "Feedback Settings", users: "Users", loyalty: "Loyalty Rules", whatsapp: "WhatsApp Messages", external: "External Reviews" },
};

export function SettingsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { language } = useAdminLanguage();
  const { canView } = useAdminPermissions();
  const visibleItems = items.filter((item) => canView(item.moduleKey));
  const text = labels[language];
  return (
    <div className="space-y-5">
      <div className="overflow-x-auto rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-panel)] p-2">
        <div className="flex min-w-max gap-2">
          {visibleItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return <Link key={item.href} href={item.href} className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition ${active ? "bg-amber-200 text-black" : "text-[color:var(--admin-muted)] hover:bg-[color:var(--admin-soft)] hover:text-[color:var(--admin-text)]"}`}><Icon className="h-4 w-4" />{text[item.key]}</Link>;
          })}
        </div>
      </div>
      {children}
    </div>
  );
}
