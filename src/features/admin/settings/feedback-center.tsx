"use client";

import Link from "next/link";
import { ListChecks, QrCode, SlidersHorizontal, Star } from "lucide-react";
import { useAdminLanguage } from "@/lib/admin-language";
import { useAdminPermissions } from "@/lib/admin-permissions";

const cards = [
  {
    href: "/admin/questions",
    moduleKey: "questions",
    key: "questions",
    icon: ListChecks,
  },
  {
    href: "/admin/settings/feedback",
    moduleKey: "settings_feedback",
    key: "rules",
    icon: SlidersHorizontal,
  },
  {
    href: "/admin/settings/external-reviews",
    moduleKey: "settings_feedback",
    key: "external",
    icon: Star,
  },
  {
    href: "/admin/settings/qr",
    moduleKey: "settings_feedback",
    key: "qr",
    icon: QrCode,
  },
] as const;

const text = {
  fa: {
    title: "فیدبک",
    subtitle: "همه تنظیمات مربوط به تجربه بازخورد مشتری را از یکجا مدیریت کنید.",
    questions: { title: "سؤال‌های فیدبک", description: "سؤال‌ها، ترتیب نمایش و وضعیت فعال یا غیرفعال آن‌ها را مدیریت کنید." },
    rules: { title: "قوانین پاسخ و پاداش", description: "واکنش بعد از امتیازدهی، پاداش‌ها و پیام‌های پاسخ را تنظیم کنید." },
    external: { title: "ریویوهای خارجی", description: "مسیر هدایت مشتری به Google Review و سایر ریویوهای خارجی را مدیریت کنید." },
    qr: { title: "QR فیدبک", description: "QR فرم بازخورد را مشاهده، چاپ و لینک عمومی آن را کپی کنید." },
  },
  ar: {
    title: "التقييم",
    subtitle: "إدارة جميع إعدادات تجربة تقييم العملاء من مكان واحد.",
    questions: { title: "أسئلة التقييم", description: "إدارة الأسئلة وترتيب العرض وحالة التفعيل." },
    rules: { title: "قواعد الرد والمكافآت", description: "ضبط الردود والمكافآت والرسائل بعد التقييم." },
    external: { title: "المراجعات الخارجية", description: "إدارة التوجيه إلى Google Review والمراجعات الخارجية." },
    qr: { title: "QR التقييم", description: "عرض وطباعة رمز QR ونسخ رابط التقييم العام." },
  },
  en: {
    title: "Feedback",
    subtitle: "Manage the full customer feedback experience from one place.",
    questions: { title: "Feedback Questions", description: "Manage questions, display order, and active status." },
    rules: { title: "Response & Reward Rules", description: "Configure post-rating responses, rewards, and messages." },
    external: { title: "External Reviews", description: "Manage routing to Google Review and other external review channels." },
    qr: { title: "Feedback QR", description: "View, print, and copy the public feedback QR link." },
  },
};

export function FeedbackCenter() {
  const { language } = useAdminLanguage();
  const { canView } = useAdminPermissions();
  const labels = text[language];
  const visibleCards = cards.filter((card) => canView(card.moduleKey));

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[color:var(--admin-border)] bg-[color:var(--admin-card)] p-6">
        <h1 className="text-3xl font-black tracking-[-0.03em] text-[color:var(--admin-text)]">
          {labels.title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--admin-muted)]">
          {labels.subtitle}
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {visibleCards.map((card) => {
          const Icon = card.icon;
          const copy = labels[card.key];

          return (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-[2rem] border border-[color:var(--admin-border)] bg-[color:var(--admin-card)] p-5 transition hover:-translate-y-0.5 hover:bg-[color:var(--admin-soft)]"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-200 text-black">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-[color:var(--admin-text)]">{copy.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--admin-muted)]">{copy.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
