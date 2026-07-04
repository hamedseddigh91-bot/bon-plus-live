"use client";

import { useState } from "react";
import type { DiscountCenterState } from "@/app/admin/discounts/actions";
import type { LoyaltyCounterState } from "@/app/admin/crm/loyalty/actions";
import { DiscountsManager } from "@/features/admin/discounts/discounts-manager";
import { LoyaltyCounter } from "@/features/admin/crm/loyalty-counter";
import { useAdminLanguage } from "@/lib/admin-language";

export function LoyaltyWorkspace({
  discountState,
  counterState,
}: {
  discountState: DiscountCenterState;
  counterState: LoyaltyCounterState;
}) {
  const { language } = useAdminLanguage();
  const [view, setView] = useState<"codes" | "counter">("codes");
  const labels = language === "fa"
    ? { codes: "کدهای تخفیف و اعتبارسنجی", counter: "شمارش وفاداری" }
    : language === "ar"
      ? { codes: "أكواد الخصم والتحقق", counter: "عداد الولاء" }
      : { codes: "Discount codes & validation", counter: "Loyalty counter" };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-card)] p-2">
        <button type="button" onClick={() => setView("codes")} className={`rounded-xl px-4 py-2 text-sm font-bold ${view === "codes" ? "bg-amber-200 text-black" : "text-[color:var(--admin-muted)]"}`}>{labels.codes}</button>
        <button type="button" onClick={() => setView("counter")} className={`rounded-xl px-4 py-2 text-sm font-bold ${view === "counter" ? "bg-amber-200 text-black" : "text-[color:var(--admin-muted)]"}`}>{labels.counter}</button>
      </div>
      {view === "codes" ? <DiscountsManager initialState={discountState} /> : <LoyaltyCounter initialState={counterState} />}
    </div>
  );
}
