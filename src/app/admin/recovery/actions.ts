"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireCurrentBusinessSlug } from "@/lib/auth-session";
import { requireModulePermission } from "@/lib/user-permissions";
import type { FeedbackSegment, LanguageCode } from "@/types/feedback";

export type RecoveryStatus = "open" | "in_progress" | "resolved" | "closed";
export type RecoveryPriority = "low" | "normal" | "high" | "urgent";
export type RecoveryTaskStatus = "pending" | "done" | "skipped";

export type RecoveryBoardStatusFilter = RecoveryStatus | "all";
export type RecoveryBoardPriorityFilter = RecoveryPriority | "all";

export type RecoveryBoardStats = {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  urgent: number;
  filtered: number;
};

export type RecoveryBoardPagination = {
  limit: number;
  offset: number;
  filteredTotal: number;
  hasMore: boolean;
};

export type RecoveryBoardCase = {
  id: string;
  feedbackSubmissionId: string;
  customerId: string | null;
  phone: string;
  status: RecoveryStatus;
  priority: RecoveryPriority;
  complaintReason: string | null;
  resolutionSummary: string | null;
  assignedTo: string | null;
  startedAt: string;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  score: number;
  segment: FeedbackSegment;
  language: LanguageCode;
  feedbackCreatedAt: string;
  taskTotal: number;
  taskDone: number;
};

export type RecoveryTask = {
  id: string;
  caseId: string;
  stepOrder: number;
  title: string;
  description: string | null;
  status: RecoveryTaskStatus;
  note: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RecoveryCaseDetail = {
  id: string;
  businessId: string;
  feedbackSubmissionId: string;
  customerId: string | null;
  phone: string;
  status: RecoveryStatus;
  priority: RecoveryPriority;
  complaintReason: string | null;
  resolutionSummary: string | null;
  assignedTo: string | null;
  startedAt: string;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  tasks: RecoveryTask[];
  feedback: {
    id: string;
    phone: string;
    language: LanguageCode;
    overallScore: number;
    segment: FeedbackSegment;
    customerMessage: string | null;
    createdAt: string;
    answers: {
      id: string;
      questionType: string;
      questionTextEn: string | null;
      questionTextAr: string | null;
      questionTextFa: string | null;
      answerText: string | null;
      scoreValue: number | null;
    }[];
  };
};

export type RecoveryBoardState = {
  success: boolean;
  message?: string;
  business: { id: string; name: string; slug: string } | null;
  stats: RecoveryBoardStats;
  cases: RecoveryBoardCase[];
  pagination: RecoveryBoardPagination;
};

export type RecoveryCaseDetailState = {
  success: boolean;
  message?: string;
  case: RecoveryCaseDetail | null;
};

export type GetRecoveryBoardInput = {
  status?: RecoveryBoardStatusFilter;
  priority?: RecoveryBoardPriorityFilter;
  search?: string;
  limit?: number;
  offset?: number;
};

const emptyStats: RecoveryBoardStats = {
  total: 0,
  open: 0,
  inProgress: 0,
  resolved: 0,
  closed: 0,
  urgent: 0,
  filtered: 0,
};

const emptyPagination: RecoveryBoardPagination = {
  limit: 25,
  offset: 0,
  filteredTotal: 0,
  hasMore: false,
};

export async function getRecoveryBoard(
  input: GetRecoveryBoardInput = {}
): Promise<RecoveryBoardState> {
  await requireModulePermission("followups", "view");
  const supabase = createSupabaseAdminClient();
  const businessSlug = await requireCurrentBusinessSlug();

  const { data, error } = await supabase.rpc("admin_get_recovery_board_fast", {
    p_slug: businessSlug,
    p_status: input.status ?? "all",
    p_priority: input.priority ?? "all",
    p_search: input.search?.trim() || null,
    p_limit: input.limit ?? 25,
    p_offset: input.offset ?? 0,
  });

  if (error) {
    return {
      success: false,
      message: error.message,
      business: null,
      stats: emptyStats,
      cases: [],
      pagination: emptyPagination,
    };
  }

  return data as RecoveryBoardState;
}

export async function getRecoveryCaseDetail(
  caseId: string
): Promise<RecoveryCaseDetailState> {
  await requireModulePermission("followups", "view");
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc("admin_get_recovery_case_detail_fast", {
    p_case_id: caseId,
  });

  if (error) {
    return {
      success: false,
      message: error.message,
      case: null,
    };
  }

  return data as RecoveryCaseDetailState;
}

export async function updateRecoveryTask(input: {
  taskId: string;
  status: RecoveryTaskStatus;
  note?: string | null;
}): Promise<RecoveryCaseDetailState> {
  await requireModulePermission("followups", "edit");
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc("admin_update_recovery_task_fast", {
    p_task_id: input.taskId,
    p_status: input.status,
    p_note: input.note ?? null,
  });

  if (error) {
    return {
      success: false,
      message: error.message,
      case: null,
    };
  }

  if (!data?.feedback?.recoveryCase?.id) {
    return {
      success: false,
      message: "Recovery case was updated, but detail reload failed.",
      case: null,
    };
  }

  return getRecoveryCaseDetail(data.feedback.recoveryCase.id);
}

export async function updateRecoveryCase(input: {
  caseId: string;
  status?: RecoveryStatus;
  complaintReason?: string | null;
  resolutionSummary?: string | null;
  assignedTo?: string | null;
}): Promise<RecoveryCaseDetailState> {
  await requireModulePermission("followups", "edit");
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc("admin_update_recovery_case_fast", {
    p_case_id: input.caseId,
    p_status: input.status ?? null,
    p_complaint_reason: input.complaintReason ?? null,
    p_resolution_summary: input.resolutionSummary ?? null,
    p_assigned_to: input.assignedTo ?? null,
  });

  if (error) {
    return {
      success: false,
      message: error.message,
      case: null,
    };
  }

  if (!data?.feedback?.recoveryCase?.id) {
    return {
      success: false,
      message: "Recovery case was updated, but detail reload failed.",
      case: null,
    };
  }

  return getRecoveryCaseDetail(data.feedback.recoveryCase.id);
}
