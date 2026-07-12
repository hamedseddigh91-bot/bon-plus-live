"use client";

import { ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAdminLanguage } from "@/lib/admin-language";

export function NoAccessPage() {
  const { language } = useAdminLanguage();
  const copy = language === "fa"
    ? { title: "دسترسی فعالی برای شما تعریف نشده است", text: "برای فعال‌سازی دسترسی به یکی از بخش‌های سیستم، با مدیر سیستم تماس بگیرید." }
    : language === "ar"
      ? { title: "لم يتم تحديد صلاحية فعالة لحسابك", text: "تواصل مع مدير النظام لتفعيل الوصول إلى أحد أقسام النظام." }
      : { title: "No active access has been assigned", text: "Contact the system administrator to enable access to at least one section." };

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-xl p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-amber-300/20 bg-amber-300/10 text-amber-200">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="mt-5 text-2xl font-black text-[color:var(--admin-text)]">{copy.title}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[color:var(--admin-muted)]">{copy.text}</p>
      </Card>
    </div>
  );
}
