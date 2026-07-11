"use client";

import { useMemo, useState, useTransition } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Gift,
  Languages,
  MessageSquareHeart,
  Phone,
  Star,
} from "lucide-react";
import { submitFeedback } from "@/app/feedback/actions";
import type {
  FeedbackBusiness,
  FeedbackQuestion,
  LanguageCode,
  SubmitFeedbackResult,
} from "@/types/feedback";

type FeedbackWizardProps = {
  business: FeedbackBusiness;
  questions: FeedbackQuestion[];
};

const languages: { code: LanguageCode; label: string; hint: string }[] = [
  { code: "en", label: "English", hint: "Continue in English" },
  { code: "ar", label: "العربية", hint: "المتابعة باللغة العربية" },
  { code: "fa", label: "فارسی", hint: "ادامه به فارسی" },
];

const emojiOptions = [
  { value: 1, label: "😞", text: "Bad" },
  { value: 2, label: "🙁", text: "Not good" },
  { value: 3, label: "😐", text: "Okay" },
  { value: 4, label: "🙂", text: "Good" },
  { value: 5, label: "😍", text: "Great" },
];

const emptyQuestions: FeedbackQuestion[] = [
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

function localizedText(
  text: { en: string; ar: string; fa: string },
  language: LanguageCode,
) {
  return text[language] || text.en || text.ar || text.fa;
}

export function FeedbackWizard({
  business,
  questions: incomingQuestions,
}: FeedbackWizardProps) {
  const questions = incomingQuestions.length > 0 ? incomingQuestions : emptyQuestions;
  const [step, setStep] = useState(0);
  const [language, setLanguage] = useState<LanguageCode>(
    business.defaultLanguage ?? "en",
  );
  const [phone, setPhone] = useState("");
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [submitResult, setSubmitResult] = useState<SubmitFeedbackResult | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const totalSteps = 2 + questions.length;
  const lastQuestionStep = totalSteps - 1;
  const currentQuestionIndex = step - 2;
  const currentQuestion =
    currentQuestionIndex >= 0 && currentQuestionIndex < questions.length
      ? questions[currentQuestionIndex]
      : null;
  const isLastQuestion = step === lastQuestionStep;
  const progress = Math.round(((step + 1) / totalSteps) * 100);
  const isRtl = language === "ar" || language === "fa";

  const scoringValues = useMemo(
    () =>
      questions
        .filter((question) => question.type === "star" || question.type === "emoji")
        .map((question) => answers[question.id])
        .filter(
          (value): value is number => typeof value === "number" && value > 0,
        ),
    [answers, questions],
  );

  const averageScore =
    scoringValues.length > 0
      ? scoringValues.reduce((sum, value) => sum + value, 0) /
        scoringValues.length
      : 0;

  const canGoNext = useMemo(() => {
    if (step === 0) return Boolean(language);
    if (step === 1) return phone.replace(/\D+/g, "").length === 8;
    if (!currentQuestion) return true;
    if (!currentQuestion.required) return true;
    if (currentQuestion.type === "text") return true;
    return answers[currentQuestion.id] !== undefined;
  }, [answers, currentQuestion, language, phone, step]);

  const buildAnswerPayload = (nextAnswers: Record<string, string | number>) =>
    Object.entries(nextAnswers).map(([questionId, value]) => ({ questionId, value }));

  const handleSubmit = (nextAnswers = answers) => {
    if (isPending || hasSubmitted) return;
    setSubmitResult(null);
    setHasSubmitted(true);

    startTransition(async () => {
      const result = await submitFeedback({
        businessId: business.id,
        phone,
        language,
        answers: buildAnswerPayload(nextAnswers),
        userAgent:
          typeof window !== "undefined" ? window.navigator.userAgent : undefined,
      });
      setSubmitResult(result);
      if (!result.success) setHasSubmitted(false);
    });
  };

  const goNext = () => {
    if (!canGoNext || isPending) return;
    if (currentQuestion && isLastQuestion) {
      handleSubmit();
      return;
    }
    setStep((current) => Math.min(current + 1, lastQuestionStep));
  };

  const goBack = () => setStep((current) => Math.max(current - 1, 0));

  const setAnswer = (questionId: string, value: string | number) => {
    const nextAnswers = { ...answers, [questionId]: value };
    setAnswers(nextAnswers);

    if (
      currentQuestion &&
      isLastQuestion &&
      currentQuestion.type !== "text"
    ) {
      window.setTimeout(() => handleSubmit(nextAnswers), 250);
    }
  };

  const resetForm = () => {
    setStep(0);
    setLanguage(business.defaultLanguage ?? "en");
    setPhone("");
    setAnswers({});
    setSubmitResult(null);
    setHasSubmitted(false);
  };

  if (submitResult?.success) {
    return (
      <main className="min-h-screen bg-[#0b0b0b] px-4 py-10 text-white">
        <div className="mx-auto max-w-xl rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 text-center shadow-2xl backdrop-blur-xl sm:p-8">
          <CheckCircle2 className="mx-auto h-14 w-14 text-amber-200" />
          <p className="mt-5 text-sm text-amber-200/80">Thank you</p>
          <h1 className="mt-2 text-2xl font-semibold">{submitResult.message}</h1>

          {typeof submitResult.averageScore === "number" && (
            <p className="mt-4 text-white/60">
              Average score {submitResult.averageScore.toFixed(1)}
            </p>
          )}

          {submitResult.reward?.code && (
            <div className="mt-6 rounded-3xl border border-amber-200/15 bg-amber-200/[0.07] p-5">
              <Gift className="mx-auto h-6 w-6 text-amber-200" />
              <p className="mt-2 text-sm text-white/55">Your reward code</p>
              <p className="mt-1 text-2xl font-semibold tracking-wider text-amber-100">
                {submitResult.reward.code}
              </p>
              <p className="mt-2 text-sm text-white/60">
                {submitResult.reward.type === "percentage" &&
                  `${submitResult.reward.discountValue}% discount`}
                {submitResult.reward.type === "fixed" &&
                  `${submitResult.reward.discountValue} fixed discount`}
                {submitResult.reward.type === "free_item" &&
                  submitResult.reward.freeItemName}
              </p>
            </div>
          )}

          {submitResult.googleMapsReviewUrl && (
            <a
              href={submitResult.googleMapsReviewUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-amber-300 px-5 py-3 font-semibold text-black"
            >
              Leave a Google Maps review <ExternalLink className="h-4 w-4" />
            </a>
          )}

          <button
            type="button"
            onClick={resetForm}
            className="mt-6 block w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/75"
          >
            Start again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-4 py-6 text-white sm:py-10">
      <div className="mx-auto max-w-xl rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-xl sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <MessageSquareHeart className="h-7 w-7 text-amber-200" />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-amber-200/70">Feedback</p>
              <h1 className="mt-1 text-xl font-semibold">{business.name}</h1>
            </div>
          </div>
          <span className="text-xs text-white/40">
            Step {step + 1} of {totalSteps}
          </span>
        </div>

        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-amber-300 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-7" dir={isRtl ? "rtl" : "ltr"}>
          {step === 0 && (
            <section>
              <div className="flex items-center gap-2 text-white/70">
                <Languages className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Choose your language</h2>
              </div>
              <div className="mt-5 space-y-3">
                {languages.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setLanguage(item.code)}
                    className={`w-full rounded-3xl border p-4 text-left transition ${
                      language === item.code
                        ? "border-amber-200 bg-amber-200 text-black"
                        : "border-white/10 bg-white/5 text-white/75 hover:bg-white/10"
                    }`}
                  >
                    <p className="font-semibold">{item.label}</p>
                    <p className="mt-1 text-sm opacity-70">{item.hint}</p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {step === 1 && (
            <section>
              <div className="flex items-center gap-2 text-white/70">
                <Phone className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Enter your phone number</h2>
              </div>
              <div className="mt-5 flex overflow-hidden rounded-3xl border border-white/10 bg-black/20 focus-within:border-amber-200/50">
                <span className="flex items-center border-e border-white/10 px-4 text-lg font-black text-amber-200" dir="ltr">+968</span>
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value.replace(/\D+/g, "").slice(0, 8))}
                  placeholder="91234567"
                  inputMode="numeric"
                  maxLength={8}
                  className="min-w-0 flex-1 bg-transparent px-5 py-4 text-lg text-white outline-none placeholder:text-white/30"
                  dir="ltr"
                />
              </div>
              <p className="mt-3 text-sm text-white/45">
                Your number helps us track feedback history and send rewards.
              </p>
            </section>
          )}

          {currentQuestion && (
            <section>
              <p className="text-sm text-amber-200/75">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
              <h2 className="mt-2 text-2xl font-semibold leading-snug">
                {localizedText(currentQuestion.text, language)}
              </h2>
              <p className="mt-2 text-sm text-white/45">
                {currentQuestion.type === "star" || currentQuestion.type === "emoji"
                  ? "This answer affects your average feedback score."
                  : "This answer is saved but does not affect the average score."}
              </p>

              {currentQuestion.type === "emoji" && (
                <div className="mt-6 grid grid-cols-5 gap-2">
                  {emojiOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      disabled={isPending}
                      onClick={() => setAnswer(currentQuestion.id, option.value)}
                      className={`rounded-3xl border px-2 py-4 transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        answers[currentQuestion.id] === option.value
                          ? "border-amber-200 bg-amber-200 text-black"
                          : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                      }`}
                    >
                      <span className="block text-2xl">{option.label}</span>
                      <span className="mt-1 block text-[10px] opacity-70">{option.text}</span>
                    </button>
                  ))}
                </div>
              )}

              {currentQuestion.type === "star" && (
                <div className="mt-6 flex gap-2">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      type="button"
                      disabled={isPending}
                      onClick={() => setAnswer(currentQuestion.id, score)}
                      className={`flex h-14 flex-1 items-center justify-center rounded-2xl border transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        Number(answers[currentQuestion.id] || 0) >= score
                          ? "border-amber-200 bg-amber-200 text-black"
                          : "border-white/10 bg-white/5 text-white/40 hover:bg-white/10"
                      }`}
                    >
                      <Star className="h-5 w-5" />
                    </button>
                  ))}
                </div>
              )}

              {currentQuestion.type === "yes_no" && (
                <div className="mt-6 grid grid-cols-2 gap-3">
                  {["Yes", "No"].map((option) => (
                    <button
                      key={option}
                      type="button"
                      disabled={isPending}
                      onClick={() => setAnswer(currentQuestion.id, option)}
                      className={`rounded-3xl border px-5 py-5 text-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        answers[currentQuestion.id] === option
                          ? "border-amber-200 bg-amber-200 text-black"
                          : "border-white/10 bg-white/5 text-white/75 hover:bg-white/10"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {currentQuestion.type === "multiple_choice" && (
                <div className="mt-6 space-y-3">
                  {(currentQuestion.options ?? []).map((option) => {
                    const storedValue = option.text.en || localizedText(option.text, language);
                    return (
                      <button
                        key={option.id}
                        type="button"
                        disabled={isPending}
                        onClick={() => setAnswer(currentQuestion.id, storedValue)}
                        className={`w-full rounded-3xl border px-5 py-4 text-start text-base font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                          answers[currentQuestion.id] === storedValue
                            ? "border-amber-200 bg-amber-200 text-black"
                            : "border-white/10 bg-white/5 text-white/75 hover:bg-white/10"
                        }`}
                      >
                        {localizedText(option.text, language)}
                      </button>
                    );
                  })}
                </div>
              )}

              {currentQuestion.type === "text" && (
                <textarea
                  value={String(answers[currentQuestion.id] ?? "")}
                  onChange={(event) => setAnswer(currentQuestion.id, event.target.value)}
                  placeholder="Write your note here..."
                  rows={5}
                  className="mt-6 w-full resize-none rounded-3xl border border-white/10 bg-black/20 px-5 py-4 text-white outline-none transition placeholder:text-white/30 focus:border-amber-200/50"
                />
              )}
            </section>
          )}
        </div>

        {submitResult && !submitResult.success && (
          <div className="mt-5 rounded-3xl border border-red-300/10 bg-red-400/[0.08] p-4 text-sm text-red-100">
            {submitResult.message}
          </div>
        )}

        {isPending && (
          <div className="mt-5 rounded-3xl border border-amber-200/10 bg-amber-200/[0.06] p-4 text-sm text-amber-100">
            Saving your feedback...
          </div>
        )}

        <div className="mt-7 rounded-3xl border border-amber-200/10 bg-amber-200/[0.06] p-4">
          <p className="text-sm text-white/55">Current average score</p>
          <p className="mt-1 text-3xl font-semibold text-amber-100">
            {averageScore ? averageScore.toFixed(1) : "—"}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0 || isPending}
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold text-white/75 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={!canGoNext || isPending}
            className="flex items-center justify-center gap-2 rounded-2xl bg-amber-300 px-5 py-4 text-sm font-semibold text-black transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {currentQuestion && isLastQuestion
              ? isPending
                ? "Saving..."
                : "Finish"
              : "Next"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </main>
  );
}
