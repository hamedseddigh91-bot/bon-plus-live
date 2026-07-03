"use client";

import { useMemo, useState, useTransition } from "react";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  ListChecks,
  Plus,
  Save,
  Sparkles,
} from "lucide-react";
import {
  type AdminQuestion,
  type AdminQuestionsState,
  getAdminQuestions,
  reorderAdminQuestions,
  saveAdminQuestion,
  toggleAdminQuestion,
} from "@/app/admin/questions/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { FeedbackQuestionType } from "@/types/feedback";

type QuestionsManagerProps = {
  initialState: AdminQuestionsState;
};

type QuestionFormState = {
  id: string | null;
  order: number;
  type: FeedbackQuestionType;
  required: boolean;
  active: boolean;
  textEn: string;
  textAr: string;
  textFa: string;
};

const emptyForm: QuestionFormState = {
  id: null,
  order: 1,
  type: "emoji",
  required: true,
  active: true,
  textEn: "",
  textAr: "",
  textFa: "",
};

const typeOptions: { value: FeedbackQuestionType; label: string }[] = [
  { value: "emoji", label: "Emoji" },
  { value: "star", label: "Star" },
  { value: "yes_no", label: "Yes / No" },
  { value: "text", label: "Text" },
];

function toForm(question: AdminQuestion): QuestionFormState {
  return {
    id: question.id,
    order: question.order,
    type: question.type,
    required: question.required,
    active: question.active,
    textEn: question.textEn,
    textAr: question.textAr,
    textFa: question.textFa,
  };
}

export function QuestionsManager({ initialState }: QuestionsManagerProps) {
  const [state, setState] = useState(initialState);
  const [form, setForm] = useState<QuestionFormState>(() => ({
    ...emptyForm,
    order: Math.max(initialState.questions.length + 1, 1),
  }));
  const [message, setMessage] = useState<string | null>(
    initialState.success ? null : initialState.message ?? "Failed to load questions."
  );
  const [isPending, startTransition] = useTransition();

  const business = state.business;

  const activeCount = useMemo(
    () => state.questions.filter((question) => question.active).length,
    [state.questions]
  );

  const sortedQuestions = useMemo(() => {
    return [...state.questions].sort((a, b) => a.order - b.order);
  }, [state.questions]);

  const refresh = () => {
    startTransition(async () => {
      const nextState = await getAdminQuestions();
      setState(nextState);
      setMessage(nextState.success ? null : nextState.message ?? "Refresh failed.");
    });
  };

  const resetForm = () => {
    setForm({
      ...emptyForm,
      order: Math.max(state.questions.length + 1, 1),
    });
  };

  const save = () => {
    if (!business) {
      setMessage("Business is missing.");
      return;
    }

    startTransition(async () => {
      const result = await saveAdminQuestion({
        businessId: business.id,
        questionId: form.id,
        type: form.type,
        order: form.order,
        required: form.required,
        active: form.active,
        textEn: form.textEn,
        textAr: form.textAr,
        textFa: form.textFa,
      });

      if (!result.success) {
        setMessage(result.message);
        return;
      }

      const nextState = await getAdminQuestions();
      setState(nextState);
      setMessage(result.message);
      resetForm();
    });
  };

  const toggle = (question: AdminQuestion) => {
    if (!business) {
      setMessage("Business is missing.");
      return;
    }

    startTransition(async () => {
      const result = await toggleAdminQuestion(
        business.id,
        question.id,
        !question.active
      );

      if (!result.success) {
        setMessage(result.message);
        return;
      }

      setState((current) => ({
        ...current,
        questions: current.questions.map((item) =>
          item.id === question.id && result.question ? result.question : item
        ),
      }));

      setMessage(result.message);
    });
  };

  const move = (question: AdminQuestion, direction: "up" | "down") => {
    if (!business || isPending) {
      return;
    }

    const currentIndex = sortedQuestions.findIndex((item) => item.id === question.id);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= sortedQuestions.length) {
      return;
    }

    const nextQuestions = [...sortedQuestions];
    const [removed] = nextQuestions.splice(currentIndex, 1);
    nextQuestions.splice(targetIndex, 0, removed);

    const orderedQuestions = nextQuestions.map((item, index) => ({
      id: item.id,
      order: index + 1,
    }));

    startTransition(async () => {
      const result = await reorderAdminQuestions(business.id, orderedQuestions);

      if (!result.success) {
        setMessage(result.message ?? "Reorder failed.");
        return;
      }

      setState(result);
      setMessage("Questions reordered.");
    });
  };

  return (
    <>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-amber-200/80">
              <ListChecks className="h-5 w-5" />
              <span className="text-sm font-medium uppercase tracking-[0.25em]">
                Feedback Questions
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white">
              Question Builder
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
              Manage the live customer feedback wizard. Changes are saved with
              fast RPC and instantly affect the public feedback page.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4">
              <p className="text-xs text-white/45">Total</p>
              <p className="mt-1 text-2xl font-semibold text-white">
                {state.questions.length}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-white/45">Active</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-200">
                {activeCount}
              </p>
            </Card>
          </div>
        </section>

        {message && (
          <div className="rounded-3xl border border-amber-200/10 bg-amber-200/[0.06] p-4 text-sm text-amber-100">
            {message}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <Card className="p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Live Questions
                </h2>
                <p className="mt-1 text-sm text-white/40">
                  Use arrows to reorder. Use Active to show or hide from customers.
                </p>
              </div>

              <Button onClick={refresh} disabled={isPending} variant="secondary">
                Refresh
              </Button>
            </div>

            <div className="space-y-3">
              {sortedQuestions.length === 0 && (
                <div className="rounded-3xl border border-white/10 bg-black/20 p-6 text-sm text-white/45">
                  No questions yet.
                </div>
              )}

              {sortedQuestions.map((question, index) => (
                <div
                  key={question.id}
                  className="rounded-3xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <Badge>#{question.order}</Badge>
                        <Badge variant={question.active ? "success" : "secondary"}>
                          {question.active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="secondary">{question.type}</Badge>
                        <Badge variant={question.required ? "default" : "secondary"}>
                          {question.required ? "Required" : "Optional"}
                        </Badge>
                      </div>

                      <p className="text-base font-medium text-white">
                        {question.textEn}
                      </p>
                      <p className="mt-2 text-sm text-white/45">{question.textAr}</p>
                      <p className="mt-1 text-sm text-white/45">{question.textFa}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => move(question, "up")}
                        disabled={isPending || index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => move(question, "down")}
                        disabled={isPending || index === sortedQuestions.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setForm(toForm(question))}
                        disabled={isPending}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => toggle(question)}
                        disabled={isPending}
                      >
                        {question.active ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-300/10 text-amber-200">
                {form.id ? <Sparkles className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {form.id ? "Edit Question" : "Add Question"}
                </h2>
                <p className="mt-1 text-sm text-white/40">
                  English text is required. Arabic and Persian can be edited too.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-sm text-white/45">English</span>
                <textarea
                  value={form.textEn}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      textEn: event.target.value,
                    }))
                  }
                  rows={3}
                  className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-amber-200/50"
                  placeholder="How was your overall experience?"
                />
              </label>

              <label className="block">
                <span className="text-sm text-white/45">Arabic</span>
                <textarea
                  value={form.textAr}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      textAr: event.target.value,
                    }))
                  }
                  rows={3}
                  className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-amber-200/50"
                  placeholder="كيف كانت تجربتك؟"
                />
              </label>

              <label className="block">
                <span className="text-sm text-white/45">Persian</span>
                <textarea
                  value={form.textFa}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      textFa: event.target.value,
                    }))
                  }
                  rows={3}
                  className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-amber-200/50"
                  placeholder="تجربه شما چطور بود؟"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm text-white/45">Type</span>
                  <select
                    value={form.type}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        type: event.target.value as FeedbackQuestionType,
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-amber-200/50"
                  >
                    {typeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm text-white/45">Order</span>
                  <input
                    type="number"
                    min={1}
                    value={form.order}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        order: Number(event.target.value),
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-amber-200/50"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <input
                    type="checkbox"
                    checked={form.required}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        required: event.target.checked,
                      }))
                    }
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-white/70">Required</span>
                </label>

                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        active: event.target.checked,
                      }))
                    }
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-white/70">Active</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  onClick={save}
                  disabled={isPending || !form.textEn.trim() || !business}
                >
                  <Save className="h-4 w-4" />
                  Save
                </Button>
                <Button
                  variant="secondary"
                  onClick={resetForm}
                  disabled={isPending}
                >
                  New
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
