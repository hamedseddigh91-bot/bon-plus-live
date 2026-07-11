"use client";

import { type ReactNode, useMemo, useState, useTransition } from "react";
import {
  Banknote,
  Building2,
  CreditCard,
  Download,
  FileUp,
  PackagePlus,
  Paperclip,
  ReceiptText,
  RefreshCw,
  Save,
  Trash2,
  WalletCards,
} from "lucide-react";
import {
  type CashClosing,
  type FinanceEntry,
  type OperationDocument,
  type OperationSupplier,
  type OperationsPageState,
  getOperationDocumentSignedUrl,
  saveCashClosing,
  saveFinanceEntry,
  saveSupplier,
  uploadOperationDocument,
  voidFinanceEntry,
} from "@/app/admin/operations/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type OperationsDashboardProps = {
  initialState: OperationsPageState;
};

const entryTypes = [
  ["expense", "Expense / Invoice"],
  ["petty_cash_topup", "Petty cash top up"],
  ["cash_transfer", "Cash transfer"],
  ["cash_drawer_expense", "Cash drawer expense"],
  ["owner_paid", "Owner paid"],
  ["other", "Other"],
];

const payers = [
  ["petty_cash", "Petty cash"],
  ["cash_drawer", "Cash drawer"],
  ["owner", "Owner"],
  ["bank", "Bank"],
  ["other", "Other"],
];

const usagePlaces = [
  ["kitchen", "Kitchen"],
  ["bar", "Bar"],
  ["hall", "Hall"],
  ["general", "General"],
  ["other", "Other"],
];

type UiLanguage = "fa" | "ar" | "en";

const uiText = {
  fa: {
    label: "فارسی",
    dir: "rtl",
    operations: "عملیات",
    financeCore: "هسته مالی",
    intro: "مدیریت تنخواه، هزینه‌ها، تأمین‌کننده‌ها، بستن صندوق و آپلود اسناد فاکتورها.",
    overviewSummary: "خلاصه کلی",
    overviewDescription: "اعداد اصلی تا وقتی این بخش را باز نکنی نمایش داده نمی‌شوند.",
    financeReport: "گزارش مالی",
    financeReportDescription: "فیلتر تاریخ، جستجو، جمع‌ها، گزارش مصرف، تأمین‌کننده‌های برتر و خروجی CSV.",
    addEditRecords: "ثبت / ویرایش اطلاعات",
    addEditRecordsDescription: "ثبت هزینه، بستن صندوق، تأمین‌کننده و آپلود سند.",
    financeEntries: "ثبت‌های مالی",
    financeEntriesDescription: "برای دیدن، ویرایش یا حذف منطقی ثبت‌های مالی این بخش را باز کن.",
    listsDocuments: "لیست‌ها و اسناد",
    listsDocumentsDescription: "بستن‌های صندوق، تأمین‌کننده‌ها و آخرین اسناد آپلود شده.",
    open: "باز کردن",
    close: "بستن",
    quick: "سریع",
    today: "امروز",
    thisMonth: "این ماه",
    last7Days: "۷ روز اخیر",
    last30Days: "۳۰ روز اخیر",
    custom: "دلخواه",
    from: "از",
    to: "تا",
    search: "جستجو",
    searchPlaceholder: "تأمین‌کننده، عنوان، شماره مرجع...",
    paidExpenses: "هزینه‌های پرداخت‌شده",
    unpaid: "پرداخت‌نشده",
    pettyCash: "تنخواه",
    pettyCashBalance: "مانده تنخواه",
    closingTotal: "جمع بستن صندوق",
    documents: "اسناد",
    records: "رکوردها",
    closings: "بستن‌ها",
    topUps: "شارژ تنخواه",
    cash: "نقد",
    card: "کارت",
    transfers: "انتقال‌ها",
    dailySales: "فروش روزانه",
    talabatOther: "طلبات / سایر",
    entries: "ثبت‌ها",
    expensesByUsage: "هزینه‌ها بر اساس محل مصرف",
    topSuppliers: "تأمین‌کننده‌های برتر",
    exportCsv: "خروجی CSV",
    noSupplierExpense: "در این بازه هزینه‌ای برای تأمین‌کننده‌ها ثبت نشده.",
    financeEntry: "ثبت مالی",
    date: "تاریخ",
    type: "نوع",
    amountOmr: "مبلغ OMR",
    title: "عنوان",
    titlePlaceholder: "عنوان فاکتور / خرید",
    supplier: "تأمین‌کننده",
    noSupplier: "بدون تأمین‌کننده",
    paymentStatus: "وضعیت پرداخت",
    paid: "پرداخت‌شده",
    payer: "پرداخت‌کننده",
    usagePlace: "محل مصرف",
    referenceNo: "شماره مرجع",
    referencePlaceholder: "شماره فاکتور",
    description: "توضیحات",
    updateEntry: "به‌روزرسانی ثبت",
    saveEntry: "ذخیره ثبت",
    clear: "پاک کردن",
    invoiceDocuments: "اسناد فاکتور",
    upload: "آپلود",
    noDocumentsForEntry: "برای این ثبت سندی آپلود نشده.",
    cashClosing: "بستن صندوق",
    notes: "یادداشت",
    updateClosing: "به‌روزرسانی بستن صندوق",
    saveClosing: "ذخیره بستن صندوق",
    supplierName: "نام تأمین‌کننده",
    phone: "تلفن",
    email: "ایمیل",
    updateSupplier: "به‌روزرسانی تأمین‌کننده",
    saveSupplier: "ذخیره تأمین‌کننده",
    refresh: "تازه‌سازی",
    docs: "اسناد",
    noFinanceEntries: "برای این فیلتر ثبت مالی وجود ندارد.",
    cashClosings: "بستن‌های صندوق",
    total: "جمع",
    noCashClosings: "هنوز بستن صندوق ثبت نشده.",
    suppliers: "تأمین‌کننده‌ها",
    status: "وضعیت",
    active: "فعال",
    inactive: "غیرفعال",
    noSuppliers: "هنوز تأمین‌کننده‌ای ثبت نشده.",
    recentDocuments: "آخرین اسناد",
    noDocumentsUploaded: "هنوز سندی آپلود نشده.",
    edit: "ویرایش",
    langBadge: "فارسی / العربية / English",
  },
  ar: {
    label: "العربية",
    dir: "rtl",
    operations: "العمليات",
    financeCore: "النظام المالي",
    intro: "إدارة العهدة، المصروفات، الموردين، إغلاق النقد/البطاقة/طلبات، ورفع مستندات الفواتير.",
    overviewSummary: "ملخص عام",
    overviewDescription: "الأرقام الرئيسية مخفية حتى تفتح هذا القسم.",
    financeReport: "التقرير المالي",
    financeReportDescription: "فلترة بالتاريخ، بحث، إجماليات، تقرير الاستخدام، الموردين الأعلى، وتصدير CSV.",
    addEditRecords: "إضافة / تعديل السجلات",
    addEditRecordsDescription: "قيد مالي، إغلاق نقدي، نموذج المورد، ورفع المستندات.",
    financeEntries: "القيود المالية",
    financeEntriesDescription: "افتح لعرض أو تعديل أو إلغاء القيود المالية المحفوظة.",
    listsDocuments: "القوائم والمستندات",
    listsDocumentsDescription: "إغلاقات النقد، الموردون، وآخر المستندات المرفوعة.",
    open: "فتح",
    close: "إغلاق",
    quick: "سريع",
    today: "اليوم",
    thisMonth: "هذا الشهر",
    last7Days: "آخر ٧ أيام",
    last30Days: "آخر ٣٠ يوم",
    custom: "مخصص",
    from: "من",
    to: "إلى",
    search: "بحث",
    searchPlaceholder: "المورد، العنوان، الرقم المرجعي...",
    paidExpenses: "المصروفات المدفوعة",
    unpaid: "غير مدفوع",
    pettyCash: "العهدة",
    pettyCashBalance: "رصيد العهدة",
    closingTotal: "إجمالي الإغلاق",
    documents: "المستندات",
    records: "السجلات",
    closings: "الإغلاقات",
    topUps: "تغذية العهدة",
    cash: "نقداً",
    card: "بطاقة",
    transfers: "التحويلات",
    dailySales: "المبيعات اليومية",
    talabatOther: "طلبات / أخرى",
    entries: "قيود",
    expensesByUsage: "المصروفات حسب الاستخدام",
    topSuppliers: "أعلى الموردين",
    exportCsv: "تصدير CSV",
    noSupplierExpense: "لا توجد مصروفات موردين ضمن هذا النطاق.",
    financeEntry: "قيد مالي",
    date: "التاريخ",
    type: "النوع",
    amountOmr: "المبلغ OMR",
    title: "العنوان",
    titlePlaceholder: "عنوان الفاتورة / المشتريات",
    supplier: "المورد",
    noSupplier: "بدون مورد",
    paymentStatus: "حالة الدفع",
    paid: "مدفوع",
    payer: "الدافع",
    usagePlace: "مكان الاستخدام",
    referenceNo: "الرقم المرجعي",
    referencePlaceholder: "رقم الفاتورة",
    description: "الوصف",
    updateEntry: "تحديث القيد",
    saveEntry: "حفظ القيد",
    clear: "مسح",
    invoiceDocuments: "مستندات الفاتورة",
    upload: "رفع",
    noDocumentsForEntry: "لا توجد مستندات لهذا القيد.",
    cashClosing: "إغلاق النقد",
    notes: "ملاحظات",
    updateClosing: "تحديث الإغلاق",
    saveClosing: "حفظ الإغلاق",
    supplierName: "اسم المورد",
    phone: "الهاتف",
    email: "البريد الإلكتروني",
    updateSupplier: "تحديث المورد",
    saveSupplier: "حفظ المورد",
    refresh: "تحديث",
    docs: "مستندات",
    noFinanceEntries: "لا توجد قيود مالية لهذا الفلتر.",
    cashClosings: "إغلاقات النقد",
    total: "الإجمالي",
    noCashClosings: "لا توجد إغلاقات نقدية بعد.",
    suppliers: "الموردون",
    status: "الحالة",
    active: "نشط",
    inactive: "غير نشط",
    noSuppliers: "لا يوجد موردون بعد.",
    recentDocuments: "آخر المستندات",
    noDocumentsUploaded: "لا توجد مستندات مرفوعة بعد.",
    edit: "تعديل",
    langBadge: "فارسی / العربية / English",
  },
  en: {
    label: "English",
    dir: "ltr",
    operations: "Operations",
    financeCore: "Finance core",
    intro: "Petty cash, expenses, suppliers, cash/card/Talabat closings and invoice document upload.",
    overviewSummary: "Overview summary",
    overviewDescription: "Quick totals are hidden until you open this section.",
    financeReport: "Finance report",
    financeReportDescription: "Date filters, search, totals, usage report, top suppliers and CSV export.",
    addEditRecords: "Add / edit records",
    addEditRecordsDescription: "Finance entry, cash closing, supplier form and document upload.",
    financeEntries: "Finance entries",
    financeEntriesDescription: "Open to view, edit or void saved finance entries.",
    listsDocuments: "Lists & documents",
    listsDocumentsDescription: "Cash closings, suppliers and recent uploaded documents.",
    open: "Open",
    close: "Close",
    quick: "Quick",
    today: "Today",
    thisMonth: "This month",
    last7Days: "Last 7 days",
    last30Days: "Last 30 days",
    custom: "Custom",
    from: "From",
    to: "To",
    search: "Search",
    searchPlaceholder: "Supplier, title, reference...",
    paidExpenses: "Paid expenses",
    unpaid: "Unpaid",
    pettyCash: "Petty cash",
    pettyCashBalance: "Petty cash balance",
    closingTotal: "Closing total",
    documents: "Documents",
    records: "Records",
    closings: "Closings",
    topUps: "Top ups",
    cash: "Cash",
    card: "Card",
    transfers: "Transfers",
    dailySales: "Daily sales",
    talabatOther: "Talabat / Other",
    entries: "Entries",
    expensesByUsage: "Expenses by usage",
    topSuppliers: "Top suppliers",
    exportCsv: "Export CSV",
    noSupplierExpense: "{t.noSupplierExpense}",
    financeEntry: "Finance entry",
    date: "Date",
    type: "Type",
    amountOmr: "Amount OMR",
    title: "Title",
    titlePlaceholder: "Invoice / purchase title",
    supplier: "Supplier",
    noSupplier: "No supplier",
    paymentStatus: "Payment status",
    paid: "Paid",
    payer: "Payer",
    usagePlace: "Usage place",
    referenceNo: "Reference no.",
    referencePlaceholder: "Invoice number",
    description: "Description",
    updateEntry: "Update entry",
    saveEntry: "Save entry",
    clear: "Clear",
    invoiceDocuments: "Invoice documents",
    upload: "Upload",
    noDocumentsForEntry: "{t.noDocumentsForEntry}",
    cashClosing: "Cash closing",
    notes: "Notes",
    updateClosing: "Update closing",
    saveClosing: "Save closing",
    supplierName: "Supplier name",
    phone: "Phone",
    email: "Email",
    updateSupplier: "Update supplier",
    saveSupplier: "Save supplier",
    refresh: "Refresh",
    docs: "Docs",
    noFinanceEntries: "{t.noFinanceEntries}",
    cashClosings: "Cash closings",
    total: "Total",
    noCashClosings: "{t.noCashClosings}",
    suppliers: "Suppliers",
    status: "Status",
    active: "Active",
    inactive: "Inactive",
    noSuppliers: "{t.noSuppliers}",
    recentDocuments: "Recent documents",
    noDocumentsUploaded: "{t.noDocumentsUploaded}",
    edit: "Edit",
    langBadge: "فارسی / العربية / English",
  },
} as const;

const entryTypeLabels: Record<UiLanguage, Array<[string, string]>> = {
  fa: [
    ["expense", "هزینه / فاکتور"],
    ["petty_cash_topup", "شارژ تنخواه"],
    ["cash_transfer", "انتقال نقدی"],
    ["cash_drawer_expense", "هزینه از صندوق"],
    ["owner_paid", "پرداخت‌شده توسط مالک"],
    ["other", "سایر"],
  ],
  ar: [
    ["expense", "مصروف / فاتورة"],
    ["petty_cash_topup", "تغذية العهدة"],
    ["cash_transfer", "تحويل نقدي"],
    ["cash_drawer_expense", "مصروف من الصندوق"],
    ["owner_paid", "مدفوع من المالك"],
    ["other", "أخرى"],
  ],
  en: entryTypes as Array<[string, string]>,
};

const payerLabels: Record<UiLanguage, Array<[string, string]>> = {
  fa: [
    ["petty_cash", "تنخواه"],
    ["cash_drawer", "صندوق نقدی"],
    ["owner", "مالک"],
    ["bank", "بانک"],
    ["other", "سایر"],
  ],
  ar: [
    ["petty_cash", "العهدة"],
    ["cash_drawer", "صندوق النقد"],
    ["owner", "المالك"],
    ["bank", "البنك"],
    ["other", "أخرى"],
  ],
  en: payers as Array<[string, string]>,
};

const usagePlaceLabels: Record<UiLanguage, Array<[string, string]>> = {
  fa: [
    ["kitchen", "آشپزخانه"],
    ["bar", "بار"],
    ["hall", "سالن"],
    ["general", "عمومی"],
    ["other", "سایر"],
  ],
  ar: [
    ["kitchen", "المطبخ"],
    ["bar", "البار"],
    ["hall", "الصالة"],
    ["general", "عام"],
    ["other", "أخرى"],
  ],
  en: usagePlaces as Array<[string, string]>,
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function money(value: number | string | null | undefined) {
  const number = Number(value ?? 0);

  return new Intl.NumberFormat("en-OM", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(Number.isFinite(number) ? number : 0);
}

function fileSize(bytes: number | null | undefined) {
  const size = Number(bytes ?? 0);

  if (!size) return "—";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function titleize(value: string) {
  return value.replaceAll("_", " ");
}

function numberValue(value: number | string | null | undefined) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function monthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function inDateRange(value: string, from: string, to: string) {
  if (from && value < from) return false;
  if (to && value > to) return false;
  return true;
}

function escapeCsv(value: string | number | null | undefined) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}


function SectionToggle({
  title,
  description,
  children,
  defaultOpen = false,
  openLabel = "Open",
  closeLabel = "Close",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  openLabel?: string;
  closeLabel?: string;
}) {
  return (
    <details
      open={defaultOpen}
      className="group overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04]"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 transition hover:bg-white/[0.04] [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block text-lg font-semibold text-white">{title}</span>
          {description && (
            <span className="mt-1 block text-sm leading-6 text-white/40">{description}</span>
          )}
        </span>

        <span className="shrink-0 rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/45 transition group-open:border-amber-200/30 group-open:text-amber-100">
          <span className="group-open:hidden">{openLabel}</span>
          <span className="hidden group-open:inline">{closeLabel}</span>
        </span>
      </summary>

      <div className="border-t border-white/10 p-5">{children}</div>
    </details>
  );
}

export function OperationsDashboard({ initialState }: OperationsDashboardProps) {
  const [entries, setEntries] = useState<FinanceEntry[]>(initialState.entries ?? []);
  const [suppliers, setSuppliers] = useState<OperationSupplier[]>(initialState.suppliers ?? []);
  const [closings, setClosings] = useState<CashClosing[]>(initialState.closings ?? []);
  const [documents, setDocuments] = useState<OperationDocument[]>(initialState.documents ?? []);
  const [message, setMessage] = useState<string | null>(initialState.message ?? null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const [dateFrom, setDateFrom] = useState(initialState.dateFrom || monthStart());
  const [dateTo, setDateTo] = useState(initialState.dateTo || today());
  const [quickFilter, setQuickFilter] = useState("this_month");
  const [searchTerm, setSearchTerm] = useState("");
  const [language, setLanguage] = useState<UiLanguage>("fa");
  const t = uiText[language];
  const localizedEntryTypes = entryTypeLabels[language];
  const localizedPayers = payerLabels[language];
  const localizedUsagePlaces = usagePlaceLabels[language];

  const [supplierForm, setSupplierForm] = useState({
    id: "",
    name: "",
    phone: "",
    email: "",
    notes: "",
    active: true,
  });

  const [entryForm, setEntryForm] = useState({
    id: "",
    entryDate: today(),
    entryType: "expense",
    title: "",
    amount: "",
    supplierId: "",
    paymentStatus: "paid",
    payer: "petty_cash",
    usagePlace: "general",
    referenceNo: "",
    description: "",
  });

  const [closingForm, setClosingForm] = useState({
    id: "",
    closingDate: today(),
    cashAmount: "",
    cardAmount: "",
    talabatAmount: "",
    otherAmount: "",
    notes: "",
  });

  const overview = initialState.overview;

  const activeSuppliers = useMemo(
    () => suppliers.filter((supplier) => supplier.active),
    [suppliers]
  );

  const documentsByOwner = useMemo(() => {
    const map = new Map<string, OperationDocument[]>();

    for (const document of documents) {
      const key = `${document.ownerType}:${document.ownerId}`;
      const current = map.get(key) ?? [];
      current.push(document);
      map.set(key, current);
    }

    return map;
  }, [documents]);

  const currentEntryDocuments = useMemo(
    () => documentsByOwner.get(`finance_entry:${entryForm.id}`) ?? [],
    [documentsByOwner, entryForm.id]
  );


  const supplierNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const supplier of suppliers) {
      map.set(supplier.id, supplier.name);
    }
    return map;
  }, [suppliers]);

  const filteredEntries = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return entries.filter((entry) => {
      if (!inDateRange(entry.entryDate, dateFrom, dateTo)) return false;

      if (!term) return true;

      return [
        entry.title,
        entry.entryType,
        entry.paymentStatus,
        entry.payer,
        entry.usagePlace,
        entry.referenceNo,
        entry.description,
        entry.supplierName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [entries, dateFrom, dateTo, searchTerm]);

  const filteredClosings = useMemo(
    () => closings.filter((closing) => inDateRange(closing.closingDate, dateFrom, dateTo)),
    [closings, dateFrom, dateTo]
  );

  const report = useMemo(() => {
    const paidExpenses = filteredEntries
      .filter((entry) => entry.entryType === "expense" && entry.paymentStatus === "paid")
      .reduce((sum, entry) => sum + numberValue(entry.amount), 0);

    const unpaidExpenses = filteredEntries
      .filter((entry) => entry.entryType === "expense" && entry.paymentStatus === "unpaid")
      .reduce((sum, entry) => sum + numberValue(entry.amount), 0);

    const pettyCashTopUps = filteredEntries
      .filter((entry) => entry.entryType === "petty_cash_topup")
      .reduce((sum, entry) => sum + numberValue(entry.amount), 0);

    const cashTransfers = filteredEntries
      .filter((entry) => entry.entryType === "cash_transfer")
      .reduce((sum, entry) => sum + numberValue(entry.amount), 0);

    const ownerPaid = filteredEntries
      .filter((entry) => entry.entryType === "owner_paid")
      .reduce((sum, entry) => sum + numberValue(entry.amount), 0);

    const drawerExpenses = filteredEntries
      .filter((entry) => entry.entryType === "cash_drawer_expense")
      .reduce((sum, entry) => sum + numberValue(entry.amount), 0);

    const cashIncome = filteredClosings.reduce((sum, closing) => sum + numberValue(closing.cashAmount), 0);
    const cardIncome = filteredClosings.reduce((sum, closing) => sum + numberValue(closing.cardAmount), 0);
    const talabatIncome = filteredClosings.reduce((sum, closing) => sum + numberValue(closing.talabatAmount), 0);
    const otherIncome = filteredClosings.reduce((sum, closing) => sum + numberValue(closing.otherAmount), 0);
    const closingTotal = filteredClosings.reduce((sum, closing) => sum + numberValue(closing.totalAmount), 0);

    const estimatedPettyCashBalance = pettyCashTopUps - paidExpenses - cashTransfers;
    const estimatedCashDrawerBalance = cashIncome - cashTransfers - drawerExpenses;

    const byUsagePlace = usagePlaces.map(([value, label]) => ({
      value,
      label,
      amount: filteredEntries
        .filter((entry) => entry.usagePlace === value && entry.entryType === "expense")
        .reduce((sum, entry) => sum + numberValue(entry.amount), 0),
    }));

    const bySupplier = Array.from(
      filteredEntries
        .filter((entry) => entry.entryType === "expense")
        .reduce((map, entry) => {
          const key = entry.supplierId ?? "no_supplier";
          const label = entry.supplierName ?? supplierNameMap.get(entry.supplierId ?? "") ?? "No supplier";
          const current = map.get(key) ?? { label, amount: 0, count: 0 };
          current.amount += numberValue(entry.amount);
          current.count += 1;
          map.set(key, current);
          return map;
        }, new Map<string, { label: string; amount: number; count: number }>())
        .values()
    ).sort((a, b) => b.amount - a.amount);

    return {
      paidExpenses,
      unpaidExpenses,
      pettyCashTopUps,
      cashTransfers,
      ownerPaid,
      drawerExpenses,
      cashIncome,
      cardIncome,
      talabatIncome,
      otherIncome,
      closingTotal,
      estimatedPettyCashBalance,
      estimatedCashDrawerBalance,
      byUsagePlace,
      bySupplier,
    };
  }, [filteredEntries, filteredClosings, supplierNameMap]);


  const applyQuickFilter = (value: string) => {
    setQuickFilter(value);

    const now = new Date();
    const todayValue = today();

    if (value === "today") {
      setDateFrom(todayValue);
      setDateTo(todayValue);
      return;
    }

    if (value === "this_month") {
      setDateFrom(monthStart());
      setDateTo(todayValue);
      return;
    }

    if (value === "last_7_days") {
      const date = new Date();
      date.setDate(now.getDate() - 6);
      setDateFrom(date.toISOString().slice(0, 10));
      setDateTo(todayValue);
      return;
    }

    if (value === "last_30_days") {
      const date = new Date();
      date.setDate(now.getDate() - 29);
      setDateFrom(date.toISOString().slice(0, 10));
      setDateTo(todayValue);
      return;
    }
  };

  const exportFinanceCsv = () => {
    const rows = [
      ["Date", "Title", "Type", "Supplier", "Payment Status", "Payer", "Usage Place", "Reference", "Amount OMR"],
      ...filteredEntries.map((entry) => [
        entry.entryDate,
        entry.title,
        titleize(entry.entryType),
        entry.supplierName ?? "",
        entry.paymentStatus,
        entry.payer,
        entry.usagePlace,
        entry.referenceNo ?? "",
        money(entry.amount),
      ]),
    ];

    const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `finance-entries-${dateFrom}-to-${dateTo}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const submitSupplier = () => {
    startTransition(async () => {
      const result = await saveSupplier({
        id: supplierForm.id || null,
        name: supplierForm.name,
        phone: supplierForm.phone,
        email: supplierForm.email,
        notes: supplierForm.notes,
        active: supplierForm.active,
      });

      setMessage(result.message ?? null);

      if (result.success) {
        window.location.reload();
      }
    });
  };

  const submitEntry = () => {
    startTransition(async () => {
      const result = await saveFinanceEntry({
        id: entryForm.id || null,
        entryDate: entryForm.entryDate,
        entryType: entryForm.entryType,
        title: entryForm.title,
        amount: entryForm.amount,
        supplierId: entryForm.supplierId || null,
        paymentStatus: entryForm.paymentStatus,
        payer: entryForm.payer,
        usagePlace: entryForm.usagePlace,
        referenceNo: entryForm.referenceNo,
        description: entryForm.description,
      });

      setMessage(result.message ?? null);

      if (result.success) {
        window.location.reload();
      }
    });
  };

  const submitClosing = () => {
    startTransition(async () => {
      const result = await saveCashClosing({
        id: closingForm.id || null,
        closingDate: closingForm.closingDate,
        cashAmount: closingForm.cashAmount,
        cardAmount: closingForm.cardAmount,
        talabatAmount: closingForm.talabatAmount,
        otherAmount: closingForm.otherAmount,
        notes: closingForm.notes,
      });

      setMessage(result.message ?? null);

      if (result.success) {
        window.location.reload();
      }
    });
  };

  const submitDocument = () => {
    if (!entryForm.id) {
      setMessage("Save or select a finance entry before uploading a document.");
      return;
    }

    if (!documentFile) {
      setMessage("Please select a document first.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("ownerType", "finance_entry");
      formData.set("ownerId", entryForm.id);
      formData.set("file", documentFile);

      const result = await uploadOperationDocument(formData);

      setMessage(result.message ?? null);

      if (result.success) {
        window.location.reload();
      }
    });
  };

  const openDocument = (document: OperationDocument) => {
    startTransition(async () => {
      const result = await getOperationDocumentSignedUrl({
        documentId: document.id,
      });

      if (!result.success || !result.url) {
        setMessage(result.message ?? "Could not open document.");
        return;
      }

      window.open(result.url, "_blank", "noopener,noreferrer");
    });
  };

  const editEntry = (entry: FinanceEntry) => {
    setEntryForm({
      id: entry.id,
      entryDate: entry.entryDate,
      entryType: entry.entryType,
      title: entry.title,
      amount: String(entry.amount ?? ""),
      supplierId: entry.supplierId ?? "",
      paymentStatus: entry.paymentStatus,
      payer: entry.payer,
      usagePlace: entry.usagePlace,
      referenceNo: entry.referenceNo ?? "",
      description: entry.description ?? "",
    });
    setDocumentFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const editSupplier = (supplier: OperationSupplier) => {
    setSupplierForm({
      id: supplier.id,
      name: supplier.name,
      phone: supplier.phone ?? "",
      email: supplier.email ?? "",
      notes: supplier.notes ?? "",
      active: supplier.active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const editClosing = (closing: CashClosing) => {
    setClosingForm({
      id: closing.id,
      closingDate: closing.closingDate,
      cashAmount: String(closing.cashAmount ?? ""),
      cardAmount: String(closing.cardAmount ?? ""),
      talabatAmount: String(closing.talabatAmount ?? ""),
      otherAmount: String(closing.otherAmount ?? ""),
      notes: closing.notes ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const voidEntry = (entry: FinanceEntry) => {
    startTransition(async () => {
      const result = await voidFinanceEntry({
        id: entry.id,
        reason: "Voided from operations page",
      });

      setMessage(result.message ?? null);

      if (result.success) {
        setEntries((current) => current.filter((item) => item.id !== entry.id));
      }
    });
  };

  return (
    <div className="space-y-6" dir={t.dir} lang={language} style={{ fontFamily: language === "fa" ? "var(--font-persian)" : undefined }}>
      <style>{`
        select,
        select option,
        select optgroup {
          background-color: #070707;
          color: #ffffff;
          color-scheme: dark;
        }

        select option:checked,
        select option:hover {
          background-color: #1d4ed8;
          color: #ffffff;
        }
      `}</style>
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
        <div className="mb-3 flex items-center gap-2 text-amber-200/80">
          <WalletCards className="h-5 w-5" />
          <span className="text-sm font-medium uppercase tracking-[0.25em]">
            {t.operations}
          </span>
        </div>
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white">
          {t.financeCore}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
          {t.intro}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {(["fa", "ar", "en"] as UiLanguage[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setLanguage(item)}
              className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                language === item
                  ? "border-amber-200 bg-amber-200 text-black"
                  : "border-white/10 bg-black/20 text-white/55 hover:text-white"
              }`}
            >
              {uiText[item].label}
            </button>
          ))}

          <span className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white/45">
            {t.langBadge}
          </span>
        </div>
      </section>

      {message && (
        <div className="rounded-3xl border border-amber-200/10 bg-amber-200/[0.06] p-4 text-sm text-amber-100">
          {message}
        </div>
      )}

      {!initialState.success && (
        <div className="rounded-3xl border border-red-400/20 bg-red-400/[0.06] p-4 text-sm text-red-100">
          {initialState.message ?? "Operations could not load."}
        </div>
      )}

      {overview && (
        <SectionToggle
          title={t.overviewSummary}
          description={t.overviewDescription}
          openLabel={t.open}
          closeLabel={t.close}
        >
                  <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Card className="p-5">
                      <div className="flex items-center gap-3 text-white/45">
                        <ReceiptText className="h-5 w-5 text-amber-200" />
                        <span className="text-sm">{t.paidExpenses}</span>
                      </div>
                      <p className="mt-4 text-3xl font-black text-white">{money(overview.paidExpenses)} OMR</p>
                      <p className="mt-1 text-xs text-white/35">{t.unpaid}: {money(overview.unpaidExpenses)} OMR</p>
                    </Card>

                    <Card className="p-5">
                      <div className="flex items-center gap-3 text-white/45">
                        <Banknote className="h-5 w-5 text-amber-200" />
                        <span className="text-sm">{t.pettyCashBalance}</span>
                      </div>
                      <p className="mt-4 text-3xl font-black text-white">{money(overview.estimatedPettyCashBalance)} OMR</p>
                      <p className="mt-1 text-xs text-white/35">{t.topUps}: {money(overview.pettyCashTopUps)} OMR</p>
                    </Card>

                    <Card className="p-5">
                      <div className="flex items-center gap-3 text-white/45">
                        <CreditCard className="h-5 w-5 text-amber-200" />
                        <span className="text-sm">{t.closingTotal}</span>
                      </div>
                      <p className="mt-4 text-3xl font-black text-white">{money(overview.closingTotal)} OMR</p>
                      <p className="mt-1 text-xs text-white/35">
                        {t.cash} {money(overview.cashIncome)} / {t.card} {money(overview.cardIncome)}
                      </p>
                    </Card>

                    <Card className="p-5">
                      <div className="flex items-center gap-3 text-white/45">
                        <Paperclip className="h-5 w-5 text-amber-200" />
                        <span className="text-sm">{t.documents}</span>
                      </div>
                      <p className="mt-4 text-3xl font-black text-white">{documents.length}</p>
                      <p className="mt-1 text-xs text-white/35">
                        {t.records} {overview.entryCount} / {t.closings} {overview.closingCount}
                      </p>
                    </Card>
                  </section>
        </SectionToggle>
      )}

      <SectionToggle
        title={t.financeReport}
        description={t.financeReportDescription}
        openLabel={t.open}
        closeLabel={t.close}
      >
              <Card className="p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">{t.financeReport}</h2>
                    <p className="mt-1 text-sm text-white/40">{t.financeReportDescription}</p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-5">
                    <label className="block">
                      <span className="text-xs text-white/40">{t.quick}</span>
                      <select
                        value={quickFilter}
                        onChange={(event) => applyQuickFilter(event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                      >
                        <option value="today">{t.today}</option>
                        <option value="this_month">{t.thisMonth}</option>
                        <option value="last_7_days">{t.last7Days}</option>
                        <option value="last_30_days">{t.last30Days}</option>
                        <option value="custom">{t.custom}</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-xs text-white/40">{t.from}</span>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(event) => { setQuickFilter("custom"); setDateFrom(event.target.value); }}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                      />
                    </label>

                    <label className="block">
                      <span className="text-xs text-white/40">{t.to}</span>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(event) => { setQuickFilter("custom"); setDateTo(event.target.value); }}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                      />
                    </label>

                    <label className="block md:col-span-2">
                      <span className="text-xs text-white/40">{t.search}</span>
                      <input
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                        placeholder={t.searchPlaceholder}
                      />
                    </label>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/35">{t.paidExpenses}</p>
                    <p className="mt-3 text-2xl font-black text-white">{money(report.paidExpenses)} OMR</p>
                    <p className="mt-1 text-xs text-white/35">{t.unpaid} {money(report.unpaidExpenses)} OMR</p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/35">{t.pettyCash}</p>
                    <p className="mt-3 text-2xl font-black text-white">{money(report.estimatedPettyCashBalance)} OMR</p>
                    <p className="mt-1 text-xs text-white/35">{t.topUps} {money(report.pettyCashTopUps)} / {t.transfers} {money(report.cashTransfers)}</p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/35">{t.dailySales}</p>
                    <p className="mt-3 text-2xl font-black text-white">{money(report.closingTotal)} OMR</p>
                    <p className="mt-1 text-xs text-white/35">{t.cash} {money(report.cashIncome)} / {t.card} {money(report.cardIncome)}</p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/35">{t.talabatOther}</p>
                    <p className="mt-3 text-2xl font-black text-white">{money(report.talabatIncome + report.otherIncome)} OMR</p>
                    <p className="mt-1 text-xs text-white/35">{t.entries} {filteredEntries.length} / {t.closings} {filteredClosings.length}</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-3">
                  <div className="rounded-3xl border border-white/10 p-4 xl:col-span-1">
                    <h3 className="text-sm font-semibold text-white">{t.expensesByUsage}</h3>
                    <div className="mt-4 space-y-3">
                      {report.byUsagePlace.map((item) => (
                        <div key={item.value} className="flex items-center justify-between gap-4 text-sm">
                          <span className="capitalize text-white/55">{item.label}</span>
                          <span className="font-bold text-white">{money(item.amount)} OMR</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 p-4 xl:col-span-2">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-sm font-semibold text-white">{t.topSuppliers}</h3>
                      <button
                        type="button"
                        onClick={exportFinanceCsv}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/60 hover:bg-white/10"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Export CSV
                      </button>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {report.bySupplier.slice(0, 6).map((supplier) => (
                        <div key={supplier.label} className="rounded-2xl bg-white/[0.04] px-4 py-3">
                          <div className="flex items-center justify-between gap-4">
                            <p className="truncate text-sm font-semibold text-white">{supplier.label}</p>
                            <p className="text-sm font-bold text-white">{money(supplier.amount)}</p>
                          </div>
                          <p className="mt-1 text-xs text-white/35">{supplier.count} invoices</p>
                        </div>
                      ))}
                      {report.bySupplier.length === 0 && (
                        <div className="rounded-2xl bg-white/[0.04] px-4 py-6 text-center text-sm text-white/35 md:col-span-2">
                          {t.noSupplierExpense}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
      </SectionToggle>

      <SectionToggle
        title={t.addEditRecords}
        description={t.addEditRecordsDescription}
        openLabel={t.open}
        closeLabel={t.close}
      >
              <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
                <Card className="p-5">
                  <h2 className="text-xl font-semibold text-white">{t.financeEntry}</h2>

                  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <label className="block">
                      <span className="text-sm text-white/45">{t.date}</span>
                      <input
                        type="date"
                        value={entryForm.entryDate}
                        onChange={(event) => setEntryForm((current) => ({ ...current, entryDate: event.target.value }))}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm text-white/45">{t.type}</span>
                      <select
                        value={entryForm.entryType}
                        onChange={(event) => setEntryForm((current) => ({ ...current, entryType: event.target.value }))}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                      >
                        {localizedEntryTypes.map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-sm text-white/45">{t.amountOmr}</span>
                      <input
                        type="number"
                        step="0.001"
                        value={entryForm.amount}
                        onChange={(event) => setEntryForm((current) => ({ ...current, amount: event.target.value }))}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                        placeholder="0.000"
                      />
                    </label>

                    <label className="block md:col-span-2">
                      <span className="text-sm text-white/45">{t.title}</span>
                      <input
                        value={entryForm.title}
                        onChange={(event) => setEntryForm((current) => ({ ...current, title: event.target.value }))}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                        placeholder={t.titlePlaceholder}
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm text-white/45">{t.supplier}</span>
                      <select
                        value={entryForm.supplierId}
                        onChange={(event) => setEntryForm((current) => ({ ...current, supplierId: event.target.value }))}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                      >
                        <option value="">{t.noSupplier}</option>
                        {activeSuppliers.map((supplier) => (
                          <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-sm text-white/45">{t.paymentStatus}</span>
                      <select
                        value={entryForm.paymentStatus}
                        onChange={(event) => setEntryForm((current) => ({ ...current, paymentStatus: event.target.value }))}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                      >
                        <option value="paid">{t.paid}</option>
                        <option value="unpaid">{t.unpaid}</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-sm text-white/45">{t.payer}</span>
                      <select
                        value={entryForm.payer}
                        onChange={(event) => setEntryForm((current) => ({ ...current, payer: event.target.value }))}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                      >
                        {localizedPayers.map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-sm text-white/45">{t.usagePlace}</span>
                      <select
                        value={entryForm.usagePlace}
                        onChange={(event) => setEntryForm((current) => ({ ...current, usagePlace: event.target.value }))}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                      >
                        {localizedUsagePlaces.map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-sm text-white/45">{t.referenceNo}</span>
                      <input
                        value={entryForm.referenceNo}
                        onChange={(event) => setEntryForm((current) => ({ ...current, referenceNo: event.target.value }))}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                        placeholder={t.referencePlaceholder}
                      />
                    </label>

                    <label className="block md:col-span-2 xl:col-span-3">
                      <span className="text-sm text-white/45">{t.description}</span>
                      <textarea
                        value={entryForm.description}
                        onChange={(event) => setEntryForm((current) => ({ ...current, description: event.target.value }))}
                        className="mt-2 min-h-24 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                      />
                    </label>
                  </div>

                  <div className="mt-5 flex gap-3">
                    <Button onClick={submitEntry} disabled={isPending || !entryForm.amount}>
                      <Save className="h-4 w-4" />
                      {entryForm.id ? t.updateEntry : t.saveEntry}
                    </Button>
                    {entryForm.id && (
                      <Button
                        variant="secondary"
                        onClick={() =>
                          setEntryForm({
                            id: "",
                            entryDate: today(),
                            entryType: "expense",
                            title: "",
                            amount: "",
                            supplierId: "",
                            paymentStatus: "paid",
                            payer: "petty_cash",
                            usagePlace: "general",
                            referenceNo: "",
                            description: "",
                          })
                        }
                      >
                        {t.clear}
                      </Button>
                    )}
                  </div>

                  {entryForm.id && (
                    <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-center gap-2 text-white">
                        <FileUp className="h-4 w-4 text-amber-200" />
                        <h3 className="font-semibold">{t.invoiceDocuments}</h3>
                      </div>

                      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(event) => setDocumentFile(event.target.files?.[0] ?? null)}
                          className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white file:mr-4 file:rounded-xl file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
                        />
                        <Button onClick={submitDocument} disabled={isPending || !documentFile}>
                          <FileUp className="h-4 w-4" />
                          {t.upload}
                        </Button>
                      </div>

                      <div className="mt-4 space-y-2">
                        {currentEntryDocuments.length === 0 && (
                          <p className="text-sm text-white/35">{t.noDocumentsForEntry}</p>
                        )}

                        {currentEntryDocuments.map((document) => (
                          <button
                            key={document.id}
                            type="button"
                            onClick={() => openDocument(document)}
                            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-left text-sm text-white/70 hover:bg-white/10"
                          >
                            <span className="truncate">{document.fileName}</span>
                            <span className="flex shrink-0 items-center gap-2 text-xs text-white/35">
                              {fileSize(document.sizeBytes)}
                              <Download className="h-3.5 w-3.5" />
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>

                <div className="space-y-6">
                  <Card className="p-5">
                    <h2 className="text-xl font-semibold text-white">{t.cashClosing}</h2>

                    <div className="mt-5 grid gap-4">
                      <label className="block">
                        <span className="text-sm text-white/45">{t.date}</span>
                        <input
                          type="date"
                          value={closingForm.closingDate}
                          onChange={(event) => setClosingForm((current) => ({ ...current, closingDate: event.target.value }))}
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                        />
                      </label>

                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="number"
                          step="0.001"
                          value={closingForm.cashAmount}
                          onChange={(event) => setClosingForm((current) => ({ ...current, cashAmount: event.target.value }))}
                          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                          placeholder={t.cash}
                        />
                        <input
                          type="number"
                          step="0.001"
                          value={closingForm.cardAmount}
                          onChange={(event) => setClosingForm((current) => ({ ...current, cardAmount: event.target.value }))}
                          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                          placeholder={t.card}
                        />
                        <input
                          type="number"
                          step="0.001"
                          value={closingForm.talabatAmount}
                          onChange={(event) => setClosingForm((current) => ({ ...current, talabatAmount: event.target.value }))}
                          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                          placeholder="Talabat"
                        />
                        <input
                          type="number"
                          step="0.001"
                          value={closingForm.otherAmount}
                          onChange={(event) => setClosingForm((current) => ({ ...current, otherAmount: event.target.value }))}
                          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                          placeholder="Other"
                        />
                      </div>

                      <textarea
                        value={closingForm.notes}
                        onChange={(event) => setClosingForm((current) => ({ ...current, notes: event.target.value }))}
                        className="min-h-20 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                        placeholder={t.notes}
                      />

                      <Button onClick={submitClosing} disabled={isPending}>
                        <Save className="h-4 w-4" />
                        {closingForm.id ? t.updateClosing : t.saveClosing}
                      </Button>
                    </div>
                  </Card>

                  <Card className="p-5">
                    <h2 className="text-xl font-semibold text-white">{t.supplier}</h2>

                    <div className="mt-5 grid gap-4">
                      <input
                        value={supplierForm.name}
                        onChange={(event) => setSupplierForm((current) => ({ ...current, name: event.target.value }))}
                        className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                        placeholder={t.supplierName}
                      />
                      <div className="flex overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                        <span className="flex items-center border-e border-white/10 px-3 text-sm font-black text-amber-200" dir="ltr">+968</span>
                        <input
                          value={supplierForm.phone}
                          onChange={(event) => setSupplierForm((current) => ({ ...current, phone: event.target.value.replace(/\D+/g, "").slice(0, 8) }))}
                          className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-white outline-none [color-scheme:dark]"
                          placeholder="91234567"
                          inputMode="numeric"
                          maxLength={8}
                          dir="ltr"
                        />
                      </div>
                      <input
                        value={supplierForm.email}
                        onChange={(event) => setSupplierForm((current) => ({ ...current, email: event.target.value }))}
                        className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                        placeholder={t.email}
                      />
                      <textarea
                        value={supplierForm.notes}
                        onChange={(event) => setSupplierForm((current) => ({ ...current, notes: event.target.value }))}
                        className="min-h-20 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                        placeholder={t.notes}
                      />
                      <Button onClick={submitSupplier} disabled={isPending || !supplierForm.name.trim()}>
                        <PackagePlus className="h-4 w-4" />
                        {supplierForm.id ? t.updateSupplier : t.saveSupplier}
                      </Button>
                    </div>
                  </Card>
                </div>
              </section>

      </SectionToggle>

      <SectionToggle
        title={t.financeEntries}
        description={t.financeEntriesDescription}
        openLabel={t.open}
        closeLabel={t.close}
      >
              <Card className="p-5">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <h2 className="text-xl font-semibold text-white">{t.financeEntries}</h2>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/60 hover:bg-white/10"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    {t.refresh}
                  </button>
                </div>

                <div className="overflow-hidden rounded-3xl border border-white/10">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/[0.04] text-white/40">
                      <tr>
                        <th className="px-4 py-3">{t.date}</th>
                        <th className="px-4 py-3">{t.title}</th>
                        <th className="px-4 py-3">{t.type}</th>
                        <th className="px-4 py-3">{t.supplier}</th>
                        <th className="px-4 py-3">{t.docs}</th>
                        <th className="px-4 py-3">{t.paymentStatus}</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {filteredEntries.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-white/35">
                            {t.noFinanceEntries}
                          </td>
                        </tr>
                      )}

                      {filteredEntries.map((entry) => {
                        const entryDocuments = documentsByOwner.get(`finance_entry:${entry.id}`) ?? [];

                        return (
                          <tr key={entry.id} className="text-white/70">
                            <td className="px-4 py-4">{entry.entryDate}</td>
                            <td className="px-4 py-4">
                              <p className="font-semibold text-white">{entry.title}</p>
                              <p className="text-xs text-white/35">{entry.usagePlace} / {entry.payer}</p>
                            </td>
                            <td className="px-4 py-4 capitalize">{titleize(entry.entryType)}</td>
                            <td className="px-4 py-4">{entry.supplierName ?? "—"}</td>
                            <td className="px-4 py-4">
                              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs text-white/60">
                                <Paperclip className="h-3 w-3" />
                                {entryDocuments.length}
                              </span>
                            </td>
                            <td className="px-4 py-4 capitalize">{entry.paymentStatus}</td>
                            <td className="px-4 py-4 text-right font-bold text-white">{money(entry.amount)} OMR</td>
                            <td className="px-4 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => editEntry(entry)}
                                  className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/65 hover:bg-white/10"
                                >
                                  {t.edit}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => voidEntry(entry)}
                                  className="rounded-xl border border-red-400/20 px-3 py-2 text-xs font-semibold text-red-100 hover:bg-red-400/10"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
      </SectionToggle>

      <SectionToggle
        title={t.listsDocuments}
        description={t.listsDocumentsDescription}
        openLabel={t.open}
        closeLabel={t.close}
      >
              <section className="grid gap-6 xl:grid-cols-3">
                <Card className="p-5 xl:col-span-1">
                  <h2 className="text-xl font-semibold text-white">{t.cashClosings}</h2>

                  <div className="mt-5 overflow-hidden rounded-3xl border border-white/10">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-white/[0.04] text-white/40">
                        <tr>
                          <th className="px-4 py-3">{t.date}</th>
                          <th className="px-4 py-3">{t.cash}</th>
                          <th className="px-4 py-3 text-right">{t.total}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {closings.length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-4 py-8 text-center text-white/35">
                              {t.noCashClosings}
                            </td>
                          </tr>
                        )}

                        {closings.map((closing) => (
                          <tr
                            key={closing.id}
                            className="cursor-pointer text-white/70 hover:bg-white/[0.03]"
                            onClick={() => editClosing(closing)}
                          >
                            <td className="px-4 py-4">{closing.closingDate}</td>
                            <td className="px-4 py-4">{money(closing.cashAmount)}</td>
                            <td className="px-4 py-4 text-right font-bold text-white">{money(closing.totalAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>

                <Card className="p-5 xl:col-span-1">
                  <h2 className="text-xl font-semibold text-white">{t.suppliers}</h2>

                  <div className="mt-5 overflow-hidden rounded-3xl border border-white/10">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-white/[0.04] text-white/40">
                        <tr>
                          <th className="px-4 py-3">{t.supplier}</th>
                          <th className="px-4 py-3">Phone</th>
                          <th className="px-4 py-3">{t.status}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {suppliers.length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-4 py-8 text-center text-white/35">
                              {t.noSuppliers}
                            </td>
                          </tr>
                        )}

                        {suppliers.map((supplier) => (
                          <tr
                            key={supplier.id}
                            className="cursor-pointer text-white/70 hover:bg-white/[0.03]"
                            onClick={() => editSupplier(supplier)}
                          >
                            <td className="px-4 py-4">
                              <p className="font-semibold text-white">{supplier.name}</p>
                              <p className="text-xs text-white/35">{supplier.email ?? "—"}</p>
                            </td>
                            <td className="px-4 py-4">{supplier.phone ?? "—"}</td>
                            <td className="px-4 py-4">{supplier.active ? t.active : t.inactive}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>

                <Card className="p-5 xl:col-span-1">
                  <h2 className="text-xl font-semibold text-white">{t.recentDocuments}</h2>

                  <div className="mt-5 space-y-2">
                    {documents.length === 0 && (
                      <div className="rounded-3xl border border-white/10 p-8 text-center text-sm text-white/35">
                        {t.noDocumentsUploaded}
                      </div>
                    )}

                    {documents.slice(0, 12).map((document) => (
                      <button
                        key={document.id}
                        type="button"
                        onClick={() => openDocument(document)}
                        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-left text-sm text-white/70 hover:bg-white/10"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-white">{document.fileName}</span>
                          <span className="block text-xs text-white/35">{document.createdAt.slice(0, 10)}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2 text-xs text-white/35">
                          {fileSize(document.sizeBytes)}
                          <Download className="h-3.5 w-3.5" />
                        </span>
                      </button>
                    ))}
                  </div>
                </Card>
              </section>
      </SectionToggle>
    </div>
  );
}
