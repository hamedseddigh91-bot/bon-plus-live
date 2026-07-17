"use client";

import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import type { ShoppingDepartment, ShoppingListDetail } from "@/app/admin/operations/shopping-list/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAdminLanguage } from "@/lib/admin-language";

const text = {
  fa: {
    back: "برگشت به تاریخچه",
    print: "پرینت",
    finalizedBy: "نهایی‌شده توسط",
    bar: "بار",
    hall: "سالن",
    kitchen: "آشپزخانه",
    empty: "موردی ثبت نشده.",
  },
  ar: {
    back: "العودة إلى السجل",
    print: "طباعة",
    finalizedBy: "أنهاه",
    bar: "البار",
    hall: "الصالة",
    kitchen: "المطبخ",
    empty: "لا يوجد عنصر.",
  },
  en: {
    back: "Back to history",
    print: "Print",
    finalizedBy: "Finalized by",
    bar: "Bar",
    hall: "Hall",
    kitchen: "Kitchen",
    empty: "No items recorded.",
  },
} as const;

const departments: ShoppingDepartment[] = ["bar", "hall", "kitchen"];

export function ShoppingListDetailView({ list }: { list: ShoppingListDetail }) {
  const { language } = useAdminLanguage();
  const t = text[language];
  const grouped: Record<ShoppingDepartment, typeof list.items> = { bar: [], hall: [], kitchen: [] };
  for (const item of list.items) grouped[item.department].push(item);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/admin/operations/shopping-list/history"><Button variant="secondary"><ArrowLeft className="h-4 w-4" />{t.back}</Button></Link>
        <Button onClick={() => window.print()}><Printer className="h-4 w-4" />{t.print}</Button>
      </div>

      <Card className="p-5">
        <h1 className="text-lg font-black text-[color:var(--admin-text)]">
          {list.finalizedAt ? new Date(list.finalizedAt).toLocaleDateString() : "—"}
        </h1>
        {list.finalizedByEmail && <p className="mt-1 text-xs text-[color:var(--admin-muted)]">{t.finalizedBy}: {list.finalizedByEmail}</p>}
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        {departments.map((dept) => (
          <Card key={dept} className="p-4">
            <h3 className="mb-3 text-sm font-black text-[color:var(--admin-text)]">{t[dept]}</h3>
            <div className="space-y-2">
              {grouped[dept].length === 0 && <p className="text-xs text-[color:var(--admin-muted)]">{t.empty}</p>}
              {grouped[dept].map((item) => (
                <div key={item.id} className="rounded-xl border border-[color:var(--admin-border)] bg-black/10 p-3">
                  <p className="text-sm font-bold text-[color:var(--admin-text)]">{item.ingredientName}</p>
                  <p className="text-sm text-[color:var(--admin-text)]">{item.quantity} {item.unit ?? ""}</p>
                  {item.notes && <p className="mt-1 text-xs text-[color:var(--admin-muted)]">{item.notes}</p>}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
