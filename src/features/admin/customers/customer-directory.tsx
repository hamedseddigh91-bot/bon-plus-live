"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import {
  AlertTriangle,
  ChevronRight,
  Crown,
  Gift,
  HeartHandshake,
  RefreshCw,
  Search,
  ShieldAlert,
  Star,
  UserRound,
  Users,
  X,
} from "lucide-react";
import {
  type CustomerDirectoryState,
  type CustomerProfile,
  type CustomerRiskFilter,
  getCustomerDirectory,
  getCustomerProfile,
} from "@/app/admin/customers/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAdminLanguage } from "@/lib/admin-language";

type CustomerDirectoryProps = {
  initialState: CustomerDirectoryState;
};

const text = {
  fa: {
    command: "مرکز هوشمند مشتریان",
    title: "CRM وفاداری و بازگشت مشتری",
    subtitle: "مشتری‌ها را فقط لیست نکن؛ تکرار خرید، ریسک از دست رفتن، نارضایتی و پاداش‌ها را سریع ببین.",
    total: "کل مشتریان",
    repeat: "مشتری تکراری",
    lowScore: "امتیاز پایین",
    unhappy: "ناراضی داشته",
    filtered: "فیلتر شده",
    loyaltyHealth: "سلامت وفاداری",
    riskCustomers: "مشتری‌های در خطر",
    noRisk: "فعلاً مشتری پرریسک در این فیلتر دیده نمی‌شود.",
    filters: "فیلترهای CRM",
    active: "فعال",
    apply: "اعمال",
    clear: "پاک کردن",
    searchPhone: "جستجوی شماره موبایل",
    allCustomers: "همه مشتری‌ها",
    repeatCustomers: "مشتری‌های تکراری",
    lowScoreCustomers: "امتیاز پایین",
    hadUnhappyFeedback: "نارضایتی داشته",
    min: "حداقل",
    max: "حداکثر",
    phone: "شماره",
    avg: "میانگین",
    last: "آخرین",
    visits: "بازخورد",
    recovery: "پیگیری",
    noCustomers: "مشتری‌ای پیدا نشد.",
    loadMore: "نمایش بیشتر",
    selectTitle: "یک مشتری انتخاب کن",
    selectSubtitle: "برای دیدن پروفایل، تاریخچه، پاداش‌ها و پرونده‌های پیگیری روی مشتری کلیک کن.",
    loading: "در حال بارگذاری پروفایل...",
    lastSeen: "آخرین مشاهده",
    feedback: "بازخوردها",
    rewards: "پاداش‌ها",
    feedbackHistory: "تاریخچه بازخورد",
    rewardCodes: "کدهای پاداش",
    noReward: "کد پاداشی ندارد.",
    recoveryCases: "پرونده‌های پیگیری",
    noRecovery: "پرونده پیگیری ندارد.",
    customerValue: "ارزش مشتری",
    loyal: "وفادار",
    attention: "نیازمند توجه",
    risk: "ریسک بالا",
    open: "باز",
    profile: "پروفایل مشتری",
  },
  ar: {
    command: "مركز ذكاء العملاء",
    title: "CRM الولاء واستعادة العملاء",
    subtitle: "لا تعرض العملاء كقائمة فقط؛ شاهد التكرار، خطر الفقدان، عدم الرضا والمكافآت بسرعة.",
    total: "إجمالي العملاء",
    repeat: "عملاء متكررون",
    lowScore: "تقييم منخفض",
    unhappy: "لديه عدم رضا",
    filtered: "المفلتر",
    loyaltyHealth: "صحة الولاء",
    riskCustomers: "عملاء معرضون للفقدان",
    noRisk: "لا يوجد عملاء عالي المخاطر في هذا الفلتر حالياً.",
    filters: "فلاتر CRM",
    active: "نشط",
    apply: "تطبيق",
    clear: "مسح",
    searchPhone: "بحث برقم الهاتف",
    allCustomers: "كل العملاء",
    repeatCustomers: "عملاء متكررون",
    lowScoreCustomers: "تقييم منخفض",
    hadUnhappyFeedback: "لديه عدم رضا",
    min: "الأدنى",
    max: "الأعلى",
    phone: "الهاتف",
    avg: "المتوسط",
    last: "آخر مرة",
    visits: "آراء",
    recovery: "المتابعة",
    noCustomers: "لم يتم العثور على عملاء.",
    loadMore: "عرض المزيد",
    selectTitle: "اختر عميلاً",
    selectSubtitle: "اضغط على العميل لعرض الملف، التاريخ، المكافآت والمتابعة.",
    loading: "جاري تحميل الملف...",
    lastSeen: "آخر ظهور",
    feedback: "الآراء",
    rewards: "المكافآت",
    feedbackHistory: "تاريخ الآراء",
    rewardCodes: "أكواد المكافآت",
    noReward: "لا يوجد كود مكافأة.",
    recoveryCases: "حالات المتابعة",
    noRecovery: "لا توجد حالة متابعة.",
    customerValue: "قيمة العميل",
    loyal: "وفي",
    attention: "يحتاج اهتمام",
    risk: "خطر عالي",
    open: "مفتوح",
    profile: "ملف العميل",
  },
  en: {
    command: "Customer intelligence center",
    title: "Loyalty and recovery CRM",
    subtitle: "Do not just list customers; see repeats, churn risk, unhappy history and rewards in one fast command view.",
    total: "Total customers",
    repeat: "Repeat customers",
    lowScore: "Low score",
    unhappy: "Had unhappy",
    filtered: "Filtered",
    loyaltyHealth: "Loyalty health",
    riskCustomers: "At-risk customers",
    noRisk: "No high-risk customers in this filter right now.",
    filters: "CRM filters",
    active: "active",
    apply: "Apply",
    clear: "Clear",
    searchPhone: "Search phone number",
    allCustomers: "All customers",
    repeatCustomers: "Repeat customers",
    lowScoreCustomers: "Low score",
    hadUnhappyFeedback: "Had unhappy feedback",
    min: "Min",
    max: "Max",
    phone: "Phone",
    avg: "Average",
    last: "Last",
    visits: "Feedback",
    recovery: "Recovery",
    noCustomers: "No customers found.",
    loadMore: "Load more",
    selectTitle: "Select customer",
    selectSubtitle: "Click a customer to review profile, history, rewards and recovery cases.",
    loading: "Loading profile...",
    lastSeen: "Last seen",
    feedback: "Feedback",
    rewards: "Rewards",
    feedbackHistory: "Feedback history",
    rewardCodes: "Reward codes",
    noReward: "No reward code.",
    recoveryCases: "Recovery cases",
    noRecovery: "No recovery case.",
    customerValue: "Customer value",
    loyal: "Loyal",
    attention: "Needs attention",
    risk: "High risk",
    open: "open",
    profile: "Customer profile",
  },
} as const;

const riskOptions: Array<{ value: CustomerRiskFilter; key: "allCustomers" | "repeatCustomers" | "lowScoreCustomers" | "hadUnhappyFeedback" }> = [
  { value: "all", key: "allCustomers" },
  { value: "repeat", key: "repeatCustomers" },
  { value: "low_score", key: "lowScoreCustomers" },
  { value: "unhappy", key: "hadUnhappyFeedback" },
];

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function segmentVariant(segment: string | null) {
  if (segment === "satisfied") return "success";
  if (segment === "unhappy") return "danger";
  if (segment === "medium") return "warning";
  return "secondary";
}

function scoreClass(score: number | null | undefined) {
  const value = Number(score ?? 0);
  if (!value) return "text-[color:var(--admin-muted)]";
  if (value >= 4) return "text-emerald-200";
  if (value <= 2.5) return "text-red-200";
  return "text-amber-100";
}

function customerTier(score: number | null | undefined, openRecoveryCount: number, feedbackCount: number, t: Record<string, string>) {
  const value = Number(score ?? 0);
  if (openRecoveryCount > 0 || (value > 0 && value <= 2.5)) return { label: t.risk, variant: "danger" as const, icon: <ShieldAlert className="h-4 w-4" /> };
  if (feedbackCount >= 2 && value >= 4) return { label: t.loyal, variant: "success" as const, icon: <Crown className="h-4 w-4" /> };
  return { label: t.attention, variant: "warning" as const, icon: <HeartHandshake className="h-4 w-4" /> };
}

function StatCard({ label, value, tone, icon }: { label: string; value: string | number; tone: string; icon: ReactNode }) {
  return (
    <Card className="relative overflow-hidden p-4">
      <div className="absolute -right-8 -top-10 h-24 w-24 rounded-full" style={{ background: "radial-gradient(circle, currentColor, transparent 70%)", opacity: 0.1 }} />
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--admin-muted)]">{label}</p>
        <span className={tone}>{icon}</span>
      </div>
      <p className={`mt-3 text-3xl font-black tracking-[-0.04em] ${tone}`}>{value}</p>
    </Card>
  );
}

export function CustomerDirectory({ initialState }: CustomerDirectoryProps) {
  const { language } = useAdminLanguage();
  const t: Record<string, string> = text[language];
  const [state, setState] = useState(initialState);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<CustomerRiskFilter>("all");
  const [minScore, setMinScore] = useState("");
  const [maxScore, setMaxScore] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [message, setMessage] = useState<string | null>(initialState.success ? null : initialState.message ?? "Failed to load customers.");
  const [isPending, startTransition] = useTransition();
  const [isDetailPending, startDetailTransition] = useTransition();

  const stats = state.stats;
  const pagination = state.pagination;

  const activeFilterCount = useMemo(() => [search.trim().length > 0, riskFilter !== "all", minScore.length > 0, maxScore.length > 0].filter(Boolean).length, [maxScore, minScore, riskFilter, search]);

  const loyaltyHealth = useMemo(() => {
    const total = Math.max(Number(stats.total || 0), 1);
    return Math.round((Number(stats.repeatCustomers || 0) / total) * 100);
  }, [stats.repeatCustomers, stats.total]);

  const atRiskCustomers = useMemo(
    () => state.customers.filter((item) => item.openRecoveryCount > 0 || item.lastFeedbackSegment === "unhappy" || Number(item.averageScore || 0) <= 2.5).slice(0, 6),
    [state.customers],
  );

  const load = (offset = 0) => {
    startTransition(async () => {
      const result = await getCustomerDirectory({
        search,
        riskFilter,
        minScore: minScore ? Number(minScore) : null,
        maxScore: maxScore ? Number(maxScore) : null,
        limit: 25,
        offset,
      });

      if (offset > 0 && result.success) {
        setState((current) => ({ ...result, customers: [...current.customers, ...result.customers] }));
      } else {
        setState(result);
      }

      setMessage(result.success ? null : result.message ?? "Load failed.");
    });
  };

  const clearFilters = () => {
    setSearch("");
    setRiskFilter("all");
    setMinScore("");
    setMaxScore("");
  };

  const openProfile = (customerId: string) => {
    setSelectedId(customerId);
    setProfile(null);
    startDetailTransition(async () => {
      const result = await getCustomerProfile(customerId);
      if (!result.success || !result.customer) {
        setMessage(result.message ?? "Could not load customer profile.");
        return;
      }
      setProfile(result.customer);
      setMessage(null);
    });
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2.25rem] border border-[color:var(--admin-border)] bg-[color:var(--admin-card)] p-6 shadow-2xl shadow-black/10">
        <div className="absolute inset-y-0 right-0 w-2/5 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.22),transparent_55%)]" />
        <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-amber-300">
              <Users className="h-5 w-5" />
              <span className="text-sm font-black uppercase tracking-[0.25em]">{t.command}</span>
            </div>
            <h1 className="text-4xl font-black tracking-[-0.05em] text-[color:var(--admin-text)]">{t.title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--admin-muted)]">{t.subtitle}</p>
          </div>

          <Card className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[color:var(--admin-muted)]">{t.loyaltyHealth}</p>
                <p className="mt-2 text-4xl font-black text-[color:var(--admin-text)]">{loyaltyHealth}%</p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-300/[0.12] text-emerald-200">
                <HeartHandshake className="h-7 w-7" />
              </div>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-black/10">
              <div className="h-full rounded-full bg-emerald-300" style={{ width: `${Math.max(4, loyaltyHealth)}%` }} />
            </div>
          </Card>
        </div>
      </section>

      {message && <div className="rounded-3xl border border-amber-300/20 bg-amber-300/[0.10] p-4 text-sm font-semibold text-amber-100">{message}</div>}

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatCard label={t.total} value={stats.total} tone="text-[color:var(--admin-text)]" icon={<Users className="h-5 w-5" />} />
        <StatCard label={t.repeat} value={stats.repeatCustomers} tone="text-emerald-200" icon={<Crown className="h-5 w-5" />} />
        <StatCard label={t.lowScore} value={stats.lowScoreCustomers} tone="text-red-200" icon={<ShieldAlert className="h-5 w-5" />} />
        <StatCard label={t.unhappy} value={stats.unhappyCustomers} tone="text-red-200" icon={<AlertTriangle className="h-5 w-5" />} />
        <StatCard label={t.filtered} value={stats.filtered} tone="text-amber-200" icon={<Search className="h-5 w-5" />} />
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="p-5">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-[color:var(--admin-text)]">
              <Search className="h-5 w-5 text-amber-300" />
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

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_230px_90px_90px]">
            <div className="flex items-center gap-2 rounded-2xl border border-[color:var(--admin-border)] bg-black/10 px-4 py-3">
              <Search className="h-4 w-4 text-[color:var(--admin-muted)]" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t.searchPhone} className="w-full bg-transparent text-sm text-[color:var(--admin-text)] outline-none placeholder:text-[color:var(--admin-muted)]" />
            </div>

            <select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value as CustomerRiskFilter)} className="rounded-2xl border border-[color:var(--admin-border)] bg-black/10 px-4 py-3 text-sm text-[color:var(--admin-text)] outline-none">
              {riskOptions.map((option) => <option key={option.value} value={option.value}>{t[option.key]}</option>)}
            </select>

            <input type="number" min={1} max={5} value={minScore} onChange={(event) => setMinScore(event.target.value)} placeholder={t.min} className="rounded-2xl border border-[color:var(--admin-border)] bg-black/10 px-4 py-3 text-sm text-[color:var(--admin-text)] outline-none placeholder:text-[color:var(--admin-muted)]" />
            <input type="number" min={1} max={5} value={maxScore} onChange={(event) => setMaxScore(event.target.value)} placeholder={t.max} className="rounded-2xl border border-[color:var(--admin-border)] bg-black/10 px-4 py-3 text-sm text-[color:var(--admin-text)] outline-none placeholder:text-[color:var(--admin-muted)]" />
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-[color:var(--admin-text)]">{t.riskCustomers}</h2>
              <p className="mt-1 text-xs text-[color:var(--admin-muted)]">{t.lowScore} / {t.unhappy} / {t.recovery}</p>
            </div>
            <ShieldAlert className="h-5 w-5 text-red-200" />
          </div>
          <div className="space-y-2">
            {atRiskCustomers.length === 0 && <p className="rounded-2xl border border-[color:var(--admin-border)] bg-black/10 p-4 text-sm text-[color:var(--admin-muted)]">{t.noRisk}</p>}
            {atRiskCustomers.map((item) => {
              const tier = customerTier(item.averageScore, item.openRecoveryCount, item.feedbackCount, t);
              return (
                <button key={item.id} onClick={() => openProfile(item.id)} className="w-full rounded-2xl border border-red-300/15 bg-red-400/10 p-3 text-start transition hover:bg-red-400/15">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-black text-[color:var(--admin-text)]">{item.phone}</p>
                    <Badge variant={tier.variant}>{tier.label}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-[color:var(--admin-muted)]">{t.avg}: {Number(item.averageScore || 0).toFixed(1)} / {t.recovery}: {item.openRecoveryCount}</p>
                </button>
              );
            })}
          </div>
        </Card>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
        <Card className="overflow-hidden p-0">
          <div className="grid grid-cols-[minmax(110px,1fr)_84px_106px_86px_92px_28px] gap-2 border-b border-[color:var(--admin-border)] bg-black/5 px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-[color:var(--admin-muted)]">
            <span>{t.phone}</span><span>{t.avg}</span><span>{t.customerValue}</span><span>{t.visits}</span><span>{t.recovery}</span><span />
          </div>

          <div className="divide-y divide-[color:var(--admin-border)]">
            {state.customers.length === 0 && <div className="p-6 text-sm text-[color:var(--admin-muted)]">{t.noCustomers}</div>}

            {state.customers.map((item) => {
              const tier = customerTier(item.averageScore, item.openRecoveryCount, item.feedbackCount, t);
              return (
                <button key={item.id} onClick={() => openProfile(item.id)} className={`grid min-h-[58px] w-full grid-cols-[minmax(110px,1fr)_84px_106px_86px_92px_28px] items-center gap-2 px-4 py-2 text-start transition hover:bg-amber-300/[0.08] ${selectedId === item.id ? "bg-amber-300/[0.10]" : ""}`}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-[color:var(--admin-text)]">{item.phone}</p>
                    <p className="truncate text-xs text-[color:var(--admin-muted)]">{t.lastSeen}: {formatDate(item.lastSeenAt)}</p>
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-black ${scoreClass(item.averageScore)}`}><Star className="h-3.5 w-3.5" />{Number(item.averageScore || 0).toFixed(1)}</div>
                  <Badge variant={tier.variant} className="gap-1">{tier.icon}{tier.label}</Badge>
                  <p className="text-xs font-bold text-[color:var(--admin-muted)]">{item.feedbackCount}</p>
                  <p className={item.openRecoveryCount > 0 ? "text-xs font-black text-red-200" : "text-xs text-[color:var(--admin-muted)]"}>{item.openRecoveryCount > 0 ? `${item.openRecoveryCount} ${t.open}` : "—"}</p>
                  <ChevronRight className="h-4 w-4 text-[color:var(--admin-muted)]" />
                </button>
              );
            })}
          </div>

          {pagination.hasMore && <div className="border-t border-[color:var(--admin-border)] p-3"><Button variant="secondary" onClick={() => load(state.customers.length)} disabled={isPending}>{t.loadMore}</Button></div>}
        </Card>

        <Card className="min-h-[560px] p-5">
          {!selectedId && (
            <div className="flex h-full min-h-[500px] flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-300/[0.10] text-amber-200"><UserRound className="h-7 w-7" /></div>
              <h2 className="mt-4 text-2xl font-black text-[color:var(--admin-text)]">{t.selectTitle}</h2>
              <p className="mt-2 max-w-xs text-sm leading-6 text-[color:var(--admin-muted)]">{t.selectSubtitle}</p>
            </div>
          )}

          {selectedId && isDetailPending && <div className="flex h-full min-h-[500px] flex-col items-center justify-center"><RefreshCw className="h-7 w-7 animate-spin text-amber-200" /><p className="mt-3 text-sm text-[color:var(--admin-muted)]">{t.loading}</p></div>}

          {profile && !isDetailPending && (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge variant="amber">{t.profile}</Badge>
                  <h2 className="mt-3 text-2xl font-black text-[color:var(--admin-text)]">{profile.phone}</h2>
                  <p className="mt-1 text-sm text-[color:var(--admin-muted)]">{t.lastSeen}: {formatDate(profile.lastSeenAt)}</p>
                </div>
                <button onClick={() => { setSelectedId(null); setProfile(null); }} className="rounded-2xl border border-[color:var(--admin-border)] bg-black/5 p-3 text-[color:var(--admin-muted)] hover:bg-black/10"><X className="h-4 w-4" /></button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-[color:var(--admin-border)] bg-black/10 p-3"><p className="text-xs text-[color:var(--admin-muted)]">{t.avg}</p><p className={`mt-1 text-xl font-black ${scoreClass(profile.averageScore)}`}>{Number(profile.averageScore || 0).toFixed(1)}</p></div>
                <div className="rounded-2xl border border-[color:var(--admin-border)] bg-black/10 p-3"><p className="text-xs text-[color:var(--admin-muted)]">{t.feedback}</p><p className="mt-1 text-xl font-black text-[color:var(--admin-text)]">{profile.feedbackCount}</p></div>
                <div className="rounded-2xl border border-[color:var(--admin-border)] bg-black/10 p-3"><p className="text-xs text-[color:var(--admin-muted)]">{t.rewards}</p><p className="mt-1 text-xl font-black text-amber-100">{profile.rewardCodes.length}</p></div>
              </div>

              <div>
                <p className="mb-3 text-sm font-black text-[color:var(--admin-text)]">{t.feedbackHistory}</p>
                <div className="space-y-2">
                  {profile.feedback.map((feedback) => (
                    <div key={feedback.id} className="rounded-2xl border border-[color:var(--admin-border)] bg-black/10 p-3">
                      <div className="flex items-center justify-between gap-3"><Badge variant={segmentVariant(feedback.segment)}>{feedback.segment}</Badge><span className={`text-sm font-black ${scoreClass(feedback.overallScore)}`}>{Number(feedback.overallScore || 0).toFixed(1)}</span></div>
                      <p className="mt-2 text-xs text-[color:var(--admin-muted)]">{formatDate(feedback.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-black text-[color:var(--admin-text)]">{t.rewardCodes}</p>
                <div className="space-y-2">
                  {profile.rewardCodes.length === 0 && <div className="rounded-2xl border border-[color:var(--admin-border)] bg-black/10 p-3 text-sm text-[color:var(--admin-muted)]">{t.noReward}</div>}
                  {profile.rewardCodes.map((code) => (
                    <div key={code.id} className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.10] p-3">
                      <div className="flex items-center gap-2 text-amber-100"><Gift className="h-4 w-4" /><span className="font-black tracking-[0.12em]">{code.code}</span></div>
                      <p className="mt-1 text-xs text-[color:var(--admin-muted)]">{code.status} • {code.usedCount}/{code.usageLimit}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-black text-[color:var(--admin-text)]">{t.recoveryCases}</p>
                <div className="space-y-2">
                  {profile.recoveryCases.length === 0 && <div className="rounded-2xl border border-[color:var(--admin-border)] bg-black/10 p-3 text-sm text-[color:var(--admin-muted)]">{t.noRecovery}</div>}
                  {profile.recoveryCases.map((recovery) => (
                    <div key={recovery.id} className="rounded-2xl border border-red-300/15 bg-red-400/10 p-3">
                      <div className="flex items-center justify-between gap-3"><Badge variant={recovery.status === "resolved" ? "success" : "danger"}>{recovery.status}</Badge><span className="text-xs text-[color:var(--admin-muted)]">{formatDate(recovery.createdAt)}</span></div>
                      {recovery.complaintReason && <p className="mt-2 text-xs leading-5 text-[color:var(--admin-muted)]">{recovery.complaintReason}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
