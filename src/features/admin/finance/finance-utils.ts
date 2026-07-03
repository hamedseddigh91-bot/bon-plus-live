import type {
  CashClosing,
  FinanceEntry,
  OperationDocument,
  OperationSupplier,
  OperationsPageState,
} from "@/app/admin/operations/actions";

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function monthKey(value: string) {
  return value.slice(0, 7);
}

export function money(value: number | string | null | undefined) {
  const number = Number(value ?? 0);

  return new Intl.NumberFormat("en-OM", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(Number.isFinite(number) ? number : 0);
}

export function numberValue(value: number | string | null | undefined) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

export function getInvoiceEntries(entries: FinanceEntry[]) {
  return entries.filter((entry) => entry.entryType === "expense" || entry.entryType === "cash_drawer_expense");
}

export function getPettyCashEntries(entries: FinanceEntry[]) {
  return entries.filter((entry) =>
    ["petty_cash_topup", "cash_transfer", "owner_paid"].includes(entry.entryType),
  );
}

export function documentsFor(documents: OperationDocument[], ownerType: OperationDocument["ownerType"], ownerId: string) {
  return documents.filter((document) => document.ownerType === ownerType && document.ownerId === ownerId);
}

export function supplierName(suppliers: OperationSupplier[], supplierId: string | null | undefined) {
  if (!supplierId) return "—";
  return suppliers.find((supplier) => supplier.id === supplierId)?.name ?? "—";
}

export function groupExpensesByUsage(entries: FinanceEntry[]) {
  const map = new Map<string, number>();

  for (const entry of getInvoiceEntries(entries)) {
    if (entry.paymentStatus !== "paid") continue;
    map.set(entry.usagePlace || "general", (map.get(entry.usagePlace || "general") ?? 0) + numberValue(entry.amount));
  }

  return Array.from(map.entries())
    .map(([label, amount]) => ({ label, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function groupExpensesBySupplier(entries: FinanceEntry[]) {
  const map = new Map<string, { amount: number; count: number }>();

  for (const entry of getInvoiceEntries(entries)) {
    const label = entry.supplierName || "No supplier";
    const current = map.get(label) ?? { amount: 0, count: 0 };
    current.amount += numberValue(entry.amount);
    current.count += 1;
    map.set(label, current);
  }

  return Array.from(map.entries())
    .map(([label, value]) => ({ label, ...value }))
    .sort((a, b) => b.amount - a.amount);
}

export function monthlyPeriods(state: OperationsPageState) {
  const map = new Map<
    string,
    {
      month: string;
      expenses: number;
      topups: number;
      transfers: number;
      closing: number;
      invoiceCount: number;
      closingCount: number;
    }
  >();

  const ensure = (month: string) => {
    const existing = map.get(month);
    if (existing) return existing;

    const value = {
      month,
      expenses: 0,
      topups: 0,
      transfers: 0,
      closing: 0,
      invoiceCount: 0,
      closingCount: 0,
    };

    map.set(month, value);
    return value;
  };

  for (const entry of state.entries ?? []) {
    const period = ensure(monthKey(entry.entryDate));
    if (entry.entryType === "petty_cash_topup") period.topups += numberValue(entry.amount);
    if (entry.entryType === "cash_transfer") period.transfers += numberValue(entry.amount);
    if (entry.entryType === "expense" || entry.entryType === "cash_drawer_expense") {
      period.expenses += numberValue(entry.amount);
      period.invoiceCount += 1;
    }
  }

  for (const closing of state.closings ?? []) {
    const period = ensure(monthKey(closing.closingDate));
    period.closing += numberValue(closing.totalAmount);
    period.closingCount += 1;
  }

  return Array.from(map.values()).sort((a, b) => b.month.localeCompare(a.month));
}

export function maxChartValue(values: number[]) {
  const max = Math.max(...values, 1);
  return Number.isFinite(max) && max > 0 ? max : 1;
}

export function fileSize(bytes: number | null | undefined) {
  const size = Number(bytes ?? 0);

  if (!size) return "—";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export type { CashClosing, FinanceEntry, OperationDocument, OperationSupplier, OperationsPageState };
