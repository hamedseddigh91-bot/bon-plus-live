"use client";

import { useState, useTransition } from "react";
import { BarChart3, RefreshCw } from "lucide-react";
import { type ReportsState, getReports } from "@/app/admin/reports/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ReportsDashboardProps = {
  initialState: ReportsState;
};

export function ReportsDashboard({ initialState }: ReportsDashboardProps) {
  const [state, setState] = useState(initialState);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [message, setMessage] = useState<string | null>(
    initialState.success ? null : initialState.message ?? "Failed to load reports."
  );
  const [isPending, startTransition] = useTransition();

  const load = () => {
    startTransition(async () => {
      const result = await getReports({ dateFrom, dateTo });
      setState(result);
      setMessage(result.success ? null : result.message ?? "Load failed.");
    });
  };

  const kpis = state.kpis;

  return (
    <>
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <div className="mb-3 flex items-center gap-2 text-amber-200/80">
            <BarChart3 className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-[0.25em]">
              Reports
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white">
            Business reports
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
            Feedback, customer, reward, and recovery performance.
          </p>
        </section>

        {message && (
          <div className="rounded-3xl border border-amber-200/10 bg-amber-200/[0.06] p-4 text-sm text-amber-100">
            {message}
          </div>
        )}

        <Card className="p-5">
          <div className="grid gap-3 md:grid-cols-[180px_180px_120px]">
            <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
            <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
            <Button onClick={load} disabled={isPending}>
              <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
              Apply
            </Button>
          </div>
        </Card>

        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
          {[
            ["Feedback", kpis.totalFeedback, "text-white"],
            ["Avg score", Number(kpis.averageScore || 0).toFixed(1), "text-amber-100"],
            ["Satisfied", kpis.satisfied, "text-emerald-200"],
            ["Medium", kpis.medium, "text-white"],
            ["Unhappy", kpis.unhappy, "text-red-200"],
            ["New customers", kpis.newCustomers, "text-white"],
            ["Reward codes", kpis.rewardCodes, "text-amber-100"],
            ["Used rewards", kpis.usedRewards, "text-emerald-200"],
            ["Recovery cases", kpis.recoveryTotal, "text-red-200"],
            ["Resolved %", `${kpis.recoveryResolutionRate || 0}%`, "text-emerald-200"],
          ].map(([label, value, cls]) => (
            <Card key={label as string} className="p-4">
              <p className="text-xs text-white/45">{label}</p>
              <p className={`mt-1 text-2xl font-semibold ${cls}`}>{value}</p>
            </Card>
          ))}
        </div>

        <Card className="overflow-hidden p-0">
          <div className="grid grid-cols-[110px_80px_90px_90px_90px_90px] gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/30">
            <span>Date</span>
            <span>Total</span>
            <span>Avg</span>
            <span>Satisfied</span>
            <span>Medium</span>
            <span>Unhappy</span>
          </div>

          <div className="divide-y divide-white/10">
            {state.daily.length === 0 && (
              <div className="p-6 text-sm text-white/45">No daily report found.</div>
            )}

            {state.daily.map((row) => (
              <div key={row.date} className="grid min-h-[44px] grid-cols-[110px_80px_90px_90px_90px_90px] items-center gap-2 px-4 py-2">
                <p className="text-sm text-white">{row.date}</p>
                <p className="text-sm text-white/60">{row.total}</p>
                <p className="text-sm text-amber-100">{Number(row.avgScore || 0).toFixed(1)}</p>
                <p className="text-sm text-emerald-200">{row.satisfied}</p>
                <p className="text-sm text-white/60">{row.medium}</p>
                <p className="text-sm text-red-200">{row.unhappy}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
