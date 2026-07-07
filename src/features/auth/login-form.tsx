"use client";

import { useState, useTransition } from "react";
import { signInWithPassword } from "@/app/login/actions";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  const controlClass =
    "mt-[10px] mb-[15px] w-full rounded-[5px] border border-white/15 bg-black/15 px-[15px] py-[11px] text-[14px] font-light text-white placeholder:text-[#e5e5e5] outline-none transition-all duration-500 hover:bg-white/[0.11] focus:bg-white/[0.14] focus:shadow-[0_2px_2px_#0000002b,0_5px_10px_#00000036]";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      lang="en"
      dir="ltr"
      className="w-[450px] max-w-[calc(100vw-32px)] rounded-[17px] border border-white/20 bg-white/[0.055] p-5 pb-8 text-left text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.20),inset_0_-1px_0_rgba(255,255,255,0.06),0_0_16px_rgba(39,168,255,0.88),0_0_38px_rgba(0,119,255,0.68),0_0_76px_rgba(0,92,255,0.38)] backdrop-blur-[18px] backdrop-saturate-[1.35]"
      style={{ fontFamily: "'Quicksand', 'Trebuchet MS', Arial, sans-serif" }}
    >
      <h1 className="text-center text-[28px] font-semibold leading-[36px] tracking-[0.7px]">
        Bon Plus Business Console
      </h1>

      <label htmlFor="email" className="mt-[30px] block text-[19px] font-bold tracking-[0.6px]">
        Username
      </label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className={controlClass}
      />

      <label htmlFor="password" className="mt-[30px] block text-[19px] font-bold tracking-[0.6px]">
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className={controlClass}
      />

      {message ? (
        <p role="alert" className="-mt-1 text-center text-[13px] font-semibold tracking-[0.4px] text-red-200">
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="mt-10 w-full cursor-pointer rounded-[5px] border border-white/15 bg-black/15 px-[15px] py-2 text-[16px] font-semibold tracking-[0.7px] text-[#e1e1e1] transition-all duration-500 hover:bg-[#126fa8]/75 hover:shadow-[0_0_18px_rgba(39,168,255,0.45)] focus:bg-[#126fa8]/75 focus:shadow-[0_0_0_2px_rgba(39,168,255,0.45)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Logging in..." : "Log In"}
      </button>
    </form>
  );
}

