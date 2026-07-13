"use client";

import { LoginForm } from "@/features/auth/login-form";

type LoginOverlayPageProps = {
  error?: string;
  message?: string;
};

function LoginNotice({ value }: { value: string | null }) {
  if (!value) {
    return null;
  }

  return (
    <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-100">
      {value}
    </div>
  );
}

export function LoginOverlayPage({ error, message }: LoginOverlayPageProps) {
  const notice = error ?? message ?? null;

  return (
    <main className="min-h-screen bg-[#02060c] text-white">
      <div className="hidden lg:block">
        <div className="relative h-screen min-h-[760px] w-full overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/assets/login-neon-background.png')" }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,12,0.08)_0%,rgba(2,6,12,0.04)_36%,rgba(2,6,12,0)_70%)]" />

          <div className="absolute left-[5.15%] top-[58.9%] w-[29.6%] min-w-[360px] max-w-[495px]">
            <LoginNotice value={notice} />
            <LoginForm />
          </div>
        </div>
      </div>

      <div className="lg:hidden">
        <div className="relative min-h-screen overflow-hidden bg-[#02060c]">
          <div
            className="absolute inset-x-0 top-0 h-[42vh] bg-cover bg-center bg-no-repeat opacity-90"
            style={{ backgroundImage: "url('/assets/login-neon-background.png')" }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,12,0.15)_0%,rgba(2,6,12,0.66)_36%,rgba(2,6,12,0.96)_55%,#02060c_100%)]" />

          <div className="relative z-10 flex min-h-screen items-end px-5 pb-8 pt-12">
            <div className="w-full rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#62c0ff]">
                  Cafe Retention
                </p>
                <h1 className="mt-3 text-4xl font-black uppercase leading-[0.95] tracking-[-0.05em] text-white">
                  Login
                </h1>
                <p className="mt-3 text-sm leading-7 text-white/64">
                  Manage feedback, recovery, finance, and daily operations in one place.
                </p>
              </div>

              <LoginNotice value={notice} />
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
