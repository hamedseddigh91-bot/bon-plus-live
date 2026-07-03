"use client";

import { useState, useTransition } from "react";
import { Building2, Check, ChevronDown, RefreshCw } from "lucide-react";
import {
  type BusinessListItem,
  setCurrentBusiness,
} from "@/app/admin/business/actions";

type BusinessSwitcherProps = {
  businesses: BusinessListItem[];
  currentSlug: string;
};

export function BusinessSwitcher({ businesses, currentSlug }: BusinessSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const current =
    businesses.find((business) => business.slug === currentSlug) ?? businesses[0] ?? null;

  const changeBusiness = (slug: string) => {
    startTransition(async () => {
      const result = await setCurrentBusiness(slug);
      if (result.success) {
        window.location.reload();
      }
    });
  };

  return (
    <div className="relative mb-4">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 rounded-[1.15rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-left hover:bg-white/[0.07]"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#ffd42a] text-black">
          {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            {current?.name ?? "Select business"}
          </p>
          <p className="truncate text-xs text-white/35">
            {current?.slug ?? currentSlug}
          </p>
        </div>
        <ChevronDown className="h-4 w-4 text-white/35" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-72 overflow-auto rounded-[1.15rem] border border-white/10 bg-[#11100f] p-2 shadow-2xl">
          {businesses.length === 0 && (
            <div className="px-3 py-3 text-sm text-white/40">No business found.</div>
          )}

          {businesses.map((business) => (
            <button
              key={business.id}
              type="button"
              onClick={() => changeBusiness(business.slug)}
              disabled={isPending}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left hover:bg-white/[0.06]"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xs font-bold text-white">
                {business.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{business.name}</p>
                <p className="truncate text-xs text-white/35">{business.slug}</p>
              </div>
              {business.slug === currentSlug && <Check className="h-4 w-4 text-amber-200" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
