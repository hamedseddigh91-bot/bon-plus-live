"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import {
  type ActivityLogRow,
  type ActivityLogsState,
  getActivityLogs,
} from "@/app/admin/activity-logs/actions";
import { Button } from "@/components/ui/button";

type ActivityLogViewerProps = {
  initialState: ActivityLogsState;
  initialDate: string;
};

const PAGE_SIZE = 25;

const moduleOptions = [
  { value: "all", label: "All modules" },
  { value: "finance", label: "Finance" },
  { value: "feedback", label: "Feedback & Recovery" },
  { value: "loyalty", label: "Loyalty" },
  { value: "recipes", label: "Recipes & Costing" },
  { value: "users", label: "Users & Permissions" },
  { value: "settings", label: "Settings" },
  { value: "system", label: "System & Auth" },
] as const;

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function formatShortDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function titleCase(value: string | null | undefined) {
  if (!value) return "—";
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function humanizeAction(action: string) {
  const labels: Record<string, string> = {
    feedback_recovery_started: "Recovery follow-up started",
    discount_code_redeemed: "Discount code redeemed",
    rewards_updated: "Reward rules updated",
    feedback_submitted: "Customer feedback submitted",
    question_created: "Question created",
    question_updated: "Question updated",
    question_toggled: "Question status changed",
    questions_reordered: "Questions reordered",
    user_created: "User created",
    user_updated: "User updated",
    user_deleted: "User deleted",
    permission_updated: "Permissions updated",
    invoice_created: "Invoice created",
    invoice_updated: "Invoice updated",
    invoice_paid: "Invoice marked as paid",
    feedback_archived: "Feedback question archived",
    feedback_deleted: "Feedback question deleted",
  };
  return labels[action] ?? titleCase(action);
}

function humanizeEntityType(value: string | null | undefined) {
  const labels: Record<string, string> = {
    feedback_question: "Feedback Question",
    feedback_submission: "Feedback Submission",
    feedback_response_rule: "Feedback Response Rule",
    discount_code: "Discount Code",
    loyalty_rule: "Loyalty Rule",
    app_user: "User",
    business_user_permission: "User Permission",
    invoice: "Invoice",
    supplier: "Supplier",
    cash_closing: "Cash Closing",
  };
  if (!value) return "—";
  return labels[value] ?? titleCase(value);
}

function getReadableSummary(log: ActivityLogRow) {
  const metadata = log.metadata ?? {};
  const entityLabel = humanizeEntityType(log.entityType).toLowerCase();
  const actionLabel = humanizeAction(log.action);

  if (typeof metadata.summary === "string" && metadata.summary.trim()) {
    return metadata.summary.trim();
  }

  if (typeof metadata.label === "string" && metadata.label.trim()) {
    return `${actionLabel}: ${metadata.label.trim()}`;
  }

  if (typeof metadata.name === "string" && metadata.name.trim()) {
    return `${actionLabel}: ${metadata.name.trim()}`;
  }

  if (typeof metadata.question === "string" && metadata.question.trim()) {
    return `${actionLabel}: ${metadata.question.trim()}`;
  }

  if (typeof metadata.phone === "string" && metadata.phone.trim()) {
    if (typeof metadata.score === "number" || typeof metadata.score === "string") {
      return `${actionLabel}: ${metadata.phone.trim()} • score ${String(metadata.score)}`;
    }
    return `${actionLabel}: ${metadata.phone.trim()}`;
  }

  if (typeof metadata.code === "string" && metadata.code.trim()) {
    return `${actionLabel}: code ${metadata.code.trim()}`;
  }

  return `${actionLabel} for ${entityLabel}.`;
}

function copyJson(value: unknown) {
  return navigator.clipboard.writeText(JSON.stringify(value ?? {}, null, 2));
}

function paginationItems(currentPage: number, pageCount: number) {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const pages = new Set([1, pageCount, currentPage - 1, currentPage, currentPage + 1]);
  return [...pages].filter((page) => page >= 1 && page <= pageCount).sort((a, b) => a - b);
}

export function ActivityLogViewer({ initialState, initialDate }: ActivityLogViewerProps) {
  const [state, setState] = useState(initialState);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState(initialDate);
  const [dateTo, setDateTo] = useState(initialDate);
  const [module, setModule] = useState("all");
  const [selectedLog, setSelectedLog] = useState<ActivityLogRow | null>(null);
  const [message, setMessage] = useState<string | null>(
    initialState.success ? null : initialState.message ?? "Failed to load activity logs.",
  );
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const activeLog = useMemo(() => {
    if (!selectedLog) return null;
    return state.logs.find((log) => log.id === selectedLog.id) ?? selectedLog;
  }, [selectedLog, state.logs]);

  const currentPage = Math.floor(state.pagination.offset / state.pagination.limit) + 1;
  const pageCount = Math.max(
    1,
    Math.ceil(state.pagination.filteredTotal / state.pagination.limit),
  );
  const pages = paginationItems(currentPage, pageCount);

  useEffect(() => {
    if (!activeLog) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedLog(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeLog]);

  const load = (offset = 0) => {
    startTransition(async () => {
      const result = await getActivityLogs({
        search,
        dateFrom,
        dateTo,
        module,
        limit: PAGE_SIZE,
        offset,
      });
      setState(result);
      setMessage(result.success ? null : result.message ?? "Load failed.");
      setSelectedLog(null);
    });
  };

  const showToday = () => {
    setDateFrom(initialDate);
    setDateTo(initialDate);
    startTransition(async () => {
      const result = await getActivityLogs({
        search,
        dateFrom: initialDate,
        dateTo: initialDate,
        module,
        limit: PAGE_SIZE,
        offset: 0,
      });
      setState(result);
      setMessage(result.success ? null : result.message ?? "Load failed.");
      setSelectedLog(null);
    });
  };

  return (
    <>
      <div className="w-full space-y-5">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-slate-900">Activity Logs</h1>
          <p className="text-sm text-slate-500">
            Today&apos;s activity is shown by default. Use the filters to review another period.
          </p>
        </div>

        {message && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {message}
          </div>
        )}

        <div className="w-full rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 xl:grid-cols-[minmax(260px,1.4fr)_170px_170px_210px_auto] xl:items-end">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Search
              </span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") load(0);
                  }}
                  placeholder="Action, entity or ID"
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                From
              </span>
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(event) => setDateFrom(event.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                To
              </span>
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(event) => setDateTo(event.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Module
              </span>
              <select
                value={module}
                onChange={(event) => setModule(event.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
              >
                {moduleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={showToday}
                disabled={isPending}
                className="h-11 rounded-2xl"
              >
                Today
              </Button>
              <Button
                type="button"
                onClick={() => load(0)}
                disabled={isPending}
                className="h-11 rounded-2xl"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
                Apply
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>
              {state.pagination.filteredTotal.toLocaleString()} result
              {state.pagination.filteredTotal === 1 ? "" : "s"}
            </span>
            <span>
              Page {currentPage} of {pageCount}
            </span>
          </div>

          <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200">
            <div className="min-w-[860px]">
              <div className="grid grid-cols-[150px_220px_minmax(260px,1fr)_44px] items-center gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>Time</span>
                <span>Activity</span>
                <span>Summary</span>
                <span className="text-right"> </span>
              </div>

              {state.logs.length === 0 ? (
                <div className="px-4 py-8 text-sm text-slate-500">No activity log found.</div>
              ) : (
                state.logs.map((log) => (
                  <button
                    key={log.id}
                    type="button"
                    onClick={() => setSelectedLog(log)}
                    className={`grid min-h-[62px] w-full grid-cols-[150px_220px_minmax(260px,1fr)_44px] items-center gap-3 border-t border-slate-100 px-4 py-3 text-left transition hover:bg-blue-50 ${
                      activeLog?.id === log.id ? "bg-blue-50" : "bg-white"
                    }`}
                  >
                    <span className="text-sm text-slate-600">{formatShortDate(log.createdAt)}</span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900">{humanizeAction(log.action)}</div>
                      <div className="mt-1 text-xs text-slate-500">{humanizeEntityType(log.entityType)}</div>
                    </div>
                    <span className="truncate text-sm text-slate-700">{getReadableSummary(log)}</span>
                    <span className="flex justify-end text-slate-400">
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {pageCount > 1 && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => load((currentPage - 2) * PAGE_SIZE)}
                disabled={isPending || currentPage <= 1}
                className="h-10 rounded-2xl px-3"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {pages.map((page, index) => {
                const previousPage = pages[index - 1];
                return (
                  <span key={page} className="contents">
                    {previousPage && page - previousPage > 1 && (
                      <span className="px-1 text-sm text-slate-400">…</span>
                    )}
                    <button
                      type="button"
                      onClick={() => load((page - 1) * PAGE_SIZE)}
                      disabled={isPending}
                      className={`h-10 min-w-10 rounded-2xl px-3 text-sm font-semibold transition ${
                        page === currentPage
                          ? "bg-slate-900 text-white"
                          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {page}
                    </button>
                  </span>
                );
              })}

              <Button
                type="button"
                variant="secondary"
                onClick={() => load(currentPage * PAGE_SIZE)}
                disabled={isPending || currentPage >= pageCount}
                className="h-10 rounded-2xl px-3"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {activeLog && typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
            onClick={() => setSelectedLog(null)}
          >
            <div
              className="relative max-h-[88vh] w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="border-b border-slate-200 bg-slate-900 px-6 py-5 text-white">
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="absolute left-5 top-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white transition hover:bg-white/20"
                  aria-label="Close activity log details"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="pl-16 pr-6">
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-200/80">
                    Activity Log Details
                  </div>
                  <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
                    {humanizeAction(activeLog.action)}
                  </h2>
                  <p className="mt-2 text-sm text-slate-300">{formatDate(activeLog.createdAt)}</p>
                </div>
              </div>

              <div className="max-h-[calc(88vh-120px)] overflow-y-auto px-6 py-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <InfoCard label="Entity Type" value={humanizeEntityType(activeLog.entityType)} />
                  <InfoCard label="Entity ID" value={activeLog.entityId ?? "—"} mono />
                </div>

                <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Readable Summary
                  </div>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {getReadableSummary(activeLog)}
                  </p>
                </div>

                <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Technical Metadata
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        Detailed JSON payload for technical review.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="primary"
                      className="rounded-2xl"
                      onClick={async () => {
                        await copyJson(activeLog.metadata ?? {});
                        setCopied(true);
                        window.setTimeout(() => setCopied(false), 1800);
                      }}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  </div>
                  <pre className="overflow-x-auto rounded-2xl bg-slate-950 p-4 text-sm leading-6 text-slate-100">
                    {JSON.stringify(activeLog.metadata ?? {}, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

function InfoCard({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div
        className={`mt-2 text-lg font-semibold text-slate-900 ${
          mono ? "break-all font-mono text-base" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}
