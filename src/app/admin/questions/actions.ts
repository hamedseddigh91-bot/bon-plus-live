"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentBusinessSlug } from "@/lib/business-context";
import type { FeedbackQuestionType } from "@/types/feedback";

export type AdminQuestion = {
  id: string;
  businessId: string;
  order: number;
  type: FeedbackQuestionType;
  required: boolean;
  active: boolean;
  textEn: string;
  textAr: string;
  textFa: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminQuestionsBusiness = {
  id: string;
  name: string;
  slug: string;
};

export type AdminQuestionsState = {
  success: boolean;
  message?: string;
  business: AdminQuestionsBusiness | null;
  questions: AdminQuestion[];
};

export type SaveQuestionInput = {
  businessId: string;
  questionId?: string | null;
  type: FeedbackQuestionType;
  order: number;
  required: boolean;
  active: boolean;
  textEn: string;
  textAr: string;
  textFa: string;
};

export async function getAdminQuestions(): Promise<AdminQuestionsState> {
  const supabase = createSupabaseAdminClient();
  const businessSlug = await getCurrentBusinessSlug();

  const { data, error } = await supabase.rpc("admin_get_feedback_questions_fast", {
    p_slug: businessSlug,
  });

  if (error) {
    return {
      success: false,
      message: error.message,
      business: null,
      questions: [],
    };
  }

  return data as AdminQuestionsState;
}

export async function saveAdminQuestion(input: SaveQuestionInput) {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc("admin_save_feedback_question_fast", {
    p_business_id: input.businessId,
    p_question_id: input.questionId ?? null,
    p_question_type: input.type,
    p_display_order: input.order,
    p_is_required: input.required,
    p_is_active: input.active,
    p_text_en: input.textEn,
    p_text_ar: input.textAr,
    p_text_fa: input.textFa,
  });

  revalidatePath("/admin/questions");
  revalidatePath("/feedback");

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  return data as {
    success: boolean;
    message: string;
    question?: AdminQuestion;
  };
}

export async function toggleAdminQuestion(
  businessId: string,
  questionId: string,
  active: boolean
) {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc("admin_toggle_feedback_question_fast", {
    p_business_id: businessId,
    p_question_id: questionId,
    p_is_active: active,
  });

  revalidatePath("/admin/questions");
  revalidatePath("/feedback");

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  return data as {
    success: boolean;
    message: string;
    question?: AdminQuestion;
  };
}

export async function reorderAdminQuestions(
  businessId: string,
  orderedQuestions: { id: string; order: number }[]
) {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc(
    "admin_reorder_feedback_questions_fast",
    {
      p_business_id: businessId,
      p_order: orderedQuestions,
    }
  );

  revalidatePath("/admin/questions");
  revalidatePath("/feedback");

  if (error) {
    return {
      success: false,
      message: error.message,
      business: null,
      questions: [],
    };
  }

  return data as AdminQuestionsState;
}
