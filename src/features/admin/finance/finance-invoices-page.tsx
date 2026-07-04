"use client";

import { useMemo, useState, useTransition } from "react";
import { Download, MessageCircle, PackagePlus, Printer, Save, Search } from "lucide-react";
import type { FinanceEntry, OperationSupplier, OperationsPageState } from "@/app/admin/operations/actions";
import {
  saveFinanceEntry,
  saveSupplier,
  uploadOperationDocument,
} from "@/app/admin/operations/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FinanceShell } from "@/features/admin/finance/finance-shell";
import type { FinanceLanguage } from "@/features/admin/finance/finance-i18n";
import { documentsFor, getInvoiceEntries, money, numberValue, today } from "@/features/admin/finance/finance-utils";

type FinanceInvoicesPageProps = {
  initialState: OperationsPageState;
};

const usageOptions = [
  ["kitchen", "kitchen"],
  ["bar", "bar"],
  ["hall", "hall"],
  ["general", "general"],
  ["other", "other"],
] as const;

const pageText: Record<FinanceLanguage, Record<string, string>> = {
  fa: {
    search: "جستجو در فاکتورها",
    all: "همه",
    paidFirst: "پرداخت‌نشده‌ها اول نمایش داده می‌شوند",
    summary: "خلاصه فاکتورها",
    paidTotal: "جمع پرداخت‌شده",
    unpaidTotal: "جمع پرداخت‌نشده",
    previousOverdue: "معوقه ماه‌های قبل",
    attachNow: "پیوست فاکتور (اختیاری)",
    selectedInvoiceHelp: "برای آپلود سند، اول فاکتور ذخیره‌شده را انتخاب کن.",
    exportCsv: "خروجی CSV",
    print: "چاپ",
    whatsapp: "واتساپ",
    missingDocs: "بدون سند",
    invoicePreview: "پیش‌نمایش فاکتور",
    confirmVoid: "این فاکتور حذف منطقی شود؟",
  },
  ar: {
    search: "البحث في الفواتير",
    all: "الكل",
    paidFirst: "الفواتير غير المدفوعة تظهر أولاً",
    summary: "ملخص الفواتير",
    paidTotal: "إجمالي المدفوع",
    unpaidTotal: "إجمالي غير المدفوع",
    previousOverdue: "متأخرات الأشهر السابقة",
    attachNow: "مرفق الفاتورة (اختياري)",
    selectedInvoiceHelp: "لرفع مستند، اختر فاتورة محفوظة أولاً.",
    exportCsv: "تصدير CSV",
    print: "طباعة",
    whatsapp: "واتساب",
    missingDocs: "بدون مستند",
    invoicePreview: "معاينة الفاتورة",
    confirmVoid: "هل تريد إلغاء هذه الفاتورة؟",
  },
  en: {
    search: "Search invoices",
    all: "All",
    paidFirst: "Unpaid invoices are shown first",
    summary: "Invoice summary",
    paidTotal: "Paid total",
    unpaidTotal: "Unpaid total",
    previousOverdue: "Previous months overdue",
    attachNow: "Invoice attachment (optional)",
    selectedInvoiceHelp: "Select a saved invoice before uploading a document.",
    exportCsv: "Export CSV",
    print: "Print",
    whatsapp: "WhatsApp",
    missingDocs: "Missing docs",
    invoicePreview: "Invoice preview",
    confirmVoid: "Void this invoice?",
  },
};

function csvCell(value: unknown) {
  const text = String(value ?? "").replace(/"/g, '""');
  return `"${text}"`;
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function printHtml(title: string, body: string) {
  const win = window.open("", "_blank", "width=760,height=900");
  if (!win) return;

  win.document.write(`<!doctype html><html><head><title>${title}</title><style>
    body{font-family:Tahoma,Arial,sans-serif;padding:32px;color:#111;line-height:1.7}
    .box{border:1px solid #ddd;border-radius:18px;padding:22px;margin-bottom:16px}
    h1{font-size:22px;margin:0 0 16px} table{width:100%;border-collapse:collapse}
    td{border-bottom:1px solid #eee;padding:10px 0}.total{font-size:20px;font-weight:800}
  </style></head><body>${body}</body></html>`);
  win.document.close();
  win.focus();
  win.print();
}

export function FinanceInvoicesPage({ initialState }: FinanceInvoicesPageProps) {
  const [message, setMessage] = useState<string | null>(initialState.message ?? null);
  const [invoiceFiles, setInvoiceFiles] = useState<File[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [usageFilter, setUsageFilter] = useState("all");
  const [isPending, startTransition] = useTransition();

  const invoices = useMemo(() => getInvoiceEntries(initialState.entries), [initialState.entries]);

  const filteredInvoices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return invoices
      .filter((entry) => {
        const docs = documentsFor(initialState.documents, "finance_entry", entry.id);
        const haystack = [
          entry.title,
          entry.supplierName,
          entry.paymentStatus,
          entry.payer,
          entry.usagePlace,
          entry.referenceNo,
          entry.description,
          String(entry.amount),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (query && !haystack.includes(query)) return false;
        if (statusFilter !== "all" && statusFilter !== "missing_docs" && entry.paymentStatus !== statusFilter) return false;
        if (supplierFilter !== "all" && entry.supplierId !== supplierFilter) return false;
        if (usageFilter !== "all" && entry.usagePlace !== usageFilter) return false;
        if (statusFilter === "missing_docs" && docs.length > 0) return false;

        return true;
      })
      .sort((a, b) => {
        const statusSort = Number(a.paymentStatus === "paid") - Number(b.paymentStatus === "paid");
        if (statusSort !== 0) return statusSort;
        return b.entryDate.localeCompare(a.entryDate) || b.createdAt.localeCompare(a.createdAt);
      });
  }, [initialState.documents, invoices, search, statusFilter, supplierFilter, usageFilter]);

  const paidTotal = invoices.filter((entry) => entry.paymentStatus === "paid").reduce((sum, entry) => sum + numberValue(entry.amount), 0);
  const unpaidTotal = invoices.filter((entry) => entry.paymentStatus !== "paid").reduce((sum, entry) => sum + numberValue(entry.amount), 0);
  const missingDocs = invoices.filter((entry) => documentsFor(initialState.documents, "finance_entry", entry.id).length === 0).length;

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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitSupplier = () => {
    startTransition(async () => {
      const result = await saveSupplier(supplierForm);
      setMessage(result.message ?? null);

      if (result.success) {
        window.location.reload();
      }
    });
  };

  const submitEntry = () => {
    startTransition(async () => {
      const result = await saveFinanceEntry(entryForm);
      setMessage(result.message ?? null);

      if (result.success) {
        const ownerId = result.entryId || entryForm.id;
        if (invoiceFiles.length > 0 && ownerId) {
          for (const file of invoiceFiles) {
            const formData = new FormData();
            formData.set("ownerType", "finance_entry");
            formData.set("ownerId", ownerId);
            formData.set("file", file);
            const uploadResult = await uploadOperationDocument(formData);
            if (!uploadResult.success) {
              setMessage(uploadResult.message ?? "Invoice saved, but one or more attachments failed to upload.");
              return;
            }
          }
        }
        window.location.reload();
      }
    });
  };

  const exportInvoices = () => {
    downloadCsv("finance-invoices.csv", [
      ["Date", "Title", "Supplier", "Status", "Payer", "Usage", "Reference", "Amount", "Documents", "Description"],
      ...filteredInvoices.map((entry) => [
        entry.entryDate,
        entry.title,
        entry.supplierName ?? "",
        entry.paymentStatus,
        entry.payer,
        entry.usagePlace,
        entry.referenceNo ?? "",
        String(entry.amount ?? ""),
        String(documentsFor(initialState.documents, "finance_entry", entry.id).length),
        entry.description ?? "",
      ]),
    ]);
  };

  const printInvoice = (entry: FinanceEntry, label: string) => {
    printHtml(
      `${label} - ${entry.referenceNo || entry.id}`,
      `<div class="box"><h1>${label}</h1><table>
        <tr><td>Date</td><td>${entry.entryDate}</td></tr>
        <tr><td>Title</td><td>${entry.title}</td></tr>
        <tr><td>Supplier</td><td>${entry.supplierName ?? "—"}</td></tr>
        <tr><td>Status</td><td>${entry.paymentStatus}</td></tr>
        <tr><td>Reference</td><td>${entry.referenceNo ?? "—"}</td></tr>
        <tr><td>Description</td><td>${entry.description ?? "—"}</td></tr>
        <tr><td class="total">Total</td><td class="total">${money(entry.amount)} OMR</td></tr>
      </table></div>`,
    );
  };

  const shareInvoice = (entry: FinanceEntry) => {
    const text = [
      `Invoice: ${entry.title}`,
      `Date: ${entry.entryDate}`,
      `Supplier: ${entry.supplierName ?? "—"}`,
      `Amount: ${money(entry.amount)} OMR`,
      `Status: ${entry.paymentStatus}`,
      entry.referenceNo ? `Ref: ${entry.referenceNo}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <FinanceShell active="invoices" intro="invoicesIntro">
      {({ language, t }) => {
        const l = pageText[language];

        return (
          <>
            {message && (
              <div className="rounded-3xl border border-amber-200/10 bg-amber-200/[0.06] p-4 text-sm text-amber-100">
                {message}
              </div>
            )}

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <Card className="p-4">
                <p className="text-xs text-white/40">{t.invoiceList}</p>
                <p className="mt-2 text-2xl font-black text-white">{invoices.length}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-white/40">{l.paidTotal}</p>
                <p className="mt-2 text-2xl font-black text-white">{money(paidTotal)}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-white/40">{l.unpaidTotal}</p>
                <p className="mt-2 text-2xl font-black text-white">{money(unpaidTotal)}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-white/40">{l.previousOverdue}</p>
                <p className="mt-2 text-2xl font-black text-red-200">{money(initialState.previousOverdueTotal ?? 0)}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-white/40">{l.missingDocs}</p>
                <p className="mt-2 text-2xl font-black text-white">{missingDocs}</p>
              </Card>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <Card className="p-5">
                <h2 className="text-xl font-semibold text-white">{t.invoiceRegistration}</h2>

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
                    <span className="text-sm text-white/45">{t.amount}</span>
                    <input
                      type="number"
                      step="0.001"
                      value={entryForm.amount}
                      onChange={(event) => setEntryForm((current) => ({ ...current, amount: event.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                      placeholder="0.000"
                    />
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

                  <label className="block md:col-span-2">
                    <span className="text-sm text-white/45">{t.titleField}</span>
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
                      {initialState.suppliers.filter((supplier) => supplier.active).map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-sm text-white/45">{t.payer}</span>
                    <select
                      value={entryForm.payer}
                      onChange={(event) => setEntryForm((current) => ({ ...current, payer: event.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                    >
                      <option value="petty_cash">{t.pettyCash}</option>
                      <option value="cash_drawer">{t.cashIncome}</option>
                      <option value="owner">{t.ownerPaid}</option>
                      <option value="bank">Bank</option>
                      <option value="other">{t.other}</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-sm text-white/45">{t.usagePlace}</span>
                    <select
                      value={entryForm.usagePlace}
                      onChange={(event) => setEntryForm((current) => ({ ...current, usagePlace: event.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                    >
                      {usageOptions.map(([value, key]) => (
                        <option key={value} value={value}>{t[key]}</option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-sm text-white/45">{t.referenceNo}</span>
                    <input
                      value={entryForm.referenceNo}
                      onChange={(event) => setEntryForm((current) => ({ ...current, referenceNo: event.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50"
                      placeholder={t.referenceNo}
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

                  <label className="block md:col-span-2 xl:col-span-3">
                    <span className="text-sm text-white/45">{l.attachNow}</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*,application/pdf"
                      onChange={(event) => {
                        const nextFiles = Array.from(event.target.files ?? []);
                        setInvoiceFiles((current) => {
                          const merged = [...current];
                          for (const file of nextFiles) {
                            const exists = merged.some((item) => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified);
                            if (!exists) merged.push(file);
                          }
                          return merged;
                        });
                        event.currentTarget.value = "";
                      }}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white file:mr-4 file:rounded-xl file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
                    />
                    {invoiceFiles.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {invoiceFiles.map((file, index) => (
                          <div key={`${file.name}-${file.lastModified}-${index}`} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/15 px-3 py-2 text-xs text-white/70">
                            <span className="min-w-0 truncate">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => setInvoiceFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                              className="shrink-0 rounded-lg border border-white/10 px-2 py-1 text-white/60 hover:bg-white/10"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <p className="text-xs text-white/40">{invoiceFiles.length} file(s) selected</p>
                      </div>
                    )}
                  </label>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Button onClick={submitEntry} disabled={isPending || !entryForm.amount || !entryForm.title.trim()}>
                    <Save className="h-4 w-4" />
                    {entryForm.id ? t.updateInvoice : t.saveInvoice}
                  </Button>
                  {entryForm.id && (
                    <Button
                      variant="secondary"
                      onClick={() => {
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
                        });
                        setInvoiceFiles([]);
                      }}
                    >
                      {t.clear}
                    </Button>
                  )}
                </div>
              </Card>

              <div className="space-y-6">
                <Card className="p-5">
                  <h2 className="text-xl font-semibold text-white">{t.supplierManagement}</h2>
                  <div className="mt-5 grid gap-3">
                    <input value={supplierForm.name} onChange={(event) => setSupplierForm((current) => ({ ...current, name: event.target.value }))} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50" placeholder={t.supplierName} />
                    <input value={supplierForm.phone} onChange={(event) => setSupplierForm((current) => ({ ...current, phone: event.target.value }))} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50" placeholder={t.phone} />
                    <input value={supplierForm.email} onChange={(event) => setSupplierForm((current) => ({ ...current, email: event.target.value }))} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50" placeholder={t.email} />
                    <textarea value={supplierForm.notes} onChange={(event) => setSupplierForm((current) => ({ ...current, notes: event.target.value }))} className="min-h-20 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50" placeholder={t.notes} />
                    <Button onClick={submitSupplier} disabled={isPending || !supplierForm.name.trim()}>
                      <PackagePlus className="h-4 w-4" />
                      {supplierForm.id ? t.updateSupplier : t.saveSupplier}
                    </Button>
                  </div>
                </Card>

              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.65fr_1.35fr]">
              <Card className="p-5">
                <h2 className="text-xl font-semibold text-white">{t.suppliers}</h2>
                <div className="mt-5 space-y-2">
                  {initialState.suppliers.map((supplier) => (
                    <button key={supplier.id} type="button" onClick={() => editSupplier(supplier)} className="w-full rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-left hover:bg-white/10">
                      <p className="font-semibold text-white">{supplier.name}</p>
                      <p className="mt-1 text-xs text-white/35">{supplier.phone ?? "—"} / {supplier.email ?? "—"}</p>
                    </button>
                  ))}
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">{t.invoiceList}</h2>
                    <p className="mt-1 text-xs text-white/35">{l.paidFirst}</p>
                  </div>
                  <Button variant="secondary" onClick={exportInvoices} disabled={filteredInvoices.length === 0}>
                    <Download className="h-4 w-4" />
                    {l.exportCsv}
                  </Button>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-4">
                  <label className="relative md:col-span-2">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                    <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 py-3 pl-11 pr-4 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50" placeholder={l.search} />
                  </label>
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50">
                    <option value="all">{l.all} — {t.paymentStatus}</option>
                    <option value="unpaid">{t.unpaid}</option>
                    <option value="paid">{t.paid}</option>
                    <option value="missing_docs">{l.missingDocs}</option>
                  </select>
                  <select value={supplierFilter} onChange={(event) => setSupplierFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50">
                    <option value="all">{l.all} — {t.supplier}</option>
                    {initialState.suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
                  </select>
                  <select value={usageFilter} onChange={(event) => setUsageFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-amber-200/50 md:col-span-2 xl:col-span-1">
                    <option value="all">{l.all} — {t.usagePlace}</option>
                    {usageOptions.map(([value, key]) => <option key={value} value={value}>{t[key]}</option>)}
                  </select>
                </div>

                <div className="mt-5 overflow-hidden rounded-3xl border border-white/10">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/[0.04] text-white/40">
                      <tr>
                        <th className="px-4 py-3">{t.date}</th>
                        <th className="px-4 py-3">{t.titleField}</th>
                        <th className="px-4 py-3">{t.supplier}</th>
                        <th className="px-4 py-3">{t.docs}</th>
                        <th className="px-4 py-3 text-right">{t.amount}</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {filteredInvoices.map((entry) => {
                        const docs = documentsFor(initialState.documents, "finance_entry", entry.id);

                        return (
                          <tr key={entry.id} className="text-white/70">
                            <td className="px-4 py-4">{entry.entryDate}</td>
                            <td className="px-4 py-4">
                              <p className="font-semibold text-white">{entry.title}</p>
                              <p className="text-xs text-white/35">{entry.paymentStatus === "paid" ? t.paid : t.unpaid}</p>
                            </td>
                            <td className="px-4 py-4">{entry.supplierName ?? "—"}</td>
                            <td className="px-4 py-4">{docs.length}</td>
                            <td className="px-4 py-4 text-right font-bold text-white">{money(entry.amount)}</td>
                            <td className="px-4 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => editEntry(entry)} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/65 hover:bg-white/10">{t.edit}</button>
                                <button type="button" onClick={() => printInvoice(entry, l.invoicePreview)} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/65 hover:bg-white/10"><Printer className="h-3.5 w-3.5" /></button>
                                <button type="button" onClick={() => shareInvoice(entry)} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/65 hover:bg-white/10"><MessageCircle className="h-3.5 w-3.5" /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredInvoices.length === 0 && (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-white/35">{t.noInvoices}</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </section>
          </>
        );
      }}
    </FinanceShell>
  );
}
