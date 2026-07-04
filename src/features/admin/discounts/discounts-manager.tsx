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
  createManualDiscountCode,
  validateDiscountCode,
  type DiscountValidation,
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
  const [validation, setValidation] = useState<DiscountValidation | null>(null);
  const [createForm, setCreateForm] = useState({ phone: "", rewardType: "percentage" as "percentage" | "fixed" | "free_cafe_item" | "free_food_item", value: "10", acquisitionSource: "Talabat", usageLimit: "1", expiryDays: "7" });
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

  const createCode = () => {
    startTransition(async () => {
      const result = await createManualDiscountCode({
        phone: createForm.phone,
        rewardType: createForm.rewardType,
        value: Number(createForm.value || 0),
        acquisitionSource: createForm.acquisitionSource,
        usageLimit: Number(createForm.usageLimit || 1),
        expiryDays: Number(createForm.expiryDays || 7),
      });
      setMessage(result.message ?? null);
      if (result.success) { setCreateForm((current) => ({ ...current, phone: "" })); load(0); }
    });
  };

  const validateCode = () => {
    startTransition(async () => {
      const result = await validateDiscountCode(redeemCode);
      setValidation(result);
      setMessage(result.message ?? null);
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

        <div className="grid gap-5 xl:grid-cols-2">
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2 text-white"><TicketPercent className="h-5 w-5 text-amber-200" /><h2 className="text-lg font-semibold">Create discount code</h2></div>
            <div className="grid gap-3 md:grid-cols-2">
              <input value={createForm.phone} onChange={(e)=>setCreateForm((c)=>({...c,phone:e.target.value}))} placeholder="Phone number" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
              <select value={createForm.rewardType} onChange={(e)=>setCreateForm((c)=>({...c,rewardType:e.target.value as typeof c.rewardType}))} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"><option value="percentage">Percentage</option><option value="fixed">Fixed OMR</option><option value="free_cafe_item">Free café item</option><option value="free_food_item">Free food item</option></select>
              <input type="number" step="0.001" value={createForm.value} onChange={(e)=>setCreateForm((c)=>({...c,value:e.target.value}))} placeholder="Value / quantity" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
              <select value={createForm.acquisitionSource} onChange={(e)=>setCreateForm((c)=>({...c,acquisitionSource:e.target.value}))} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"><option>Talabat</option><option>Social Media</option><option>Google</option><option>Other</option></select>
              <input type="number" min="1" value={createForm.usageLimit} onChange={(e)=>setCreateForm((c)=>({...c,usageLimit:e.target.value}))} placeholder="Usage limit" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
              <input type="number" min="1" value={createForm.expiryDays} onChange={(e)=>setCreateForm((c)=>({...c,expiryDays:e.target.value}))} placeholder="Expiry days" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
            </div>
            <Button className="mt-4" onClick={createCode} disabled={isPending || !createForm.phone.trim()}>Create code</Button>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2 text-white"><Gift className="h-5 w-5 text-amber-200" /><h2 className="text-lg font-semibold">Validate & redeem</h2></div>
            <div className="grid gap-3 md:grid-cols-[1fr_auto]"><input value={redeemCode} onChange={(e)=>{setRedeemCode(e.target.value);setValidation(null);}} placeholder="Code" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm uppercase text-white outline-none" /><Button variant="secondary" onClick={validateCode} disabled={isPending || !redeemCode.trim()}>Validate</Button></div>
            {validation?.code && <div className={`mt-4 rounded-2xl border p-4 ${validation.valid ? "border-emerald-300/20 bg-emerald-300/10" : "border-red-300/20 bg-red-300/10"}`}><div className="flex items-center justify-between"><b className="text-white">{validation.code.code}</b><Badge variant={validation.valid?"success":"danger"}>{validation.valid?"Valid":"Invalid"}</Badge></div><p className="mt-2 text-sm text-white/60">Source: {validation.code.reason ?? "—"}</p><p className="text-sm text-white/60">Reward: {validation.code.rewardType} {validation.code.discountValue ?? validation.code.freeItemName ?? ""}</p><p className="text-sm text-white/60">Remaining: {validation.code.remainingUses} / {validation.code.usageLimit}</p><p className="text-sm text-white/60">Expires: {formatDate(validation.code.expiresAt)}</p>{validation.valid && <><input value={redeemNote} onChange={(e)=>setRedeemNote(e.target.value)} placeholder="Optional note" className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none"/><Button className="mt-3" onClick={redeem} disabled={isPending}>Use one time</Button></>}</div>}
          </Card>
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
