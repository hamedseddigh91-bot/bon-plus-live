"use client";

import { useState, useTransition } from "react";
import { Banknote, Save } from "lucide-react";
import type { FinanceEntry, OperationsPageState } from "@/app/admin/operations/actions";
import { closeFinancePeriod, reopenFinancePeriod, saveFinanceEntry, saveFinancePeriod } from "@/app/admin/operations/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FinanceShell } from "@/features/admin/finance/finance-shell";
import { getPettyCashEntries, money, monthlyPeriods, today } from "@/features/admin/finance/finance-utils";

type FinanceCashPageProps = {
  initialState: OperationsPageState;
};

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function FinanceCashPage({ initialState }: FinanceCashPageProps) {
  const [message, setMessage] = useState<string | null>(initialState.message ?? null);
  const [isPending, startTransition] = useTransition();
  const cashEntries = getPettyCashEntries(initialState.entries);
  const periods = monthlyPeriods(initialState);
  const financePeriods = initialState.periods ?? [];

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


  const [periodForm, setPeriodForm] = useState({
    periodMonth: currentMonth(),
    openingPettyCash: "",
    closingPettyCash: "",
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

      if (result.success) {
        window.location.reload();
      }
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

      if (result.success) {
        window.location.reload();
      }
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

      if (result.success) {
        window.location.reload();
      }
    });
  };


  const savePeriod = () => {
    startTransition(async () => {
      const result = await saveFinancePeriod({
        periodMonth: periodForm.periodMonth,
        openingPettyCash: periodForm.openingPettyCash,
        notes: periodForm.notes,
      });

      setMessage(result.message ?? null);

      if (result.success) {
        window.location.reload();
      }
    });
  };

  const closePeriod = () => {
    startTransition(async () => {
      const result = await closeFinancePeriod({
        periodMonth: periodForm.periodMonth,
        closingPettyCash: periodForm.closingPettyCash,
        notes: periodForm.notes,
      });

      setMessage(result.message ?? null);

      if (result.success) {
        window.location.reload();
      }
    });
  };

  const reopenPeriod = (periodId: string) => {
    startTransition(async () => {
      const result = await reopenFinancePeriod({ periodId });

      setMessage(result.message ?? null);

      if (result.success) {
        window.location.reload();
      }
    });
  };

  return (
    <FinanceShell active="cash" intro="cashIntro">
      {({ t }) => (
        <>
          {message && (
            <div className="rounded-3xl border border-amber-200/10 bg-amber-200/[0.06] p-4 text-sm text-amber-100">
              {message}
            </div>
          )}

          <section className="grid gap-6 xl:grid-cols-3">
            <Card className="p-5">
              <h2 className="text-xl font-semibold text-white">{t.pettyTopup}</h2>
              <div className="mt-5 grid gap-3">
                <input
                  type="date"
                  value={topupForm.entryDate}
                  onChange={(event) => setTopupForm((current) => ({ ...current, entryDate: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                />
                <input
                  value={topupForm.depositor}
                  onChange={(event) => setTopupForm((current) => ({ ...current, depositor: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                  placeholder={t.topupDepositor}
                />
                <input
                  type="number"
                  step="0.001"
                  value={topupForm.amount}
                  onChange={(event) => setTopupForm((current) => ({ ...current, amount: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                  placeholder={t.amount}
                />
                <input
                  value={topupForm.referenceNo}
                  onChange={(event) => setTopupForm((current) => ({ ...current, referenceNo: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                  placeholder={t.referenceNo}
                />
                <textarea
                  value={topupForm.notes}
                  onChange={(event) => setTopupForm((current) => ({ ...current, notes: event.target.value }))}
                  className="min-h-20 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                  placeholder={t.notes}
                />
                <Button onClick={saveTopup} disabled={isPending || !topupForm.amount}>
                  <Save className="h-4 w-4" />
                  {t.saveTopup}
                </Button>
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="text-xl font-semibold text-white">{t.cashHandover}</h2>
              <div className="mt-5 grid gap-3">
                <input
                  type="date"
                  value={handoverForm.entryDate}
                  onChange={(event) => setHandoverForm((current) => ({ ...current, entryDate: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                />
                <input
                  value={handoverForm.handoverTo}
                  onChange={(event) => setHandoverForm((current) => ({ ...current, handoverTo: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                  placeholder={t.handoverTo}
                />
                <input
                  type="number"
                  step="0.001"
                  value={handoverForm.amount}
                  onChange={(event) => setHandoverForm((current) => ({ ...current, amount: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                  placeholder={t.amount}
                />
                <input
                  value={handoverForm.referenceNo}
                  onChange={(event) => setHandoverForm((current) => ({ ...current, referenceNo: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                  placeholder={t.referenceNo}
                />
                <textarea
                  value={handoverForm.notes}
                  onChange={(event) => setHandoverForm((current) => ({ ...current, notes: event.target.value }))}
                  className="min-h-20 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                  placeholder={t.notes}
                />
                <Button onClick={saveHandover} disabled={isPending || !handoverForm.amount}>
                  <Banknote className="h-4 w-4" />
                  {t.saveHandover}
                </Button>
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="text-xl font-semibold text-white">{t.remainingCases}</h2>
              <div className="mt-5 grid gap-3">
                <input
                  type="date"
                  value={ownerPaidForm.entryDate}
                  onChange={(event) => setOwnerPaidForm((current) => ({ ...current, entryDate: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                />
                <input
                  value={ownerPaidForm.title}
                  onChange={(event) => setOwnerPaidForm((current) => ({ ...current, title: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                  placeholder={t.ownerPaid}
                />
                <input
                  type="number"
                  step="0.001"
                  value={ownerPaidForm.amount}
                  onChange={(event) => setOwnerPaidForm((current) => ({ ...current, amount: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                  placeholder={t.amount}
                />
                <input
                  value={ownerPaidForm.referenceNo}
                  onChange={(event) => setOwnerPaidForm((current) => ({ ...current, referenceNo: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                  placeholder={t.referenceNo}
                />
                <textarea
                  value={ownerPaidForm.notes}
                  onChange={(event) => setOwnerPaidForm((current) => ({ ...current, notes: event.target.value }))}
                  className="min-h-20 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                  placeholder={t.notes}
                />
                <Button onClick={saveOwnerPaid} disabled={isPending || !ownerPaidForm.amount}>
                  <Save className="h-4 w-4" />
                  {t.saveOwnerPaid}
                </Button>
              </div>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
            <Card className="p-5">
              <h2 className="text-xl font-semibold text-white">{t.financePeriods}</h2>
              <p className="mt-2 text-sm text-white/40">{t.periodLockedHelp}</p>

              <div className="mt-5 grid gap-3">
                <input
                  type="month"
                  value={periodForm.periodMonth}
                  onChange={(event) => setPeriodForm((current) => ({ ...current, periodMonth: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                />
                <input
                  type="number"
                  step="0.001"
                  value={periodForm.openingPettyCash}
                  onChange={(event) => setPeriodForm((current) => ({ ...current, openingPettyCash: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                  placeholder={t.openingPettyCash}
                />
                <input
                  type="number"
                  step="0.001"
                  value={periodForm.closingPettyCash}
                  onChange={(event) => setPeriodForm((current) => ({ ...current, closingPettyCash: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                  placeholder={t.closingPettyCash}
                />
                <textarea
                  value={periodForm.notes}
                  onChange={(event) => setPeriodForm((current) => ({ ...current, notes: event.target.value }))}
                  className="min-h-20 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                  placeholder={t.notes}
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <Button onClick={savePeriod} disabled={isPending || !periodForm.periodMonth}>
                    <Save className="h-4 w-4" />
                    {t.savePeriod}
                  </Button>
                  <Button onClick={closePeriod} disabled={isPending || !periodForm.periodMonth || !periodForm.closingPettyCash}>
                    <Banknote className="h-4 w-4" />
                    {t.closeCurrentPeriod}
                  </Button>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {financePeriods.map((period) => (
                  <div key={period.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold text-white">{period.periodMonth.slice(0, 7)}</p>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${period.status === "closed" ? "bg-red-400/15 text-red-100" : "bg-emerald-400/15 text-emerald-100"}`}>
                        {period.status === "closed" ? t.closedPeriod : t.openPeriod}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-white/45">
                      {t.openingPettyCash}: {money(period.openingPettyCash)} / {t.closingPettyCash}: {money(period.closingPettyCash ?? 0)}
                    </p>
                    {period.closedAt && <p className="mt-1 text-xs text-white/35">{period.closedAt.slice(0, 10)} — {period.closedByEmail ?? "—"}</p>}
                    {period.status === "closed" && (
                      <button
                        type="button"
                        onClick={() => reopenPeriod(period.id)}
                        className="mt-3 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/65 hover:bg-white/10"
                      >
                        {t.reopenPeriod}
                      </button>
                    )}
                  </div>
                ))}
                {financePeriods.length === 0 && <p className="text-sm text-white/35">{t.noData}</p>}
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="text-xl font-semibold text-white">{t.periodSummary}</h2>
              <p className="mt-2 text-sm text-white/40">{t.currentPeriod}</p>
              <div className="mt-5 space-y-3">
                {periods.map((period) => (
                  <div key={period.month} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="font-bold text-white">{period.month}</p>
                    <p className="mt-2 text-xs text-white/45">
                      {t.pettyTopup}: {money(period.topups)} / {t.cashHandover}: {money(period.transfers)}
                    </p>
                    <p className="mt-1 text-xs text-white/35">
                      {t.closingTotal}: {money(period.closing)} / {t.invoiceList}: {period.invoiceCount}
                    </p>
                  </div>
                ))}
                {periods.length === 0 && <p className="text-sm text-white/35">{t.noData}</p>}
              </div>
            </Card>
          </section>

          <section className="grid gap-6">
            <Card className="p-5">
              <h2 className="text-xl font-semibold text-white">{t.cash}</h2>
              <div className="mt-5 overflow-hidden rounded-3xl border border-white/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/[0.04] text-white/40">
                    <tr>
                      <th className="px-4 py-3">{t.date}</th>
                      <th className="px-4 py-3">{t.titleField}</th>
                      <th className="px-4 py-3">{t.type}</th>
                      <th className="px-4 py-3 text-right">{t.amount}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {cashEntries.map((entry: FinanceEntry) => (
                      <tr key={entry.id} className="text-white/70">
                        <td className="px-4 py-4">{entry.entryDate}</td>
                        <td className="px-4 py-4">
                          <p className="font-semibold text-white">{entry.title}</p>
                          <p className="text-xs text-white/35">{entry.referenceNo ?? "—"}</p>
                        </td>
                        <td className="px-4 py-4">{entry.entryType}</td>
                        <td className="px-4 py-4 text-right font-bold text-white">{money(entry.amount)}</td>
                      </tr>
                    ))}
                    {cashEntries.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-white/35">
                          {t.noData}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>
        </>
      )}
    </FinanceShell>
  );
}
