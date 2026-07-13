import { LoginForm } from "@/features/auth/login-form";

export function LoginExperience() {
  return (
    <main
      lang="en"
      dir="ltr"
      className="relative min-h-screen w-full overflow-hidden bg-[#05070f] text-white"
    >
      {/* Keep the existing Bon Plus login background exactly as the page backdrop. */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-70 md:opacity-100"
          style={{ backgroundImage: "url('/assets/login-background.webp')" }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#05070f] via-[#05070f]/85 to-transparent"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#05070f] via-transparent to-[#05070f]/40"
          aria-hidden="true"
        />
        <div
          className="absolute -left-32 top-1/3 h-96 w-96 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(31,107,255,0.35), transparent 70%)" }}
          aria-hidden="true"
        />
        <div
          className="absolute right-10 top-10 h-72 w-72 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(47,168,255,0.28), transparent 70%)" }}
          aria-hidden="true"
        />
      </div>

      <div className="relative z-10 flex min-h-screen w-full items-center justify-center px-4 py-8 md:justify-start md:pl-[7vw] md:pr-8 xl:pl-[8vw]">
        <LoginForm />
      </div>
    </main>
  );
}
