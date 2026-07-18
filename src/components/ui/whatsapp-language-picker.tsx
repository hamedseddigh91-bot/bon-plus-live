"use client";

import { useCallback, useState } from "react";
import { X } from "lucide-react";
import { Card } from "@/components/ui/card";

export type WhatsAppLanguage = "fa" | "ar" | "en";

export function useWhatsAppLanguagePicker() {
  const [resolver, setResolver] = useState<((lang: WhatsAppLanguage | null) => void) | null>(null);

  const pickLanguage = useCallback(() => {
    return new Promise<WhatsAppLanguage | null>((resolve) => {
      setResolver(() => resolve);
    });
  }, []);

  const close = (lang: WhatsAppLanguage | null) => {
    resolver?.(lang);
    setResolver(null);
  };

  const picker = resolver ? (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4" role="dialog" aria-modal="true">
      <Card className="w-full max-w-xs p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-black text-[color:var(--admin-text)]">زبان پیام / Language</h3>
          <button type="button" onClick={() => close(null)} className="text-[color:var(--admin-muted)]">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => close("fa")}
            className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-bold text-[color:var(--admin-text)] transition hover:bg-white/[0.1]"
          >
            فارسی
          </button>
          <button
            type="button"
            onClick={() => close("ar")}
            className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-bold text-[color:var(--admin-text)] transition hover:bg-white/[0.1]"
          >
            العربية
          </button>
          <button
            type="button"
            onClick={() => close("en")}
            className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-bold text-[color:var(--admin-text)] transition hover:bg-white/[0.1]"
          >
            English
          </button>
        </div>
      </Card>
    </div>
  ) : null;

  return { pickLanguage, picker };
}
