"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  ExternalLink,
  Gift,
  HeartHandshake,
  MessageCircle,
  Phone,
  Send,
  ShieldAlert,
  Sparkles,
  Star,
  Target,
  Users,
} from "lucide-react";
import type { CustomerDirectoryRow, CustomerDirectoryState } from "@/app/admin/customers/actions";
import type { FeedbackInboxState } from "@/app/admin/feedback/actions";
import type { RecoveryBoardCase, RecoveryBoardState } from "@/app/admin/recovery/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAdminLanguage } from "@/lib/admin-language";

export type RetentionCommandCenterProps = {
  recoveryState: RecoveryBoardState;
  customerState: CustomerDirectoryState;
  feedbackState: FeedbackInboxState;
};

const text = {
  fa: {
    command: "مرکز نگهداشت مشتری",
    title: "Customer Retention Command Center",
    subtitle:
      "همه چیز برای برگرداندن مشتری ناراضی، پیگیری واتساپ، پاداش و کنترل وفاداری در یک صفحه عملیاتی.",
    openRecovery: "پرونده باز",
    urgentCases: "فوری",
    atRisk: "مشتری در خطر",
    unhappy: "فیدبک ناراضی",
    conversion: "تمرکز امروز",
    urgentQueue: "صف پیگیری فوری",
    urgentQueueHint: "اول این افراد را تماس یا واتساپ کن؛ این بخش برای جلوگیری از از دست رفتن مشتری است.",
    noUrgent: "فعلاً مورد فوری برای پیگیری نیست.",
    customer: "مشتری",
    score: "امتیاز",
    priority: "اولویت",
    status: "وضعیت",
    tasks: "تسک‌ها",
    select: "انتخاب",
    whatsappStudio: "استودیو پیام واتساپ",
    whatsappHint: "پیام آماده را انتخاب کن، متن را کپی کن یا مستقیم واتساپ را باز کن.",
    selectedCustomer: "مشتری انتخاب‌شده",
    phone: "شماره",
    template: "نوع پیام",
    recoveryTemplate: "بازگردانی مشتری ناراضی",
    rewardTemplate: "ارسال پاداش / تخفیف",
    loyalTemplate: "تشکر از مشتری وفادار",
    copy: "کپی متن",
    openWhatsapp: "باز کردن واتساپ",
    copied: "کپی شد",
    selectFirst: "اول یک مشتری از صف پیگیری انتخاب کن.",
    messagePreview: "پیش‌نمایش پیام",
    playbook: "برنامه عملیاتی امروز",
    step1: "پرونده‌های فوری را بررسی کن",
    step2: "برای مشتری ناراضی پیام عذرخواهی و دعوت مجدد بفرست",
    step3: "برای مشتری‌های وفادار پاداش یا پیام تشکر بفرست",
    step4: "آخر روز وضعیت پرونده‌ها را در Recovery به‌روزرسانی کن",
    quickActions: "لینک‌های سریع",
    feedback: "فیدبک‌ها",
    customers: "مشتریان",
    discounts: "تخفیف‌ها",
    rewards: "پاداش‌ها",
    recovery: "Recovery Board",
    customerHealth: "سلامت مشتریان",
    loyalCustomers: "مشتری تکراری",
    averageScore: "میانگین رضایت",
    rewardCount: "پاداش ساخته‌شده",
    open: "باز",
    inProgress: "در جریان",
    resolved: "حل شده",
    closed: "بسته",
    urgent: "فوری",
    high: "بالا",
    normal: "عادی",
    low: "کم",
  },
  ar: {
    command: "مركز الاحتفاظ بالعملاء",
    title: "Customer Retention Command Center",
    subtitle: "كل ما تحتاجه لاستعادة العميل غير الراضي، متابعة واتساب، المكافآت والولاء في صفحة تشغيلية واحدة.",
    openRecovery: "حالات مفتوحة",
    urgentCases: "عاجلة",
    atRisk: "عملاء معرضون للفقدان",
    unhappy: "آراء غير راضية",
    conversion: "تركيز اليوم",
    urgentQueue: "قائمة المتابعة العاجلة",
    urgentQueueHint: "ابدأ بهؤلاء عبر الاتصال أو واتساب لتقليل فقدان العملاء.",
    noUrgent: "لا توجد حالات عاجلة حالياً.",
    customer: "العميل",
    score: "التقييم",
    priority: "الأولوية",
    status: "الحالة",
    tasks: "المهام",
    select: "اختيار",
    whatsappStudio: "استوديو رسائل واتساب",
    whatsappHint: "اختر رسالة جاهزة، انسخ النص أو افتح واتساب مباشرة.",
    selectedCustomer: "العميل المحدد",
    phone: "الهاتف",
    template: "نوع الرسالة",
    recoveryTemplate: "استعادة عميل غير راضٍ",
    rewardTemplate: "إرسال مكافأة / خصم",
    loyalTemplate: "شكر عميل وفي",
    copy: "نسخ النص",
    openWhatsapp: "فتح واتساب",
    copied: "تم النسخ",
    selectFirst: "اختر عميلاً من قائمة المتابعة أولاً.",
    messagePreview: "معاينة الرسالة",
    playbook: "خطة العمل اليوم",
    step1: "راجع الحالات العاجلة",
    step2: "أرسل اعتذاراً ودعوة رجوع للعميل غير الراضي",
    step3: "أرسل مكافأة أو شكر للعملاء الأوفياء",
    step4: "في نهاية اليوم حدّث الحالة في Recovery",
    quickActions: "روابط سريعة",
    feedback: "الآراء",
    customers: "العملاء",
    discounts: "الخصومات",
    rewards: "المكافآت",
    recovery: "Recovery Board",
    customerHealth: "صحة العملاء",
    loyalCustomers: "عملاء متكررون",
    averageScore: "متوسط الرضا",
    rewardCount: "مكافآت منشأة",
    open: "مفتوح",
    inProgress: "قيد المتابعة",
    resolved: "تم الحل",
    closed: "مغلق",
    urgent: "عاجل",
    high: "مرتفع",
    normal: "عادي",
    low: "منخفض",
  },
  en: {
    command: "Customer retention center",
    title: "Customer Retention Command Center",
    subtitle:
      "Everything for win-back, WhatsApp follow-up, rewards and loyalty control in one operational screen.",
    openRecovery: "Open recovery",
    urgentCases: "Urgent",
    atRisk: "At-risk customers",
    unhappy: "Unhappy feedback",
    conversion: "Today focus",
    urgentQueue: "Urgent recovery queue",
    urgentQueueHint: "Start with these people by call or WhatsApp to avoid losing customers.",
    noUrgent: "No urgent recovery cases right now.",
    customer: "Customer",
    score: "Score",
    priority: "Priority",
    status: "Status",
    tasks: "Tasks",
    select: "Select",
    whatsappStudio: "WhatsApp message studio",
    whatsappHint: "Choose a ready message, copy it, or open WhatsApp directly.",
    selectedCustomer: "Selected customer",
    phone: "Phone",
    template: "Template",
    recoveryTemplate: "Unhappy customer win-back",
    rewardTemplate: "Reward / discount follow-up",
    loyalTemplate: "Loyal customer thank you",
    copy: "Copy text",
    openWhatsapp: "Open WhatsApp",
    copied: "Copied",
    selectFirst: "Select a customer from the recovery queue first.",
    messagePreview: "Message preview",
    playbook: "Today playbook",
    step1: "Review urgent recovery cases",
    step2: "Send apology and return invite to unhappy customers",
    step3: "Send reward or thank-you message to loyal customers",
    step4: "At day end, update case status in Recovery",
    quickActions: "Quick links",
    feedback: "Feedback",
    customers: "Customers",
    discounts: "Discounts",
    rewards: "Rewards",
    recovery: "Recovery Board",
    customerHealth: "Customer health",
    loyalCustomers: "Repeat customers",
    averageScore: "Average satisfaction",
    rewardCount: "Rewards generated",
    open: "Open",
    inProgress: "In progress",
    resolved: "Resolved",
    closed: "Closed",
    urgent: "Urgent",
    high: "High",
    normal: "Normal",
    low: "Low",
  },
} as const;

type LocalCopy = (typeof text)[keyof typeof text];
type TemplateType = "recovery" | "reward" | "loyal";

type TargetCustomer = {
  id: string;
  phone: string;
  score: number | null;
  label: string;
  source: "case" | "customer";
  priority?: string;
  status?: string;
};

function numberValue(value: number | string | null | undefined) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function formatPhoneForWhatsapp(phone: string) {
  const digits = phone.replace(/\D+/g, "");

  if (!digits) return "";
  if (digits.startsWith("968")) return digits;
  if (digits.length === 8) return `968${digits}`;

  return digits;
}

function priorityVariant(priority: string | null | undefined) {
  if (priority === "urgent") return "danger";
  if (priority === "high") return "warning";
  if (priority === "low") return "secondary";
  return "amber";
}

function statusVariant(status: string | null | undefined) {
  if (status === "resolved" || status === "closed") return "success";
  if (status === "in_progress") return "warning";
  if (status === "open") return "danger";
  return "secondary";
}

function statusLabel(status: string | null | undefined, t: LocalCopy) {
  if (status === "in_progress") return t.inProgress;
  if (status === "resolved") return t.resolved;
  if (status === "closed") return t.closed;
  return t.open;
}

function priorityLabel(priority: string | null | undefined, t: LocalCopy) {
  if (priority === "urgent") return t.urgent;
  if (priority === "high") return t.high;
  if (priority === "low") return t.low;
  return t.normal;
}

function buildMessage(template: TemplateType, target: TargetCustomer | null, language: "fa" | "ar" | "en") {
  const phoneLabel = target?.phone ? ` (${target.phone})` : "";

  if (language === "ar") {
    if (template === "reward") {
      return `مرحباً${phoneLabel}، شكراً لزيارتك Bon Plus. يسعدنا تقديم مكافأة خاصة لك في زيارتك القادمة. نتمنى رؤيتك قريباً.`;
    }

    if (template === "loyal") {
      return `مرحباً${phoneLabel}، شكراً لأنك من عملائنا المميزين في Bon Plus. تقديرك وثقتك تعني لنا الكثير، ونسعد دائماً بخدمتك.`;
    }

    return `مرحباً${phoneLabel}، نعتذر بصدق إذا لم تكن تجربتك في Bon Plus بالمستوى المطلوب. رأيك مهم جداً لنا، ونحب أن نعوضك ونعطيك تجربة أفضل في زيارتك القادمة.`;
  }

  if (language === "en") {
    if (template === "reward") {
      return `Hi${phoneLabel}, thank you for visiting Bon Plus. We would like to offer you a special reward on your next visit. Hope to see you again soon.`;
    }

    if (template === "loyal") {
      return `Hi${phoneLabel}, thank you for being one of our valued Bon Plus customers. Your trust means a lot to us, and we are always happy to serve you.`;
    }

    return `Hi${phoneLabel}, we sincerely apologize if your Bon Plus experience was not at the level you expected. Your feedback matters to us, and we would love to make it right on your next visit.`;
  }

  if (template === "reward") {
    return `سلام${phoneLabel}، ممنون که Bon Plus رو انتخاب کردید. برای مراجعه بعدی شما یک پاداش ویژه در نظر گرفتیم. خوشحال می‌شیم دوباره ببینیمتون.`;
  }

  if (template === "loyal") {
    return `سلام${phoneLabel}، ممنون که از مشتری‌های ارزشمند Bon Plus هستید. اعتماد و همراهی شما برای ما خیلی ارزشمنده و همیشه خوشحالیم میزبانتون باشیم.`;
  }

  return `سلام${phoneLabel}، بابت اینکه تجربه شما در Bon Plus در حد انتظار نبوده واقعاً عذرخواهی می‌کنیم. نظر شما برای ما مهمه و دوست داریم در مراجعه بعدی جبران کنیم و تجربه بهتری بسازیم.`;
}

function MetricCard({ label, value, hint, icon, variant = "amber" }: { label: string; value: string | number; hint: string; icon: ReactNode; variant?: "amber" | "danger" | "success" | "warning" }) {
  return (
    <Card className="relative overflow-hidden p-5">
      <div className="absolute -right-10 -top-12 h-32 w-32 rounded-full" style={{ background: "radial-gradient(circle, currentColor, transparent 70%)", opacity: 0.09 }} />
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[color:var(--admin-muted)]">{label}</p>
          <p className="mt-3 text-3xl font-black tracking-[-0.05em] text-[color:var(--admin-text)]">{value}</p>
          <p className="mt-1 text-xs text-[color:var(--admin-muted)]">{hint}</p>
        </div>
        <Badge variant={variant} className="h-12 w-12 justify-center rounded-2xl p-0">
          {icon}
        </Badge>
      </div>
    </Card>
  );
}

function QueueCard({ item, t, onSelect, active }: { item: RecoveryBoardCase; t: LocalCopy; onSelect: () => void; active: boolean }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-[1.4rem] border p-4 text-left transition hover:-translate-y-0.5 ${
        active
          ? "border-amber-200/45 bg-amber-200/[0.10] shadow-[0_18px_40px_rgba(251,191,36,0.12)]"
          : "border-white/10 bg-white/[0.045] hover:border-white/18 hover:bg-white/[0.08]"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-[color:var(--admin-text)]">{item.phone}</p>
          <p className="mt-1 text-xs text-[color:var(--admin-muted)]">{formatDate(item.feedbackCreatedAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={priorityVariant(item.priority)}>{priorityLabel(item.priority, t)}</Badge>
          <Badge variant={statusVariant(item.status)}>{statusLabel(item.status, t)}</Badge>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-[color:var(--admin-muted)]">
        <span>{t.score}: <b className="text-[color:var(--admin-text)]">{item.score}</b></span>
        <span>{t.tasks}: <b className="text-[color:var(--admin-text)]">{item.taskDone}/{item.taskTotal}</b></span>
        <span className="truncate">{item.complaintReason ?? "—"}</span>
      </div>
    </button>
  );
}

function ActionLink({ href, label, icon }: { href: string; label: string; icon: ReactNode }) {
  return (
    <Link
      href={href}
      prefetch
      className="group flex items-center justify-between rounded-[1.25rem] border border-white/10 bg-white/[0.045] p-4 text-sm font-black text-[color:var(--admin-text)] transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.09]"
    >
      <span className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.08] text-amber-100">
          {icon}
        </span>
        {label}
      </span>
      <ExternalLink className="h-4 w-4 text-[color:var(--admin-muted)] transition group-hover:text-amber-100" />
    </Link>
  );
}

export function RetentionCommandCenter({ recoveryState, customerState, feedbackState }: RetentionCommandCenterProps) {
  const { language } = useAdminLanguage();
  const t = text[language];
  const [selectedId, setSelectedId] = useState<string | null>(recoveryState.cases[0]?.id ?? null);
  const [template, setTemplate] = useState<TemplateType>("recovery");
  const [copied, setCopied] = useState(false);

  const urgentCases = useMemo(() => {
    return recoveryState.cases
      .filter((item) => item.status === "open" || item.status === "in_progress")
      .sort((a, b) => {
        const priorityWeight: Record<string, number> = { urgent: 4, high: 3, normal: 2, low: 1 };
        return (priorityWeight[b.priority] ?? 0) - (priorityWeight[a.priority] ?? 0);
      })
      .slice(0, 12);
  }, [recoveryState.cases]);

  const selectedCase = urgentCases.find((item) => item.id === selectedId) ?? urgentCases[0] ?? null;
  const fallbackCustomer = customerState.customers.find((item: CustomerDirectoryRow) => item.openRecoveryCount > 0 || numberValue(item.averageScore) <= 2.5) ?? customerState.customers[0] ?? null;

  const target: TargetCustomer | null = selectedCase
    ? {
        id: selectedCase.id,
        phone: selectedCase.phone,
        score: selectedCase.score,
        label: selectedCase.complaintReason ?? selectedCase.segment,
        source: "case",
        priority: selectedCase.priority,
        status: selectedCase.status,
      }
    : fallbackCustomer
      ? {
          id: fallbackCustomer.id,
          phone: fallbackCustomer.phone,
          score: fallbackCustomer.averageScore,
          label: fallbackCustomer.lastFeedbackSegment ?? "customer",
          source: "customer",
          status: fallbackCustomer.openRecoveryCount > 0 ? "open" : "closed",
        }
      : null;

  const message = buildMessage(template, target, language);
  const whatsappPhone = target?.phone ? formatPhoneForWhatsapp(target.phone) : "";
  const whatsappUrl = whatsappPhone ? `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}` : "";
  const avgScore = numberValue(feedbackState.stats.averageScore).toFixed(1);

  const copyMessage = async () => {
    if (!target) return;

    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.065] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full" style={{ background: "radial-gradient(circle, rgba(240,171,252,0.16), transparent 70%)" }} />
        <div className="absolute -bottom-24 left-12 h-56 w-56 rounded-full" style={{ background: "radial-gradient(circle, rgba(252,211,77,0.16), transparent 70%)" }} />
        <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-amber-100">
              <Sparkles className="h-4 w-4" />
              {t.command}
            </div>
            <h1 className="max-w-4xl text-3xl font-black tracking-[-0.05em] text-[color:var(--admin-text)] md:text-5xl">
              {t.title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--admin-muted)]">
              {t.subtitle}
            </p>
          </div>

          <div className="grid min-w-[280px] grid-cols-2 gap-3">
            <Badge variant="danger" className="justify-center rounded-2xl py-3">
              <Target className="h-4 w-4" />
              {t.conversion}
            </Badge>
            <Badge variant="success" className="justify-center rounded-2xl py-3">
              <CheckCircle2 className="h-4 w-4" />
              {recoveryState.success && customerState.success && feedbackState.success ? "Ready" : "Check"}
            </Badge>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label={t.openRecovery}
          value={recoveryState.stats.open + recoveryState.stats.inProgress}
          hint={`${t.open}: ${recoveryState.stats.open} / ${t.inProgress}: ${recoveryState.stats.inProgress}`}
          icon={<HeartHandshake className="h-5 w-5" />}
          variant="danger"
        />
        <MetricCard
          label={t.urgentCases}
          value={recoveryState.stats.urgent}
          hint={`${t.priority}: ${t.urgent} / ${t.high}`}
          icon={<ShieldAlert className="h-5 w-5" />}
          variant="warning"
        />
        <MetricCard
          label={t.atRisk}
          value={customerState.stats.lowScoreCustomers + customerState.stats.unhappyCustomers}
          hint={`${t.loyalCustomers}: ${customerState.stats.repeatCustomers}`}
          icon={<Users className="h-5 w-5" />}
          variant="amber"
        />
        <MetricCard
          label={t.unhappy}
          value={feedbackState.stats.unhappyCount}
          hint={`${t.averageScore}: ${avgScore} / ${t.rewardCount}: ${feedbackState.stats.rewardCount}`}
          icon={<Star className="h-5 w-5" />}
          variant="success"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="p-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-[-0.04em] text-[color:var(--admin-text)]">{t.urgentQueue}</h2>
              <p className="mt-1 text-sm leading-6 text-[color:var(--admin-muted)]">{t.urgentQueueHint}</p>
            </div>
            <Badge variant="danger">{urgentCases.length}</Badge>
          </div>

          <div className="mt-5 space-y-3">
            {urgentCases.map((item) => (
              <QueueCard
                key={item.id}
                item={item}
                t={t}
                active={target?.id === item.id}
                onSelect={() => setSelectedId(item.id)}
              />
            ))}

            {urgentCases.length === 0 && (
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-8 text-center text-sm text-[color:var(--admin-muted)]">
                {t.noUrgent}
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black tracking-[-0.04em] text-[color:var(--admin-text)]">{t.whatsappStudio}</h2>
                <p className="mt-1 text-sm leading-6 text-[color:var(--admin-muted)]">{t.whatsappHint}</p>
              </div>
              <Badge variant="success"><MessageCircle className="h-4 w-4" /></Badge>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.045] p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[color:var(--admin-muted)]">{t.selectedCustomer}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge variant="amber"><Phone className="h-3.5 w-3.5" /> {target?.phone ?? "—"}</Badge>
                  {target?.score !== null && target?.score !== undefined && <Badge variant="secondary">{t.score}: {Number(target.score).toFixed(1)}</Badge>}
                  {target?.priority && <Badge variant={priorityVariant(target.priority)}>{priorityLabel(target.priority, t)}</Badge>}
                </div>
              </div>

              <label className="block">
                <span className="text-sm font-bold text-[color:var(--admin-muted)]">{t.template}</span>
                <select
                  value={template}
                  onChange={(event) => setTemplate(event.target.value as TemplateType)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-[color:var(--admin-text)] outline-none [color-scheme:dark] focus:border-amber-200/50"
                >
                  <option value="recovery">{t.recoveryTemplate}</option>
                  <option value="reward">{t.rewardTemplate}</option>
                  <option value="loyal">{t.loyalTemplate}</option>
                </select>
              </label>

              <div>
                <p className="mb-2 text-sm font-bold text-[color:var(--admin-muted)]">{t.messagePreview}</p>
                <div className="min-h-36 whitespace-pre-wrap rounded-[1.4rem] border border-white/10 bg-black/20 p-4 text-sm leading-7 text-[color:var(--admin-text)]">
                  {target ? message : t.selectFirst}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Button type="button" variant="secondary" onClick={copyMessage} disabled={!target}>
                  <Copy className="h-4 w-4" />
                  {copied ? t.copied : t.copy}
                </Button>
                <Button
                  type="button"
                  disabled={!target || !whatsappUrl}
                  onClick={() => whatsappUrl && window.open(whatsappUrl, "_blank", "noopener,noreferrer")}
                >
                  <Send className="h-4 w-4" />
                  {t.openWhatsapp}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-xl font-black tracking-[-0.04em] text-[color:var(--admin-text)]">{t.playbook}</h2>
            <div className="mt-5 space-y-3">
              {[t.step1, t.step2, t.step3, t.step4].map((step, index) => (
                <div key={step} className="flex gap-3 rounded-[1.25rem] border border-white/10 bg-white/[0.045] p-3 text-sm text-[color:var(--admin-text)]">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-200 text-xs font-black text-black">{index + 1}</span>
                  <span className="leading-7">{step}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="p-5">
          <h2 className="text-xl font-black tracking-[-0.04em] text-[color:var(--admin-text)]">{t.quickActions}</h2>
          <div className="mt-5 grid gap-3">
            <ActionLink href="/admin/feedback" label={t.feedback} icon={<MessageCircle className="h-4 w-4" />} />
            <ActionLink href="/admin/customers" label={t.customers} icon={<Users className="h-4 w-4" />} />
            <ActionLink href="/admin/discounts" label={t.discounts} icon={<Gift className="h-4 w-4" />} />
            <ActionLink href="/admin/rewards" label={t.rewards} icon={<Star className="h-4 w-4" />} />
            <ActionLink href="/admin/recovery" label={t.recovery} icon={<ClipboardCheck className="h-4 w-4" />} />
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-xl font-black tracking-[-0.04em] text-[color:var(--admin-text)]">{t.customerHealth}</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {customerState.customers.slice(0, 8).map((customer) => {
              const risk = customer.openRecoveryCount > 0 || numberValue(customer.averageScore) <= 2.5;

              return (
                <div key={customer.id} className="rounded-[1.25rem] border border-white/10 bg-white/[0.045] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-[color:var(--admin-text)]">{customer.phone}</p>
                      <p className="mt-1 text-xs text-[color:var(--admin-muted)]">{formatDate(customer.lastSeenAt)}</p>
                    </div>
                    <Badge variant={risk ? "danger" : "success"}>{Number(customer.averageScore || 0).toFixed(1)}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="secondary">{customer.feedbackCount} feedback</Badge>
                    {customer.openRecoveryCount > 0 && <Badge variant="warning">{customer.openRecoveryCount} recovery</Badge>}
                    {customer.rewardCodeCount > 0 && <Badge variant="amber">{customer.rewardCodeCount} reward</Badge>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </section>
    </div>
  );
}
