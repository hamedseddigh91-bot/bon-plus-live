"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
  Gift,
  MessageCircle,
  Settings2,
  SlidersHorizontal,
  UserCog,
} from "lucide-react";
import { useAdminLanguage } from "@/lib/admin-language";
import { useAdminPermissions } from "@/lib/admin-permissions";

const items = [
  {
    href: "/admin/settings/general",
    key: "general",
    moduleKey: "settings_general",
    icon: Settings2,
  },
  {
    href: "/admin/settings/feedback-center",
    key: "feedback",
    moduleKey: "settings_feedback",
    icon: SlidersHorizontal,
  },
  {
    href: "/admin/settings/users",
    key: "users",
    moduleKey: "settings_users",
    icon: UserCog,
  },
  {
    href: "/admin/settings/loyalty-rules",
    key: "loyalty",
    moduleKey: "settings_general",
    icon: Gift,
  },
  {
    href: "/admin/settings/whatsapp-messages",
    key: "whatsapp",
    moduleKey: "settings_whatsapp",
    icon: MessageCircle,
  },
] as const;

const labels = {
  fa: {
    general: "عمومی",
    feedback: "فیدبک",
    users: "کاربران",
    loyalty: "قوانین وفاداری",
    whatsapp: "متن‌های واتساپ",
  },
  ar: {
    general: "عام",
    feedback: "التقييم",
    users: "المستخدمون",
    loyalty: "قواعد الولاء",
    whatsapp: "رسائل واتساب",
  },
  en: {
    general: "General",
    feedback: "Feedback",
    users: "Users",
    loyalty: "Loyalty Rules",
    whatsapp: "WhatsApp Messages",
  },
};

function itemIsActive(pathname: string, item: (typeof items)[number]) {
  if (item.key === "feedback") {
    return (
      pathname === "/admin/settings/feedback-center" ||
      pathname.startsWith("/admin/settings/feedback-center/") ||
      pathname === "/admin/settings/feedback" ||
      pathname.startsWith("/admin/settings/feedback/") ||
      pathname === "/admin/settings/external-reviews" ||
      pathname.startsWith("/admin/settings/external-reviews/") ||
      pathname === "/admin/settings/qr" ||
      pathname.startsWith("/admin/settings/qr/") ||
      pathname === "/admin/questions" ||
      pathname.startsWith("/admin/questions/")
    );
  }

  return pathname === item.href || pathname.startsWith(item.href + "/");
}

export function SettingsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { language } = useAdminLanguage();
  const { canView } = useAdminPermissions();

  const visibleItems = items.filter((item) => canView(item.moduleKey));
  const text = labels[language];

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto pb-1">
        <nav className="flex min-w-max items-center gap-2">
          {visibleItems.map((item) => {
            const active = itemIsActive(pathname, item);
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

      {children}
    </div>
  );
}
