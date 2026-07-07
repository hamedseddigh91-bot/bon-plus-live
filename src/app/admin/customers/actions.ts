"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireCurrentBusinessSlug } from "@/lib/auth-session";
import { requireModulePermission } from "@/lib/user-permissions";
import type { FeedbackSegment, LanguageCode, RewardType } from "@/types/feedback";

export type CustomerRiskFilter = "all" | "repeat" | "low_score" | "unhappy";

export type CustomerDirectoryStats = {
  total: number;
  repeatCustomers: number;
  lowScoreCustomers: number;
  unhappyCustomers: number;
  filtered: number;
};

export type CustomerDirectoryPagination = {
  limit: number;
  offset: number;
  filteredTotal: number;
  hasMore: boolean;
};

export type CustomerDirectoryRow = {
  id: string;
  phone: string;
  language: LanguageCode;
  feedbackCount: number;
  averageScore: number;
  lastSeenAt: string | null;
  createdAt: string;
  lastFeedbackScore: number | null;
  lastFeedbackSegment: FeedbackSegment | null;
  openRecoveryCount: number;
  rewardCodeCount: number;
};

export type CustomerDirectoryState = {
  success: boolean;
  message?: string;
  business: { id: string; name: string; slug: string } | null;
  stats: CustomerDirectoryStats;
  customers: CustomerDirectoryRow[];
  pagination: CustomerDirectoryPagination;
};

export type CustomerProfile = {
  id: string;
  phone: string;
  language: LanguageCode;
  feedbackCount: number;
  averageScore: number;
  lastSeenAt: string | null;
  createdAt: string;
  sourceName: string | null;
  feedback: {
    id: string;
    phone: string;
    language: LanguageCode;
    overallScore: number;
    segment: FeedbackSegment;
    customerMessage: string | null;
    rewardGenerated: boolean;
    createdAt: string;
    recoveryStatus: string | null;
  }[];
  rewardCodes: {
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
  }[];
  recoveryCases: {
    id: string;
    feedbackSubmissionId: string;
    status: string;
    priority: string;
    complaintReason: string | null;
    resolutionSummary: string | null;
    startedAt: string;
    resolvedAt: string | null;
    createdAt: string;
  }[];
};

export type CustomerProfileState = {
  success: boolean;
  message?: string;
  customer: CustomerProfile | null;
};

export type GetCustomerDirectoryInput = {
  search?: string;
  minScore?: number | null;
  maxScore?: number | null;
  riskFilter?: CustomerRiskFilter;
  limit?: number;
  offset?: number;
};

const emptyStats: CustomerDirectoryStats = {
  total: 0,
  repeatCustomers: 0,
  lowScoreCustomers: 0,
  unhappyCustomers: 0,
  filtered: 0,
};

const emptyPagination: CustomerDirectoryPagination = {
  limit: 25,
  offset: 0,
  filteredTotal: 0,
  hasMore: false,
};

export async function getCustomerDirectory(
  input: GetCustomerDirectoryInput = {}
): Promise<CustomerDirectoryState> {
  await requireModulePermission("customers", "view");
  const supabase = createSupabaseAdminClient();
  const businessSlug = await requireCurrentBusinessSlug();

  const { data, error } = await supabase.rpc("admin_get_customer_directory_fast", {
    p_slug: businessSlug,
    p_search: input.search?.trim() || null,
    p_min_score: input.minScore ?? null,
    p_max_score: input.maxScore ?? null,
    p_risk_filter: input.riskFilter ?? "all",
    p_limit: input.limit ?? 25,
    p_offset: input.offset ?? 0,
  });

  if (error) {
    return {
      success: false,
      message: error.message,
      business: null,
      stats: emptyStats,
      customers: [],
      pagination: emptyPagination,
    };
  }

  return data as CustomerDirectoryState;
}

export async function getCustomerProfile(
  customerId: string
): Promise<CustomerProfileState> {
  await requireModulePermission("customers", "view");
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc("admin_get_customer_profile_fast", {
    p_customer_id: customerId,
  });

  if (error) {
    return {
      success: false,
      message: error.message,
      customer: null,
    };
  }

  return data as CustomerProfileState;
}
