"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Copy, RefreshCw, Search, X } from "lucide-react";
import { type ActivityLogRow, type ActivityLogsState, getActivityLogs } from "@/app/admin/activity-logs/actions";
import { Button } from "@/components/ui/button";
import { useAdminLanguage } from "@/lib/admin-language";

type ActivityLogViewerProps = { initialState: ActivityLogsState; initialDate: string };
const PAGE_SIZE = 25;

const copy = {
  fa: {
    title: "لاگ فعالیت‌ها", subtitle: "فعالیت‌های امروز به‌صورت پیش‌فرض نمایش داده می‌شوند. برای بررسی بازه دیگر از فیلترها استفاده کنید.",
    search: "جستجو", searchPlaceholder: "اقدام، موجودیت یا شناسه", from: "از تاریخ", to: "تا تاریخ", module: "ماژول",
    today: "امروز", apply: "اعمال", results: "نتیجه", page: "صفحه", of: "از", time: "زمان", activity: "فعالیت", summary: "خلاصه",
    empty: "هیچ لاگ فعالیتی پیدا نشد.", previous: "صفحه قبل", next: "صفحه بعد", details: "جزئیات لاگ فعالیت",
    entityType: "نوع موجودیت", entityId: "شناسه موجودیت", readableSummary: "خلاصه قابل‌خواندن", metadata: "متادیتای فنی",
    metadataHint: "داده JSON کامل برای بررسی فنی.", copy: "کپی", copied: "کپی شد", loadFailed: "بارگذاری لاگ‌ها ناموفق بود.",
    all: "همه ماژول‌ها", finance: "مالی", feedback: "فیدبک و پیگیری", loyalty: "وفاداری", recipes: "رسپی و قیمت تمام‌شده", users: "کاربران و دسترسی‌ها", settings: "تنظیمات", system: "سیستم و ورود",
  },
  ar: {
    title: "سجل النشاط", subtitle: "يتم عرض نشاط اليوم افتراضياً. استخدم عوامل التصفية لمراجعة فترة أخرى.",
    search: "بحث", searchPlaceholder: "الإجراء أو الكيان أو المعرّف", from: "من", to: "إلى", module: "الوحدة",
    today: "اليوم", apply: "تطبيق", results: "نتيجة", page: "الصفحة", of: "من", time: "الوقت", activity: "النشاط", summary: "الملخص",
    empty: "لم يتم العثور على سجل نشاط.", previous: "الصفحة السابقة", next: "الصفحة التالية", details: "تفاصيل سجل النشاط",
    entityType: "نوع الكيان", entityId: "معرّف الكيان", readableSummary: "ملخص مقروء", metadata: "البيانات الفنية",
    metadataHint: "حمولة JSON كاملة للمراجعة الفنية.", copy: "نسخ", copied: "تم النسخ", loadFailed: "فشل تحميل سجل النشاط.",
    all: "كل الوحدات", finance: "المالية", feedback: "الآراء والمتابعة", loyalty: "الولاء", recipes: "الوصفات والتكلفة", users: "المستخدمون والصلاحيات", settings: "الإعدادات", system: "النظام وتسجيل الدخول",
  },
  en: {
    title: "Activity Logs", subtitle: "Today's activity is shown by default. Use the filters to review another period.",
    search: "Search", searchPlaceholder: "Action, entity or ID", from: "From", to: "To", module: "Module",
    today: "Today", apply: "Apply", results: "results", page: "Page", of: "of", time: "Time", activity: "Activity", summary: "Summary",
    empty: "No activity log found.", previous: "Previous page", next: "Next page", details: "Activity Log Details",
    entityType: "Entity Type", entityId: "Entity ID", readableSummary: "Readable Summary", metadata: "Technical Metadata",
    metadataHint: "Detailed JSON payload for technical review.", copy: "Copy", copied: "Copied", loadFailed: "Failed to load activity logs.",
    all: "All modules", finance: "Finance", feedback: "Feedback & Recovery", loyalty: "Loyalty", recipes: "Recipes & Costing", users: "Users & Permissions", settings: "Settings", system: "System & Auth",
  },
} as const;

const actionLabels = {
  en: { feedback_recovery_started:"Recovery follow-up started", discount_code_redeemed:"Discount code redeemed", rewards_updated:"Reward rules updated", feedback_submitted:"Customer feedback submitted", question_created:"Question created", question_updated:"Question updated", question_toggled:"Question status changed", questions_reordered:"Questions reordered", user_created:"User created", user_updated:"User updated", user_deleted:"User deleted", permission_updated:"Permissions updated", invoice_created:"Invoice created", invoice_updated:"Invoice updated", invoice_paid:"Invoice marked as paid", feedback_archived:"Feedback question archived", feedback_deleted:"Feedback question deleted" },
  fa: { feedback_recovery_started:"پیگیری نارضایتی شروع شد", discount_code_redeemed:"کد تخفیف استفاده شد", rewards_updated:"قوانین پاداش به‌روزرسانی شد", feedback_submitted:"فیدبک مشتری ثبت شد", question_created:"سؤال ایجاد شد", question_updated:"سؤال ویرایش شد", question_toggled:"وضعیت سؤال تغییر کرد", questions_reordered:"ترتیب سؤال‌ها تغییر کرد", user_created:"کاربر ایجاد شد", user_updated:"کاربر ویرایش شد", user_deleted:"کاربر حذف شد", permission_updated:"دسترسی‌ها به‌روزرسانی شد", invoice_created:"فاکتور ایجاد شد", invoice_updated:"فاکتور ویرایش شد", invoice_paid:"فاکتور پرداخت‌شده شد", feedback_archived:"سؤال فیدبک آرشیو شد", feedback_deleted:"سؤال فیدبک حذف شد" },
  ar: { feedback_recovery_started:"بدأت متابعة الاستياء", discount_code_redeemed:"تم استخدام كود الخصم", rewards_updated:"تم تحديث قواعد المكافآت", feedback_submitted:"تم إرسال تقييم العميل", question_created:"تم إنشاء السؤال", question_updated:"تم تعديل السؤال", question_toggled:"تم تغيير حالة السؤال", questions_reordered:"تم تغيير ترتيب الأسئلة", user_created:"تم إنشاء المستخدم", user_updated:"تم تعديل المستخدم", user_deleted:"تم حذف المستخدم", permission_updated:"تم تحديث الصلاحيات", invoice_created:"تم إنشاء الفاتورة", invoice_updated:"تم تعديل الفاتورة", invoice_paid:"تم تعليم الفاتورة كمدفوعة", feedback_archived:"تمت أرشفة سؤال التقييم", feedback_deleted:"تم حذف سؤال التقييم" },
} as const;

const entityLabels = {
  en: { feedback_question:"Feedback Question", feedback_submission:"Feedback Submission", feedback_response_rule:"Feedback Response Rule", discount_code:"Discount Code", loyalty_rule:"Loyalty Rule", app_user:"User", business_user_permission:"User Permission", invoice:"Invoice", supplier:"Supplier", cash_closing:"Cash Closing" },
  fa: { feedback_question:"سؤال فیدبک", feedback_submission:"فیدبک ثبت‌شده", feedback_response_rule:"قانون پاسخ فیدبک", discount_code:"کد تخفیف", loyalty_rule:"قانون وفاداری", app_user:"کاربر", business_user_permission:"دسترسی کاربر", invoice:"فاکتور", supplier:"تأمین‌کننده", cash_closing:"بستن صندوق" },
  ar: { feedback_question:"سؤال التقييم", feedback_submission:"تقييم العميل", feedback_response_rule:"قاعدة الرد", discount_code:"كود الخصم", loyalty_rule:"قاعدة الولاء", app_user:"مستخدم", business_user_permission:"صلاحية المستخدم", invoice:"فاتورة", supplier:"مورد", cash_closing:"إغلاق الصندوق" },
} as const;

function titleCase(value: string | null | undefined) { if (!value) return "—"; return value.replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase()); }
function paginationItems(currentPage:number,pageCount:number){ if(pageCount<=7)return Array.from({length:pageCount},(_,i)=>i+1); const pages=new Set([1,pageCount,currentPage-1,currentPage,currentPage+1]); return [...pages].filter(p=>p>=1&&p<=pageCount).sort((a,b)=>a-b); }
function copyJson(value:unknown){ return navigator.clipboard.writeText(JSON.stringify(value??{},null,2)); }

export function ActivityLogViewer({ initialState, initialDate }: ActivityLogViewerProps) {
  const { language, dir } = useAdminLanguage();
  const t = copy[language];
  const locale = language === "fa" ? "fa-IR" : language === "ar" ? "ar-OM" : "en-GB";
  const moduleOptions = [
    {value:"all",label:t.all},{value:"finance",label:t.finance},{value:"feedback",label:t.feedback},{value:"loyalty",label:t.loyalty},
    {value:"recipes",label:t.recipes},{value:"users",label:t.users},{value:"settings",label:t.settings},{value:"system",label:t.system},
  ];
  const humanizeAction=(action:string)=> (actionLabels[language] as Record<string,string>)[action] ?? titleCase(action);
  const humanizeEntity=(value:string|null|undefined)=> !value?"—":(entityLabels[language] as Record<string,string>)[value] ?? titleCase(value);
  const formatDate=(value:string|null|undefined)=>value?new Date(value).toLocaleString(locale):"—";
  const formatShortDate=(value:string|null|undefined)=>value?new Date(value).toLocaleString(locale,{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}):"—";
  const readableSummary=(log:ActivityLogRow)=>{
    const m=log.metadata??{}; const a=humanizeAction(log.action);
    if(typeof m.summary==="string"&&m.summary.trim())return m.summary.trim();
    if(typeof m.label==="string"&&m.label.trim())return `${a}: ${m.label.trim()}`;
    if(typeof m.name==="string"&&m.name.trim())return `${a}: ${m.name.trim()}`;
    if(typeof m.question==="string"&&m.question.trim())return `${a}: ${m.question.trim()}`;
    if(typeof m.phone==="string"&&m.phone.trim())return `${a}: ${m.phone.trim()}${m.score!=null?` · ${String(m.score)}/5`:""}`;
    if(typeof m.code==="string"&&m.code.trim())return `${a}: ${m.code.trim()}`;
    return `${a} · ${humanizeEntity(log.entityType)}`;
  };

  const [state,setState]=useState(initialState); const [search,setSearch]=useState(""); const [dateFrom,setDateFrom]=useState(initialDate); const [dateTo,setDateTo]=useState(initialDate); const [module,setModule]=useState("all"); const [selectedLog,setSelectedLog]=useState<ActivityLogRow|null>(null); const [message,setMessage]=useState<string|null>(initialState.success?null:initialState.message??t.loadFailed); const [isPending,startTransition]=useTransition(); const [copied,setCopied]=useState(false);
  const activeLog=useMemo(()=>selectedLog?(state.logs.find(l=>l.id===selectedLog.id)??selectedLog):null,[selectedLog,state.logs]);
  const currentPage=Math.floor(state.pagination.offset/state.pagination.limit)+1; const pageCount=Math.max(1,Math.ceil(state.pagination.filteredTotal/state.pagination.limit)); const pages=paginationItems(currentPage,pageCount);
  useEffect(()=>{ if(!activeLog)return; const prev=document.body.style.overflow; document.body.style.overflow="hidden"; const key=(e:KeyboardEvent)=>{if(e.key==="Escape")setSelectedLog(null)}; window.addEventListener("keydown",key); return()=>{document.body.style.overflow=prev;window.removeEventListener("keydown",key)};},[activeLog]);
  const load=(offset=0)=>startTransition(async()=>{const r=await getActivityLogs({search,dateFrom,dateTo,module,limit:PAGE_SIZE,offset});setState(r);setMessage(r.success?null:r.message??t.loadFailed);setSelectedLog(null)});
  const showToday=()=>{setDateFrom(initialDate);setDateTo(initialDate);startTransition(async()=>{const r=await getActivityLogs({search,dateFrom:initialDate,dateTo:initialDate,module,limit:PAGE_SIZE,offset:0});setState(r);setMessage(r.success?null:r.message??t.loadFailed);setSelectedLog(null)})};
  const panel="rounded-[2rem] border border-[color:var(--admin-border)] bg-[color:var(--admin-card)] shadow-[0_24px_70px_rgba(0,0,0,0.14)] backdrop-blur-xl";
  const field="h-12 w-full rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-soft)] px-4 text-sm text-[color:var(--admin-text)] outline-none transition focus:border-blue-400/60";
  return <>
    <div className="w-full space-y-5" dir={dir}>
      <div><h1 className="text-2xl font-black text-[color:var(--admin-text)]">{t.title}</h1><p className="mt-1 text-sm text-[color:var(--admin-muted)]">{t.subtitle}</p></div>
      {message&&<div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-200">{message}</div>}
      <div className={`${panel} p-4 sm:p-5`}>
        <div className="grid gap-3 xl:grid-cols-[minmax(260px,1.4fr)_170px_170px_210px_auto] xl:items-end">
          <label><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[color:var(--admin-muted)]">{t.search}</span><div className="relative"><Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--admin-muted)]"/><input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")load(0)}} placeholder={t.searchPlaceholder} className={`${field} ps-10`}/></div></label>
          <label><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[color:var(--admin-muted)]">{t.from}</span><input type="date" value={dateFrom} max={dateTo||undefined} onChange={e=>setDateFrom(e.target.value)} className={field}/></label>
          <label><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[color:var(--admin-muted)]">{t.to}</span><input type="date" value={dateTo} min={dateFrom||undefined} onChange={e=>setDateTo(e.target.value)} className={field}/></label>
          <label><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[color:var(--admin-muted)]">{t.module}</span><select value={module} onChange={e=>setModule(e.target.value)} className={field}>{moduleOptions.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
          <div className="flex gap-2"><Button type="button" variant="secondary" onClick={showToday} disabled={isPending} className="h-12 rounded-2xl">{t.today}</Button><Button type="button" onClick={()=>load(0)} disabled={isPending} className="h-12 rounded-2xl"><RefreshCw className={`h-4 w-4 ${isPending?"animate-spin":""}`}/>{t.apply}</Button></div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-[color:var(--admin-muted)]"><span>{state.pagination.filteredTotal.toLocaleString(locale)} {t.results}</span><span>{t.page} {currentPage} {t.of} {pageCount}</span></div>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-[color:var(--admin-border)]">
          <div className="min-w-[860px]">
            <div className="grid grid-cols-[150px_220px_minmax(260px,1fr)_44px] items-center gap-3 bg-[color:var(--admin-soft)] px-4 py-3 text-xs font-bold uppercase tracking-wide text-[color:var(--admin-muted)]"><span>{t.time}</span><span>{t.activity}</span><span>{t.summary}</span><span/></div>
            {state.logs.length===0?<div className="px-4 py-8 text-sm text-[color:var(--admin-muted)]">{t.empty}</div>:state.logs.map(log=><button key={log.id} type="button" onClick={()=>setSelectedLog(log)} className={`grid min-h-[66px] w-full grid-cols-[150px_220px_minmax(260px,1fr)_44px] items-center gap-3 border-t border-[color:var(--admin-border)] px-4 py-3 text-start transition hover:bg-[color:var(--admin-soft)] ${activeLog?.id===log.id?"bg-[color:var(--admin-soft)]":"bg-transparent"}`}><span className="text-sm text-[color:var(--admin-muted)]">{formatShortDate(log.createdAt)}</span><div className="min-w-0"><div className="text-sm font-black text-[color:var(--admin-text)]">{humanizeAction(log.action)}</div><div className="mt-1 text-xs text-[color:var(--admin-muted)]">{humanizeEntity(log.entityType)}</div></div><span className="truncate text-sm text-[color:var(--admin-text)]/80">{readableSummary(log)}</span><span className="flex justify-end text-[color:var(--admin-muted)]">{dir==="rtl"?<ChevronLeft className="h-4 w-4"/>:<ChevronRight className="h-4 w-4"/>}</span></button>)}
          </div>
        </div>
        {pageCount>1&&<div className="mt-4 flex flex-wrap items-center justify-center gap-2"><Button type="button" variant="secondary" onClick={()=>load((currentPage-2)*PAGE_SIZE)} disabled={isPending||currentPage<=1} className="h-10 rounded-2xl px-3" aria-label={t.previous}><ChevronLeft className="h-4 w-4"/></Button>{pages.map((page,index)=>{const prev=pages[index-1];return <span key={page} className="contents">{prev&&page-prev>1&&<span className="px-1 text-sm text-[color:var(--admin-muted)]">…</span>}<button type="button" onClick={()=>load((page-1)*PAGE_SIZE)} disabled={isPending} className={`h-10 min-w-10 rounded-2xl px-3 text-sm font-bold transition ${page===currentPage?"bg-amber-200 text-black":"border border-[color:var(--admin-border)] bg-[color:var(--admin-soft)] text-[color:var(--admin-text)]"}`}>{page}</button></span>})}<Button type="button" variant="secondary" onClick={()=>load(currentPage*PAGE_SIZE)} disabled={isPending||currentPage>=pageCount} className="h-10 rounded-2xl px-3" aria-label={t.next}><ChevronRight className="h-4 w-4"/></Button></div>}
      </div>
    </div>
    {activeLog&&typeof document!=="undefined"&&createPortal(<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/65 p-4 backdrop-blur-md" onClick={()=>setSelectedLog(null)} dir={dir}><div className="relative max-h-[88vh] w-full max-w-5xl overflow-hidden rounded-[2rem] border border-[color:var(--admin-border)] bg-[color:var(--admin-card)] text-[color:var(--admin-text)] shadow-2xl" onClick={e=>e.stopPropagation()}><div className="border-b border-[color:var(--admin-border)] bg-[color:var(--admin-soft)] px-6 py-5"><button type="button" onClick={()=>setSelectedLog(null)} className="absolute start-5 top-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-card)]" aria-label="Close"><X className="h-5 w-5"/></button><div className="ps-16 pe-6"><div className="text-xs font-bold uppercase tracking-[0.24em] text-blue-400">{t.details}</div><h2 className="mt-2 text-3xl font-black">{humanizeAction(activeLog.action)}</h2><p className="mt-2 text-sm text-[color:var(--admin-muted)]">{formatDate(activeLog.createdAt)}</p></div></div><div className="max-h-[calc(88vh-120px)] overflow-y-auto px-6 py-6"><div className="grid gap-4 md:grid-cols-2"><InfoCard label={t.entityType} value={humanizeEntity(activeLog.entityType)}/><InfoCard label={t.entityId} value={activeLog.entityId??"—"} mono/></div><div className="mt-4 rounded-3xl border border-[color:var(--admin-border)] bg-[color:var(--admin-soft)] p-5"><div className="text-xs font-bold uppercase tracking-wide text-[color:var(--admin-muted)]">{t.readableSummary}</div><p className="mt-2 text-lg font-black">{readableSummary(activeLog)}</p></div><div className="mt-4 rounded-3xl border border-[color:var(--admin-border)] bg-[color:var(--admin-card)] p-5"><div className="mb-3 flex items-center justify-between gap-3"><div><div className="text-xs font-bold uppercase tracking-wide text-[color:var(--admin-muted)]">{t.metadata}</div><p className="mt-1 text-sm text-[color:var(--admin-muted)]">{t.metadataHint}</p></div><Button type="button" variant="primary" className="rounded-2xl" onClick={async()=>{await copyJson(activeLog.metadata??{});setCopied(true);window.setTimeout(()=>setCopied(false),1800)}}><Copy className="h-4 w-4"/>{copied?t.copied:t.copy}</Button></div><pre className="overflow-x-auto rounded-2xl bg-black/55 p-4 text-sm leading-6 text-slate-100">{JSON.stringify(activeLog.metadata??{},null,2)}</pre></div></div></div></div>,document.body)}
  </>;
}

function InfoCard({label,value,mono=false}:{label:string;value:string;mono?:boolean}){return <div className="rounded-3xl border border-[color:var(--admin-border)] bg-[color:var(--admin-soft)] p-5"><div className="text-xs font-bold uppercase tracking-wide text-[color:var(--admin-muted)]">{label}</div><div className={`mt-2 text-lg font-black text-[color:var(--admin-text)] ${mono?"break-all font-mono text-base":""}`}>{value}</div></div>}
