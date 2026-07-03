"use client";

import { useState } from "react";
import { Copy, ExternalLink, Printer, QrCode } from "lucide-react";
import type { BusinessSettingsState } from "@/app/admin/settings/actions";
import { AdminShell } from "@/components/layout/admin-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type PublicQrManagerProps = {
  initialState: BusinessSettingsState;
};

function makeQrUrl(link: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(link)}`;
}

export function PublicQrManager({ initialState }: PublicQrManagerProps) {
  const settings = initialState.settings;
  const feedbackUrl = settings?.publicFeedbackUrl ?? "";
  const qrUrl = feedbackUrl ? makeQrUrl(feedbackUrl) : "";
  const [message, setMessage] = useState<string | null>(
    initialState.success ? null : initialState.message ?? "Failed to load QR link."
  );

  const copy = async () => {
    if (!feedbackUrl) {
      return;
    }

    await navigator.clipboard.writeText(feedbackUrl);
    setMessage("Feedback link copied.");
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <div className="mb-3 flex items-center gap-2 text-amber-200/80">
            <QrCode className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-[0.25em]">
              QR & Public Links
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white">
            Feedback QR code
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
            Print this QR code for tables, receipts, counters, and packaging.
          </p>
        </section>

        {message && (
          <div className="rounded-3xl border border-amber-200/10 bg-amber-200/[0.06] p-4 text-sm text-amber-100">
            {message}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[430px_minmax(0,1fr)]">
          <Card className="p-5">
            <div className="rounded-[2rem] bg-white p-6 text-center text-black">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.35rem] bg-[#ffd42a] text-lg font-black">
                CR
              </div>
              <h2 className="mt-4 text-2xl font-bold">
                {settings?.businessName ?? "Cafe Retention"}
              </h2>
              <p className="mt-2 text-sm text-black/55">
                Scan to share your feedback
              </p>

              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt="Feedback QR code"
                  className="mx-auto mt-6 h-72 w-72 rounded-2xl"
                />
              ) : (
                <div className="mx-auto mt-6 flex h-72 w-72 items-center justify-center rounded-2xl bg-black/5 text-sm text-black/50">
                  QR unavailable
                </div>
              )}

              <p className="mt-5 break-all text-xs text-black/45">
                {feedbackUrl || "No feedback link"}
              </p>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-xl font-semibold text-white">Public feedback link</h2>
            <div className="mt-4 rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs text-white/35">URL</p>
              <p className="mt-2 break-all text-sm font-semibold text-white">
                {feedbackUrl || "—"}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={copy} disabled={!feedbackUrl}>
                <Copy className="h-4 w-4" />
                Copy link
              </Button>

              <Button variant="secondary" onClick={() => window.print()} disabled={!feedbackUrl}>
                <Printer className="h-4 w-4" />
                Print
              </Button>

              {feedbackUrl && (
                <a
                  href={feedbackUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white/70 hover:bg-white/10"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open feedback
                </a>
              )}
            </div>

            <div className="mt-6 rounded-3xl border border-amber-200/10 bg-amber-200/[0.06] p-4 text-sm leading-6 text-amber-100">
              For production, set <span className="font-semibold">NEXT_PUBLIC_APP_URL</span> to your real domain, then this QR will point to the live feedback page.
            </div>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
