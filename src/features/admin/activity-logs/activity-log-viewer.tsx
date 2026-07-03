"use client";

import { useMemo, useState, useTransition } from "react";
import {
  ChevronRight,
  Clock3,
  History,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import {
  type ActivityLogRow,
  type ActivityLogsState,
  getActivityLogs,
} from "@/app/admin/activity-logs/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ActivityLogViewerProps = {
  initialState: ActivityLogsState;
};

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
}

function formatShortDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString(undefined, {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
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
  };

  return labels[action] ?? action.replaceAll("_", " ");
}

function getLogSummary(log: ActivityLogRow) {
  const metadata = log.metadata ?? {};
  const phone = typeof metadata.phone === "string" ? metadata.phone : null;
  const code = typeof metadata.code === "string" ? metadata.code : null;
  const score =
    typeof metadata.score === "number" || typeof metadata.score === "string"
      ? String(metadata.score)
      : null;

  if (phone && score) {
    return `${phone} • score ${score}`;
  }

  if (phone) {
    return phone;
  }

  if (code) {
    return code;
  }

  return log.entityType;
}

export function ActivityLogViewer({ initialState }: ActivityLogViewerProps) {
  const [state, setState] = useState(initialState);
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<ActivityLogRow | null>(null);
  const [message, setMessage] = useState<string | null>(
    initialState.success ? null : initialState.message ?? "Failed to load activity logs."
  );
  const [isPending, startTransition] = useTransition();

  const activeLog = useMemo(() => {
    if (!selectedLog) {
      return null;
    }

    return state.logs.find((log) => log.id === selectedLog.id) ?? selectedLog;
  }, [selectedLog, state.logs]);

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
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <div className="mb-3 flex items-center gap-2 text-amber-200/80">
            <History className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-[0.25em]">
              Activity Logs
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white">
            System activity
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
            Compact activity list. Click any log to view full technical details.
          </p>
        </section>

        {message && (
          <div className="rounded-3xl border border-amber-200/10 bg-amber-200/[0.06] p-4 text-sm text-amber-100">
            {message}
          </div>
        )}

        <Card className="p-5">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px]">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <Search className="h-4 w-4 text-white/35" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search action, entity, metadata"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
              />
            </div>
            <Button onClick={() => load(0)} disabled={isPending}>
              <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
              Apply
            </Button>
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
          <Card className="overflow-hidden p-0">
            <div className="grid grid-cols-[130px_minmax(160px,1fr)_150px_28px] gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/30">
              <span>Time</span>
              <span>Activity</span>
              <span>Summary</span>
              <span />
            </div>

            <div className="divide-y divide-white/10">
              {state.logs.length === 0 && (
                <div className="p-6 text-sm text-white/45">No activity log found.</div>
              )}

              {state.logs.map((log) => (
                <button
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className={`grid min-h-[52px] w-full grid-cols-[130px_minmax(160px,1fr)_150px_28px] items-center gap-2 px-4 py-2 text-left hover:bg-white/[0.04] ${
                    activeLog?.id === log.id ? "bg-amber-200/[0.06]" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs text-white/45">
                    <Clock3 className="h-3.5 w-3.5" />
                    {formatShortDate(log.createdAt)}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {log.action}
                    </p>
                    <p className="mt-1 truncate text-xs capitalize text-white/35">
                      {humanizeAction(log.action)}
                    </p>
                  </div>

                  <p className="truncate text-xs text-white/45">
                    {getLogSummary(log)}
                  </p>

                  <ChevronRight className="h-4 w-4 text-white/25" />
                </button>
              ))}
            </div>

            {state.pagination.hasMore && (
              <div className="border-t border-white/10 p-3">
                <Button
                  variant="secondary"
                  onClick={() => load(state.logs.length)}
                  disabled={isPending}
                >
                  Load more
                </Button>
              </div>
            )}
          </Card>

          <Card className="min-h-[520px] p-5">
            {!activeLog && (
              <div className="flex h-full min-h-[460px] flex-col items-center justify-center text-center">
                <History className="h-8 w-8 text-white/30" />
                <h2 className="mt-4 text-xl font-semibold text-white">
                  Select log
                </h2>
                <p className="mt-2 max-w-xs text-sm leading-6 text-white/40">
                  Click a compact log row to see full action details and metadata.
                </p>
              </div>
            )}

            {activeLog && (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge>{activeLog.entityType}</Badge>
                    <h2 className="mt-3 break-words text-2xl font-semibold text-white">
                      {activeLog.action}
                    </h2>
                    <p className="mt-1 text-sm text-white/40">
                      {formatDate(activeLog.createdAt)}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedLog(null)}
                    className="rounded-2xl border border-white/10 bg-white/5 p-3 text-white/50 hover:bg-white/10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm font-semibold text-white">Readable summary</p>
                  <p className="mt-2 text-sm leading-6 text-white/55">
                    {humanizeAction(activeLog.action)}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-white/40">
                    {getLogSummary(activeLog)}
                  </p>
                </div>

                <div className="grid gap-3">
                  <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs text-white/35">Entity type</p>
                    <p className="mt-1 break-words text-sm font-semibold text-white">
                      {activeLog.entityType}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs text-white/35">Entity ID</p>
                    <p className="mt-1 break-words text-sm font-semibold text-white">
                      {activeLog.entityId ?? "—"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-sm font-semibold text-white">
                    Full metadata
                  </p>
                  <pre className="max-h-[360px] overflow-auto rounded-3xl border border-white/10 bg-black/25 p-4 text-xs leading-5 text-white/55">
                    {JSON.stringify(activeLog.metadata ?? {}, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
