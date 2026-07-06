"use client";

import { getWhatsAppTemplateText } from "@/app/admin/settings/whatsapp-messages/actions";

import { useMemo, useState, useTransition } from "react";
import { Download, MessageCircle, Printer, Save } from "lucide-react";
import type { CashClosing, OperationsPageState } from "@/app/admin/operations/actions";
import { saveCashClosing } from "@/app/admin/operations/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FinanceShell } from "@/features/admin/finance/finance-shell";
import type { FinanceLanguage } from "@/features/admin/finance/finance-i18n";
import { money, numberValue, today } from "@/features/admin/finance/finance-utils";

type FinanceClosingPageProps = {
  initialState: OperationsPageState;
};

const pageText: Record<FinanceLanguage, Record<string, string>> = {
  fa: {
    liveSnapshot: "پیش‌نمایش بستن صندوق",
    todayClosing: "بستن امروز",
    totalCashInHand: "نقد نزد کافه",
    exportCsv: "خروجی CSV",
    printSnapshot: "چاپ گزارش صندوق",
    latestClosing: "آخرین بستن صندوق",
    clickToEdit: "برای ویرایش روی ردیف کلیک کن",
    noLatest: "هنوز بستن صندوقی ثبت نشده.",
    closingReport: "گزارش بستن صندوق",
  },
  ar: {
    liveSnapshot: "معاينة إغلاق الصندوق",
    todayClosing: "إغلاق اليوم",
    totalCashInHand: "النقد لدى الكافيه",
    exportCsv: "تصدير CSV",
    printSnapshot: "طباعة تقرير الصندوق",
    latestClosing: "آخر إغلاق للصندوق",
    clickToEdit: "اضغط على الصف للتعديل",
    noLatest: "لا يوجد إغلاق صندوق بعد.",
    closingReport: "تقرير إغلاق الصندوق",
  },
  en: {
    liveSnapshot: "Cash closing preview",
    todayClosing: "Today closing",
    totalCashInHand: "Cash in cafe",
    exportCsv: "Export CSV",
    printSnapshot: "Print cash report",
    latestClosing: "Latest closing",
    clickToEdit: "Click a row to edit",
    noLatest: "No cash closing has been saved yet.",
    closingReport: "Cash closing report",
  },
};

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

function printClosing(label: string, closing: CashClosing) {
  const win = window.open("", "_blank", "width=760,height=900");
  if (!win) return;

  win.document.write(`<!doctype html><html><head><title>${label}</title><style>
    body{font-family:Tahoma,Arial,sans-serif;padding:32px;color:#111;line-height:1.7}
    .box{border:1px solid #ddd;border-radius:18px;padding:22px;margin-bottom:16px}
    h1{font-size:22px;margin:0 0 16px} table{width:100%;border-collapse:collapse}
    td{border-bottom:1px solid #eee;padding:10px 0}.total{font-size:20px;font-weight:800}
  </style></head><body><div class="box"><h1>${label}</h1><table>
    <tr><td>Date</td><td>${closing.closingDate}</td></tr>
    <tr><td>Cash</td><td>${money(closing.cashAmount)} OMR</td></tr>
    <tr><td>Card</td><td>${money(closing.cardAmount)} OMR</td></tr>
    <tr><td>Talabat</td><td>${money(closing.talabatAmount)} OMR</td></tr>
    <tr><td>Tip card</td><td>${money(closing.otherAmount)} OMR</td></tr>
    <tr><td>Notes</td><td>${closing.notes ?? "—"}</td></tr>
    <tr><td class="total">Total</td><td class="total">${money(closing.totalAmount)} OMR</td></tr>
  </table></div></body></html>`);
  win.document.close();
  win.focus();
  win.print();
}


async function shareClosing(closing: CashClosing, language: FinanceLanguage) {
  const saved = await getWhatsAppTemplateText("cash_closing", language);
  const fallback = ["Bon Plus — Cash Closing Summary", `Date: ${closing.closingDate}`, `Cash: ${money(closing.cashAmount)} OMR`, `Card: ${money(closing.cardAmount)} OMR`, `Talabat: ${money(closing.talabatAmount)} OMR`, `Total: ${money(closing.totalAmount)} OMR`].join("\n");
  const lines = (saved || fallback).replaceAll("{date}", closing.closingDate).replaceAll("{cash}", money(closing.cashAmount)).replaceAll("{card}", money(closing.cardAmount)).replaceAll("{talabat}", money(closing.talabatAmount)).replaceAll("{total}", money(closing.totalAmount)).replaceAll("{discrepancy}", "—");
  window.open(`https://wa.me/?text=${encodeURIComponent(lines)}`, "_blank", "noopener,noreferrer");
}
export function FinanceClosingPage({ initialState }: FinanceClosingPageProps) {
  const [message, setMessage] = useState<string | null>(initialState.message ?? null);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    id: "",
    closingDate: today(),
    cashAmount: "",
    cardAmount: "",
    talabatAmount: "",
    otherAmount: "",
    notes: "",
  });

  const sortedClosings = useMemo(
    () => [...initialState.closings].sort((a, b) => b.closingDate.localeCompare(a.closingDate) || b.createdAt.localeCompare(a.createdAt)),
    [initialState.closings],
  );
  const latestClosing = sortedClosings[0] ?? null;
  const previewTotal = numberValue(form.cashAmount) + numberValue(form.cardAmount) + numberValue(form.talabatAmount) + numberValue(form.otherAmount);

  const totals = useMemo(() => {
    return sortedClosings.reduce(
      (sum, closing) => ({
        cash: sum.cash + numberValue(closing.cashAmount),
        card: sum.card + numberValue(closing.cardAmount),
        talabat: sum.talabat + numberValue(closing.talabatAmount),
        tipCard: sum.tipCard + numberValue(closing.otherAmount),
        total: sum.total + numberValue(closing.totalAmount),
      }),
      { cash: 0, card: 0, talabat: 0, tipCard: 0, total: 0 },
    );
  }, [sortedClosings]);

  const editClosing = (closing: CashClosing) => {
    setForm({
      id: closing.id,
      closingDate: closing.closingDate,
      cashAmount: String(closing.cashAmount ?? ""),
      cardAmount: String(closing.cardAmount ?? ""),
      talabatAmount: String(closing.talabatAmount ?? ""),
      otherAmount: String(closing.otherAmount ?? ""),
      notes: closing.notes ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = () => {
    startTransition(async () => {
      const result = await saveCashClosing(form);
      setMessage(result.message ?? null);

      if (result.success) {
        window.location.reload();
      }
    });
  };

  const exportClosings = () => {
    downloadCsv("cash-closings.csv", [
      ["Date", "Cash", "Card", "Talabat", "Tip card", "Total", "Notes"],
      ...sortedClosings.map((closing) => [
        closing.closingDate,
        String(closing.cashAmount ?? ""),
        String(closing.cardAmount ?? ""),
        String(closing.talabatAmount ?? ""),
        String(closing.otherAmount ?? ""),
        String(closing.totalAmount ?? ""),
        closing.notes ?? "",
      ]),
    ]);
  };

  return (
    <FinanceShell active="closing" intro="closingIntro">
      {({ language, t }) => {
        const l = pageText[language];

        return (
          <>
            {message && (
              <div className="rounded-3xl border border-amber-200/10 bg-amber-200/[0.06] p-4 text-sm text-amber-100">
                {message}
              </div>
            )}

            <section className="grid gap-4 md:grid-cols-5">
              <Card className="p-4"><p className="text-xs text-white/40">{t.cashIncome}</p><p className="mt-2 text-2xl font-black text-white">{money(totals.cash)}</p></Card>
              <Card className="p-4"><p className="text-xs text-white/40">{t.cardIncome}</p><p className="mt-2 text-2xl font-black text-white">{money(totals.card)}</p></Card>
              <Card className="p-4"><p className="text-xs text-white/40">{t.talabatIncome}</p><p className="mt-2 text-2xl font-black text-white">{money(totals.talabat)}</p></Card>
              <Card className="p-4"><p className="text-xs text-white/40">{t.tipCard}</p><p className="mt-2 text-2xl font-black text-white">{money(totals.tipCard)}</p></Card>
              <Card className="p-4"><p className="text-xs text-white/40">{t.closingTotal}</p><p className="mt-2 text-2xl font-black text-white">{money(totals.total)}</p></Card>
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
              <Card className="p-5">
                <h2 className="text-xl font-semibold text-white">{t.cashClosing}</h2>

                <div className="mt-5 grid gap-4">
                  <label className="block">
                    <span className="text-sm text-white/45">{t.date}</span>
                    <input
                      type="date"
                      value={form.closingDate}
                      onChange={(event) => setForm((current) => ({ ...current, closingDate: event.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                    />
                  </label>

                  <div className="grid gap-3 md:grid-cols-2">
                    <input type="number" step="0.001" value={form.cashAmount} onChange={(event) => setForm((current) => ({ ...current, cashAmount: event.target.value }))} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50" placeholder={t.cashAmount} />
                    <input type="number" step="0.001" value={form.cardAmount} onChange={(event) => setForm((current) => ({ ...current, cardAmount: event.target.value }))} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50" placeholder={t.cardAmount} />
                    <input type="number" step="0.001" value={form.talabatAmount} onChange={(event) => setForm((current) => ({ ...current, talabatAmount: event.target.value }))} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50" placeholder={t.talabatAmount} />
                    <input type="number" step="0.001" value={form.otherAmount} onChange={(event) => setForm((current) => ({ ...current, otherAmount: event.target.value }))} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50" placeholder={t.tipCardAmount} />
                  </div>

                  <div className="rounded-3xl border border-amber-200/15 bg-amber-200/[0.06] p-4">
                    <p className="text-sm text-amber-100/70">{l.liveSnapshot}</p>
                    <p className="mt-2 text-3xl font-black text-white">{money(previewTotal)} OMR</p>
                    <p className="mt-1 text-xs text-white/35">{t.cashIncome}: {money(form.cashAmount)} / {t.cardIncome}: {money(form.cardAmount)} / {t.talabatIncome}: {money(form.talabatAmount)} / {t.tipCard}: {money(form.otherAmount)}</p>
                  </div>

                  <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} className="min-h-24 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50" placeholder={t.notes} />

                  <Button onClick={submit} disabled={isPending}>
                    <Save className="h-4 w-4" />
                    {form.id ? t.updateClosing : t.saveClosing}
                  </Button>
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">{t.closingHistory}</h2>
                    <p className="mt-1 text-xs text-white/35">{l.clickToEdit}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={exportClosings} disabled={sortedClosings.length === 0}><Download className="h-4 w-4" />{l.exportCsv}</Button>
                    <Button variant="secondary" onClick={() => latestClosing && printClosing(l.closingReport, latestClosing)} disabled={!latestClosing}><Printer className="h-4 w-4" />{l.printSnapshot}</Button>
                  </div>
                </div>

                {latestClosing && (
                  <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs text-white/40">{l.latestClosing}</p>
                    <p className="mt-2 text-xl font-black text-white">{latestClosing.closingDate} — {money(latestClosing.totalAmount)} OMR</p>
                    <p className="mt-1 text-xs text-white/35">{t.cashIncome}: {money(latestClosing.cashAmount)} / {t.cardIncome}: {money(latestClosing.cardAmount)} / {t.talabatIncome}: {money(latestClosing.talabatAmount)} / {t.tipCard}: {money(latestClosing.otherAmount)}</p>
                  </div>
                )}

                <div className="mt-5 overflow-hidden rounded-3xl border border-white/10">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/[0.04] text-white/40">
                      <tr>
                        <th className="px-4 py-3">{t.date}</th>
                        <th className="px-4 py-3">{t.cashIncome}</th>
                        <th className="px-4 py-3">{t.cardIncome}</th>
                        <th className="px-4 py-3">{t.talabatIncome}</th>
                        <th className="px-4 py-3">{t.tipCard}</th>
                        <th className="px-4 py-3 text-right">{t.total}</th>
                        <th className="px-4 py-3 text-right">WhatsApp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {sortedClosings.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-white/35">{t.noClosings}</td></tr>}

                      {sortedClosings.map((closing) => (
                        <tr key={closing.id} className="cursor-pointer text-white/70 hover:bg-white/[0.03]" onClick={() => editClosing(closing)}>
                          <td className="px-4 py-4">{closing.closingDate}</td>
                          <td className="px-4 py-4">{money(closing.cashAmount)}</td>
                          <td className="px-4 py-4">{money(closing.cardAmount)}</td>
                          <td className="px-4 py-4">{money(closing.talabatAmount)}</td>
                          <td className="px-4 py-4">{money(closing.otherAmount)}</td>
                          <td className="px-4 py-4 text-right font-bold text-white">{money(closing.totalAmount)}</td>
                          <td className="px-4 py-4 text-right">
                            <button
                              type="button"
                              onClick={(event) => { event.stopPropagation(); shareClosing(closing, language); }}
                              className="inline-flex items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-300/20"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              WhatsApp
                            </button>
                          </td>
                        </tr>
                      ))}
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
