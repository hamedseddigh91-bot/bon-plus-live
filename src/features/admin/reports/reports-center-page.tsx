"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Banknote,
  BarChart3,
  CheckCircle2,
  ChefHat,
  Download,
  FileArchive,
  FileText,
  Printer,
  ReceiptText,
  Search,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import type { OperationsPageState, FinanceEntry, CashClosing } from "@/app/admin/operations/actions";
import type { RecipeCostingState } from "@/app/admin/recipes/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAdminLanguage } from "@/lib/admin-language";

type ReportsCenterPageProps = {
  financeState: OperationsPageState;
  recipeState: RecipeCostingState;
};

type Language = "fa" | "ar" | "en";

const copy = {
  fa: {
    title: "مرکز گزارش‌ها",
    subtitle: "خلاصه مدیریتی، خروجی مالی، گزارش رسپی، بکاپ سبک و چاپ گزارش‌ها.",
    financeSnapshot: "خلاصه مالی",
    recipeSnapshot: "خلاصه قیمت تمام‌شده",
    riskCenter: "هشدارهای مدیریتی",
    financeRows: "رکوردهای مالی",
    closingRows: "بستن صندوق",
    recipeRows: "رسپی‌ها",
    paidExpenses: "هزینه پرداخت‌شده",
    unpaidExpenses: "فاکتور پرداخت‌نشده",
    closingTotal: "جمع بستن صندوق",
    pettyBalance: "مانده تقریبی تنخواه",
    tipCard: "تیپ کارت",
    talabat: "طلبات",
    lowMargin: "اطلاعات ناقص کاست",
    menuItems: "آیتم منو",
    ingredients: "مواد اولیه",
    averageCost: "میانگین هزینه",
    averageSale: "میانگین فروش",
    search: "جستجو در گزارش‌ها...",
    exportFinance: "خروجی CSV مالی",
    exportClosing: "خروجی CSV بستن صندوق",
    exportRecipes: "خروجی CSV رسپی",
    backupJson: "بکاپ JSON",
    printReport: "چاپ گزارش",
    date: "تاریخ",
    titleField: "عنوان",
    type: "نوع",
    status: "وضعیت",
    amount: "مبلغ",
    supplier: "تأمین‌کننده",
    total: "جمع",
    cash: "نقد",
    card: "کارت",
    name: "نام",
    cost: "هزینه",
    sale: "فروش",
    margin: "Margin",
    foodCost: "Food Cost",
    good: "خوب",
    watch: "نیازمند بررسی",
    danger: "خطر",
    noData: "داده‌ای برای نمایش وجود ندارد.",
    unpaidWarning: "فاکتورهای پرداخت‌نشده را قبل از بستن دوره بررسی کن.",
    marginWarning: "آیتم‌هایی که کاست یا قیمت فروش معتبر ندارند را کامل کن.",
    healthy: "وضعیت کلی قابل قبول است.",
    recovery: "اقدام پیشنهادی",
  },
  ar: {
    title: "مركز التقارير",
    subtitle: "ملخص إداري، تصدير مالي، تقرير التكلفة، نسخة احتياطية خفيفة وطباعة التقارير.",
    financeSnapshot: "الملخص المالي",
    recipeSnapshot: "ملخص تكلفة الوصفات",
    riskCenter: "تنبيهات الإدارة",
    financeRows: "القيود المالية",
    closingRows: "إغلاق الصندوق",
    recipeRows: "الوصفات",
    paidExpenses: "مصروفات مدفوعة",
    unpaidExpenses: "فواتير غير مدفوعة",
    closingTotal: "إجمالي الإغلاق",
    pettyBalance: "رصيد العهدة التقريبي",
    tipCard: "تيب البطاقة",
    talabat: "طلبات",
    lowMargin: "بيانات تكلفة ناقصة",
    menuItems: "أصناف المنيو",
    ingredients: "المواد الخام",
    averageCost: "متوسط التكلفة",
    averageSale: "متوسط البيع",
    search: "بحث في التقارير...",
    exportFinance: "تصدير CSV مالي",
    exportClosing: "تصدير CSV للإغلاق",
    exportRecipes: "تصدير CSV للوصفات",
    backupJson: "نسخة JSON",
    printReport: "طباعة التقرير",
    date: "التاريخ",
    titleField: "العنوان",
    type: "النوع",
    status: "الحالة",
    amount: "المبلغ",
    supplier: "المورد",
    total: "الإجمالي",
    cash: "النقد",
    card: "البطاقة",
    name: "الاسم",
    cost: "التكلفة",
    sale: "البيع",
    margin: "Margin",
    foodCost: "Food Cost",
    good: "جيد",
    watch: "يحتاج متابعة",
    danger: "خطر",
    noData: "لا توجد بيانات للعرض.",
    unpaidWarning: "راجع الفواتير غير المدفوعة قبل إغلاق الفترة.",
    marginWarning: "أكمل الأصناف التي لا تحتوي على تكلفة أو سعر بيع صالح.",
    healthy: "الوضع العام مقبول.",
    recovery: "الإجراء المقترح",
  },
  en: {
    title: "Reports Center",
    subtitle: "Management summary, finance exports, recipe costing report, lightweight backup and print-ready reports.",
    financeSnapshot: "Finance snapshot",
    recipeSnapshot: "Recipe costing snapshot",
    riskCenter: "Management alerts",
    financeRows: "Finance entries",
    closingRows: "Cash closings",
    recipeRows: "Recipes",
    paidExpenses: "Paid expenses",
    unpaidExpenses: "Unpaid invoices",
    closingTotal: "Closing total",
    pettyBalance: "Estimated petty balance",
    tipCard: "Tip card",
    talabat: "Talabat",
    lowMargin: "Incomplete costing data",
    menuItems: "Menu items",
    ingredients: "Ingredients",
    averageCost: "Average cost",
    averageSale: "Average sale",
    search: "Search reports...",
    exportFinance: "Finance CSV",
    exportClosing: "Closing CSV",
    exportRecipes: "Recipes CSV",
    backupJson: "JSON backup",
    printReport: "Print report",
    date: "Date",
    titleField: "Title",
    type: "Type",
    status: "Status",
    amount: "Amount",
    supplier: "Supplier",
    total: "Total",
    cash: "Cash",
    card: "Card",
    name: "Name",
    cost: "Cost",
    sale: "Sale",
    margin: "Margin",
    foodCost: "Food Cost",
    good: "Good",
    watch: "Watch",
    danger: "Danger",
    noData: "No data to display.",
    unpaidWarning: "Review unpaid invoices before locking the period.",
    marginWarning: "Complete items that are missing a valid cost or sale price.",
    healthy: "Overall status looks acceptable.",
    recovery: "Suggested action",
  },
} as const;

function numberValue(value: number | string | null | undefined) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function money(value: number | string | null | undefined) {
  return new Intl.NumberFormat("en-OM", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(numberValue(value));
}

function csvEscape(value: unknown) {
  const text = String(value ?? "").replace(/\r?\n/g, " ");
  if (text.includes(",") || text.includes('"')) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function downloadText(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function toCsv(rows: Array<Record<string, unknown>>) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const body = rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","));
  return [headers.join(","), ...body].join("\n");
}

function MetricCard({ label, value, icon, tone = "neutral" }: { label: string; value: string; icon: ReactNode; tone?: "neutral" | "danger" | "success" }) {
  return (
    <Card className="group relative overflow-hidden p-5">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-white/50">{label}</p>
        <div
          className={`rounded-2xl border p-2 ${
            tone === "danger"
              ? "border-red-400/20 bg-red-400/10 text-red-100"
              : tone === "success"
                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                : "border-amber-200/20 bg-amber-200/10 text-amber-100"
          }`}
        >
          {icon}
        </div>
      </div>
      <p className="mt-4 text-3xl font-black tracking-tight text-white">{value}</p>
    </Card>
  );
}

function financeCsvRows(entries: FinanceEntry[]) {
  return entries.map((entry) => ({
    date: entry.entryDate,
    type: entry.entryType,
    title: entry.title,
    amount: numberValue(entry.amount),
    payment_status: entry.paymentStatus,
    payer: entry.payer,
    usage_place: entry.usagePlace,
    supplier: entry.supplierName ?? "",
    reference_no: entry.referenceNo ?? "",
    description: entry.description ?? "",
  }));
}

function closingCsvRows(closings: CashClosing[]) {
  return closings.map((closing) => ({
    date: closing.closingDate,
    cash: numberValue(closing.cashAmount),
    card: numberValue(closing.cardAmount),
    talabat: numberValue(closing.talabatAmount),
    tip_card: numberValue(closing.otherAmount),
    total: numberValue(closing.totalAmount),
    notes: closing.notes ?? "",
  }));
}

export function ReportsCenterPage({ financeState, recipeState }: ReportsCenterPageProps) {
  const { language } = useAdminLanguage();
  const lang = (language in copy ? language : "en") as Language;
  const t = copy[lang];
  const [query, setQuery] = useState("");
  const overview = financeState.overview;

  const filteredEntries = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return financeState.entries;

    return financeState.entries.filter((entry) => {
      return [entry.entryDate, entry.entryType, entry.title, entry.paymentStatus, entry.payer, entry.usagePlace, entry.supplierName, entry.referenceNo, entry.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [financeState.entries, query]);

  const filteredRecipeRows = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return recipeState.recipeCosts;

    return recipeState.recipeCosts.filter((row) => [row.name, row.category].some((value) => String(value).toLowerCase().includes(term)));
  }, [recipeState.recipeCosts, query]);

  const unpaidTotal = numberValue(overview?.unpaidExpenses);
  const costingIssueCount = recipeState.recipeCosts.filter((row) => row.recipeCost <= 0 || row.salePrice <= 0).length;
  const hasAlerts = unpaidTotal > 0 || costingIssueCount > 0;

  const exportFinanceCsv = () => downloadText("finance-report.csv", toCsv(financeCsvRows(financeState.entries)), "text/csv;charset=utf-8");
  const exportClosingCsv = () => downloadText("cash-closing-report.csv", toCsv(closingCsvRows(financeState.closings)), "text/csv;charset=utf-8");
  const exportRecipeCsv = () =>
    downloadText(
      "recipe-costing-report.csv",
      toCsv(
        recipeState.recipeCosts.map((row) => ({
          name: row.name,
          category: row.category,
          sale_price: row.salePrice,
          recipe_cost: row.recipeCost,
          gross_profit: row.grossProfit,
          margin_percent: row.marginPercent,
          food_cost_percent: row.foodCostPercent,
          sale_multiple: row.saleMultiple,
        })),
      ),
      "text/csv;charset=utf-8",
    );

  const exportBackup = () =>
    downloadText(
      `bon-plus-backup-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          finance: financeState,
          recipes: recipeState,
        },
        null,
        2,
      ),
      "application/json;charset=utf-8",
    );

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.25em] text-amber-200/80">
              <BarChart3 className="h-4 w-4" />
              {t.title}
            </div>
            <h2 className="text-3xl font-black tracking-tight text-white">{t.title}</h2>
            <p className="mt-2 max-w-4xl truncate text-sm leading-6 text-white/45">{t.subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="secondary" onClick={exportFinanceCsv}>
              <Download className="h-4 w-4" />
              {t.exportFinance}
            </Button>
            <Button type="button" variant="secondary" onClick={exportClosingCsv}>
              <Download className="h-4 w-4" />
              {t.exportClosing}
            </Button>
            <Button type="button" variant="secondary" onClick={exportRecipeCsv}>
              <Download className="h-4 w-4" />
              {t.exportRecipes}
            </Button>
            <Button type="button" variant="secondary" onClick={exportBackup}>
              <FileArchive className="h-4 w-4" />
              {t.backupJson}
            </Button>
            <Button type="button" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              {t.printReport}
            </Button>
          </div>
        </div>
      </Card>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t.search}
          className="w-full rounded-[1.35rem] border border-white/10 bg-black/20 px-11 py-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-amber-200/50 focus:bg-white/[0.06]"
        />
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={t.paidExpenses} value={`${money(overview?.paidExpenses)} OMR`} icon={<ReceiptText className="h-5 w-5" />} tone="success" />
        <MetricCard label={t.unpaidExpenses} value={`${money(overview?.unpaidExpenses)} OMR`} icon={<AlertTriangle className="h-5 w-5" />} tone={unpaidTotal > 0 ? "danger" : "success"} />
        <MetricCard label={t.closingTotal} value={`${money(overview?.closingTotal)} OMR`} icon={<WalletCards className="h-5 w-5" />} />
        <MetricCard label={t.pettyBalance} value={`${money(overview?.estimatedPettyCashBalance)} OMR`} icon={<Banknote className="h-5 w-5" />} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={t.menuItems} value={String(recipeState.summary?.menuItemCount ?? 0)} icon={<ChefHat className="h-5 w-5" />} />
        <MetricCard label={t.ingredients} value={String(recipeState.summary?.ingredientCount ?? 0)} icon={<FileText className="h-5 w-5" />} />
        <MetricCard label={t.lowMargin} value={String(costingIssueCount)} icon={<AlertTriangle className="h-5 w-5" />} tone={costingIssueCount > 0 ? "danger" : "success"} />
        <MetricCard label={t.averageCost} value={`${money(recipeState.summary?.averageCost)} OMR`} icon={<BarChart3 className="h-5 w-5" />} />
      </section>

      <Card className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-white">{t.riskCenter}</h3>
            <p className="mt-1 text-sm text-white/40">{t.recovery}</p>
          </div>
          <Badge variant={hasAlerts ? "danger" : "success"}>{hasAlerts ? t.watch : t.good}</Badge>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
            <div className="flex items-start gap-3">
              {unpaidTotal > 0 ? <AlertTriangle className="mt-0.5 h-5 w-5 text-red-200" /> : <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-200" />}
              <p className="text-sm leading-6 text-white/60">{unpaidTotal > 0 ? t.unpaidWarning : t.healthy}</p>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
            <div className="flex items-start gap-3">
              {costingIssueCount > 0 ? <AlertTriangle className="mt-0.5 h-5 w-5 text-red-200" /> : <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-200" />}
              <p className="text-sm leading-6 text-white/60">{costingIssueCount > 0 ? t.marginWarning : t.healthy}</p>
            </div>
          </div>
        </div>
      </Card>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-white/10 p-5">
            <h3 className="text-xl font-bold text-white">{t.financeRows}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-white/[0.045] text-white/40">
                <tr>
                  <th className="px-4 py-3">{t.date}</th>
                  <th className="px-4 py-3">{t.titleField}</th>
                  <th className="px-4 py-3">{t.type}</th>
                  <th className="px-4 py-3">{t.status}</th>
                  <th className="px-4 py-3 text-right">{t.amount}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredEntries.slice(0, 12).map((entry) => (
                  <tr key={entry.id} className="text-white/65">
                    <td className="px-4 py-4">{entry.entryDate}</td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-white">{entry.title}</p>
                      <p className="text-xs text-white/35">{entry.supplierName ?? "—"}</p>
                    </td>
                    <td className="px-4 py-4">{entry.entryType}</td>
                    <td className="px-4 py-4">{entry.paymentStatus}</td>
                    <td className="px-4 py-4 text-right font-bold text-white">{money(entry.amount)}</td>
                  </tr>
                ))}
                {filteredEntries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-white/35">{t.noData}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="border-b border-white/10 p-5">
            <h3 className="text-xl font-bold text-white">{t.recipeRows}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-white/[0.045] text-white/40">
                <tr>
                  <th className="px-4 py-3">{t.name}</th>
                  <th className="px-4 py-3 text-right">{t.cost}</th>
                  <th className="px-4 py-3 text-right">{t.sale}</th>
                  <th className="px-4 py-3 text-right">{t.margin}</th>
                  <th className="px-4 py-3 text-right">{t.foodCost}</th>
                  <th className="px-4 py-3 text-right">Profit</th>
                  <th className="px-4 py-3 text-right">Sale ÷ Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredRecipeRows.slice(0, 12).map((row) => (
                  <tr key={row.itemId} className="text-white/65">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-white">{row.name}</p>
                      <p className="text-xs text-white/35">{row.category}</p>
                    </td>
                    <td className="px-4 py-4 text-right">{money(row.recipeCost)}</td>
                    <td className="px-4 py-4 text-right">{money(row.salePrice)}</td>
                    <td className="px-4 py-4 text-right">{row.marginPercent.toFixed(1)}%</td>
                    <td className="px-4 py-4 text-right">{row.foodCostPercent.toFixed(1)}%</td>
                    <td className="px-4 py-4 text-right">{money(row.grossProfit)}</td>
                    <td className="px-4 py-4 text-right font-black text-white">{row.saleMultiple.toFixed(2)}×</td>
                  </tr>
                ))}
                {filteredRecipeRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-white/35">{t.noData}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  );
}
