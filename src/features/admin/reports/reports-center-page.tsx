"use client";

import { useMemo, useState, useTransition } from "react";
import { Download, Printer, RefreshCw, Search } from "lucide-react";
import {
  getOperationsPageState,
  type FinanceEntry,
  type OperationsPageState,
} from "@/app/admin/operations/actions";
import type { RecipeCostingState } from "@/app/admin/recipes/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAdminLanguage } from "@/lib/admin-language";

type Props = {
  financeState: OperationsPageState;
  recipeState: RecipeCostingState;
};

type Language = "fa" | "ar" | "en";

const copy = {
  fa: {
    title: "مرکز گزارش‌ها",
    period: "دوره گزارش",
    apply: "اعمال",
    search: "جستجو در گزارش‌ها...",
    finance: "گزارش مالی",
    recipes: "قیمت تمام‌شده فعلی",
    print: "چاپ گزارش مالی",
    financeCsv: "خروجی CSV مالی",
    closingCsv: "خروجی CSV بستن صندوق",
    date: "تاریخ",
    titleField: "عنوان",
    supplier: "تأمین‌کننده",
    status: "وضعیت",
    amount: "مبلغ",
    paidExpenses: "هزینه پرداخت‌شده",
    unpaidExpenses: "فاکتور پرداخت‌نشده",
    cashIncome: "درآمد نقدی",
    cardIncome: "درآمد کارت",
    talabat: "طلبات",
    noData: "داده‌ای وجود ندارد.",
  },
  ar: {
    title: "مركز التقارير",
    period: "فترة التقرير",
    apply: "تطبيق",
    search: "بحث في التقارير...",
    finance: "التقرير المالي",
    recipes: "تكلفة الوصفات الحالية",
    print: "طباعة التقرير المالي",
    financeCsv: "تصدير CSV مالي",
    closingCsv: "تصدير CSV للإغلاق",
    date: "التاريخ",
    titleField: "العنوان",
    supplier: "المورد",
    status: "الحالة",
    amount: "المبلغ",
    paidExpenses: "مصروفات مدفوعة",
    unpaidExpenses: "فواتير غير مدفوعة",
    cashIncome: "دخل نقدي",
    cardIncome: "دخل البطاقة",
    talabat: "طلبات",
    noData: "لا توجد بيانات.",
  },
  en: {
    title: "Reports Center",
    period: "Report period",
    apply: "Apply",
    search: "Search reports...",
    finance: "Financial report",
    recipes: "Current costing snapshot",
    print: "Print financial report",
    financeCsv: "Finance CSV",
    closingCsv: "Closing CSV",
    date: "Date",
    titleField: "Title",
    supplier: "Supplier",
    status: "Status",
    amount: "Amount",
    paidExpenses: "Paid expenses",
    unpaidExpenses: "Unpaid invoices",
    cashIncome: "Cash income",
    cardIncome: "Card income",
    talabat: "Talabat",
    noData: "No data.",
  },
} as const;

function numberValue(value: number | string | null | undefined) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function money(value: number | string | null | undefined) {
  return new Intl.NumberFormat("en-OM", { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(numberValue(value));
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
}

function downloadCsv(filename: string, rows: unknown[][]) {
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function defaultMonthStart() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function invoiceLabel(entry: FinanceEntry) {
  return entry.title?.trim() || entry.referenceNo || `${entry.supplierName ?? "Invoice"} — ${entry.entryDate}`;
}

export function ReportsCenterPage({ financeState, recipeState }: Props) {
  const { language } = useAdminLanguage();
  const lang = (language in copy ? language : "en") as Language;
  const t = copy[lang];

  const [finance, setFinance] = useState(financeState);
  const [dateFrom, setDateFrom] = useState(financeState.dateFrom || defaultMonthStart());
  const [dateTo, setDateTo] = useState(financeState.dateTo || today());
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const entries = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return finance.entries;
    return finance.entries.filter((entry) =>
      [entry.entryDate, entry.title, entry.supplierName, entry.referenceNo, entry.description, entry.paymentStatus]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [finance.entries, query]);

  const overview = finance.overview;

  const applyPeriod = () => {
    startTransition(async () => {
      const result = await getOperationsPageState({ dateFrom, dateTo });
      setFinance(result);
      setMessage(result.success ? null : result.message ?? "Report load failed.");
    });
  };

  const exportFinance = () => {
    downloadCsv(`finance-report-${dateFrom}-${dateTo}.csv`, [
      ["Date", "Title", "Supplier", "Status", "Payer", "Amount", "Reference", "Description"],
      ...entries.map((entry) => [entry.entryDate, invoiceLabel(entry), entry.supplierName ?? "", entry.paymentStatus, entry.payer, entry.amount, entry.referenceNo ?? "", entry.description ?? ""]),
    ]);
  };

  const exportClosing = () => {
    downloadCsv(`closing-report-${dateFrom}-${dateTo}.csv`, [
      ["Date", "Cash", "Card", "Talabat", "Tip/Other", "Total", "Notes"],
      ...finance.closings.map((closing) => [closing.closingDate, closing.cashAmount, closing.cardAmount, closing.talabatAmount, closing.otherAmount, closing.totalAmount, closing.notes ?? ""]),
    ]);
  };

  const printFinance = () => {
    const rows = entries
      .map((entry) => `<tr><td>${entry.entryDate}</td><td>${invoiceLabel(entry)}</td><td>${entry.supplierName ?? "—"}</td><td>${entry.paymentStatus}</td><td style="text-align:right">${money(entry.amount)}</td></tr>`)
      .join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Bon Plus Financial Report</title><style>body{font-family:Arial,sans-serif;padding:28px;color:#111}h1{margin:0 0 8px}.muted{color:#666;margin-bottom:24px}.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:20px 0}.box{border:1px solid #ddd;border-radius:10px;padding:12px}.box b{display:block;font-size:18px;margin-top:6px}table{width:100%;border-collapse:collapse;margin-top:20px;font-size:12px}th,td{border-bottom:1px solid #ddd;padding:9px;text-align:left}th{background:#f3f3f3}@page{size:A4;margin:12mm}</style></head><body><h1>Bon Plus Financial Report</h1><div class="muted">Period: ${dateFrom} — ${dateTo}</div><div class="summary"><div class="box">Paid expenses<b>${money(overview?.paidExpenses)} OMR</b></div><div class="box">Unpaid invoices<b>${money(overview?.unpaidExpenses)} OMR</b></div><div class="box">Cash income<b>${money(overview?.cashIncome)} OMR</b></div><div class="box">Card income<b>${money(overview?.cardIncome)} OMR</b></div><div class="box">Talabat<b>${money(overview?.talabatIncome)} OMR</b></div><div class="box">Closing total<b>${money(overview?.closingTotal)} OMR</b></div></div><table><thead><tr><th>Date</th><th>Title</th><th>Supplier</th><th>Status</th><th style="text-align:right">Amount</th></tr></thead><tbody>${rows || `<tr><td colspan="5">No data</td></tr>`}</tbody></table><script>window.onload=()=>window.print()</script></body></html>`;
    const win = window.open("", "_blank", "width=980,height=900");
    if (!win) return;
    win.document.write(html);
    win.document.close();
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-100/70">Reports</p>
        <h1 className="mt-2 text-3xl font-black text-white">{t.title}</h1>
      </div>

      {message && <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-100">{message}</div>}

      <Card className="p-5">
        <div className="grid gap-3 lg:grid-cols-[180px_180px_120px_minmax(220px,1fr)]">
          <label><span className="mb-2 block text-xs text-white/40">{t.period} — From</span><input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white [color-scheme:dark]" /></label>
          <label><span className="mb-2 block text-xs text-white/40">To</span><input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white [color-scheme:dark]" /></label>
          <div className="flex items-end"><Button onClick={applyPeriod} disabled={isPending}><RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} /> {t.apply}</Button></div>
          <label className="relative flex items-end"><Search className="pointer-events-none absolute bottom-4 left-4 h-4 w-4 text-white/35" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} className="w-full rounded-2xl border border-white/10 bg-black/20 py-3 pl-11 pr-4 text-sm text-white outline-none" /></label>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          [t.paidExpenses, overview?.paidExpenses],
          [t.unpaidExpenses, overview?.unpaidExpenses],
          [t.cashIncome, overview?.cashIncome],
          [t.cardIncome, overview?.cardIncome],
          [t.talabat, overview?.talabatIncome],
        ].map(([label, value]) => <Card key={String(label)} className="p-4"><p className="text-xs text-white/40">{label}</p><p className="mt-3 text-2xl font-black text-white">{money(value as number | string | undefined)}</p><p className="text-xs text-white/30">OMR</p></Card>)}
      </div>

      <Card className="overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b border-white/10 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div><h2 className="text-xl font-bold text-white">{t.finance}</h2><p className="mt-1 text-xs text-white/35">{dateFrom} — {dateTo}</p></div>
          <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={exportFinance}><Download className="h-4 w-4" /> {t.financeCsv}</Button><Button variant="secondary" onClick={exportClosing}><Download className="h-4 w-4" /> {t.closingCsv}</Button><Button onClick={printFinance}><Printer className="h-4 w-4" /> {t.print}</Button></div>
        </div>
        <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-white/[0.04] text-white/40"><tr><th className="px-4 py-3">{t.date}</th><th className="px-4 py-3">{t.titleField}</th><th className="px-4 py-3">{t.supplier}</th><th className="px-4 py-3">{t.status}</th><th className="px-4 py-3 text-right">{t.amount}</th></tr></thead><tbody className="divide-y divide-white/10">{entries.map((entry) => <tr key={entry.id} className="text-white/70"><td className="px-4 py-4">{entry.entryDate}</td><td className="px-4 py-4 font-semibold text-white">{invoiceLabel(entry)}</td><td className="px-4 py-4">{entry.supplierName ?? "—"}</td><td className="px-4 py-4">{entry.paymentStatus}</td><td className="px-4 py-4 text-right font-bold text-white">{money(entry.amount)}</td></tr>)}{entries.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-white/35">{t.noData}</td></tr>}</tbody></table></div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-white/10 p-5"><h2 className="text-xl font-bold text-white">{t.recipes}</h2><p className="mt-1 text-xs text-white/35">Current snapshot — not historical period data</p></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-white/[0.04] text-white/40"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Category</th><th className="px-4 py-3 text-right">Cost</th><th className="px-4 py-3 text-right">Sale</th><th className="px-4 py-3 text-right">Margin</th></tr></thead><tbody className="divide-y divide-white/10">{recipeState.recipeCosts.map((row) => <tr key={row.itemId} className="text-white/70"><td className="px-4 py-4 font-semibold text-white">{row.name}</td><td className="px-4 py-4">{row.category}</td><td className="px-4 py-4 text-right">{money(row.recipeCost)}</td><td className="px-4 py-4 text-right">{money(row.salePrice)}</td><td className="px-4 py-4 text-right">{row.marginPercent.toFixed(1)}%</td></tr>)}</tbody></table></div>
      </Card>
    </div>
  );
}
