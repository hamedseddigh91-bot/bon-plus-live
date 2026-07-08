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
    "mt-[10px] mb-[15px] w-full rounded-[5px] border-2 border-[#38363654] bg-black/20 px-[15px] py-[11px] text-[14px] font-light text-white placeholder:text-[#e5e5e5] outline-none transition-all duration-500 hover:bg-[#434343] focus:bg-[#434343] focus:shadow-[0_2px_2px_#0000002b,0_5px_10px_#00000036]";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      lang="en"
      dir="ltr"
      className="w-[450px] max-w-[calc(100vw-32px)] rounded-[17px] border-[5px] border-[#27a8ff]/35 bg-white/[0.13] p-5 pb-8 text-left text-white shadow-[0_0_14px_rgba(39,168,255,0.85),0_0_34px_rgba(0,119,255,0.72),0_0_72px_rgba(0,92,255,0.42)] backdrop-blur-[5px]"
      style={{ fontFamily: "'Quicksand', 'Trebuchet MS', Arial, sans-serif" }}
    >
      <h1 className="text-center text-[40px] font-semibold leading-[50px] tracking-[1px]">
        Login Here
      </h1>

      <label htmlFor="email" className="mt-[30px] block text-[25px] font-extrabold tracking-[1px]">
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

      <label htmlFor="password" className="mt-[30px] block text-[25px] font-extrabold tracking-[1px]">
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
        className="mt-10 w-full cursor-pointer rounded-[5px] border-2 border-[#38363654] bg-black/20 px-[15px] py-2 text-[18px] font-semibold tracking-[1px] text-[#e1e1e1] transition-all duration-500 hover:bg-[#126fa8]/75 hover:shadow-[0_0_18px_rgba(39,168,255,0.45)] focus:bg-[#126fa8]/75 focus:shadow-[0_0_0_2px_rgba(39,168,255,0.45)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Logging in..." : "Log In"}
      </button>
    </form>
  );
}
