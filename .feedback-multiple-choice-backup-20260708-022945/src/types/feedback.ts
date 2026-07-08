export type LanguageCode = "en" | "ar" | "fa";

export type FeedbackQuestionType = "star" | "emoji" | "yes_no" | "text";

export type FeedbackSegment = "satisfied" | "medium" | "unhappy";

export type RewardType = "thank_you" | "percentage" | "fixed" | "free_item";

export type FeedbackQuestion = {
  id: string;
  order: number;
  type: FeedbackQuestionType;
  required: boolean;
  text: {
    en: string;
    ar: string;
    fa: string;
  };
};

export type FeedbackBusiness = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  accentColor?: string | null;
  googleMapsReviewUrl: string | null;
  defaultLanguage?: LanguageCode;
  feedbackLockHours?: number;
  publicFeedbackUrl?: string;
};

export type FeedbackAnswerPayload = {
  questionId: string;
  value: string | number;
};

export type SubmitFeedbackPayload = {
  businessId: string;
  phone: string;
  language: LanguageCode;
  answers: FeedbackAnswerPayload[];
  userAgent?: string;
};

export type SubmitFeedbackResult = {
  success: boolean;
  message: string;
  segment?: FeedbackSegment;
  averageScore?: number;
  googleMapsReviewUrl?: string | null;
  reward?: {
    type: RewardType;
    code?: string;
    discountValue?: number | null;
    freeItemName?: string | null;
    expiresAt?: string | null;
  } | null;
};
