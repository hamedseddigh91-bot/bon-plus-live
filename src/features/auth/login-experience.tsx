"use client"

import Link from "next/link"
import { Coffee } from "lucide-react"
import { LoginForm } from "@/features/auth/login-form"

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/#features" },
  { label: "About", href: "/#about" },
  { label: "Sign In", href: "/login" },
]

export function LoginExperience() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#05070f] text-white">
      {/* Background cinematic coffee visual */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-70 md:opacity-100"
          style={{ backgroundImage: "url('/assets/login-background.png')" }}
          aria-hidden="true"
        />
        {/* Dark espresso / navy gradient overlay to keep the left readable */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#05070f] via-[#05070f]/85 to-transparent"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#05070f] via-transparent to-[#05070f]/40"
          aria-hidden="true"
        />
        {/* Electric blue neon glow accents */}
        <div className="absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-[#1f6bff]/25 blur-[120px]" aria-hidden="true" />
        <div className="absolute right-10 top-10 h-72 w-72 rounded-full bg-[#2fa8ff]/20 blur-[120px]" aria-hidden="true" />
      </div>

      {/* Top navigation */}
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 md:px-10">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#2fa8ff]/40 bg-[#0b1020] text-[#5db4ff] shadow-[0_0_20px_-4px_rgba(47,168,255,0.7)]">
            <Coffee className="h-5 w-5" />
          </span>
          <span className="text-sm font-semibold tracking-[0.18em] text-white/90">
            CAFE RETENTION
          </span>
        </Link>

        <nav className="hidden items-center md:flex" style={{ columnGap: "34px" }}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-white/60 transition-colors hover:text-[#5db4ff]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      {/* Hero + form layout */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col px-6 pb-16 pt-6 md:px-10 lg:min-h-[calc(100vh-104px)] lg:flex-row lg:items-center">
        <section className="flex w-full max-w-xl flex-col">
          <span className="text-xs font-medium uppercase tracking-[0.4em] text-[#5db4ff]">
            Coffee Operations Platform
          </span>

          <h1 className="mt-6 font-sans text-5xl font-semibold leading-[0.95] tracking-tight text-balance sm:text-6xl lg:text-7xl">
            <span className="block">CAFE</span>
            <span className="block">RETENTION</span>
            <span className="mt-1 block bg-gradient-to-r from-[#5db4ff] to-[#2fa8ff] bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(47,168,255,0.35)]">
              LOGIN
            </span>
          </h1>

          <p className="mt-8 max-w-md text-base leading-8 text-white/60 text-pretty">
            Manage feedback, recovery, finance, and daily operations in one
            place.
          </p>

          <div className="mt-12 w-full max-w-[480px]">
            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  )
}
