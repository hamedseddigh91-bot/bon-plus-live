"use client";

import { CheckCircle2, Search, TicketPercent } from "lucide-react";

export default function RedeemPage() {
  return (
    <main className="min-h-screen bg-[#090807] px-5 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-2xl flex-col justify-center">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.065] p-6 shadow-2xl shadow-black/30">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-300/10 text-amber-200">
              <TicketPercent className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-amber-200/70">
                Discount Verification
              </p>
              <h1 className="text-3xl font-semibold tracking-[-0.03em]">
                Verify & Redeem Code
              </h1>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
            <label className="text-sm text-white/60">
              Discount code or phone number
            </label>
            <div className="mt-3 flex gap-3">
              <input
                placeholder="SORRY10 or +968..."
                className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-amber-200/50"
              />
              <button className="flex items-center gap-2 rounded-2xl bg-amber-300 px-5 py-3 text-sm font-semibold text-black transition hover:bg-amber-200">
                <Search className="h-4 w-4" />
                Check
              </button>
            </div>
          </div>

          <div className="mt-5 rounded-3xl border border-emerald-300/10 bg-emerald-300/[0.07] p-5">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-300" />
              <div>
                <p className="font-medium text-emerald-100">
                  Ready for backend logic
                </p>
                <p className="mt-1 text-sm text-white/50">
                  Next steps will validate active status, expiry date, usage
                  limit, phone matching, and redemption history.
                </p>
              </div>
            </div>
            <button className="mt-5 w-full rounded-2xl bg-white/10 px-5 py-4 text-sm font-semibold text-white/80">
              Redeem button will activate after valid check
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
