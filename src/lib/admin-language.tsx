"use client";

import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type AdminLanguage = "fa" | "ar" | "en";
export type AdminTheme = "dark" | "light";

type AdminLanguageContextValue = {
  language: AdminLanguage;
  setLanguage: (language: AdminLanguage) => void;
  theme: AdminTheme;
  setTheme: (theme: AdminTheme) => void;
  dir: "rtl" | "ltr";
  t: typeof adminText[AdminLanguage];
};

const LANGUAGE_STORAGE_KEY = "bonplus.admin.language";
const THEME_STORAGE_KEY = "bonplus.admin.theme";

export const adminLanguageOptions: Array<{ value: AdminLanguage; label: string; shortLabel: string }> = [
  { value: "fa", label: "فارسی", shortLabel: "FA" },
  { value: "ar", label: "العربية", shortLabel: "AR" },
  { value: "en", label: "English", shortLabel: "EN" },
];

export const adminThemeOptions: Array<{ value: AdminTheme; iconLabel: string }> = [
  { value: "dark", iconLabel: "Dark" },
  { value: "light", iconLabel: "Light" },
];

export const adminText = {
  fa: {
    dir: "rtl",
    appName: "Bon Plus OS",
    appSubtitle: "پنل مدیریت کافه",
    topLabel: "مرکز کنترل",
    globalLanguage: "زبان سایت",
    theme: "تم سایت",
    darkTheme: "تیره",
    lightTheme: "روشن",
    searchPlaceholder: "جستجوی سریع...",
    ready: "آماده",
    platform: "پلتفرم",
    signOut: "خروج",
    signingOut: "در حال خروج...",
    role: "نقش",
    currentBusiness: "بیزینس فعال",

    dashboard: "داشبورد",
    actionCenter: "مرکز اقدامات",
    finance: "مالی",
    crm: "CRM",
    financeDashboard: "داشبورد مالی",
    financeClosing: "بستن صندوق",
    financeInvoices: "فاکتورها",
    financeCash: "تنخواه و دوره‌ها",
    recipes: "رسپی و قیمت تمام‌شده",
    feedback: "فیدبک",
    recovery: "پیگیری نارضایتی",
    customers: "مشتریان",
    settings: "تنظیمات",
    questions: "سوالات",
    rewards: "پاداش‌ها",
    discounts: "تخفیف‌ها",
    reports: "گزارش‌ها",
    activityLogs: "لاگ فعالیت‌ها",
    users: "کاربران",
    system: "سیستم",

    pageDashboardTitle: "داشبورد مدیریتی",
    pageDashboardSubtitle: "نمای کلی عملکرد، بازخوردها و عملیات روزانه.",
    pageActionCenterTitle: "مرکز اقدامات",
    pageActionCenterSubtitle: "همه کارهای باز و نیازمند پیگیری در یک صفحه.",
    pageFinanceTitle: "مالی",
    pageFinanceSubtitle: "صندوق، فاکتورها، تنخواه، دوره‌ها و قیمت تمام‌شده.",
    pageCrmTitle: "CRM",
    pageCrmSubtitle: "فیدبک‌ها، پیگیری‌ها، مشتریان و وفاداری.",
    pageRecipesTitle: "رسپی و قیمت تمام‌شده",
    pageRecipesSubtitle: "محاسبه قیمت تمام‌شده آیتم‌های منو و سود ناخالص.",
    pageFeedbackTitle: "فیدبک مشتریان",
    pageFeedbackSubtitle: "بررسی بازخوردها و تشخیص مشتریان ناراضی.",
    pageRecoveryTitle: "پیگیری نارضایتی",
    pageRecoverySubtitle: "مدیریت فرایند بازگرداندن مشتریان ناراضی.",
    pageCustomersTitle: "مشتریان",
    pageCustomersSubtitle: "دفترچه مشتریان، تاریخچه و وضعیت وفاداری.",
    pageSettingsTitle: "تنظیمات",
    pageSettingsSubtitle: "تنظیمات کسب‌وکار، لینک‌ها و دسترسی‌ها.",
    pageQuestionsTitle: "سوالات",
    pageQuestionsSubtitle: "مدیریت فرم فیدبک و سوالات مشتریان.",
    pageRewardsTitle: "پاداش‌ها",
    pageRewardsSubtitle: "تنظیم پاداش‌ها و کمپین‌های وفاداری.",
    pageDiscountsTitle: "تخفیف‌ها",
    pageDiscountsSubtitle: "مدیریت کدهای تخفیف و وضعیت استفاده.",
    pageReportsTitle: "گزارش‌ها",
    pageReportsSubtitle: "گزارش‌های مدیریتی و تحلیلی.",
    pageActivityLogsTitle: "لاگ فعالیت‌ها",
    pageActivityLogsSubtitle: "ردیابی تغییرات مهم و اقدامات کاربران.",
    pageUsersTitle: "کاربران",
    pageUsersSubtitle: "دعوت، نقش‌ها و دسترسی کاربران.",
    pageSystemTitle: "وضعیت سیستم",
    pageSystemSubtitle: "سلامت سرویس‌ها، دیتابیس و تنظیمات فنی.",
  },
  ar: {
    dir: "rtl",
    appName: "Bon Plus OS",
    appSubtitle: "لوحة إدارة المقهى",
    topLabel: "مركز التحكم",
    globalLanguage: "لغة الموقع",
    theme: "مظهر الموقع",
    darkTheme: "داكن",
    lightTheme: "فاتح",
    searchPlaceholder: "بحث سريع...",
    ready: "جاهز",
    platform: "المنصة",
    signOut: "تسجيل الخروج",
    signingOut: "جارٍ الخروج...",
    role: "الدور",
    currentBusiness: "النشاط الحالي",

    dashboard: "لوحة المعلومات",
    actionCenter: "مركز الإجراءات",
    finance: "المالية",
    crm: "CRM",
    financeDashboard: "لوحة المالية",
    financeClosing: "إغلاق الصندوق",
    financeInvoices: "الفواتير",
    financeCash: "العهدة والفترات",
    recipes: "الوصفات والتكلفة",
    feedback: "آراء العملاء",
    recovery: "متابعة الاستياء",
    customers: "العملاء",
    settings: "الإعدادات",
    questions: "الأسئلة",
    rewards: "المكافآت",
    discounts: "الخصومات",
    reports: "التقارير",
    activityLogs: "سجل النشاط",
    users: "المستخدمون",
    system: "النظام",

    pageDashboardTitle: "لوحة الإدارة",
    pageDashboardSubtitle: "نظرة عامة على الأداء، الآراء والعمليات اليومية.",
    pageActionCenterTitle: "مركز الإجراءات",
    pageActionCenterSubtitle: "جميع المهام المفتوحة والمتابعات المطلوبة في مكان واحد.",
    pageFinanceTitle: "المالية",
    pageFinanceSubtitle: "الصندوق، الفواتير، العهدة، الفترات والتكلفة.",
    pageCrmTitle: "CRM",
    pageCrmSubtitle: "الآراء، المتابعات، العملاء والولاء.",
    pageRecipesTitle: "الوصفات والتكلفة",
    pageRecipesSubtitle: "حساب تكلفة عناصر المنيو والربح الإجمالي.",
    pageFeedbackTitle: "آراء العملاء",
    pageFeedbackSubtitle: "مراجعة الآراء وتحديد العملاء غير الراضين.",
    pageRecoveryTitle: "متابعة الاستياء",
    pageRecoverySubtitle: "إدارة استعادة العملاء غير الراضين.",
    pageCustomersTitle: "العملاء",
    pageCustomersSubtitle: "سجل العملاء، التاريخ وحالة الولاء.",
    pageSettingsTitle: "الإعدادات",
    pageSettingsSubtitle: "إعدادات النشاط، الروابط والصلاحيات.",
    pageQuestionsTitle: "الأسئلة",
    pageQuestionsSubtitle: "إدارة نموذج الآراء وأسئلة العملاء.",
    pageRewardsTitle: "المكافآت",
    pageRewardsSubtitle: "إعداد المكافآت وحملات الولاء.",
    pageDiscountsTitle: "الخصومات",
    pageDiscountsSubtitle: "إدارة أكواد الخصم وحالة الاستخدام.",
    pageReportsTitle: "التقارير",
    pageReportsSubtitle: "تقارير إدارية وتحليلية.",
    pageActivityLogsTitle: "سجل النشاط",
    pageActivityLogsSubtitle: "تتبع التغييرات المهمة وإجراءات المستخدمين.",
    pageUsersTitle: "المستخدمون",
    pageUsersSubtitle: "الدعوات، الأدوار وصلاحيات المستخدمين.",
    pageSystemTitle: "حالة النظام",
    pageSystemSubtitle: "سلامة الخدمات، قاعدة البيانات والإعدادات الفنية.",
  },
  en: {
    dir: "ltr",
    appName: "Bon Plus OS",
    appSubtitle: "Cafe management panel",
    topLabel: "Control Center",
    globalLanguage: "Site language",
    theme: "Site theme",
    darkTheme: "Dark",
    lightTheme: "Light",
    searchPlaceholder: "Quick search...",
    ready: "Ready",
    platform: "Platform",
    signOut: "Sign out",
    signingOut: "Signing out...",
    role: "Role",
    currentBusiness: "Current business",

    dashboard: "Dashboard",
    actionCenter: "Action Center",
    finance: "Finance",
    crm: "CRM",
    financeDashboard: "Finance dashboard",
    financeClosing: "Cash closing",
    financeInvoices: "Invoices",
    financeCash: "Petty cash & periods",
    recipes: "Recipe costing",
    feedback: "Feedback",
    recovery: "Recovery",
    customers: "Customers",
    settings: "Settings",
    questions: "Questions",
    rewards: "Rewards",
    discounts: "Discounts",
    reports: "Reports",
    activityLogs: "Activity logs",
    users: "Users",
    system: "System",

    pageDashboardTitle: "Management dashboard",
    pageDashboardSubtitle: "Overview of performance, feedback and daily operations.",
    pageActionCenterTitle: "Action Center",
    pageActionCenterSubtitle: "All open work and required follow-ups in one place.",
    pageFinanceTitle: "Finance",
    pageFinanceSubtitle: "Cash closing, invoices, petty cash, periods and costing.",
    pageCrmTitle: "CRM",
    pageCrmSubtitle: "Feedback, follow-ups, customers and loyalty.",
    pageRecipesTitle: "Recipe costing",
    pageRecipesSubtitle: "Calculate menu item cost, gross profit and margins.",
    pageFeedbackTitle: "Customer feedback",
    pageFeedbackSubtitle: "Review feedback and detect unhappy customers.",
    pageRecoveryTitle: "Recovery workflow",
    pageRecoverySubtitle: "Manage the process of winning unhappy customers back.",
    pageCustomersTitle: "Customers",
    pageCustomersSubtitle: "Customer directory, history and loyalty status.",
    pageSettingsTitle: "Settings",
    pageSettingsSubtitle: "Business settings, links and access control.",
    pageQuestionsTitle: "Questions",
    pageQuestionsSubtitle: "Manage feedback forms and customer questions.",
    pageRewardsTitle: "Rewards",
    pageRewardsSubtitle: "Configure rewards and loyalty campaigns.",
    pageDiscountsTitle: "Discounts",
    pageDiscountsSubtitle: "Manage discount codes and usage status.",
    pageReportsTitle: "Reports",
    pageReportsSubtitle: "Management and analytics reports.",
    pageActivityLogsTitle: "Activity logs",
    pageActivityLogsSubtitle: "Track important changes and user actions.",
    pageUsersTitle: "Users",
    pageUsersSubtitle: "Invites, roles and user access.",
    pageSystemTitle: "System status",
    pageSystemSubtitle: "Service health, database and technical settings.",
  },
} as const;

const AdminLanguageContext = createContext<AdminLanguageContextValue | null>(null);

function normalizeLanguage(value: string | null): AdminLanguage {
  if (value === "ar" || value === "en" || value === "fa") return value;
  return "fa";
}

function normalizeTheme(value: string | null): AdminTheme {
  if (value === "light" || value === "dark") return value;
  return "dark";
}

export function AdminLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AdminLanguage>("fa");
  const [theme, setThemeState] = useState<AdminTheme>("dark");

  useEffect(() => {
    setLanguageState(normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)));
    setThemeState(normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY)));
  }, []);

  const setLanguage = (nextLanguage: AdminLanguage) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
  };

  const setTheme = (nextTheme: AdminTheme) => {
    setThemeState(nextTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  };

  const value = useMemo<AdminLanguageContextValue>(() => {
    const t = adminText[language];
    return {
      language,
      setLanguage,
      theme,
      setTheme,
      dir: t.dir,
      t,
    };
  }, [language, theme]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = value.dir;
    document.documentElement.dataset.adminTheme = theme;
    document.body.dataset.adminLanguage = language;
    document.body.dataset.adminTheme = theme;
  }, [language, theme, value.dir]);

  return <AdminLanguageContext.Provider value={value}>{children}</AdminLanguageContext.Provider>;
}

export function useAdminLanguage() {
  const value = useContext(AdminLanguageContext);

  if (!value) {
    throw new Error("useAdminLanguage must be used inside AdminLanguageProvider.");
  }

  return value;
}
