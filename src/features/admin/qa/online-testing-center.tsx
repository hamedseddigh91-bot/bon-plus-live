"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Copy,
  ExternalLink,
  Globe2,
  Laptop,
  MessageSquare,
  MonitorSmartphone,
  Rocket,
  ShieldCheck,
  Smartphone,
  TestTube2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAdminLanguage } from "@/lib/admin-language";

type Language = "fa" | "ar" | "en";

type QaItem = {
  id: string;
  area: string;
  title: string;
  detail: string;
  priority: "critical" | "important" | "normal";
};

const STORAGE_KEY = "bonplus.qa.completed.v5";

const copy = {
  fa: {
    title: "مرکز تست آنلاین",
    subtitle: "این صفحه برای تست نسخه آنلاین توسط خودت و تیم ساخته شده؛ هر نفر می‌تواند چک‌لیست را بزند و باگ‌ها را گزارش کند.",
    onlineUrl: "لینک نسخه آنلاین",
    onlineUrlPlaceholder: "مثلاً https://bonplus-demo.vercel.app",
    staffMessage: "پیام آماده برای تیم",
    copyMessage: "کپی پیام",
    openWhatsApp: "باز کردن واتساپ",
    checklist: "چک‌لیست تست تیم",
    progress: "پیشرفت تست",
    checked: "انجام‌شده",
    remaining: "باقی‌مانده",
    deployment: "آماده‌سازی نسخه آنلاین",
    deploymentSubtitle: "قبل از ارسال لینک به تیم، این موارد را کنترل کن.",
    devices: "تست دستگاه‌ها",
    devicesSubtitle: "نسخه آنلاین باید روی لپ‌تاپ، موبایل و تبلت قابل استفاده باشد.",
    reportBug: "قالب گزارش باگ",
    bugTemplate: "صفحه:\nمشکل:\nمراحل تکرار:\nاسکرین‌شات:\nاولویت:",
    critical: "خیلی مهم",
    important: "مهم",
    normal: "معمولی",
    reset: "ریست چک‌لیست",
    ready: "آماده تست آنلاین",
    warning: "این صفحه فقط برای تست است و دیتابیس را تغییر نمی‌دهد.",
    messageText:
      "سلام تیم، لطفاً نسخه آنلاین Bon Plus OS را تست کنید.\n\nلینک: {url}\n\nلطفاً این بخش‌ها را چک کنید:\n1. ورود به سایت\n2. تغییر زبان و تم\n3. مالی / فاکتورها / بستن صندوق\n4. مشتریان و فیدبک\n5. گزارش‌ها و Retention\n\nاگر مشکلی دیدید، نام صفحه، توضیح مشکل و اسکرین‌شات را ارسال کنید.",
  },
  ar: {
    title: "مركز الاختبار أونلاين",
    subtitle: "هذه الصفحة لاختبار النسخة الأونلاين من قبلك ومن قبل الفريق، مع قائمة فحص وتسجيل الملاحظات.",
    onlineUrl: "رابط النسخة الأونلاين",
    onlineUrlPlaceholder: "مثلاً https://bonplus-demo.vercel.app",
    staffMessage: "رسالة جاهزة للفريق",
    copyMessage: "نسخ الرسالة",
    openWhatsApp: "فتح واتساب",
    checklist: "قائمة اختبار الفريق",
    progress: "تقدم الاختبار",
    checked: "تم",
    remaining: "متبقي",
    deployment: "تجهيز النسخة الأونلاين",
    deploymentSubtitle: "قبل إرسال الرابط للفريق، تحقق من هذه النقاط.",
    devices: "اختبار الأجهزة",
    devicesSubtitle: "يجب أن تعمل النسخة على اللابتوب، الجوال والتابلت.",
    reportBug: "نموذج تقرير مشكلة",
    bugTemplate: "الصفحة:\nالمشكلة:\nخطوات التكرار:\nالصورة:\nالأولوية:",
    critical: "مهم جداً",
    important: "مهم",
    normal: "عادي",
    reset: "إعادة ضبط القائمة",
    ready: "جاهز للاختبار أونلاين",
    warning: "هذه الصفحة للاختبار فقط ولا تغيّر قاعدة البيانات.",
    messageText:
      "مرحباً فريق، يرجى اختبار نسخة Bon Plus OS الأونلاين.\n\nالرابط: {url}\n\nيرجى فحص هذه الأقسام:\n1. تسجيل الدخول\n2. تغيير اللغة والمظهر\n3. المالية / الفواتير / إغلاق الصندوق\n4. العملاء والآراء\n5. التقارير وRetention\n\nإذا ظهرت مشكلة، أرسل اسم الصفحة، وصف المشكلة وصورة للشاشة.",
  },
  en: {
    title: "Online Testing Center",
    subtitle: "Use this page to test the online version with your staff, track checks and collect bug reports.",
    onlineUrl: "Online version URL",
    onlineUrlPlaceholder: "Example: https://bonplus-demo.vercel.app",
    staffMessage: "Staff message",
    copyMessage: "Copy message",
    openWhatsApp: "Open WhatsApp",
    checklist: "Team testing checklist",
    progress: "Testing progress",
    checked: "Done",
    remaining: "Remaining",
    deployment: "Online deployment readiness",
    deploymentSubtitle: "Check these before sending the link to the team.",
    devices: "Device testing",
    devicesSubtitle: "The online version should be usable on laptop, mobile and tablet.",
    reportBug: "Bug report template",
    bugTemplate: "Page:\nIssue:\nSteps to repeat:\nScreenshot:\nPriority:",
    critical: "Critical",
    important: "Important",
    normal: "Normal",
    reset: "Reset checklist",
    ready: "Ready for online testing",
    warning: "This page is for testing only and does not change the database.",
    messageText:
      "Hi team, please test the online version of Bon Plus OS.\n\nLink: {url}\n\nPlease check:\n1. Login\n2. Language and theme switch\n3. Finance / invoices / cash closing\n4. Customers and feedback\n5. Reports and Retention\n\nIf you see an issue, send the page name, issue details and a screenshot.",
  },
} as const;

const qaItems: Record<Language, QaItem[]> = {
  fa: [
    { id: "login", area: "Login", title: "ورود و خروج", detail: "ورود با حساب تست، خروج، و ورود مجدد را چک کن.", priority: "critical" },
    { id: "theme", area: "Global", title: "زبان و تم", detail: "فارسی/عربی/انگلیسی و تم روشن/تیره روی کل سایت درست اعمال شود.", priority: "critical" },
    { id: "finance-dashboard", area: "Finance", title: "داشبورد مالی", detail: "کارت‌ها، نمودارها، عددها و هشدارها درست نمایش داده شوند.", priority: "critical" },
    { id: "invoice", area: "Finance", title: "ثبت فاکتور", detail: "ثبت فاکتور، تأمین‌کننده، پرداخت‌شده/نشده و آپلود سند چک شود.", priority: "critical" },
    { id: "closing", area: "Finance", title: "بستن صندوق", detail: "نقد، کارت، طلبات و تیپ کارت ثبت و جمع درست محاسبه شود.", priority: "critical" },
    { id: "period", area: "Finance", title: "دوره مالی", detail: "باز/بسته بودن دوره و جلوگیری از ثبت در ماه بسته‌شده چک شود.", priority: "important" },
    { id: "recipes", area: "Recipes", title: "قیمت تمام‌شده", detail: "مواد اولیه، آیتم منو، سود ناخالص و Food Cost بررسی شود.", priority: "important" },
    { id: "feedback", area: "Feedback", title: "فیدبک مشتری", detail: "لیست فیدبک، فیلترها و مشتری ناراضی بررسی شود.", priority: "important" },
    { id: "customers", area: "Customers", title: "CRM مشتری", detail: "جستجو، وضعیت وفاداری، مشتری‌های در خطر و جزئیات مشتری چک شود.", priority: "important" },
    { id: "recovery", area: "Retention", title: "پیگیری مشتری", detail: "متن واتساپ، کپی پیام و لینک‌های سریع چک شود.", priority: "important" },
    { id: "reports", area: "Reports", title: "گزارش‌ها", detail: "CSV، چاپ، بکاپ JSON و هشدارهای مدیریتی بررسی شود.", priority: "important" },
    { id: "mobile", area: "Device", title: "موبایل و تبلت", detail: "صفحات اصلی روی موبایل و تبلت بهم نریزند.", priority: "normal" },
  ],
  ar: [
    { id: "login", area: "Login", title: "الدخول والخروج", detail: "اختبر الدخول بحساب تجريبي، الخروج ثم الدخول مرة أخرى.", priority: "critical" },
    { id: "theme", area: "Global", title: "اللغة والمظهر", detail: "تأكد من تطبيق الفارسية/العربية/الإنجليزية والمظهر الفاتح/الداكن على كامل الموقع.", priority: "critical" },
    { id: "finance-dashboard", area: "Finance", title: "لوحة المالية", detail: "تأكد من البطاقات، الرسوم، الأرقام والتنبيهات.", priority: "critical" },
    { id: "invoice", area: "Finance", title: "تسجيل فاتورة", detail: "اختبر الفاتورة، المورد، حالة الدفع ورفع المستند.", priority: "critical" },
    { id: "closing", area: "Finance", title: "إغلاق الصندوق", detail: "اختبر النقد، البطاقة، طلبات وتيب البطاقة مع المجموع.", priority: "critical" },
    { id: "period", area: "Finance", title: "الفترة المالية", detail: "اختبر فتح/إغلاق الفترة ومنع التسجيل في شهر مغلق.", priority: "important" },
    { id: "recipes", area: "Recipes", title: "تكلفة الوصفات", detail: "اختبر المواد، عنصر المنيو، الربح وFood Cost.", priority: "important" },
    { id: "feedback", area: "Feedback", title: "آراء العملاء", detail: "اختبر القائمة، الفلاتر والعملاء غير الراضين.", priority: "important" },
    { id: "customers", area: "Customers", title: "CRM العملاء", detail: "اختبر البحث، الولاء، العملاء المعرضين للخطر وتفاصيل العميل.", priority: "important" },
    { id: "recovery", area: "Retention", title: "متابعة العملاء", detail: "اختبر رسالة واتساب، النسخ والروابط السريعة.", priority: "important" },
    { id: "reports", area: "Reports", title: "التقارير", detail: "اختبر CSV، الطباعة، JSON والتنبيهات.", priority: "important" },
    { id: "mobile", area: "Device", title: "الجوال والتابلت", detail: "تأكد أن الصفحات الأساسية لا تتكسر على الأجهزة الصغيرة.", priority: "normal" },
  ],
  en: [
    { id: "login", area: "Login", title: "Sign in and out", detail: "Test login, logout and login again with a test account.", priority: "critical" },
    { id: "theme", area: "Global", title: "Language and theme", detail: "Confirm FA/AR/EN and light/dark theme apply across the app.", priority: "critical" },
    { id: "finance-dashboard", area: "Finance", title: "Finance dashboard", detail: "Check cards, charts, numbers and warnings.", priority: "critical" },
    { id: "invoice", area: "Finance", title: "Invoice entry", detail: "Test invoice, supplier, paid/unpaid and document upload.", priority: "critical" },
    { id: "closing", area: "Finance", title: "Cash closing", detail: "Test cash, card, Talabat and Tip Card totals.", priority: "critical" },
    { id: "period", area: "Finance", title: "Financial period", detail: "Test open/closed periods and lock behavior.", priority: "important" },
    { id: "recipes", area: "Recipes", title: "Recipe costing", detail: "Test ingredients, menu items, gross profit and Food Cost.", priority: "important" },
    { id: "feedback", area: "Feedback", title: "Customer feedback", detail: "Test list, filters and unhappy customer handling.", priority: "important" },
    { id: "customers", area: "Customers", title: "Customer CRM", detail: "Test search, loyalty status, at-risk customers and details.", priority: "important" },
    { id: "recovery", area: "Retention", title: "Customer recovery", detail: "Test WhatsApp text, copy action and quick links.", priority: "important" },
    { id: "reports", area: "Reports", title: "Reports", detail: "Test CSV, print, JSON backup and management alerts.", priority: "important" },
    { id: "mobile", area: "Device", title: "Mobile and tablet", detail: "Confirm main pages do not break on smaller screens.", priority: "normal" },
  ],
};

const deploymentItems = {
  fa: ["Build بدون ارور کامل شود", "Env های Supabase روی هاست ست شود", "NEXT_PUBLIC_APP_URL با لینک آنلاین تنظیم شود", "حساب‌های تست برای تیم ساخته شود", "لینک آنلاین روی موبایل و لپ‌تاپ باز شود"],
  ar: ["اكتمال Build بدون أخطاء", "ضبط Env الخاصة بـ Supabase على الاستضافة", "ضبط NEXT_PUBLIC_APP_URL برابط الأونلاين", "إنشاء حسابات اختبار للفريق", "فتح الرابط على الجوال واللابتوب"],
  en: ["Build completes without errors", "Supabase env values are set on hosting", "NEXT_PUBLIC_APP_URL uses the online URL", "Test users are created for staff", "Online link opens on mobile and laptop"],
};

function priorityVariant(priority: QaItem["priority"]) {
  if (priority === "critical") return "danger";
  if (priority === "important") return "warning";
  return "secondary";
}

function asLanguage(value: string): Language {
  if (value === "ar" || value === "en" || value === "fa") return value;
  return "fa";
}

export function OnlineTestingCenter() {
  const { language } = useAdminLanguage();
  const activeLanguage = asLanguage(language);
  const t = copy[activeLanguage];
  const items = qaItems[activeLanguage];
  const [onlineUrl, setOnlineUrl] = useState("");
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      setChecked(JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}"));
    } catch {
      setChecked({});
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
  }, [checked]);

  const doneCount = items.filter((item) => checked[item.id]).length;
  const progress = Math.round((doneCount / items.length) * 100);
  const message = useMemo(() => t.messageText.replace("{url}", onlineUrl || "[ONLINE LINK]"), [onlineUrl, t]);

  const copyToClipboard = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.24em] text-amber-200">
                <Rocket className="h-4 w-4" />
                v5.0
              </div>
              <h2 className="text-3xl font-black tracking-[-0.04em] text-white">{t.title}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">{t.subtitle}</p>
            </div>
            <Badge variant="success">{t.ready}</Badge>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-4">
              <div className="flex items-center gap-2 text-white/45"><ClipboardCheck className="h-4 w-4" />{t.checked}</div>
              <p className="mt-2 text-3xl font-black text-white">{doneCount}</p>
            </div>
            <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-4">
              <div className="flex items-center gap-2 text-white/45"><AlertTriangle className="h-4 w-4" />{t.remaining}</div>
              <p className="mt-2 text-3xl font-black text-white">{items.length - doneCount}</p>
            </div>
            <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-4">
              <div className="flex items-center gap-2 text-white/45"><ShieldCheck className="h-4 w-4" />{t.progress}</div>
              <p className="mt-2 text-3xl font-black text-white">{progress}%</p>
            </div>
          </div>

          <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-amber-200 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Globe2 className="h-5 w-5 text-amber-200" />
            <h3 className="text-xl font-black text-white">{t.staffMessage}</h3>
          </div>
          <label className="mt-5 block">
            <span className="text-sm text-white/45">{t.onlineUrl}</span>
            <input
              value={onlineUrl}
              onChange={(event) => setOnlineUrl(event.target.value)}
              placeholder={t.onlineUrlPlaceholder}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-200/60"
            />
          </label>
          <textarea
            readOnly
            value={message}
            className="mt-4 min-h-40 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white/70 outline-none"
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={() => copyToClipboard(message)}>
              <Copy className="h-4 w-4" />
              {copied ? "Copied" : t.copyMessage}
            </Button>
            <Button variant="secondary" onClick={() => window.open(whatsappUrl, "_blank", "noopener,noreferrer")}>
              <MessageSquare className="h-4 w-4" />
              {t.openWhatsApp}
            </Button>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-black text-white">{t.checklist}</h3>
              <p className="mt-1 text-sm text-white/40">{t.warning}</p>
            </div>
            <Button variant="secondary" onClick={() => setChecked({})}>{t.reset}</Button>
          </div>

          <div className="mt-5 grid gap-3">
            {items.map((item) => {
              const isChecked = Boolean(checked[item.id]);

              return (
                <label
                  key={item.id}
                  className={`group flex cursor-pointer gap-4 rounded-[1.35rem] border p-4 transition ${
                    isChecked
                      ? "border-emerald-300/25 bg-emerald-300/[0.07]"
                      : "border-white/10 bg-white/[0.035] hover:bg-white/[0.065]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(event) => setChecked((current) => ({ ...current, [item.id]: event.target.checked }))}
                    className="mt-1 h-5 w-5 accent-amber-300"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={priorityVariant(item.priority)}>
                        {item.priority === "critical" ? t.critical : item.priority === "important" ? t.important : t.normal}
                      </Badge>
                      <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/35">{item.area}</span>
                    </div>
                    <p className="mt-2 text-base font-bold text-white">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-white/42">{item.detail}</p>
                  </div>
                  {isChecked && <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-200" />}
                </label>
              );
            })}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <TestTube2 className="h-5 w-5 text-amber-200" />
              <h3 className="text-xl font-black text-white">{t.deployment}</h3>
            </div>
            <p className="mt-2 text-sm text-white/40">{t.deploymentSubtitle}</p>
            <div className="mt-5 space-y-3">
              {deploymentItems[activeLanguage].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm text-white/65">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-200" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <MonitorSmartphone className="h-5 w-5 text-amber-200" />
              <h3 className="text-xl font-black text-white">{t.devices}</h3>
            </div>
            <p className="mt-2 text-sm text-white/40">{t.devicesSubtitle}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
              {[
                { icon: Laptop, label: "Desktop" },
                { icon: Smartphone, label: "Mobile" },
                { icon: MonitorSmartphone, label: "Tablet" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
                    <Icon className="mx-auto h-6 w-6 text-amber-200" />
                    <p className="mt-2 text-sm font-bold text-white">{item.label}</p>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-5 w-5 text-amber-200" />
              <h3 className="text-xl font-black text-white">{t.reportBug}</h3>
            </div>
            <textarea
              readOnly
              value={t.bugTemplate}
              className="mt-4 min-h-36 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white/70 outline-none"
            />
            <div className="mt-4 flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => copyToClipboard(t.bugTemplate)}>
                <Copy className="h-4 w-4" />
                {t.copyMessage}
              </Button>
              {onlineUrl && (
                <Button variant="secondary" onClick={() => window.open(onlineUrl, "_blank", "noopener,noreferrer")}>
                  <ExternalLink className="h-4 w-4" />
                  {t.onlineUrl}
                </Button>
              )}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
