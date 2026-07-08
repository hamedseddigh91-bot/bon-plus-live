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
  { value: 1, label: "😡", text: "Bad" },
  { value: 2, label: "😕", text: "Not good" },
  { value: 3, label: "🙂", text: "Okay" },
  { value: 4, label: "😊", text: "Good" },
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

export function FeedbackWizard({
  business,
  questions: incomingQuestions,
}: FeedbackWizardProps) {
  const questions = incomingQuestions.length > 0 ? incomingQuestions : emptyQuestions;

  const [step, setStep] = useState(0);
  const [language, setLanguage] = useState<LanguageCode>(business.defaultLanguage ?? "en");
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

  const scoringValues = useMemo(() => {
    return questions
      .filter((question) => question.type === "star" || question.type === "emoji")
      .map((question) => answers[question.id])
      .filter((value): value is number => typeof value === "number" && value > 0);
  }, [answers, questions]);

  const averageScore =
    scoringValues.length > 0
      ? scoringValues.reduce((sum, value) => sum + value, 0) / scoringValues.length
      : 0;

  const segment =
    averageScore >= 4
      ? "Satisfied"
      : averageScore > 2
        ? "Medium"
        : averageScore > 0
          ? "Unhappy"
          : "Not calculated";

  const canGoNext = useMemo(() => {
    if (step === 0) {
      return Boolean(language);
    }

    if (step === 1) {
      return phone.trim().length >= 5;
    }

    if (currentQuestion) {
      if (!currentQuestion.required) {
        return true;
      }

      if (currentQuestion.type === "text") {
        return true;
      }

      return answers[currentQuestion.id] !== undefined;
    }

    return true;
  }, [answers, currentQuestion, language, phone, step]);

  const buildAnswerPayload = (nextAnswers: Record<string, string | number>) => {
    return Object.entries(nextAnswers).map(([questionId, value]) => ({
      questionId,
      value,
    }));
  };

  const handleSubmit = (nextAnswers = answers) => {
    if (isPending || hasSubmitted) {
      return;
    }

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

      if (!result.success) {
        setHasSubmitted(false);
      }
    });
  };

  const goNext = () => {
    if (!canGoNext || isPending) {
      return;
    }

    if (currentQuestion && isLastQuestion) {
      handleSubmit();
      return;
    }

    setStep((current) => Math.min(current + 1, lastQuestionStep));
  };

  const goBack = () => {
    setStep((current) => Math.max(current - 1, 0));
  };

  const setAnswer = (questionId: string, value: string | number) => {
    const nextAnswers = {
      ...answers,
      [questionId]: value,
    };

    setAnswers(nextAnswers);

    if (currentQuestion && isLastQuestion && currentQuestion.type !== "text") {
      window.setTimeout(() => {
        handleSubmit(nextAnswers);
      }, 250);
    }
  };

  const resetForm = () => {
    setStep(0);
    setLanguage("en");
    setPhone("");
    setAnswers({});
    setSubmitResult(null);
    setHasSubmitted(false);
  };

  if (submitResult?.success) {
    return (
      <main className="min-h-screen bg-[#0b0907] px-5 py-6 text-white">
        <div className="mx-auto flex min-h-[calc(100vh-48px)] max-w-xl flex-col justify-center">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.065] p-5 shadow-2xl shadow-black/30 backdrop-blur">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-300/10 text-emerald-300">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <h1 className="mt-5 text-3xl font-semibold tracking-[-0.03em]">
              Thank you
            </h1>

            <p className="mt-3 text-sm leading-6 text-white/55">
              {submitResult.message}
            </p>

            <div className="mt-6 grid gap-3 rounded-3xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between">
                <span className="text-white/45">Average score</span>
                <span className="font-medium">
                  {submitResult.averageScore?.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/45">Segment</span>
                <span className="font-medium">{submitResult.segment}</span>
              </div>
            </div>

            {submitResult.reward?.code && (
              <div className="mt-5 rounded-3xl border border-amber-200/10 bg-amber-200/[0.06] p-4">
                <div className="flex items-center gap-3">
                  <Gift className="h-5 w-5 text-amber-200" />
                  <div>
                    <p className="text-sm font-medium text-amber-100">
                      Your reward code
                    </p>
                    <p className="mt-1 text-2xl font-semibold tracking-[0.12em]">
                      {submitResult.reward.code}
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-sm text-white/45">
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
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-300 px-5 py-4 text-sm font-semibold text-black transition hover:bg-amber-200"
              >
                Leave a Google Maps review
                <ExternalLink className="h-4 w-4" />
              </a>
            )}

            <button
              onClick={resetForm}
              className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold text-white/75 transition hover:bg-white/10"
            >
              Start again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0907] px-5 py-6 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-48px)] max-w-xl flex-col justify-center">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.065] p-5 shadow-2xl shadow-black/30 backdrop-blur">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-300/10 text-amber-200">
              <MessageSquareHeart className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-amber-200/70">
                Feedback
              </p>
              <h1 className="text-2xl font-semibold">{business.name}</h1>
            </div>
          </div>

          <div className="mb-7">
            <div className="flex items-center justify-between text-xs text-white/45">
              <span>
                Step {step + 1} of {totalSteps}
              </span>
              <span>{progress}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-amber-300 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {step === 0 && (
            <section>
              <div className="mb-5 flex items-center gap-2 text-sm font-medium text-white/70">
                <Languages className="h-4 w-4" />
                Choose your language
              </div>

              <div className="space-y-3">
                {languages.map((item) => (
                  <button
                    key={item.code}
                    onClick={() => setLanguage(item.code)}
                    className={`w-full rounded-3xl border p-4 text-left transition ${
                      language === item.code
                        ? "border-amber-200 bg-amber-200 text-black"
                        : "border-white/10 bg-white/5 text-white/75 hover:bg-white/10"
                    }`}
                  >
                    <p className="text-lg font-semibold">{item.label}</p>
                    <p
                      className={`mt-1 text-sm ${
                        language === item.code ? "text-black/60" : "text-white/40"
                      }`}
                    >
                      {item.hint}
                    </p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {step === 1 && (
            <section>
              <div className="mb-5 flex items-center gap-2 text-sm font-medium text-white/70">
                <Phone className="h-4 w-4" />
                Enter your phone number
              </div>

              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+968 ..."
                className="w-full rounded-3xl border border-white/10 bg-black/20 px-5 py-4 text-lg text-white outline-none transition placeholder:text-white/30 focus:border-amber-200/50"
              />

              <p className="mt-3 text-sm leading-6 text-white/40">
                Your number helps us track feedback history and send rewards.
                OTP is not required in this version.
              </p>
            </section>
          )}

          {currentQuestion && (
            <section>
              <div className="mb-6">
                <p className="text-sm text-amber-200/70">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
                  {currentQuestion.text[language]}
                </h2>
                <p className="mt-3 text-sm leading-6 text-white/45">
                  {currentQuestion.type === "star" || currentQuestion.type === "emoji"
                    ? "This answer affects your average feedback score."
                    : "This answer is saved but does not affect the average score."}
                </p>
              </div>

              {currentQuestion.type === "emoji" && (
                <div className="grid grid-cols-5 gap-2">
                  {emojiOptions.map((option) => (
                    <button
                      key={option.value}
                      disabled={isPending}
                      onClick={() => setAnswer(currentQuestion.id, option.value)}
                      className={`rounded-3xl border px-2 py-4 transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        answers[currentQuestion.id] === option.value
                          ? "border-amber-200 bg-amber-200 text-black"
                          : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                      }`}
                    >
                      <span className="block text-3xl">{option.label}</span>
                      <span className="mt-2 block text-[11px]">{option.text}</span>
                    </button>
                  ))}
                </div>
              )}

              {currentQuestion.type === "star" && (
                <div className="flex justify-between gap-2">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      disabled={isPending}
                      onClick={() => setAnswer(currentQuestion.id, score)}
                      className={`flex h-14 flex-1 items-center justify-center rounded-2xl border transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        Number(answers[currentQuestion.id] || 0) >= score
                          ? "border-amber-200 bg-amber-200 text-black"
                          : "border-white/10 bg-white/5 text-white/40 hover:bg-white/10"
                      }`}
                    >
                      <Star className="h-6 w-6" />
                    </button>
                  ))}
                </div>
              )}

              {currentQuestion.type === "yes_no" && (
                <div className="grid grid-cols-2 gap-3">
                  {["Yes", "No"].map((option) => (
                    <button
                      key={option}
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

              {currentQuestion.type === "text" && (
                <textarea
                  value={String(answers[currentQuestion.id] || "")}
                  onChange={(event) =>
                    setAnswer(currentQuestion.id, event.target.value)
                  }
                  placeholder="Write your note here..."
                  rows={5}
                  className="w-full resize-none rounded-3xl border border-white/10 bg-black/20 px-5 py-4 text-white outline-none transition placeholder:text-white/30 focus:border-amber-200/50"
                />
              )}
            </section>
          )}

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
              onClick={goBack}
              disabled={step === 0 || isPending}
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold text-white/75 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <button
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
      </div>
    </main>
  );
}
