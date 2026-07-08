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
  Trash2,
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
import type {
  FeedbackQuestionOption,
  FeedbackQuestionType,
} from "@/types/feedback";

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
  options: FeedbackQuestionOption[];
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
  options: [],
};

const typeOptions: { value: FeedbackQuestionType; label: string }[] = [
  { value: "emoji", label: "Emoji" },
  { value: "star", label: "Star" },
  { value: "yes_no", label: "Yes / No" },
  { value: "multiple_choice", label: "Multiple choice" },
  { value: "text", label: "Text" },
];

function createOption(index: number): FeedbackQuestionOption {
  return {
    id: `option-${Date.now()}-${index}`,
    text: { en: "", ar: "", fa: "" },
  };
}

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
    options: question.options ?? [],
  };
}

export function QuestionsManager({ initialState }: QuestionsManagerProps) {
  const [state, setState] = useState(initialState);
  const [form, setForm] = useState<QuestionFormState>(() => ({
    ...emptyForm,
    order: Math.max(initialState.questions.length + 1, 1),
  }));
  const [message, setMessage] = useState<string | null>(
    initialState.success
      ? null
      : initialState.message ?? "Failed to load questions.",
  );
  const [isPending, startTransition] = useTransition();

  const business = state.business;
  const activeCount = useMemo(
    () => state.questions.filter((question) => question.active).length,
    [state.questions],
  );
  const sortedQuestions = useMemo(
    () => [...state.questions].sort((a, b) => a.order - b.order),
    [state.questions],
  );

  const refresh = () => {
    startTransition(async () => {
      const nextState = await getAdminQuestions();
      setState(nextState);
      setMessage(
        nextState.success ? null : nextState.message ?? "Refresh failed.",
      );
    });
  };

  const resetForm = () => {
    setForm({
      ...emptyForm,
      order: Math.max(state.questions.length + 1, 1),
    });
  };

  const updateOption = (
    optionId: string,
    language: "en" | "ar" | "fa",
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      options: current.options.map((option) =>
        option.id === optionId
          ? { ...option, text: { ...option.text, [language]: value } }
          : option,
      ),
    }));
  };

  const addOption = () => {
    setForm((current) => ({
      ...current,
      options: [...current.options, createOption(current.options.length + 1)],
    }));
  };

  const removeOption = (optionId: string) => {
    setForm((current) => ({
      ...current,
      options: current.options.filter((option) => option.id !== optionId),
    }));
  };

  const save = () => {
    if (!business) {
      setMessage("Business is missing.");
      return;
    }

    if (
      form.type === "multiple_choice" &&
      form.options.filter((option) => option.text.en.trim()).length < 2
    ) {
      setMessage("Add at least two options with English labels.");
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
        options: form.type === "multiple_choice" ? form.options : [],
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
        !question.active,
      );
      if (!result.success) {
        setMessage(result.message);
        return;
      }

      const nextState = await getAdminQuestions();
      setState(nextState);
      setMessage(result.message);
    });
  };

  const move = (question: AdminQuestion, direction: "up" | "down") => {
    if (!business || isPending) return;

    const currentIndex = sortedQuestions.findIndex(
      (item) => item.id === question.id,
    );
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sortedQuestions.length) return;

    const nextQuestions = [...sortedQuestions];
    const [removed] = nextQuestions.splice(currentIndex, 1);
    nextQuestions.splice(targetIndex, 0, removed);
    const orderedQuestions = nextQuestions.map((item, index) => ({
      id: item.id,
      order: index + 1,
    }));

    startTransition(async () => {
      const result = await reorderAdminQuestions(
        business.id,
        orderedQuestions,
      );
      if (!result.success) {
        setMessage(result.message ?? "Reorder failed.");
        return;
      }
      setState(result);
      setMessage("Questions reordered.");
    });
  };

  const formIsMultipleChoice = form.type === "multiple_choice";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-amber-200/80">Feedback Questions</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">Question Builder</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/50">
            Manage the live customer feedback wizard, including single-select multiple choice questions.
          </p>
        </div>
        <div className="flex gap-2">
          <Badge>Total {state.questions.length}</Badge>
          <Badge>Active {activeCount}</Badge>
        </div>
      </div>

      {message && (
        <div className="rounded-2xl border border-amber-200/10 bg-amber-200/[0.06] px-4 py-3 text-sm text-amber-100">
          {message}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-white">
                <ListChecks className="h-5 w-5" />
                <h2 className="font-semibold">Live Questions</h2>
              </div>
              <p className="mt-1 text-sm text-white/45">
                Reorder, edit, activate, or hide questions.
              </p>
            </div>
            <Button variant="secondary" onClick={refresh} disabled={isPending}>
              Refresh
            </Button>
          </div>

          <div className="mt-5 space-y-3">
            {sortedQuestions.length === 0 && (
              <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-white/45">
                No questions yet.
              </div>
            )}

            {sortedQuestions.map((question, index) => (
              <div
                key={question.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-white/45">
                  <span>#{question.order}</span>
                  <Badge>{question.active ? "Active" : "Inactive"}</Badge>
                  <Badge>{question.type}</Badge>
                  <Badge>{question.required ? "Required" : "Optional"}</Badge>
                </div>
                <p className="mt-3 font-medium text-white">{question.textEn}</p>
                {question.textAr && (
                  <p className="mt-1 text-sm text-white/55" dir="rtl">
                    {question.textAr}
                  </p>
                )}
                {question.textFa && (
                  <p className="mt-1 text-sm text-white/55" dir="rtl">
                    {question.textFa}
                  </p>
                )}

                {question.type === "multiple_choice" && question.options.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {question.options.map((option) => (
                      <span
                        key={option.id}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60"
                      >
                        {option.text.en || option.text.fa || option.text.ar}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => move(question, "up")}
                    disabled={isPending || index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => move(question, "down")}
                    disabled={isPending || index === sortedQuestions.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setForm(toForm(question))}
                    disabled={isPending}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => toggle(question)}
                    disabled={isPending}
                  >
                    {question.active ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    {question.active ? "Hide" : "Show"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 text-white">
            {form.id ? <Save className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            <h2 className="font-semibold">
              {form.id ? "Edit Question" : "Add Question"}
            </h2>
          </div>
          <p className="mt-1 text-sm text-white/45">
            English question text is required. Arabic and Persian are optional.
          </p>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-sm text-white/45">English</span>
              <textarea
                value={form.textEn}
                onChange={(event) =>
                  setForm((current) => ({ ...current, textEn: event.target.value }))
                }
                rows={3}
                className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-amber-200/50"
                placeholder="How did you hear about us?"
              />
            </label>

            <label className="block">
              <span className="text-sm text-white/45">Arabic</span>
              <textarea
                value={form.textAr}
                onChange={(event) =>
                  setForm((current) => ({ ...current, textAr: event.target.value }))
                }
                rows={3}
                dir="rtl"
                className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-amber-200/50"
                placeholder="كيف تعرفت علينا؟"
              />
            </label>

            <label className="block">
              <span className="text-sm text-white/45">Persian</span>
              <textarea
                value={form.textFa}
                onChange={(event) =>
                  setForm((current) => ({ ...current, textFa: event.target.value }))
                }
                rows={3}
                dir="rtl"
                className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-amber-200/50"
                placeholder="از چه طریقی با ما آشنا شدید؟"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm text-white/45">Type</span>
                <select
                  value={form.type}
                  onChange={(event) => {
                    const type = event.target.value as FeedbackQuestionType;
                    setForm((current) => ({
                      ...current,
                      type,
                      options:
                        type === "multiple_choice"
                          ? current.options.length > 0
                            ? current.options
                            : [createOption(1), createOption(2)]
                          : current.options,
                    }));
                  }}
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

            {formIsMultipleChoice && (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">Answer options</p>
                    <p className="mt-1 text-xs text-white/45">
                      Customer can select one option. English labels are used as the stored reporting value.
                    </p>
                  </div>
                  <Button variant="secondary" onClick={addOption} disabled={isPending}>
                    <Plus className="h-4 w-4" /> Add
                  </Button>
                </div>

                <div className="mt-4 space-y-3">
                  {form.options.map((option, index) => (
                    <div
                      key={option.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-medium text-white/55">
                          Option {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeOption(option.id)}
                          disabled={isPending || form.options.length <= 2}
                          className="rounded-lg p-2 text-white/40 transition hover:bg-white/10 hover:text-white disabled:opacity-20"
                          aria-label={`Remove option ${index + 1}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-2 grid gap-2">
                        <input
                          value={option.text.en}
                          onChange={(event) => updateOption(option.id, "en", event.target.value)}
                          placeholder="English option"
                          className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-amber-200/50"
                        />
                        <input
                          value={option.text.ar}
                          onChange={(event) => updateOption(option.id, "ar", event.target.value)}
                          placeholder="الخيار بالعربية"
                          dir="rtl"
                          className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-amber-200/50"
                        />
                        <input
                          value={option.text.fa}
                          onChange={(event) => updateOption(option.id, "fa", event.target.value)}
                          placeholder="گزینه فارسی"
                          dir="rtl"
                          className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-amber-200/50"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                <input
                  type="checkbox"
                  checked={form.required}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, required: event.target.checked }))
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
                    setForm((current) => ({ ...current, active: event.target.checked }))
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
                <Save className="h-4 w-4" /> Save
              </Button>
              <Button variant="secondary" onClick={resetForm} disabled={isPending}>
                New
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
