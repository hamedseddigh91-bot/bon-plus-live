"use client";

import { useMemo, useState, useTransition } from "react";
import { Gift, RefreshCw, Search, TicketPercent } from "lucide-react";
import {
  type DiscountCenterState,
  type DiscountRewardFilter,
  type DiscountSourceFilter,
  type DiscountStatusFilter,
  getDiscountCenter,
  redeemDiscountCode,
} from "@/app/admin/discounts/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type DiscountsManagerProps = {
  initialState: DiscountCenterState;
};

const statusOptions = [
  { value: "all", label: "All status" },
  { value: "available", label: "Available" },
  { value: "used_up", label: "Used up" },
  { value: "expired", label: "Expired" },
];

const sourceOptions = [
  { value: "all", label: "All source" },
  { value: "system", label: "System" },
  { value: "manual", label: "Manual" },
];

const rewardOptions = [
  { value: "all", label: "All rewards" },
  { value: "thank_you", label: "Thank you" },
  { value: "percentage", label: "Percentage" },
  { value: "fixed", label: "Fixed" },
  { value: "free_item", label: "Free item" },
];

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function codeStatus(row: DiscountCenterState["codes"][number]) {
  if (row.isExpired) return { label: "Expired", variant: "danger" as const };
  if (row.isUsedUp) return { label: "Used up", variant: "secondary" as const };
  return { label: "Available", variant: "success" as const };
}

export function DiscountsManager({ initialState }: DiscountsManagerProps) {
  const [state, setState] = useState(initialState);
  const [status, setStatus] = useState<DiscountStatusFilter>("all");
  const [source, setSource] = useState<DiscountSourceFilter>("all");
  const [rewardType, setRewardType] = useState<DiscountRewardFilter>("all");
  const [search, setSearch] = useState("");
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemNote, setRedeemNote] = useState("");
  const [message, setMessage] = useState<string | null>(
    initialState.success ? null : initialState.message ?? "Failed to load discounts."
  );
  const [isPending, startTransition] = useTransition();

  const activeFilterCount = useMemo(() => {
    return [
      status !== "all",
      source !== "all",
      rewardType !== "all",
      search.trim().length > 0,
    ].filter(Boolean).length;
  }, [rewardType, search, source, status]);

  const load = (offset = 0) => {
    startTransition(async () => {
      const result = await getDiscountCenter({
        status,
        source,
        rewardType,
        search,
        limit: 25,
        offset,
      });

      if (offset > 0 && result.success) {
        setState((current) => ({
          ...result,
          codes: [...current.codes, ...result.codes],
        }));
      } else {
        setState(result);
      }

      setMessage(result.success ? null : result.message ?? "Load failed.");
    });
  };

  const redeem = () => {
    startTransition(async () => {
      const result = await redeemDiscountCode({
        code: redeemCode,
        note: redeemNote,
      });

      setMessage(result.message ?? (result.success ? "Code redeemed." : "Redeem failed."));

      if (result.success) {
        setRedeemCode("");
        setRedeemNote("");
        load(0);
      }
    });
  };

  return (
    <>
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <div className="mb-3 flex items-center gap-2 text-amber-200/80">
            <TicketPercent className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-[0.25em]">
              Discounts
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white">
            Discount codes
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
            Search, filter, and redeem generated reward codes.
          </p>
        </section>

        {message && (
          <div className="rounded-3xl border border-amber-200/10 bg-amber-200/[0.06] p-4 text-sm text-amber-100">
            {message}
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-5">
          {[
            ["Total", state.stats.total, "text-white"],
            ["Available", state.stats.available, "text-emerald-200"],
            ["Used up", state.stats.usedUp, "text-white"],
            ["Expired", state.stats.expired, "text-red-200"],
            ["Filtered", state.stats.filtered, "text-amber-100"],
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

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px_160px_160px]">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <Search className="h-4 w-4 text-white/35" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search code or phone"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
              />
            </div>

            <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none">
              {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>

            <select value={source} onChange={(event) => setSource(event.target.value)} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none">
              {sourceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>

            <select value={rewardType} onChange={(event) => setRewardType(event.target.value as DiscountRewardFilter)} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none">
              {rewardOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2 text-white">
            <Gift className="h-5 w-5 text-amber-200" />
            <h2 className="text-lg font-semibold">Redeem code</h2>
          </div>

          <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)_120px]">
            <input
              value={redeemCode}
              onChange={(event) => setRedeemCode(event.target.value)}
              placeholder="Code"
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm uppercase text-white outline-none placeholder:text-white/30"
            />
            <input
              value={redeemNote}
              onChange={(event) => setRedeemNote(event.target.value)}
              placeholder="Optional note"
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
            />
            <Button onClick={redeem} disabled={isPending || !redeemCode.trim()}>
              Redeem
            </Button>
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="grid grid-cols-[minmax(130px,1fr)_120px_110px_110px_120px_120px] gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/30">
            <span>Code</span>
            <span>Status</span>
            <span>Reward</span>
            <span>Usage</span>
            <span>Customer</span>
            <span>Expires</span>
          </div>

          <div className="divide-y divide-white/10">
            {state.codes.length === 0 && (
              <div className="p-6 text-sm text-white/45">No discount code found.</div>
            )}

            {state.codes.map((row) => {
              const statusInfo = codeStatus(row);

              return (
                <div key={row.id} className="grid min-h-[48px] grid-cols-[minmax(130px,1fr)_120px_110px_110px_120px_120px] items-center gap-2 px-4 py-2">
                  <p className="truncate text-sm font-semibold tracking-[0.12em] text-white">{row.code}</p>
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  <p className="text-sm text-white/60">{row.rewardType}</p>
                  <p className="text-sm text-white/60">{row.usedCount}/{row.usageLimit}</p>
                  <p className="truncate text-sm text-white/45">{row.feedbackPhone ?? "—"}</p>
                  <p className="text-xs text-white/35">{formatDate(row.expiresAt)}</p>
                </div>
              );
            })}
          </div>

          {state.pagination.hasMore && (
            <div className="border-t border-white/10 p-3">
              <Button variant="secondary" onClick={() => load(state.codes.length)} disabled={isPending}>
                Load more
              </Button>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
