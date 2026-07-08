"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Archive, Banknote, Download, Edit3, RotateCcw, Save } from "lucide-react";
import type { FinanceEntry, OperationsPageState } from "@/app/admin/operations/actions";
import {
  closeFinancePeriod,
  reopenFinancePeriod,
  saveFinanceEntry,
  saveFinancePeriod,
} from "@/app/admin/operations/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FinanceShell } from "@/features/admin/finance/finance-shell";
import { getPettyCashEntries, money, monthlyPeriods, today } from "@/features/admin/finance/finance-utils";

type FinanceCashPageProps = { initialState: OperationsPageState };
type ArchiveFilter = "all" | "open" | "closed";

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function csvCell(value: unknown) {
  const text = String(value ?? "").replace(/"/g, '""');
  return `"${text}"`;
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

const text = {
  fa: {
    periodsTitle: "مدیریت دوره‌های مالی",
    periodsHelp: "با بستن یک دوره، ماه بعد خودکار باز می‌شود و مانده پایان دوره به عنوان موجودی اول دوره جدید منتقل می‌شود.",
    archiveTitle: "آرشیو دوره‌ها",
    all: "همه",
    open: "باز",
    closed: "بسته",
    editOpening: "ویرایش موجودی اول دوره",
    selectToEdit: "برای ویرایش روی یک دوره باز کلیک کن.",
    rolloverNote: "انتقال به ماه بعد خودکار است؛ موجودی اول دوره جدید قابل ویرایش باقی می‌ماند.",
    export: "خروجی دوره‌ها",
    saveOpening: "ذخیره موجودی اول دوره",
    closedLocked: "دوره بسته است؛ برای ویرایش ابتدا آن را باز کنید.",
    currentSelection: "دوره انتخاب‌شده",
    periodStats: "خلاصه ماهانه",
    opening: "اول دوره",
    closing: "پایان دوره",
  },
  ar: {
    periodsTitle: "إدارة الفترات المالية",
    periodsHelp: "عند إغلاق فترة، يتم فتح الشهر التالي تلقائياً وترحيل رصيد نهاية الفترة كرصيد افتتاحي.",
    archiveTitle: "أرشيف الفترات",
    all: "الكل",
    open: "مفتوحة",
    closed: "مغلقة",
    editOpening: "تعديل الرصيد الافتتاحي",
    selectToEdit: "اختر فترة مفتوحة للتعديل.",
    rolloverNote: "الترحيل للشهر التالي تلقائي، ويمكن تعديل الرصيد الافتتاحي للشهر الجديد.",
    export: "تصدير الفترات",
    saveOpening: "حفظ الرصيد الافتتاحي",
    closedLocked: "الفترة مغلقة؛ أعد فتحها أولاً للتعديل.",
    currentSelection: "الفترة المختارة",
    periodStats: "الملخص الشهري",
    opening: "الافتتاحي",
    closing: "الختامي",
  },
  en: {
    periodsTitle: "Finance period management",
    periodsHelp: "Closing a period automatically opens the next month and carries the closing petty cash into the new opening balance.",
    archiveTitle: "Period archive",
    all: "All",
    open: "Open",
    closed: "Closed",
    editOpening: "Edit opening balance",
    selectToEdit: "Select an open period to edit it.",
    rolloverNote: "Rollover is automatic. The new month's opening balance remains editable.",
    export: "Export periods",
    saveOpening: "Save opening balance",
    closedLocked: "This period is closed. Reopen it before editing.",
    currentSelection: "Selected period",
    periodStats: "Monthly summary",
    opening: "Opening",
    closing: "Closing",
  },
} as const;

export function FinanceCashPage({ initialState }: FinanceCashPageProps) {
  const [message, setMessage] = useState(initialState.message ?? null);
  const [isPending, startTransition] = useTransition();
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>("all");

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

  const selectedPeriod = useMemo(
    () => financePeriods.find((period) => period.periodMonth.slice(0, 7) === periodForm.periodMonth) ?? null,
    [financePeriods, periodForm.periodMonth],
  );

  const filteredPeriods = useMemo(() => {
    return financePeriods.filter((period) => archiveFilter === "all" || period.status === archiveFilter);
  }, [archiveFilter, financePeriods]);

  useEffect(() => {
    if (!selectedPeriod) return;
    setPeriodForm((current) => ({
      ...current,
      openingPettyCash: String(selectedPeriod.openingPettyCash ?? ""),
      closingPettyCash: selectedPeriod.closingPettyCash == null ? "" : String(selectedPeriod.closingPettyCash),
      notes: selectedPeriod.notes ?? "",
    }));
  }, [selectedPeriod]);

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

  const savePeriod = () => {
    startTransition(async () => {
      const result = await saveFinancePeriod({
        periodMonth: periodForm.periodMonth,
        openingPettyCash: periodForm.openingPettyCash,
        notes: periodForm.notes,
      });
      setMessage(result.message ?? null);
      if (result.success) window.location.reload();
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
      if (result.success) window.location.reload();
    });
  };

  const reopenPeriod = (periodId: string) => {
    startTransition(async () => {
      const result = await reopenFinancePeriod({ periodId });
      setMessage(result.message ?? null);
      if (result.success) window.location.reload();
    });
  };

  const selectPeriodForEdit = (period: (typeof financePeriods)[number]) => {
    setPeriodForm({
      periodMonth: period.periodMonth.slice(0, 7),
      openingPettyCash: String(period.openingPettyCash ?? ""),
      closingPettyCash: period.closingPettyCash == null ? "" : String(period.closingPettyCash),
      notes: period.notes ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const exportPeriods = () => {
    downloadCsv("finance-period-archive.csv", [
      ["Period", "Status", "Opening petty cash", "Closing petty cash", "Closed at", "Closed by", "Notes"],
      ...financePeriods.map((period) => [
        period.periodMonth.slice(0, 7),
        period.status,
        String(period.openingPettyCash ?? 0),
        String(period.closingPettyCash ?? 0),
        period.closedAt ?? "",
        period.closedByEmail ?? "",
        period.notes ?? "",
      ]),
    ]);
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

            <section className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <Card className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white">{l.periodsTitle}</h2>
                    <p className="mt-2 text-sm leading-6 text-white/50">{l.periodsHelp}</p>
                  </div>
                  <Archive className="h-5 w-5 text-amber-200" />
                </div>

                <div className="mt-5 rounded-2xl border border-amber-200/15 bg-amber-200/5 p-4 text-sm text-amber-100/80">
                  {l.rolloverNote}
                </div>

                <div className="mt-5 grid gap-3">
                  <label className="text-xs font-semibold uppercase tracking-wide text-white/40">{t.periodMonth}</label>
                  <input type="month" value={periodForm.periodMonth} onChange={(event) => setPeriodForm((current) => ({ ...current, periodMonth: event.target.value }))} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark]" />
                  <label className="text-xs font-semibold uppercase tracking-wide text-white/40">{t.openingPettyCash}</label>
                  <input type="number" step="0.001" value={periodForm.openingPettyCash} disabled={selectedPeriod?.status === "closed"} onChange={(event) => setPeriodForm((current) => ({ ...current, openingPettyCash: event.target.value }))} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none disabled:cursor-not-allowed disabled:opacity-40" placeholder={t.openingPettyCash} />
                  <label className="text-xs font-semibold uppercase tracking-wide text-white/40">{t.closingPettyCash}</label>
                  <input type="number" step="0.001" value={periodForm.closingPettyCash} disabled={selectedPeriod?.status === "closed"} onChange={(event) => setPeriodForm((current) => ({ ...current, closingPettyCash: event.target.value }))} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none disabled:cursor-not-allowed disabled:opacity-40" placeholder={t.closingPettyCash} />
                  <textarea value={periodForm.notes} disabled={selectedPeriod?.status === "closed"} onChange={(event) => setPeriodForm((current) => ({ ...current, notes: event.target.value }))} className="min-h-20 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none disabled:cursor-not-allowed disabled:opacity-40" placeholder={t.notes} />

                  {selectedPeriod?.status === "closed" && (
                    <div className="rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">{l.closedLocked}</div>
                  )}

                  <div className="grid gap-3 md:grid-cols-2">
                    <Button onClick={savePeriod} disabled={isPending || !periodForm.periodMonth || selectedPeriod?.status === "closed"}><Save className="h-4 w-4" />{l.saveOpening}</Button>
                    <Button onClick={closePeriod} disabled={isPending || !periodForm.periodMonth || !periodForm.closingPettyCash || selectedPeriod?.status === "closed"}><Banknote className="h-4 w-4" />{t.closeCurrentPeriod}</Button>
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">{l.archiveTitle}</h2>
                    <p className="mt-2 text-sm text-white/45">{l.selectToEdit}</p>
                  </div>
                  <Button variant="secondary" onClick={exportPeriods}><Download className="h-4 w-4" />{l.export}</Button>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {(["all", "open", "closed"] as ArchiveFilter[]).map((value) => (
                    <button key={value} type="button" onClick={() => setArchiveFilter(value)} className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${archiveFilter === value ? "border-amber-200/40 bg-amber-200/15 text-amber-100" : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"}`}>
                      {value === "all" ? l.all : value === "open" ? l.open : l.closed}
                    </button>
                  ))}
                </div>

                <div className="mt-5 max-h-[520px] space-y-3 overflow-y-auto pr-1">
                  {filteredPeriods.map((period) => (
                    <div key={period.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-bold text-white">{period.periodMonth.slice(0, 7)}</p>
                          <p className="mt-2 text-xs text-white/45">{l.opening}: {money(period.openingPettyCash)} OMR</p>
                          <p className="mt-1 text-xs text-white/45">{l.closing}: {money(period.closingPettyCash ?? 0)} OMR</p>
                          {period.closedAt && <p className="mt-1 text-xs text-white/30">{period.closedAt.slice(0, 10)} · {period.closedByEmail ?? "—"}</p>}
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${period.status === "closed" ? "bg-red-400/15 text-red-100" : "bg-emerald-400/15 text-emerald-100"}`}>
                          {period.status === "closed" ? t.closedPeriod : t.openPeriod}
                        </span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {period.status === "open" && (
                          <Button variant="secondary" onClick={() => selectPeriodForEdit(period)}><Edit3 className="h-4 w-4" />{l.editOpening}</Button>
                        )}
                        {period.status === "closed" && (
                          <Button variant="secondary" onClick={() => reopenPeriod(period.id)} disabled={isPending}><RotateCcw className="h-4 w-4" />{t.reopenPeriod}</Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {filteredPeriods.length === 0 && <p className="text-sm text-white/35">{t.noData}</p>}
                </div>
              </Card>
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-2">
              <Card className="p-5">
                <h2 className="text-xl font-semibold text-white">{l.periodStats}</h2>
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
