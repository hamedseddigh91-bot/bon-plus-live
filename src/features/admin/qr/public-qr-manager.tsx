"use client";

import { useState } from "react";
import { Copy, ExternalLink, Printer, QrCode } from "lucide-react";
import type { BusinessSettingsState } from "@/app/admin/settings/actions";
import { AdminShell } from "@/components/layout/admin-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAdminLanguage } from "@/lib/admin-language";

type PublicQrManagerProps = { initialState: BusinessSettingsState; embedded?: boolean };
function makeQrUrl(link: string) { return `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(link)}`; }

const qrCopy = {
  fa: { eyebrow:"QR و لینک عمومی", title:"QR فیدبک", subtitle:"این QR را برای میزها، رسیدها، کانتر و بسته‌بندی چاپ کنید.", scan:"برای ثبت فیدبک اسکن کنید", unavailable:"QR در دسترس نیست", noLink:"لینک فیدبک وجود ندارد", publicLink:"لینک عمومی فیدبک", copied:"لینک فیدبک کپی شد.", copy:"کپی لینک", print:"چاپ", open:"باز کردن فیدبک", hint:"این QR به صفحه عمومی و فعال فیدبک همین کسب‌وکار متصل است.", failed:"بارگذاری لینک QR ناموفق بود." },
  ar: { eyebrow:"QR والرابط العام", title:"رمز QR للتقييم", subtitle:"اطبع هذا الرمز للطاولات والفواتير والكاونتر والتغليف.", scan:"امسح الرمز لمشاركة تقييمك", unavailable:"QR غير متاح", noLink:"لا يوجد رابط للتقييم", publicLink:"رابط التقييم العام", copied:"تم نسخ رابط التقييم.", copy:"نسخ الرابط", print:"طباعة", open:"فتح التقييم", hint:"يشير هذا الرمز إلى صفحة التقييم العامة والفعالة لهذا النشاط.", failed:"فشل تحميل رابط QR." },
  en: { eyebrow:"QR & Public Links", title:"Feedback QR Code", subtitle:"Print this QR code for tables, receipts, counters, and packaging.", scan:"Scan to share your feedback", unavailable:"QR unavailable", noLink:"No feedback link", publicLink:"Public feedback link", copied:"Feedback link copied.", copy:"Copy link", print:"Print", open:"Open feedback", hint:"This QR points to the live public feedback page configured for this business.", failed:"Failed to load QR link." },
} as const;

export function PublicQrManager({ initialState, embedded = false }: PublicQrManagerProps) {
  const { language } = useAdminLanguage();
  const t = qrCopy[language];
  const settings = initialState.settings;
  const feedbackUrl = settings?.publicFeedbackUrl ?? "";
  const qrUrl = feedbackUrl ? makeQrUrl(feedbackUrl) : "";
  const [message, setMessage] = useState<string | null>(initialState.success ? null : initialState.message ?? t.failed);
  const copyLink = async () => { if (!feedbackUrl) return; await navigator.clipboard.writeText(feedbackUrl); setMessage(t.copied); };

  const content = <div className="space-y-6">
    <section className="rounded-[2rem] border border-[color:var(--admin-border)] bg-[color:var(--admin-card)] p-6">
      <div className="mb-3 flex items-center gap-2 text-amber-300"><QrCode className="h-5 w-5"/><span className="text-sm font-bold uppercase tracking-[0.22em]">{t.eyebrow}</span></div>
      <h1 className="text-3xl font-black tracking-[-0.03em] text-[color:var(--admin-text)]">{t.title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--admin-muted)]">{t.subtitle}</p>
    </section>
    {message&&<div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-200">{message}</div>}
    <div className="grid gap-6 xl:grid-cols-[430px_minmax(0,1fr)]">
      <Card className="p-5"><div className="rounded-[2rem] bg-white p-6 text-center text-black"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.35rem] bg-[#ffd42a] text-lg font-black">BP</div><h2 className="mt-4 text-2xl font-black">{settings?.businessName??"Bon Plus"}</h2><p className="mt-2 text-sm text-black/55">{t.scan}</p>{qrUrl?<img src={qrUrl} alt={t.title} className="mx-auto mt-6 h-72 w-72 rounded-2xl"/>:<div className="mx-auto mt-6 flex h-72 w-72 items-center justify-center rounded-2xl bg-black/5 text-sm text-black/50">{t.unavailable}</div>}<p className="mt-5 break-all text-xs text-black/45">{feedbackUrl||t.noLink}</p></div></Card>
      <Card className="p-5"><h2 className="text-xl font-black text-[color:var(--admin-text)]">{t.publicLink}</h2><div className="mt-4 rounded-3xl border border-[color:var(--admin-border)] bg-[color:var(--admin-soft)] p-4"><p className="text-xs text-[color:var(--admin-muted)]">URL</p><p className="mt-2 break-all text-sm font-bold text-[color:var(--admin-text)]">{feedbackUrl||"—"}</p></div><div className="mt-5 flex flex-wrap gap-2"><Button onClick={copyLink} disabled={!feedbackUrl}><Copy className="h-4 w-4"/>{t.copy}</Button><Button variant="secondary" onClick={()=>window.print()} disabled={!feedbackUrl}><Printer className="h-4 w-4"/>{t.print}</Button>{feedbackUrl&&<a href={feedbackUrl} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-soft)] px-4 text-sm font-bold text-[color:var(--admin-text)]"><ExternalLink className="h-4 w-4"/>{t.open}</a>}</div><div className="mt-6 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-200">{t.hint}</div></Card>
    </div>
  </div>;
  if (embedded) return content;
  return <AdminShell>{content}</AdminShell>;
}
