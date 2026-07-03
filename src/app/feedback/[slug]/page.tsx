import type { FeedbackBusiness, FeedbackQuestion } from "@/types/feedback";
import { FeedbackWizard } from "@/features/customer-feedback/feedback-wizard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getBaseUrl } from "@/lib/business-context";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const fallbackQuestions: FeedbackQuestion[] = [
  {
    id: "fallback-overall",
    order: 1,
    type: "emoji",
    required: true,
    text: {
      en: "How was your overall experience?",
      ar: "كيف كانت تجربتك بشكل عام؟",
      fa: "تجربه کلی شما چطور بود؟",
    },
  },
];

type FeedbackConfigResult = {
  success: boolean;
  message?: string;
  business?: FeedbackBusiness | null;
  questions?: FeedbackQuestion[];
};

async function getFeedbackData(slug: string) {
  const fallbackBusiness: FeedbackBusiness = {
    id: "fallback",
    name: "Cafe",
    slug,
    googleMapsReviewUrl: null,
    defaultLanguage: "en",
    feedbackLockHours: 24,
  };

  try {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase.rpc("get_feedback_page_config_fast", {
      p_slug: slug,
      p_base_url: getBaseUrl(),
    });

    if (error || !data || typeof data !== "object") {
      return { business: fallbackBusiness, questions: fallbackQuestions };
    }

    const result = data as FeedbackConfigResult;

    if (!result.success || !result.business) {
      return { business: fallbackBusiness, questions: fallbackQuestions };
    }

    return {
      business: result.business,
      questions: result.questions && result.questions.length > 0 ? result.questions : fallbackQuestions,
    };
  } catch {
    return { business: fallbackBusiness, questions: fallbackQuestions };
  }
}

export default async function FeedbackSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getFeedbackData(slug);

  return <FeedbackWizard business={data.business} questions={data.questions} />;
}
