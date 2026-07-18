"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Coffee, Gift, MessageCircle, PlusCircle, Search, CheckCircle2 } from "lucide-react";
import type { LoyaltyCounterRow, LoyaltyCounterState } from "@/app/admin/crm/loyalty/actions";
import { redeemLoyaltyReward, recordLoyaltyPurchase } from "@/app/admin/crm/loyalty/actions";
import { getWhatsAppTemplateText } from "@/app/admin/settings/whatsapp-messages/actions";
import { useWhatsAppLanguagePicker } from "@/components/ui/whatsapp-language-picker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAdminLanguage } from "@/lib/admin-language";

function rewardText(row: Pick<LoyaltyCounterRow, "rewardLabel" | "rewardType" | "rewardValue">) {
  return row.rewardLabel || `${row.rewardValue} ${row.rewardType}`;
}

function ruleDisplayName(rule: { categoryKey: string; name: string }, language: "fa" | "ar" | "en") {
  if (rule.categoryKey === "coffee") return language === "fa" ? "قهوه" : language === "ar" ? "قهوة" : "Coffee";
  if (rule.categoryKey === "food") return language === "fa" ? "غذا" : language === "ar" ? "طعام" : "Food";
  return rule.name;
}

function fillTemplate(template: string, row: LoyaltyCounterRow) {
  const remaining = Math.max(row.thresholdCount - row.currentCount, 0);
  return template
    .replaceAll("{phone}", row.phone)
    .replaceAll("{customer_name}", row.phone)
    .replaceAll("{count}", String(row.currentCount))
    .replaceAll("{current_count}", String(row.currentCount))
    .replaceAll("{threshold}", String(row.thresholdCount))
    .replaceAll("{target_count}", String(row.thresholdCount))
    .replaceAll("{remaining}", String(remaining))
    .replaceAll("{remaining_count}", String(remaining))
    .replaceAll("{rule}", row.ruleName)
    .replaceAll("{reward}", rewardText(row))
    .replaceAll("{reward_value}", String(row.rewardValue))
    .replaceAll("{reward_type}", row.rewardType);
}

export function LoyaltyCounter({ initialState }: { initialState: LoyaltyCounterState }) {
  const { language } = useAdminLanguage();
  const searchParams = useSearchParams();
  const focusId = searchParams.get("focus");
  const [phone, setPhone] = useState("");
  const [ruleId, setRuleId] = useState(initialState.rules[0]?.id ?? "");
  const [result, setResult] = useState<any>(null);
  const [message, setMessage] = useState(initialState.message ?? null);
  const [search, setSearch] = useState("");
  const [pending, start] = useTransition();

  const copy = language === "fa" ? {
    title:"ثبت مصرف وفاداری", subtitle:"مصرف مشتری را ثبت کن و پیشرفت او را تا پاداش ببین.", phone:"شماره تلفن", rule:"نوع شمارش", record:"ثبت مصرف", customers:"مشتریان در حال شمارش", search:"جست‌وجوی شماره یا برنامه وفاداری", whatsapp:"واتس‌اپ", progress:"پیشرفت", remaining:"باقی‌مانده تا پاداش", total:"کل ثبت‌ها", empty:"مشتری در حال شمارشی پیدا نشد.", rewardReady:"جایزه آماده", useReward:"ثبت استفاده جایزه"
  } : language === "ar" ? {
    title:"تسجيل استهلاك الولاء", subtitle:"سجل استهلاك العميل وتابع تقدمه نحو المكافأة.", phone:"رقم الهاتف", rule:"نوع العداد", record:"تسجيل", customers:"العملاء قيد العد", search:"ابحث بالرقم أو برنامج الولاء", whatsapp:"واتساب", progress:"التقدم", remaining:"المتبقي للمكافأة", total:"إجمالي التسجيلات", empty:"لا يوجد عملاء مطابقون.", rewardReady:"مكافأة جاهزة", useReward:"تسجيل استخدام المكافأة"
  } : {
    title:"Record loyalty purchase", subtitle:"Record a customer purchase and track progress toward the reward.", phone:"Phone number", rule:"Counter rule", record:"Record purchase", customers:"Customers being counted", search:"Search phone or loyalty program", whatsapp:"WhatsApp", progress:"Progress", remaining:"Remaining to reward", total:"Total records", empty:"No matching loyalty customers.", rewardReady:"Reward ready", useReward:"Mark reward used"
  };

  useEffect(() => {
    if (!focusId || !initialState.counters.some((row) => row.id === focusId)) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(`loyalty-${focusId}`)?.scrollIntoView({ block: "center", behavior: "auto" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusId, initialState.counters]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? initialState.counters.filter((row) => row.phone.toLowerCase().includes(q) || row.ruleName.toLowerCase().includes(q)) : initialState.counters;
  }, [initialState.counters, search]);

  const submit = () => start(async () => {
    const r = await recordLoyaltyPurchase({ phone, ruleId });
    setResult(r);
    setMessage(r.message ?? null);
  });

  const { pickLanguage, picker: languagePicker } = useWhatsAppLanguagePicker();

  const openWhatsApp = async (row: LoyaltyCounterRow) => {
    const picked = await pickLanguage();
    if (!picked) return;
    const key = row.pendingRewards > 0 ? "loyalty_reward" : "loyalty_progress";
    const saved = await getWhatsAppTemplateText(key, picked);
    const remaining = Math.max(row.thresholdCount - row.currentCount, 0);
    const fallback = row.pendingRewards > 0
      ? `Congratulations! Your reward ${rewardText(row)} is ready.`
      : `You are at ${row.currentCount}/${row.thresholdCount}. Only ${remaining} more to unlock ${rewardText(row)}.`;
    const text = fillTemplate(saved || fallback, row);
    window.open(`https://wa.me/${row.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  const sendResult = async () => {
    if (!result?.rule) return;
    const row: LoyaltyCounterRow = {
      id:"result", phone, ruleId, ruleName:result.rule.name,
      currentCount:result.count ?? 0, totalCount:result.totalCount ?? 0,
      pendingRewards:result.pendingRewards ?? 0, lastPurchaseAt:null,
      thresholdCount:result.threshold ?? 0, rewardType:result.rule.rewardType,
      rewardValue:result.rule.rewardValue, rewardLabel:result.rule.rewardLabel ?? "",
      messageEn:"", messageAr:"", messageFa:"",
    };
    await openWhatsApp(row);
  };

  const redeemReward = (counterId: string) => start(async () => {
    const r = await redeemLoyaltyReward(counterId);
    setMessage(r.message ?? null);
    if (r.success) window.location.reload();
  });

  return <div className="space-y-5">
    <Card className="p-5">
      <h2 className="text-xl font-black text-[color:var(--admin-text)]">{copy.title}</h2>
      <p className="mt-1 text-sm text-[color:var(--admin-muted)]">{copy.subtitle}</p>
      {message && <p className="mt-3 text-sm text-amber-200">{message}</p>}
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <div className="flex overflow-hidden rounded-2xl border border-[color:var(--admin-border)] bg-black/10"><span className="flex items-center border-e border-[color:var(--admin-border)] px-3 text-sm font-black text-amber-300" dir="ltr">+968</span><input value={phone} onChange={e=>setPhone(e.target.value.replace(/\D+/g, "").slice(0,8))} placeholder="91234567" inputMode="numeric" maxLength={8} dir="ltr" className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-[color:var(--admin-text)] outline-none"/></div>
        <select value={ruleId} onChange={e=>setRuleId(e.target.value)} className="rounded-2xl border border-[color:var(--admin-border)] bg-black/10 px-4 py-3 text-sm text-[color:var(--admin-text)] outline-none"><option value="">{copy.rule}</option>{initialState.rules.map(r=><option key={r.id} value={r.id}>{ruleDisplayName(r, language)} · {r.thresholdCount}</option>)}</select>
        <Button onClick={submit} disabled={pending||phone.length!==8||!ruleId}><PlusCircle className="h-4 w-4"/>{copy.record}</Button>
      </div>
      {result?.success && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4"><div><p className="font-black text-[color:var(--admin-text)]">{result.rule.name}</p><p className="text-sm text-[color:var(--admin-muted)]">{result.count} / {result.threshold}{result.rewardReached?` · ${copy.rewardReady}`:""}</p></div><Button onClick={sendResult}><MessageCircle className="h-4 w-4"/>{copy.whatsapp}</Button></div>}
    </Card>

    <Card className="p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h3 className="text-lg font-black text-[color:var(--admin-text)]">{copy.customers}</h3><div className="flex items-center gap-2 rounded-2xl border border-[color:var(--admin-border)] bg-black/10 px-4 py-2.5"><Search className="h-4 w-4 text-[color:var(--admin-muted)]"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={copy.search} className="min-w-0 bg-transparent text-sm text-[color:var(--admin-text)] outline-none"/></div></div>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map(row=>{const remaining=Math.max(row.thresholdCount-row.currentCount,0);const progress=row.thresholdCount>0?Math.min(row.currentCount/row.thresholdCount*100,100):0;return <div id={`loyalty-${row.id}`} key={row.id} className={`scroll-mt-32 rounded-3xl border border-[color:var(--admin-border)] bg-black/10 p-4 ${focusId === row.id ? "ring-2 ring-amber-300/45" : ""}`}>
          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-lg font-black text-[color:var(--admin-text)]">{row.phone}</p><div className="mt-1 flex items-center gap-2 text-sm text-[color:var(--admin-muted)]"><Coffee className="h-4 w-4"/><span className="truncate">{row.ruleName}</span></div></div><div className="rounded-2xl border border-amber-200/20 bg-amber-200/10 px-3 py-2 text-center"><p className="text-xl font-black text-amber-200">{row.currentCount}/{row.thresholdCount}</p><p className="text-[10px] text-[color:var(--admin-muted)]">{copy.progress}</p></div></div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/20"><div className="h-full rounded-full bg-amber-200" style={{width:`${progress}%`}}/></div>
          {row.pendingRewards>0&&<div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-3"><p className="font-black text-emerald-200">{copy.rewardReady}: {row.pendingRewards}</p><p className="mt-1 text-xs text-[color:var(--admin-muted)]">{rewardText(row)}</p></div>}
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm"><div className="rounded-2xl border border-[color:var(--admin-border)] p-3"><p className="text-xs text-[color:var(--admin-muted)]">{copy.remaining}</p><p className="mt-1 text-lg font-black text-[color:var(--admin-text)]">{remaining}</p></div><div className="rounded-2xl border border-[color:var(--admin-border)] p-3"><p className="text-xs text-[color:var(--admin-muted)]">{copy.total}</p><p className="mt-1 text-lg font-black text-[color:var(--admin-text)]">{row.totalCount}</p></div></div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2"><Button onClick={()=>openWhatsApp(row)}><MessageCircle className="h-4 w-4"/>{copy.whatsapp}</Button>{row.pendingRewards>0&&<Button variant="secondary" onClick={()=>redeemReward(row.id)} disabled={pending}><CheckCircle2 className="h-4 w-4"/>{copy.useReward}</Button>}</div>
        </div>})}
        {filtered.length===0&&<div className="col-span-full rounded-3xl border border-dashed border-[color:var(--admin-border)] p-8 text-center text-sm text-[color:var(--admin-muted)]"><Gift className="mx-auto mb-3 h-6 w-6"/>{copy.empty}</div>}
      </div>
    </Card>
    {languagePicker}
  </div>;
}

