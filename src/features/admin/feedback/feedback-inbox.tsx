"use client";

import { getWhatsAppTemplateText } from "@/app/admin/settings/whatsapp-messages/actions";

import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Gift,
  Inbox,
  MessageCircle,
  PhoneCall,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import {
  type FeedbackDetail,
  type FeedbackInboxRewardFilter,
  type FeedbackInboxSegmentFilter,
  type FeedbackInboxState,
  getAdminFeedbackDetail,
  getAdminFeedbackInbox,
  moveFeedbackWorkflow,
  startFeedbackRecovery,
  updateFeedbackRecoveryCase,
  updateFeedbackRecoveryTask,
} from "@/app/admin/feedback/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAdminLanguage } from "@/lib/admin-language";

type FeedbackInboxProps = {
  initialState: FeedbackInboxState;
};

const text = {
  fa: {
    command: "مرکز کنترل بازخورد",
    title: "رادار رضایت مشتری",
    subtitle: "بازخوردها را مثل مرکز عملیات ببین؛ ناراضی‌ها، پاداش‌ها، هشدارها و پیگیری‌ها در یک نمای سریع.",
    total: "کل بازخورد",
    filtered: "فیلتر شده",
    avg: "میانگین امتیاز",
    satisfied: "راضی",
    medium: "متوسط",
    unhappy: "ناراضی",
    rewards: "پاداش‌ها",
    alerts: "هشدارها",
    health: "سلامت تجربه مشتری",
    riskQueue: "صف پیگیری فوری",
    noRisk: "فعلاً مورد فوری دیده نمی‌شود.",
    filters: "فیلترهای عملیاتی",
    active: "فعال",
    clear: "پاک کردن",
    apply: "اعمال فیلتر",
    phoneSearch: "جستجوی شماره موبایل",
    allSegments: "همه وضعیت‌ها",
    allRewards: "همه پاداش‌ها",
    withReward: "با پاداش",
    withoutReward: "بدون پاداش",
    min: "حداقل",
    max: "حداکثر",
    phone: "شماره",
    score: "امتیاز",
    level: "وضعیت",
    recovery: "پیگیری",
    date: "تاریخ",
    noFeedback: "بازخوردی پیدا نشد.",
    loadMore: "نمایش بیشتر",
    selectTitle: "یک بازخورد انتخاب کن",
    selectSubtitle: "برای دیدن جزئیات، تاریخچه مشتری، پاداش و پیگیری ناراضی‌ها روی یک ردیف کلیک کن.",
    loading: "در حال بارگذاری جزئیات...",
    overallScore: "امتیاز کلی",
    customerMessage: "پیام مشتری",
    answers: "پاسخ‌ها",
    rewardCodes: "کدهای پاداش",
    noReward: "کد پاداشی وجود ندارد.",
    notifications: "هشدارها",
    noNotification: "هشداری وجود ندارد.",
    recoveryTitle: "فرآیند بازگرداندن مشتری",
    recoverySubtitle: "برای مشتری ناراضی پیگیری بساز، علت واقعی را ثبت کن و قدم‌های پیگیری را کامل کن.",
    startFollowUp: "شروع پیگیری",
    starting: "در حال شروع...",
    complaintReason: "علت نارضایتی",
    complaintPlaceholder: "علت واقعی امتیاز پایین چه بود؟",
    resolutionSummary: "خلاصه نتیجه پیگیری",
    resolutionPlaceholder: "مدیریت چه کاری انجام داد و مشکل چطور حل شد؟",
    optionalNote: "یادداشت اختیاری برای این مرحله",
    saveRecovery: "ذخیره پیگیری",
    markResolved: "حل شد",
    solved: "حل شده",
    following: "در حال پیگیری",
    notStarted: "شروع نشده",
    priority: "اولویت",
    language: "زبان",
    whatsapp: "واتس‌اپ",
    whatsappTitle: "پیام واتس‌اپ",
    openWhatsapp: "باز کردن واتس‌اپ",
    newFeedbacks: "فیدبک‌های جدید",
    inFollowUp: "در حال پیگیری",
    resolvedFeedbacks: "پایان‌یافته‌ها",
    moveToFollowUp: "انتقال به پیگیری",
    moveToResolved: "انتقال به پایان‌یافته‌ها",
    moveToNew: "انتقال به فیدبک‌های جدید",
    moving: "در حال انتقال...",
  },
  ar: {
    command: "مركز التحكم بالآراء",
    title: "رادار رضا العملاء",
    subtitle: "راجع الآراء كغرفة عمليات: العملاء غير الراضين، المكافآت، التنبيهات والمتابعة في عرض سريع.",
    total: "إجمالي الآراء",
    filtered: "المفلتر",
    avg: "متوسط التقييم",
    satisfied: "راضٍ",
    medium: "متوسط",
    unhappy: "غير راضٍ",
    rewards: "المكافآت",
    alerts: "التنبيهات",
    health: "صحة تجربة العميل",
    riskQueue: "قائمة المتابعة العاجلة",
    noRisk: "لا توجد حالات عاجلة حالياً.",
    filters: "فلاتر التشغيل",
    active: "نشط",
    clear: "مسح",
    apply: "تطبيق الفلاتر",
    phoneSearch: "بحث برقم الهاتف",
    allSegments: "كل الحالات",
    allRewards: "كل المكافآت",
    withReward: "مع مكافأة",
    withoutReward: "بدون مكافأة",
    min: "الأدنى",
    max: "الأعلى",
    phone: "الهاتف",
    score: "التقييم",
    level: "الحالة",
    recovery: "المتابعة",
    date: "التاريخ",
    noFeedback: "لا توجد آراء.",
    loadMore: "عرض المزيد",
    selectTitle: "اختر رأياً",
    selectSubtitle: "اضغط على أي صف لعرض التفاصيل، سجل العميل، المكافآت والمتابعة.",
    loading: "جاري تحميل التفاصيل...",
    overallScore: "التقييم العام",
    customerMessage: "رسالة العميل",
    answers: "الإجابات",
    rewardCodes: "أكواد المكافآت",
    noReward: "لا يوجد كود مكافأة.",
    notifications: "التنبيهات",
    noNotification: "لا توجد تنبيهات.",
    recoveryTitle: "استعادة العميل",
    recoverySubtitle: "ابدأ متابعة للعميل غير الراضي، سجل السبب الحقيقي وأكمل خطوات المتابعة.",
    startFollowUp: "بدء المتابعة",
    starting: "جارٍ البدء...",
    complaintReason: "سبب الشكوى",
    complaintPlaceholder: "ما السبب الحقيقي للتقييم المنخفض؟",
    resolutionSummary: "ملخص الحل",
    resolutionPlaceholder: "ماذا فعلت الإدارة وكيف تم حل المشكلة؟",
    optionalNote: "ملاحظة اختيارية لهذه الخطوة",
    saveRecovery: "حفظ المتابعة",
    markResolved: "تم الحل",
    solved: "تم الحل",
    following: "قيد المتابعة",
    notStarted: "لم يبدأ",
    priority: "الأولوية",
    language: "اللغة",
    whatsapp: "واتساب",
    whatsappTitle: "رسالة واتساب",
    openWhatsapp: "فتح واتساب",
    newFeedbacks: "آراء جديدة",
    inFollowUp: "قيد المتابعة",
    resolvedFeedbacks: "مكتملة",
    moveToFollowUp: "نقل إلى المتابعة",
    moveToResolved: "نقل إلى المكتملة",
    moveToNew: "نقل إلى الآراء الجديدة",
    moving: "جارٍ النقل...",
  },
  en: {
    command: "Feedback control center",
    title: "Customer satisfaction radar",
    subtitle: "Run feedback like an operations room: unhappy customers, rewards, alerts and recovery in one fast view.",
    total: "Total feedback",
    filtered: "Filtered",
    avg: "Average score",
    satisfied: "Satisfied",
    medium: "Medium",
    unhappy: "Unhappy",
    rewards: "Rewards",
    alerts: "Alerts",
    health: "Customer experience health",
    riskQueue: "Urgent recovery queue",
    noRisk: "No urgent cases right now.",
    filters: "Operational filters",
    active: "active",
    clear: "Clear",
    apply: "Apply filters",
    phoneSearch: "Search phone number",
    allSegments: "All segments",
    allRewards: "All rewards",
    withReward: "With reward",
    withoutReward: "Without reward",
    min: "Min",
    max: "Max",
    phone: "Phone",
    score: "Score",
    level: "Level",
    recovery: "Recovery",
    date: "Date",
    noFeedback: "No feedback found.",
    loadMore: "Load more",
    selectTitle: "Select feedback",
    selectSubtitle: "Click a row to view answers, customer history, rewards and recovery cases.",
    loading: "Loading detail...",
    overallScore: "Overall score",
    customerMessage: "Customer message",
    answers: "Answers",
    rewardCodes: "Reward codes",
    noReward: "No reward code.",
    notifications: "Notifications",
    noNotification: "No notification.",
    recoveryTitle: "Customer recovery",
    recoverySubtitle: "Start a follow-up, record the real complaint reason and complete recovery steps.",
    startFollowUp: "Start follow-up",
    starting: "Starting...",
    complaintReason: "Complaint reason",
    complaintPlaceholder: "What was the real reason for the low score?",
    resolutionSummary: "Resolution summary",
    resolutionPlaceholder: "What did management do and how was it solved?",
    optionalNote: "Optional note for this step",
    saveRecovery: "Save recovery",
    markResolved: "Mark resolved",
    solved: "Solved",
    following: "Following",
    notStarted: "Not started",
    priority: "Priority",
    language: "Language",
    whatsapp: "WhatsApp",
    whatsappTitle: "WhatsApp message",
    openWhatsapp: "Open WhatsApp",
    newFeedbacks: "New feedbacks",
    inFollowUp: "In follow-up",
    resolvedFeedbacks: "Resolved",
    moveToFollowUp: "Move to follow-up",
    moveToResolved: "Move to resolved",
    moveToNew: "Move to new feedbacks",
    moving: "Moving...",
  },
} as const;

const segmentOptions: Array<{ value: FeedbackInboxSegmentFilter; key: "allSegments" | "satisfied" | "medium" | "unhappy" }> = [
  { value: "all", key: "allSegments" },
  { value: "satisfied", key: "satisfied" },
  { value: "medium", key: "medium" },
  { value: "unhappy", key: "unhappy" },
];

const rewardOptions: Array<{ value: FeedbackInboxRewardFilter; key: "allRewards" | "withReward" | "withoutReward" }> = [
  { value: "all", key: "allRewards" },
  { value: "with_reward", key: "withReward" },
  { value: "without_reward", key: "withoutReward" },
];

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function segmentVariant(segment: string) {
  if (segment === "satisfied") return "success";
  if (segment === "unhappy") return "danger";
  if (segment === "medium") return "warning";
  return "secondary";
}

function scoreClass(score: number | null | undefined) {
  const value = Number(score ?? 0);
  if (value >= 4) return "text-emerald-200";
  if (value <= 2.5) return "text-red-200";
  return "text-amber-100";
}

function recoveryLabel(status: string | null, t: Record<string, string>) {
  if (!status || status === "not_created") return t.notStarted;
  if (status === "resolved" || status === "closed") return t.solved;
  return t.following;
}

function recoveryVariant(status: string | null) {
  if (status === "resolved" || status === "closed") return "success";
  if (status === "open" || status === "in_progress") return "danger";
  return "secondary";
}

function StatCard({ label, value, tone, icon }: { label: string; value: string | number; tone: string; icon: ReactNode }) {
  return (
    <Card className="group relative overflow-hidden p-4">
      <div className="absolute -right-8 -top-10 h-24 w-24 rounded-full bg-current opacity-[0.06] blur-2xl" />
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--admin-muted)]">{label}</p>
        <span className={tone}>{icon}</span>
      </div>
      <p className={`mt-3 text-3xl font-black tracking-[-0.04em] ${tone}`}>{value}</p>
    </Card>
  );
}

export function FeedbackInbox({ initialState }: FeedbackInboxProps) {
  const { language } = useAdminLanguage();
  const t: Record<string, string> = text[language];
  const [state, setState] = useState(initialState);
  const [segment, setSegment] = useState<FeedbackInboxSegmentFilter>("all");
  const [rewardFilter, setRewardFilter] = useState<FeedbackInboxRewardFilter>("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minScore, setMinScore] = useState("");
  const [maxScore, setMaxScore] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<FeedbackDetail | null>(null);
  const [message, setMessage] = useState<string | null>(initialState.success ? null : initialState.message ?? "Failed to load feedback.");
  const [caseReason, setCaseReason] = useState("");
  const [caseResolution, setCaseResolution] = useState("");
  const [taskNotes, setTaskNotes] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [isDetailPending, startDetailTransition] = useTransition();
  const [isRecoveryPending, startRecoveryTransition] = useTransition();
  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [whatsappText, setWhatsappText] = useState("");
  const [movingFeedbackId, setMovingFeedbackId] = useState<string | null>(null);

  const defaultWhatsappText = (score: number, phone: string) => {
    const name = phone || "Customer";
    if (score <= 2) {
      return language === "fa"
        ? `${name} عزیز، از تجربه‌ای که داشتید متأسفیم. بازخورد شما را با دقت بررسی می‌کنیم و برای پیگیری با شما در ارتباط خواهیم بود.`
        : language === "ar"
          ? `عزيزي ${name}، نأسف لتجربتك. سنراجع ملاحظاتك بعناية ونتابع معك.`
          : `Hi ${name}, we're sorry about your experience. We are reviewing your feedback carefully and will follow up with you.`;
    }
    if (score >= 4) {
      return language === "fa"
        ? `${name} عزیز، ممنون از بازخورد و همراهی شما. خوشحالیم که تجربه خوبی داشتید.`
        : language === "ar"
          ? `عزيزي ${name}، شكرًا لملاحظاتك ودعمك. يسعدنا أنك حظيت بتجربة جيدة.`
          : `Hi ${name}, thank you for your feedback and support. We're glad you had a good experience.`;
    }
    return language === "fa"
      ? `${name} عزیز، ممنون که تجربه‌تان را با ما در میان گذاشتید. بازخورد شما برای بهتر شدن ما ارزشمند است.`
      : language === "ar"
        ? `عزيزي ${name}، شكرًا لمشاركة تجربتك معنا. ملاحظاتك تساعدنا على التحسن.`
        : `Hi ${name}, thank you for sharing your experience. Your feedback helps us improve.`;
  };

  const openWhatsappComposer = async (phone: string, score: number) => {
    setWhatsappPhone(phone);
    const key = score >= 4 ? "feedback_high" : score <= 2 ? "feedback_low" : "feedback_mid";
    const saved = await getWhatsAppTemplateText(key, language);
    const text = (saved || defaultWhatsappText(score, phone))
      .replaceAll("{customer_name}", phone)
      .replaceAll("{score}", String(score));
    setWhatsappText(text);
    setWhatsappOpen(true);
  };

  const launchWhatsapp = () => {
    const normalized = whatsappPhone.replace(/[^0-9]/g, "");
    const url = `https://wa.me/${normalized}?text=${encodeURIComponent(whatsappText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setWhatsappOpen(false);
  };

  const stats = state.stats;
  const pagination = state.pagination;
  useEffect(() => {
    const recovery = selectedDetail?.recoveryCase;
    setCaseReason(recovery?.complaintReason ?? "");
    setCaseResolution(recovery?.resolutionSummary ?? "");
    setTaskNotes(Object.fromEntries((recovery?.tasks ?? []).map((task) => [task.id, task.note ?? ""])));
  }, [selectedDetail]);

  const activeFilterCount = useMemo(() => [segment !== "all", rewardFilter !== "all", search.trim().length > 0, dateFrom.length > 0, dateTo.length > 0, minScore.length > 0, maxScore.length > 0].filter(Boolean).length, [dateFrom, dateTo, maxScore, minScore, rewardFilter, search, segment]);

  const load = (offset = 0) => {
    startTransition(async () => {
      const result = await getAdminFeedbackInbox({
        segment,
        rewardFilter,
        search,
        dateFrom,
        dateTo,
        minScore: minScore ? Number(minScore) : null,
        maxScore: maxScore ? Number(maxScore) : null,
        limit: 200,
        offset,
      });

      if (offset > 0 && result.success) {
        setState((current) => ({ ...result, feedback: [...current.feedback, ...result.feedback] }));
      } else {
        setState(result);
      }

      setMessage(result.success ? null : result.message ?? "Load failed.");
    });
  };

  const clearFilters = () => {
    setSegment("all");
    setRewardFilter("all");
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setMinScore("");
    setMaxScore("");
  };

  const openDetail = (feedbackId: string) => {
    setSelectedId(feedbackId);
    setSelectedDetail(null);
    startDetailTransition(async () => {
      const result = await getAdminFeedbackDetail(feedbackId);
      if (!result.success || !result.feedback) {
        setMessage(result.message ?? "Could not load feedback detail.");
        return;
      }
      setSelectedDetail(result.feedback);
      setMessage(null);
    });
  };

  const applyRecoveryResult = (result: { success: boolean; message?: string; feedback: FeedbackDetail | null }) => {
    if (!result.success || !result.feedback) {
      setMessage(result.message ?? "Recovery update failed.");
      return;
    }
    setSelectedDetail(result.feedback);
    setMessage(null);
  };

  const startRecovery = () => {
    if (!selectedDetail) return;
    startRecoveryTransition(async () => applyRecoveryResult(await startFeedbackRecovery(selectedDetail.id)));
  };

  const saveRecoveryCase = (status?: "open" | "in_progress" | "resolved" | "closed") => {
    const recovery = selectedDetail?.recoveryCase;
    if (!recovery) return;
    startRecoveryTransition(async () => {
      applyRecoveryResult(await updateFeedbackRecoveryCase({ caseId: recovery.id, status, complaintReason: caseReason, resolutionSummary: caseResolution }));
    });
  };

  const toggleRecoveryTask = (taskId: string, currentStatus: "pending" | "done" | "skipped") => {
    startRecoveryTransition(async () => {
      applyRecoveryResult(await updateFeedbackRecoveryTask({ taskId, status: currentStatus === "done" ? "pending" : "done", note: taskNotes[taskId] ?? null }));
    });
  };


  const workflowCounts = useMemo(() => {
    return state.feedback.reduce(
      (counts, item) => {
        counts[item.workflowStage ?? "new"] += 1;
        return counts;
      },
      { new: 0, follow_up: 0, resolved: 0 },
    );
  }, [state.feedback]);

  const feedbackBuckets = useMemo(() => ({
    new: state.feedback.filter((item) => (item.workflowStage ?? "new") === "new"),
    follow_up: state.feedback.filter((item) => item.workflowStage === "follow_up"),
    resolved: state.feedback.filter((item) => item.workflowStage === "resolved"),
  }), [state.feedback]);

  const moveFeedback = (feedbackId: string, targetStage: "new" | "follow_up" | "resolved") => {
    setMovingFeedbackId(feedbackId);
    startTransition(async () => {
      const result = await moveFeedbackWorkflow(feedbackId, targetStage);

      if (!result.success) {
        setMessage(result.message ?? "Could not move feedback.");
        setMovingFeedbackId(null);
        return;
      }

      setState((current) => ({
        ...current,
        feedback: current.feedback.map((item) =>
          item.id === feedbackId ? { ...item, workflowStage: targetStage } : item,
        ),
      }));
      setMessage(null);
      setMovingFeedbackId(null);
    });
  };

  const renderFeedbackTable = (items: typeof state.feedback, stage: "new" | "follow_up" | "resolved") => (
    <Card className="overflow-x-auto p-0">
      <div className="grid min-w-[900px] grid-cols-[minmax(220px,1.6fr)_72px_100px_118px_82px_96px_minmax(160px,0.9fr)_28px] gap-2 border-b border-[color:var(--admin-border)] bg-black/5 px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-[color:var(--admin-muted)]">
        <span>{t.phone}</span><span>{t.score}</span><span>{t.level}</span><span>{t.recovery}</span><span>{t.date}</span><span>{t.whatsapp}</span><span>{language === "fa" ? "مرحله" : language === "ar" ? "المرحلة" : "Stage"}</span><span />
      </div>
      <div className="divide-y divide-[color:var(--admin-border)]">
        {items.length === 0 && <div className="p-6 text-sm text-[color:var(--admin-muted)]">{t.noFeedback}</div>}
        {items.map((item) => (
          <div
            key={item.id}
            role="button"
            tabIndex={0}
            onClick={() => openDetail(item.id)}
            onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") openDetail(item.id); }}
            className={`grid min-h-[58px] min-w-[900px] w-full cursor-pointer grid-cols-[minmax(220px,1.6fr)_72px_100px_118px_82px_96px_minmax(160px,0.9fr)_28px] items-center gap-2 px-4 py-2 text-start transition hover:bg-amber-300/[0.08] ${selectedId === item.id ? "bg-amber-300/[0.10]" : ""}`}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-[color:var(--admin-text)]">{item.phone}</p>
              <p className="truncate text-xs text-[color:var(--admin-muted)]">{item.summary ?? item.customerMessage ?? "—"}</p>
            </div>
            <div className={`flex items-center gap-1 text-sm font-black ${scoreClass(item.overallScore)}`}><Star className="h-3.5 w-3.5" />{Number(item.overallScore || 0).toFixed(1)}</div>
            <Badge variant={segmentVariant(item.segment)}>{item.segment}</Badge>
            <Badge variant={recoveryVariant(item.recoveryStatus)}>{recoveryLabel(item.recoveryStatus, t)}</Badge>
            <p className="text-xs text-[color:var(--admin-muted)]">{item.createdAt.slice(5, 10)}</p>
            <button type="button" onClick={(event) => { event.stopPropagation(); openWhatsappComposer(item.phone, Number(item.overallScore || 0)); }} className="flex items-center justify-center gap-1 whitespace-nowrap rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-2 py-2 text-xs font-bold text-emerald-200"><MessageCircle className="h-3.5 w-3.5" />{t.whatsapp}</button>
              <div className="min-w-0" onClick={(event) => event.stopPropagation()}>
  <select
  value={item.workflowStage ?? "new"}
  disabled={movingFeedbackId === item.id}
  onChange={(event) => moveFeedback(item.id, event.target.value as "new" | "follow_up" | "resolved")}
  className="w-full rounded-xl border border-[color:var(--admin-border)] bg-black/10 px-2 py-2 text-xs font-bold text-[color:var(--admin-text)] outline-none disabled:opacity-50"
  >
  <option value="new">{t.newFeedbacks}</option>
  <option value="follow_up">{t.inFollowUp}</option>
  <option value="resolved">{t.resolvedFeedbacks}</option>
  </select>
  </div>
            <ChevronRight className="h-4 w-4 text-[color:var(--admin-muted)]" />
          </div>
        ))}
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2.25rem] border border-[color:var(--admin-border)] bg-[color:var(--admin-card)] p-6 shadow-2xl shadow-black/10 backdrop-blur-2xl">
        <div className="absolute inset-y-0 right-0 w-2/5 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.22),transparent_55%)]" />
        <div className="relative">
          <div>
            <div className="mb-3 flex items-center gap-2 text-amber-300">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-black uppercase tracking-[0.25em]">{t.command}</span>
            </div>
            <h1 className="text-4xl font-black tracking-[-0.05em] text-[color:var(--admin-text)]">{t.title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--admin-muted)]">{t.subtitle}</p>
          </div>

        </div>
      </section>

      {message && <div className="rounded-3xl border border-amber-300/20 bg-amber-300/[0.10] p-4 text-sm font-semibold text-amber-100">{message}</div>}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label={t.total} value={stats.totalFeedback} tone="text-[color:var(--admin-text)]" icon={<Inbox className="h-5 w-5" />} />
        <StatCard label={t.filtered} value={stats.filteredFeedback ?? pagination.filteredTotal} tone="text-amber-200" icon={<Search className="h-5 w-5" />} />
        <StatCard label={t.avg} value={Number(stats.averageScore || 0).toFixed(1)} tone="text-amber-200" icon={<Star className="h-5 w-5" />} />
        <StatCard label={t.satisfied} value={stats.satisfiedCount} tone="text-emerald-200" icon={<CheckCircle2 className="h-5 w-5" />} />
        <StatCard label={t.unhappy} value={stats.unhappyCount} tone="text-red-200" icon={<AlertTriangle className="h-5 w-5" />} />
      </div>

      <section>
        <Card className="p-5">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-[color:var(--admin-text)]">
              <SlidersHorizontal className="h-5 w-5 text-amber-300" />
              <h2 className="text-lg font-black">{t.filters}</h2>
              {activeFilterCount > 0 && <Badge variant="amber">{activeFilterCount} {t.active}</Badge>}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={clearFilters} disabled={isPending}>{t.clear}</Button>
              <Button onClick={() => load(0)} disabled={isPending}>
                <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
                {t.apply}
              </Button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
            <div className="flex items-center gap-2 rounded-2xl border border-[color:var(--admin-border)] bg-black/10 px-4 py-3 xl:col-span-2">
              <Search className="h-4 w-4 text-[color:var(--admin-muted)]" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t.phoneSearch} className="w-full bg-transparent text-sm text-[color:var(--admin-text)] outline-none placeholder:text-[color:var(--admin-muted)]" />
            </div>
            <select value={segment} onChange={(event) => setSegment(event.target.value as FeedbackInboxSegmentFilter)} className="rounded-2xl border border-[color:var(--admin-border)] bg-black/10 px-4 py-3 text-sm text-[color:var(--admin-text)] outline-none">
              {segmentOptions.map((option) => <option key={option.value} value={option.value}>{t[option.key]}</option>)}
            </select>
            <select value={rewardFilter} onChange={(event) => setRewardFilter(event.target.value as FeedbackInboxRewardFilter)} className="rounded-2xl border border-[color:var(--admin-border)] bg-black/10 px-4 py-3 text-sm text-[color:var(--admin-text)] outline-none">
              {rewardOptions.map((option) => <option key={option.value} value={option.value}>{t[option.key]}</option>)}
            </select>
            <div className="flex items-center gap-2 rounded-2xl border border-[color:var(--admin-border)] bg-black/10 px-4 py-3">
              <CalendarDays className="h-4 w-4 text-[color:var(--admin-muted)]" />
              <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="w-full bg-transparent text-sm text-[color:var(--admin-text)] outline-none [color-scheme:dark]" />
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-[color:var(--admin-border)] bg-black/10 px-4 py-3">
              <CalendarDays className="h-4 w-4 text-[color:var(--admin-muted)]" />
              <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="w-full bg-transparent text-sm text-[color:var(--admin-text)] outline-none [color-scheme:dark]" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" min={1} max={5} value={minScore} onChange={(event) => setMinScore(event.target.value)} placeholder={t.min} className="rounded-2xl border border-[color:var(--admin-border)] bg-black/10 px-4 py-3 text-sm text-[color:var(--admin-text)] outline-none placeholder:text-[color:var(--admin-muted)]" />
              <input type="number" min={1} max={5} value={maxScore} onChange={(event) => setMaxScore(event.target.value)} placeholder={t.max} className="rounded-2xl border border-[color:var(--admin-border)] bg-black/10 px-4 py-3 text-sm text-[color:var(--admin-text)] outline-none placeholder:text-[color:var(--admin-muted)]" />
            </div>
          </div>
        </Card>
      </section>

        <div className="space-y-8">
  {[
  { key: "new" as const, label: t.newFeedbacks, count: workflowCounts.new, items: feedbackBuckets.new },
  { key: "follow_up" as const, label: t.inFollowUp, count: workflowCounts.follow_up, items: feedbackBuckets.follow_up },
  { key: "resolved" as const, label: t.resolvedFeedbacks, count: workflowCounts.resolved, items: feedbackBuckets.resolved },
  ].map((section) => (
  <section key={section.key} className="space-y-3">
  <Card className="p-5">
  <div className="flex items-center justify-between gap-4">
  <h2 className="text-lg font-black text-[color:var(--admin-text)]">{section.label}</h2>
  <span className="text-3xl font-black text-[color:var(--admin-text)]">{section.count}</span>
  </div>
  </Card>
  {renderFeedbackTable(section.items, section.key)}
  </section>
  ))}

        {pagination.hasMore && <div><Button variant="secondary" onClick={() => load(state.feedback.length)} disabled={isPending}>{t.loadMore}</Button></div>}

        <Card className="min-h-[420px] p-5">
          {!selectedId && (
            <div className="flex h-full min-h-[500px] flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-300/[0.10] text-amber-200"><Inbox className="h-7 w-7" /></div>
              <h2 className="mt-4 text-2xl font-black text-[color:var(--admin-text)]">{t.selectTitle}</h2>
              <p className="mt-2 max-w-xs text-sm leading-6 text-[color:var(--admin-muted)]">{t.selectSubtitle}</p>
            </div>
          )}

          {selectedId && isDetailPending && <div className="flex h-full min-h-[500px] flex-col items-center justify-center text-center"><RefreshCw className="h-7 w-7 animate-spin text-amber-200" /><p className="mt-3 text-sm text-[color:var(--admin-muted)]">{t.loading}</p></div>}

          {selectedDetail && !isDetailPending && (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
  <Badge variant={segmentVariant(selectedDetail.segment)}>{selectedDetail.segment}</Badge>
  <Badge variant="secondary">{t.language}: {selectedDetail.language}</Badge>
  <select
  value={state.feedback.find((item) => item.id === selectedDetail.id)?.workflowStage ?? "new"}
  disabled={movingFeedbackId === selectedDetail.id}
  onChange={(event) => moveFeedback(selectedDetail.id, event.target.value as "new" | "follow_up" | "resolved")}
  className="rounded-xl border border-[color:var(--admin-border)] bg-black/10 px-3 py-2 text-xs font-bold text-[color:var(--admin-text)] outline-none disabled:opacity-50"
  >
  <option value="new">{t.newFeedbacks}</option>
  <option value="follow_up">{t.inFollowUp}</option>
  <option value="resolved">{t.resolvedFeedbacks}</option>
  </select>
  </div>
                  <h2 className="text-2xl font-black text-[color:var(--admin-text)]">{selectedDetail.phone}</h2>
                  <p className="mt-1 text-sm text-[color:var(--admin-muted)]">{formatDate(selectedDetail.createdAt)}</p>
                </div>
                <button onClick={() => { setSelectedId(null); setSelectedDetail(null); }} className="rounded-2xl border border-[color:var(--admin-border)] bg-black/5 p-3 text-[color:var(--admin-muted)] hover:bg-black/10"><X className="h-4 w-4" /></button>
              </div>

              <div className="rounded-3xl border border-amber-300/20 bg-amber-300/[0.10] p-4"><div className="flex items-center justify-between"><span className="text-sm text-[color:var(--admin-muted)]">{t.overallScore}</span><span className={`text-4xl font-black ${scoreClass(selectedDetail.overallScore)}`}>{Number(selectedDetail.overallScore || 0).toFixed(1)}</span></div></div>

              {selectedDetail.customerMessage && <div className="rounded-3xl border border-[color:var(--admin-border)] bg-black/10 p-4"><p className="text-sm font-black text-[color:var(--admin-text)]">{t.customerMessage}</p><p className="mt-2 text-sm leading-6 text-[color:var(--admin-muted)]">{selectedDetail.customerMessage}</p></div>}

              {selectedDetail.segment === "unhappy" && (
                <div className="rounded-3xl border border-red-300/15 bg-red-400/10 p-4">
                  <div className="flex items-start gap-3"><ClipboardList className="mt-1 h-5 w-5 text-red-100" /><div><p className="font-black text-[color:var(--admin-text)]">{t.recoveryTitle}</p><p className="mt-1 text-sm leading-6 text-[color:var(--admin-muted)]">{t.recoverySubtitle}</p></div></div>
                  {!selectedDetail.recoveryCase && <button onClick={startRecovery} disabled={isRecoveryPending} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-200 px-4 py-3 text-sm font-black text-black transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"><PhoneCall className="h-4 w-4" />{isRecoveryPending ? t.starting : t.startFollowUp}</button>}

                  {selectedDetail.recoveryCase && (
                    <div className="mt-5 space-y-4">
                      <div className="flex flex-wrap items-center gap-2"><Badge variant={selectedDetail.recoveryCase.status === "resolved" ? "success" : "danger"}>{selectedDetail.recoveryCase.status}</Badge><Badge variant="secondary">{selectedDetail.recoveryCase.priority} {t.priority}</Badge></div>
                      <label className="block"><span className="text-sm text-[color:var(--admin-muted)]">{t.complaintReason}</span><textarea rows={3} value={caseReason} onChange={(event) => setCaseReason(event.target.value)} placeholder={t.complaintPlaceholder} className="mt-2 w-full resize-none rounded-2xl border border-[color:var(--admin-border)] bg-black/10 px-4 py-3 text-sm text-[color:var(--admin-text)] outline-none placeholder:text-[color:var(--admin-muted)]" /></label>
                      <label className="block"><span className="text-sm text-[color:var(--admin-muted)]">{t.resolutionSummary}</span><textarea rows={3} value={caseResolution} onChange={(event) => setCaseResolution(event.target.value)} placeholder={t.resolutionPlaceholder} className="mt-2 w-full resize-none rounded-2xl border border-[color:var(--admin-border)] bg-black/10 px-4 py-3 text-sm text-[color:var(--admin-text)] outline-none placeholder:text-[color:var(--admin-muted)]" /></label>
                      <div className="space-y-2">
                        {selectedDetail.recoveryCase.tasks.map((task) => (
                          <div key={task.id} className="rounded-2xl border border-[color:var(--admin-border)] bg-black/10 p-3">
                            <div className="flex items-start gap-3">
                              <button onClick={() => toggleRecoveryTask(task.id, task.status)} disabled={isRecoveryPending} className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border ${task.status === "done" ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-200" : "border-[color:var(--admin-border)] bg-black/10 text-[color:var(--admin-muted)]"}`}><CheckCircle2 className="h-4 w-4" /></button>
                              <div className="min-w-0 flex-1"><p className="text-sm font-black text-[color:var(--admin-text)]">{task.stepOrder}. {task.title}</p><p className="mt-1 text-xs leading-5 text-[color:var(--admin-muted)]">{task.description}</p><input value={taskNotes[task.id] ?? ""} onChange={(event) => setTaskNotes((current) => ({ ...current, [task.id]: event.target.value }))} placeholder={t.optionalNote} className="mt-2 w-full rounded-xl border border-[color:var(--admin-border)] bg-black/10 px-3 py-2 text-xs text-[color:var(--admin-text)] outline-none placeholder:text-[color:var(--admin-muted)]" /></div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => saveRecoveryCase("in_progress")} disabled={isRecoveryPending}>{t.saveRecovery}</Button><Button onClick={() => saveRecoveryCase("resolved")} disabled={isRecoveryPending}><CheckCircle2 className="h-4 w-4" />{t.markResolved}</Button></div>
                    </div>
                  )}
                </div>
              )}

              <div><p className="mb-3 text-sm font-black text-[color:var(--admin-text)]">{t.answers}</p><div className="space-y-2">{selectedDetail.answers.map((answer) => <div key={answer.id} className="rounded-2xl border border-[color:var(--admin-border)] bg-black/10 p-3"><p className="text-xs font-bold text-[color:var(--admin-muted)]">{answer.questionTextFa ?? answer.questionTextEn ?? answer.questionTextAr ?? answer.questionType}</p><p className="mt-2 text-sm text-[color:var(--admin-text)]">{answer.answerText ?? answer.scoreValue ?? "—"}</p></div>)}</div></div>

              <div><p className="mb-3 text-sm font-black text-[color:var(--admin-text)]">{t.rewardCodes}</p><div className="space-y-2">{selectedDetail.rewardCodes.length === 0 && <div className="rounded-2xl border border-[color:var(--admin-border)] bg-black/10 p-3 text-sm text-[color:var(--admin-muted)]">{t.noReward}</div>}{selectedDetail.rewardCodes.map((code) => <div key={code.id} className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.10] p-3"><div className="flex items-center gap-2 text-amber-100"><Gift className="h-4 w-4" /><span className="font-black tracking-[0.12em]">{code.code}</span></div><p className="mt-1 text-xs text-[color:var(--admin-muted)]">{code.status} • {code.usedCount}/{code.usageLimit}</p></div>)}</div></div>

              <div><p className="mb-3 text-sm font-black text-[color:var(--admin-text)]">{t.notifications}</p><div className="space-y-2">{selectedDetail.notifications.length === 0 && <div className="rounded-2xl border border-[color:var(--admin-border)] bg-black/10 p-3 text-sm text-[color:var(--admin-muted)]">{t.noNotification}</div>}{selectedDetail.notifications.map((notification) => <div key={notification.id} className="rounded-2xl border border-red-300/15 bg-red-400/10 p-3"><p className="text-sm font-black text-[color:var(--admin-text)]">{notification.title}</p><p className="mt-1 text-xs leading-5 text-[color:var(--admin-muted)]">{notification.body}</p></div>)}</div></div>
            </div>
          )}
        </Card>
      </div>
      {whatsappOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[2rem] border border-[color:var(--admin-border)] bg-[color:var(--admin-card)] p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl font-black text-[color:var(--admin-text)]">{t.whatsappTitle}</h3>
              <button type="button" onClick={() => setWhatsappOpen(false)} className="whitespace-nowrap rounded-xl border border-[color:var(--admin-border)] p-2 text-[color:var(--admin-muted)]"><X className="h-4 w-4" /></button>
            </div>
            <textarea rows={7} value={whatsappText} onChange={(event) => setWhatsappText(event.target.value)} className="mt-4 w-full resize-none rounded-2xl border border-[color:var(--admin-border)] bg-[#111318] p-4 text-sm leading-6 text-white outline-none shadow-inner" />
            <div className="mt-4 flex justify-end gap-2"><Button variant="secondary" onClick={() => setWhatsappOpen(false)}>{t.clear}</Button><Button onClick={launchWhatsapp}><MessageCircle className="h-4 w-4" />{t.openWhatsapp}</Button></div>
          </div>
        </div>
      )}
    </div>
  );
}


