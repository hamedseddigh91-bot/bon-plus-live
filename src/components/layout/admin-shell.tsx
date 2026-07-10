"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  ClipboardList,
  Crown,
  Grid2X2,
  History,
  Languages,
  LogOut,
  Menu,
  Moon,
  HeartHandshake,
  Search,
  Settings2,
  Sparkles,
  Sun,
  X,
  WalletCards,
} from "lucide-react";
import { signOut } from "@/app/login/actions";
import type { BusinessListItem } from "@/app/admin/business/actions";
import { BusinessSwitcher } from "@/components/layout/business-switcher";
import {
  AdminLanguageProvider,
  adminLanguageOptions,
  adminThemeOptions,
  adminText,
  type AdminLanguage,
  useAdminLanguage,
} from "@/lib/admin-language";
import { AdminPermissionsProvider } from "@/lib/admin-permissions";

type BusinessRole = "owner" | "manager" | "accountant" | "staff" | "read_only";

type AdminShellProps = {
  children: ReactNode;
  businesses?: BusinessListItem[];
  currentBusinessSlug?: string;
  businessLogoUrl?: string | null;
  role?: BusinessRole;
  userEmail?: string;
  isPlatformAdmin?: boolean;
  modulePermissions?: Record<string, { view: boolean; edit: boolean }>;
};

type LabelKey =
  | "dashboard"
  | "actionCenter"
  | "finance"
  | "financeClosing"
  | "financeInvoices"
  | "financeCash"
  | "crm"
  | "feedback"
  | "recovery"
  | "customers"
  | "recipes"
  | "settings"
  | "questions"
  | "rewards"
  | "discounts"
  | "reports"
  | "activityLogs"
  | "users"
  | "system";

type NavChildItem = {
  labelKey: LabelKey;
  href: string;
  exact?: boolean;
};

type NavItem = {
  labelKey: LabelKey;
  href: string;
  icon: LucideIcon;
  module: string;
  exact?: boolean;
  children?: NavChildItem[];
};

const roleModules: Record<BusinessRole, string[]> = {
  owner: [
    "dashboard",
    "operations",
    "feedback",
    "recovery",
    "customers",
    "settings",
    "questions",
    "rewards",
    "discounts",
    "reports",
    "activity_logs",
    "users",
    "system",
  ],
  manager: [
    "dashboard",
    "operations",
    "feedback",
    "recovery",
    "customers",
    "settings",
    "questions",
    "rewards",
    "discounts",
    "reports",
    "activity_logs",
  ],
  accountant: ["dashboard", "operations", "reports"],
  staff: ["dashboard", "feedback", "recovery", "customers"],
  read_only: ["dashboard", "reports"],
};

const navItems: NavItem[] = [
  {
    labelKey: "dashboard",
    href: "/admin",
    icon: Grid2X2,
    module: "dashboard",
    exact: true,
  },
  {
    labelKey: "actionCenter",
    href: "/admin/action-center",
    icon: ClipboardList,
    module: "action_center",
  },
  {
    labelKey: "finance",
    href: "/admin/finance/closing",
    icon: WalletCards,
    module: "operations",
    children: [
      { labelKey: "financeClosing", href: "/admin/finance/closing" },
      { labelKey: "financeInvoices", href: "/admin/finance/invoices" },
      { labelKey: "financeCash", href: "/admin/finance/cash" },
      { labelKey: "recipes", href: "/admin/finance/costing" },
    ],
  },
  {
    labelKey: "crm",
    href: "/admin/crm/feedback",
    icon: HeartHandshake,
    module: "feedback",
    children: [
      { labelKey: "feedback", href: "/admin/crm/feedback" },
      { labelKey: "recovery", href: "/admin/crm/follow-ups" },
      { labelKey: "customers", href: "/admin/crm/customers" },
      { labelKey: "discounts", href: "/admin/crm/discounts" },
      { labelKey: "rewards", href: "/admin/crm/loyalty" },
    ],
  },
  {
    labelKey: "settings",
    href: "/admin/settings",
    icon: Settings2,
    module: "settings",
  },
  {
    labelKey: "reports",
    href: "/admin/reports",
    icon: BarChart3,
    module: "reports",
  },
  {
    labelKey: "activityLogs",
    href: "/admin/activity-logs",
    icon: History,
    module: "activity_logs",
  },
  
];

type AdminCopy = (typeof adminText)[AdminLanguage];

const pageMetaByPath: Array<{
  test: (pathname: string) => boolean;
  titleKey: keyof AdminCopy;
  subtitleKey: keyof AdminCopy;
}> = [
  {
    test: (path) => path === "/admin",
    titleKey: "pageDashboardTitle",
    subtitleKey: "pageDashboardSubtitle",
  },
  {
    test: (path) => path.startsWith("/admin/finance"),
    titleKey: "pageFinanceTitle",
    subtitleKey: "pageFinanceSubtitle",
  },
  {
    test: (path) => path.startsWith("/admin/crm"),
    titleKey: "pageCrmTitle",
    subtitleKey: "pageCrmSubtitle",
  },
  {
    test: (path) => path.startsWith("/admin/recipes"),
    titleKey: "pageRecipesTitle",
    subtitleKey: "pageRecipesSubtitle",
  },
  {
    test: (path) => path.startsWith("/admin/feedback"),
    titleKey: "pageFeedbackTitle",
    subtitleKey: "pageFeedbackSubtitle",
  },
  {
    test: (path) => path.startsWith("/admin/recovery"),
    titleKey: "pageRecoveryTitle",
    subtitleKey: "pageRecoverySubtitle",
  },
  {
    test: (path) => path.startsWith("/admin/customers"),
    titleKey: "pageCustomersTitle",
    subtitleKey: "pageCustomersSubtitle",
  },
  {
    test: (path) => path.startsWith("/admin/settings"),
    titleKey: "pageSettingsTitle",
    subtitleKey: "pageSettingsSubtitle",
  },
  {
    test: (path) => path.startsWith("/admin/questions"),
    titleKey: "pageQuestionsTitle",
    subtitleKey: "pageQuestionsSubtitle",
  },
  {
    test: (path) => path.startsWith("/admin/rewards"),
    titleKey: "pageRewardsTitle",
    subtitleKey: "pageRewardsSubtitle",
  },
  {
    test: (path) => path.startsWith("/admin/discounts"),
    titleKey: "pageDiscountsTitle",
    subtitleKey: "pageDiscountsSubtitle",
  },
  {
    test: (path) => path.startsWith("/admin/reports"),
    titleKey: "pageReportsTitle",
    subtitleKey: "pageReportsSubtitle",
  },
  {
    test: (path) => path.startsWith("/admin/activity-logs"),
    titleKey: "pageActivityLogsTitle",
    subtitleKey: "pageActivityLogsSubtitle",
  },
  {
    test: (path) => path.startsWith("/admin/users"),
    titleKey: "pageUsersTitle",
    subtitleKey: "pageUsersSubtitle",
  },
  {
    test: (path) => path.startsWith("/admin/system-status"),
    titleKey: "pageSystemTitle",
    subtitleKey: "pageSystemSubtitle",
  },
];

function isActivePath(
  pathname: string,
  item: { href: string; exact?: boolean },
) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function pageKeyFromPath(pathname: string) {
  if (pathname === "/admin") return "dashboard";
  if (pathname.startsWith("/admin/action-center")) return "action-center";
  if (pathname.startsWith("/admin/finance")) return "finance";
  if (pathname.startsWith("/admin/crm")) return "crm";
  if (pathname.startsWith("/admin/recipes")) return "recipes";
  if (pathname.startsWith("/admin/feedback")) return "feedback";
  if (pathname.startsWith("/admin/recovery")) return "recovery";
  if (pathname.startsWith("/admin/customers")) return "customers";
  if (pathname.startsWith("/admin/settings")) return "settings";
  if (pathname.startsWith("/admin/questions")) return "questions";
  if (pathname.startsWith("/admin/rewards")) return "rewards";
  if (pathname.startsWith("/admin/discounts")) return "discounts";
  if (pathname.startsWith("/admin/reports")) return "reports";
  if (pathname.startsWith("/admin/activity-logs")) return "activity-logs";
  if (pathname.startsWith("/admin/users")) return "users";
  if (pathname.startsWith("/admin/system-status")) return "system";
  return "admin";
}

function AdminShellInner({
  children,
  businesses = [],
  currentBusinessSlug = "",
  businessLogoUrl = null,
  role = "owner",
  userEmail = "",
  isPlatformAdmin = false,
  modulePermissions = {}, }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { language, setLanguage, theme, setTheme, dir, t } = useAdminLanguage();
  const [isSigningOut, startSignOut] = useTransition();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [permissionNoticeOpen, setPermissionNoticeOpen] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("permissionDenied") !== "1") return;

    setPermissionNoticeOpen(true);
    url.searchParams.delete("permissionDenied");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);

    const timeout = window.setTimeout(() => setPermissionNoticeOpen(false), 5000);
    return () => window.clearTimeout(timeout);
  }, [pathname]);
  const visibleModules = roleModules[role] ?? roleModules.read_only;
  const permissionKeysForNav = (item: NavItem) => {
    if (item.href === "/admin") return ["dashboard"];
    if (item.href.startsWith("/admin/action-center")) return ["action_center"];
    if (item.href.startsWith("/admin/finance")) return ["finance_closing", "finance_invoices", "finance_cash", "costing"];
    if (item.href.startsWith("/admin/crm")) return ["feedback", "followups", "customers", "discounts", "loyalty"];
    if (item.href.startsWith("/admin/settings")) return ["settings_general", "settings_feedback", "settings_users", "settings_whatsapp"];
    if (item.href.startsWith("/admin/reports")) return ["reports"];
    if (item.href.startsWith("/admin/activity-logs")) return ["activity_logs"];
    if (item.href.startsWith("/admin/system-status")) return ["system"];
    return [item.module];
  };
  const visibleNavItems = useMemo(() => navItems.filter((item) => {
    const keys = permissionKeysForNav(item);
    const explicitRows = keys.map((key) => modulePermissions[key]).filter(Boolean);
    if (explicitRows.length > 0) return explicitRows.some((permission) => permission.view);
    return visibleModules.includes(item.module);
  }), [visibleModules, modulePermissions]);
  const settingsLandingHref = useMemo(() => {
    if (role === "owner" || isPlatformAdmin) return "/admin/settings/general";

    const routes = [
      ["settings_general", "/admin/settings/general"],
      ["settings_feedback", "/admin/settings/feedback"],
      ["settings_users", "/admin/settings/users"],
      ["settings_whatsapp", "/admin/settings/whatsapp-messages"],
    ] as const;
    const explicitRoute = routes.find(([key]) => modulePermissions[key]?.view);

    if (explicitRoute) return explicitRoute[1];
    return visibleModules.includes("settings") ? "/admin/settings/general" : "/admin";
  }, [isPlatformAdmin, modulePermissions, role, visibleModules]);
  const navHref = (item: NavItem) => item.href === "/admin/settings" ? settingsLandingHref : item.href;
  const currentMeta =
    pageMetaByPath.find((item) => item.test(pathname)) ?? pageMetaByPath[0];
  const currentPageKey = pageKeyFromPath(pathname);

  const warmRoute = (href: string) => {
    if (href !== pathname) router.prefetch(href);
  };

  return (
    <AdminPermissionsProvider permissions={modulePermissions} role={role} isPlatformAdmin={isPlatformAdmin}>
    <div
      className="bp-admin-shell min-h-screen overflow-hidden bg-[#06070b] text-white transition-colors duration-500"
      dir={dir}
      lang={language}
      data-admin-theme={theme}
      data-admin-page={currentPageKey}
      style={{
        fontFamily: language === "fa" ? "var(--font-persian)" : undefined,
      }}
    >
      {permissionNoticeOpen && (
        <div className="fixed inset-x-0 top-5 z-[120] flex justify-center px-4" role="status" aria-live="polite">
          <div className="flex w-full max-w-md items-start gap-3 rounded-2xl border border-amber-300/25 bg-[#17130b]/95 px-4 py-3 text-amber-50 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-300/15 text-amber-200">!</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black">
                {language === "fa" ? "دسترسی محدود" : language === "ar" ? "صلاحية محدودة" : "Permission required"}
              </p>
              <p className="mt-1 text-xs leading-5 text-amber-50/75">
                {language === "fa"
                  ? "شما اجازه انجام این تغییر را ندارید. برای دسترسی ویرایش با مدیر سیستم تماس بگیرید."
                  : language === "ar"
                    ? "ليس لديك صلاحية لإجراء هذا التغيير. تواصل مع مدير النظام للحصول على صلاحية التعديل."
                    : "You do not have permission to make this change. Contact an administrator for edit access."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPermissionNoticeOpen(false)}
              className="rounded-lg p-1 text-amber-50/55 transition hover:bg-white/10 hover:text-amber-50"
              aria-label="Close permission notice"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="bp-orb bp-orb-1" />
        <div className="bp-orb bp-orb-2" />
        <div className="bp-orb bp-orb-3" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_30%)]" />
      </div>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation overlay"
            className="absolute inset-0 bg-black/72 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
          />

          <aside
            className={`absolute top-0 h-full w-[min(88vw,360px)] overflow-y-auto overscroll-contain px-4 py-4 shadow-[0_24px_90px_rgba(0,0,0,0.45)] backdrop-blur-2xl ${
              theme === "light"
                ? "border-slate-200 bg-white/98 text-slate-900"
                : "border-white/10 bg-[#080a10]/96 text-white"
            }`}
            style={
              dir === "rtl"
                ? { right: 0, borderLeftWidth: 1 }
                : { left: 0, borderRightWidth: 1 }
            }
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <Link
                href="/admin"
                prefetch
                onClick={() => setMobileNavOpen(false)}
                className="flex min-w-0 items-center gap-3 rounded-[1.35rem] border border-white/10 bg-white/[0.05] p-3"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.1rem] bg-gradient-to-br from-amber-200 via-yellow-300 to-orange-400 text-sm font-black text-black">{businessLogoUrl ? <img src={businessLogoUrl} alt="Business logo" className="block h-full w-full rounded-[inherit] object-cover object-center" /> : "BP"}</div>
                <div className="min-w-0">
                  <p
                    className={`truncate text-base font-bold ${theme === "light" ? "text-slate-950" : "text-white"}`}
                  >
                    {t.appName}
                  </p>
                  <p
                    className={`truncate text-xs ${theme === "light" ? "text-slate-500" : "text-white/42"}`}
                  >
                    {t.appSubtitle}
                  </p>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${theme === "light" ? "border-slate-200 bg-slate-100 text-slate-700" : "border-white/10 bg-white/[0.06] text-white/70"}`}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {businesses.length > 0 && (
              <div className="mb-4 overflow-hidden rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-2">
                <BusinessSwitcher
                  businesses={businesses}
                  currentSlug={currentBusinessSlug}
                />
              </div>
            )}

            <div
              className={`mb-4 rounded-[1.25rem] border px-4 py-3 ${theme === "light" ? "border-slate-200 bg-slate-50" : "border-white/10 bg-white/[0.045]"}`}
            >
              <p
                className={`truncate text-xs ${theme === "light" ? "text-slate-500" : "text-white/40"}`}
              >
                {userEmail}
              </p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-200">
                  {role.replace("_", " ")}
                </p>
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-[10px] font-bold text-emerald-100">
                  {t.ready}
                </span>
              </div>
            </div>

            <nav className="space-y-1 pb-8">
              {isPlatformAdmin && (
                <Link
                  href="/platform"
                  prefetch
                  onClick={() => setMobileNavOpen(false)}
                  className={`group flex h-12 items-center gap-4 rounded-[1.15rem] px-4 text-[15px] font-semibold transition ${
                    pathname.startsWith("/platform")
                      ? "bg-gradient-to-r from-amber-200 to-yellow-300 text-black shadow-[0_18px_50px_rgba(251,191,36,0.20)]"
                      : theme === "light"
                        ? "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                        : "text-white/58 hover:bg-white/[0.07] hover:text-white"
                  }`}
                >
                  <Crown className="h-5 w-5 shrink-0" />
                  <span>{t.platform}</span>
                </Link>
              )}

              {visibleNavItems.map((item) => {
                const active = isActivePath(pathname, item);
                const Icon = item.icon;
                const href = navHref(item);

                return (
                  <Link
                    key={item.href}
                    href={href}
                    prefetch
                    onClick={() => setMobileNavOpen(false)}
                    className={`group relative flex h-12 items-center gap-4 overflow-hidden rounded-[1.15rem] px-4 text-[15px] font-semibold transition duration-300 ${
                      active
                        ? "bg-gradient-to-r from-amber-200 to-yellow-300 text-black shadow-[0_18px_50px_rgba(251,191,36,0.20)]"
                        : theme === "light"
                          ? "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                          : "text-white/58 hover:bg-white/[0.07] hover:text-white"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
                        active
                          ? "bg-black/10 text-black"
                          : theme === "light"
                            ? "bg-slate-100 text-slate-600 group-hover:text-slate-950"
                            : "bg-white/[0.06] text-white/55 group-hover:text-white"
                      }`}
                    >
                      <Icon
                        className="h-5 w-5"
                        strokeWidth={active ? 2.4 : 2}
                      />
                    </span>
                    <span className="truncate">{t[item.labelKey]}</span>
                    {active && (
                      <span className="ms-auto h-2 w-2 rounded-full bg-black/50" />
                    )}
                  </Link>
                );
              })}

              <button
                type="button"
                onClick={() => startSignOut(async () => signOut())}
                disabled={isSigningOut}
                className={`mt-4 flex h-12 w-full items-center gap-4 rounded-[1.15rem] px-4 text-[15px] font-semibold transition hover:bg-red-400/10 hover:text-red-600 disabled:opacity-40 ${theme === "light" ? "text-slate-700" : "text-white/58"}`}
              >
                <LogOut className="h-5 w-5 shrink-0" />
                <span>{isSigningOut ? t.signingOut : t.signOut}</span>
              </button>
            </nav>
          </aside>
        </div>
      )}

      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-[326px] overflow-y-auto overscroll-contain border-r border-white/10 bg-black/35 px-5 py-5 shadow-[24px_0_80px_rgba(0,0,0,0.25)] backdrop-blur-2xl lg:block">
        <Link
          href="/admin"
          prefetch
          onPointerEnter={() => warmRoute("/admin")}
          onMouseDown={() => warmRoute("/admin")}
          onFocus={() => warmRoute("/admin")}
          className="mb-5 flex items-center gap-3 rounded-[1.45rem] border border-white/10 bg-white/[0.05] p-3 transition hover:bg-white/[0.08]"
        >
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-amber-200 via-yellow-300 to-orange-400 text-base font-black text-black shadow-[0_18px_40px_rgba(251,191,36,0.22)]">
            <span className="relative z-10">{businessLogoUrl ? <img src={businessLogoUrl} alt="Business logo" className="block h-full w-full rounded-[inherit] object-cover object-center" /> : "BP"}</span>
            <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.9),transparent_32%)]" />
          </div>
          <div className="min-w-0 leading-tight">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.28em] text-amber-200/80">
              <Sparkles className="h-3.5 w-3.5" />
              {t.topLabel}
            </div>
            <div className="truncate text-xl font-semibold text-white">
              {t.appName}
            </div>
            <div
              className={`truncate text-xs ${theme === "light" ? "text-slate-500" : "text-white/40"}`}
            >
              {t.appSubtitle}
            </div>
          </div>
        </Link>

        {businesses.length > 0 && (
          <div className="mb-4 overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-2">
            <BusinessSwitcher
              businesses={businesses}
              currentSlug={currentBusinessSlug}
            />
          </div>
        )}

        <div className="mb-4 rounded-[1.35rem] border border-white/10 bg-white/[0.045] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <p
            className={`truncate text-xs ${theme === "light" ? "text-slate-500" : "text-white/40"}`}
          >
            {userEmail}
          </p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-200">
              {role.replace("_", " ")}
            </p>
            <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-[10px] font-bold text-emerald-100">
              {t.ready}
            </span>
          </div>
        </div>

        <nav className="space-y-1 pb-8">
          {isPlatformAdmin && (
            <Link
              href="/platform"
              prefetch
              onPointerEnter={() => warmRoute("/platform")}
              onMouseDown={() => warmRoute("/platform")}
              onFocus={() => warmRoute("/platform")}
              className={`group flex h-12 items-center gap-4 rounded-[1.15rem] px-4 text-[15px] font-semibold transition ${
                pathname.startsWith("/platform")
                  ? "bg-gradient-to-r from-amber-200 to-yellow-300 text-black shadow-[0_18px_50px_rgba(251,191,36,0.20)]"
                  : "text-white/48 hover:bg-white/[0.07] hover:text-white/85"
              }`}
            >
              <Crown className="h-5 w-5 shrink-0" />
              <span>{t.platform}</span>
            </Link>
          )}

          {visibleNavItems.map((item) => {
            const active = isActivePath(pathname, item);
            const Icon = item.icon;
            const href = navHref(item);

            return (
              <div key={item.href} className="space-y-1">
                <Link
                  href={href}
                  prefetch
                  onPointerEnter={() => warmRoute(href)}
                  onMouseDown={() => warmRoute(href)}
                  onFocus={() => warmRoute(href)}
                  className={`group relative flex h-12 items-center gap-4 overflow-hidden rounded-[1.15rem] px-4 text-[15px] font-semibold transition duration-300 ${
                    active
                      ? "bg-gradient-to-r from-amber-200 to-yellow-300 text-black shadow-[0_18px_50px_rgba(251,191,36,0.20)]"
                      : "text-white/50 hover:bg-white/[0.07] hover:text-white/85"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
                      active
                        ? "bg-black/10 text-black"
                        : "bg-white/[0.06] text-white/45 group-hover:text-white"
                    }`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
                  </span>
                  <span className="truncate">{t[item.labelKey]}</span>
                  {active && (
                    <span className="ms-auto h-2 w-2 rounded-full bg-black/50" />
                  )}
                </Link>
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => startSignOut(async () => signOut())}
            disabled={isSigningOut}
            className="mt-4 flex h-12 w-full items-center gap-4 rounded-[1.15rem] px-4 text-[15px] font-semibold text-white/50 transition hover:bg-red-400/10 hover:text-red-100 disabled:opacity-40"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>{isSigningOut ? t.signingOut : t.signOut}</span>
          </button>
        </nav>
      </aside>

      <div className="relative z-10 lg:pl-[326px]">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#06070b]/72 px-4 py-3 backdrop-blur-2xl sm:px-6 lg:px-8 lg:py-4">
          <div className="mb-3 flex items-center justify-between gap-3 lg:hidden">
            <Link
              href="/admin"
              prefetch
              className="flex min-w-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.055] px-3 py-2"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-200 to-yellow-300 text-xs font-black text-black">{businessLogoUrl ? <img src={businessLogoUrl} alt="Business logo" className="block h-full w-full rounded-[inherit] object-cover object-center" /> : "BP"}</span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-white">
                  {t.appName}
                </span>
                <span className="block truncate text-[11px] text-white/40">
                  {t.ready}
                </span>
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-white/75 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:justify-between lg:gap-4">
            <div className="min-w-0 overflow-hidden lg:max-w-[calc(100vw-760px)] xl:max-w-[calc(100vw-820px)] 2xl:max-w-[760px]">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-amber-200/75">
                <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.8)]" />
                {t.topLabel}
              </div>
              <h1 className="mt-1 truncate text-2xl font-black tracking-[-0.04em] text-white sm:text-3xl">
                {t[currentMeta.titleKey]}
              </h1>
              <p className="mt-1 max-w-full truncate text-sm text-white/42">
                {t[currentMeta.subtitleKey]}
              </p>
            </div>

            <div className="-mx-1 flex w-full min-w-0 shrink-0 items-center gap-2 overflow-x-auto px-1 pb-1 lg:mx-0 lg:w-auto lg:flex-wrap lg:justify-end lg:overflow-visible lg:pb-0 xl:flex-nowrap 2xl:max-w-none">
              <div className="hidden h-11 min-w-[220px] items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.055] px-3 text-white/40 2xl:flex">
                <Search className="h-4 w-4" />
                <span className="text-sm">{t.searchPlaceholder}</span>
              </div>

              <div className="flex shrink-0 items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.055] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <div className="hidden items-center gap-1 px-2 text-xs font-semibold text-white/45 sm:flex">
                  <Languages className="h-4 w-4" />
                  {t.globalLanguage}
                </div>
                {adminLanguageOptions.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setLanguage(item.value)}
                    className={`h-9 rounded-xl px-3 text-xs font-black transition ${
                      language === item.value
                        ? "bg-amber-200 text-black shadow-[0_10px_28px_rgba(251,191,36,0.20)]"
                        : "text-white/48 hover:bg-white/[0.06] hover:text-white"
                    }`}
                    title={item.label}
                  >
                    {item.shortLabel}
                  </button>
                ))}
              </div>

              <div className="flex shrink-0 items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.055] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <div className="hidden items-center gap-1 px-2 text-xs font-semibold text-white/45 sm:flex">
                  {theme === "dark" ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                  {t.theme}
                </div>
                {adminThemeOptions.map((item) => {
                  const Icon = item.value === "dark" ? Moon : Sun;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setTheme(item.value)}
                      className={`flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-black transition ${
                        theme === item.value
                          ? "bg-amber-200 text-black shadow-[0_10px_28px_rgba(251,191,36,0.20)]"
                          : "text-white/48 hover:bg-white/[0.06] hover:text-white"
                      }`}
                      title={item.value === "dark" ? t.darkTheme : t.lightTheme}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">
                        {item.value === "dark" ? t.darkTheme : t.lightTheme}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </header>

        <main className="bp-page-enter bp-content-shell min-h-screen px-3 py-4 sm:px-6 lg:px-8 lg:py-5 lg:pb-5">
          <div className="bp-content-wrap mx-auto w-full max-w-[1680px]">
            {children}
          </div>
        </main>
      </div>
    </div>
    </AdminPermissionsProvider>
  );
}

export function AdminShell(props: AdminShellProps) {
  return (
    <AdminLanguageProvider>
      <AdminShellInner {...props} />
    </AdminLanguageProvider>
  );
}

