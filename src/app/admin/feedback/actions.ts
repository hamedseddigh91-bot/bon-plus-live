"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireCurrentBusinessSlug } from "@/lib/auth-session";
import { requireModulePermission } from "@/lib/user-permissions";
import type { FeedbackSegment, LanguageCode, RewardType } from "@/types/feedback";

export type FeedbackInboxSegmentFilter = FeedbackSegment | "all";
export type FeedbackInboxRewardFilter = "all" | "with_reward" | "without_reward";

export type FeedbackInboxBusiness = {
  id: string;
  name: string;
  slug: string;
};

export type FeedbackInboxStats = {
  totalFeedback: number;
  filteredFeedback: number;
  averageScore: number;
  satisfiedCount: number;
  mediumCount: number;
  unhappyCount: number;
  rewardCount: number;
  alertCount: number;
};

export type FeedbackInboxPagination = {
  limit: number;
  offset: number;
  filteredTotal: number;
  hasMore: boolean;
};

export type FeedbackInboxRow = {
  id: string;
  phone: string;
  language: LanguageCode;
  overallScore: number;
  segment: FeedbackSegment;
  customerMessage: string | null;
  rewardGenerated: boolean;
  googleMapsLinkShown: boolean;
  createdAt: string;
  answerCount: number;
  rewardCodeCount: number;
  alertCount: number;
  rewardPreview: string | null;
  summary: string | null;
  recoveryStatus: "not_created" | "open" | "in_progress" | "resolved" | "closed" | null;
  recoveryCaseId: string | null;
  workflowStage: "new" | "follow_up" | "resolved";
};

export type FeedbackInboxState = {
  success: boolean;
  message?: string;
  business: FeedbackInboxBusiness | null;
  stats: FeedbackInboxStats;
  feedback: FeedbackInboxRow[];
  pagination: FeedbackInboxPagination;
};

export type FeedbackDetailAnswer = {
  id: string;
  questionId: string;
  questionType: string;
  questionTextEn: string | null;
  questionTextAr: string | null;
  questionTextFa: string | null;
  answerText: string | null;
  scoreValue: number | null;
  createdAt: string;
};

export type FeedbackDetailRewardCode = {
  id: string;
  code: string;
  rewardType: RewardType;
  discountValue: number | null;
  freeItemName: string | null;
  expiresAt: string | null;
  usageLimit: number;
  usedCount: number;
  status: string;
  createdAt: string;
};

export type FeedbackDetailNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  severity: string;
  createdAt: string;
};

export type FeedbackDetailCustomer = {
  id: string;
  phone: string;
  language: LanguageCode;
  feedbackCount: number;
  averageScore: number;
  lastSeenAt: string | null;
  createdAt: string;
  sourceName: string | null;
};

export type FeedbackRecoveryTask = {
  id: string;
  caseId: string;
  stepOrder: number;
  title: string;
  description: string | null;
  status: "pending" | "done" | "skipped";
  note: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FeedbackRecoveryCase = {
  id: string;
  businessId: string;
  feedbackSubmissionId: string;
  customerId: string | null;
  phone: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "normal" | "high" | "urgent";
  complaintReason: string | null;
  resolutionSummary: string | null;
  assignedTo: string | null;
  startedAt: string;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  tasks: FeedbackRecoveryTask[];
};

export type FeedbackDetail = {
  id: string;
  phone: string;
  language: LanguageCode;
  overallScore: number;
  segment: FeedbackSegment;
  customerMessage: string | null;
  googleMapsLinkShown: boolean;
  rewardGenerated: boolean;
  createdAt: string;
  customer: FeedbackDetailCustomer | null;
  answers: FeedbackDetailAnswer[];
  rewardCodes: FeedbackDetailRewardCode[];
  notifications: FeedbackDetailNotification[];
  recoveryCase: FeedbackRecoveryCase | null;
};

export type FeedbackDetailState = {
  success: boolean;
  message?: string;
  feedback: FeedbackDetail | null;
};

export type GetFeedbackInboxInput = {
  segment?: FeedbackInboxSegmentFilter;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  minScore?: number | null;
  maxScore?: number | null;
  rewardFilter?: FeedbackInboxRewardFilter;
  limit?: number;
  offset?: number;
};

export type UpdateRecoveryCaseInput = {
  caseId: string;
  status?: FeedbackRecoveryCase["status"];
  complaintReason?: string | null;
  resolutionSummary?: string | null;
  assignedTo?: string | null;
};

export type UpdateRecoveryTaskInput = {
  taskId: string;
  status: FeedbackRecoveryTask["status"];
  note?: string | null;
};

const emptyStats: FeedbackInboxStats = {
  totalFeedback: 0,
  filteredFeedback: 0,
  averageScore: 0,
  satisfiedCount: 0,
  mediumCount: 0,
  unhappyCount: 0,
  rewardCount: 0,
  alertCount: 0,
};

const emptyPagination: FeedbackInboxPagination = {
  limit: 25,
  offset: 0,
  filteredTotal: 0,
  hasMore: false,
};

export async function getAdminFeedbackInbox(
  input: GetFeedbackInboxInput = {}
): Promise<FeedbackInboxState> {
  await requireModulePermission("feedback", "view");
  const supabase = createSupabaseAdminClient();
  const businessSlug = await requireCurrentBusinessSlug();

  const { data, error } = await supabase.rpc("admin_get_feedback_inbox_fast", {
    p_slug: businessSlug,
    p_segment:
      input.segment && input.segment !== "all" ? input.segment : null,
    p_search: input.search?.trim() || null,
    p_date_from: input.dateFrom || null,
    p_date_to: input.dateTo || null,
    p_min_score: input.minScore ?? null,
    p_max_score: input.maxScore ?? null,
    p_reward_filter: input.rewardFilter ?? "all",
    p_limit: input.limit ?? 200,
    p_offset: input.offset ?? 0,
  });

  if (error) {
    return {
      success: false,
      message: error.message,
      business: null,
      stats: emptyStats,
      feedback: [],
      pagination: emptyPagination,
    };
  }

  const inbox = data as FeedbackInboxState;
  const feedbackIds = inbox.feedback.map((item) => item.id);

  if (feedbackIds.length > 0) {
    const { data: workflowRows, error: workflowError } = await supabase
      .from("feedback_submissions")
      .select("id, workflow_stage")
      .in("id", feedbackIds);

    if (!workflowError && workflowRows) {
      const workflowById = new Map(
        workflowRows.map((row) => [
          row.id as string,
          (row.workflow_stage as "new" | "follow_up" | "resolved" | null) ?? "new",
        ]),
      );

      inbox.feedback = inbox.feedback.map((item) => ({
        ...item,
        workflowStage: workflowById.get(item.id) ?? "new",
      }));
    } else {
      inbox.feedback = inbox.feedback.map((item) => ({
        ...item,
        workflowStage:
          item.recoveryStatus === "resolved" || item.recoveryStatus === "closed"
            ? "resolved"
            : item.recoveryStatus === "open" || item.recoveryStatus === "in_progress"
              ? "follow_up"
              : "new",
      }));
    }
  }

  return inbox;
}

export async function getAdminFeedbackDetail(
  feedbackId: string
): Promise<FeedbackDetailState> {
  await requireModulePermission("feedback", "view");
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc("admin_get_feedback_detail_fast", {
    p_feedback_id: feedbackId,
  });

  if (error) {
    return {
      success: false,
      message: error.message,
      feedback: null,
    };
  }

  return data as FeedbackDetailState;
}

export async function startFeedbackRecovery(
  feedbackId: string
): Promise<FeedbackDetailState> {
  await requireModulePermission("feedback", "edit");
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc("admin_start_feedback_recovery_fast", {
    p_feedback_id: feedbackId,
  });

  if (error) {
    return {
      success: false,
      message: error.message,
      feedback: null,
    };
  }

  return data as FeedbackDetailState;
}

export async function updateFeedbackRecoveryTask(
  input: UpdateRecoveryTaskInput
): Promise<FeedbackDetailState> {
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
      feedback: null,
    };
  }

  return data as FeedbackDetailState;
}

export async function updateFeedbackRecoveryCase(
  input: UpdateRecoveryCaseInput
): Promise<FeedbackDetailState> {
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
      feedback: null,
    };
  }

  return data as FeedbackDetailState;
}
export type FeedbackWorkflowStage = "new" | "follow_up" | "resolved";

export type MoveFeedbackWorkflowResult = {
  success: boolean;
  message?: string;
};

export async function moveFeedbackWorkflow(
  feedbackId: string,
  targetStage: FeedbackWorkflowStage,
): Promise<MoveFeedbackWorkflowResult> {
  await requireModulePermission("feedback", "edit");
  const supabase = createSupabaseAdminClient();

  if (targetStage === "new") {
  const { error: recoveryError } = await supabase
  .from("feedback_recovery_cases")
  .update({ status: "open", resolved_at: null })
  .eq("feedback_submission_id", feedbackId);
  if (recoveryError) {
  return { success: false, message: recoveryError.message };
  }
  }

  if (targetStage === "follow_up") {
    const { data: existingCase, error: caseLookupError } = await supabase
      .from("feedback_recovery_cases")
      .select("id")
      .eq("feedback_submission_id", feedbackId)
      .maybeSingle();

    if (caseLookupError) {
      return { success: false, message: caseLookupError.message };
    }

    if (!existingCase) {
      const { error: startError } = await supabase.rpc("admin_start_feedback_recovery_fast", {
        p_feedback_id: feedbackId,
      });

      if (startError) {
        return { success: false, message: startError.message };
      }
    }

    const { error: recoveryError } = await supabase
      .from("feedback_recovery_cases")
      .update({ status: "in_progress", resolved_at: null })
      .eq("feedback_submission_id", feedbackId);

    if (recoveryError) {
      return { success: false, message: recoveryError.message };
    }
  }

  if (targetStage === "resolved") {
    const { error: recoveryError } = await supabase
      .from("feedback_recovery_cases")
      .update({ status: "resolved", resolved_at: new Date().toISOString() })
      .eq("feedback_submission_id", feedbackId);

    if (recoveryError) {
      return { success: false, message: recoveryError.message };
    }
  }

  const { error } = await supabase
    .from("feedback_submissions")
    .update({ workflow_stage: targetStage })
    .eq("id", feedbackId);

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true };
}



