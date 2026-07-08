"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Copy, RefreshCw, Search, X } from "lucide-react";
import {
  type ActivityLogRow,
  type ActivityLogsState,
  getActivityLogs,
} from "@/app/admin/activity-logs/actions";
import { Button } from "@/components/ui/button";

type ActivityLogViewerProps = {
  initialState: ActivityLogsState;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "â€”";
  return new Date(value).toLocaleString();
}

function formatShortDate(value: string | null | undefined) {
  if (!value) return "â€”";
  return new Date(value).toLocaleString(undefined, {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function titleCase(value: string | null | undefined) {
  if (!value) return "â€”";
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
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
  if (!value) return "â€”";
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
      return `${actionLabel}: ${metadata.phone.trim()} â€¢ score ${String(metadata.score)}`;
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

export function ActivityLogViewer({ initialState }: ActivityLogViewerProps) {
  const [state, setState] = useState(initialState);
  const [search, setSearch] = useState("");
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
      const result = await getActivityLogs({ search, limit: 50, offset });
      if (offset > 0 && result.success) {
        setState((current) => ({
          ...result,
          logs: [...current.logs, ...result.logs],
        }));
      } else {
        setState(result);
      }
      setMessage(result.success ? null : result.message ?? "Load failed.");
    });
  };

  return (
    <>
      <div className="space-y-5">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-slate-900">Activity Logs</h1>
          <p className="text-sm text-slate-500">
            Review important actions across the system.
          </p>
        </div>

        {message && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {message}
          </div>
        )}

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search action, entity, metadata"
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => load(0)} disabled={isPending} className="rounded-2xl">
                <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
                Apply
              </Button>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
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

          {state.pagination.hasMore && (
            <div className="mt-4 flex justify-center">
              <Button variant="primary" onClick={() => load(state.logs.length)} disabled={isPending} className="rounded-2xl">
                Load more
              </Button>
            </div>
          )}
        </div>
      </div>

      {activeLog && typeof document !== "undefined" && createPortal(
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
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-white text-white">
                  {humanizeAction(activeLog.action)}
                </h2>
                <p className="mt-2 text-sm text-slate-300">{formatDate(activeLog.createdAt)}</p>
              </div>
            </div>

            <div className="max-h-[calc(88vh-120px)] overflow-y-auto px-6 py-6">
              <div className="grid gap-4 md:grid-cols-2">
                <InfoCard label="Entity Type" value={humanizeEntityType(activeLog.entityType)} />
                <InfoCard label="Entity ID" value={activeLog.entityId ?? "â€”"} mono />
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
      <div className={`mt-2 text-lg font-semibold text-slate-900 ${mono ? "break-all font-mono text-base" : ""}`}>
        {value}
      </div>
    </div>
  );
}

