"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { signInWithPassword } from "@/app/login/actions";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const result = await signInWithPassword({ email, password });

      if (!result.success) {
        setMessage(result.message);
        return;
      }

      window.location.href = result.redirectTo ?? "/admin";
    });
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-[460px]" noValidate>
      <div className="space-y-7">
        <div className="flex h-14 items-center gap-3 border-b border-white/22 transition-colors duration-300 focus-within:border-sky-400">
          <User size={17} className="shrink-0 text-white/48" />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="User name"
            className="h-full w-full bg-transparent text-[16px] font-medium text-white/90 outline-none placeholder:text-white/48"
          />
        </div>

        <div className="flex h-14 items-center gap-3 border-b border-white/22 transition-colors duration-300 focus-within:border-sky-400">
          <Lock size={17} className="shrink-0 text-white/48" />
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="h-full w-full bg-transparent text-[16px] font-medium text-white/90 outline-none placeholder:text-white/48"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="shrink-0 text-white/48 transition-colors hover:text-sky-300"
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </div>

      {message && (
        <p role="alert" className="mt-5 text-sm font-medium text-red-300/95">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-9 w-full rounded-full border border-sky-400/65 bg-sky-400/12 px-8 py-4 text-[13px] font-bold uppercase tracking-[0.22em] text-sky-100 transition-all duration-300 hover:bg-sky-400/20 hover:shadow-[0_0_30px_rgba(56,189,248,0.45)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "ENTERING..." : "ENTER PLATFORM"}
      </button>

      <div className="mt-5 flex justify-center">
        <button
          type="button"
          className="text-[13px] font-semibold text-white/58 transition-colors hover:text-sky-300"
        >
          Forgot password?
        </button>
      </div>
    </form>
  );
}
