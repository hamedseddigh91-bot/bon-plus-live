"use client";

import { useState, useTransition } from "react";
import { Banknote, Save } from "lucide-react";
import type { FinanceEntry, OperationsPageState } from "@/app/admin/operations/actions";
import { saveFinanceEntry } from "@/app/admin/operations/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FinanceShell } from "@/features/admin/finance/finance-shell";
import { getPettyCashEntries, money, monthlyPeriods, today } from "@/features/admin/finance/finance-utils";

type FinanceCashPageProps = { initialState: OperationsPageState };

const text = {
  fa: { monthlySummary: "خلاصه ماهانه بر اساس تاریخ ثبت‌شده" },
  ar: { monthlySummary: "الملخص الشهري حسب تاريخ التسجيل" },
  en: { monthlySummary: "Monthly summary by transaction date" },
} as const;

export function FinanceCashPage({ initialState }: FinanceCashPageProps) {
  const [message, setMessage] = useState(initialState.message ?? null);
  const [isPending, startTransition] = useTransition();
  const cashEntries = getPettyCashEntries(initialState.entries);
  const periods = monthlyPeriods(initialState);

  const [topupForm, setTopupForm] = useState({
    entryDate: today(),
    amount: "",
    depositor: "",
    referenceNo: "",
    notes: "",
  });
  const [handoverForm, setHandoverForm] = useState({
    entryDate: today(),
    amount: "",
    handoverTo: "",
    referenceNo: "",
    notes: "",
  });
  const [ownerPaidForm, setOwnerPaidForm] = useState({
    entryDate: today(),
    amount: "",
    title: "",
    referenceNo: "",
    notes: "",
  });
  const saveTopup = () => {
    startTransition(async () => {
      const result = await saveFinanceEntry({
        id: null,
        entryDate: topupForm.entryDate,
        entryType: "petty_cash_topup",
        title: topupForm.depositor ? `Petty cash top-up from ${topupForm.depositor}` : "Petty cash top-up",
        amount: topupForm.amount,
        supplierId: null,
        paymentStatus: "paid",
        payer: "owner",
        usagePlace: "general",
        referenceNo: topupForm.referenceNo,
        description: topupForm.notes,
      });
      setMessage(result.message ?? null);
      if (result.success) window.location.reload();
    });
  };

  const saveHandover = () => {
    startTransition(async () => {
      const result = await saveFinanceEntry({
        id: null,
        entryDate: handoverForm.entryDate,
        entryType: "cash_transfer",
        title: handoverForm.handoverTo ? `Cash handover to ${handoverForm.handoverTo}` : "Cash handover",
        amount: handoverForm.amount,
        supplierId: null,
        paymentStatus: "paid",
        payer: "cash_drawer",
        usagePlace: "general",
        referenceNo: handoverForm.referenceNo,
        description: handoverForm.notes,
      });
      setMessage(result.message ?? null);
      if (result.success) window.location.reload();
    });
  };

  const saveOwnerPaid = () => {
    startTransition(async () => {
      const result = await saveFinanceEntry({
        id: null,
        entryDate: ownerPaidForm.entryDate,
        entryType: "owner_paid",
        title: ownerPaidForm.title || "Owner paid",
        amount: ownerPaidForm.amount,
        supplierId: null,
        paymentStatus: "paid",
        payer: "owner",
        usagePlace: "general",
        referenceNo: ownerPaidForm.referenceNo,
        description: ownerPaidForm.notes,
      });
      setMessage(result.message ?? null);
      if (result.success) window.location.reload();
    });
  };

  return (
    <FinanceShell active="cash" intro="cashIntro">
      {({ language, t }) => {
        const l = text[language];
        return (
          <>
            {message && (
              <div className="mb-5 rounded-2xl border border-amber-200/20 bg-amber-200/10 px-4 py-3 text-sm text-amber-100">
                {message}
              </div>
            )}

            <section className="grid gap-6 xl:grid-cols-3">
              <Card className="p-5">
                <h2 className="text-xl font-semibold text-white">{t.pettyTopup}</h2>
                <div className="mt-5 grid gap-3">
                  <input type="date" value={topupForm.entryDate} onChange={(event) => setTopupForm((current) => ({ ...current, entryDate: event.target.value }))} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark]" />
                  <input value={topupForm.depositor} onChange={(event) => setTopupForm((current) => ({ ...current, depositor: event.target.value }))} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" placeholder={t.topupDepositor} />
                  <input type="number" step="0.001" value={topupForm.amount} onChange={(event) => setTopupForm((current) => ({ ...current, amount: event.target.value }))} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" placeholder={t.amount} />
                  <input value={topupForm.referenceNo} onChange={(event) => setTopupForm((current) => ({ ...current, referenceNo: event.target.value }))} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" placeholder={t.referenceNo} />
                  <textarea value={topupForm.notes} onChange={(event) => setTopupForm((current) => ({ ...current, notes: event.target.value }))} className="min-h-20 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" placeholder={t.notes} />
                  <Button onClick={saveTopup} disabled={isPending || !topupForm.amount}><Save className="h-4 w-4" />{t.saveTopup}</Button>
                </div>
              </Card>

              <Card className="p-5">
                <h2 className="text-xl font-semibold text-white">{t.cashHandover}</h2>
                <div className="mt-5 grid gap-3">
                  <input type="date" value={handoverForm.entryDate} onChange={(event) => setHandoverForm((current) => ({ ...current, entryDate: event.target.value }))} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark]" />
                  <input value={handoverForm.handoverTo} onChange={(event) => setHandoverForm((current) => ({ ...current, handoverTo: event.target.value }))} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" placeholder={t.handoverTo} />
                  <input type="number" step="0.001" value={handoverForm.amount} onChange={(event) => setHandoverForm((current) => ({ ...current, amount: event.target.value }))} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" placeholder={t.amount} />
                  <input value={handoverForm.referenceNo} onChange={(event) => setHandoverForm((current) => ({ ...current, referenceNo: event.target.value }))} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" placeholder={t.referenceNo} />
                  <textarea value={handoverForm.notes} onChange={(event) => setHandoverForm((current) => ({ ...current, notes: event.target.value }))} className="min-h-20 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" placeholder={t.notes} />
                  <Button onClick={saveHandover} disabled={isPending || !handoverForm.amount}><Banknote className="h-4 w-4" />{t.saveHandover}</Button>
                </div>
              </Card>

              <Card className="p-5">
                <h2 className="text-xl font-semibold text-white">{t.ownerPaid}</h2>
                <div className="mt-5 grid gap-3">
                  <input type="date" value={ownerPaidForm.entryDate} onChange={(event) => setOwnerPaidForm((current) => ({ ...current, entryDate: event.target.value }))} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark]" />
                  <input value={ownerPaidForm.title} onChange={(event) => setOwnerPaidForm((current) => ({ ...current, title: event.target.value }))} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" placeholder={t.titleField} />
                  <input type="number" step="0.001" value={ownerPaidForm.amount} onChange={(event) => setOwnerPaidForm((current) => ({ ...current, amount: event.target.value }))} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" placeholder={t.amount} />
                  <input value={ownerPaidForm.referenceNo} onChange={(event) => setOwnerPaidForm((current) => ({ ...current, referenceNo: event.target.value }))} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" placeholder={t.referenceNo} />
                  <textarea value={ownerPaidForm.notes} onChange={(event) => setOwnerPaidForm((current) => ({ ...current, notes: event.target.value }))} className="min-h-20 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" placeholder={t.notes} />
                  <Button onClick={saveOwnerPaid} disabled={isPending || !ownerPaidForm.amount}><Save className="h-4 w-4" />{t.saveOwnerPaid}</Button>
                </div>
              </Card>
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-2">
              <Card className="p-5">
                <h2 className="text-xl font-semibold text-white">{l.monthlySummary}</h2>
                <div className="mt-5 space-y-3">
                  {periods.map((period) => (
                    <div key={period.month} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="font-bold text-white">{period.month}</p>
                      <p className="mt-2 text-xs text-white/45">{t.pettyTopup}: {money(period.topups)} / {t.cashHandover}: {money(period.transfers)}</p>
                      <p className="mt-1 text-xs text-white/35">{t.closingTotal}: {money(period.closing)} / {t.invoiceList}: {period.invoiceCount}</p>
                    </div>
                  ))}
                  {periods.length === 0 && <p className="text-sm text-white/35">{t.noData}</p>}
                </div>
              </Card>

              <Card className="p-5">
                <h2 className="text-xl font-semibold text-white">{t.cash}</h2>
                <div className="mt-5 max-h-[540px] overflow-auto rounded-3xl border border-white/10">
                  <table className="min-w-[720px] w-full text-left text-sm">
                    <thead className="sticky top-0 bg-slate-950 text-white/40">
                      <tr><th className="px-4 py-3">{t.date}</th><th className="px-4 py-3">{t.titleField}</th><th className="px-4 py-3">{t.type}</th><th className="px-4 py-3 text-right">{t.amount}</th></tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {cashEntries.map((entry: FinanceEntry) => (
                        <tr key={entry.id} className="text-white/70">
                          <td className="px-4 py-4">{entry.entryDate}</td>
                          <td className="px-4 py-4"><p className="font-semibold text-white">{entry.title}</p><p className="text-xs text-white/35">{entry.referenceNo ?? "—"}</p></td>
                          <td className="px-4 py-4">{entry.entryType}</td>
                          <td className="px-4 py-4 text-right font-bold text-white">{money(entry.amount)}</td>
                        </tr>
                      ))}
                      {cashEntries.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-white/35">{t.noData}</td></tr>}
                    </tbody>
                  </table>
                </div>
              </Card>
            </section>
          </>
        );
      }}
    </FinanceShell>
  );
}
