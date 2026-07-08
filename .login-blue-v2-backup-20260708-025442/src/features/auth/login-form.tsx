"use client";

import { useState, useTransition } from "react";
import { signInWithPassword } from "@/app/login/actions";

function FacebookMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
      <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.5 1.6-1.5h1.7V4.9c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3V11H7.3v3h2.8v8h3.4Z" />
    </svg>
  );
}

function TwitterMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
      <path d="M19.7 7.4v.5c0 5-3.8 10.8-10.8 10.8-2.1 0-4.1-.6-5.8-1.7h.9c1.8 0 3.4-.6 4.7-1.6a3.8 3.8 0 0 1-3.5-2.6 4 4 0 0 0 1.7-.1 3.8 3.8 0 0 1-3-3.7c.5.3 1.1.5 1.7.5a3.8 3.8 0 0 1-1.2-5.1 10.8 10.8 0 0 0 7.8 4 4 4 0 0 1-.1-.9 3.8 3.8 0 0 1 6.6-2.6 7.5 7.5 0 0 0 2.4-.9 3.8 3.8 0 0 1-1.7 2.1 7.6 7.6 0 0 0 2.2-.6 8.2 8.2 0 0 1-1.9 1.9Z" />
    </svg>
  );
}

function InstagramMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" className="fill-current stroke-none" />
    </svg>
  );
}

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
      className="min-h-[590px] w-[450px] max-w-[calc(100vw-32px)] rounded-[17px] border-[5px] border-white/10 bg-white/[0.13] p-5 text-left text-white shadow-[0_0_40px_rgba(129,236,174,0.6)] backdrop-blur-[5px]"
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
        className="mb-[15px] mt-10 w-full cursor-pointer rounded-[5px] border-2 border-[#38363654] bg-black/20 px-[15px] py-2 text-[18px] font-semibold tracking-[1px] text-[#e1e1e1] transition-all duration-500 hover:bg-[#629677] focus:bg-[#629677] focus:shadow-[0_0_0_2px_rgba(103,110,103,0.71)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Logging in..." : "Log In"}
      </button>

      <p className="flex items-center justify-center text-center text-[18px] tracking-[1px] text-white">
        Login with a social media account
      </p>

      <div className="mt-0 flex items-center justify-center text-center" aria-hidden="true">
        <span className="mr-[10px] mt-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#38363654] bg-black/20 text-white transition-all duration-500 hover:bg-[#629677] hover:shadow-[0_4px_14px_#0000007a]">
          <FacebookMark />
        </span>
        <span className="mr-[10px] mt-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#38363654] bg-black/20 text-white transition-all duration-500 hover:bg-[#629677] hover:shadow-[0_4px_14px_#0000007a]">
          <TwitterMark />
        </span>
        <span className="mt-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#38363654] bg-black/20 text-white transition-all duration-500 hover:bg-[#629677] hover:shadow-[0_4px_14px_#0000007a]">
          <InstagramMark />
        </span>
      </div>
    </form>
  );
}
