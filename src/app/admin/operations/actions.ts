"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAuthenticatedUser, requireCurrentBusinessSlug } from "@/lib/auth-session";
import { requireAnyModulePermission, requireModulePermission } from "@/lib/user-permissions";

export type OperationSupplier = {
  id: string;
  businessId: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FinanceEntry = {
  id: string;
  businessId: string;
  entryDate: string;
  entryType: string;
  title: string;
  amount: number | string;
  supplierId: string | null;
  supplierName: string | null;
  paymentStatus: string;
  payer: string;
  usagePlace: string;
  referenceNo: string | null;
  description: string | null;
  status: string;
  createdByEmail: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CashClosing = {
  id: string;
  businessId: string;
  closingDate: string;
  cashAmount: number | string;
  cardAmount: number | string;
  talabatAmount: number | string;
  otherAmount: number | string;
  totalAmount: number | string;
  notes: string | null;
  status: string;
  createdByEmail: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OperationDocument = {
  id: string;
  businessId: string;
  ownerType: "finance_entry" | "cash_closing" | "supplier";
  ownerId: string;
  filePath: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  status: string;
  createdByEmail: string | null;
  createdAt: string;
};

export type OperationsOverview = {
  success: boolean;
  message?: string;
  dateFrom: string;
  dateTo: string;
  paidExpenses: number | string;
  unpaidExpenses: number | string;
  pettyCashTopUps: number | string;
  cashTransfers: number | string;
  ownerPaid: number | string;
  cashIncome: number | string;
  cardIncome: number | string;
  talabatIncome: number | string;
  otherIncome: number | string;
  closingTotal: number | string;
  entryCount: number;
  supplierCount: number;
  closingCount: number;
  estimatedPettyCashBalance: number | string;
};

export type OperationsPageState = {
  success: boolean;
  message?: string;
  dateFrom: string;
  dateTo: string;
  overview: OperationsOverview | null;
  entries: FinanceEntry[];
  suppliers: OperationSupplier[];
  closings: CashClosing[];
  documents: OperationDocument[];
  previousOverdueTotal?: number;
};

export type ActionResult = {
  success: boolean;
  message?: string;
  entryId?: string;
};

function currentMonthRange() {
  const now = new Date();
  const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const today = new Date();

  return {
    dateFrom: first.toISOString().slice(0, 10),
    dateTo: today.toISOString().slice(0, 10),
  };
}

function cleanFileName(name: string) {
  return name
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120) || "document";
}

async function actorAndSlug() {
  const actor = await requireAuthenticatedUser();
  const businessSlug = await requireCurrentBusinessSlug();

  return { actor, businessSlug };
}

function revalidateFinancePages() {
  revalidatePath("/admin/operations");
  revalidatePath("/admin/finance");
  revalidatePath("/admin/finance/closing");
  revalidatePath("/admin/finance/invoices");
  revalidatePath("/admin/finance/cash");
}

async function getOperationsContext() {
  const { actor, businessSlug } = await actorAndSlug();
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc("_operations_get_context", {
    p_slug: businessSlug,
    p_actor_auth_user_id: actor.id,
    p_actor_email: actor.email,
  });

  const context = Array.isArray(data) ? data[0] : null;

  if (error || !context?.business_id) {
    return {
      success: false,
      message: error?.message ?? "Business access was not found.",
      actor,
      businessSlug,
      businessId: null as string | null,
      role: null as string | null,
    };
  }

  if (!["owner", "manager", "accountant"].includes(context.actor_role)) {
    return {
      success: false,
      message: "You do not have finance access.",
      actor,
      businessSlug,
      businessId: context.business_id as string,
      role: context.actor_role as string,
    };
  }

  return {
    success: true,
    actor,
    businessSlug,
    businessId: context.business_id as string,
    role: context.actor_role as string,
  };
}

async function listDocumentsForBusiness(businessId: string): Promise<OperationDocument[]> {
  const supabase = createSupabaseAdminClient();

  const { data } = await supabase
    .from("operation_documents")
    .select("id,business_id,owner_type,owner_id,file_path,file_name,mime_type,size_bytes,status,created_by_email,created_at")
    .eq("business_id", businessId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(250);

  return (data ?? []).map((item) => ({
    id: item.id,
    businessId: item.business_id,
    ownerType: item.owner_type,
    ownerId: item.owner_id,
    filePath: item.file_path,
    fileName: item.file_name,
    mimeType: item.mime_type,
    sizeBytes: item.size_bytes,
    status: item.status,
    createdByEmail: item.created_by_email,
    createdAt: item.created_at,
  })) as OperationDocument[];
}

export async function getOperationsPageState(input?: {
  dateFrom?: string;
  dateTo?: string;
}): Promise<OperationsPageState> {
  const { actor, businessSlug } = await actorAndSlug();
  const supabase = createSupabaseAdminClient();
  const defaultRange = currentMonthRange();
  const dateFrom = input?.dateFrom || defaultRange.dateFrom;
  const dateTo = input?.dateTo || defaultRange.dateTo;

  const [overviewResult, entriesResult, suppliersResult, closingsResult, contextResult] = await Promise.all([
    supabase.rpc("admin_get_operations_overview_fast", {
      p_slug: businessSlug,
      p_date_from: dateFrom,
      p_date_to: dateTo,
      p_actor_auth_user_id: actor.id,
      p_actor_email: actor.email,
    }),
    supabase.rpc("admin_list_finance_entries_fast", {
      p_slug: businessSlug,
      p_date_from: dateFrom,
      p_date_to: dateTo,
      p_status: "active",
      p_actor_auth_user_id: actor.id,
      p_actor_email: actor.email,
      p_limit: 150,
    }),
    supabase.rpc("admin_list_operation_suppliers_fast", {
      p_slug: businessSlug,
      p_actor_auth_user_id: actor.id,
      p_actor_email: actor.email,
    }),
    supabase.rpc("admin_list_cash_closings_fast", {
      p_slug: businessSlug,
      p_date_from: dateFrom,
      p_date_to: dateTo,
      p_actor_auth_user_id: actor.id,
      p_actor_email: actor.email,
      p_limit: 90,
    }),
    supabase.rpc("_operations_get_context", {
      p_slug: businessSlug,
      p_actor_auth_user_id: actor.id,
      p_actor_email: actor.email,
    }),
  ]);

  if (overviewResult.error || !overviewResult.data?.success) {
    return {
      success: false,
      message: overviewResult.data?.message ?? overviewResult.error?.message ?? "Operations access failed.",
      dateFrom,
      dateTo,
      overview: null,
      entries: [],
      suppliers: [],
      closings: [],
      documents: [],
    };
  }

  const context = Array.isArray(contextResult.data) ? contextResult.data[0] : null;
  const documents = context?.business_id ? await listDocumentsForBusiness(context.business_id) : [];

  return {
    success: true,
    dateFrom,
    dateTo,
    overview: overviewResult.data as OperationsOverview,
    entries: (entriesResult.data?.entries ?? []) as FinanceEntry[],
    suppliers: (suppliersResult.data?.suppliers ?? []) as OperationSupplier[],
    closings: (closingsResult.data?.closings ?? []) as CashClosing[],
    documents,
  };
}

export async function getDashboardOperationsState(input?: {
  dateFrom?: string;
  dateTo?: string;
}): Promise<OperationsPageState> {
  await requireModulePermission("dashboard", "view");
  const { actor, businessSlug } = await actorAndSlug();
  const supabase = createSupabaseAdminClient();
  const defaultRange = currentMonthRange();
  const dateFrom = input?.dateFrom || defaultRange.dateFrom;
  const dateTo = input?.dateTo || defaultRange.dateTo;

  const [overviewResult, entriesResult, closingsResult] = await Promise.all([
    supabase.rpc("admin_get_operations_overview_fast", {
      p_slug: businessSlug,
      p_date_from: dateFrom,
      p_date_to: dateTo,
      p_actor_auth_user_id: actor.id,
      p_actor_email: actor.email,
    }),
    supabase.rpc("admin_list_finance_entries_fast", {
      p_slug: businessSlug,
      p_date_from: dateFrom,
      p_date_to: dateTo,
      p_status: "active",
      p_actor_auth_user_id: actor.id,
      p_actor_email: actor.email,
      p_limit: 2000,
    }),
    supabase.rpc("admin_list_cash_closings_fast", {
      p_slug: businessSlug,
      p_date_from: dateFrom,
      p_date_to: dateTo,
      p_actor_auth_user_id: actor.id,
      p_actor_email: actor.email,
      p_limit: 10,
    }),
  ]);

  if (overviewResult.error || !overviewResult.data?.success) {
    return {
      success: false,
      message: overviewResult.data?.message ?? overviewResult.error?.message ?? "Dashboard finance summary failed.",
      dateFrom,
      dateTo,
      overview: null,
      entries: [],
      suppliers: [],
      closings: [],
      documents: [],
    };
  }

  return {
    success: true,
    dateFrom,
    dateTo,
    overview: overviewResult.data as OperationsOverview,
    entries: (entriesResult.data?.entries ?? []) as FinanceEntry[],
    suppliers: [],
    closings: (closingsResult.data?.closings ?? []) as CashClosing[],
    documents: [],
  };
}

export async function getFinanceClosingPageState(input?: {
  dateFrom?: string;
  dateTo?: string;
}): Promise<OperationsPageState> {
  await requireModulePermission("finance_closing", "view");
  const context = await getOperationsContext();
  const defaultRange = currentMonthRange();
  const dateFrom = input?.dateFrom || defaultRange.dateFrom;
  const dateTo = input?.dateTo || defaultRange.dateTo;

  if (!context.success || !context.businessSlug) {
    return {
      success: false,
      message: context.message ?? "Finance access failed.",
      dateFrom,
      dateTo,
      overview: null,
      entries: [],
      suppliers: [],
      closings: [],
      documents: [],
    };
  }

  const supabase = createSupabaseAdminClient();
  const closingsResult = await supabase.rpc("admin_list_cash_closings_fast", {
    p_slug: context.businessSlug,
    p_date_from: dateFrom,
    p_date_to: dateTo,
    p_actor_auth_user_id: context.actor.id,
    p_actor_email: context.actor.email,
    p_limit: 90,
  });

  if (closingsResult.error) {
    return {
      success: false,
      message: closingsResult.error.message ?? "Cash closings could not load.",
      dateFrom,
      dateTo,
      overview: null,
      entries: [],
      suppliers: [],
      closings: [],
      documents: [],
    };
  }

  return {
    success: true,
    dateFrom,
    dateTo,
    overview: null,
    entries: [],
    suppliers: [],
    closings: (closingsResult.data?.closings ?? []) as CashClosing[],
    documents: [],
  };
}

export async function getFinanceInvoicesPageState(input?: {
  dateFrom?: string;
  dateTo?: string;
}): Promise<OperationsPageState> {
  await requireModulePermission("finance_invoices", "view");
  const context = await getOperationsContext();
  const defaultRange = currentMonthRange();
  const dateFrom = input?.dateFrom || defaultRange.dateFrom;
  const dateTo = input?.dateTo || defaultRange.dateTo;

  if (!context.success || !context.businessSlug || !context.businessId) {
    return {
      success: false,
      message: context.message ?? "Finance access failed.",
      dateFrom,
      dateTo,
      overview: null,
      entries: [],
      suppliers: [],
      closings: [],
      documents: [],
    };
  }

  const supabase = createSupabaseAdminClient();
  const previousMonthEnd = new Date(`${dateFrom}T00:00:00Z`);
  previousMonthEnd.setUTCDate(previousMonthEnd.getUTCDate() - 1);
  const previousDateTo = previousMonthEnd.toISOString().slice(0, 10);

  const [entriesResult, previousEntriesResult, suppliersResult, documents] = await Promise.all([
    supabase.rpc("admin_list_finance_entries_fast", {
      p_slug: context.businessSlug,
      p_date_from: dateFrom,
      p_date_to: dateTo,
      p_status: "active",
      p_actor_auth_user_id: context.actor.id,
      p_actor_email: context.actor.email,
      p_limit: 500,
    }),
    supabase.rpc("admin_list_finance_entries_fast", {
      p_slug: context.businessSlug,
      p_date_from: "2000-01-01",
      p_date_to: previousDateTo,
      p_status: "active",
      p_actor_auth_user_id: context.actor.id,
      p_actor_email: context.actor.email,
      p_limit: 2000,
    }),
    supabase.rpc("admin_list_operation_suppliers_fast", {
      p_slug: context.businessSlug,
      p_actor_auth_user_id: context.actor.id,
      p_actor_email: context.actor.email,
    }),
    listDocumentsForBusiness(context.businessId),
  ]);

  if (entriesResult.error || previousEntriesResult.error || suppliersResult.error) {
    return {
      success: false,
      message: entriesResult.error?.message ?? previousEntriesResult.error?.message ?? suppliersResult.error?.message ?? "Invoices could not load.",
      dateFrom,
      dateTo,
      overview: null,
      entries: [],
      suppliers: [],
      closings: [],
      documents: [],
    };
  }

  return {
    success: true,
    dateFrom,
    dateTo,
    overview: null,
    entries: (entriesResult.data?.entries ?? []) as FinanceEntry[],
    suppliers: (suppliersResult.data?.suppliers ?? []) as OperationSupplier[],
    closings: [],
    documents,
    previousOverdueTotal: ((previousEntriesResult.data?.entries ?? []) as FinanceEntry[])
      .filter((entry) => (entry.entryType === "expense" || entry.entryType === "cash_drawer_expense") && entry.paymentStatus !== "paid")
      .reduce((sum, entry) => sum + Number(entry.amount || 0), 0),
  };
}

export async function getFinanceCashPageState(input?: {
  dateFrom?: string;
  dateTo?: string;
}): Promise<OperationsPageState> {
  await requireModulePermission("finance_cash", "view");
  const context = await getOperationsContext();
  const defaultRange = currentMonthRange();
  const dateFrom = input?.dateFrom || defaultRange.dateFrom;
  const dateTo = input?.dateTo || defaultRange.dateTo;

  if (!context.success || !context.businessSlug) {
    return {
      success: false,
      message: context.message ?? "Finance access failed.",
      dateFrom,
      dateTo,
      overview: null,
      entries: [],
      suppliers: [],
      closings: [],
      documents: [],
    };
  }

  const supabase = createSupabaseAdminClient();
  const [entriesResult, closingsResult] = await Promise.all([
    supabase.rpc("admin_list_finance_entries_fast", {
      p_slug: context.businessSlug,
      p_date_from: dateFrom,
      p_date_to: dateTo,
      p_status: "active",
      p_actor_auth_user_id: context.actor.id,
      p_actor_email: context.actor.email,
      p_limit: 150,
    }),
    supabase.rpc("admin_list_cash_closings_fast", {
      p_slug: context.businessSlug,
      p_date_from: dateFrom,
      p_date_to: dateTo,
      p_actor_auth_user_id: context.actor.id,
      p_actor_email: context.actor.email,
      p_limit: 90,
    }),
  ]);

  if (entriesResult.error || closingsResult.error) {
    return {
      success: false,
      message:
        entriesResult.error?.message ??
        closingsResult.error?.message ??
        "Cash page could not load.",
      dateFrom,
      dateTo,
      overview: null,
      entries: [],
      suppliers: [],
      closings: [],
      documents: [],
    };
  }

  return {
    success: true,
    dateFrom,
    dateTo,
    overview: null,
    entries: (entriesResult.data?.entries ?? []) as FinanceEntry[],
    suppliers: [],
    closings: (closingsResult.data?.closings ?? []) as CashClosing[],
    documents: [],
  };
}

export async function saveSupplier(input: {
  id?: string | null;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  active?: boolean;
}): Promise<ActionResult> {
  await requireAnyModulePermission(["finance_invoices", "finance_cash"], "edit");
  const { actor, businessSlug } = await actorAndSlug();
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc("admin_save_operation_supplier_fast", {
    p_slug: businessSlug,
    p_supplier_id: input.id || null,
    p_name: input.name,
    p_phone: input.phone || null,
    p_email: input.email || null,
    p_notes: input.notes || null,
    p_is_active: input.active ?? true,
    p_actor_auth_user_id: actor.id,
    p_actor_email: actor.email,
  });

  revalidateFinancePages();

  if (error || !data?.success) {
    return {
      success: false,
      message: data?.message ?? error?.message ?? "Supplier save failed.",
    };
  }

  return {
    success: true,
    message: data.message ?? "Supplier saved.",
  };
}

export async function saveFinanceEntry(input: {
  id?: string | null;
  entryDate: string;
  entryType: string;
  title: string;
  amount: string;
  supplierId?: string | null;
  paymentStatus: string;
  payer: string;
  usagePlace: string;
  referenceNo?: string;
  description?: string;
}): Promise<ActionResult> {
  await requireAnyModulePermission(["finance_invoices", "finance_cash"], "edit");
  const { actor, businessSlug } = await actorAndSlug();
  const supabase = createSupabaseAdminClient();

  const amount = Number(input.amount || 0); const paymentStatus = input.paymentStatus === "paid" ? "paid" : "unpaid"; const normalizedPayer = paymentStatus === "paid" ? (input.payer || "petty_cash") : "other";

  const { data, error } = await supabase.rpc("admin_save_finance_entry_fast", {
    p_slug: businessSlug,
    p_entry_id: input.id || null,
    p_entry_date: input.entryDate,
    p_entry_type: input.entryType,
    p_title: input.title?.trim() || "",
    p_amount: Number.isFinite(amount) ? amount : 0,
    p_supplier_id: input.supplierId || null,
    p_payment_status: paymentStatus, p_payer: normalizedPayer,
    p_usage_place: input.usagePlace,
    p_reference_no: input.referenceNo || null,
    p_description: input.description || null,
    p_actor_auth_user_id: actor.id,
    p_actor_email: actor.email,
  });

  revalidateFinancePages();

  if (error || !data?.success) {
    return {
      success: false,
      message: data?.message ?? error?.message ?? "Finance entry save failed.",
    };
  }

  return {
    success: true,
    message: data.message ?? "Finance entry saved.",
    entryId: data.entryId ?? input.id ?? undefined,
  };
}

export async function voidFinanceEntry(input: {
  id: string;
  reason?: string;
}): Promise<ActionResult> {
  await requireAnyModulePermission(["finance_invoices", "finance_cash"], "edit");
  const { actor, businessSlug } = await actorAndSlug();
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc("admin_void_finance_entry_fast", {
    p_slug: businessSlug,
    p_entry_id: input.id,
    p_void_reason: input.reason || "Voided from operations page",
    p_actor_auth_user_id: actor.id,
    p_actor_email: actor.email,
  });

  revalidateFinancePages();

  if (error || !data?.success) {
    return {
      success: false,
      message: data?.message ?? error?.message ?? "Void failed.",
    };
  }

  return {
    success: true,
    message: data.message ?? "Entry voided.",
  };
}

export async function saveCashClosing(input: {
  id?: string | null;
  closingDate: string;
  cashAmount: string;
  cardAmount: string;
  talabatAmount: string;
  otherAmount: string;
  notes?: string;
}): Promise<ActionResult> {
  await requireModulePermission("finance_closing", "edit");
  const { actor, businessSlug } = await actorAndSlug();
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc("admin_save_cash_closing_fast", {
    p_slug: businessSlug,
    p_closing_id: input.id || null,
    p_closing_date: input.closingDate,
    p_cash_amount: Number(input.cashAmount || 0),
    p_card_amount: Number(input.cardAmount || 0),
    p_talabat_amount: Number(input.talabatAmount || 0),
    p_other_amount: Number(input.otherAmount || 0),
    p_notes: input.notes || null,
    p_actor_auth_user_id: actor.id,
    p_actor_email: actor.email,
  });

  revalidateFinancePages();

  if (error || !data?.success) {
    return {
      success: false,
      message: data?.message ?? error?.message ?? "Cash closing save failed.",
    };
  }

  return {
    success: true,
    message: data.message ?? "Cash closing saved.",
  };
}

export async function uploadOperationDocument(formData: FormData): Promise<ActionResult> {
  const context = await getOperationsContext();

  if (!context.success || !context.businessId) {
    return {
      success: false,
      message: context.message ?? "Finance access failed.",
    };
  }

  const ownerType = String(formData.get("ownerType") ?? "");
  await requireAnyModulePermission(
    ownerType === "cash_closing" ? ["finance_closing"] : ["finance_invoices", "finance_cash"],
    "edit",
  );
  const ownerId = String(formData.get("ownerId") ?? "");
  const file = formData.get("file");

  if (!["finance_entry", "cash_closing", "supplier"].includes(ownerType)) {
    return {
      success: false,
      message: "Invalid document owner.",
    };
  }

  if (!ownerId) {
    return {
      success: false,
      message: "Select a saved record before uploading a document.",
    };
  }

  if (!(file instanceof File) || file.size <= 0) {
    return {
      success: false,
      message: "Please select a file.",
    };
  }

  if (file.size > 10 * 1024 * 1024) {
    return {
      success: false,
      message: "File is too large. Maximum is 10MB.",
    };
  }

  const supabase = createSupabaseAdminClient();

  const table =
    ownerType === "finance_entry"
      ? "finance_entries"
      : ownerType === "cash_closing"
        ? "cash_closings"
        : "operation_suppliers";

  const { data: owner, error: ownerError } = await supabase
    .from(table)
    .select("id,business_id")
    .eq("id", ownerId)
    .eq("business_id", context.businessId)
    .maybeSingle();

  if (ownerError || !owner) {
    return {
      success: false,
      message: "The selected record was not found for this business.",
    };
  }

  const cleanName = cleanFileName(file.name);
  const filePath = `${context.businessId}/${ownerType}/${ownerId}/${crypto.randomUUID()}-${cleanName}`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("operation-documents")
    .upload(filePath, fileBuffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    return {
      success: false,
      message: uploadError.message,
    };
  }

  const { error: insertError } = await supabase.from("operation_documents").insert({
    business_id: context.businessId,
    owner_type: ownerType,
    owner_id: ownerId,
    file_path: filePath,
    file_name: file.name,
    mime_type: file.type || null,
    size_bytes: file.size,
    created_by: context.actor.id,
    created_by_email: context.actor.email,
  });

  if (insertError) {
    await supabase.storage.from("operation-documents").remove([filePath]);

    return {
      success: false,
      message: insertError.message,
    };
  }

  revalidateFinancePages();

  return {
    success: true,
    message: "Document uploaded.",
  };
}


export async function uploadOperationDocuments(formData: FormData): Promise<ActionResult> {
  const context = await getOperationsContext();

  if (!context.success || !context.businessId) {
    return {
      success: false,
      message: context.message ?? "Finance access failed.",
    };
  }

  const ownerType = String(formData.get("ownerType") ?? "");
  await requireAnyModulePermission(
    ownerType === "cash_closing" ? ["finance_closing"] : ["finance_invoices", "finance_cash"],
    "edit",
  );

  const ownerId = String(formData.get("ownerId") ?? "");
  const files = formData
    .getAll("files")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (!["finance_entry", "cash_closing", "supplier"].includes(ownerType)) {
    return {
      success: false,
      message: "Invalid document owner.",
    };
  }

  if (!ownerId) {
    return {
      success: false,
      message: "Select a saved record before uploading documents.",
    };
  }

  if (files.length === 0) {
    return {
      success: false,
      message: "Please select at least one file.",
    };
  }

  if (files.length > 10) {
    return {
      success: false,
      message: "You can upload up to 10 files per invoice.",
    };
  }

  const allowedFiles = files.every(
    (file) => file.type.startsWith("image/") || file.type === "application/pdf",
  );

  if (!allowedFiles) {
    return {
      success: false,
      message: "Only image and PDF files are allowed.",
    };
  }

  const oversizedFile = files.find((file) => file.size > 10 * 1024 * 1024);
  if (oversizedFile) {
    return {
      success: false,
      message: `${oversizedFile.name} is too large. Maximum size per file is 10MB.`,
    };
  }

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  if (totalBytes > 45 * 1024 * 1024) {
    return {
      success: false,
      message: "The selected files are too large together. Maximum total size is 45MB.",
    };
  }

  const supabase = createSupabaseAdminClient();
  const table =
    ownerType === "finance_entry"
      ? "finance_entries"
      : ownerType === "cash_closing"
        ? "cash_closings"
        : "operation_suppliers";

  const { data: owner, error: ownerError } = await supabase
    .from(table)
    .select("id,business_id")
    .eq("id", ownerId)
    .eq("business_id", context.businessId)
    .maybeSingle();

  if (ownerError || !owner) {
    return {
      success: false,
      message: "The selected record was not found for this business.",
    };
  }

  const uploaded: Array<{
    filePath: string;
    fileName: string;
    mimeType: string | null;
    sizeBytes: number;
  }> = [];

  for (const file of files) {
    const cleanName = cleanFileName(file.name);
    const filePath = `${context.businessId}/${ownerType}/${ownerId}/${crypto.randomUUID()}-${cleanName}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("operation-documents")
      .upload(filePath, fileBuffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      if (uploaded.length > 0) {
        await supabase.storage.from("operation-documents").remove(uploaded.map((item) => item.filePath));
      }

      return {
        success: false,
        message: `${file.name}: ${uploadError.message}`,
      };
    }

    uploaded.push({
      filePath,
      fileName: file.name,
      mimeType: file.type || null,
      sizeBytes: file.size,
    });
  }

  const { error: insertError } = await supabase.from("operation_documents").insert(
    uploaded.map((item) => ({
      business_id: context.businessId,
      owner_type: ownerType,
      owner_id: ownerId,
      file_path: item.filePath,
      file_name: item.fileName,
      mime_type: item.mimeType,
      size_bytes: item.sizeBytes,
      created_by: context.actor.id,
      created_by_email: context.actor.email,
    })),
  );

  if (insertError) {
    await supabase.storage.from("operation-documents").remove(uploaded.map((item) => item.filePath));

    return {
      success: false,
      message: insertError.message,
    };
  }

  revalidateFinancePages();

  return {
    success: true,
    message: `${uploaded.length} attachment${uploaded.length === 1 ? "" : "s"} uploaded.`,
  };
}

export async function getOperationDocumentSignedUrl(input: {
  documentId: string;
}): Promise<{ success: boolean; message?: string; url?: string }> {
  await requireAnyModulePermission(["finance_invoices", "finance_closing", "finance_cash"], "view");
  const context = await getOperationsContext();

  if (!context.success || !context.businessId) {
    return {
      success: false,
      message: context.message ?? "Finance access failed.",
    };
  }

  const supabase = createSupabaseAdminClient();

  const { data: document, error } = await supabase
    .from("operation_documents")
    .select("id,business_id,file_path,status")
    .eq("id", input.documentId)
    .eq("business_id", context.businessId)
    .eq("status", "active")
    .maybeSingle();

  if (error || !document) {
    return {
      success: false,
      message: "Document was not found.",
    };
  }

  const { data, error: signedError } = await supabase.storage
    .from("operation-documents")
    .createSignedUrl(document.file_path, 60 * 5);

  if (signedError || !data?.signedUrl) {
    return {
      success: false,
      message: signedError?.message ?? "Could not create document link.",
    };
  }

  return {
    success: true,
    url: data.signedUrl,
  };
}
