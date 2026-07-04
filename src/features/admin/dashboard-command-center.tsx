"use client";

import { Banknote, CreditCard, MessageSquareText, ShoppingBag, Star, WalletCards } from "lucide-react";
import type { FeedbackInboxState } from "@/app/admin/feedback/actions";
import type { RecoveryBoardState } from "@/app/admin/recovery/actions";
import type { OperationsPageState } from "@/app/admin/operations/actions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAdminLanguage } from "@/lib/admin-language";

function money(value: number | string | null | undefined) {
  return new Intl.NumberFormat("en-OM", { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(Number(value ?? 0));
}

export function DashboardCommandCenter({ feedback, recovery, operations }: { feedback: FeedbackInboxState; recovery: RecoveryBoardState; operations: OperationsPageState }) {
  const { language } = useAdminLanguage();
  const t = language === "fa" ? {
    month: "گزارش این ماه", feedbackTrend: "فیدبک و امتیازها", latestFeedback: "آخرین فیدبک‌ها", followups: "آخرین پیگیری‌های فعال", closings: "آخرین ترازهای صندوق", unpaid: "فاکتورهای پرداخت‌نشده", petty: "موجودی تنخواه", income: "درآمد این ماه", cash: "نقد نزد کافه", talabat: "درآمد طلبات", noData: "داده‌ای وجود ندارد", from: "از اول ماه تا امروز"
  } : language === "ar" ? {
    month: "تقرير هذا الشهر", feedbackTrend: "الآراء والتقييمات", latestFeedback: "أحدث الآراء", followups: "أحدث المتابعات النشطة", closings: "أحدث إغلاقات الصندوق", unpaid: "الفواتير غير المدفوعة", petty: "رصيد العهدة", income: "دخل هذا الشهر", cash: "النقد في المقهى", talabat: "دخل طلبات", noData: "لا توجد بيانات", from: "من أول الشهر حتى اليوم"
  } : {
    month: "This month report", feedbackTrend: "Feedback & ratings", latestFeedback: "Latest feedback", followups: "Latest active follow-ups", closings: "Recent cash closings", unpaid: "Unpaid invoices", petty: "Petty cash balance", income: "Income this month", cash: "Cash at café", talabat: "Talabat income", noData: "No data", from: "From the 1st of the month to today"
  };
  const overview = operations.overview;
  const activeFollowups = recovery.cases.filter((item) => item.status === "open" || item.status === "in_progress").slice(0, 5);
  const unpaid = operations.entries.filter((entry) => (entry.entryType === "expense" || entry.entryType === "cash_drawer_expense") && entry.paymentStatus !== "paid").slice(0, 6);
  const closings = operations.closings.slice(0, 5);
  const buckets = [
    { label: "1★", value: feedback.feedback.filter((x) => Number(x.overallScore) < 1.5).length },
    { label: "2★", value: feedback.feedback.filter((x) => Number(x.overallScore) >= 1.5 && Number(x.overallScore) < 2.5).length },
    { label: "3★", value: feedback.feedback.filter((x) => Number(x.overallScore) >= 2.5 && Number(x.overallScore) < 3.5).length },
    { label: "4★", value: feedback.feedback.filter((x) => Number(x.overallScore) >= 3.5 && Number(x.overallScore) < 4.5).length },
    { label: "5★", value: feedback.feedback.filter((x) => Number(x.overallScore) >= 4.5).length },
  ];
  const maxBucket = Math.max(1, ...buckets.map((b) => b.value));
  const metrics = [
    { label: t.petty, value: overview?.estimatedPettyCashBalance, icon: WalletCards },
    { label: t.income, value: overview?.closingTotal, icon: CreditCard },
    { label: t.cash, value: overview?.cashIncome, icon: Banknote },
    { label: t.talabat, value: overview?.talabatIncome, icon: ShoppingBag },
  ];
  return <div className="space-y-6">
    <section>
      <div className="mb-3 flex items-end justify-between gap-4"><div><h2 className="text-2xl font-black text-[color:var(--admin-text)]">{t.month}</h2><p className="mt-1 text-sm text-[color:var(--admin-muted)]">{t.from}</p></div></div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{metrics.map((m) => { const Icon=m.icon; return <Card key={m.label} className="p-5"><div className="flex items-center justify-between"><p className="text-sm text-[color:var(--admin-muted)]">{m.label}</p><Icon className="h-5 w-5 text-amber-200" /></div><p className="mt-4 text-3xl font-black text-[color:var(--admin-text)]">{money(m.value)} <span className="text-sm">OMR</span></p></Card>; })}</div>
    </section>
    <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="p-5"><div className="flex items-center justify-between"><h3 className="text-xl font-black text-[color:var(--admin-text)]">{t.feedbackTrend}</h3><Badge variant="amber">{Number(feedback.stats.averageScore||0).toFixed(1)} ★</Badge></div><div className="mt-6 flex h-56 items-end gap-3">{buckets.map((b)=><div key={b.label} className="flex flex-1 flex-col items-center gap-2"><span className="text-sm font-black text-[color:var(--admin-text)]">{b.value}</span><div className="w-full rounded-t-2xl bg-amber-200/80" style={{height:`${Math.max(12,(b.value/maxBucket)*150)}px`}}/><span className="text-xs text-[color:var(--admin-muted)]">{b.label}</span></div>)}</div></Card>
      <Card className="p-5"><h3 className="text-xl font-black text-[color:var(--admin-text)]">{t.followups}</h3><div className="mt-4 space-y-2">{activeFollowups.length===0?<p className="text-sm text-[color:var(--admin-muted)]">{t.noData}</p>:activeFollowups.map((x)=><div key={x.id} className="rounded-2xl border border-[color:var(--admin-border)] bg-black/10 p-3"><div className="flex items-center justify-between gap-3"><span className="font-bold text-[color:var(--admin-text)]">{x.phone}</span><Badge variant={x.priority==="urgent"?"danger":"warning"}>{x.status}</Badge></div><p className="mt-1 text-xs text-[color:var(--admin-muted)]">{x.complaintReason||"—"}</p></div>)}</div></Card>
    </section>
    <section className="grid gap-5 xl:grid-cols-2">
      <Card className="p-5"><h3 className="text-xl font-black text-[color:var(--admin-text)]">{t.latestFeedback}</h3><div className="mt-4 divide-y divide-[color:var(--admin-border)]">{feedback.feedback.slice(0,6).map((x)=><div key={x.id} className="flex items-center gap-3 py-3"><MessageSquareText className="h-4 w-4 text-amber-200"/><div className="min-w-0 flex-1"><p className="truncate font-bold text-[color:var(--admin-text)]">{x.phone}</p><p className="truncate text-xs text-[color:var(--admin-muted)]">{x.summary||x.customerMessage||"—"}</p></div><div className="flex items-center gap-1 font-black text-amber-200"><Star className="h-4 w-4"/>{Number(x.overallScore||0).toFixed(1)}</div></div>)}</div></Card>
      <Card className="p-5"><h3 className="text-xl font-black text-[color:var(--admin-text)]">{t.unpaid}</h3><div className="mt-4 divide-y divide-[color:var(--admin-border)]">{unpaid.length===0?<p className="text-sm text-[color:var(--admin-muted)]">{t.noData}</p>:unpaid.map((x)=><div key={x.id} className="flex items-center justify-between gap-3 py-3"><div><p className="font-bold text-[color:var(--admin-text)]">{x.supplierName||x.title}</p><p className="text-xs text-[color:var(--admin-muted)]">{x.entryDate}</p></div><span className="font-black text-red-200">{money(x.amount)} OMR</span></div>)}</div></Card>
    </section>
    <Card className="p-5"><h3 className="text-xl font-black text-[color:var(--admin-text)]">{t.closings}</h3><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">{closings.map((x)=><div key={x.id} className="rounded-2xl border border-[color:var(--admin-border)] bg-black/10 p-4"><p className="text-xs text-[color:var(--admin-muted)]">{x.closingDate}</p><p className="mt-2 text-xl font-black text-[color:var(--admin-text)]">{money(x.totalAmount)} OMR</p><p className="mt-2 text-xs text-[color:var(--admin-muted)]">Cash {money(x.cashAmount)} · Card {money(x.cardAmount)} · Talabat {money(x.talabatAmount)}</p></div>)}</div></Card>
  </div>;
}
