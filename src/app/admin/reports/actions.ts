"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentBusinessSlug } from "@/lib/business-context";
import { requireModulePermission } from "@/lib/user-permissions";

export type ReportsState = {
  success: boolean;
  message?: string;
  business: { id: string; name: string; slug: string } | null;
  range: {
    dateFrom: string;
    dateTo: string;
  };
  kpis: {
    totalFeedback: number;
    averageScore: number;
    satisfied: number;
    medium: number;
    unhappy: number;
    newCustomers: number;
    rewardCodes: number;
    usedRewards: number;
    recoveryTotal: number;
    recoveryResolved: number;
    recoveryResolutionRate: number;
  };
  daily: {
    date: string;
    total: number;
    avgScore: number;
    satisfied: number;
    medium: number;
    unhappy: number;
  }[];
};

export async function getReports(input: {
  dateFrom?: string;
  dateTo?: string;
} = {}): Promise<ReportsState> {
  await requireModulePermission("reports", "view");
  const supabase = createSupabaseAdminClient();
  const businessSlug = await getCurrentBusinessSlug();

  const { data, error } = await supabase.rpc("admin_get_reports_fast", {
    p_slug: businessSlug,
    p_date_from: input.dateFrom || null,
    p_date_to: input.dateTo || null,
  });

  if (error) {
    return {
      success: false,
      message: error.message,
      business: null,
      range: { dateFrom: "", dateTo: "" },
      kpis: {
        totalFeedback: 0,
        averageScore: 0,
        satisfied: 0,
        medium: 0,
        unhappy: 0,
        newCustomers: 0,
        rewardCodes: 0,
        usedRewards: 0,
        recoveryTotal: 0,
        recoveryResolved: 0,
        recoveryResolutionRate: 0,
      },
      daily: [],
    };
  }

  return data as ReportsState;
}
