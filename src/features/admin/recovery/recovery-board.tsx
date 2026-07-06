"use client";

import { getWhatsAppTemplateText } from "@/app/admin/settings/whatsapp-messages/actions";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  CheckCircle2,
  ClipboardList,
  MessageCircle,
  RefreshCw,
  Search,
  Star,
  UserRound,
  X,
} from "lucide-react";
import {
  type RecoveryBoardPriorityFilter,
  type RecoveryBoardState,
  type RecoveryBoardStatusFilter,
  type RecoveryCaseDetail,
  getRecoveryBoard,
  getRecoveryCaseDetail,
  updateRecoveryCase,
  updateRecoveryTask,
} from "@/app/admin/recovery/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAdminLanguage } from "@/lib/admin-language";

type RecoveryBoardProps = {
  initialState: RecoveryBoardState;
};

const statusOptions: { value: RecoveryBoardStatusFilter; label: string }[] = [
  { value: "all", label: "All status" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const priorityOptions: { value: RecoveryBoardPriorityFilter; label: string }[] = [
  { value: "all", label: "All priority" },
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "normal", label: "Normal" },
  { value: "low", label: "Low" },
];

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
}

function statusVariant(status: string) {
  if (status === "resolved" || status === "closed") {
    return "success";
  }

  if (status === "in_progress") {
    return "danger";
  }

  return "secondary";
}

function priorityVariant(priority: string) {
  if (priority === "urgent" || priority === "high") {
    return "danger";
  }

  return "secondary";
}

export function RecoveryBoard({ initialState }: RecoveryBoardProps) {
  const { language } = useAdminLanguage();
  const [state, setState] = useState(initialState);
  const [status, setStatus] = useState<RecoveryBoardStatusFilter>("all");
  const [priority, setPriority] = useState<RecoveryBoardPriorityFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<RecoveryCaseDetail | null>(null);
  const [reason, setReason] = useState("");
  const [resolution, setResolution] = useState("");
  const [taskNotes, setTaskNotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(
    initialState.success ? null : initialState.message ?? "Failed to load recovery cases."
  );
  const [isPending, startTransition] = useTransition();
  const [isDetailPending, startDetailTransition] = useTransition();
  const [isSavePending, startSaveTransition] = useTransition();
  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const [whatsappText, setWhatsappText] = useState("");

  const stats = state.stats;
  const pagination = state.pagination;

  const activeFilterCount = useMemo(() => {
    return [status !== "all", priority !== "all", search.trim().length > 0].filter(Boolean).length;
  }, [priority, search, status]);

  useEffect(() => {
    setReason(detail?.complaintReason ?? "");
    setResolution(detail?.resolutionSummary ?? "");
    setTaskNotes(
      Object.fromEntries((detail?.tasks ?? []).map((task) => [task.id, task.note ?? ""]))
    );
  }, [detail]);

  const load = (offset = 0) => {
    startTransition(async () => {
      const result = await getRecoveryBoard({
        status,
        priority,
        search,
        limit: 25,
        offset,
      });

      if (offset > 0 && result.success) {
        setState((current) => ({
          ...result,
          cases: [...current.cases, ...result.cases],
        }));
      } else {
        setState(result);
      }

      setMessage(result.success ? null : result.message ?? "Load failed.");
    });
  };

  const openDetail = (caseId: string) => {
    setSelectedId(caseId);
    setDetail(null);

    startDetailTransition(async () => {
      const result = await getRecoveryCaseDetail(caseId);

      if (!result.success || !result.case) {
        setMessage(result.message ?? "Could not load recovery case.");
        return;
      }

      setDetail(result.case);
      setMessage(null);
    });
  };


  const openWhatsAppComposer = async () => {
    if (!detail) return;
    const defaultMessage = `Hello, we are following up regarding your recent experience with Bon Plus. We would like to understand the issue better and make things right.`;
    const saved = await getWhatsAppTemplateText("followup", language);
    setWhatsappText((saved || defaultMessage).replaceAll("{customer_name}", detail.phone).replaceAll("{score}", ""));
    setWhatsappOpen(true);
  };

  const launchWhatsApp = () => {
    if (!detail || !whatsappText.trim()) return;
    const phone = detail.phone.replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(whatsappText.trim())}`, "_blank", "noopener,noreferrer");
    setWhatsappOpen(false);
  };

  const saveCase = (nextStatus?: "open" | "in_progress" | "resolved" | "closed") => {
    if (!detail) {
      return;
    }

    startSaveTransition(async () => {
      const result = await updateRecoveryCase({
        caseId: detail.id,
        status: nextStatus,
        complaintReason: reason,
        resolutionSummary: resolution,
      });

      if (!result.success || !result.case) {
        setMessage(result.message ?? "Save failed.");
        return;
      }

      setDetail(result.case);
      setMessage(null);
      load(0);
    });
  };

  const toggleTask = (taskId: string, currentStatus: "pending" | "done" | "skipped") => {
    startSaveTransition(async () => {
      const result = await updateRecoveryTask({
        taskId,
        status: currentStatus === "done" ? "pending" : "done",
        note: taskNotes[taskId] ?? null,
      });

      if (!result.success || !result.case) {
        setMessage(result.message ?? "Task update failed.");
        return;
      }

      setDetail(result.case);
      setMessage(null);
      load(0);
    });
  };

  return (
    <>
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <div className="mb-3 flex items-center gap-2 text-amber-200/80">
            <ClipboardList className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-[0.25em]">
              Recovery Board
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white">
            Unhappy customer follow-ups
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
            Manage all unhappy customer recovery cases in one place.
          </p>
        </section>

        {message && (
          <div className="rounded-3xl border border-amber-200/10 bg-amber-200/[0.06] p-4 text-sm text-amber-100">
            {message}
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-7">
          {[
            ["Total", stats.total, "text-white"],
            ["Open", stats.open, "text-white"],
            ["In progress", stats.inProgress, "text-red-200"],
            ["Resolved", stats.resolved, "text-emerald-200"],
            ["Closed", stats.closed, "text-emerald-200"],
            ["Urgent", stats.urgent, "text-red-200"],
            ["Filtered", stats.filtered, "text-amber-100"],
          ].map(([label, value, cls]) => (
            <Card key={label as string} className="p-4">
              <p className="text-xs text-white/45">{label}</p>
              <p className={`mt-1 text-2xl font-semibold ${cls}`}>{value}</p>
            </Card>
          ))}
        </div>

        <Card className="p-5">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-white">
              <Search className="h-5 w-5 text-amber-200" />
              <h2 className="text-lg font-semibold">Filters</h2>
              {activeFilterCount > 0 && <Badge>{activeFilterCount} active</Badge>}
            </div>

            <Button onClick={() => load(0)} disabled={isPending}>
              <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
              Apply
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px]">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <Search className="h-4 w-4 text-white/35" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search phone / reason / resolution"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
              />
            </div>

            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as RecoveryBoardStatusFilter)}
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value as RecoveryBoardPriorityFilter)}
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
          <Card className="overflow-hidden p-0">
            <div className="grid grid-cols-[minmax(110px,1fr)_90px_110px_94px_92px_28px] gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/30">
              <span>Phone</span>
              <span>Score</span>
              <span>Status</span>
              <span>Priority</span>
              <span>Tasks</span>
              <span />
            </div>

            <div className="divide-y divide-white/10">
              {state.cases.length === 0 && (
                <div className="p-6 text-sm text-white/45">No recovery cases found.</div>
              )}

              {state.cases.map((item) => (
                <button
                  key={item.id}
                  onClick={() => openDetail(item.id)}
                  className={`grid min-h-[48px] w-full grid-cols-[minmax(110px,1fr)_90px_110px_94px_92px_28px] items-center gap-2 px-4 py-1.5 text-left hover:bg-white/[0.04] ${
                    selectedId === item.id ? "bg-amber-200/[0.06]" : ""
                  }`}
                >
                  <p className="truncate text-sm font-semibold text-white">{item.phone}</p>
                  <div className="flex items-center gap-1 text-sm font-semibold text-red-200">
                    <Star className="h-3.5 w-3.5" />
                    {Number(item.score || 0).toFixed(1)}
                  </div>
                  <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                  <Badge variant={priorityVariant(item.priority)}>{item.priority}</Badge>
                  <p className="text-xs text-white/45">{item.taskDone}/{item.taskTotal}</p>
                  <UserRound className="h-4 w-4 text-white/25" />
                </button>
              ))}
            </div>

            {pagination.hasMore && (
              <div className="border-t border-white/10 p-3">
                <Button variant="secondary" onClick={() => load(state.cases.length)} disabled={isPending}>
                  Load more
                </Button>
              </div>
            )}
          </Card>

          <Card className="min-h-[520px] p-5">
            {!selectedId && (
              <div className="flex h-full min-h-[460px] flex-col items-center justify-center text-center">
                <ClipboardList className="h-8 w-8 text-white/30" />
                <h2 className="mt-4 text-xl font-semibold text-white">Select a case</h2>
                <p className="mt-2 max-w-xs text-sm leading-6 text-white/40">
                  Click a recovery case to update notes, tasks, and resolution.
                </p>
              </div>
            )}

            {selectedId && isDetailPending && (
              <div className="flex h-full min-h-[460px] flex-col items-center justify-center">
                <RefreshCw className="h-7 w-7 animate-spin text-amber-200" />
              </div>
            )}

            {detail && !isDetailPending && (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="mb-3 flex flex-wrap gap-2">
                      <Badge variant={statusVariant(detail.status)}>{detail.status}</Badge>
                      <Badge variant={priorityVariant(detail.priority)}>{detail.priority}</Badge>
                    </div>
                    <h2 className="text-2xl font-semibold text-white">{detail.phone}</h2>
                    <p className="mt-1 text-sm text-white/40">{formatDate(detail.createdAt)}</p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedId(null);
                      setDetail(null);
                    }}
                    className="rounded-2xl border border-white/10 bg-white/5 p-3 text-white/50 hover:bg-white/10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <Button onClick={openWhatsAppComposer} className="w-full">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp follow-up
                </Button>

                <div className="rounded-3xl border border-red-300/10 bg-red-400/[0.08] p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/45">Feedback score</span>
                    <span className="text-3xl font-semibold text-red-200">
                      {Number(detail.feedback.overallScore || 0).toFixed(1)}
                    </span>
                  </div>
                </div>

                <label className="block">
                  <span className="text-sm text-white/55">Complaint reason</span>
                  <textarea
                    rows={3}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-amber-200/50"
                  />
                </label>

                <label className="block">
                  <span className="text-sm text-white/55">Resolution summary</span>
                  <textarea
                    rows={3}
                    value={resolution}
                    onChange={(event) => setResolution(event.target.value)}
                    className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-amber-200/50"
                  />
                </label>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-white">Tasks</p>
                  {detail.tasks.map((task) => (
                    <div key={task.id} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleTask(task.id, task.status)}
                          disabled={isSavePending}
                          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border ${
                            task.status === "done"
                              ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-200"
                              : "border-white/15 bg-white/5 text-white/35"
                          }`}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white">{task.stepOrder}. {task.title}</p>
                          <p className="mt-1 text-xs leading-5 text-white/40">{task.description}</p>
                          <input
                            value={taskNotes[task.id] ?? ""}
                            onChange={(event) =>
                              setTaskNotes((current) => ({
                                ...current,
                                [task.id]: event.target.value,
                              }))
                            }
                            placeholder="Optional note"
                            className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-white outline-none placeholder:text-white/25 focus:border-amber-200/50"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => saveCase("in_progress")} disabled={isSavePending}>
                    Save
                  </Button>
                  <Button onClick={() => saveCase("resolved")} disabled={isSavePending}>
                    <CheckCircle2 className="h-4 w-4" />
                    Mark resolved
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {whatsappOpen && detail && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[2rem] border border-white/15 bg-[#12151b] p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-white">WhatsApp follow-up</h3>
                <p className="mt-1 text-sm text-white/45">{detail.phone}</p>
              </div>
              <button
                type="button"
                onClick={() => setWhatsappOpen(false)}
                className="rounded-2xl border border-white/10 bg-white/5 p-3 text-white/60 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <textarea
              rows={7}
              value={whatsappText}
              onChange={(event) => setWhatsappText(event.target.value)}
              className="mt-4 w-full resize-none rounded-2xl border border-white/15 bg-black/35 px-4 py-3 text-sm leading-6 text-white outline-none focus:border-amber-200/50"
            />

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <Button variant="secondary" onClick={() => setWhatsappOpen(false)}>Cancel</Button>
              <Button onClick={launchWhatsApp} disabled={!whatsappText.trim()}>
                <MessageCircle className="h-4 w-4" />
                Open WhatsApp
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
