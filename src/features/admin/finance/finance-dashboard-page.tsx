"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Banknote, CreditCard, Download, FileText, ReceiptText, WalletCards } from "lucide-react";
import type { OperationsPageState } from "@/app/admin/operations/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FinanceShell } from "@/features/admin/finance/finance-shell";
import type { FinanceLanguage } from "@/features/admin/finance/finance-i18n";
import {
  documentsFor,
  groupExpensesBySupplier,
  groupExpensesByUsage,
  maxChartValue,
  money,
  monthlyPeriods,
  numberValue,
} from "@/features/admin/finance/finance-utils";

type FinanceDashboardPageProps = {
  initialState: OperationsPageState;
};

const pageText: Record<FinanceLanguage, Record<string, string>> = {
  fa: {
    quickActions: "دسترسی سریع",
    openClosing: "ثبت بستن صندوق",
    openInvoice: "ثبت فاکتور",
    openCash: "تنخواه",
    exportSummary: "خروجی خلاصه",
    health: "چک‌لیست کنترل مالی",
    unpaidCheck: "فاکتورهای پرداخت‌نشده",
    documentCheck: "فاکتورهای بدون سند",
    needsReview: "نیاز به بررسی",
    ok: "اوکی",
  },
  ar: {
    quickActions: "إجراءات سريعة",
    openClosing: "تسجيل إغلاق الصندوق",
    openInvoice: "تسجيل فاتورة",
    openCash: "العهدة",
    exportSummary: "تصدير الملخص",
    health: "قائمة فحص المالية",
    unpaidCheck: "فواتير غير مدفوعة",
    documentCheck: "فواتير بدون مستند",
    needsReview: "يحتاج مراجعة",
    ok: "ممتاز",
  },
  en: {
    quickActions: "Quick actions",
    openClosing: "Record cash closing",
    openInvoice: "Add invoice",
    openCash: "Petty cash",
    exportSummary: "Export summary",
    health: "Finance control checklist",
    unpaidCheck: "Unpaid invoices",
    documentCheck: "Invoices without docs",
    needsReview: "Needs review",
    ok: "OK",
  },
};

function MetricCard({ label, value, hint, icon }: { label: string; value: string; hint?: string; icon: ReactNode }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3 text-white/45">
        <span className="text-amber-200">{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
      <p className="mt-4 text-3xl font-black text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-white/35">{hint}</p>}
    </Card>
  );
}

function BarRow({ label, amount, max }: { label: string; amount: number; max: number }) {
  const width = Math.max(4, Math.round((amount / max) * 100));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="truncate text-white/60">{label}</span>
        <span className="font-bold text-white">{money(amount)} OMR</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-amber-200/80" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
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

export function FinanceDashboardPage({ initialState }: FinanceDashboardPageProps) {
  const overview = initialState.overview;
  const monthlySummary = monthlyPeriods(initialState);
  const byUsage = groupExpensesByUsage(initialState.entries);
  const bySupplier = groupExpensesBySupplier(initialState.entries);
  const closingMax = maxChartValue((initialState.closings ?? []).map((closing) => numberValue(closing.totalAmount)));
  const usageMax = maxChartValue(byUsage.map((item) => item.amount));
  const supplierMax = maxChartValue(bySupplier.map((item) => item.amount));
  const invoiceEntries = initialState.entries.filter((entry) => entry.entryType === "expense" || entry.entryType === "cash_drawer_expense");
  const unpaidCount = invoiceEntries.filter((entry) => entry.paymentStatus !== "paid").length;
  const missingDocsCount = invoiceEntries.filter((entry) => documentsFor(initialState.documents, "finance_entry", entry.id).length === 0).length;

  const exportSummary = () => {
    downloadCsv("finance-summary.csv", [
      ["Metric", "Value"],
      ["Paid expenses", String(overview?.paidExpenses ?? 0)],
      ["Unpaid expenses", String(overview?.unpaidExpenses ?? 0)],
      ["Petty cash top-ups", String(overview?.pettyCashTopUps ?? 0)],
      ["Cash transfers", String(overview?.cashTransfers ?? 0)],
      ["Cash income", String(overview?.cashIncome ?? 0)],
      ["Card income", String(overview?.cardIncome ?? 0)],
      ["Talabat income", String(overview?.talabatIncome ?? 0)],
      ["Tip card", String(overview?.otherIncome ?? 0)],
      ["Closing total", String(overview?.closingTotal ?? 0)],
    ]);
  };

  return (
    <FinanceShell active="closing" intro="dashboardIntro">
      {({ language, t }) => {
        const l = pageText[language];

        return (
          <>
            {!initialState.success && (
              <div className="rounded-3xl border border-red-400/20 bg-red-400/[0.06] p-4 text-sm text-red-100">
                {initialState.message ?? "Finance could not load."}
              </div>
            )}

            <section className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
              <Card className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">{l.quickActions}</h2>
                    <p className="mt-1 text-sm text-white/40">{t.dashboardIntro}</p>
                  </div>
                  <Button variant="secondary" onClick={exportSummary} disabled={!overview}>
                    <Download className="h-4 w-4" />
                    {l.exportSummary}
                  </Button>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <Link href="/admin/finance/closing" className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm font-semibold text-white/75 hover:bg-white/10">{l.openClosing}</Link>
                  <Link href="/admin/finance/invoices" className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm font-semibold text-white/75 hover:bg-white/10">{l.openInvoice}</Link>
                  <Link href="/admin/finance/cash" className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm font-semibold text-white/75 hover:bg-white/10">{l.openCash}</Link>
                </div>
              </Card>

              <Card className="p-5">
                <h2 className="text-xl font-semibold text-white">{l.health}</h2>
                <div className="mt-5 space-y-3">
                  {[
                    [l.unpaidCheck, unpaidCount],
                    [l.documentCheck, missingDocsCount],
                  ].map(([label, count]) => (
                    <div key={String(label)} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                      <span className="text-sm text-white/60">{label}</span>
                      <span className={`rounded-xl px-3 py-1 text-xs font-bold ${Number(count) > 0 ? "bg-amber-200 text-black" : "bg-emerald-400/15 text-emerald-100"}`}>
                        {Number(count) > 0 ? `${count} — ${l.needsReview}` : l.ok}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </section>

            {overview && (
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard label={t.paidExpenses} value={`${money(overview.paidExpenses)} OMR`} hint={`${t.unpaidExpenses}: ${money(overview.unpaidExpenses)} OMR`} icon={<ReceiptText className="h-5 w-5" />} />
                <MetricCard label={t.pettyBalance} value={`${money(overview.estimatedPettyCashBalance)} OMR`} hint={`${t.topUps}: ${money(overview.pettyCashTopUps)} OMR`} icon={<Banknote className="h-5 w-5" />} />
                <MetricCard label={t.closingTotal} value={`${money(overview.closingTotal)} OMR`} hint={`${t.cashIncome}: ${money(overview.cashIncome)} / ${t.cardIncome}: ${money(overview.cardIncome)}`} icon={<CreditCard className="h-5 w-5" />} />
                <MetricCard label={t.documents} value={String(initialState.documents.length)} hint={`${t.entries}: ${overview.entryCount} / ${t.closings}: ${overview.closingCount}`} icon={<FileText className="h-5 w-5" />} />
              </section>
            )}

            <section className="grid gap-6 xl:grid-cols-2">
              <Card className="p-5">
                <h2 className="text-xl font-semibold text-white">{t.salesMix}</h2>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {overview && [
                    [t.cashIncome, numberValue(overview.cashIncome)],
                    [t.cardIncome, numberValue(overview.cardIncome)],
                    [t.talabatIncome, numberValue(overview.talabatIncome)],
                    [t.tipCard, numberValue(overview.otherIncome)],
                  ].map(([label, amount]) => (
                    <div key={String(label)} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                      <p className="text-sm text-white/45">{label}</p>
                      <p className="mt-2 text-2xl font-black text-white">{money(Number(amount))} OMR</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-5">
                <h2 className="text-xl font-semibold text-white">{t.closingHistory}</h2>
                <div className="mt-5 space-y-4">
                  {(initialState.closings ?? []).slice(0, 7).map((closing) => (
                    <BarRow key={closing.id} label={closing.closingDate} amount={numberValue(closing.totalAmount)} max={closingMax} />
                  ))}
                  {initialState.closings.length === 0 && <p className="text-sm text-white/35">{t.noClosings}</p>}
                </div>
              </Card>
            </section>

            <section className="grid gap-6 xl:grid-cols-3">
              <Card className="p-5">
                <h2 className="text-xl font-semibold text-white">{t.expenseByUsage}</h2>
                <div className="mt-5 space-y-4">
                  {byUsage.slice(0, 6).map((item) => <BarRow key={item.label} label={item.label} amount={item.amount} max={usageMax} />)}
                  {byUsage.length === 0 && <p className="text-sm text-white/35">{t.noData}</p>}
                </div>
              </Card>

              <Card className="p-5">
                <h2 className="text-xl font-semibold text-white">{t.topSuppliers}</h2>
                <div className="mt-5 space-y-4">
                  {bySupplier.slice(0, 6).map((item) => <BarRow key={item.label} label={`${item.label} (${item.count})`} amount={item.amount} max={supplierMax} />)}
                  {bySupplier.length === 0 && <p className="text-sm text-white/35">{t.noData}</p>}
                </div>
              </Card>

              <Card className="p-5">
                <h2 className="text-xl font-semibold text-white">{t.periodSummary}</h2>
                <div className="mt-5 space-y-3">
                  {monthlySummary.slice(0, 5).map((period) => (
                    <div key={period.month} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-center justify-between gap-4"><p className="font-bold text-white">{period.month}</p><WalletCards className="h-4 w-4 text-amber-200" /></div>
                      <p className="mt-2 text-xs text-white/45">{t.closingTotal}: {money(period.closing)} / {t.paidExpenses}: {money(period.expenses)}</p>
                      <p className="mt-1 text-xs text-white/35">{t.entries}: {period.invoiceCount} / {t.closings}: {period.closingCount}</p>
                    </div>
                  ))}
                  {monthlySummary.length === 0 && <p className="text-sm text-white/35">{t.noData}</p>}
                </div>
              </Card>
            </section>

            <Card className="p-5">
              <h2 className="text-xl font-semibold text-white">{t.recentInvoices}</h2>
              <div className="bp-table-scroll mt-5 rounded-3xl border border-white/10">
                <table className="min-w-[760px] w-full text-left text-sm">
                  <thead className="bg-white/[0.04] text-white/40"><tr><th className="px-4 py-3">{t.date}</th><th className="px-4 py-3">{t.titleField}</th><th className="px-4 py-3">{t.supplier}</th><th className="px-4 py-3">{t.paymentStatus}</th><th className="px-4 py-3 text-right">{t.amount}</th></tr></thead>
                  <tbody className="divide-y divide-white/10">
                    {invoiceEntries.slice(0, 8).map((entry) => (
                      <tr key={entry.id} className="text-white/70"><td className="px-4 py-4">{entry.entryDate}</td><td className="px-4 py-4 font-semibold text-white">{entry.title}</td><td className="px-4 py-4">{entry.supplierName ?? "—"}</td><td className="px-4 py-4">{entry.paymentStatus === "paid" ? t.paid : t.unpaid}</td><td className="px-4 py-4 text-right font-bold text-white">{money(entry.amount)}</td></tr>
                    ))}
                    {invoiceEntries.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-white/35">{t.noInvoices}</td></tr>}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        );
      }}
    </FinanceShell>
  );
}
