"use client";

import { useState, useTransition } from "react";
import { RefreshCw, Save, Star } from "lucide-react";
import { runGoogleReviewSync, saveExternalReviewIntegration, type ExternalReviewIntegration } from "@/app/admin/settings/external-reviews/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAdminLanguage } from "@/lib/admin-language";

const copy = {
  fa: { title:"ریویوهای خارجی", desc:"ریویوهای Google مستقیماً Sync می‌شوند. Talabat از Webhook امن دریافت می‌شود و وارد همان جریان Feedback می‌شود.", enabled:"فعال", account:"Google Account ID", location:"Google Location ID", slug:"Business slug", save:"ذخیره", sync:"Sync الان", last:"آخرین Sync", error:"آخرین خطا", google:"Google Reviews", talabat:"Talabat Reviews", talabatHint:"برای Talabat، سرویس واسط/Partner باید Reviewها را به Webhook سیستم ارسال کند." },
  ar: { title:"المراجعات الخارجية", desc:"تتم مزامنة مراجعات Google مباشرة، وتصل مراجعات Talabat عبر Webhook آمن إلى نفس مسار الآراء.", enabled:"مفعل", account:"Google Account ID", location:"Google Location ID", slug:"Business slug", save:"حفظ", sync:"مزامنة الآن", last:"آخر مزامنة", error:"آخر خطأ", google:"مراجعات Google", talabat:"مراجعات Talabat", talabatHint:"يجب على خدمة الشريك/الوسيط إرسال مراجعات Talabat إلى Webhook النظام." },
  en: { title:"External Reviews", desc:"Google reviews sync directly. Talabat reviews can be pushed through the secure webhook into the same Feedback workflow.", enabled:"Enabled", account:"Google Account ID", location:"Google Location ID", slug:"Business slug", save:"Save", sync:"Sync now", last:"Last sync", error:"Last error", google:"Google Reviews", talabat:"Talabat Reviews", talabatHint:"A Talabat partner/bridge service must post review events to the system webhook." },
};

export function ExternalReviewsManager({ initialState }: { initialState: { success:boolean; message?:string; rows:ExternalReviewIntegration[] } }) {
  const { language } = useAdminLanguage();
  const t = copy[language];
  const [rows, setRows] = useState(initialState.rows);
  const [message, setMessage] = useState(initialState.message || "");
  const [pending, start] = useTransition();
  const input = "w-full rounded-xl border border-[color:var(--admin-border)] bg-[color:var(--admin-soft)] px-4 py-3 text-sm text-[color:var(--admin-text)] outline-none";
  const update = (provider: ExternalReviewIntegration['provider'], patch: Partial<ExternalReviewIntegration>) => setRows(r=>r.map(x=>x.provider===provider?{...x,...patch}:x));
  const save = (row: ExternalReviewIntegration) => start(async()=>{ const r=await saveExternalReviewIntegration(row); setMessage(r.message || ""); });
  const sync = () => start(async()=>{ const r=await runGoogleReviewSync(); setMessage(r.message || ""); if(r.success) window.location.reload(); });

  return <div className="space-y-5">
    <Card className="p-6"><div className="flex items-center gap-3"><Star className="h-6 w-6"/><div><h1 className="text-2xl font-black text-[color:var(--admin-text)]">{t.title}</h1><p className="mt-1 text-sm text-[color:var(--admin-muted)]">{t.desc}</p></div></div></Card>
    {rows.map(row=><Card key={row.provider} className="p-6"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-black text-[color:var(--admin-text)]">{row.provider==='google'?t.google:t.talabat}</h2><label className="flex items-center gap-2 text-sm text-[color:var(--admin-muted)]"><input type="checkbox" checked={row.isEnabled} onChange={e=>update(row.provider,{isEnabled:e.target.checked})}/>{t.enabled}</label></div>
      {row.provider==='google'?<div className="mt-4 grid gap-4 md:grid-cols-2"><input className={input} placeholder={t.account} value={row.accountId} onChange={e=>update(row.provider,{accountId:e.target.value})}/><input className={input} placeholder={t.location} value={row.locationId} onChange={e=>update(row.provider,{locationId:e.target.value})}/></div>:<div className="mt-4"><input className={input} placeholder={t.slug} value={row.businessSlug} onChange={e=>update(row.provider,{businessSlug:e.target.value})}/><p className="mt-3 text-sm text-[color:var(--admin-muted)]">{t.talabatHint}</p></div>}
      <div className="mt-4 flex flex-wrap items-center gap-2"><Button onClick={()=>save(row)} disabled={pending}><Save className="h-4 w-4"/>{t.save}</Button>{row.provider==='google'&&<Button variant="secondary" onClick={sync} disabled={pending||!row.isEnabled}><RefreshCw className="h-4 w-4"/>{t.sync}</Button>}{row.lastSyncedAt&&<span className="text-xs text-[color:var(--admin-muted)]">{t.last}: {new Date(row.lastSyncedAt).toLocaleString()}</span>}</div>
      {row.lastError&&<p className="mt-3 text-sm text-red-300">{t.error}: {row.lastError}</p>}
    </Card>)}
    {message&&<Card className="p-4 text-sm text-[color:var(--admin-muted)]">{message}</Card>}
  </div>;
}
