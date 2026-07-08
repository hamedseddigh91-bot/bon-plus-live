"use server";

import type {
  SubmitFeedbackPayload,
  SubmitFeedbackResult,
} from "@/types/feedback";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function normalizePhone(phone: string) {
  return phone.trim().replace(/\s+/g, "");
}

export async function submitFeedback(
  payload: SubmitFeedbackPayload
): Promise<SubmitFeedbackResult> {
  const supabase = createSupabaseAdminClient();
  const phone = normalizePhone(payload.phone);

  if (!payload.businessId) {
    return {
      success: false,
      message: "Business is missing.",
    };
  }

  if (phone.length < 5) {
    return {
      success: false,
      message: "Phone number is too short.",
    };
  }

  const { data, error } = await supabase.rpc("submit_customer_feedback_fast", {
    p_business_id: payload.businessId,
    p_phone: phone,
    p_language: payload.language,
    p_answers: payload.answers,
    p_user_agent: payload.userAgent ?? null,
  });

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  if (!data || typeof data !== "object") {
    return {
      success: false,
      message: "Feedback could not be submitted.",
    };
  }

  const result = data as SubmitFeedbackResult;
  const score = typeof result.averageScore === "number" ? result.averageScore : 0;
  const bandKey = score >= 4 ? "high" : score > 2 ? "mid" : "low";

  const { data: responseRule } = await supabase
    .from("feedback_response_rules")
    .select("response_method, is_active")
    .eq("business_id", payload.businessId)
    .eq("band_key", bandKey)
    .eq("is_active", true)
    .maybeSingle();

  if (responseRule?.response_method === "thanks" && result.reward?.code) {
    const { data: deletedCodes } = await supabase
      .from("discount_codes")
      .delete()
      .eq("business_id", payload.businessId)
      .eq("code", result.reward.code)
      .select("feedback_submission_id");

    const submissionIds = (deletedCodes ?? [])
      .map((row) => row.feedback_submission_id)
      .filter((id): id is string => Boolean(id));

    if (submissionIds.length > 0) {
      await supabase
        .from("feedback_submissions")
        .update({ reward_generated: false })
        .in("id", submissionIds);
    }

    return { ...result, reward: null };
  }

  return result;
}

