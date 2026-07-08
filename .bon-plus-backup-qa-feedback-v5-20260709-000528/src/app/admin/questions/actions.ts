"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireCurrentBusinessSlug } from "@/lib/auth-session";
import { requireModulePermission } from "@/lib/user-permissions";
import type {
  FeedbackQuestionOption,
  FeedbackQuestionType,
} from "@/types/feedback";

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
  options: FeedbackQuestionOption[];
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
  options?: FeedbackQuestionOption[];
};

function normalizeOptions(value: unknown): FeedbackQuestionOption[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const raw = item as Record<string, unknown>;
      const textRaw =
        raw.text && typeof raw.text === "object"
          ? (raw.text as Record<string, unknown>)
          : {};
      const en = typeof textRaw.en === "string" ? textRaw.en.trim() : "";
      const ar = typeof textRaw.ar === "string" ? textRaw.ar.trim() : "";
      const fa = typeof textRaw.fa === "string" ? textRaw.fa.trim() : "";
      if (!en && !ar && !fa) return null;

      return {
        id:
          typeof raw.id === "string" && raw.id.trim()
            ? raw.id.trim()
            : `option-${index + 1}`,
        text: { en, ar, fa },
      } satisfies FeedbackQuestionOption;
    })
    .filter((item): item is FeedbackQuestionOption => Boolean(item));
}

async function attachOptions(
  state: AdminQuestionsState,
): Promise<AdminQuestionsState> {
  if (!state.success || !state.business || state.questions.length === 0) {
    return state;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("feedback_questions")
    .select("id, options_json")
    .eq("business_id", state.business.id);

  if (error) {
    return {
      ...state,
      success: false,
      message: error.message,
    };
  }

  const optionsById = new Map(
    (data ?? []).map((row) => [row.id, normalizeOptions(row.options_json)]),
  );

  return {
    ...state,
    questions: state.questions.map((question) => {
      const options = optionsById.get(question.id) ?? [];
      return {
        ...question,
        type:
          question.type === "text" && options.length > 0
            ? "multiple_choice"
            : question.type,
        options,
      };
    }),
  };
}

export async function getAdminQuestions(): Promise<AdminQuestionsState> {
  await requireModulePermission("settings_feedback", "view");
  const supabase = createSupabaseAdminClient();
  const businessSlug = await requireCurrentBusinessSlug();
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

  return attachOptions(data as AdminQuestionsState);
}

export async function saveAdminQuestion(input: SaveQuestionInput) {
  await requireModulePermission("settings_feedback", "edit");
  const supabase = createSupabaseAdminClient();

  const isMultipleChoice = input.type === "multiple_choice";
  const options = isMultipleChoice ? normalizeOptions(input.options ?? []) : [];

  if (isMultipleChoice && options.length < 2) {
    return {
      success: false,
      message: "Multiple choice questions need at least two options.",
    };
  }

  let questionIdForSave = input.questionId ?? null;
  if (input.questionId) {
    const { count, error: answerCountError } = await supabase
      .from("feedback_answers")
      .select("id", { count: "exact", head: true })
      .eq("question_id", input.questionId);
    if (answerCountError) {
      return { success: false, message: answerCountError.message };
    }
    if ((count ?? 0) > 0) {
      const { error: archiveError } = await supabase
        .from("feedback_questions")
        .update({ is_active: false })
        .eq("id", input.questionId)
        .eq("business_id", input.businessId);
      if (archiveError) {
        return { success: false, message: archiveError.message };
      }
      questionIdForSave = null;
    }
  }

  const { data, error } = await supabase.rpc("admin_save_feedback_question_fast", {
    p_business_id: input.businessId,
    p_question_id: questionIdForSave,
    // Multiple choice is persisted as a text answer in the existing feedback engine.
    p_question_type: isMultipleChoice ? "text" : input.type,
    p_display_order: input.order,
    p_is_required: input.required,
    p_is_active: input.active,
    p_text_en: input.textEn,
    p_text_ar: input.textAr,
    p_text_fa: input.textFa,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  const result = data as {
    success: boolean;
    message: string;
    question?: AdminQuestion;
  };

  let savedQuestionId = questionIdForSave ?? result.question?.id ?? null;

  if (!savedQuestionId) {
    const { data: savedRow } = await supabase
      .from("feedback_questions")
      .select("id")
      .eq("business_id", input.businessId)
      .eq("text_en", input.textEn)
      .eq("display_order", input.order)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    savedQuestionId = savedRow?.id ?? null;
  }

  if (!savedQuestionId) {
    return {
      success: false,
      message: "Question was saved, but its options could not be linked.",
    };
  }

  const { error: optionError } = await supabase
    .from("feedback_questions")
    .update({ options_json: options })
    .eq("id", savedQuestionId)
    .eq("business_id", input.businessId);

  if (optionError) {
    return { success: false, message: optionError.message };
  }

  revalidatePath("/admin/questions");
  revalidatePath("/admin/settings/feedback-center/questions");
  revalidatePath("/feedback");

  return result;
}

export async function toggleAdminQuestion(
  businessId: string,
  questionId: string,
  active: boolean,
) {
  await requireModulePermission("settings_feedback", "edit");
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("admin_toggle_feedback_question_fast", {
    p_business_id: businessId,
    p_question_id: questionId,
    p_is_active: active,
  });

  revalidatePath("/admin/questions");
  revalidatePath("/admin/settings/feedback-center/questions");
  revalidatePath("/feedback");

  if (error) {
    return { success: false, message: error.message };
  }

  return data as {
    success: boolean;
    message: string;
    question?: AdminQuestion;
  };
}

export async function deleteAdminQuestion(
  businessId: string,
  questionId: string,
) {
  await requireModulePermission("settings_feedback", "edit");
  const supabase = createSupabaseAdminClient();

  const { count, error: countError } = await supabase
    .from("feedback_answers")
    .select("id", { count: "exact", head: true })
    .eq("question_id", questionId);
  if (countError) {
    return { success: false, message: countError.message };
  }

  if ((count ?? 0) > 0) {
    const { error } = await supabase
      .from("feedback_questions")
      .update({ is_active: false })
      .eq("id", questionId)
      .eq("business_id", businessId);
    if (error) return { success: false, message: error.message };
    revalidatePath("/admin/questions");
    revalidatePath("/admin/settings/feedback-center/questions");
    revalidatePath("/feedback");
    return { success: true, message: "Question archived because it has historical answers.", archived: true };
  }

  const { error } = await supabase
    .from("feedback_questions")
    .delete()
    .eq("id", questionId)
    .eq("business_id", businessId);
  if (error) return { success: false, message: error.message };

  revalidatePath("/admin/questions");
  revalidatePath("/admin/settings/feedback-center/questions");
  revalidatePath("/feedback");
  return { success: true, message: "Question deleted.", archived: false };
}

export async function reorderAdminQuestions(
  businessId: string,
  orderedQuestions: { id: string; order: number }[],
) {
  await requireModulePermission("settings_feedback", "edit");
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc(
    "admin_reorder_feedback_questions_fast",
    {
      p_business_id: businessId,
      p_order: orderedQuestions,
    },
  );

  revalidatePath("/admin/questions");
  revalidatePath("/admin/settings/feedback-center/questions");
  revalidatePath("/feedback");

  if (error) {
    return {
      success: false,
      message: error.message,
      business: null,
      questions: [],
    };
  }

  return attachOptions(data as AdminQuestionsState);
}

