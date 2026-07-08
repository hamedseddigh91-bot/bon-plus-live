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

  return data as SubmitFeedbackResult;
}
