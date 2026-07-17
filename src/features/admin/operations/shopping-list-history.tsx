"use client";

import Link from "next/link";
import { ArrowLeft, History, Printer } from "lucide-react";
import type { ShoppingListHistoryRow } from "@/app/admin/operations/shopping-list/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAdminLanguage } from "@/lib/admin-language";

const text = {
  fa: {
    title: "تاریخچه‌ی لیست‌های خرید",
    back: "برگشت به لیست فعلی",
    empty: "هنوز هیچ لیستی نهایی نشده.",
    items: "مورد",
    finalizedBy: "نهایی‌شده توسط",
    view: "مشاهده و پرینت",
  },
  ar: {
    title: "سجل قوائم التسوق",
    back: "العودة إلى القائمة الحالية",
    empty: "لم يتم إنهاء أي قائمة بعد.",
    items: "عنصر",
    finalizedBy: "أنهاه",
    view: "عرض وطباعة",
  },
  en: {
    title: "Shopping list history",
    back: "Back to current list",
    empty: "No lists finalized yet.",
    items: "items",
    finalizedBy: "Finalized by",
    view: "View & print",
  },
} as const;

export function ShoppingListHistory({ lists }: { lists: ShoppingListHistoryRow[] }) {
  const { language } = useAdminLanguage();
  const t = text[language];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-amber-300/10 text-amber-200"><History className="h-5 w-5" /></div>
          <h1 className="text-xl font-black text-[color:var(--admin-text)]">{t.title}</h1>
        </div>
        <Link href="/admin/operations/shopping-list"><Button variant="secondary"><ArrowLeft className="h-4 w-4" />{t.back}</Button></Link>
      </div>

      <Card className="p-0">
        <div className="divide-y divide-[color:var(--admin-border)]">
          {lists.length === 0 && <p className="p-6 text-sm text-[color:var(--admin-muted)]">{t.empty}</p>}
          {lists.map((list) => (
            <div key={list.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div>
                <p className="text-sm font-black text-[color:var(--admin-text)]">
                  {list.finalizedAt ? new Date(list.finalizedAt).toLocaleDateString() : "—"}
                </p>
                <p className="text-xs text-[color:var(--admin-muted)]">
                  <Badge variant="secondary">{list.itemCount} {t.items}</Badge>
                  {list.finalizedByEmail && <span className="ms-2">{t.finalizedBy}: {list.finalizedByEmail}</span>}
                </p>
              </div>
              <Link href={`/admin/operations/shopping-list/history/${list.id}`}>
                <Button variant="secondary"><Printer className="h-4 w-4" />{t.view}</Button>
              </Link>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
