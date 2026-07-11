"use client";

import {
  Banknote,
  CreditCard,
  Download,
  MessageSquareText,
  ShoppingBag,
  Star,
  WalletCards,
} from "lucide-react";
import type { FeedbackInboxState } from "@/app/admin/feedback/actions";
import type { RecoveryBoardState } from "@/app/admin/recovery/actions";
import type { OperationsPageState } from "@/app/admin/operations/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAdminLanguage } from "@/lib/admin-language";

function numberValue(value: number | string | null | undefined) {
  return Number(value ?? 0) || 0;
}

function money(value: number | string | null | undefined) {
  return new Intl.NumberFormat("en-OM", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(numberValue(value));
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
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

export function DashboardCommandCenter({
  feedback,
  recovery,
  operations,
}: {
  feedback: FeedbackInboxState;
  recovery: RecoveryBoardState;
  operations: OperationsPageState;
}) {
  const { language } = useAdminLanguage();

  const t =
    language === "fa"
      ? {
          month: "گزارش این ماه",
          feedbackTrend: "فیدبک و امتیازها",
          latestFeedback: "آخرین فیدبک‌ها",
          followups: "آخرین پیگیری‌های فعال",
          closings: "آخرین ترازهای صندوق",
          unpaid: "فاکتورهای پرداخت‌نشده",
          petty: "موجودی تنخواه",
          income: "درآمد این ماه",
          cash: "نقد نزد کافه",
          talabat: "درآمد طلبات",
          noData: "داده‌ای وجود ندارد",
          from: "از اول ماه تا امروز",
          statement: "صورت‌حساب نقد کافه",
          download: "دانلود CSV",
          date: "تاریخ",
          description: "شرح",
          inflow: "ورودی",
          outflow: "خروجی",
          balance: "مانده",
        }
      : language === "ar"
        ? {
            month: "تقرير هذا الشهر",
            feedbackTrend: "الآراء والتقييمات",
            latestFeedback: "أحدث الآراء",
            followups: "أحدث المتابعات النشطة",
            closings: "أحدث إغلاقات الصندوق",
            unpaid: "الفواتير غير المدفوعة",
            petty: "رصيد العهدة",
            income: "دخل هذا الشهر",
            cash: "النقد في المقهى",
            talabat: "دخل طلبات",
            noData: "لا توجد بيانات",
            from: "من أول الشهر حتى اليوم",
            statement: "كشف النقد في المقهى",
            download: "تنزيل CSV",
            date: "التاريخ",
            description: "البيان",
            inflow: "داخل",
            outflow: "خارج",
            balance: "الرصيد",
          }
        : {
            month: "This month report",
            feedbackTrend: "Feedback & ratings",
            latestFeedback: "Latest feedback",
            followups: "Latest active follow-ups",
            closings: "Recent cash closings",
            unpaid: "Unpaid invoices",
            petty: "Petty cash balance",
            income: "Income this month",
            cash: "Cash at café",
            talabat: "Talabat income",
            noData: "No data",
            from: "From the 1st of the month to today",
            statement: "Cash at Café Statement",
            download: "Download CSV",
            date: "Date",
            description: "Description",
            inflow: "Inflow",
            outflow: "Outflow",
            balance: "Balance",
          };

  const overview = operations.overview;
  const activeFollowups = recovery.cases
    .filter((item) => item.status === "open" || item.status === "in_progress")
    .slice(0, 5);
  const unpaid = operations.entries
    .filter(
      (entry) =>
        (entry.entryType === "expense" || entry.entryType === "cash_drawer_expense") &&
        entry.paymentStatus !== "paid",
    )
    .slice(0, 6);
  const closings = operations.closings.slice(0, 5);

  const cashPaidInvoices = operations.entries.filter(
    (entry) =>
      entry.paymentStatus === "paid" &&
      entry.payer === "cash_drawer" &&
      (entry.entryType === "expense" || entry.entryType === "cash_drawer_expense"),
  );
  const cashTransfers = operations.entries.filter(
    (entry) => entry.paymentStatus === "paid" && entry.entryType === "cash_transfer",
  );
  const cashAtCafe =
    numberValue(overview?.cashIncome) -
    cashPaidInvoices.reduce((sum, entry) => sum + numberValue(entry.amount), 0) -
    cashTransfers.reduce((sum, entry) => sum + numberValue(entry.amount), 0);

  const statementRows = [
    ...operations.closings.map((closing) => ({
      date: closing.closingDate,
      description: `Cash closing ${closing.closingDate}`,
      inflow: numberValue(closing.cashAmount),
      outflow: 0,
    })),
    ...cashPaidInvoices.map((entry) => ({
      date: entry.entryDate,
      description: entry.supplierName || entry.title || "Cash-paid invoice",
      inflow: 0,
      outflow: numberValue(entry.amount),
    })),
    ...cashTransfers.map((entry) => ({
      date: entry.entryDate,
      description: entry.title || "Cash handover / transfer",
      inflow: 0,
      outflow: numberValue(entry.amount),
    })),
  ]
    .sort((a, b) => a.date.localeCompare(b.date))
    .reduce<Array<{ date: string; description: string; inflow: number; outflow: number; balance: number }>>(
      (rows, row) => {
        const previous = rows.length ? rows[rows.length - 1].balance : 0;
        rows.push({ ...row, balance: previous + row.inflow - row.outflow });
        return rows;
      },
      [],
    );

  const exportStatement = () => {
    downloadCsv(`cash-at-cafe-${operations.dateFrom}-${operations.dateTo}.csv`, [
      [t.date, t.description, t.inflow, t.outflow, t.balance],
      ...statementRows.map((row) => [
        row.date,
        row.description,
        row.inflow ? row.inflow.toFixed(3) : "",
        row.outflow ? row.outflow.toFixed(3) : "",
        row.balance.toFixed(3),
      ]),
    ]);
  };

  const buckets = [
    { label: "★5", value: feedback.feedback.filter((x) => Number(x.overallScore) >= 4.5).length, color: "#38bdf8" },
    { label: "★4", value: feedback.feedback.filter((x) => Number(x.overallScore) >= 3.5 && Number(x.overallScore) < 4.5).length, color: "#2563eb" },
    { label: "★3", value: feedback.feedback.filter((x) => Number(x.overallScore) >= 2.5 && Number(x.overallScore) < 3.5).length, color: "#8b5cf6" },
    { label: "★2", value: feedback.feedback.filter((x) => Number(x.overallScore) >= 1.5 && Number(x.overallScore) < 2.5).length, color: "#d946ef" },
    { label: "★1", value: feedback.feedback.filter((x) => Number(x.overallScore) < 1.5).length, color: "#f59e0b" },
  ];
  const totalRatings = buckets.reduce((sum, bucket) => sum + bucket.value, 0);
  let ratingCursor = 0;
  const ratingGradient = totalRatings > 0
    ? `conic-gradient(${buckets.map((bucket) => {
        const start = ratingCursor;
        ratingCursor += (bucket.value / totalRatings) * 100;
        return `${bucket.color} ${start}% ${ratingCursor}%`;
      }).join(", ")})`
    : "conic-gradient(#334155 0 100%)";
  const metrics = [
    { label: t.petty, value: overview?.estimatedPettyCashBalance, icon: WalletCards },
    { label: t.income, value: overview?.closingTotal, icon: CreditCard },
    { label: t.cash, value: cashAtCafe, icon: Banknote },
    { label: t.talabat, value: overview?.talabatIncome, icon: ShoppingBag },
  ];

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-black text-[color:var(--admin-text)]">{t.month}</h2>
            <p className="mt-1 text-sm text-[color:var(--admin-muted)]">{t.from}</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <Card key={m.label} className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[color:var(--admin-muted)]">{m.label}</p>
                  <Icon className="h-5 w-5 text-amber-200" />
                </div>
                <p className="mt-4 text-3xl font-black text-[color:var(--admin-text)]">
                  {money(m.value)} <span className="text-sm">OMR</span>
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      <Card className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-black text-[color:var(--admin-text)]">{t.statement}</h3>
            <p className="mt-1 text-xs text-[color:var(--admin-muted)]">
              {operations.dateFrom} — {operations.dateTo}
            </p>
          </div>
          <Button variant="secondary" onClick={exportStatement} disabled={statementRows.length === 0}>
            <Download className="h-4 w-4" />
            {t.download}
          </Button>
        </div>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-[color:var(--admin-border)]">
          <table className="min-w-[760px] w-full text-sm">
            <thead className="bg-black/10 text-[color:var(--admin-muted)]">
              <tr>
                <th className="px-4 py-3 text-left">{t.date}</th>
                <th className="px-4 py-3 text-left">{t.description}</th>
                <th className="px-4 py-3 text-right">{t.inflow}</th>
                <th className="px-4 py-3 text-right">{t.outflow}</th>
                <th className="px-4 py-3 text-right">{t.balance}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--admin-border)]">
              {statementRows.map((row, index) => (
                <tr key={`${row.date}-${row.description}-${index}`}>
                  <td className="px-4 py-3 text-[color:var(--admin-muted)]">{row.date}</td>
                  <td className="px-4 py-3 font-semibold text-[color:var(--admin-text)]">{row.description}</td>
                  <td className="px-4 py-3 text-right text-emerald-500">{row.inflow ? money(row.inflow) : "—"}</td>
                  <td className="px-4 py-3 text-right text-red-400">{row.outflow ? money(row.outflow) : "—"}</td>
                  <td className="px-4 py-3 text-right font-black text-[color:var(--admin-text)]">{money(row.balance)}</td>
                </tr>
              ))}
              {statementRows.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-[color:var(--admin-muted)]">{t.noData}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-[color:var(--admin-text)]">{t.feedbackTrend}</h3>
            <Badge variant="amber">{Number(feedback.stats.averageScore || 0).toFixed(1)} ★</Badge>
          </div>
          <div className="mt-6 grid items-center gap-6 md:grid-cols-[220px_1fr]">
            <div className="relative mx-auto h-52 w-52 rounded-full p-[18px] shadow-[0_20px_60px_rgba(37,99,235,0.18)]" style={{ background: ratingGradient }}>
              <div className="flex h-full w-full flex-col items-center justify-center rounded-full border border-[color:var(--admin-border)] bg-[color:var(--admin-card)] text-center shadow-[inset_0_0_36px_rgba(37,99,235,0.10)]">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--admin-muted)]">Average</span>
                <span className="mt-1 text-4xl font-black text-[color:var(--admin-text)]">{Number(feedback.stats.averageScore || 0).toFixed(1)}</span>
                <span className="mt-1 text-sm text-amber-300">★★★★★</span>
              </div>
            </div>
            <div className="space-y-3">
              {buckets.map((bucket) => {
                const percent = totalRatings > 0 ? Math.round((bucket.value / totalRatings) * 100) : 0;
                return (
                  <div key={bucket.label} className="grid grid-cols-[14px_44px_1fr_auto] items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: bucket.color }} />
                    <span className="text-sm font-black text-[color:var(--admin-text)]">{bucket.label}</span>
                    <div className="h-2 overflow-hidden rounded-full bg-[color:var(--admin-soft)]">
                      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${percent}%`, backgroundColor: bucket.color }} />
                    </div>
                    <span className="min-w-16 text-right text-sm font-bold text-[color:var(--admin-muted)]">{bucket.value} · {percent}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="text-xl font-black text-[color:var(--admin-text)]">{t.followups}</h3>
          <div className="mt-4 space-y-2">
            {activeFollowups.length === 0 ? (
              <p className="text-sm text-[color:var(--admin-muted)]">{t.noData}</p>
            ) : activeFollowups.map((x) => (
              <div key={x.id} className="rounded-2xl border border-[color:var(--admin-border)] bg-black/10 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-[color:var(--admin-text)]">{x.phone}</span>
                  <Badge variant={x.priority === "urgent" ? "danger" : "warning"}>{x.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-[color:var(--admin-muted)]">{x.complaintReason || "—"}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card className="p-5">
          <h3 className="text-xl font-black text-[color:var(--admin-text)]">{t.latestFeedback}</h3>
          <div className="mt-4 divide-y divide-[color:var(--admin-border)]">
            {feedback.feedback.slice(0, 6).map((x) => (
              <div key={x.id} className="flex items-center gap-3 py-3">
                <MessageSquareText className="h-4 w-4 text-amber-200" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-[color:var(--admin-text)]">{x.phone}</p>
                  <p className="truncate text-xs text-[color:var(--admin-muted)]">{x.summary || x.customerMessage || "—"}</p>
                </div>
                <div className="flex items-center gap-1 font-black text-amber-200"><Star className="h-4 w-4" />{Number(x.overallScore || 0).toFixed(1)}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="text-xl font-black text-[color:var(--admin-text)]">{t.unpaid}</h3>
          <div className="mt-4 divide-y divide-[color:var(--admin-border)]">
            {unpaid.length === 0 ? <p className="text-sm text-[color:var(--admin-muted)]">{t.noData}</p> : unpaid.map((x) => (
              <div key={x.id} className="flex items-center justify-between gap-3 py-3">
                <div><p className="font-bold text-[color:var(--admin-text)]">{x.supplierName || x.title || "Invoice"}</p><p className="text-xs text-[color:var(--admin-muted)]">{x.entryDate}</p></div>
                <span className="font-black text-red-300">{money(x.amount)} OMR</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <Card className="p-5">
        <h3 className="text-xl font-black text-[color:var(--admin-text)]">{t.closings}</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {closings.map((x) => (
            <div key={x.id} className="rounded-2xl border border-[color:var(--admin-border)] bg-black/10 p-4">
              <p className="text-xs text-[color:var(--admin-muted)]">{x.closingDate}</p>
              <p className="mt-2 text-xl font-black text-[color:var(--admin-text)]">{money(x.totalAmount)} OMR</p>
              <p className="mt-2 text-xs text-[color:var(--admin-muted)]">Cash {money(x.cashAmount)} · Card {money(x.cardAmount)} · Talabat {money(x.talabatAmount)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
