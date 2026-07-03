"use client";

import { useState, useTransition } from "react";
import { Copy, ExternalLink, Link2, Printer, QrCode, Save, Settings2 } from "lucide-react";
import { type BusinessSettingsState, saveBusinessSettings } from "@/app/admin/settings/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { LanguageCode } from "@/types/feedback";

type BusinessSettingsManagerProps = {
  initialState: BusinessSettingsState;
};

const languageOptions: { value: LanguageCode; label: string }[] = [
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic" },
  { value: "fa", label: "Persian" },
];

function makeQrUrl(link: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(link)}`;
}

export function BusinessSettingsManager({ initialState }: BusinessSettingsManagerProps) {
  const initial = initialState.settings;

  const [businessName, setBusinessName] = useState(initial?.businessName ?? "Cafe");
  const [googleMapsReviewUrl, setGoogleMapsReviewUrl] = useState(initial?.googleMapsReviewUrl ?? "");
  const [logoUrl, setLogoUrl] = useState(initial?.logoUrl ?? "");
  const [accentColor, setAccentColor] = useState(initial?.accentColor ?? "#ffd42a");
  const [feedbackLockHours, setFeedbackLockHours] = useState(initial?.feedbackLockHours ?? 24);
  const [defaultLanguage, setDefaultLanguage] = useState<LanguageCode>(initial?.defaultLanguage ?? "en");
  const [feedbackAutoSourceKey, setFeedbackAutoSourceKey] = useState(initial?.feedbackAutoSourceKey ?? "feedback");
  const [settings, setSettings] = useState(initial);
  const [message, setMessage] = useState<string | null>(
    initialState.success ? null : initialState.message ?? "Failed to load settings."
  );
  const [isPending, startTransition] = useTransition();

  const feedbackUrl = settings?.publicFeedbackUrl ?? "";
  const qrUrl = feedbackUrl ? makeQrUrl(feedbackUrl) : "";

  const save = () => {
    startTransition(async () => {
      const result = await saveBusinessSettings({
        businessName,
        googleMapsReviewUrl,
        feedbackLockHours,
        defaultLanguage,
        feedbackAutoSourceKey,
        logoUrl,
        accentColor,
      });

      if (!result.success || !result.settings) {
        setMessage(result.message ?? "Save failed.");
        return;
      }

      setSettings(result.settings);
      setMessage("Settings saved.");
    });
  };

  const copyFeedbackLink = async () => {
    if (!feedbackUrl) return;
    await navigator.clipboard.writeText(feedbackUrl);
    setMessage("Feedback link copied.");
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
        <div className="mb-3 flex items-center gap-2 text-amber-200/80">
          <Settings2 className="h-5 w-5" />
          <span className="text-sm font-medium uppercase tracking-[0.25em]">Settings</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white">
          Business settings & QR
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
          These settings belong only to the selected business.
        </p>
      </section>

      {message && (
        <div className="rounded-3xl border border-amber-200/10 bg-amber-200/[0.06] p-4 text-sm text-amber-100">
          {message}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
        <div className="space-y-6">
          <Card className="p-5">
            <div className="mb-5 flex items-center gap-2 text-white">
              <Settings2 className="h-5 w-5 text-amber-200" />
              <h2 className="text-xl font-semibold">Business settings</h2>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-sm text-white/45">Business name</span>
                <input value={businessName} onChange={(event) => setBusinessName(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-amber-200/50" />
              </label>

              <label className="block">
                <span className="text-sm text-white/45">Logo URL</span>
                <input value={logoUrl} onChange={(event) => setLogoUrl(event.target.value)} placeholder="https://..." className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-amber-200/50" />
              </label>

              <label className="block">
                <span className="text-sm text-white/45">Google Maps review link</span>
                <input value={googleMapsReviewUrl} onChange={(event) => setGoogleMapsReviewUrl(event.target.value)} placeholder="https://g.page/r/..." className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-amber-200/50" />
              </label>

              <div className="grid gap-4 md:grid-cols-4">
                <label className="block">
                  <span className="text-sm text-white/45">Phone lock hours</span>
                  <input type="number" min={0} value={feedbackLockHours} onChange={(event) => setFeedbackLockHours(Number(event.target.value))} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-amber-200/50" />
                </label>

                <label className="block">
                  <span className="text-sm text-white/45">Default language</span>
                  <select value={defaultLanguage} onChange={(event) => setDefaultLanguage(event.target.value as LanguageCode)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-amber-200/50">
                    {languageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm text-white/45">Source key</span>
                  <input value={feedbackAutoSourceKey} onChange={(event) => setFeedbackAutoSourceKey(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-amber-200/50" />
                </label>

                <label className="block">
                  <span className="text-sm text-white/45">Accent color</span>
                  <input value={accentColor} onChange={(event) => setAccentColor(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-amber-200/50" />
                </label>
              </div>

              <Button onClick={save} disabled={isPending || !businessName.trim()}>
                <Save className="h-4 w-4" />
                {isPending ? "Saving..." : "Save settings"}
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2 text-white">
              <Link2 className="h-5 w-5 text-amber-200" />
              <h2 className="text-xl font-semibold">Public feedback link</h2>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs text-white/35">Feedback URL</p>
              <p className="mt-2 break-all text-sm font-semibold text-white">{feedbackUrl || "—"}</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={copyFeedbackLink} disabled={!feedbackUrl}>
                <Copy className="h-4 w-4" />
                Copy link
              </Button>

              {feedbackUrl && (
                <a href={feedbackUrl} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white/70 hover:bg-white/10">
                  <ExternalLink className="h-4 w-4" />
                  Open feedback
                </a>
              )}
            </div>
          </Card>
        </div>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2 text-white">
            <QrCode className="h-5 w-5 text-amber-200" />
            <h2 className="text-xl font-semibold">Feedback QR</h2>
          </div>

          <div className="rounded-[2rem] bg-white p-6 text-center text-black">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.35rem] bg-[#ffd42a] text-lg font-black">
              {settings?.businessName?.slice(0, 2).toUpperCase() ?? "CA"}
            </div>
            <h3 className="mt-4 text-2xl font-bold">{settings?.businessName ?? businessName}</h3>
            <p className="mt-2 text-sm text-black/55">Scan to share your feedback</p>

            {qrUrl ? (
              <img src={qrUrl} alt="Feedback QR code" className="mx-auto mt-6 h-72 w-72 rounded-2xl" />
            ) : (
              <div className="mx-auto mt-6 flex h-72 w-72 items-center justify-center rounded-2xl bg-black/5 text-sm text-black/50">QR unavailable</div>
            )}

            <p className="mt-5 break-all text-xs text-black/45">{feedbackUrl || "No feedback link"}</p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={copyFeedbackLink} disabled={!feedbackUrl}>
              <Copy className="h-4 w-4" />
              Copy link
            </Button>

            <Button variant="secondary" onClick={() => window.print()} disabled={!feedbackUrl}>
              <Printer className="h-4 w-4" />
              Print QR
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
